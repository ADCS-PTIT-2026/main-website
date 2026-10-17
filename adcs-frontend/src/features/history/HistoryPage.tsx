import React, { useState, useEffect } from 'react';
import { 
  getProcessingHistory, 
  type HistoryRecord 
} from '../../api/history';
import { userApi } from '../../api/user';
import { ProcessingDetailModal } from './ProcessingDetailModal';
import { usePermission } from '../../hooks/usePermission';


// --- Trang Chính Lịch Sử Xử Lý ---
const ProcessingHistoryPage: React.FC = () => {
  const { isAdmin } = usePermission();
  const [allHistoryData, setAllHistoryData] = useState<HistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('Tất cả hành động');
  const [timeFilter, setTimeFilter] = useState('7 ngày qua');

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // State xem chi tiết
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isTelegramConnected, setIsTelegramConnected] = useState(false);

  // Kiểm tra trạng thái Telegram của user
  useEffect(() => {
    const checkTelegram = async () => {
      try {
        const res = await userApi.getTelegramStatus();
        setIsTelegramConnected(Boolean(res.is_connected));
      } catch (err) {
        console.error('Lỗi khi kiểm tra kết nối Telegram:', err);
      }
    };
    checkTelegram();
  }, []);

  const totalItems = allHistoryData.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  const currentData = allHistoryData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const response = await getProcessingHistory({
        limit: 100, // Lấy 100 dòng mới nhất
        search: search.trim() !== '' ? search : undefined,
        action: actionFilter,
        time_filter: timeFilter
      });

      let rawData: HistoryRecord[] = [];
      if (response && response.results) {
        rawData = response.results;
      } else if (Array.isArray(response)) {
        rawData = response;
      }

      setAllHistoryData(rawData);
      setCurrentPage(1);
      
    } catch (error) {
      console.error("Lỗi khi tải lịch sử:", error);
      setAllHistoryData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [actionFilter, timeFilter]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      fetchHistory();
    }
  };

  const handleOpenDetail = (recordId: number) => {
    setSelectedRecordId(recordId);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailModalOpen(false);
    setSelectedRecordId(null);
  };

  // --- Helper Functions ---
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', { 
      day: '2-digit', month: '2-digit', year: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    });
  };

  const getActionLabel = (actionType: string) => {
    switch (actionType?.toLowerCase()) {
      case 'upload': return 'Tải lên';
      case 'delete': return 'Xóa';
      case 'process': return 'Xử lý AI';
      case 'translation': return 'Dịch thuật';
      default: return actionType || 'Khác';
    }
  };

  const getActionStyles = (action: string) => {
    switch (action?.toLowerCase()) {
      case 'upload':
        return 'bg-primary/10 text-primary border border-primary/20';
      case 'process':
        return 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60';
      case 'translation':
        return 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60';
      case 'delete':
        return 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300';
    }
  };

  const getOverallStatus = (record: HistoryRecord) => {
    const statuses = [record.status_llm, record.status_save_file, record.status_save_vector];
    if (statuses.includes('failed') || statuses.includes('error')) return 'Lỗi';
    if (statuses.includes('pending') || statuses.includes('processing')) return 'Đang xử lý';
    return 'Hoàn tất';
  };

  const getStatusStyles = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'hoàn tất':
        return {
          wrapper: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60',
          dot: 'bg-emerald-500',
          pulse: false,
        };
      case 'đang xử lý':
        return {
          wrapper: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60',
          dot: 'bg-amber-500',
          pulse: true,
        };
      case 'lỗi':
        return {
          wrapper: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60',
          dot: 'bg-rose-500',
          pulse: false,
        };
      default:
        return {
          wrapper: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
          dot: 'bg-slate-500',
          pulse: false,
        };
    }
  };

  const getFileIcon = (type: string, filename: string) => {
    const t = (type || filename || '').toLowerCase();
    if (t.includes('pdf')) return { icon: 'picture_as_pdf', color: 'text-rose-500 dark:text-rose-400' };
    if (t.includes('doc') || t.includes('docx')) return { icon: 'article', color: 'text-blue-500 dark:text-blue-400' };
    if (t.includes('csv') || t.includes('xls')) return { icon: 'table_chart', color: 'text-emerald-500 dark:text-emerald-400' };
    if (t.includes('png') || t.includes('jpg')) return { icon: 'image', color: 'text-amber-500 dark:text-amber-400' };
    return { icon: 'description', color: 'text-slate-400' };
  };

  const todayStr = new Date().toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' });
  const successCount = allHistoryData.filter((r) => getOverallStatus(r) === 'Hoàn tất').length;
  const errorCount = allHistoryData.filter((r) => getOverallStatus(r) === 'Lỗi').length;

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 font-display text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                <span className="material-symbols-outlined text-primary text-2xl sm:text-3xl">history</span>
                {isAdmin ? 'Nhật ký xử lý văn bản (Toàn hệ thống)' : 'Lịch sử xử lý văn bản của bạn'}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  isAdmin
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                }`}
              >
                {isAdmin ? 'Quản trị viên' : 'Cá nhân'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {isAdmin
                ? 'Theo dõi toàn bộ tiến trình xử lý, phân tích AI và chia sẻ kết quả trực tiếp qua Telegram trên toàn hệ thống.'
                : 'Theo dõi các lượt tải lên, tiến trình phân tích AI và chia sẻ kết quả trực tiếp qua Telegram cho văn bản của bạn.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold flex items-center gap-2 shadow-sm">
              <span className="text-slate-500 dark:text-slate-400">Hoàn tất:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{successCount}</span>
              {errorCount > 0 && (
                <>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-slate-500 dark:text-slate-400">Lỗi:</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">{errorCount}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="material-symbols-outlined text-[16px] text-primary">calendar_today</span>
              <span>{todayStr}</span>
            </div>
          </div>
        </div>

        {/* Toolbar / Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="sm:col-span-2 lg:col-span-5 relative flex items-center">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
              search
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full pl-10 pr-16 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
              placeholder="Tìm kiếm tên tài liệu, phòng ban..."
              type="text"
            />
            <button
              onClick={() => fetchHistory()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors cursor-pointer"
              title="Tìm kiếm"
            >
              Tìm
            </button>
          </div>

          <div className="lg:col-span-3 flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase whitespace-nowrap">Hành động:</span>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full bg-transparent border-none text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 focus:ring-0 outline-none cursor-pointer"
            >
              <option className="bg-white dark:bg-slate-900">Tất cả hành động</option>
              <option value="upload" className="bg-white dark:bg-slate-900">Tải lên</option>
              <option value="process" className="bg-white dark:bg-slate-900">Xử lý AI</option>
              <option value="translation" className="bg-white dark:bg-slate-900">Dịch thuật</option>
              <option value="delete" className="bg-white dark:bg-slate-900">Xóa</option>
            </select>
          </div>

          <div className="lg:col-span-3 flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase whitespace-nowrap">Thời gian:</span>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="w-full bg-transparent border-none text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 focus:ring-0 outline-none cursor-pointer"
            >
              <option className="bg-white dark:bg-slate-900">7 ngày qua</option>
              <option className="bg-white dark:bg-slate-900">30 ngày qua</option>
              <option className="bg-white dark:bg-slate-900">Tháng này</option>
              <option className="bg-white dark:bg-slate-900">Tùy chọn...</option>
            </select>
          </div>

          <div className="lg:col-span-1 flex justify-end items-center">
            <button
              onClick={() => fetchHistory()}
              className="w-full lg:w-auto p-2 text-slate-500 dark:text-slate-400 hover:text-primary bg-slate-50 dark:bg-slate-800 hover:bg-primary/10 border border-slate-200 dark:border-slate-700 rounded-xl transition-all outline-none flex items-center justify-center gap-1.5 cursor-pointer"
              title="Làm mới dữ liệu"
            >
              <span className={`material-symbols-outlined text-[18px] ${isLoading ? 'animate-spin text-primary' : ''}`}>
                refresh
              </span>
              <span className="lg:hidden text-xs font-bold">Làm mới</span>
            </button>
          </div>
        </div>

        {/* DataTable Container */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[780px]">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Thời gian</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tên tài liệu</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hành động</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Phân luồng / Ghi chú</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs sm:text-sm">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-14 text-center text-slate-500 dark:text-slate-400">
                      <div className="flex flex-col justify-center items-center gap-2">
                        <span className="material-symbols-outlined animate-spin text-3xl text-primary">sync</span>
                        <span className="text-xs font-medium">Đang tải dữ liệu lịch sử...</span>
                      </div>
                    </td>
                  </tr>
                ) : currentData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-14 text-center text-slate-400">
                      <span className="material-symbols-outlined text-4xl opacity-40 block mb-2">history_toggle_off</span>
                      Không tìm thấy lịch sử xử lý nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  currentData.map((record) => {
                    const statusLabel = getOverallStatus(record);
                    const statusUi = getStatusStyles(statusLabel);
                    const fileUi = getFileIcon(record.file_type, record.filename);
                    const actionLabel = getActionLabel(record.action_type);

                    return (
                      <tr
                        key={record.id}
                        onClick={() => handleOpenDetail(record.id)}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                        title="Nhấn để xem chi tiết lượt xử lý"
                      >
                        <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {formatDate(record.created_at)}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                              <span className={`material-symbols-outlined text-[18px] ${fileUi.color}`}>
                                {fileUi.icon}
                              </span>
                            </div>
                            <span className="text-slate-900 dark:text-slate-100 font-bold group-hover:text-primary transition-colors truncate max-w-xs">
                              {record.filename || 'Tài liệu không tên'}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase ${getActionStyles(
                              record.action_type
                            )}`}
                          >
                            {actionLabel}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${statusUi.wrapper}`}
                          >
                            <span
                              className={`size-1.5 rounded-full ${statusUi.dot} ${
                                statusUi.pulse ? 'animate-pulse' : ''
                              }`}
                            ></span>
                            {statusLabel}
                          </span>
                        </td>
                        <td
                          className={`px-5 py-3.5 text-xs max-w-xs truncate ${
                            statusLabel === 'Lỗi'
                              ? 'text-rose-500 dark:text-rose-400 font-medium'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {record.error_message || record.suggested_department || '—'}
                        </td>
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetail(record.id);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-primary hover:text-white text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[15px]">visibility</span>
                            <span>Chi tiết</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination UI */}
          {!isLoading && totalItems > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-800">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Hiển thị <strong className="text-slate-900 dark:text-white">{Math.min(startIndex + 1, totalItems)}</strong> –{' '}
                <strong className="text-slate-900 dark:text-white">
                  {Math.min(startIndex + ITEMS_PER_PAGE, totalItems)}
                </strong>{' '}
                trong tổng số <strong className="text-slate-900 dark:text-white">{totalItems}</strong> bản ghi
              </div>

              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="size-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 hover:text-primary hover:border-primary transition-all disabled:opacity-40 outline-none cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">chevron_left</span>
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`size-8 flex items-center justify-center rounded-lg border font-bold text-xs transition-all outline-none cursor-pointer ${
                        currentPage === pageNum
                          ? 'border-primary bg-primary text-white shadow-sm'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-primary hover:text-primary'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                {totalPages > 5 && <span className="px-2 text-slate-400">...</span>}

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="size-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 hover:text-primary hover:border-primary transition-all disabled:opacity-40 outline-none cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Xem Chi Tiết & Gửi Telegram */}
      <ProcessingDetailModal
        historyId={selectedRecordId}
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetail}
        isTelegramConnected={isTelegramConnected}
      />
    </div>
  );
};

export default ProcessingHistoryPage;