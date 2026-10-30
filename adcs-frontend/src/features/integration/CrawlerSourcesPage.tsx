import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import axiosClient from '../../api/axiosClient';
import { departmentApi, type DepartmentTreeResponse } from '../../api/department';
import { approveAIResult } from '../../api/document';

type Mapping = { source_name: string; section: string; department_id: string };
type Unmapped = { document_id: string; source_name: string; section: string; filename: string };
type Job = { id: string; kind: string; status: string; error_code: string | null };
type Event = { id: string; operation: string; status: string; attempts: number; error_code: string | null };
type Health = { unmapped_crawler: Unmapped[]; jobs: Job[]; outbox: Event[] };
type AdminProcessingError = {
  attempt_id: string;
  document_id: string;
  request_id: string;
  status: string;
  error?: { error_code?: string; message?: string; stage?: string; retryable?: boolean; [k: string]: unknown } | null;
  warnings?: unknown[];
  started_at?: string;
};
const field = 'rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm w-full';

export default function CrawlerSourcesPage() {
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [departments, setDepartments] = useState<DepartmentTreeResponse[]>([]);
  const [health, setHealth] = useState<Health>({ unmapped_crawler: [], jobs: [], outbox: [] });
  const [processingErrors, setProcessingErrors] = useState<AdminProcessingError[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [threshold, setThreshold] = useState('0.8');
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [rows, tree, status, parameters, pErrors] = await Promise.all([
        axiosClient.get<never, Mapping[]>('/crawler-source-mappings'), departmentApi.getAll(),
        axiosClient.get<never, Health>('/integration/status'),
        axiosClient.get<never, Record<string, string>>('/system-parameters'),
        axiosClient.get<never, AdminProcessingError[]>('/integration/processing-errors').catch(() => []),
      ]);
      const flat: DepartmentTreeResponse[] = [];
      const walk = (items: DepartmentTreeResponse[]) => items.forEach(item => { flat.push(item); walk(item.children || []); });
      walk(tree);
      setMappings(rows); setDepartments(flat); setHealth(status);
      setProcessingErrors(Array.isArray(pErrors) ? pErrors : []);
      setThreshold(parameters.searchSimilarityThreshold || '0.8');
    } catch { setError('Không tải được cấu hình. Vui lòng thử lại.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  const save = async () => {
    setSaving(true);
    try {
      await axiosClient.put('/crawler-source-mappings', mappings);
      await axiosClient.put('/system-parameters', { searchSimilarityThreshold: threshold });
      toast.success('Đã lưu cấu hình'); await load();
    } catch { toast.error('Không lưu được: kiểm tra nguồn bị lặp, phòng ban và ngưỡng tìm kiếm.'); }
    finally { setSaving(false); }
  };
  const update = (index: number, key: keyof Mapping, value: string) => setMappings(rows => rows.map((row, i) => i === index ? { ...row, [key]: value } : row));
  const action = async (url: string, body?: object) => {
    setSaving(true);
    try { await axiosClient.post(url, body); await load(); toast.success('Đã cập nhật'); }
    catch { toast.error('Không thể cập nhật trạng thái lúc này'); }
    finally { setSaving(false); }
  };
  const departmentOptions = departments.map(d => <option key={d.department_id} value={d.department_id}>{d.ten_hien_thi || d.name}</option>);
  return <section aria-labelledby="crawler-sources-title" className="p-4 sm:p-8 space-y-6 text-slate-900 dark:text-slate-100">
    <h1 id="crawler-sources-title" className="text-2xl font-bold">Nguồn crawler và đồng bộ dữ liệu</h1>
    <p>Nguồn chưa được ánh xạ chỉ hiển thị với admin. Cấu hình mới áp dụng cho tài liệu nhận sau khi lưu.</p>
    {error && <div role="alert" className="text-red-600 dark:text-red-400">{error} <button onClick={() => void load()} className="underline">Thử lại</button></div>}
    {loading ? <p role="status">Đang tải cấu hình…</p> : !error && <>
      <section className="space-y-3" aria-label="Ánh xạ nguồn crawler">
        <h2 className="text-lg font-semibold">Nguồn → phòng ban</h2>
        <p className="text-sm">Để trống mục nguồn để áp dụng cho mọi mục của nguồn đó. Cấu hình có mục cụ thể được ưu tiên.</p>
        {mappings.map((row, i) => <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-3 border border-slate-300 dark:border-slate-700 rounded-xl p-3">
          <label>Tên nguồn<input className={field} required value={row.source_name} onChange={e => update(i, 'source_name', e.target.value)} /></label>
          <label>Mục nguồn<input className={field} value={row.section} onChange={e => update(i, 'section', e.target.value)} /></label>
          <label>Phòng ban<select className={field} value={row.department_id} onChange={e => update(i, 'department_id', e.target.value)}><option value="">Chọn phòng ban</option>{departmentOptions}</select></label>
          <button type="button" className="underline text-red-600 dark:text-red-400" onClick={() => setMappings(rows => rows.filter((_, n) => n !== i))}>Xóa ánh xạ {i + 1}</button>
        </div>)}
        <button className="rounded-lg border px-4 py-2" onClick={() => setMappings(rows => [...rows, { source_name: '', section: '', department_id: '' }])}>Thêm nguồn</button>
        <label className="block max-w-sm">Ngưỡng tương đồng tìm kiếm<input type="number" min="0" max="1" step="0.01" className={field} value={threshold} onChange={e => setThreshold(e.target.value)} /></label>
        <button disabled={saving} className="rounded-lg bg-primary text-white px-4 py-2 disabled:opacity-50" onClick={() => void save()}>{saving ? 'Đang lưu…' : 'Lưu cấu hình'}</button>
      </section>
      <section className="space-y-3"><h2 className="text-lg font-semibold">Tài liệu chưa có phòng ban</h2>
        {!health.unmapped_crawler.length && <p>Không có tài liệu chờ phân công.</p>}
        {health.unmapped_crawler.map(doc => <div key={doc.document_id} className="grid md:grid-cols-3 gap-3 border rounded-xl p-3">
          <div><a className="underline" href={`/documents?id=${doc.document_id}`}>{doc.filename}</a><p className="text-sm">{doc.source_name} · {doc.section || 'Mọi mục'}</p></div>
          <label>Phòng ban<select className={field} value={assignments[doc.document_id] || ''} onChange={e => setAssignments({ ...assignments, [doc.document_id]: e.target.value })}><option value="">Chọn phòng ban</option>{departmentOptions}</select></label>
          <button disabled={saving || !assignments[doc.document_id]} className="underline disabled:opacity-50" onClick={async () => {
            setSaving(true);
            try { await approveAIResult(doc.document_id, { assigned_department_id: assignments[doc.document_id] }); await load(); toast.success('Đã phân công'); }
            catch { toast.error('Không thể phân công'); } finally { setSaving(false); }
          }}>Phân công tài liệu</button>
        </div>)}
      </section>
      <section className="space-y-3"><h2 className="text-lg font-semibold">Tác vụ cần đối soát</h2>
        <p className="text-sm">Xác minh tác vụ để tiếp tục xử lý lại hoặc kết thúc lỗi. Tác vụ cần đối soát không làm ảnh hưởng tới các tác vụ khác trong hàng đợi.</p>
        {health.jobs.filter(job => job.status === 'needs_review').map(job => <div key={job.id} className="border rounded-xl p-3 space-x-3">
          <span>{job.kind} · {job.error_code || job.status}</span>
          <button disabled={saving} className="underline" onClick={() => void action(`/integration/jobs/${job.id}/resolve`, { action: 'resume' })}>Đã xác minh, tiếp tục</button>
          <button disabled={saving} className="underline" onClick={() => void action(`/integration/jobs/${job.id}/resolve`, { action: 'fail' })}>Đã xác minh, kết thúc lỗi</button>
        </div>)}
        <h2 className="text-lg font-semibold">Đồng bộ đang chờ hoặc lỗi ({health.outbox.length})</h2>
        {health.outbox.map(event => <div key={event.id} className="border rounded-xl p-3 space-x-3">
          <span>{event.operation} · {event.status} · {event.attempts} lần · {event.error_code}</span>
          {event.status === 'failed' && <button disabled={saving} className="underline" onClick={() => void action(`/integration/outbox/${event.id}/retry`)}>Thử lại đồng bộ</button>}
        </div>)}
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Nhật ký lỗi xử lý AI gần nhất ({processingErrors.length})</h2>
        {!processingErrors.length ? (
          <p className="text-sm text-slate-500">Không có lỗi xử lý AI nào được ghi nhận gần đây.</p>
        ) : (
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Thời gian</th>
                  <th className="py-2.5 px-3">Mã lỗi & Mô tả</th>
                  <th className="py-2.5 px-3">Bước</th>
                  <th className="py-2.5 px-3">Mã tra cứu</th>
                  <th className="py-2.5 px-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {processingErrors.map((pe) => (
                  <tr key={pe.attempt_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-500">
                      {pe.started_at ? new Date(pe.started_at).toLocaleString('vi-VN') : '—'}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-rose-600 dark:text-rose-400">
                        {pe.error?.error_code || (pe.warnings?.length ? 'Cảnh báo' : 'UNKNOWN')}
                      </div>
                      <div className="text-slate-600 dark:text-slate-400 line-clamp-1">
                        {pe.error?.message || '—'}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap font-mono text-slate-500">
                      {pe.error?.stage || '—'}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap font-mono text-slate-500">
                      {pe.request_id || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(pe.request_id || '');
                          toast.success('Đã sao chép mã tra cứu!');
                        }}
                        className="underline text-primary"
                      >
                        Sao chép mã
                      </button>
                      <a
                        href={`/documents?id=${pe.document_id}`}
                        className="underline text-slate-600 dark:text-slate-300"
                      >
                        Xem tài liệu
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>}
  </section>;
}
