import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
  const [searchParams] = useSearchParams();

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
  const [mobileTab, setMobileTab] = useState<'preview' | 'analysis'>('analysis');

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
        console.error("Không thể tải danh sách phòng ban");
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

  // Khôi phục lại document_id từ URL query hoặc sessionStorage khi vừa vào trang
  useEffect(() => {
    const queryDocId = searchParams.get('id');
    const savedDocId = queryDocId || sessionStorage.getItem('lastActiveDocumentId');
    if (savedDocId) {
      loadDocument(savedDocId);
    }
  }, [searchParams]);

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
            clearInterval(interval);
            toast.success("AI đã phân tích xong văn bản!");
          } else if (doc.status === 'failed') {
            clearInterval(interval);
            const errDetail = (doc as any).error_message || (doc as any).error || "Chất lượng hình ảnh/tệp tin quá thấp hoặc cấu trúc văn bản không hợp lệ.";
            toast.error(`Xử lý AI thất bại: ${errDetail}. Vui lòng kiểm tra lại chất lượng tệp tin.`, {
              duration: 10000
            });
          }
        } catch {
          // Bỏ qua lỗi mạng tạm thời khi polling
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
    } catch {
      const friendlyError = `Xử lý tài liệu ${file.name} lỗi do server đang bận, vui lòng thử lại sau`;
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
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          >
            <option value="">-- Chọn phòng ban --</option>
            {flatDepartments.map((d: DepartmentResponse) => (
              <option key={d.department_id} value={d.department_id}>
                {d.name} {d.code ? `(${d.code})` : ''}
              </option>
            ))}
          </select>
        ) : (
          <span className="inline-flex items-center gap-1.5 font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-md text-xs">
            <span className="material-symbols-outlined text-[14px]">account_tree</span>
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
    <div className="flex flex-col lg:flex-row flex-1 lg:h-[calc(100vh-3.5rem)] lg:overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-display">
      {/* Hiệu ứng tia quét OCR */}
      <style>{`
        @keyframes scan-line {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(800%); }
        }
        .animate-scan-line {
          animation: scan-line 2.5s linear infinite;
        }
      `}</style>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
        onChange={handleUpload}
      />

      {/* Thanh chuyển tab trên Mobile/Tablet (< lg) */}
      <div className="lg:hidden sticky top-0 z-20 flex items-center gap-2 p-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setMobileTab('preview')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            mobileTab === 'preview'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">visibility</span>
          Tệp & Bản xem trước
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('analysis')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            mobileTab === 'analysis'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          <span className={`material-symbols-outlined text-[16px] ${isPending ? 'animate-spin' : ''}`}>
            {isPending ? 'sync' : 'auto_awesome'}
          </span>
          Kết quả phân tích AI
        </button>
      </div>

      {/* CỘT TRÁI: TIẾP NHẬN VĂN BẢN + TRẠNG THÁI + BẢN XEM TRƯỚC TÀI LIỆU */}
      <div
        className={`w-full lg:w-1/2 xl:w-[48%] flex flex-col border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 lg:overflow-y-auto custom-scrollbar ${
          mobileTab === 'analysis' ? 'hidden lg:flex' : 'flex'
        }`}
      >
        <div className="p-4 sm:p-6 flex flex-col flex-1 gap-4">
          {/* Khu vực Upload: Gọn gàng khi đã có văn bản, lớn khi chưa có */}
          <div
            onClick={handleChooseFile}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`group relative rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
              uploading ? 'pointer-events-none opacity-80' : ''
            } ${
              activeDocumentId ? 'p-4' : 'p-8 sm:p-10'
            } ${
              isDragging
                ? 'border-primary bg-primary/15 scale-[1.01] shadow-md'
                : 'border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 hover:border-primary hover:bg-primary/5'
            }`}
          >
            {uploading ? (
              <div className="flex items-center justify-center gap-4 py-2">
                <div className="size-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-2xl animate-bounce">cloud_upload</span>
                </div>
                <div className="flex-1 max-w-xs">
                  <p className="text-sm font-bold text-primary">Đang tải tệp lên hệ thống...</p>
                  <div className="w-full h-1.5 bg-primary/20 rounded-full mt-2 overflow-hidden relative">
                    <div className="absolute inset-0 bg-primary animate-pulse"></div>
                  </div>
                </div>
              </div>
            ) : activeDocumentId ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-xl">upload_file</span>
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {isDragging ? "Thả tệp mới vào đây" : "Tải lên văn bản khác"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      Kéo thả hoặc nhấn để chọn PDF, DOCX, JPG, PNG
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold shrink-0 shadow-sm group-hover:bg-primary/90 transition-colors">
                  Chọn tệp mới
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                <div className="mb-3 size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-3xl">cloud_upload</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  {isDragging ? "Thả tệp của bạn vào đây" : "Kéo và thả tệp văn bản tại đây"}
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Hoặc nhấn để chọn tệp từ thiết bị (Hỗ trợ PDF, DOCX, JPG, PNG)
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 text-xs font-medium flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
              <span>{error}</span>
            </div>
          )}

          {/* Thanh thông tin văn bản hiện tại */}
          {activeDocumentId && (
            <div
              className={`rounded-xl border p-3.5 transition-colors flex flex-wrap items-center justify-between gap-3 ${
                isPending
                  ? 'border-amber-300 dark:border-amber-700/60 bg-amber-50/60 dark:bg-amber-950/20'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-9 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-[20px]">description</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {documentDetail?.loai_van_ban_text || documentDetail?.so_ky_hieu || "Văn bản đang xử lý"}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                    ID: {activeDocumentId.slice(0, 16)}...
                  </p>
                </div>
              </div>

              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${
                  isQueued
                    ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 animate-pulse border border-amber-200 dark:border-amber-700'
                    : isProcessing
                    ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 animate-pulse border border-blue-200 dark:border-blue-700'
                    : documentDetail?.status === 'failed'
                    ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-700'
                    : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700'
                }`}
              >
                {isQueued && <span className="material-symbols-outlined text-[14px] mr-1">hourglass_top</span>}
                {isProcessing && <span className="material-symbols-outlined text-[14px] mr-1 animate-spin">sync</span>}
                {documentDetail?.status === 'failed' && <span className="material-symbols-outlined text-[14px] mr-1">error</span>}
                {!isPending && documentDetail?.status !== 'failed' && (
                  <span className="material-symbols-outlined text-[14px] mr-1">check_circle</span>
                )}
                {isQueued
                  ? "Chờ hàng đợi AI..."
                  : isProcessing
                  ? "Đang AI phân tích..."
                  : documentDetail?.status === 'failed'
                  ? "Phân tích thất bại"
                  : "Xử lý hoàn tất"}
              </span>
            </div>
          )}

          {/* Khung Xem Trước Tài Liệu (Document Preview) nằm ngay cột trái để đối chiếu song song */}
          <div className="relative flex-1 min-h-[420px] lg:min-h-[480px] w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950/60 shadow-inner overflow-hidden flex items-center justify-center">
            {previewUrl && fileType ? (
              <>
                <DocumentPreview url={previewUrl} type={fileType} />

                {/* Lớp phủ Scanner khi AI đang xử lý */}
                {isPending && (
                  <div className="absolute inset-0 bg-amber-900/10 dark:bg-black/40 z-10 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-transparent via-amber-400/20 to-amber-400/50 border-b-2 border-amber-400 animate-scan-line shadow-[0_4px_15px_rgba(251,191,36,0.5)]"></div>
                    <div className="absolute inset-0 flex items-center justify-center backdrop-blur-[1px]">
                      <div className="bg-white/95 dark:bg-slate-900/95 px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2.5 border border-amber-200 dark:border-amber-700">
                        <span className="material-symbols-outlined text-amber-500 animate-spin text-xl">radar</span>
                        <span className="text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400">
                          Đang quét trích xuất (OCR)...
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-slate-400 p-6 max-w-sm">
                {activeDocumentId ? (
                  <>
                    <div className="size-16 rounded-2xl bg-slate-200/70 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
                      <span className="material-symbols-outlined text-3xl">visibility_off</span>
                    </div>
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Bản xem trước không khả dụng</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Tệp gốc chưa được lưu trữ tĩnh hoặc đã được dọn dẹp trên máy chủ.
                    </p>
                    <p className="text-xs text-primary font-semibold mt-3 bg-primary/5 dark:bg-primary/10 p-2.5 rounded-xl border border-primary/15">
                      Kết quả bóc tách AI vẫn hiển thị đầy đủ ở khung bên phải →
                    </p>
                  </>
                ) : (
                  <>
                    <div className="size-16 rounded-2xl bg-slate-200/60 dark:bg-slate-800/60 flex items-center justify-center mx-auto mb-3 text-slate-400">
                      <span className="material-symbols-outlined text-3xl">find_in_page</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Chưa có bản xem trước</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Tải lên một tệp văn bản để xem trực tiếp và đối chiếu dữ liệu AI bóc tách.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CỘT PHẢI: KẾT QUẢ PHÂN TÍCH AI & PHÂN LUỒNG */}
      <div
        className={`w-full lg:w-1/2 xl:w-[52%] flex flex-col bg-slate-50 dark:bg-slate-950 lg:overflow-y-auto custom-scrollbar ${
          mobileTab === 'preview' ? 'hidden lg:flex' : 'flex'
        }`}
      >
        <div className="p-4 sm:p-6 space-y-5">
          {/* Header cột phải */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className={`size-9 rounded-xl flex items-center justify-center ${isPending ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 'bg-primary/10 text-primary'}`}>
                <span className={`material-symbols-outlined text-xl ${isPending ? 'animate-spin' : ''}`}>
                  {isPending ? 'memory' : 'auto_awesome'}
                </span>
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Kết quả bóc tách & Phân luồng AI
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Kiểm tra, hiệu chỉnh метаdata và phê duyệt gửi thông báo
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {loading && (
                <span className="text-xs text-primary font-bold flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-full">
                  <span className="material-symbols-outlined text-sm animate-spin">sync</span> Đang tải...
                </span>
              )}

              {isPending && !loading && (
                <span className="text-xs text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5 animate-pulse">
                  <span className="material-symbols-outlined text-sm animate-spin">data_exploration</span>
                  Đang bóc tách OCR...
                </span>
              )}
            </div>
          </div>

          {/* 1. Tóm tắt & Điểm chính */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">psychology</span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Tóm tắt nội dung
                </h3>
              </div>
              {!isPending && documentDetail && (
                <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold rounded-full uppercase">
                  AI Summary
                </span>
              )}
            </div>

            {isEditing ? (
              <textarea
                className="w-full h-28 p-3 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                value={editedData?.summary || ""}
                onChange={(e) => handleFieldChange("summary", e.target.value)}
                placeholder="Nhập tóm tắt nội dung văn bản..."
              />
            ) : isPending ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-5/6"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {documentDetail?.summary ?? "Chưa có dữ liệu tóm tắt. Vui lòng tải lên hoặc chọn một văn bản."}
                </p>

                {documentDetail?.key_points && documentDetail.key_points.length > 0 && (
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Điểm chính (Key Points)
                    </p>
                    <ul className="space-y-1.5">
                      {documentDetail.key_points.map((kp, idx) => (
                        <li key={idx} className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                          <span className="text-primary font-bold mt-0.5">•</span>
                          <span>{kp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Khối Gợi ý Top-3 Phòng ban & Đề xuất Cán bộ từ AI */}
          {!isPending && documentDetail && (
            <div className="space-y-4">
              {((documentDetail.suggested_departments && documentDetail.suggested_departments.length > 0) || documentDetail.goi_y_phong_ban) && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg text-primary">alt_route</span>
                      Gợi ý phân luồng phòng ban
                    </h3>
                    <span className="text-[11px] text-slate-400 italic">Nhấn để chọn</span>
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
                            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                              isSelected 
                                ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-sm ring-1 ring-primary' 
                                : 'border-slate-200 dark:border-slate-800 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                                  idx === 0 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                }`}>
                                  #{idx + 1}
                                </span>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                  {item.department_name} {item.department_code ? `(${item.department_code})` : ''}
                                </h4>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                  score >= 80 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' :
                                  score >= 60 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' :
                                  'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                }`}>
                                  {score.toFixed(1)}%
                                </span>
                                {isSelected ? (
                                  <span className="material-symbols-outlined text-primary text-base">check_circle</span>
                                ) : (
                                  <span className="text-xs text-primary font-semibold">Chọn</span>
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

              {/* Cán bộ đề xuất & Thời hạn xử lý */}
              {( (documentDetail.proposed_assignees && documentDetail.proposed_assignees.length > 0) || documentDetail.de_xuat_xu_ly ) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {documentDetail.proposed_assignees && documentDetail.proposed_assignees.length > 0 && (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-primary">person_search</span>
                        Đề xuất cán bộ xử lý
                      </p>
                      <div className="space-y-2">
                        {documentDetail.proposed_assignees.map((assignee, idx) => (
                          <div key={idx} className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center gap-2.5">
                            <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                              {assignee.name ? assignee.name.charAt(0).toUpperCase() : "CB"}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{assignee.name}</p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{assignee.position || "Cán bộ chuyên trách"}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {documentDetail.de_xuat_xu_ly && (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col justify-center">
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-primary">schedule</span>
                        Thời hạn xử lý khuyến nghị
                      </p>
                      <p className="text-base font-bold text-slate-900 dark:text-white mb-1">
                        {documentDetail.de_xuat_xu_ly.so_ngay_de_xuat} ngày — Mức:{" "}
                        <span className="text-primary capitalize">{documentDetail.de_xuat_xu_ly.muc_uu_tien}</span>
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {documentDetail.de_xuat_xu_ly.ly_do}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 3. Bảng dữ liệu trích xuất (Metadata Table) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-primary">database</span>
                Thông tin hành chính trích xuất
              </h3>
              <button
                type="button"
                onClick={toggleEdit}
                disabled={isPending || !activeDocumentId}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-primary bg-primary/10 hover:bg-primary/15 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">{isEditing ? "close" : "edit"}</span>
                {isEditing ? "Hủy chỉnh sửa" : "Chỉnh sửa"}
              </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left border-collapse">
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {isPending ? (
                    Array.from({ length: 6 }).map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td className="px-4 py-3 w-1/3">
                          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24"></div>
                        </td>
                        <td className="px-4 py-3">
                          <div className={`h-4 bg-slate-200 dark:bg-slate-800 rounded ${idx % 2 === 0 ? 'w-3/4' : 'w-1/2'}`}></div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    extractedRows.map((row) => (
                      <tr key={row.label} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 w-2/5 sm:w-1/3 align-top">
                          {row.label}
                        </td>
                        <td className="px-4 py-3 text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-medium">
                          {isEditing && row.field && !row.isCustom ? (
                            <input
                              type={row.type || "text"}
                              value={row.value as string}
                              onChange={(e) => handleFieldChange(row.field!, e.target.value, row.isArray)}
                              className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none px-2.5 py-1 text-sm"
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

          {/* 4. Văn bản liên quan (Semantic Search) */}
          {!isPending && documentDetail?.related_documents && documentDetail.related_documents.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg text-primary">hub</span>
                  Văn bản liên quan (Semantic Search)
                </h3>
                <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-full">
                  {documentDetail.related_documents.length} kết quả
                </span>
              </div>

              <div className="space-y-3">
                {documentDetail.related_documents.map((docItem, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 hover:bg-primary/5 dark:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-2">
                          {docItem.trich_yeu || "Không có trích yếu"}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                          {docItem.so_ky_hieu && (
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">tag</span>
                              {docItem.so_ky_hieu}
                            </span>
                          )}
                          {docItem.don_vi_ban_hanh && (
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">apartment</span>
                              {docItem.don_vi_ban_hanh}
                            </span>
                          )}
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold shrink-0 ${
                          docItem.similarity >= 0.85
                            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                            : docItem.similarity >= 0.75
                            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {(docItem.similarity * 100).toFixed(1)}%
                      </span>
                    </div>

                    {docItem.matched_chunk && (
                      <div className="mt-2.5 p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                        <p className="text-xs text-slate-500 dark:text-slate-400 italic line-clamp-2">
                          "... {docItem.matched_chunk} ..."
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. Nút Phê duyệt & Gửi thông báo Telegram */}
          <Authorized permission="doc:approve">
            <div className="pt-1 pb-4">
              <button
                type="button"
                onClick={handleApprove}
                disabled={!activeDocumentId || saving || isPending}
                className={`w-full font-bold py-3.5 px-6 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isPending || !activeDocumentId
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none'
                    : 'bg-primary text-white hover:bg-primary/90 shadow-primary/20'
                } ${saving ? 'opacity-70' : ''}`}
              >
                <span className={`material-symbols-outlined text-xl ${isPending || saving ? 'animate-spin' : ''}`}>
                  {isPending || saving ? 'sync' : 'send'}
                </span>
                {saving
                  ? "Đang lưu & gửi thông báo..."
                  : isQueued
                  ? "Đang chờ trong hàng đợi AI..."
                  : isProcessing
                  ? "Đang chờ AI phân tích..."
                  : "Phê duyệt & Gửi thông báo Telegram"}
              </button>
            </div>
          </Authorized>
        </div>
      </div>

      {/* Modal xác nhận lưu Database */}
      {showSaveModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">database</span>
              Xác nhận lưu trữ Vector DB
            </h3>
            <p className="text-slate-600 dark:text-slate-300 mb-6 text-sm">
              Bạn có muốn lưu trữ thông tin của văn bản <strong>{pendingFile?.name}</strong> vào cơ sở dữ liệu để tìm kiếm (Semantic Search) sau này không?
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={handleCancelUpload}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-bold"
              >
                Hủy
              </button>
              <button
                onClick={() => handleConfirmUpload(false)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
              >
                Không lưu
              </button>
              <button
                onClick={() => handleConfirmUpload(true)}
                className="px-4 py-2 bg-primary text-white hover:bg-primary/90 rounded-xl text-xs font-bold"
              >
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