type State = { status?: string | null; sync_status?: string | null; sync_warnings?: string[]; duplicate_document_id?: string | null; possible_duplicate_count?: number };
export default function DocumentIntegrationState({ document: doc }: { document: State }) {
  return <div className="text-xs space-y-1 text-slate-600 dark:text-slate-300" aria-live="polite">
    {doc.status === 'duplicate' && <p>Tài liệu trùng · Đã lưu lịch sử, dừng xử lý. {doc.duplicate_document_id && <a className="underline" href={`/documents?id=${doc.duplicate_document_id}`}>Xem bản gốc</a>}</p>}
    {doc.status === 'needs_review' && <p>Tác vụ cần admin đối soát trước khi tiếp tục.</p>}
    {doc.sync_status === 'pending' && <p>Đang chờ đồng bộ dữ liệu.</p>}
    {doc.sync_status === 'error' && <p role="status">Đồng bộ gặp lỗi; hệ thống sẽ thử lại hoặc admin xử lý.</p>}
    {!!doc.possible_duplicate_count && <p>Có {doc.possible_duplicate_count} tài liệu có thể trùng; cần kiểm tra.</p>}
    {!!doc.sync_warnings?.length && <p>Có cảnh báo đồng bộ; liên hệ admin kiểm tra.</p>}
  </div>;
}
