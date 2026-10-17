import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { getDashboardStats, getRecentDocuments, type DashboardStatsResponse, type DocumentResponse } from '../api/document';
import { departmentApi } from '../api/department';
import { userApi } from '../api/user';
import { feedbackApi, type FeedbackItem } from '../api/feedback';
import { usePermission } from '../hooks/usePermission';
import { ProcessingDetailModal } from './history/ProcessingDetailModal';
import toast from 'react-hot-toast';

const DashboardPage: React.FC = () => {
  const { isAdmin } = usePermission();
  const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
  const [recentDocs, setRecentDocs] = useState<DocumentResponse[]>([]);
  const [departmentMap, setDepartmentMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State quản lý xem chi tiết tài liệu
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  // State quản lý góp ý từ người dùng (dành cho Admin)
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState<boolean>(false);

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
        const [statsData, docsData, deptsData] = await Promise.all([
          getDashboardStats(),
          getRecentDocuments(5),
          departmentApi.getAll().catch(() => [])
        ]);
        
        setStats(statsData);
        setRecentDocs(docsData);

        const mapping: Record<string, string> = {};
        const traverse = (nodes: any[]) => {
          nodes.forEach(n => {
            if (n.department_id) mapping[String(n.department_id)] = n.ten_hien_thi || n.name;
            if (n.id) mapping[String(n.id)] = n.ten_hien_thi || n.name;
            if (n.children && n.children.length > 0) traverse(n.children);
          });
        };
        traverse(deptsData || []);
        setDepartmentMap(mapping);

      } catch (err: any) {
        setError(err.message || 'Lỗi khi tải dữ liệu dashboard');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      setLoadingFeedbacks(true);
      feedbackApi.getAllFeedbacks(0, 50)
        .then(res => setFeedbacks(res.items || []))
        .catch(err => console.error('Lỗi khi tải danh sách góp ý:', err))
        .finally(() => setLoadingFeedbacks(false));
    }
  }, [isAdmin]);

  const getFeedbackTypeBadge = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'bug':
        return {
          label: 'Báo lỗi',
          icon: 'bug_report',
          className: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border-rose-200 dark:border-rose-800'
        };
      case 'feature':
        return {
          label: 'Tính năng mới',
          icon: 'lightbulb',
          className: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border-blue-200 dark:border-blue-800'
        };
      case 'improvement':
        return {
          label: 'Cải tiến',
          icon: 'auto_awesome',
          className: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400 border-purple-200 dark:border-purple-800'
        };
      default:
        return {
          label: 'Khác',
          icon: 'chat_bubble',
          className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
        };
    }
  };

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
      case 'processed':
      case 'success':
      case 'hoàn tất':
        return { label: 'Hoàn tất', color: 'emerald', isPulsing: false };
      case 'processing':
      case 'đang xử lý':
        return { label: 'Đang xử lý', color: 'blue', isPulsing: true };
      case 'queued':
      case 'pending':
      case 'chờ xử lý':
        return { label: 'Chờ xử lý', color: 'amber', isPulsing: false };
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
    ...(isAdmin ? [
      { title: 'Người dùng được phân quyền', value: stats?.new_users?.toString() || '0', icon: 'group', trend: 'Hệ thống', color: 'emerald', trendColor: 'slate' }
    ] : [])
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
      <div className={`grid grid-cols-1 ${isAdmin ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2'} gap-6`}>
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
            <button 
              onClick={() => navigate('/documents/my')}
              className="text-sm font-semibold text-slate-500 hover:text-primary transition-colors cursor-pointer"
            >
              Xem tất cả
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  {['Tên tài liệu', 'Loại/Số hiệu', 'Phòng ban', 'Trạng thái AI', 'Ngày nhận', 'Thao tác'].map((th, i) => (
                    <th key={i} className={`px-6 py-4 text-xs font-bold text-slate-500 uppercase ${th === 'Thao tác' ? 'text-right' : ''}`}>{th}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {recentDocs.length === 0 ? (
                   <tr><td colSpan={6} className="px-6 py-4 text-center text-slate-500">Chưa có tài liệu nào</td></tr>
                ) : (
                  recentDocs.map((doc) => {
                    const uiConfig = getStatusUI(doc.status);
                    const displayName = doc.trich_yeu || doc.original_filename || (doc as any).title || `Văn bản_${doc.document_id.substring(0,8)}`;
                    const docNumber = doc.so_ky_hieu || doc.so_den || (doc as any).document_number || 'Đang cập nhật';
                    const deptName = doc.assigned_department_id ? (departmentMap[String(doc.assigned_department_id)] || doc.assigned_department_id) : 'Chưa phân bổ';
                    
                    return (
                      <tr 
                        key={doc.document_id} 
                        onClick={() => {
                          setSelectedDocId(doc.document_id);
                          setIsDetailModalOpen(true);
                        }}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                        title="Nhấn để xem chi tiết thông tin văn bản"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="size-8 bg-primary/5 text-primary rounded flex items-center justify-center">
                              <span className="material-symbols-outlined text-lg">description</span>
                            </div>
                            <span className="text-sm font-semibold max-w-[280px] truncate group-hover:text-primary transition-colors" title={displayName}>{displayName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">{docNumber}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{deptName}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-${uiConfig.color}-100 text-${uiConfig.color}-700`}>
                            <span className={`size-1.5 rounded-full bg-${uiConfig.color}-500 ${uiConfig.isPulsing ? 'animate-pulse' : ''}`}></span>
                            {uiConfig.label} {doc.confidence ? `(${Math.round(doc.confidence * 100)}%)` : ''}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {doc.ngay_van_ban ? new Date(doc.ngay_van_ban).toLocaleDateString('vi-VN') : (doc.updated_at ? new Date(doc.updated_at).toLocaleDateString('vi-VN') : 'N/A')}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              setSelectedDocId(doc.document_id);
                              setIsDetailModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-primary/10 text-slate-700 dark:text-slate-300 hover:text-primary text-xs font-bold transition-all cursor-pointer"
                            title="Xem chi tiết kết quả xử lý"
                          >
                            <span className="material-symbols-outlined text-sm">visibility</span>
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
        </div>
      </div>

      {/* Admin Only: Danh sách Ý kiến & Góp ý từ người dùng */}
      {isAdmin && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-lg">rate_review</span>
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight">Ý kiến & Góp ý từ người dùng</h3>
                <p className="text-xs text-slate-500">Phản hồi và đề xuất gửi từ các tài khoản trong hệ thống</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              Tổng số: {feedbacks.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase w-52">Người gửi</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase w-36">Phân loại</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Nội dung góp ý</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase w-44 text-right">Thời gian gửi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {loadingFeedbacks ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                      <span className="inline-block animate-spin material-symbols-outlined text-2xl text-primary">sync</span>
                      <p className="text-xs mt-1">Đang tải danh sách góp ý...</p>
                    </td>
                  </tr>
                ) : feedbacks.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                      <span className="material-symbols-outlined text-3xl text-slate-300 dark:text-slate-600 mb-1">inbox</span>
                      <p className="text-sm">Chưa có ý kiến góp ý nào từ người dùng</p>
                    </td>
                  </tr>
                ) : (
                  feedbacks.map((fb: FeedbackItem) => {
                    const badge = getFeedbackTypeBadge(fb.feedback_type);
                    const senderInitial = (fb.user_name || fb.user_email || 'U').charAt(0).toUpperCase();

                    return (
                      <tr key={fb.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        {/* Người gửi */}
                        <td className="px-6 py-4 align-top">
                          <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-full bg-gradient-to-tr from-primary/80 to-primary text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                              {senderInitial}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                {fb.user_name || 'Người dùng ẩn danh'}
                              </p>
                              <p className="text-xs text-slate-500 truncate" title={fb.user_email || ''}>
                                {fb.user_email || 'Chưa cập nhật email'}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Phân loại */}
                        <td className="px-6 py-4 align-top">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${badge.className}`}>
                            <span className="material-symbols-outlined text-sm">{badge.icon}</span>
                            <span>{badge.label}</span>
                          </span>
                        </td>

                        {/* Nội dung góp ý */}
                        <td className="px-6 py-4 align-top">
                          <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed break-words font-normal">
                            {fb.content}
                          </p>
                        </td>

                        {/* Thời gian */}
                        <td className="px-6 py-4 align-top text-right text-xs text-slate-500 whitespace-nowrap">
                          {fb.created_at ? new Date(fb.created_at).toLocaleString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          }) : 'Vừa xong'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Xem Chi Tiết & Gửi Telegram */}
      <ProcessingDetailModal
        documentId={selectedDocId}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedDocId(null);
        }}
        isTelegramConnected={isTelegramConnected}
      />
    </div>
  );
};

export default DashboardPage;