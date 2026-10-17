import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { userApi, type UserProfile, type TelegramStatusResponse } from '../../api/user';

type TabType = 'profile' | 'security' | 'telegram';

const ProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // State cho Tab 1: Thông tin cá nhân
  const [username, setUsername] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // State cho Tab 2: Đổi mật khẩu
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);

  // State cho Tab 3: Telegram
  const [telegramStatus, setTelegramStatus] = useState<TelegramStatusResponse | null>(null);
  const [isLoadingTelegram, setIsLoadingTelegram] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Fetch thông tin profile
  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const data = await userApi.getProfile();
      setProfile(data);
      setUsername(data.username || '');
    } catch (error: any) {
      console.error('Lỗi tải thông tin cá nhân:', error);
      toast.error(error.response?.data?.detail || 'Không thể tải thông tin cá nhân');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch trạng thái telegram
  const fetchTelegramStatus = async () => {
    try {
      setIsLoadingTelegram(true);
      const data = await userApi.getTelegramStatus();
      setTelegramStatus(data);
    } catch (error: any) {
      console.error('Lỗi tải trạng thái Telegram:', error);
    } finally {
      setIsLoadingTelegram(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchTelegramStatus();
  }, []);

  // Xử lý cập nhật thông tin cá nhân
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error('Họ và tên không được để trống');
      return;
    }

    try {
      setIsUpdatingProfile(true);
      const updated = await userApi.updateProfile({ username: username.trim() });
      setProfile(updated);
      
      // Đồng bộ lại thông tin lưu trong localStorage/sessionStorage
      const stored = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          parsed.username = updated.username;
          if (localStorage.getItem('user')) {
            localStorage.setItem('user', JSON.stringify(parsed));
          } else {
            sessionStorage.setItem('user', JSON.stringify(parsed));
          }
        } catch (e) {
          console.error(e);
        }
      }

      toast.success('Cập nhật thông tin thành công!');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Lỗi khi cập nhật thông tin');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Tính toán độ mạnh mật khẩu
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pass)) score++;
    return score;
  };

  const passStrength = getPasswordStrength(newPassword);

  const getStrengthLabel = (score: number) => {
    if (score <= 2) return { text: 'Yếu', color: 'bg-red-500', width: 'w-1/4', textColor: 'text-red-500' };
    if (score <= 4) return { text: 'Trung bình', color: 'bg-amber-500', width: 'w-3/4', textColor: 'text-amber-500' };
    return { text: 'Rất mạnh', color: 'bg-green-500', width: 'w-full', textColor: 'text-green-500' };
  };

  // Xử lý đổi mật khẩu
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      toast.error('Vui lòng nhập mật khẩu hiện tại');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Mật khẩu mới phải có ít nhất 8 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    if (passStrength < 4) {
      toast.error('Mật khẩu cần đáp ứng: tối thiểu 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt');
      return;
    }

    try {
      setIsChangingPass(true);
      const res = await userApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword
      });
      toast.success(res.message || 'Đổi mật khẩu thành công!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Lỗi khi đổi mật khẩu');
    } finally {
      setIsChangingPass(false);
    }
  };

  // Xử lý hủy liên kết Telegram
  const handleDisconnectTelegram = async () => {
    try {
      setIsDisconnecting(true);
      await userApi.disconnectTelegram();
      toast.success('Đã hủy liên kết Telegram thành công!');
      setShowDisconnectModal(false);
      fetchTelegramStatus();
      if (profile) {
        setProfile({ ...profile, is_telegram_connected: false, telegram_chat_id: null });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Lỗi khi hủy liên kết Telegram');
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Đang tải thông tin hồ sơ...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 animate-fade-in font-display">
      {/* Header trang */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5 tracking-tight">
            <span className="material-symbols-outlined text-primary text-[28px]">manage_accounts</span>
            Hồ sơ cá nhân & Bảo mật
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Quản lý thông tin tài khoản, mật khẩu đăng nhập và kết nối nhận thông báo Telegram.
          </p>
        </div>
      </div>

      {/* Tabs Điều Hướng */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'profile'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">person</span>
          Thông tin cá nhân
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'security'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">lock</span>
          Đổi mật khẩu
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('telegram')}
          className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'telegram'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">send</span>
          Quản lý Telegram
          {telegramStatus?.is_connected ? (
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
          ) : (
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
          )}
        </button>
      </div>

      {/* Nội dung Tab 1: Thông tin cá nhân */}
      {activeTab === 'profile' && profile && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card tóm tắt người dùng */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col items-center text-center shadow-sm">
            <div className="w-24 h-24 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-3xl mb-4 border-2 border-primary/20">
              {profile.username ? profile.username.charAt(0).toUpperCase() : 'U'}
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{profile.username}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{profile.email}</p>

            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              <span className="px-3 py-1 bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300 text-xs font-semibold rounded-full border border-red-200 dark:border-red-800/40">
                {profile.role_name || 'Cán bộ'}
              </span>
              <span className="px-3 py-1 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300 text-xs font-semibold rounded-full border border-blue-200 dark:border-blue-800/40">
                {profile.department_name || 'Phòng ban nội bộ'}
              </span>
            </div>

            <div className="w-full border-t border-slate-100 dark:border-slate-800 mt-6 pt-6 text-left space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Trạng thái tài khoản:</span>
                <span className="font-bold text-green-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  Hoạt động
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Kết nối Telegram:</span>
                {profile.is_telegram_connected ? (
                  <span className="font-bold text-green-600">Đã kết nối</span>
                ) : (
                  <span className="font-bold text-amber-500">Chưa liên kết</span>
                )}
              </div>
            </div>
          </div>

          {/* Form chỉnh sửa thông tin */}
          <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">badge</span>
              Chi tiết tài khoản
            </h3>

            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
                  Địa chỉ Email (Tài khoản SSO PTIT)
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 text-slate-500 text-sm px-4 py-3 cursor-not-allowed outline-none font-medium"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-[18px]">
                    lock
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Email được cố định theo tài khoản nhà trường.</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
                  Họ và tên hiển thị <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Nhập họ và tên..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-white text-sm px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-medium"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
                    Phòng ban / Đơn vị
                  </label>
                  <input
                    type="text"
                    value={profile.department_name || 'Chưa gán đơn vị'}
                    disabled
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 text-slate-500 text-sm px-4 py-3 cursor-not-allowed outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
                    Vai trò hệ thống
                  </label>
                  <input
                    type="text"
                    value={profile.role_name || 'Cán bộ'}
                    disabled
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 text-slate-500 text-sm px-4 py-3 cursor-not-allowed outline-none font-medium"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="px-6 py-3 bg-primary hover:bg-primary/90 text-white font-bold text-sm rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isUpdatingProfile ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">save</span>
                      <span>Lưu thay đổi</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Nội dung Tab 2: Đổi mật khẩu */}
      {activeTab === 'security' && (
        <div className="max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">password</span>
            Đổi mật khẩu tài khoản
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            Mật khẩu mới cần tối thiểu 8 ký tự, bao gồm chữ in hoa, in thường, chữ số và ký tự đặc biệt.
          </p>

          <form onSubmit={handleChangePassword} className="space-y-5">
            {/* Mật khẩu hiện tại */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
                Mật khẩu hiện tại <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showCurrentPass ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="Nhập mật khẩu hiện tại..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-white text-sm px-4 py-3 pr-10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showCurrentPass ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Mật khẩu mới */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
                Mật khẩu mới <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showNewPass ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Nhập mật khẩu mới..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-white text-sm px-4 py-3 pr-10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showNewPass ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>

              {/* Thanh đo độ mạnh mật khẩu */}
              {newPassword.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Độ an toàn:</span>
                    <span className={`font-bold ${getStrengthLabel(passStrength).textColor}`}>
                      {getStrengthLabel(passStrength).text}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-300 ${getStrengthLabel(passStrength).color} ${getStrengthLabel(passStrength).width}`}></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 mt-2">
                    <span className={newPassword.length >= 8 ? 'text-green-500 font-medium' : ''}>✓ Ít nhất 8 ký tự</span>
                    <span className={/[A-Z]/.test(newPassword) ? 'text-green-500 font-medium' : ''}>✓ Chữ in hoa (A-Z)</span>
                    <span className={/[0-9]/.test(newPassword) ? 'text-green-500 font-medium' : ''}>✓ Chữ số (0-9)</span>
                    <span className={/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? 'text-green-500 font-medium' : ''}>✓ Ký tự đặc biệt (!@#$)</span>
                  </div>
                </div>
              )}
            </div>

            {/* Xác nhận mật khẩu mới */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
                Xác nhận mật khẩu mới <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPass ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Nhập lại mật khẩu mới..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-white text-sm px-4 py-3 pr-10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showConfirmPass ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-[11px] text-red-500 mt-1">Mật khẩu xác nhận không trùng khớp.</p>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={isChangingPass}
                className="px-6 py-3 bg-primary hover:bg-primary/90 text-white font-bold text-sm rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isChangingPass ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Đang cập nhật...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                    <span>Cập nhật mật khẩu</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Nội dung Tab 3: Quản lý Telegram */}
      {activeTab === 'telegram' && (
        <div className="max-w-3xl space-y-6">
          {isLoadingTelegram ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              Đang kiểm tra kết nối Telegram...
            </div>
          ) : telegramStatus?.is_connected ? (
            /* Trạng thái: Đã kết nối */
            <div className="bg-white dark:bg-slate-900 border border-green-200 dark:border-green-900/40 rounded-2xl p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-950/40 text-green-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[28px]">mark_chat_read</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      Đã liên kết tài khoản Telegram
                      <span className="px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-black uppercase">
                        Hoạt động
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Telegram Chat ID: <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{telegramStatus.telegram_chat_id}</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowDisconnectModal(true)}
                  className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">link_off</span>
                  Hủy liên kết
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 space-y-2">
                <p className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                  <span className="material-symbols-outlined text-[16px] text-green-500">check_circle</span>
                  Hệ thống sẽ tự động gửi thông báo đến bot <strong className="text-primary">@{telegramStatus.bot_name}</strong> mỗi khi bạn nhận được văn bản mới hoặc hoàn tất phân loại.
                </p>
                <p className="text-slate-400">
                  Nếu muốn đổi sang số điện thoại hoặc tài khoản Telegram khác, vui lòng bấm "Hủy liên kết" rồi kết nối lại.
                </p>
              </div>
            </div>
          ) : (
            /* Trạng thái: Chưa kết nối */
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[28px]">notifications_active</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Chưa kích hoạt nhận tin qua Telegram
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Liên kết với Telegram Bot nội bộ để nhận thông báo tức thì ngay khi có công văn mới được phân công cho phòng ban của bạn.
                  </p>
                </div>
              </div>

              {/* Các bước kết nối */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-100 dark:border-slate-800 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Hướng dẫn kết nối trong 2 bước đơn giản:
                </h4>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    1
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 leading-normal">
                    Bấm vào nút <strong>"Mở Telegram Bot"</strong> bên dưới để chuyển hướng đến ứng dụng Telegram.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    2
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 leading-normal">
                    Bấm <strong>Start</strong> trong khung chat của Bot. Hệ thống ADCS sẽ tự động xác thực và liên kết tài khoản của bạn.
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                {telegramStatus?.link && (
                  <a
                    href={telegramStatus.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-[#229ED9] hover:bg-[#1E88E5] text-white font-bold text-sm rounded-xl shadow-lg shadow-sky-500/20 transition-all flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[20px]">send</span>
                    <span>Mở Telegram Bot (@{telegramStatus.bot_name})</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={fetchTelegramStatus}
                  className="px-5 py-3 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">refresh</span>
                  <span>Kiểm tra lại trạng thái</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal xác nhận Hủy liên kết Telegram */}
      {showDisconnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <span className="material-symbols-outlined text-[28px]">warning</span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Xác nhận hủy liên kết?</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              Bạn sẽ không còn nhận được các thông báo công văn và tài liệu mới qua Telegram cho đến khi thực hiện liên kết lại.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDisconnectModal(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isDisconnecting}
                onClick={handleDisconnectTelegram}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
              >
                {isDisconnecting ? 'Đang hủy...' : 'Đồng ý hủy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
