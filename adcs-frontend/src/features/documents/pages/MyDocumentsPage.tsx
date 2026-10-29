import DocumentIntegrationState from '../../integration/DocumentIntegrationState';
import ProcessingErrorPanel from '../ProcessingErrorPanel';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { usePermission } from '../../../hooks/usePermission';
import { getApiError } from '../../../api/errors';
import {
  getMyDocuments,
  retryDocument,
  cancelDocument,
  deleteDocument,
  uploadDocument,
  type MyDocumentItem,
} from '../../../api/document';

const formatFileSize = (bytes?: number | null) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

interface UploadingFile {
  id: string;
  file: File;
  status: 'uploading' | 'success' | 'error';
  errorMessage?: string;
}

const MyDocumentsPage: React.FC = () => {
  const { hasPermission } = usePermission();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Danh sách tài liệu
  const [documents, setDocuments] = useState<MyDocumentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Kéo thả & Upload nhiều file
  const [isDragging, setIsDragging] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Modal xác nhận xóa
  const [deleteTarget, setDeleteTarget] = useState<MyDocumentItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modal xem lỗi
  const [errorDetailTarget, setErrorDetailTarget] = useState<MyDocumentItem | null>(null);

  // Tải danh sách tài liệu
  const fetchMyDocuments = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    try {
      const res = await getMyDocuments({
        page,
        page_size: pageSize,
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchQuery || undefined,
      });
      setDocuments(res.items || []);
      setTotal(res.total || 0);
      setTotalPages(res.total_pages || 1);
    } catch (error: any) {
      if (!isSilent) {
        toast.error('Không thể tải danh sách văn bản của bạn.');
      }
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, [page, pageSize, statusFilter, searchQuery]);

  useEffect(() => {
    fetchMyDocuments();
  }, [fetchMyDocuments]);

  // Polling tự động nếu có tài liệu đang queued hoặc processing
  useEffect(() => {
    const hasPending = documents.some(
      (d: MyDocumentItem) => d.status === 'queued' || d.status === 'processing' || d.status === 'pending'
    );
    if (!hasPending) return;

    const interval = setInterval(() => {
      fetchMyDocuments(true);
    }, 4000);

    return () => clearInterval(interval);
  }, [documents, fetchMyDocuments]);

  // Tìm kiếm với Enter
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearchQuery(searchInput.trim());
  };

  // Upload tệp tin tuần tự
  const processUploadQueue = async (files: File[]) => {
    if (!files.length) return;
    setIsUploading(true);

    const newQueue: UploadingFile[] = files.map((f) => ({
      id: `${f.name}-${Date.now()}-${Math.random()}`,
      file: f,
      status: 'uploading',
    }));
    setUploadQueue(newQueue);

    let successCount = 0;
    for (let i = 0; i < newQueue.length; i++) {
      const item = newQueue[i];
      try {
        await uploadDocument(item.file, true);
        setUploadQueue((prev: UploadingFile[]) =>
          prev.map((q: UploadingFile, idx: number) => (idx === i ? { ...q, status: 'success' } : q))
        );
        successCount++;
      } catch (err: any) {
        const msg = getApiError(err, 'Không thể tải tệp lên');
        setUploadQueue((prev: UploadingFile[]) =>
          prev.map((q: UploadingFile, idx: number) =>
            idx === i ? { ...q, status: 'error', errorMessage: msg } : q
          )
        );
      }
    }

    setIsUploading(false);
    if (successCount > 0) {
      toast.success(`Đã thêm ${successCount} văn bản vào hàng đợi xử lý!`);
      fetchMyDocuments();
    }
  };

  const handleFilesSelected = (fileList: FileList | null) => {
    if (!hasPermission("file.create")) { toast.error("Bạn không có quyền tải văn bản lên"); return; }
    if (!fileList || fileList.length === 0) return;
    const filesArray = Array.from(fileList);
    processUploadQueue(filesArray);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  // Thử lại văn bản lỗi / đã hủy / cần kiểm tra
  const handleRetry = async (doc: MyDocumentItem) => {
    const toastId = toast.loading(`Đang đưa "${doc.original_filename}" vào lại hàng đợi...`);
    try {
      await retryDocument(doc.document_id);
      toast.success('Đã đưa văn bản vào hàng đợi xử lý lại!', { id: toastId });
      fetchMyDocuments(true);
    } catch (err: any) {
      toast.error(`Thất bại: ${getApiError(err, 'Không thể thực hiện lại')}`, { id: toastId });
    }
  };

  // Hủy văn bản đang chờ
  const handleCancel = async (doc: MyDocumentItem) => {
    const toastId = toast.loading(`Đang hủy văn bản "${doc.original_filename}"...`);
    try {
      await cancelDocument(doc.document_id);
      toast.success('Đã hủy văn bản khỏi hàng đợi!', { id: toastId });
      fetchMyDocuments(true);
    } catch (err: any) {
      toast.error(`Thất bại: ${getApiError(err, 'Không thể hủy')}`, { id: toastId });
    }
  };

  // Xóa văn bản
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const toastId = toast.loading('Đang xóa văn bản...');
    try {
      await deleteDocument(deleteTarget.document_id);
      toast.success('Đã xóa văn bản thành công!', { id: toastId });
      setDeleteTarget(null);
      fetchMyDocuments();
    } catch (err: any) {
      toast.error(`Xóa thất bại: ${getApiError(err, 'Không thể xóa văn bản')}`, { id: toastId });
    } finally {
      setIsDeleting(false);
    }
  };

  // Xem chi tiết văn bản
  const handleViewDetail = (doc: MyDocumentItem) => {
    sessionStorage.setItem('lastActiveDocumentId', doc.document_id);
    navigate(`/documents?id=${doc.document_id}`);
  };

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 font-display">
      <div className="max-w-7xl mx-auto space-y-5">
        
        {/* Header trang */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              <span className="material-symbols-outlined text-primary text-2xl sm:text-3xl">folder_shared</span>
              Văn bản của tôi
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
              Theo dõi danh sách văn bản bạn đã gửi, vị trí hàng đợi và tiến trình trích xuất AI.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => fetchMyDocuments()}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors shadow-sm cursor-pointer"
              title="Làm mới danh sách"
            >
              <span className={`material-symbols-outlined text-[18px] ${isLoading ? 'animate-spin text-primary' : ''}`}>
                refresh
              </span>
              Làm mới
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-md shadow-primary/20 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">upload_file</span>
              Tải lên tệp mới
            </button>
          </div>
        </div>

        {/* Khung kéo thả Upload nhiều tệp - Thiết kế gọn gàng, chuyên nghiệp */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
          className="hidden"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilesSelected(e.target.files)}
        />

        <div
          onDragOver={(e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`group border-2 border-dashed rounded-2xl p-4 sm:p-5 cursor-pointer transition-all ${
            isDragging
              ? 'border-primary bg-primary/10 scale-[1.005]'
              : 'border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-primary/60 hover:bg-primary/5'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-3.5 text-center sm:text-left">
              <div className="size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-2xl">cloud_upload</span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                  Kéo và thả nhiều tệp vào đây, hoặc nhấn để chọn tệp từ máy tính
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Hỗ trợ PDF, DOCX, PNG, JPG (Tối đa 50MB/tệp). Tự động xếp hàng và xử lý OCR ngầm.
                </p>
              </div>
            </div>
            <span className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-primary group-hover:text-white text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors shrink-0">
              Chọn nhiều tệp
            </span>
          </div>
        </div>

        {/* Tiến trình Upload nếu đang có file tải lên */}
        {uploadQueue.length > 0 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">cloud_sync</span>
                Tiến trình tải tệp ({uploadQueue.filter((q) => q.status === 'success').length}/{uploadQueue.length})
              </span>
              {!isUploading && (
                <button
                  onClick={() => setUploadQueue([])}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold"
                >
                  Đóng
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {uploadQueue.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs border border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="material-symbols-outlined text-slate-400 text-base">description</span>
                    <span className="truncate font-semibold text-slate-700 dark:text-slate-300" title={item.file.name}>
                      {item.file.name}
                    </span>
                    <span className="text-slate-400 shrink-0">({formatFileSize(item.file.size)})</span>
                  </div>
                  <div className="shrink-0 ml-2">
                    {item.status === 'uploading' && (
                      <span className="text-primary flex items-center gap-1 font-semibold">
                        <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                        Đang đẩy...
                      </span>
                    )}
                    {item.status === 'success' && (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        Đã xếp hàng
                      </span>
                    )}
                    {item.status === 'error' && (
                      <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1 font-semibold" title={item.errorMessage}>
                        <span className="material-symbols-outlined text-sm">error</span>
                        Lỗi
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Thanh Tabs lọc trạng thái và Tìm kiếm */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl shadow-sm">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 no-scrollbar">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'queued', label: 'Chờ xử lý' },
              { id: 'processing', label: 'Đang phân tích' },
              { id: 'processed', label: 'Hoàn tất' },
              { id: 'needs_review', label: 'Cần kiểm tra' },
              { id: 'failed', label: 'Thất bại' },
              { id: 'cancelled', label: 'Đã hủy' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setStatusFilter(tab.id);
                  setPage(1);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Ô tìm kiếm */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative flex-1 lg:w-72">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                search
              </span>
              <input
                type="text"
                placeholder="Tìm tên tệp, số hiệu, trích yếu..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-slate-900 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Tìm
            </button>
          </form>
        </div>

        {/* Bảng danh sách văn bản */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs min-w-[760px]">
              <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Tệp văn bản</th>
                  <th className="py-3.5 px-4">Trích xuất nhanh</th>
                  <th className="py-3.5 px-4">Thời gian</th>
                  <th className="py-3.5 px-4">Trạng thái xử lý</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {isLoading && documents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-14 text-center text-slate-400">
                      <span className="material-symbols-outlined text-3xl animate-spin mb-2 block text-primary">sync</span>
                      Đang tải danh sách văn bản...
                    </td>
                  </tr>
                ) : documents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-14 text-center text-slate-400">
                      <span className="material-symbols-outlined text-4xl mb-2 opacity-50 block">inbox</span>
                      Không có văn bản nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  documents.map((doc) => {
                    const isQueued = doc.status === 'queued';
                    const isProcessing = doc.status === 'processing' || doc.status === 'pending';
                    const isCompleted = doc.status === 'processed' || doc.status === 'success' || doc.status === 'approved';
                    const isNeedsReview = doc.status === 'needs_review';
                    const isFailed = doc.status === 'failed' || doc.status === 'error';
                    const isCancelled = doc.status === 'cancelled';
                    const isRetryScheduled = isQueued && doc.next_attempt_at && new Date(doc.next_attempt_at).getTime() > Date.now();

                    return (
                      <tr
                        key={doc.document_id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* Cột 1: Tệp */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                              <span className="material-symbols-outlined text-[20px]">description</span>
                            </div>
                            <div className="min-w-0">
                              <p
                                onClick={() => handleViewDetail(doc)}
                                className="font-bold text-slate-900 dark:text-white truncate max-w-xs hover:text-primary cursor-pointer transition-colors"
                                title={doc.original_filename}
                              >
                                {doc.original_filename}
                              </p>
                              <div className="flex items-center gap-2 text-slate-400 text-[11px] mt-0.5">
                                <span>{formatFileSize(doc.file_size_bytes)}</span>
                                {doc.page_count && <span>• {doc.page_count} trang</span>}
                                <span className="font-mono">• ID: {doc.document_id.slice(0, 8)}</span>
                                <DocumentIntegrationState document={doc} />
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Cột 2: Trích xuất nhanh */}
                        <td className="py-3.5 px-4 max-w-xs">
                          {doc.so_ky_hieu || doc.trich_yeu || doc.don_vi_ban_hanh ? (
                            <div className="space-y-0.5">
                              {doc.so_ky_hieu && (
                                <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                                  Số: {doc.so_ky_hieu}
                                </p>
                              )}
                              {doc.don_vi_ban_hanh && (
                                <p className="text-slate-500 dark:text-slate-400 truncate text-[11px]">{doc.don_vi_ban_hanh}</p>
                              )}
                              {doc.trich_yeu && (
                                <p className="text-slate-600 dark:text-slate-400 line-clamp-1 italic text-[11px]">
                                  {doc.trich_yeu}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Chưa trích xuất</span>
                          )}
                        </td>

                        {/* Cột 3: Thời gian */}
                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {formatDate(doc.created_at)}
                        </td>

                        {/* Cột 4: Trạng thái */}
                        <td className="py-3.5 px-4">
                          {isQueued && (
                            <div className="space-y-1">
                              {isRetryScheduled ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60" title={`Hẹn chạy lại: ${formatDate(doc.next_attempt_at)}`}>
                                  <span className="material-symbols-outlined text-[13px] animate-pulse">schedule</span>
                                  Chờ thử lại ({new Date(doc.next_attempt_at!).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })})
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                                  <span className="material-symbols-outlined text-[13px] animate-pulse">hourglass_top</span>
                                  Chờ trong hàng đợi
                                </span>
                              )}
                              {doc.queue_position && (
                                <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                                  Vị trí #{doc.queue_position} trong hàng đợi
                                </p>
                              )}
                            </div>
                          )}

                          {isProcessing && (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 animate-pulse">
                                <span className="material-symbols-outlined text-[13px] animate-spin">sync</span>
                                Đang AI phân tích...
                              </span>
                              <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">OCR & Semantic Chunking</p>
                            </div>
                          )}

                          {isCompleted && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                              <span className="material-symbols-outlined text-[13px]">check_circle</span>
                              Đã xử lý xong
                            </span>
                          )}

                          {isNeedsReview && (
                            <div className="space-y-1">
                              <button
                                onClick={() => setErrorDetailTarget(doc)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 hover:bg-amber-200 transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[13px]">warning</span>
                                Cần kiểm tra (Xem)
                              </button>
                            </div>
                          )}

                          {isFailed && (
                            <div className="space-y-1">
                              <button
                                onClick={() => setErrorDetailTarget(doc)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[13px]">error</span>
                                Lỗi xử lý (Xem)
                              </button>
                            </div>
                          )}

                          {isCancelled && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                              <span className="material-symbols-outlined text-[13px]">block</span>
                              Đã hủy
                            </span>
                          )}
                        </td>

                        {/* Cột 5: Nút thao tác */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Nút Xem */}
                            <button
                              onClick={() => handleViewDetail(doc)}
                              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                              title="Xem chi tiết kết quả"
                            >
                              <span className="material-symbols-outlined text-[18px]">visibility</span>
                            </button>

                            {/* Nút Thử lại (khi failed, cancelled, hoặc needs_review) */}
                            {(isFailed || isCancelled || isNeedsReview) && (
                              <button
                                onClick={() => handleRetry(doc)}
                                className="p-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-100/70 dark:hover:bg-amber-900/30 rounded-lg transition-colors cursor-pointer"
                                title="Thử lại xử lý"
                              >
                                <span className="material-symbols-outlined text-[18px]">replay</span>
                              </button>
                            )}

                            {/* Nút Hủy (chỉ khi queued) */}
                            {isQueued && (
                              <button
                                onClick={() => handleCancel(doc)}
                                className="p-1.5 text-rose-500 hover:bg-rose-100/70 dark:hover:bg-rose-900/30 rounded-lg transition-colors cursor-pointer"
                                title="Hủy hàng đợi"
                              >
                                <span className="material-symbols-outlined text-[18px]">cancel</span>
                              </button>
                            )}

                            {/* Nút Xóa */}
                            <button
                              onClick={() => setDeleteTarget(doc)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors cursor-pointer"
                              title="Xóa văn bản"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-slate-200 dark:border-slate-800 text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                Hiển thị trang <strong className="text-slate-900 dark:text-white">{page}</strong> / {totalPages} (Tổng cộng {total} văn bản)
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed font-semibold transition-colors"
                >
                  Trước
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed font-semibold transition-colors"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Xác nhận Xóa */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3 text-rose-600 mb-3">
                <span className="material-symbols-outlined text-3xl">warning</span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Xác nhận xóa văn bản</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
                Bạn có chắc chắn muốn xóa văn bản <strong>"{deleteTarget.original_filename}"</strong>? Hành động này sẽ loại bỏ tệp và kết quả phân tích AI liên quan.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  disabled={isDeleting}
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-md transition-all flex items-center gap-1.5"
                >
                  {isDeleting ? 'Đang xóa...' : 'Xóa văn bản'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Xem chi tiết lỗi */}
        {errorDetailTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-rose-600">
                  <span className="material-symbols-outlined text-2xl">error</span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Chi tiết lỗi xử lý AI</h3>
                </div>
                <button
                  onClick={() => setErrorDetailTarget(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="text-xs text-slate-500 mb-4 truncate">
                Tệp: <strong className="text-slate-800 dark:text-slate-200">{errorDetailTarget.original_filename}</strong>
              </div>

              <ProcessingErrorPanel
                documentId={errorDetailTarget.document_id}
                error={errorDetailTarget.error_details}
                errorMessage={errorDetailTarget.error_message}
              />

              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setErrorDetailTarget(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  onClick={() => {
                    const doc = errorDetailTarget;
                    setErrorDetailTarget(null);
                    handleRetry(doc);
                  }}
                  className="px-4 py-2 text-xs font-bold bg-primary hover:bg-primary/90 text-white rounded-lg flex items-center gap-1.5 shadow-md shadow-primary/20 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">replay</span>
                  Thử lại ngay
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default MyDocumentsPage;
