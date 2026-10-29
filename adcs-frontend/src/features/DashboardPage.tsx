import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats, getRecentDocuments, type DashboardStatsResponse, type DocumentResponse } from '../api/document';
import { departmentApi } from '../api/department';
import { userApi } from '../api/user';
import { feedbackApi, type FeedbackItem } from '../api/feedback';
import { usePermission } from '../hooks/usePermission';
import { ProcessingDetailModal } from './history/ProcessingDetailModal';
import toast from 'react-hot-toast';
import PendingAccountNotice from './auth/components/PendingAccountNotice';

const ActiveDashboardPage: React.FC = () => {
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
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

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
      toast.error('Vui lòng đăng nhập lại để tiếp tục!');
      navigate('/login', { replace: true });
      return;
    }
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && (parsedUser.name || parsedUser.username)) {
          setUserName(parsedUser.name || parsedUser.username);
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
        window.open(response.link, '_blank', 'noopener,noreferrer');
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
    setIsDisconnectingTelegram(true);
    try {
      await userApi.disconnectTelegram();
      setIsTelegramConnected(false);
      setTelegramChatId(null);
      setShowDisconnectConfirm(false);
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
      case 'approved':
      case 'hoàn tất':
        return {
          label: 'Hoàn tất',
          badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60',
          dotClass: 'bg-emerald-500',
          isPulsing: false,
        };
      case 'processing':
      case 'đang xử lý':
        return {
          label: 'Đang xử lý',
          badgeClass: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border-blue-200 dark:border-blue-800/60',
          dotClass: 'bg-blue-500',
          isPulsing: true,
        };
      case 'queued':
      case 'pending':
      case 'chờ xử lý':
        return {
          label: 'Chờ xử lý',
          badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200 dark:border-amber-800/60',
          dotClass: 'bg-amber-500',
          isPulsing: false,
        };
      case 'failed':
      case 'lỗi':
        return {
          label: 'Lỗi',
          badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border-rose-200 dark:border-rose-800/60',
          dotClass: 'bg-rose-500',
          isPulsing: false,
        };
      default:
        return {
          label: status || 'Chờ xác minh',
          badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200 dark:border-amber-800/60',
          dotClass: 'bg-amber-500',
          isPulsing: false,
        };
    }
  };

  const displayStats = [
    {
      title: 'Tổng tài liệu hệ thống',
      value: stats?.total_documents?.toLocaleString() || '0',
      subtitle: 'Tài liệu đã được tiếp nhận & số hóa',
      icon: 'description',
      trend: 'Trực tuyến',
      iconWrapClass: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 border-blue-100 dark:border-blue-900/50',
      trendClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
    },
    {
      title: 'Đang chờ / Đang xử lý AI',
      value: stats?.pending_documents?.toString() || '0',
      subtitle: 'Hàng đợi OCR & Phân tích LLM',
      icon: 'pending_actions',
      trend: 'Hàng đợi',
      iconWrapClass: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border-amber-100 dark:border-amber-900/50',
      trendClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
    },
    ...(isAdmin
      ? [
          {
            title: 'Người dùng được phân quyền',
            value: stats?.new_users?.toString() || '0',
            subtitle: 'Tài khoản cán bộ hoạt động',
            icon: 'group',
            trend: 'Hệ thống',
            iconWrapClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50',
            trendClass: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
          },
        ]
      : [
          {
            title: 'Trạng thái Telegram Bot',
            value: isTelegramConnected ? 'Đã kết nối' : 'Chưa liên kết',
            subtitle: isTelegramConnected ? `Chat ID: ${telegramChatId || 'Hoạt động'}` : 'Bấm kết nối để nhận tin tức thì',
            icon: 'send',
            trend: isTelegramConnected ? 'Hoạt động' : 'Cần thiết lập',
            iconWrapClass: 'bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400 border-sky-100 dark:border-sky-900/50',
            trendClass: isTelegramConnected
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
          },
        ]),
  ];

  const quickActions = [
    {
      title: 'Xử lý văn bản mới',
      desc: 'Tải lên PDF/Ảnh để bóc tách OCR & gợi ý phòng ban',
      icon: 'upload_file',
      path: '/documents',
      color: 'text-primary bg-primary/10 border-primary/20',
    },
    {
      title: 'Văn bản của tôi',
      desc: 'Theo dõi tiến trình hàng đợi & tải lên hàng loạt',
      icon: 'folder_shared',
      path: '/documents/my',
      color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200/60 dark:border-blue-800/50',
    },
    {
      title: 'Kho lưu trữ văn bản',
      desc: 'Tra cứu và quản lý văn bản tập trung toàn hệ thống',
      icon: 'manage_search',
      path: '/document-repository',
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-800/50',
    },
    {
      title: 'Dịch thuật tài liệu AI',
      desc: 'Dịch văn bản hành chính đa ngôn ngữ chuẩn định dạng',
      icon: 'translate',
      path: '/translation',
      color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border-purple-200/60 dark:border-purple-800/50',
    },
  ];

  if (loading) {
    return (
      <div className="p-8 flex flex-col justify-center items-center h-96 gap-3">
        <span className="animate-spin material-symbols-outlined text-4xl text-primary">sync</span>
        <p className="text-sm text-slate-500 font-medium">Đang tải dữ liệu bảng điều khiển...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center gap-3">
          <span className="material-symbols-outlined text-2xl">error</span>
          <div>
            <h3 className="font-bold text-sm">Không thể tải dữ liệu bảng điều khiển</h3>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6 animate-fade-in">
      {/* Welcome Banner Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-wider">
            <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
            <span>Hệ thống phân loại văn bản PTIT ADCS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white pt-1">
            Xin chào, {userName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Theo dõi thống kê xử lý văn bản bằng AI, kết nối thông báo Telegram và truy cập nhanh các phân hệ.
          </p>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex items-center gap-3 flex-wrap">
          {isTelegramConnected ? (
            <div className="flex items-center bg-slate-50 dark:bg-slate-800/80 border border-emerald-500/30 rounded-xl p-1 gap-1 flex-wrap">
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-semibold text-xs cursor-default select-none"
                title={`Đã kết nối Telegram (Chat ID: ${telegramChatId || 'Hoạt động'})`}
              >
                <span className="material-symbols-outlined text-base text-emerald-600 dark:text-emerald-400">
                  check_circle
                </span>
                <span>Đã kết nối Telegram</span>
              </div>

              <button
                type="button"
                onClick={() => handleConnectTelegram(true)}
                disabled={isConnectingTelegram}
                title="Kết nối lại hoặc đổi sang tài khoản Telegram khác"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                <span className={`material-symbols-outlined text-sm text-[#2AABEE] ${isConnectingTelegram ? 'animate-spin' : ''}`}>
                  {isConnectingTelegram ? 'progress_activity' : 'swap_horiz'}
                </span>
                <span>{isConnectingTelegram ? 'Đang mở...' : 'Đổi tài khoản'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowDisconnectConfirm(true)}
                disabled={isDisconnectingTelegram}
                title="Hủy liên kết Telegram"
                className="flex items-center justify-center p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <span className={`material-symbols-outlined text-base ${isDisconnectingTelegram ? 'animate-spin' : ''}`}>
                  {isDisconnectingTelegram ? 'progress_activity' : 'link_off'}
                </span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => handleConnectTelegram(false)}
              disabled={isConnectingTelegram}
              className="bg-[#2AABEE] hover:bg-[#229ED9] text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-[#2AABEE]/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              <span className={`material-symbols-outlined text-lg ${isConnectingTelegram ? 'animate-spin' : ''}`}>
                {isConnectingTelegram ? 'progress_activity' : 'send'}
              </span>
              {isConnectingTelegram ? 'Đang lấy link...' : 'Kết nối Telegram'}
            </button>
          )}

          <button
            type="button"
            onClick={() => navigate('/documents')}
            className="bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-primary/20 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">upload_file</span>
            <span>Tải tài liệu mới</span>
          </button>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {displayStats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`size-11 rounded-xl border flex items-center justify-center ${stat.iconWrapClass}`}>
                <span className="material-symbols-outlined text-2xl">{stat.icon}</span>
              </div>
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${stat.trendClass}`}>
                {stat.trend}
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {stat.title}
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 tracking-tight">
                {stat.value}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                {stat.subtitle}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Lối tắt truy cập nhanh (Quick Actions) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => navigate(item.path)}
            className="group text-left bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-primary/40 dark:hover:border-primary/40 shadow-sm hover:shadow-md transition-all flex items-start gap-3.5 cursor-pointer"
          >
            <div className={`size-10 rounded-xl border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${item.color}`}>
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors truncate">
                  {item.title}
                </h4>
                <span className="material-symbols-outlined text-sm text-slate-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all">
                  arrow_forward
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {item.desc}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">schedule</span>
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white leading-tight">
                Tài liệu xử lý gần đây
              </h3>
              <p className="text-xs text-slate-500 hidden sm:block">
                Nhấn vào một dòng bất kỳ để xem chi tiết kết quả bóc tách AI
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/documents/my')}
            className="text-xs sm:text-sm font-bold text-primary hover:underline flex items-center gap-1 transition-colors cursor-pointer shrink-0"
          >
            <span>Xem tất cả</span>
            <span className="material-symbols-outlined text-base">chevron_right</span>
          </button>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[720px]">
            <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <tr>
                {['Tên tài liệu / Trích yếu', 'Số ký hiệu', 'Phòng ban phân bổ', 'Trạng thái AI', 'Ngày nhận', 'Thao tác'].map((th, i) => (
                  <th
                    key={i}
                    className={`px-5 sm:px-6 py-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ${
                      th === 'Thao tác' ? 'text-right' : ''
                    }`}
                  >
                    {th}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {recentDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <span className="material-symbols-outlined text-4xl opacity-40 block mb-2">inbox</span>
                    <span className="text-sm">Chưa có tài liệu nào được xử lý gần đây</span>
                  </td>
                </tr>
              ) : (
                recentDocs.map((doc) => {
                  const uiConfig = getStatusUI(doc.status);
                  const displayName = doc.trich_yeu || doc.original_filename || (doc as any).title || `Văn bản_${doc.document_id.substring(0, 8)}`;
                  const docNumber = doc.so_ky_hieu || doc.so_den || (doc as any).document_number || 'Đang cập nhật';
                  const deptName = doc.assigned_department_id
                    ? departmentMap[String(doc.assigned_department_id)] || doc.assigned_department_id
                    : 'Chưa phân bổ';

                  return (
                    <tr
                      key={doc.document_id}
                      onClick={() => {
                        setSelectedDocId(doc.document_id);
                        setIsDetailModalOpen(true);
                      }}
                      className="hover:bg-slate-50/90 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                      title="Nhấn để xem chi tiết thông tin văn bản"
                    >
                      <td className="px-5 sm:px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="size-9 bg-primary/10 text-primary rounded-lg flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-lg">description</span>
                          </div>
                          <div className="min-w-0">
                            <span
                              className="text-sm font-semibold text-slate-900 dark:text-slate-100 max-w-[280px] sm:max-w-[340px] truncate block group-hover:text-primary transition-colors"
                              title={displayName}
                            >
                              {displayName}
                            </span>
                            {doc.original_filename && doc.trich_yeu && (
                              <span className="text-[11px] text-slate-400 truncate block max-w-[260px]">
                                {doc.original_filename}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 sm:px-6 py-3.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {docNumber}
                      </td>
                      <td className="px-5 sm:px-6 py-3.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-[200px] truncate" title={String(deptName)}>
                        {deptName}
                      </td>
                      <td className="px-5 sm:px-6 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${uiConfig.badgeClass}`}>
                          <span className={`size-1.5 rounded-full ${uiConfig.dotClass} ${uiConfig.isPulsing ? 'animate-pulse' : ''}`}></span>
                          {uiConfig.label} {doc.confidence ? `(${Math.round(doc.confidence * 100)}%)` : ''}
                        </span>
                      </td>
                      <td className="px-5 sm:px-6 py-3.5 text-xs sm:text-sm text-slate-500 whitespace-nowrap">
                        {doc.ngay_van_ban
                          ? new Date(doc.ngay_van_ban).toLocaleDateString('vi-VN')
                          : doc.updated_at
                          ? new Date(doc.updated_at).toLocaleDateString('vi-VN')
                          : 'N/A'}
                      </td>
                      <td className="px-5 sm:px-6 py-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            setSelectedDocId(doc.document_id);
                            setIsDetailModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-primary hover:text-white text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
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

      {/* Admin Only: Danh sách Ý kiến & Góp ý từ người dùng */}
      {isAdmin && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-lg">rate_review</span>
              </div>
              <div>
                <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white leading-tight">
                  Ý kiến & Góp ý từ người dùng
                </h3>
                <p className="text-xs text-slate-500">
                  Phản hồi và đề xuất gửi từ các tài khoản trong hệ thống
                </p>
              </div>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              Tổng số: {feedbacks.length}
            </span>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[680px]">
              <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-5 sm:px-6 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-56">Người gửi</th>
                  <th className="px-5 sm:px-6 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-40">Phân loại</th>
                  <th className="px-5 sm:px-6 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nội dung góp ý</th>
                  <th className="px-5 sm:px-6 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-44 text-right">Thời gian gửi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {loadingFeedbacks ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                      <span className="inline-block animate-spin material-symbols-outlined text-2xl text-primary">sync</span>
                      <p className="text-xs mt-1">Đang tải danh sách góp ý...</p>
                    </td>
                  </tr>
                ) : feedbacks.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-slate-400">
                      <span className="material-symbols-outlined text-3xl opacity-40 mb-1 block">inbox</span>
                      <p className="text-sm">Chưa có ý kiến góp ý nào từ người dùng</p>
                    </td>
                  </tr>
                ) : (
                  feedbacks.map((fb: FeedbackItem) => {
                    const badge = getFeedbackTypeBadge(fb.feedback_type);
                    const senderInitial = (fb.user_name || fb.user_email || 'U').charAt(0).toUpperCase();

                    return (
                      <tr key={fb.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 sm:px-6 py-4 align-top">
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

                        <td className="px-5 sm:px-6 py-4 align-top whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${badge.className}`}>
                            <span className="material-symbols-outlined text-sm">{badge.icon}</span>
                            <span>{badge.label}</span>
                          </span>
                        </td>

                        <td className="px-5 sm:px-6 py-4 align-top">
                          <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed break-words font-normal">
                            {fb.content}
                          </p>
                        </td>

                        <td className="px-5 sm:px-6 py-4 align-top text-right text-xs text-slate-500 whitespace-nowrap">
                          {fb.created_at
                            ? new Date(fb.created_at).toLocaleString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              })
                            : 'Vừa xong'}
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

      {/* Modal Xác nhận hủy liên kết Telegram */}
      {showDisconnectConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-up">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <span className="material-symbols-outlined text-3xl">link_off</span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Hủy liên kết Telegram?</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              Bạn có chắc chắn muốn hủy liên kết tài khoản Telegram này không? Bạn có thể kết nối lại hoặc đổi sang tài khoản Telegram khác bất cứ lúc nào.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDisconnectConfirm(false)}
                disabled={isDisconnectingTelegram}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Giữ lại
              </button>
              <button
                type="button"
                onClick={handleDisconnectTelegram}
                disabled={isDisconnectingTelegram}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {isDisconnectingTelegram ? 'Đang hủy...' : 'Xác nhận hủy'}
              </button>
            </div>
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

const DashboardPage: React.FC = () => {
  const { isPending } = usePermission();
  return isPending ? <PendingAccountNotice /> : <ActiveDashboardPage />;
};

export default DashboardPage;
