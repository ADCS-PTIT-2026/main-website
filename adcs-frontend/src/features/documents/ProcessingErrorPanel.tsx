import { useEffect, useState } from 'react';
import { getProcessingAttempts, type ProcessingAttempt, type ProcessingError } from '../../api/document';

export default function ProcessingErrorPanel({ documentId, error }: { documentId: string; error?: ProcessingError | null }) {
  const [rows, setRows] = useState<ProcessingAttempt[]>([]);
  const [state, setState] = useState('Đang tải lịch sử xử lý…');
  useEffect(() => {
    let active = true;
    getProcessingAttempts(documentId).then(data => {
      if (active) { setRows(data.attempts); setState(data.attempts.length ? '' : 'Chưa có lịch sử chi tiết cho văn bản cũ.'); }
    }).catch(() => { if (active) setState('Chưa tải được lịch sử xử lý.'); });
    return () => { active = false; };
  }, [documentId]);
  return <div className="space-y-3 text-xs">
    {error && <dl className="grid grid-cols-2 gap-2">
      <dt>Mã lỗi</dt><dd>{error.error_code}</dd>
      <dt>Bước xử lý</dt><dd>{error.stage}</dd>
      <dt>Dịch vụ</dt><dd>{error.dependency || error.service}</dd>
      <dt>Mã tra cứu</dt><dd className="break-all select-all">{error.request_id}</dd>
      <dt>Xử lý tiếp</dt><dd>{error.next_retry_at ? `Thử lại sau ${new Date(error.next_retry_at).toLocaleString('vi-VN')}` : error.error_code === 'AI_RESPONSE_TIMEOUT' ? 'Cần xác minh AI đã kết thúc trước khi gửi lại.' : error.retryable ? 'Có thể thử lại sau khi dịch vụ phục hồi.' : 'Cần kiểm tra trước khi thử lại.'}</dd>
    </dl>}
    <h4 className="font-semibold">Lịch sử từng lượt xử lý</h4>
    {state && <p role="status">{state}</p>}
    <ol className="max-h-52 overflow-y-auto space-y-2">
      {rows.map(row => <li key={row.attempt_id} className="rounded border p-2 space-y-1">
        <p>{new Date(row.started_at).toLocaleString('vi-VN')} · {row.status}</p>
        {row.error && <p>{row.error.error_code} · {row.error.stage} · {row.error.message}</p>}
        {row.warnings.map((warning, i) => <p key={i}>Cảnh báo: {warning.error_code} · {warning.message}</p>)}
        <p className="break-all select-all">Mã tra cứu: {row.request_id}</p>
      </li>)}
    </ol>
  </div>;
}
