import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  getDocument,
  getDocumentAIResult,
  uploadDocument,
  updateDocumentAIResult,
  type DocumentResponse,
  type DocumentAIResultResponse,
} from "../../../api/document";

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
  const [aiResult, setAiResult] = useState<DocumentAIResultResponse | null>(null);

  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");

  const loadDocument = async (documentId: string) => {
    setLoading(true);
    setError("");
    try {
      const [doc, ai] = await Promise.all([
        getDocument(documentId),
        getDocumentAIResult(documentId),
      ]);
      setDocumentDetail(doc);
      setAiResult(ai);
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

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const res = await uploadDocument(file);
      await loadDocument(res.document_id);
    } catch (e: any) {
      setError(e?.message || "Upload thất bại");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleApprove = async () => {
    if (!activeDocumentId) return;

    setSaving(true);
    setError("");
    try {
      await updateDocumentAIResult(activeDocumentId, {
        status: "approved", // đổi theo status mà backend của bạn đang dùng
        assigned_department_id: aiResult?.assigned_department_id ?? documentDetail?.assigned_department_id ?? null,
        confidence: documentDetail?.confidence ?? aiResult?.confidence ?? null,
        summary: documentDetail?.summary ?? aiResult?.summary ?? null,
      });

      await loadDocument(activeDocumentId);
    } catch (e: any) {
      setError(e?.message || "Không thể cập nhật tài liệu");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    // Nếu muốn mở sẵn 1 document thì gọi loadDocument(id) ở đây
  }, []);

  const extractedRows = useMemo(() => {
    return [
      {
        label: "Số văn bản",
        value: documentDetail?.document_number ?? aiResult?.so_ky_hieu ?? "—",
      },
      {
        label: "Ngày ký / ban hành",
        value: formatDate(documentDetail?.signed_date ?? aiResult?.ngay_van_ban),
      },
      {
        label: "Loại văn bản",
        value: aiResult?.loai_van_ban_text ?? documentDetail?.title ?? "—",
      },
      {
        label: "Đơn vị ban hành",
        value: aiResult?.don_vi_ban_hanh ?? "—",
      },
      {
        label: "Trích yếu",
        value: aiResult?.trich_yeu ?? "—",
      },
      {
        label: "Phòng ban được gán",
        value: aiResult?.assigned_department_id ?? documentDetail?.assigned_department_id ?? "—",
      },
      {
        label: "Độ tin cậy",
        value: `${Math.round(((documentDetail?.confidence ?? aiResult?.confidence ?? 0) * 100))}%`,
      },
      {
        label: "Trạng thái",
        value: documentDetail?.status ?? aiResult?.status ?? "—",
      },
    ];
  }, [documentDetail, aiResult]);

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
            accept=".pdf,.png,.jpg,.jpeg"
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
                    Status: {documentDetail?.status ?? aiResult?.status ?? "—"}
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

          <div className="aspect-[4/2] w-full rounded-xl border border-primary/10 bg-white dark:bg-slate-800 shadow-sm overflow-hidden flex items-center justify-center relative group">
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100 dark:bg-slate-800/80">
              <span className="material-symbols-outlined text-6xl mb-2 opacity-50">
                plagiarism
              </span>
              <p className="text-sm">
                {activeDocumentId
                  ? `Tài liệu đang xem: ${documentDetail?.title ?? activeDocumentId}`
                  : "Bản xem trước tài liệu đang tải..."}
              </p>
            </div>
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

              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {documentDetail?.summary ?? aiResult?.summary ?? "Chưa có summary từ backend."}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex-1">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">database</span>
                  Dữ liệu trích xuất
                </h3>
                <button className="text-primary text-xs font-semibold hover:underline">
                  Sửa tất cả
                </button>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800/60">
                    <tr>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-slate-500">
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
                          {row.value}
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
    </div>
  );
};

export default DocumentPage;