import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import axiosClient from '../../api/axiosClient';
import { 
  uploadTranslationFiles, 
  getTranslations, 
  updateTranslationComment,
  deleteTranslation,
  downloadAllTranslationsZip,
  type TranslationFile 
} from '../../api/translation';

const TranslationPage: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<TranslationFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchFiles = async () => {
    if (!userId) return; 
    try {
      const data = await getTranslations();
      setFiles(data);
    } catch (error) {
      console.error("Lỗi tải danh sách dịch:", error);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && parsedUser.id) {
          setUserId(parsedUser.id);
        }
      } catch (error) {
        console.error('Lỗi khi đọc thông tin người dùng:', error);
      }
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [userId]);

  useEffect(() => {
    const hasActiveTasks = files.some(f => f.status === 'pending' || f.status === 'translating');
    let interval: ReturnType<typeof setInterval>;

    if (hasActiveTasks) {
      interval = setInterval(() => {
        fetchFiles();
      }, 3000);
    }

    return () => clearInterval(interval);
  }, [files]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processSelectedFiles(Array.from(e.target.files));
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processSelectedFiles = async (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;
    
    setIsUploading(true);
    const toastId = toast.loading("Đang tải tệp lên...");

    try {
      const response = await uploadTranslationFiles(selectedFiles);
      
      if (response.duplicate_count > 0) {
        toast(`Phát hiện ${response.duplicate_count} tài liệu trùng lặp đã được loại bỏ.`, { icon: '⚠️', duration: 5000 });
      }

      toast.success("Đã đẩy tệp vào hàng đợi dịch!", { id: toastId });

      fetchFiles();
    } catch (error) {
      toast.error("Lỗi khi tải tệp lên. Vui lòng thử lại.", { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCommentChange = (id: string, value: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, comment: value } : f))
    );
  };

  const handleSaveComment = async (id: string, fileName: string, comment: string) => {
    if (!comment.trim()) return;

    try {
      await updateTranslationComment(id, comment);
      toast.success(`Đã lưu nhận xét cho tệp ${fileName}`);
    } catch (error) {
      toast.error("Không thể lưu nhận xét");
    }
  };

  const handleDownloadFile = async (id: string, originalFileName: string) => {
    const toastId = toast.loading("Đang chuẩn bị file tải về...");
    try {
      const response: any = await axiosClient.get(`/translations/${id}/download`, { 
        responseType: 'blob' 
      });

      const url = window.URL.createObjectURL(new Blob([response]));
      
      const link = document.createElement('a');
      link.href = url;

      const safeName = originalFileName.includes('.') 
        ? originalFileName.substring(0, originalFileName.lastIndexOf('.'))
        : originalFileName;
        
      link.setAttribute('download', `Translated_${safeName}.docx`);

      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Tải xuống thành công!", { id: toastId });
    } catch (error) {
      console.error("Lỗi tải file:", error);
      toast.error("Không thể tải file lúc này. Vui lòng thử lại.", { id: toastId });
    }
  };

  const handleDownloadAllZip = async () => {
    const toastId = toast.loading("Đang nén toàn bộ tài liệu thành file ZIP...");
    try {
      const response: any = await downloadAllTranslationsZip();

      const url = window.URL.createObjectURL(new Blob([response], { type: 'application/zip' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Tat_ca_ban_dich_PTIT.zip`);
      
      document.body.appendChild(link);
      link.click();
      
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Tải file ZIP thành công!", { id: toastId });
    } catch (error) {
      console.error("Lỗi tải file ZIP:", error);
      toast.error("Không thể tải file lúc này. Vui lòng thử lại.", { id: toastId });
    }
  };

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; filename: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteTranslation(deleteTarget.id);
      toast.success(`Đã xóa tệp ${deleteTarget.filename}`);
      setFiles(files.filter(f => f.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      toast.error("Không thể xóa tệp lúc này");
    } finally {
      setIsDeleting(false);
    }
  };

  const [sourceLang, setSourceLang] = useState<string>('vi');
  const [targetLang, setTargetLang] = useState<string>('en');

  const LANGUAGES = [
    { code: 'vi', label: 'Tiếng Việt' },
    { code: 'en', label: 'Tiếng Anh (US)' },
    { code: 'zh', label: 'Tiếng Trung' },
    { code: 'fr', label: 'Tiếng Pháp' },
    { code: 'ru', label: 'Tiếng Nga' },
  ];

  const handleSwapLanguages = () => {
    if (sourceLang === 'auto') return;
    const temp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(temp);
  };

  const getIconForType = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return <span className="material-symbols-outlined text-rose-600 dark:text-rose-400">picture_as_pdf</span>;
      case 'docx':
      case 'doc':
        return <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">description</span>;
      case 'png':
      case 'jpg':
      case 'jpeg':
        return <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400">image</span>;
      default:
        return <span className="material-symbols-outlined text-slate-500">draft</span>;
    }
  };

  const completedCount = files.filter(f => f.status === 'success').length;
  const activeCount = files.filter(f => f.status === 'pending' || f.status === 'translating').length;

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 font-display text-slate-900 dark:text-slate-100">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Header & KPI Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              <span className="material-symbols-outlined text-primary text-2xl sm:text-3xl">translate</span>
              Dịch thuật văn bản AI
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Dịch thuật tài liệu đa ngôn ngữ giữ nguyên định dạng văn bản hành chính.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2 text-xs font-semibold shadow-sm">
              <span className="text-slate-500 dark:text-slate-400">Tổng số:</span>
              <span className="font-bold text-slate-900 dark:text-white">{files.length}</span>
            </div>
            {activeCount > 0 && (
              <div className="px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-300">
                <span className="size-2 rounded-full bg-amber-500 animate-ping" />
                Đang dịch: {activeCount}
              </div>
            )}
            <div className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
              <span className="material-symbols-outlined text-[15px]">check_circle</span>
              Hoàn tất: {completedCount}
            </div>
          </div>
        </div>

        {/* Khối Cấu hình Ngôn ngữ & Tải tệp tích hợp */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 sm:p-6 space-y-5">
          {/* Thanh chọn cặp ngôn ngữ */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {/* Ngôn ngữ nguồn */}
              <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase text-slate-400">Từ:</span>
                <select 
                  value={sourceLang} 
                  onChange={(e) => setSourceLang(e.target.value)}
                  className="bg-transparent border-none text-xs sm:text-sm font-bold text-primary focus:ring-0 p-0 outline-none cursor-pointer"
                >
                  <option value="auto" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Tự động nhận diện</option>
                  {LANGUAGES.map(l => (
                    <option key={l.code} value={l.code} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{l.label}</option>
                  ))}
                </select>
              </div>

              {/* Nút hoán đổi */}
              <button 
                type="button"
                onClick={handleSwapLanguages}
                disabled={sourceLang === 'auto'}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed outline-none cursor-pointer"
                title="Hoán đổi ngôn ngữ"
              >
                <span className="material-symbols-outlined text-lg block">swap_horiz</span>
              </button>

              {/* Ngôn ngữ đích */}
              <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase text-slate-400">Sang:</span>
                <select 
                  value={targetLang} 
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="bg-transparent border-none text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:ring-0 p-0 outline-none cursor-pointer"
                >
                  {LANGUAGES.map(l => (
                    <option key={l.code} value={l.code} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{l.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-primary">verified</span>
              Bản dịch xuất ra định dạng chuẩn Word (.docx)
            </p>
          </div>

          {/* Vùng Kéo Thả Tệp Gọn Gàng */}
          <input 
            type="file" 
            multiple 
            ref={fileInputRef} 
            className="hidden" 
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
            onChange={handleFileSelect}
          />
          <div 
            onClick={() => !isUploading && fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files && !isUploading) processSelectedFiles(Array.from(e.dataTransfer.files));
            }}
            className={`w-full p-6 sm:p-8 border-2 border-dashed rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 group transition-all ${
              isUploading ? 'opacity-50 cursor-not-allowed border-slate-200 dark:border-slate-800' : 'cursor-pointer'
            } ${
              isDragging
                ? 'border-primary bg-primary/10 scale-[1.005]'
                : 'border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 hover:border-primary/60 hover:bg-primary/5'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-2xl">cloud_upload</span>
              </div>
              <div>
                <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Kéo thả một hoặc nhiều tài liệu cần dịch vào đây
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Hỗ trợ tệp PDF, Word (.doc, .docx), Hình ảnh (.png, .jpg) — Tự động loại bỏ tệp trùng lặp
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={isUploading}
              className="px-4 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-md shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50 shrink-0 cursor-pointer"
            >
              {isUploading ? "Đang tải lên..." : "Chọn tệp từ máy tính"}
            </button>
          </div>
        </section>

        {/* Bảng Danh sách xử lý dịch thuật */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">list_alt</span>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Danh sách tài liệu dịch thuật ({files.length})
              </h2>
            </div>
            <button 
              onClick={handleDownloadAllZip}
              disabled={files.length === 0 || !files.some(f => f.status === 'success')}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary/10 text-primary rounded-xl text-xs font-bold hover:bg-primary/20 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed outline-none cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">folder_zip</span>
              Tải tất cả (.zip)
            </button>
          </div>
          
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[680px]">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-5 py-3.5 text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Tên tệp</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Trạng thái</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider w-2/5">Ghi chú / Nhận xét</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {files.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-14 text-center text-slate-400">
                      <span className="material-symbols-outlined text-4xl opacity-40 block mb-2">translate</span>
                      <p className="text-sm font-medium">Chưa có tệp nào trong danh sách dịch thuật.</p>
                    </td>
                  </tr>
                ) : (
                  files.map((file) => (
                    <tr key={file.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                            {getIconForType(file.file_type)}
                          </div>
                          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate max-w-xs" title={file.filename}>
                            {file.filename}
                          </span>
                        </div>
                      </td>
                      
                      <td className="px-5 py-4">
                        {file.status === 'success' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-[11px] font-bold rounded-full">
                            <span className="material-symbols-outlined text-[13px]">check_circle</span>
                            Hoàn tất
                          </span>
                        )}
                        {file.status === 'failed' && (
                          <div className="flex flex-col gap-1 items-start">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 text-[11px] font-bold rounded-full">
                              <span className="material-symbols-outlined text-[13px]">error</span>
                              Lỗi xử lý
                            </span>
                            {file.error_message && (
                              <span 
                                className="text-[11px] text-rose-500 dark:text-rose-400 font-medium max-w-[220px] truncate cursor-help"
                                title={file.error_message}
                              >
                                {file.error_message}
                              </span>
                            )}
                          </div>
                        )}
                        {file.status === 'translating' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 text-[11px] font-bold rounded-full">
                            <span className="size-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                            Đang dịch...
                          </span>
                        )}
                        {file.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-bold rounded-full">
                            <span className="material-symbols-outlined text-[13px]">schedule</span>
                            Chờ xử lý
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <input 
                          type="text"
                          value={file.comment || ''}
                          onChange={(e) => handleCommentChange(file.id, e.target.value)}
                          onBlur={() => handleSaveComment(file.id, file.filename, file.comment)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.currentTarget.blur();
                            }
                          }}
                          placeholder="Thêm ghi chú và nhấn Enter để lưu..." 
                          className="bg-slate-50/70 dark:bg-slate-800/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-primary focus:bg-white dark:focus:bg-slate-800 px-3 py-1.5 rounded-lg text-xs text-slate-700 dark:text-slate-200 w-full placeholder:italic transition-all outline-none"
                        />
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {file.status === 'success' && file.result_file_url && (
                            <button 
                              onClick={() => handleDownloadFile(file.id, file.filename)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white text-xs font-bold transition-colors cursor-pointer outline-none"
                            >
                              <span className="material-symbols-outlined text-[15px]">download</span>
                              Tải .docx
                            </button>
                          )}
                          
                          <button 
                            onClick={() => setDeleteTarget({ id: file.id, filename: file.filename })}
                            className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/30 text-slate-400 hover:text-rose-600 rounded-lg transition-colors outline-none cursor-pointer"
                            title="Xóa tệp"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Modal xác nhận xóa tệp dịch */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 animate-scale-up">
              <div className="flex items-center gap-3 text-rose-600 mb-3">
                <div className="size-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-2xl">delete_forever</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Xác nhận xóa bản dịch</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                Bạn có chắc chắn muốn xóa bản dịch của tệp <strong>"{deleteTarget.filename}"</strong> không?
              </p>
              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-all cursor-pointer"
                >
                  {isDeleting ? "Đang xóa..." : "Xóa bản dịch"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TranslationPage;