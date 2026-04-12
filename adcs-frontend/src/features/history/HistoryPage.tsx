import React, { useState, useEffect } from 'react';
import { getProcessingHistory, type HistoryRecord } from '../../api/history';

const ProcessingHistoryPage: React.FC = () => {
  const [allHistoryData, setAllHistoryData] = useState<HistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('Tất cả hành động');
  const [timeFilter, setTimeFilter] = useState('7 ngày qua');

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const totalItems = allHistoryData.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  const currentData = allHistoryData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const response = await getProcessingHistory({
        limit: 100,
        search: search.trim() !== '' ? search : undefined,
        action: actionFilter,
        time_filter: timeFilter
      });

      let rawData: HistoryRecord[] = [];
      if (Array.isArray(response)) {
        rawData = response;
      } else if (response && (response.data || response.items || response.results)) {
        rawData = response.data || response.items || response.results;
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

  // --- Helper Functions ---
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', { 
      day: '2-digit', month: '2-digit', year: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    });
  };

  const getActionStyles = (action: string) => {
    switch(action?.toLowerCase()) {
      case 'xử lý ai': return 'bg-blue-50 text-blue-700';
      case 'tải lên': return 'bg-primary/10 text-primary';
      case 'xóa': return 'bg-red-50 text-red-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const getStatusStyles = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'hoàn tất':
      case 'thành công': 
      case 'success':
        return { wrapper: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500', pulse: false };
      case 'đang xử lý': 
      case 'pending':
        return { wrapper: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500', pulse: true };
      case 'lỗi': 
      case 'failed':
        return { wrapper: 'bg-red-50 text-red-700', dot: 'bg-red-500', pulse: false };
      default: 
        return { wrapper: 'bg-slate-50 text-slate-700', dot: 'bg-slate-500', pulse: false };
    }
  };

  const getFileIcon = (type: string) => {
    const t = type?.toLowerCase() || '';
    if (t.includes('pdf')) return { icon: 'picture_as_pdf', color: 'text-red-500' };
    if (t.includes('doc')) return { icon: 'article', color: 'text-blue-500' };
    if (t.includes('csv') || t.includes('xls')) return { icon: 'table_chart', color: 'text-emerald-500' };
    if (t.includes('png') || t.includes('jpg')) return { icon: 'image', color: 'text-amber-500' };
    return { icon: 'description', color: 'text-slate-400' };
  };

  const todayStr = new Date().toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="bg-background text-on-background antialiased flex min-h-screen">
      <main className="flex-1 flex flex-col min-w-0 bg-background overflow-y-auto h-screen">
        <div className="p-8 space-y-6">
          
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Lịch sử xử lý tài liệu</h2>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
              <span className="material-symbols-outlined text-base">calendar_today</span>
              <span>Hôm nay, {todayStr}</span>
            </div>
          </div>

          {/* Toolbar / Filters */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="lg:col-span-1 relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none" 
                placeholder="Tìm kiếm tài liệu... (Nhấn Enter)" 
                type="text"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase whitespace-nowrap px-1">Hành động:</label>
              <select 
                value={actionFilter}
                onChange={(e) => { setActionFilter(e.target.value); }}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
              >
                <option>Tất cả hành động</option>
                <option>Tải lên</option>
                <option>Xử lý AI</option>
                <option>Xóa</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase whitespace-nowrap px-1">Thời gian:</label>
              <select 
                value={timeFilter}
                onChange={(e) => { setTimeFilter(e.target.value); }}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
              >
                <option>7 ngày qua</option>
                <option>30 ngày qua</option>
                <option>Tháng này</option>
                <option>Tùy chọn...</option>
              </select>
            </div>
            
            <div className="flex justify-end items-center gap-2">
              <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 outline-none">
                <span className="material-symbols-outlined text-sm">filter_list</span>
                Lọc nâng cao
              </button>
              <button onClick={() => fetchHistory()} className="p-2 text-slate-400 hover:text-primary transition-all outline-none">
                <span className="material-symbols-outlined">refresh</span>
              </button>
            </div>
          </div>

          {/* DataTable Container */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Thời gian</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Người thực hiện</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tên tài liệu</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Hành động</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                        <div className="flex justify-center items-center gap-2">
                          <span className="material-symbols-outlined animate-spin">sync</span>
                          Đang tải dữ liệu...
                        </div>
                      </td>
                    </tr>
                  ) : currentData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                        Không tìm thấy lịch sử nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    currentData.map((record, index) => {
                      const statusUi = getStatusStyles(record.status);
                      const fileUi = getFileIcon(record.document?.type);
                      
                      return (
                        <tr key={record.history_id || index} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-medium">
                            {formatDate(record.timestamp)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] ${record.user?.initials === 'AD' ? 'bg-primary/10 text-primary' : 'bg-slate-200 text-slate-600'}`}>
                                {record.user?.initials || 'U'}
                              </div>
                              <span className="text-slate-900 font-semibold">{record.user?.name || 'Unknown'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className={`material-symbols-outlined text-lg ${fileUi.color}`}>
                                {fileUi.icon}
                              </span>
                              <span className="text-slate-700">{record.document?.name || 'Tài liệu không tên'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded-sm text-[10px] font-bold uppercase ${getActionStyles(record.action)}`}>
                              {record.action || 'Khác'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${statusUi.wrapper}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${statusUi.dot} ${statusUi.pulse ? 'animate-pulse' : ''}`}></span>
                              {record.status || 'Chờ xử lý'}
                            </span>
                          </td>
                          <td className={`px-6 py-4 italic max-w-xs truncate ${record.status?.toLowerCase() === 'lỗi' ? 'text-red-500 font-medium' : 'text-slate-500'}`}>
                            {record.notes || 'Không có ghi chú'}
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
              <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
                <div className="text-xs font-bold text-slate-500 uppercase">
                  Hiển thị {Math.min(startIndex + 1, totalItems)}-{Math.min(startIndex + ITEMS_PER_PAGE, totalItems)} trong số {totalItems} kết quả
                </div>
                
                <div className="flex items-center gap-1">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-primary hover:border-primary transition-all disabled:opacity-50 outline-none"
                  >
                    <span className="material-symbols-outlined text-lg">chevron_left</span>
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1; 
                    return (
                      <button 
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg border font-bold text-xs transition-all outline-none ${
                          currentPage === pageNum 
                            ? 'border-primary bg-primary text-white shadow-sm' 
                            : 'border-slate-200 bg-white text-slate-600 hover:border-primary hover:text-primary'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  
                  {totalPages > 5 && <span className="px-2 text-slate-400">...</span>}
                  
                  <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-primary hover:border-primary transition-all disabled:opacity-50 outline-none"
                  >
                    <span className="material-symbols-outlined text-lg">chevron_right</span>
                  </button>
                </div>
              </div>
            )}
            
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProcessingHistoryPage;