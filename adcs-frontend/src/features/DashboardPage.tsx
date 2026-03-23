import React from 'react';

const STATS_DATA = [
  { title: 'Tổng tài liệu', value: '12,840', icon: 'description', trend: '+12.5%', color: 'blue', trendColor: 'emerald' },
  { title: 'Đang xử lý', value: '42', icon: 'pending_actions', trend: 'Cần xử lý', color: 'amber', trendColor: 'amber' },
  { title: 'Chính xác AI', value: '98.4%', icon: 'psychology', trend: 'PTIT Red', color: 'primary', trendColor: 'primary' },
  { title: 'Người dùng mới', value: '156', icon: 'group', trend: '12 Phòng', color: 'emerald', trendColor: 'slate' },
];

const RECENT_DOCS = [
  { name: 'QD_TuyenDung_2024.pdf', type: 'Quyết định', dept: 'Nhân sự', status: 'Hoàn tất (99%)', statusColor: 'emerald', icon: 'picture_as_pdf' },
  { name: 'CV_Project_Alpha.docx', type: 'Công văn', dept: 'Kế hoạch', status: 'Đang quét...', statusColor: 'blue', icon: 'description', isPulsing: true },
  { name: 'Hoa_Don_00122.jpg', type: 'Hóa đơn', dept: 'Kế toán', status: 'Đợi xác minh', statusColor: 'amber', icon: 'image' },
];

const DashboardPage: React.FC = () => {
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
            {STATS_DATA.map((stat, idx) => (
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
            {/* Performance Chart Mockup */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="font-bold text-lg">Hiệu suất trích xuất AI (PTIT Red)</h3>
                  <p className="text-sm text-slate-500">Thống kê theo tuần qua</p>
                </div>
                <select className="bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-xs font-bold text-slate-600 outline-none p-2">
                  <option>7 ngày qua</option>
                  <option>30 ngày qua</option>
                </select>
              </div>
              <div className="h-64 flex items-end gap-2 px-2">
                {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day, idx) => {
                  const heights = ['60%', '75%', '85%', '55%', '90%', '70%', '40%'];
                  const innerHeights = ['80%', '90%', '95%', '70%', '100%', '85%', '60%'];
                  return (
                    <div key={idx} className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-t-lg relative group hover:bg-primary/20 transition-colors" style={{ height: heights[idx] }}>
                      <div className="absolute bottom-0 w-full bg-primary rounded-t-lg transition-all" style={{ height: innerHeights[idx] }}></div>
                      <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-400">{day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Urgent Documents */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col">
              <div className="p-6 border-b border-slate-50 dark:border-slate-800">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">priority_high</span>
                  Cần xử lý gấp
                </h3>
              </div>
              <div className="flex-1 p-4 space-y-3">
                <div className="p-3 rounded-lg border border-primary/10 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer group">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">Hợp đồng LĐ - 2024</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Yêu cầu xác minh chữ ký AI</p>
                    </div>
                    <span className="text-[10px] font-bold text-primary uppercase">Mới</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-xs text-slate-400">schedule</span>
                    <span className="text-[10px] font-medium text-slate-400">2 giờ trước</span>
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-slate-50 dark:border-slate-800 text-center">
                <button className="text-xs font-bold text-primary hover:underline">Xem tất cả</button>
              </div>
            </div>
          </div>

          {/* Recent Activity Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-lg">Tài liệu xử lý gần đây</h3>
              <button className="text-sm font-semibold text-slate-500 hover:text-primary">Xem tất cả</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    {['Tên tài liệu', 'Loại', 'Phòng ban', 'Trạng thái AI', 'Hành động'].map((th, i) => (
                      <th key={i} className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">{th}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {RECENT_DOCS.map((doc, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-8 bg-primary/5 text-primary rounded flex items-center justify-center">
                            <span className="material-symbols-outlined text-lg">{doc.icon}</span>
                          </div>
                          <span className="text-sm font-semibold">{doc.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">{doc.type}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{doc.dept}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-${doc.statusColor}-100 text-${doc.statusColor}-700 dark:bg-${doc.statusColor}-900/30 dark:text-${doc.statusColor}-400`}>
                          <span className={`size-1.5 rounded-full bg-${doc.statusColor}-500 ${doc.isPulsing ? 'animate-pulse' : ''}`}></span>
                          {doc.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button className="text-slate-400 hover:text-primary"><span className="material-symbols-outlined">visibility</span></button>
                        <button className="text-slate-400 hover:text-primary ml-3"><span className="material-symbols-outlined">download</span></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
    </div>
  );
};

export default DashboardPage;