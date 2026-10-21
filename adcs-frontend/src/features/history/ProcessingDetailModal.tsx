import React, { useState, useEffect } from 'react';
import { 
  getProcessingDetail, 
  getDocumentProcessingDetail,
  sendHistoryTelegram, 
  sendDocumentTelegram,
  type ProcessingDetail 
} from '../../api/history';
import { userApi } from '../../api/user';
import toast from 'react-hot-toast';

const processingStage = (status: string | null) => {
  switch (status) {
    case 'success': return { label: 'Hoàn tất', icon: 'check_circle', color: 'text-emerald-500' };
    case 'failed': case 'error': return { label: 'Thất bại', icon: 'error', color: 'text-rose-500' };
    case 'skipped': return { label: 'Không áp dụng', icon: 'remove_circle_outline', color: 'text-slate-400' };
    case 'processing': return { label: 'Đang xử lý', icon: 'hourglass_top', color: 'text-amber-500' };
    case 'pending': return { label: 'Chờ xử lý', icon: 'hourglass_top', color: 'text-amber-500' };
    default: return { label: 'Chưa ghi nhận', icon: 'help_outline', color: 'text-slate-400' };
  }
};

export interface ProcessingDetailModalProps {
  historyId?: number | string | null;
  documentId?: string | null;
  isOpen: boolean;
  onClose: () => void;
  isTelegramConnected?: boolean;
}

export const ProcessingDetailModal: React.FC<ProcessingDetailModalProps> = ({
  historyId,
  documentId,
  isOpen,
  onClose,
  isTelegramConnected: propIsTelegramConnected,
}) => {
  const [detail, setDetail] = useState<ProcessingDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingTelegram, setIsSendingTelegram] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'ai' | 'technical'>('info');
  const [isTelegramConnected, setIsTelegramConnected] = useState<boolean>(propIsTelegramConnected || false);

  // Đồng bộ hoặc tự kiểm tra trạng thái Telegram nếu chưa truyền vào
  useEffect(() => {
    if (propIsTelegramConnected !== undefined) {
      setIsTelegramConnected(propIsTelegramConnected);
      return;
    }
    const checkTelegram = async () => {
      try {
        const res = await userApi.getTelegramStatus();
        setIsTelegramConnected(Boolean(res.is_connected));
      } catch (_) {}
    };
    if (isOpen) {
      checkTelegram();
    }
  }, [isOpen, propIsTelegramConnected]);

  useEffect(() => {
    if (!isOpen || (!historyId && !documentId)) {
      setDetail(null);
      return;
    }

    const fetchDetail = async () => {
      setIsLoading(true);
      try {
        let data: ProcessingDetail;
        if (documentId) {
          data = await getDocumentProcessingDetail(documentId);
        } else if (historyId) {
          data = await getProcessingDetail(historyId);
        } else {
          return;
        }
        setDetail(data);
      } catch (err: any) {
        console.error('Lỗi khi tải chi tiết văn bản:', err);
        toast.error(err.response?.data?.detail || 'Không thể tải chi tiết lượt xử lý');
        onClose();
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetail();
  }, [isOpen, historyId, documentId]);

  if (!isOpen) return null;

  const handleSendTelegram = async () => {
    if (!detail) return;
    if (!isTelegramConnected) {
      toast.error('Tài khoản của bạn chưa kết nối Telegram. Vui lòng kết nối tại Bảng điều khiển.');
      return;
    }
    if (detail.status === 'failed' || detail.status_llm === 'failed') {
      toast.error('Chỉ có thể gửi kết quả cho các lượt xử lý thành công.');
      return;
    }

    setIsSendingTelegram(true);
    const toastId = toast.loading('Đang gửi thông báo kết quả qua Telegram...');
    try {
      let res: { status: string; message: string };
      if (documentId) {
        res = await sendDocumentTelegram(documentId);
      } else if (historyId) {
        res = await sendHistoryTelegram(historyId);
      } else if (detail.document_id) {
        res = await sendDocumentTelegram(String(detail.document_id));
      } else {
        toast.error('Không xác định được mã văn bản để gửi.');
        return;
      }
      toast.success(res.message || 'Đã gửi kết quả qua Telegram thành công!', { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Không thể gửi kết quả qua Telegram lúc này.', { id: toastId });
    } finally {
      setIsSendingTelegram(false);
    }
  };

  const isSuccess = detail && detail.status !== 'failed' && detail.status_llm !== 'failed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-up"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl">description</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white truncate max-w-md" title={detail?.filename}>
                  {detail?.filename || (isLoading ? 'Đang tải thông tin...' : 'Chi tiết văn bản')}
                </h3>
                {detail && (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    detail.status === 'failed' 
                      ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400' 
                      : detail.status === 'processing' || detail.status === 'queued'
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                      : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                  }`}>
                    <span className={`size-1.5 rounded-full ${
                      detail.status === 'failed' ? 'bg-rose-500' : (detail.status === 'processing' || detail.status === 'queued') ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                    }`} />
                    {detail.status === 'failed' ? 'Thất bại' : (detail.status === 'processing' || detail.status === 'queued') ? 'Đang xử lý' : 'Hoàn tất'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Mã Request: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">{detail?.request_id || 'N/A'}</code>
                {detail?.created_at && ` • Thời gian: ${new Date(detail.created_at).toLocaleString('vi-VN')}`}
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="size-8 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors outline-none cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Modal Tabs Navigation */}
        <div className="px-4 sm:px-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4 sm:gap-6 bg-white dark:bg-slate-900 text-xs sm:text-sm font-bold overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer outline-none ${
              activeTab === 'info'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <span className="material-symbols-outlined text-lg">badge</span>
            Thông tin văn bản
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer outline-none ${
              activeTab === 'ai'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <span className="material-symbols-outlined text-lg">psychology</span>
            Kết quả AI & Trích xuất
          </button>
          <button
            onClick={() => setActiveTab('technical')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer outline-none ${
              activeTab === 'technical'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <span className="material-symbols-outlined text-lg">settings_suggest</span>
            Tiến trình & Lưu trữ
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
              <span className="material-symbols-outlined text-4xl animate-spin text-primary">progress_activity</span>
              <p className="text-sm font-medium">Đang tải toàn bộ dữ liệu tài liệu...</p>
            </div>
          ) : !detail ? (
            <div className="py-16 text-center text-slate-500">
              Không tìm thấy thông tin chi tiết của tài liệu này.
            </div>
          ) : (
            <>
              {/* TAB 1: THÔNG TIN VĂN BẢN */}
              {activeTab === 'info' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Số / Ký hiệu</span>
                      <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 mt-1">
                        {detail.so_ky_hieu || detail.so_den || 'Chưa xác định'}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Loại văn bản</span>
                      <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 mt-1 capitalize">
                        {detail.loai_van_ban || 'Văn bản hành chính'}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Độ khẩn</span>
                      <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 mt-1 capitalize">
                        {detail.do_khan || 'Thường'}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cơ quan ban hành</span>
                      <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 mt-1">
                        {detail.don_vi_ban_hanh || 'Học viện Công nghệ Bưu chính Viễn thông'}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Người ký / Chức vụ</span>
                      <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 mt-1">
                        {detail.nguoi_ky ? `${detail.nguoi_ky} (${detail.chuc_vu_nguoi_ky || 'Lãnh đạo'})` : 'Chưa xác định'}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ngày văn bản</span>
                      <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 mt-1">
                        {detail.ngay_van_ban && detail.ngay_van_ban !== 'None' ? detail.ngay_van_ban : 'Chưa ghi nhận'}
                      </p>
                    </div>
                  </div>

                  {/* Phòng ban phân bổ */}
                  <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                        Phòng ban được AI đề xuất phân bổ
                      </span>
                      <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                        {detail.suggested_department || 'Chưa có gợi ý cụ thể'}
                      </h4>
                    </div>
                    {detail.confidence && (
                      <div className="text-right">
                        <span className="text-xs text-slate-500">Độ tin cậy</span>
                        <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                          {Math.round(detail.confidence <= 1 ? detail.confidence * 100 : detail.confidence)}%
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Trích yếu nội dung */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Trích yếu nội dung văn bản</label>
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                      {detail.trich_yeu || 'Không có thông tin trích yếu cho tài liệu này.'}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: KẾT QUẢ AI & TRÍCH XUẤT */}
              {activeTab === 'ai' && (
                <div className="space-y-6 animate-fade-in">
                  {/* Tóm tắt AI */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-primary font-bold text-sm">
                      <span className="material-symbols-outlined text-lg">auto_awesome</span>
                      <span>Tóm tắt nội dung AI (Summary)</span>
                    </div>
                    <div className="p-5 rounded-xl bg-primary/5 border border-primary/15 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                      {detail.summary || 'Chưa có bản tóm tắt tự động cho tài liệu này.'}
                    </div>
                  </div>

                  {/* Điểm cốt lõi Key Points */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-sm">
                      <span className="material-symbols-outlined text-lg text-emerald-600">checklist</span>
                      <span>Các điểm cốt lõi chính (Key Points)</span>
                    </div>
                    {detail.key_points && detail.key_points.length > 0 ? (
                      <div className="space-y-2">
                        {detail.key_points.map((pt, i) => (
                          <div key={i} className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-sm">
                            <span className="material-symbols-outlined text-emerald-500 text-base mt-0.5">check_circle</span>
                            <span className="text-slate-700 dark:text-slate-300">{pt}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 italic">Không có danh sách điểm cốt lõi.</p>
                    )}
                  </div>

                  {/* Thông số kỹ thuật AI */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-400 uppercase">Thời gian xử lý</span>
                      <p className="font-bold text-base text-slate-800 dark:text-slate-200 mt-1">
                        {detail.processing_time ? `${detail.processing_time.toFixed(1)} giây` : 'N/A'}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-400 uppercase">Số trang văn bản</span>
                      <p className="font-bold text-base text-slate-800 dark:text-slate-200 mt-1">
                        {detail.source_pages ? `${detail.source_pages} trang` : 'N/A'}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-400 uppercase">Mức tin cậy</span>
                      <p className="font-bold text-base text-emerald-600 dark:text-emerald-400 mt-1 capitalize">
                        {detail.muc_tin_cay || 'Cao'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: TIẾN TRÌNH & LƯU TRỮ */}
              {activeTab === 'technical' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { title: 'Phân tích LLM', status: detail.status_llm },
                      { title: 'Lưu trữ tệp', status: detail.status_save_file },
                      { title: 'Lưu trữ Vector', status: detail.status_save_vector },
                    ].map(({ title, status }) => {
                      const stage = processingStage(status);
                      return (
                        <div key={title} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-400 uppercase">{title}</span>
                            <span className={`material-symbols-outlined text-lg ${stage.color}`}>{stage.icon}</span>
                          </div>
                          <p className="font-bold text-sm text-slate-800 dark:text-slate-200 mt-2">{stage.label}</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Thông báo lỗi nếu có */}
                  {detail.error_message && (
                    <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60">
                      <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-sm mb-1">
                        <span className="material-symbols-outlined text-lg">warning</span>
                        <span>Thông báo lỗi hệ thống:</span>
                      </div>
                      <p className="text-xs font-mono text-rose-600 dark:text-rose-300 break-words">
                        {detail.error_message}
                      </p>
                    </div>
                  )}

                  {/* Tệp đính kèm & OCR */}
                  {detail.attachments && detail.attachments.length > 0 && (
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-slate-500 uppercase">Tệp đính kèm trong Data Service</label>
                      <div className="space-y-2">
                        {detail.attachments.map((att) => (
                          <div key={att.attachment_id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-sm">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="material-symbols-outlined text-primary text-base">attachment</span>
                              <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">{att.filename}</span>
                              <span className="text-xs text-slate-400">({att.file_type})</span>
                            </div>
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded">
                              OCR: {att.ocr_status || 'Hoàn tất'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Storage Info Details */}
                  {detail.storage_info && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Chi tiết lưu trữ Vector DB</label>
                      <div className="p-4 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto">
                        <pre>{JSON.stringify(detail.storage_info, null, 2)}</pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {!isTelegramConnected && (
              <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">info</span>
                Chưa kết nối Telegram. Hãy liên kết tại Bảng điều khiển để nhận thông báo.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold transition-colors cursor-pointer"
            >
              Đóng
            </button>

            {/* Nút gửi Telegram */}
            <button
              onClick={handleSendTelegram}
              disabled={isLoading || isSendingTelegram || !isSuccess || !isTelegramConnected}
              title={
                !isTelegramConnected
                  ? 'Vui lòng liên kết tài khoản Telegram trước'
                  : !isSuccess
                  ? 'Chỉ hỗ trợ gửi kết quả cho văn bản xử lý thành công'
                  : 'Gửi toàn bộ kết quả phân tích văn bản này tới Telegram'
              }
              className="bg-[#2AABEE] hover:bg-[#229ED9] text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-md shadow-[#2AABEE]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <span className={`material-symbols-outlined text-base ${isSendingTelegram ? 'animate-spin' : ''}`}>
                {isSendingTelegram ? 'progress_activity' : 'send'}
              </span>
              <span>{isSendingTelegram ? 'Đang gửi...' : 'Gửi qua Telegram'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
