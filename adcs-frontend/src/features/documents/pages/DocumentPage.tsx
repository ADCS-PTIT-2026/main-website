import React, { useEffect, useMemo, useRef, useState } from "react";
import toast from 'react-hot-toast';
import {
  getDocument,
  uploadDocument,
  approveAIResult,
  type DocumentResponse,
} from "../../../api/document";
import { DocumentPreview } from "../components/DocumentPreview";
import { Authorized } from "../../../components/common/Authorized";
import { departmentApi, type DepartmentTreeResponse, type DepartmentResponse } from "../../../api/department";

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
  const [flatDepartments, setFlatDepartments] = useState<DepartmentResponse[]>([]);

  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const tree = await departmentApi.getAll();
        const flatten = (nodes: DepartmentTreeResponse[]): DepartmentResponse[] => {
          let list: DepartmentResponse[] = [];
          nodes.forEach(node => {
            const { children, ...rest } = node;
            list.push(rest);
            if (children && children.length > 0) list = list.concat(flatten(children));
          });
          return list;
        };
        setFlatDepartments(flatten(tree));
      } catch (err) {
        console.error("Không thể tải danh sách phòng ban:", err);
      }
    };
    fetchDepartments();
  }, []);

  const getDepartmentName = (deptId?: string | null) => {
    if (!deptId) return "Chưa phân bổ";
    const found = flatDepartments.find(d => d.department_id === deptId || String(d.id) === String(deptId) || d.code === deptId);
    return found ? (found.ten_hien_thi || found.name) : deptId;
  };

  const handleSelectSuggestedDepartment = (deptCode?: string, deptName?: string) => {
    let targetDeptId: string | null = null;
    if (deptCode) {
      const match = flatDepartments.find(d => d.code === deptCode || String(d.id) === deptCode);
      if (match) targetDeptId = match.department_id;
    }
    if (!targetDeptId && deptName) {
      const match = flatDepartments.find(d => d.name.toLowerCase().includes(deptName.toLowerCase()) || (d.ten_hien_thi && d.ten_hien_thi.toLowerCase().includes(deptName.toLowerCase())));
      if (match) targetDeptId = match.department_id;
    }
    const finalId = targetDeptId || deptCode || deptName || "";
    setEditedData(prev => ({
      ...prev,
      assigned_department_id: finalId
    }));
    toast.success(`Đã chọn phòng ban: ${deptName || deptCode}`);
  };

  // Khôi phục lại document_id từ sessionStorage khi vừa vào trang
  useEffect(() => {
    const savedDocId = sessionStorage.getItem('lastActiveDocumentId');
    if (savedDocId) {
      loadDocument(savedDocId);
    }
  }, []);

  useEffect(() => {
    if (activeDocumentId) {
      sessionStorage.setItem('lastActiveDocumentId', activeDocumentId);
    }
  }, [activeDocumentId]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    const isWorking = documentDetail?.status === 'pending' || documentDetail?.status === 'queued' || documentDetail?.status === 'processing';

    if (activeDocumentId && isWorking) {
      interval = setInterval(async () => {
        try {
          const doc = await getDocument(activeDocumentId);
          setDocumentDetail(doc);

          if (doc.status === 'processed' || doc.status === 'success') {
            console.log("Văn bản đã được AI xử lý xong:", doc);
            clearInterval(interval);
            toast.success("AI đã phân tích xong văn bản!");
          } else if (doc.status === 'failed') {
            clearInterval(interval);
            const errDetail = (doc as any).error_message || (doc as any).error || "Chất lượng hình ảnh/tệp tin quá thấp hoặc cấu trúc văn bản không hợp lệ.";
            toast.error(`Xử lý AI thất bại: ${errDetail}. Vui lòng kiểm tra lại chất lượng tệp tin.`, {
              duration: 10000
            });
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

  const loadDocument = async (documentId: string) => {
    setLoading(true);
    setError("");
    try {
      const doc = await getDocument(documentId);
      setDocumentDetail(doc);
      setActiveDocumentId(documentId);

      if (doc.local_path) {
        const backendBaseUrl = "http://localhost:8000";
        const fileUrl = doc.local_path.startsWith('http') ? doc.local_path : `${backendBaseUrl}${doc.local_path}`;

        setPreviewUrl(fileUrl);
        const ext = doc.local_path.split('.').pop()?.toLowerCase() || 'pdf';
        setFileType(ext);
      } else {
        setPreviewUrl((currentUrl) => {
          if (currentUrl && currentUrl.startsWith('blob:')) {
            return currentUrl;
          }
          return null;
        });
      }

    } catch (e: any) {
      setError(e?.message || "Không thể tải dữ liệu văn bản");
      sessionStorage.removeItem('lastActiveDocumentId');
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

    handleConfirmUpload(true, file, ext);
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (uploading) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (uploading) return;

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const allowedExtensions = ['pdf', 'png', 'jpg', 'jpeg', 'doc', 'docx'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!allowedExtensions.includes(ext)) {
      toast.error(`Định dạng file "${ext.toUpperCase()}" không được hỗ trợ! Vui lòng chỉ tải lên các tệp: ${allowedExtensions.join(', ').toUpperCase()}`, {
        duration: 8000
      });
      return;
    }

    const objectUrl = URL.createObjectURL(file);

    setPreviewUrl(objectUrl);
    setFileType(ext);
    setPendingFile(file);

    handleConfirmUpload(true, file, ext);
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
      const friendlyError = `Xử lý tài liệu ${file.name} lỗi do server đang lỗi, vui lòng thử lại sau`;
      setError(friendlyError);
      setPreviewUrl(null);
      setFileType(null);
      toast.error(friendlyError, {
        duration: 10000
      });
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
    const toastId = toast.loading("Đang gửi thông báo văn bản...");

    try {
      const res = await approveAIResult(activeDocumentId, {
        ...editedData,
        status: "approved",
      });

      console.log("Phản hồi sau khi duyệt:", res);
      const teleStatus = res.telegram_notification;
      if (teleStatus === "success") {
        toast.success("Gửi thông báo Telegram thành công!", { id: toastId });
      } else if (teleStatus?.startsWith("error")) {
        toast.success(`Gửi thông báo thành công nhưng Telegram báo lỗi.`, { id: toastId, icon: '⚠️' });

      } else if (teleStatus === "bot_not_found" || teleStatus === "not_configured") {
        toast.error(
          "Chưa kết nối Telegram!\n\nVui lòng sang trang Cấu hình để kết nối. Bạn có thể rời trang này, văn bản của bạn đã được lưu tự động.",
          { id: toastId, duration: 6000 }
        );
      } else {
        toast.success(res.message || "Gửi thông tin văn bản thành công!", { id: toastId });
      }

      setIsEditing(false);
      await loadDocument(activeDocumentId);
    } catch (e: any) {
      setError(e?.message || "Không thể cập nhật văn bản");
      toast.error("Thao tác thất bại", { id: toastId });
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
      { 
        label: "Phòng ban xử lý", 
        value: isEditing ? (
          <select 
            value={data?.assigned_department_id || ""} 
            onChange={(e) => handleFieldChange("assigned_department_id", e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">-- Chọn phòng ban --</option>
            {flatDepartments.map((d: DepartmentResponse) => (
              <option key={d.department_id} value={d.department_id}>
                {d.name} {d.code ? `(${d.code})` : ''}
              </option>
            ))}
          </select>
        ) : (
          <span className="font-semibold text-primary">
            {getDepartmentName(data?.assigned_department_id)}
          </span>
        ), 
        field: "assigned_department_id",
        isCustom: true
      },
      { label: "Trích yếu", value: getValue(data?.trich_yeu), field: "trich_yeu" },
      { label: "Đơn vị ban hành", value: getValue(data?.don_vi_ban_hanh), field: "don_vi_ban_hanh" },
      { label: "Người ký", value: getValue(data?.nguoi_ky), field: "nguoi_ky" },
      { label: "Chức vụ", value: getValue(data?.chuc_vu_nguoi_ky), field: "chuc_vu_nguoi_ky" },
      { label: "Độ khẩn", value: getValue(data?.do_khan), field: "do_khan" },
      { label: "Nơi nhận", value: getArrayValue(data?.noi_nhan), field: "noi_nhan", isArray: true },
      { label: "Căn cứ pháp lý", value: getArrayValue(data?.can_cu_phap_ly), field: "can_cu_phap_ly", isArray: true },
      { label: "Yêu cầu hành động", value: getValue(data?.yeu_cau_hanh_dong), field: "yeu_cau_hanh_dong" },
    ];
  }, [documentDetail, editedData, isEditing, flatDepartments]);

  const isQueued = documentDetail?.status === 'queued';
  const isProcessing = documentDetail?.status === 'processing' || documentDetail?.status === 'pending';
  const isPending = isQueued || isProcessing;

  return (
    <div className="flex flex-1 h-full overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
      {/* hiệu ứng tia quét */}
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
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-all cursor-pointer 
              ${uploading ? 'pointer-events-none' : ''} 
              ${isDragging
                ? 'border-primary bg-primary/20 scale-[1.02] shadow-md'
                : 'border-primary/30 bg-primary/5 hover:border-primary hover:bg-primary/10'}`}
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
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {isDragging ? "Thả file của bạn vào đây" : "Kéo và thả tệp tại đây"}
                </h3>
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
                  <p className="text-sm font-medium">{documentDetail?.loai_van_ban_text ?? "Văn bản đang xử lý..."}</p>
                  <p className="text-xs text-slate-500">Mã file: {activeDocumentId}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                      ${isQueued ? 'bg-amber-100 text-amber-800 animate-pulse border border-amber-200' :
                        isProcessing ? 'bg-blue-100 text-blue-800 animate-pulse border border-blue-200' :
                        documentDetail?.status === 'failed' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                        'bg-emerald-100 text-emerald-800'}`}>
                      {isQueued && <span className="material-symbols-outlined text-[14px] mr-1">hourglass_top</span>}
                      {isProcessing && <span className="material-symbols-outlined text-[14px] mr-1 animate-spin">sync</span>}
                      {documentDetail?.status === 'failed' && <span className="material-symbols-outlined text-[14px] mr-1">error</span>}
                      {!isPending && documentDetail?.status !== 'failed' && <span className="material-symbols-outlined text-[14px] mr-1">check_circle</span>}
                      {isQueued ? "Đang trong hàng đợi AI..." :
                       isProcessing ? "Đang AI phân tích..." :
                       documentDetail?.status === 'failed' ? "Phân tích thất bại" :
                       "Xử lý hoàn tất"}
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
              <div className="text-center text-slate-400 p-6">
                {activeDocumentId ? (
                  <>
                    <span className="material-symbols-outlined text-6xl opacity-40 mb-3 text-slate-300">hide_image</span>
                    <p className="text-sm font-medium text-slate-500">Bản xem trước không khả dụng</p>
                    <p className="text-xs text-slate-400 mt-1">Dữ liệu gốc đã được mã hóa hoặc chưa được lưu trữ tĩnh trên máy chủ.</p>
                    <p className="text-xs text-primary font-medium mt-3 bg-primary/5 p-2 rounded-lg border border-primary/10">Vui lòng xem kết quả trích xuất AI ở bên dưới ↓</p>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-6xl opacity-50 mb-2">plagiarism</span>
                    <p className="text-sm">Chưa có bản xem trước.</p>
                  </>
                )}
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

            {/* Khối Gợi ý Top-3 Phòng ban & Đề xuất Cán bộ từ AI (W9) */}
            {!isPending && documentDetail && (
              <div className="space-y-4">
                {/* 1. Top-3 Phòng ban gợi ý */}
                {((documentDetail.suggested_departments && documentDetail.suggested_departments.length > 0) || documentDetail.goi_y_phong_ban) && (
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-primary">psychology</span> Top phòng ban gợi ý phân luồng
                      </p>
                      <span className="text-[11px] text-slate-400 italic">Click để áp dụng</span>
                    </div>

                    <div className="space-y-2.5">
                      {(() => {
                        const suggestions = (documentDetail.suggested_departments && documentDetail.suggested_departments.length > 0)
                          ? documentDetail.suggested_departments
                          : documentDetail.goi_y_phong_ban
                          ? [{
                              department_code: "",
                              department_name: documentDetail.goi_y_phong_ban.ten_hien_thi || documentDetail.goi_y_phong_ban.phong_ban || "",
                              confidence_score: documentDetail.goi_y_phong_ban.diem_tin_cay || documentDetail.confidence || 0.88,
                              reasoning: documentDetail.goi_y_phong_ban.ly_do || "Văn bản phù hợp với nhiệm vụ của phòng ban này."
                            }]
                          : [];

                        return suggestions.map((item, idx) => {
                          const score = item.confidence_score ? (item.confidence_score > 1 ? item.confidence_score : item.confidence_score * 100) : 85;
                          const currentAssigned = isEditing ? editedData.assigned_department_id : documentDetail.assigned_department_id;
                          const isSelected = currentAssigned && (
                            currentAssigned === item.department_code || 
                            getDepartmentName(currentAssigned).toLowerCase().includes((item.department_name || "").toLowerCase())
                          );

                          return (
                            <div 
                              key={idx}
                              onClick={() => handleSelectSuggestedDepartment(item.department_code, item.department_name)}
                              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                                isSelected 
                                  ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-sm ring-1 ring-primary' 
                                  : 'border-slate-200 dark:border-slate-800 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <div className="flex items-center gap-2">
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                    idx === 0 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                  }`}>
                                    #{idx + 1}
                                  </span>
                                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                    {item.department_name} {item.department_code ? `(${item.department_code})` : ''}
                                  </h4>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                    score >= 80 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' :
                                    score >= 60 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' :
                                    'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                  }`}>
                                    {score.toFixed(1)}% tin cậy
                                  </span>
                                  {isSelected ? (
                                    <span className="material-symbols-outlined text-primary text-base">check_circle</span>
                                  ) : (
                                    <button 
                                      type="button" 
                                      className="text-xs text-primary hover:underline font-semibold"
                                    >
                                      Chọn
                                    </button>
                                  )}
                                </div>
                              </div>
                              {item.reasoning && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                                  {item.reasoning}
                                </p>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}

                {/* 2. Cán bộ đề xuất xử lý (Proposed Assignees) */}
                {documentDetail.proposed_assignees && documentDetail.proposed_assignees.length > 0 && (
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-primary">person_search</span> Đề xuất cán bộ xử lý
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {documentDetail.proposed_assignees.map((assignee, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                            {assignee.name ? assignee.name.charAt(0).toUpperCase() : "CB"}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{assignee.name}</p>
                            <p className="text-[11px] text-slate-500 truncate">{assignee.position || "Cán bộ chuyên trách"}</p>
                            {assignee.email && <p className="text-[10px] text-slate-400 truncate">{assignee.email}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Đề xuất thời hạn xử lý */}
                {documentDetail.de_xuat_xu_ly && (
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">schedule</span> Đề xuất thời hạn xử lý
                    </p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                      {documentDetail.de_xuat_xu_ly.so_ngay_de_xuat} ngày - Mức: <span className="text-primary capitalize">{documentDetail.de_xuat_xu_ly.muc_uu_tien}</span>
                    </p>
                    <p className="text-xs text-slate-500 line-clamp-2">{documentDetail.de_xuat_xu_ly.ly_do}</p>
                  </div>
                )}
              </div>
            )}
            {/* Nút hành động */}
            <Authorized permission="doc:approve">
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
                  {saving ? "Đang lưu..." : isQueued ? "Đang chờ trong hàng đợi AI..." : isProcessing ? "Đang chờ AI phân tích..." : "Gửi thông báo tới tài khoản telegram"}
                </button>
              </div>
            </Authorized>
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