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

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (activeDocumentId && documentDetail?.status === 'pending') {
      interval = setInterval(async () => {
        try {
          const doc = await getDocument(activeDocumentId);
          setDocumentDetail(doc);
          
          if (doc.status === 'processed' || doc.status === 'success') {
            clearInterval(interval);
            toast.success("AI đã phân tích xong văn bản!");
          } else if (doc.status === 'failed') {
            clearInterval(interval);
            toast.error("Xử lý AI thất bại.");
          }
        } catch (e) {
          console.error("Lỗi khi polling:", e);
        }
      }, 3000); 
    }

    return () => clearInterval(interval);
  }, [activeDocumentId, documentDetail?.status]);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // -----------------------------------------------------------------
  // HANDLERS TẢI LÊN & DUYỆT
  // -----------------------------------------------------------------
  const loadDocument = async (documentId: string) => {
    setLoading(true);
    setError("");
    try {
      const doc = await getDocument(documentId);
      setDocumentDetail(doc);
      setActiveDocumentId(documentId);
    } catch (e: any) {
      setError(e?.message || "Không thể tải dữ liệu văn bản");
    } finally {
      setLoading(false);
    }
  };

  const handleChooseFile = () => fileInputRef.current?.click();

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    
    setPreviewUrl(objectUrl);
    setFileType(ext);
    setPendingFile(file);

    // setShowSaveModal(true);
    handleConfirmUpload(true, file, ext);

    e.target.value = "";
  };

  const handleConfirmUpload = async (is_save_file: boolean, fileToUpload?: File, fileExt?: string) => {
    const file = fileToUpload || pendingFile;
    if (!file) return;

    setShowSaveModal(false);
    setUploading(true);
    setError("");

    const currentFileType = fileExt || fileType || '';
    const isImage = ['pdf', 'png', 'jpg', 'jpeg'].includes(currentFileType);
    
    if (isImage) {
      toast("Đang tải lên, AI sẽ mất vài chục giây để xử lý OCR...", { icon: "⏳", duration: 4000 });
    }
    
    try {
      const res = await uploadDocument(file, is_save_file);
      await loadDocument(res.document_id); 
      toast.success("Đã gửi văn bản sang AI xử lý!");
    } catch (e: any) {
      setError(e?.message || "Upload thất bại");
      setPreviewUrl(null);
      setFileType(null);
      toast.error("Tải lên thất bại");
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

  const handleApprove = async () => {
    if (!activeDocumentId) return;

    setSaving(true);
    const toastId = toast.loading("Đang Gửi thông báo văn bản...");

    try {
      const res = await approveAIResult(activeDocumentId, {
        ...editedData,
        status: "approved",
      });

      const teleStatus = res.telegram_notification;

      if (teleStatus === "success") {
        toast.success("Gửi thông báo Telegram thành công!", { id: toastId });
      } else if (teleStatus?.startsWith("error")) {
        toast.success(`Gửi thông báo thành công nhưng Telegram báo lỗi.`, { id: toastId, icon: '⚠️' });
      } else if (teleStatus === "bot_not_found" || teleStatus === "not_configured") {
        toast.success("Chưa cấu hình nhận Telegram! Vui lòng quay trở lại trang dashboard để cấu hình.", { id: toastId });
      } else {
        toast.success(res.message || "Gửi thông báo văn bản thành công!", { id: toastId });
      }

      setIsEditing(false);
      await loadDocument(activeDocumentId);
    } catch (e: any) {
      setError(e?.message || "Không thể cập nhật văn bản");
      toast.error("Gửi thông báo thất bại", { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const toggleEdit = () => {
    if (!isEditing) setEditedData(documentDetail || {});
    setIsEditing(!isEditing);
  };

  const handleFieldChange = (field: string, value: string, isArray?: boolean) => {
    setEditedData((prev) => ({
      ...prev,
      [field]: isArray ? value.split(',').map(s => s.trim()) : value
    }));
  };

  const extractedRows = useMemo(() => {
    const data = isEditing ? editedData : documentDetail;
    const getValue = (val: any) => val ?? (isEditing ? "" : "—");
    const getArrayValue = (arr: any) => (Array.isArray(arr) && arr.length > 0) ? arr.join(", ") : (isEditing ? "" : "—");

    return [
      { label: "Số ký hiệu", value: getValue(data?.so_ky_hieu), field: "so_ky_hieu" },
      { label: "Ngày ban hành", value: isEditing ? (data?.ngay_van_ban || "") : formatDate(data?.ngay_van_ban), field: "ngay_van_ban", type: "date" },
      { label: "Loại văn bản", value: getValue(data?.loai_van_ban_text), field: "loai_van_ban_text" },
      { label: "Trích yếu", value: getValue(data?.trich_yeu), field: "trich_yeu" },
      { label: "Đơn vị ban hành", value: getValue(data?.don_vi_ban_hanh), field: "don_vi_ban_hanh" },
      { label: "Người ký", value: getValue(data?.nguoi_ky), field: "nguoi_ky" },
      { label: "Chức vụ", value: getValue(data?.chuc_vu_nguoi_ky), field: "chuc_vu_nguoi_ky" },
      { label: "Độ khẩn", value: getValue(data?.do_khan), field: "do_khan" },
      { label: "Nơi nhận", value: getArrayValue(data?.noi_nhan), field: "noi_nhan", isArray: true },
      { label: "Căn cứ pháp lý", value: getArrayValue(data?.can_cu_phap_ly), field: "can_cu_phap_ly", isArray: true },
      { label: "Yêu cầu hành động", value: getValue(data?.yeu_cau_hanh_dong), field: "yeu_cau_hanh_dong" },
    ];
  }, [documentDetail, editedData, isEditing]);

  const isPending = documentDetail?.status === 'pending';

  return (
    <div className="flex flex-1 h-full overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
      {/* CSS Nhúng cho hiệu ứng tia quét */}
      <style>{`
        @keyframes scan-line {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(800%); }
        }
        .animate-scan-line {
          animation: scan-line 2.5s linear infinite;
        }
      `}</style>

      {/* CỘT TRÁI: UPLOAD VÀ văn bản */}
      <div className="w-2/5 flex flex-col border-r border-primary/10 bg-white dark:bg-slate-900 overflow-y-auto">
        <div className="p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Tiếp nhận văn bản</h1>
            <p className="text-slate-500 text-sm">Hỗ trợ PDF, JPG, PNG để trích xuất dữ liệu OCR.</p>
          </div>

          <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" onChange={handleUpload} />

          <div
            onClick={handleChooseFile}
            className={`group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-10 text-center hover:border-primary hover:bg-primary/10 transition-all cursor-pointer ${uploading ? 'pointer-events-none' : ''}`}
          >
            {uploading ? (
              // Giao diện khi đang tải lên
              <div className="flex flex-col items-center animate-pulse">
                <div className="mb-4 rounded-full bg-primary/20 p-4 text-primary">
                  <span className="material-symbols-outlined text-4xl animate-bounce">cloud_upload</span>
                </div>
                <h3 className="text-lg font-semibold text-primary">Đang đẩy file lên hệ thống...</h3>
                <div className="w-48 h-1.5 bg-primary/20 rounded-full mt-4 overflow-hidden relative">
                  <div className="absolute top-0 left-0 h-full bg-primary animate-[pulse_1s_ease-in-out_infinite] w-full"></div>
                </div>
              </div>
            ) : (
              // Giao diện bình thường
              <>
                <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-4xl">cloud_upload</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Kéo và thả tệp tại đây</h3>
                <p className="mt-1 text-sm text-slate-500">Hoặc click để chọn tệp từ thiết bị của bạn</p>
              </>
            )}
          </div>

          {error && <div className="p-3 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-sm">{error}</div>}

          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Văn bản hiện tại</h3>
            <div className={`border rounded-xl overflow-hidden p-4 relative transition-colors ${isPending ? 'border-amber-300 bg-amber-50/50 dark:bg-slate-900/50' : 'border-primary/10 bg-white dark:bg-slate-900/50'}`}>
              {activeDocumentId ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">{documentDetail?.loai_van_ban_text ?? "văn bản đang xử lý..."}</p>
                  <p className="text-xs text-slate-500">Mã file: {activeDocumentId}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                      ${isPending ? 'bg-amber-100 text-amber-800 animate-pulse border border-amber-200' : 'bg-emerald-100 text-emerald-800'}`}>
                      {isPending && <span className="material-symbols-outlined text-[14px] mr-1 animate-spin">sync</span>}
                      {isPending ? "Đang AI phân tích..." : "Xử lý hoàn tất"}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Chưa có văn bản nào.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CỘT PHẢI: KẾT QUẢ AI */}
      <div className="w-3/5 flex flex-col bg-slate-50 dark:bg-slate-900/50 overflow-y-auto">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className={`material-symbols-outlined ${isPending ? 'text-amber-500 animate-spin' : 'text-primary'}`}>
                {isPending ? 'memory' : 'auto_awesome'}
              </span>
              Chi tiết xử lý AI
            </h2>
            
            <div className="flex items-center gap-3">
              {loading && (
                 <span className="text-sm text-primary font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm animate-spin">sync</span> Đang tải dữ liệu...
                 </span>
              )}
              
              {isPending && !loading && (
                 <span className="text-sm text-amber-600 bg-amber-100 px-3 py-1 rounded-full font-bold flex items-center gap-2 animate-pulse">
                    <span className="material-symbols-outlined text-sm animate-spin">data_exploration</span> 
                    AI đang bóc tách nội dung OCR...
                 </span>
              )}
            </div>
          </div>

          {/* Document Preview với Hiệu ứng Scanner */}
          <div className="relative aspect-[4/5] md:aspect-[4/3] w-full rounded-xl border border-primary/10 bg-white dark:bg-slate-800 shadow-sm overflow-hidden flex items-center justify-center">
            {previewUrl && fileType ? (
               <>
                 <DocumentPreview url={previewUrl} type={fileType} />
                 
                 {/* LỚP PHỦ SCANNER KHI AI ĐANG XỬ LÝ */}
                 {isPending && (
                   <div className="absolute inset-0 bg-amber-900/10 dark:bg-black/40 z-10 overflow-hidden pointer-events-none">
                     {/* Tia quét */}
                     <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-transparent via-amber-400/20 to-amber-400/50 border-b-2 border-amber-400 animate-scan-line shadow-[0_4px_15px_rgba(251,191,36,0.5)]"></div>
                     
                     {/* Box thông báo giữa màn hình (Tuỳ chọn: nếu thấy che mất text có thể bỏ) */}
                     <div className="absolute inset-0 flex items-center justify-center backdrop-blur-[1px]">
                       <div className="bg-white/90 dark:bg-slate-800/90 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-amber-200">
                         <span className="material-symbols-outlined text-amber-500 animate-spin">radar</span>
                         <span className="font-semibold text-amber-600">Đang quét trích xuất (OCR)...</span>
                       </div>
                     </div>
                   </div>
                 )}
               </>
            ) : (
              <div className="text-center text-slate-400">
                <span className="material-symbols-outlined text-6xl opacity-50 mb-2">plagiarism</span>
                <p className="text-sm">Chưa có bản xem trước.</p>
              </div>
            )}
          </div>

          <aside className="w-full flex flex-col gap-4">
            {/* Tóm tắt & Điểm chính */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm relative overflow-hidden">
              <div className="flex items-center gap-2 mb-4">
                <div className={`size-8 rounded-lg flex items-center justify-center ${isPending ? 'bg-amber-100 text-amber-600' : 'bg-primary/10 text-primary'}`}>
                  <span className="material-symbols-outlined text-lg">psychology</span>
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">Tóm tắt văn bản</h3>
                {!isPending && documentDetail && (
                   <span className="ml-auto px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase">Đã phân tích</span>
                )}
              </div>
              
              {isEditing ? (
                 <textarea
                   className="w-full h-24 p-2 text-sm border rounded-lg focus:ring-1 focus:ring-primary outline-none"
                   value={editedData?.summary || ""}
                   onChange={(e) => handleFieldChange("summary", e.target.value)}
                 />
              ) : isPending ? (
                // SKELETON LOADING CHO TÓM TẮT
                <div className="space-y-3 animate-pulse">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-3"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full mb-2"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-11/12 mb-2"></div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {documentDetail?.summary ?? "Không có tóm tắt."}
                  </p>
                  
                  {documentDetail?.key_points && documentDetail.key_points.length > 0 && (
                    <div className="mt-3 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                      <p className="text-xs font-bold text-slate-500 uppercase mb-2">Điểm chính (Key Points):</p>
                      <ul className="list-disc pl-5 space-y-1">
                        {documentDetail.key_points.map((kp, idx) => (
                          <li key={idx} className="text-sm text-slate-700 dark:text-slate-300">{kp}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bảng dữ liệu trích xuất */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">database</span> Dữ liệu trích xuất
                </h3>
                <button onClick={toggleEdit} disabled={isPending} className="text-primary text-xs font-semibold hover:underline disabled:opacity-50">
                  {isEditing ? "Hủy sửa" : "Sửa tất cả"}
                </button>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left border-collapse">
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {isPending ? (
                      // SKELETON LOADING CHO BẢNG
                      Array.from({ length: 6 }).map((_, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 animate-pulse">
                          <td className="px-4 py-3 text-sm font-medium w-1/3">
                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
                          </td>
                          <td className="px-4 py-3">
                            <div className={`h-4 bg-slate-200 dark:bg-slate-700 rounded ${idx % 2 === 0 ? 'w-3/4' : 'w-1/2'}`}></div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      extractedRows.map((row) => (
                        <tr key={row.label} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          <td className="px-4 py-3 text-sm font-medium text-slate-700 w-1/3">{row.label}</td>
                          <td className="px-4 py-3 text-sm text-slate-900">
                            {isEditing && row.field ? (
                               <input
                                 type={row.type || "text"}
                                 value={row.value as string}
                                 onChange={(e) => handleFieldChange(row.field!, e.target.value, row.isArray)}
                                 className="w-full bg-transparent border-b border-primary/30 focus:border-primary outline-none px-1 py-0.5"
                               />
                            ) : (
                               row.value
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {!isPending && documentDetail?.related_documents && documentDetail.related_documents.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm mt-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg text-primary">link</span> 
                    Văn bản liên quan (Semantic Search)
                  </h3>
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-full">
                    {documentDetail.related_documents.length} kết quả
                  </span>
                </div>

                <div className="space-y-3">
                  {documentDetail.related_documents.map((docItem, idx) => (
                    <div key={idx} className="group p-3 rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 hover:bg-primary/5 dark:bg-slate-800/50 transition-colors">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-2" title={docItem.trich_yeu || ""}>
                            {docItem.trich_yeu || "Không có trích yếu"}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-slate-500">
                            {docItem.so_ky_hieu && (
                              <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">tag</span> {docItem.so_ky_hieu}</span>
                            )}
                            {docItem.don_vi_ban_hanh && (
                              <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">apartment</span> {docItem.don_vi_ban_hanh}</span>
                            )}
                          </div>
                        </div>
                        {/* Hiển thị phần trăm độ chính xác (Similarity Score) */}
                        <div className="shrink-0 flex flex-col items-end">
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold
                            ${docItem.similarity >= 0.85 ? 'bg-emerald-100 text-emerald-700' : 
                              docItem.similarity >= 0.75 ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-700'}`}>
                            <span className="material-symbols-outlined text-[12px] mr-1">target</span>
                            {(docItem.similarity * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      
                      {/* Trích đoạn nội dung khớp (Matched Chunk) */}
                      {docItem.matched_chunk && (
                        <div className="mt-3 p-2 bg-white dark:bg-slate-900 rounded border border-slate-100 dark:border-slate-700">
                          <p className="text-[11px] text-slate-500 italic line-clamp-2">
                            "... {docItem.matched_chunk} ..."
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Khối Gợi ý và Đề xuất từ AI */}
            {!isPending && documentDetail && (documentDetail.de_xuat_xu_ly || documentDetail.goi_y_phong_ban) && (
              <div className="grid grid-cols-2 gap-4">
                {documentDetail.de_xuat_xu_ly && (
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 p-4 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">schedule</span> Đề xuất xử lý
                    </p>
                    <p className="text-sm font-semibold text-slate-900 mb-1">{documentDetail.de_xuat_xu_ly.so_ngay_de_xuat} ngày - Mức: <span className="text-primary capitalize">{documentDetail.de_xuat_xu_ly.muc_uu_tien}</span></p>
                    <p className="text-xs text-slate-500 line-clamp-3">{documentDetail.de_xuat_xu_ly.ly_do}</p>
                  </div>
                )}
                {documentDetail.goi_y_phong_ban && (
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 p-4 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">domain</span> Đề xuất phòng ban
                    </p>
                    <p className="text-sm font-semibold text-slate-900 mb-1">{documentDetail.goi_y_phong_ban.ten_hien_thi}</p>
                    <p className="text-xs text-slate-500 line-clamp-3">{documentDetail.goi_y_phong_ban.ly_do}</p>
                  </div>
                )}
              </div>
            )}
            {/* Nút hành động */}
            <div className="grid grid-cols-1 gap-2 mt-4">
              <button
                onClick={handleApprove}
                disabled={!activeDocumentId || saving || isPending}
                className={`w-full font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 
                  ${isPending ? 'bg-amber-100 text-amber-400 cursor-not-allowed shadow-none' : 'bg-primary text-white hover:bg-primary/90'} 
                  ${saving ? 'opacity-70' : ''}`}
              >
                <span className={`material-symbols-outlined text-xl ${isPending ? 'animate-spin' : ''}`}>
                  {isPending ? 'hourglass_top' : 'check_circle'}
                </span>
                {saving ? "Đang lưu..." : isPending ? "Đang chờ AI phân tích..." : "Gửi thông báo tới tài khoản telegram"}
              </button>
            </div>
          </aside>
        </div>
      </div>

      {/* Modal xác nhận lưu Database */}
      {showSaveModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">Xác nhận lưu trữ Vector DB</h3>
            <p className="text-slate-600 mb-6 text-sm">Bạn có muốn lưu trữ thông tin của văn bản <strong>{pendingFile?.name}</strong> vào cơ sở dữ liệu để tìm kiếm (Semantic Search) sau này không?</p>
            <div className="flex items-center justify-end gap-3">
              <button onClick={handleCancelUpload} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-semibold">Hủy</button>
              <button onClick={() => handleConfirmUpload(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold">Không lưu</button>
              <button onClick={() => handleConfirmUpload(true)} className="px-4 py-2 bg-primary text-white hover:bg-primary/90 rounded-lg text-sm font-semibold">Có, lưu lại</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentPage;