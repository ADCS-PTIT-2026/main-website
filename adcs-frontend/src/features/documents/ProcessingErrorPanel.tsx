import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getProcessingAttempts, type ProcessingAttempt, type ProcessingError } from '../../api/document';
import { formatStage, getActionSuggestion } from './processingErrors';

interface ProcessingErrorPanelProps {
  documentId: string;
  error?: ProcessingError | null;
  errorMessage?: string | null;
}

export const ProcessingErrorPanel: React.FC<ProcessingErrorPanelProps> = ({
  documentId,
  error,
  errorMessage,
}) => {
  const [attempts, setAttempts] = useState<ProcessingAttempt[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getProcessingAttempts(documentId)
      .then((data) => {
        if (active) {
          setAttempts(data.attempts || []);
        }
      })
      .catch(() => {
        // Fallback gracefully
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [documentId]);

  const handleCopyRequestId = (reqId: string) => {
    navigator.clipboard.writeText(reqId).then(() => {
      setCopied(true);
      toast.success('Đã sao chép mã tra cứu!');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const suggestion = getActionSuggestion(error);

  return (
    <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300">
      {/* Primary Error Box */}
      <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl space-y-3">
        <div className="flex items-start gap-2.5">
          <span className="material-symbols-outlined text-rose-500 text-[20px] shrink-0 mt-0.5">
            error
          </span>
          <div className="space-y-1 w-full">
            <h4 className="font-semibold text-rose-900 dark:text-rose-200 text-sm">
              {error?.message || errorMessage || 'Dịch vụ phân tích văn bản gặp sự cố.'}
            </h4>
            <p className="text-[11px] text-rose-700 dark:text-rose-300 leading-relaxed">
              {suggestion}
            </p>
          </div>
        </div>

        {error && (
          <div className="pt-2 border-t border-rose-200/60 dark:border-rose-900/40 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-slate-500 dark:text-slate-400">Bước lỗi: </span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {formatStage(error.stage)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400">Mã lỗi: </span>
              <span className="font-mono font-semibold text-rose-700 dark:text-rose-300">
                {error.error_code}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400">Dịch vụ: </span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {error.dependency || error.service}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 dark:text-slate-400">Mã tra cứu: </span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[140px]" title={error.request_id}>
                {error.request_id}
              </span>
              <button
                type="button"
                onClick={() => handleCopyRequestId(error.request_id)}
                className="p-0.5 text-slate-400 hover:text-primary rounded hover:bg-white dark:hover:bg-slate-800 transition-colors"
                title="Sao chép mã tra cứu"
              >
                <span className="material-symbols-outlined text-[15px]">
                  {copied ? 'check' : 'content_copy'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Attempts History */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <h5 className="font-semibold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-slate-400">
              history
            </span>
            Lịch sử các lượt xử lý ({attempts.length})
          </h5>
        </div>

        {loading ? (
          <p className="text-slate-400 text-[11px] italic">Đang tải lịch sử chi tiết...</p>
        ) : attempts.length === 0 ? (
          <p className="text-slate-400 text-[11px] italic">
            Chưa có lịch sử lượt xử lý cho văn bản này.
          </p>
        ) : (
          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
            {attempts.map((att, idx) => {
              const isSuccess = att.status === 'succeeded';
              const isRunning = att.status === 'running';
              const timeStr = new Date(att.started_at).toLocaleString('vi-VN');

              return (
                <div
                  key={att.attempt_id || idx}
                  className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 text-[11px] space-y-1.5"
                >
                  <div className="flex items-center justify-between font-medium">
                    <span className="text-slate-500 dark:text-slate-400">{timeStr}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        isSuccess
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                          : isRunning
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                      }`}
                    >
                      {isSuccess ? 'Thành công' : isRunning ? 'Đang xử lý' : 'Thất bại'}
                    </span>
                  </div>

                  {att.error && (
                    <div className="text-rose-600 dark:text-rose-400">
                      <span className="font-mono font-semibold">{att.error.error_code}</span>: {att.error.message} (Bước: {formatStage(att.error.stage)})
                    </div>
                  )}

                  {att.warnings && att.warnings.length > 0 && (
                    <div className="text-amber-600 dark:text-amber-400">
                      Cảnh báo: {att.warnings.map((w) => w.message || w.error_code).join(', ')}
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
                    <span>Mã tra cứu: {att.request_id}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyRequestId(att.request_id)}
                      className="hover:text-primary"
                      title="Sao chép mã tra cứu"
                    >
                      <span className="material-symbols-outlined text-[13px]">content_copy</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcessingErrorPanel;

