import React, { useEffect, useMemo, useRef, useState } from "react";
import toast from 'react-hot-toast';
import {
  getDocument,
  uploadDocument,
  approveAIResult,
  type DocumentResponse,
} from "../../../api/document";
import { DocumentPreview } from "../components/DocumentPreview";

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("vi-VN");
};

const DocumentPage: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [documentDetail, setDocumentDetail] = useState<DocumentResponse | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<DocumentResponse>>({});

  const loadDocument = async (documentId: string) => {
    setLoading(true);
    setError("");
    try {
      const doc = await Promise.resolve(getDocument(documentId));
      setDocumentDetail(doc);
      setActiveDocumentId(documentId);
    } catch (e: any) {
      setError(e?.message || "Không thể tải dữ liệu tài liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    setFileType(extension);

    setPendingFile(file);
    setShowSaveModal(true);

    e.target.value = "";
  };

  const handleConfirmUpload = async (is_save_file: boolean) => {
  if (!pendingFile) return;

  setShowSaveModal(false);
  setUploading(true);
  setError("");

  const isImage = ['pdf', 'png', 'jpg', 'jpeg'].includes(fileType || '');
    if (isImage) {
      toast("Thời gian xử lý AI có thể hơi lâu do vấn đề về kích thước file...", { icon: "⏳", duration: 5000 });
    }
  
  const toastId = toast.loading("Đang đẩy file sang AI Service xử lý...");

  try {
    const res = await uploadDocument(pendingFile, is_save_file);
    await loadDocument(res.document_id);
    
    toast.success("Đã xử lý thông tin xong!", { id: toastId });
    
  } catch (e: any) {
    setError(e?.message || "Upload thất bại");
    setPreviewUrl(null);
    setFileType(null);
    toast.error("Quá trình xử lý AI thất bại", { id: toastId });
  } finally {
    setUploading(false);
    setPendingFile(null);
  }
};

  const handleCancelUpload = () => {
    setShowSaveModal(false);
    setPendingFile(null);
    setPreviewUrl(null);
    setFileType(null);
  };

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFieldChange = (field: string, value: string, isArray?: boolean) => {
    setEditedData((prev) => ({
      ...prev,
      [field]: isArray ? value.split(',').map(s => s.trim()) : value
    }));
  };

  const handleApprove = async () => {
    if (!activeDocumentId) return;

    setSaving(true);
    setError("");
    const toastId = toast.loading("Đang phê duyệt tài liệu...");

    try {
      await approveAIResult(activeDocumentId, {
        ...editedData,
        document_id: activeDocumentId,
        status: "approved",
      });

      toast.success("Phê duyệt tài liệu thành công!", { id: toastId });
      setIsEditing(false);
      await loadDocument(activeDocumentId);
    } catch (e: any) {
      setError(e?.message || "Không thể cập nhật tài liệu");
      toast.error("Phê duyệt thất bại", { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const extractedRows = useMemo(() => {
    const data = isEditing ? editedData : documentDetail;
    
    // Hàm xử lý hiển thị khoảng trắng nếu đang edit, hoặc dấu — nếu chỉ xem
    const getValue = (val: any) => val ?? (isEditing ? "" : "—");
    const getArrayValue = (arr: any) => arr ? arr.join(", ") : (isEditing ? "" : "—");

  return [
      { label: "Số văn bản", value: getValue(data?.document_number), field: "document_number" },
      { label: "Ngày ký / ban hành", value: isEditing ? (data?.signed_date || "") : formatDate(data?.signed_date), field: "signed_date", type: "date" },
      { label: "Loại văn bản", value: getValue(data?.title), field: "title" },
      { label: "Đơn vị ban hành", value: getValue(data?.don_vi_ban_hanh), field: "don_vi_ban_hanh" },
      { label: "Người ký", value: getValue(data?.nguoi_ky), field: "nguoi_ky" },
      { label: "Chức vụ", value: getValue(data?.chuc_vu_nguoi_ky), field: "chuc_vu_nguoi_ky" },
      { label: "Độ khẩn", value: getValue(data?.do_khan), field: "do_khan" },
      { label: "Nơi nhận", value: getArrayValue(data?.noi_nhan), field: "noi_nhan", isArray: true },
      { label: "Căn cứ pháp lý", value: getArrayValue(data?.can_cu_phap_ly), field: "can_cu_phap_ly", isArray: true },
      { label: "Yêu cầu hành động", value: getValue(data?.yeu_cau_han_dong), field: "yeu_cau_han_dong" },
      { label: "Phòng ban được gán", value: getValue(data?.assigned_department_id), field: "assigned_department_id" },
      { label: "Mức tin cậy", value: data?.muc_tin_cay ?? "—", readonly: true },
      { label: "Độ tin cậy", value: `${Math.round(((data?.confidence ?? 0) * 100))}%`, readonly: true },
      { label: "Trạng thái", value: data?.status ?? "—", readonly: true },
    ];
  }, [documentDetail, editedData, isEditing]);

  return (
    <div className="flex flex-1 h-full overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
      <div className="w-2/5 flex flex-col border-r border-primary/10 bg-white dark:bg-slate-900 overflow-y-auto">
        <div className="p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Tiếp nhận tài liệu
            </h1>
            <p className="text-slate-500 text-sm">
              Hỗ trợ PDF, JPG, PNG để trích xuất dữ liệu OCR.
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
            onChange={handleUpload}
          />

          <div
            onClick={handleChooseFile}
            className="group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-10 text-center hover:border-primary hover:bg-primary/10 transition-all cursor-pointer"
          >
            <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-4xl">cloud_upload</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Kéo và thả tệp tại đây
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Hoặc click để chọn tệp từ thiết bị của bạn
            </p>
            <p className="mt-4 text-xs font-medium text-slate-400">
              Dung lượng tối đa 25MB mỗi tệp
            </p>
            {uploading && <p className="mt-3 text-sm text-primary">Đang upload...</p>}
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                Tài liệu hiện tại
              </h3>
            </div>

            <div className="border border-primary/10 rounded-xl overflow-hidden bg-white dark:bg-slate-900/50 p-4">
              {activeDocumentId ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">{documentDetail?.title ?? "Document"}</p>
                  <p className="text-xs text-slate-500">ID: {activeDocumentId}</p>
                  <p className="text-xs text-slate-500">
                    Status: {documentDetail?.status ?? "—"}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Chưa có tài liệu nào được tải lên.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="w-3/5 flex flex-col bg-slate-50 dark:bg-slate-900/50 overflow-y-auto">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">auto_awesome</span>
              Chi tiết xử lý AI
            </h2>
            {loading && <span className="text-sm text-primary">Đang tải...</span>}
          </div>

          <div className="aspect-[4/5] md:aspect-[4/3] w-full rounded-xl border border-primary/10 bg-white dark:bg-slate-800 shadow-sm overflow-hidden flex items-center justify-center relative group">
            {previewUrl && fileType ? (
               <DocumentPreview url={previewUrl} type={fileType} />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100 dark:bg-slate-800/80">
                <span className="material-symbols-outlined text-6xl mb-2 opacity-50">
                  plagiarism
                </span>
                <p className="text-sm">
                  {activeDocumentId
                    ? "Đang tải bản xem trước..."
                    : "Bản xem trước tài liệu..."}
                </p>
              </div>
            )}
          </div>

          <aside className="w-full flex flex-col gap-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-lg">psychology</span>
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">Tóm tắt AI</h3>
                <span className="ml-auto px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px] font-bold rounded-full uppercase tracking-wider">
                  Hoàn tất
                </span>
              </div>

              {isEditing ? (
                 <textarea
                   className="w-full h-24 p-2 text-sm border rounded-lg focus:ring-1 focus:ring-primary outline-none text-slate-700 dark:text-slate-300 dark:bg-slate-800 dark:border-slate-700"
                   value={editedData?.summary || ""}
                   onChange={(e) => handleFieldChange("summary", e.target.value)}
                   placeholder="Nhập tóm tắt..."
                 />
              ) : (
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {documentDetail?.summary ?? "Chưa có summary từ backend."}
                </p>
              )}
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex-1">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">database</span>
                  Dữ liệu trích xuất
                </h3>
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-primary text-xs font-semibold hover:underline"
                >
                  {isEditing ? "Hủy sửa" : "Sửa tất cả"}
                </button>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800/60">
                    <tr>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-slate-500 w-1/3">
                        Trường
                      </th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-slate-500">
                        Giá trị
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {extractedRows.map((row) => (
                      <tr key={row.label} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                          {row.label}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-900 dark:text-slate-100">
                          {isEditing && !row.readonly && row.field ? (
                             <input
                               type={row.type || "text"}
                               value={row.value as string}
                               onChange={(e) => handleFieldChange(row.field!, e.target.value, row.isArray)}
                               placeholder={`Nhập ${row.label.toLowerCase()}...`}
                               className="w-full bg-transparent border-b border-primary/30 focus:border-primary outline-none px-1 py-0.5 text-sm"
                             />
                          ) : (
                             row.value
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={handleApprove}
                disabled={!activeDocumentId || saving}
                className="w-full bg-primary text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-xl">check_circle</span>
                {saving ? "Đang phê duyệt..." : "Phê duyệt tài liệu"}
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => activeDocumentId && loadDocument(activeDocumentId)}
                  className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-xl">refresh</span>
                  Tải lại
                </button>
                <button className="bg-white dark:bg-slate-800 text-primary font-bold py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-primary/5 transition-all flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-xl">delete</span>
                  Xóa bỏ
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {showSaveModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">save</span>
              Xác nhận lưu trữ
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm leading-relaxed">
              Bạn có muốn lưu trữ thông tin của tài liệu <strong className="text-slate-900 dark:text-slate-200">{pendingFile?.name}</strong> vào cơ sở dữ liệu (Vector Database) của hệ thống không?
            </p>
            
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={handleCancelUpload}
                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors text-sm font-semibold"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => handleConfirmUpload(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-semibold"
              >
                Không lưu
              </button>
              <button
                onClick={() => handleConfirmUpload(true)}
                className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 transition-colors text-sm font-semibold flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">check</span>
                Có, lưu lại
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DocumentPage;