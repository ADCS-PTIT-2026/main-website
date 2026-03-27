import React, { useState, useEffect } from 'react';
import { getDashboardStats, getRecentDocuments, type DashboardStatsResponse, type DocumentResponse } from '../api/document';

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
  const [recentDocs, setRecentDocs] = useState<DocumentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Gọi song song 2 API để lấy thống kê và danh sách tài liệu
        const [statsData, docsData] = await Promise.all([
          getDashboardStats(),
          getRecentDocuments(5)
        ]);
        
        setStats(statsData);
        setRecentDocs(docsData);
      } catch (err: any) {
        setError(err.message || 'Lỗi khi tải dữ liệu dashboard');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Hàm helper để map status từ DB sang UI (màu sắc, icon)
  const getStatusUI = (status: string | null | undefined) => {
    switch (status?.toLowerCase()) {
      case 'success':
      case 'hoàn tất':
        return { label: 'Hoàn tất', color: 'emerald', isPulsing: false };
      case 'pending':
      case 'processing':
      case 'đang xử lý':
        return { label: 'Đang xử lý', color: 'blue', isPulsing: true };
      case 'failed':
      case 'lỗi':
        return { label: 'Lỗi', color: 'rose', isPulsing: false };
      default:
        return { label: status || 'Chờ xác minh', color: 'amber', isPulsing: false };
    }
  };

  // Cấu hình mảng hiển thị dựa trên dữ liệu thật
  const displayStats = [
    { title: 'Tổng tài liệu', value: stats?.total_documents?.toLocaleString() || '0', icon: 'description', trend: 'Cập nhật', color: 'blue', trendColor: 'emerald' },
    { title: 'Đang xử lý', value: stats?.pending_documents?.toString() || '0', icon: 'pending_actions', trend: 'Cần xử lý', color: 'amber', trendColor: 'amber' },
    { title: 'Chính xác AI', value: `${stats?.ai_accuracy || 0}%`, icon: 'psychology', trend: 'PTIT Red', color: 'primary', trendColor: 'primary' },
    { title: 'Người dùng được phân quyền', value: stats?.new_users?.toString() || '0', icon: 'group', trend: 'Hệ thống', color: 'emerald', trendColor: 'slate' },
  ];

  if (loading) {
    return <div className="p-8 flex justify-center items-center h-full"><span className="animate-spin material-symbols-outlined text-4xl text-primary">sync</span></div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">Lỗi: {error}</div>;
  }

  return (
    <div className="p-8 space-y-8">
      {/* Welcome Message */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Xin chào, Admin</h1>
          <p className="text-slate-500 mt-1">Dưới đây là thống kê hoạt động của hệ thống AI trong 24h qua.</p>
        </div>
        <button className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary/20 transition-all">
          <span className="material-symbols-outlined text-lg">upload_file</span>
          Tải tài liệu mới
        </button>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {displayStats.map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={`size-10 bg-${stat.color}-50 dark:bg-${stat.color}-900/20 text-${stat.color}-600 rounded-lg flex items-center justify-center`}>
                <span className="material-symbols-outlined">{stat.icon}</span>
              </div>
              <span className={`text-xs font-bold text-${stat.trendColor}-500 bg-${stat.trendColor}-50 dark:bg-${stat.trendColor}-900/20 px-2 py-1 rounded`}>
                {stat.trend}
              </span>
            </div>
            <p className="text-sm font-medium text-slate-500">{stat.title}</p>
            <h3 className="text-2xl font-bold mt-1 tracking-tight">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Charts & List Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ... (Giữ nguyên phần Performance Chart Mockup và Urgent Documents như code cũ của bạn) ... */}
        {/* Để gọn code mình sẽ ẩn bớt đi, bạn copy phần này từ code cũ của bạn nhé */}
        
        {/* Recent Activity Table */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-lg">Tài liệu xử lý gần đây</h3>
            <button className="text-sm font-semibold text-slate-500 hover:text-primary">Xem tất cả</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  {['Tên tài liệu', 'Loại/Số hiệu', 'Phòng ban', 'Trạng thái AI', 'Ngày nhận'].map((th, i) => (
                    <th key={i} className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">{th}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {recentDocs.length === 0 ? (
                   <tr><td colSpan={5} className="px-6 py-4 text-center text-slate-500">Chưa có tài liệu nào</td></tr>
                ) : (
                  recentDocs.map((doc) => {
                    const uiConfig = getStatusUI(doc.status);
                    // Dùng title nếu có, nếu không thì dùng document_id cắt ngắn
                    const displayName = doc.title || `Doc_${doc.document_id.substring(0,8)}`;
                    
                    return (
                      <tr key={doc.document_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="size-8 bg-primary/5 text-primary rounded flex items-center justify-center">
                              <span className="material-symbols-outlined text-lg">description</span>
                            </div>
                            <span className="text-sm font-semibold max-w-[200px] truncate" title={displayName}>{displayName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">{doc.document_number || 'Chưa xác định'}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{doc.assigned_department_id || 'Chưa phân bổ'}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-${uiConfig.color}-100 text-${uiConfig.color}-700`}>
                            <span className={`size-1.5 rounded-full bg-${uiConfig.color}-500 ${uiConfig.isPulsing ? 'animate-pulse' : ''}`}></span>
                            {uiConfig.label} {doc.confidence ? `(${Math.round(doc.confidence * 100)}%)` : ''}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {doc.updated_at ? new Date(doc.updated_at).toLocaleDateString('vi-VN') : 'N/A'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;