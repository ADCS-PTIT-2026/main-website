import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { getDashboardStats, getRecentDocuments, type DashboardStatsResponse, type DocumentResponse } from '../api/document';
import { userApi } from '../api/user';
import toast from 'react-hot-toast';

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
  const [recentDocs, setRecentDocs] = useState<DocumentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State quản lý trạng thái Telegram
  const [isConnectingTelegram, setIsConnectingTelegram] = useState(false);
  const [isTelegramConnected, setIsTelegramConnected] = useState<boolean>(false);
  const [telegramChatId, setTelegramChatId] = useState<string | null>(null);
  const [isDisconnectingTelegram, setIsDisconnectingTelegram] = useState(false);

  const [userName, setUserName] = useState<string>('Người dùng');
  const navigate = useNavigate();

  const fetchTelegramStatus = async () => {
    try {
      const res = await userApi.getTelegramStatus();
      setIsTelegramConnected(Boolean(res.is_connected));
      setTelegramChatId(res.telegram_chat_id || null);

      const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          parsed.is_telegram_connected = Boolean(res.is_connected);
          parsed.telegram_chat_id = res.telegram_chat_id;
          if (localStorage.getItem('user')) localStorage.setItem('user', JSON.stringify(parsed));
          if (sessionStorage.getItem('user')) sessionStorage.setItem('user', JSON.stringify(parsed));
        } catch (_) {}
      }
    } catch (err) {
      console.error('Lỗi khi kiểm tra trạng thái Telegram:', err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    
    if (!token) {
      alert('Vui lòng đăng nhập lại để tiếp tục!');
      navigate('/login', { replace: true });
      return;
    }
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && parsedUser.name) {
          setUserName(parsedUser.name);
        }
        if (parsedUser && parsedUser.is_telegram_connected) {
          setIsTelegramConnected(true);
          setTelegramChatId(parsedUser.telegram_chat_id || null);
        }
      } catch (error) {
        console.error('Lỗi khi đọc thông tin người dùng:', error);
      }
    }

    fetchTelegramStatus();

    const onFocus = () => {
      fetchTelegramStatus();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [navigate]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
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

  const handleConnectTelegram = async (isReconnect = false) => {
    setIsConnectingTelegram(true);
    try {
      const response = await userApi.getTelegramLink();

      if (response && response.link) {
        window.open(response.link, '_blank');
        if (isReconnect) {
          toast.success('Đã mở Telegram! Vui lòng nhấn "Bắt đầu" (Start) trên tài khoản mới để chuyển đổi.', { duration: 5000 });
        } else {
          toast.success('Đã mở Telegram! Vui lòng nhấn "Bắt đầu" (Start) để hoàn tất kết nối.', { duration: 5000 });
        }
      } else {
        toast.error('Không tìm thấy link kết nối. Vui lòng kiểm tra lại cấu hình Bot.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Không thể lấy thông tin kết nối Telegram lúc này.');
    } finally {
      setIsConnectingTelegram(false);
    }
  };

  const handleDisconnectTelegram = async () => {
    const confirmed = window.confirm(
      'Bạn có chắc chắn muốn hủy liên kết tài khoản Telegram này không? Bạn có thể kết nối lại hoặc đổi sang tài khoản Telegram khác bất cứ lúc nào.'
    );
    if (!confirmed) return;

    setIsDisconnectingTelegram(true);
    try {
      await userApi.disconnectTelegram();
      setIsTelegramConnected(false);
      setTelegramChatId(null);
      toast.success('Đã ngắt kết nối Telegram thành công.');
      fetchTelegramStatus();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Không thể ngắt kết nối Telegram lúc này.');
    } finally {
      setIsDisconnectingTelegram(false);
    }
  };

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

  const displayStats = [
    { title: 'Tổng tài liệu', value: stats?.total_documents?.toLocaleString() || '0', icon: 'description', trend: 'Cập nhật', color: 'blue', trendColor: 'emerald' },
    { title: 'Đang xử lý', value: stats?.pending_documents?.toString() || '0', icon: 'pending_actions', trend: 'Cần xử lý', color: 'amber', trendColor: 'amber' },
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
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Xin chào, {userName}</h1>
          <p className="text-slate-500 mt-1">Dưới đây là thống kê hoạt động của hệ thống AI trong 24h qua.</p>
        </div>
        
        {/* ACTION BUTTONS */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Nút Kết nối Telegram / Trạng thái Telegram */}
          {isTelegramConnected ? (
            <div className="flex items-center bg-white dark:bg-slate-900 border border-emerald-500/30 rounded-lg shadow-sm p-1 gap-1">
              {/* Badge Đã kết nối */}
              <div 
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-semibold text-xs cursor-default select-none"
                title={`Đã kết nối Telegram (Chat ID: ${telegramChatId || 'Hoạt động'})`}
              >
                <span className="material-symbols-outlined text-base text-emerald-600 dark:text-emerald-400">
                  check_circle
                </span>
                <span>Đã kết nối Telegram</span>
              </div>

              {/* Nút Đổi tài khoản / Kết nối lại */}
              <button
                onClick={() => handleConnectTelegram(true)}
                disabled={isConnectingTelegram}
                title="Kết nối lại hoặc đổi sang tài khoản Telegram khác"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs transition-colors disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-sm text-[#2AABEE] ${isConnectingTelegram ? 'animate-spin' : ''}`}>
                  {isConnectingTelegram ? 'progress_activity' : 'swap_horiz'}
                </span>
                <span>{isConnectingTelegram ? 'Đang mở...' : 'Đổi tài khoản'}</span>
              </button>

              {/* Nút Ngắt kết nối */}
              <button
                onClick={handleDisconnectTelegram}
                disabled={isDisconnectingTelegram}
                title="Hủy liên kết Telegram"
                className="flex items-center justify-center p-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition-colors disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-base ${isDisconnectingTelegram ? 'animate-spin' : ''}`}>
                  {isDisconnectingTelegram ? 'progress_activity' : 'link_off'}
                </span>
              </button>
            </div>
          ) : (
            <button 
              onClick={() => handleConnectTelegram(false)}
              disabled={isConnectingTelegram}
              className="bg-[#2AABEE] hover:bg-[#229ED9] text-white px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg shadow-[#2AABEE]/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <span className={`material-symbols-outlined text-lg ${isConnectingTelegram ? 'animate-spin' : ''}`}>
                {isConnectingTelegram ? 'progress_activity' : 'send'}
              </span>
              {isConnectingTelegram ? 'Đang lấy link...' : 'Kết nối Telegram'}
            </button>
          )}

          {/* Nút Tải tài liệu */}
          <button 
            onClick={() => navigate('/documents')}
            className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary/20 transition-all"
          >
            <span className="material-symbols-outlined text-lg">upload_file</span>
            Tải tài liệu mới
          </button>
        </div>
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