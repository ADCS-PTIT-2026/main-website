import React, { useState } from 'react';

// --- Dữ liệu mẫu (Mock Data) ---
const RECENT_FILES = [
  { 
    id: 1, name: 'Hợp_đồng_kinh_tế_01.pdf', size: '1.2 MB', time: '2 phút trước', 
    status: 'Success', statusText: 'Hoàn tất', statusColor: 'emerald', icon: 'picture_as_pdf', progress: 100 
  },
  { 
    id: 2, name: 'Căn_cước_công_dân_A.jpg', size: '450 KB', time: 'Đang xử lý...', 
    status: 'Pending', statusText: 'Đang AI phân tích', statusColor: 'amber', icon: 'image', progress: 65 
  },
  { 
    id: 3, name: 'Báo_cáo_tài_chính_Q4.xlsx', size: '2.5 MB', time: '1 giờ trước', 
    status: 'Failed', statusText: 'Lỗi trích xuất', statusColor: 'rose', icon: 'description', progress: 0 
  },
];

export const summaryText = `
Đây là Hợp đồng thuê văn phòng giữa Công ty TNHH Giải pháp Công nghệ ABC và ông Nguyễn Văn A. 
Hợp đồng quy định việc thuê mặt bằng làm văn phòng trong thời hạn 12 tháng, bắt đầu từ ngày 01/10/2026. 
Giá trị thuê là 15.000.000 VNĐ/tháng, thanh toán định kỳ hàng tháng. 
Hai bên có trách nhiệm thực hiện đầy đủ nghĩa vụ tài chính và điều khoản sử dụng tài sản theo quy định trong hợp đồng.
`;

export const extracted = {
  document_number: "HD-2026/102-VP",
  signed_date: "01/10/2026",
  document_type: "Hợp đồng Kinh tế",

  // mở rộng thêm (nếu bạn muốn scale sau này)
  parties: {
    party_a: "Công ty TNHH Giải pháp Công nghệ ABC",
    party_b: "Nguyễn Văn A"
  },

  contract_value: "15.000.000 VNĐ/tháng",
  duration: "12 tháng",
  effective_date: "01/10/2026"
};

export const TOP_K_SUGGESTIONS = [
  {
    id: "dept_01",
    title: "Phòng Kế hoạch Tài chính",
    confidence: 0.98,
    active: true,
    metadata: "Xử lý hợp đồng tài chính"
  },
  {
    id: "dept_02",
    title: "Phòng Hành chính - Quản trị",
    confidence: 0.87,
    active: false,
    metadata: "Quản lý tài sản, văn phòng"
  },
  {
    id: "dept_03",
    title: "Phòng Pháp chế",
    confidence: 0.82,
    active: false,
    metadata: "Kiểm tra pháp lý hợp đồng"
  },
  {
    id: "dept_04",
    title: "Phòng Công nghệ Thông tin",
    confidence: 0.65,
    active: false,
    metadata: "Liên quan hệ thống CNTT"
  }
];

const DocumentPage: React.FC = () => {
  // State giả lập chọn file để xem chi tiết AI
  const [activeFileId, setActiveFileId] = useState<number>(1);

  return (
    <div className="flex flex-1 h-full overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
      
      {/* ----------------------------------------------------------------- */}
      {/* NỬA TRÁI: KHU VỰC TẢI LÊN & DANH SÁCH TÀI LIỆU */}
      {/* ----------------------------------------------------------------- */}
      <div className="w-2/5 flex flex-col border-r border-primary/10 bg-white dark:bg-slate-900 overflow-y-auto">
        <div className="p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Tiếp nhận tài liệu</h1>
            <p className="text-slate-500 text-sm">Hỗ trợ PDF, JPG, PNG để trích xuất dữ liệu OCR.</p>
          </div>

          {/* Dropzone Upload */}
          <div className="group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-10 text-center hover:border-primary hover:bg-primary/10 transition-all cursor-pointer">
            <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-4xl">cloud_upload</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Kéo và thả tệp tại đây</h3>
            <p className="mt-1 text-sm text-slate-500">Hoặc click để chọn tệp từ thiết bị của bạn</p>
            <p className="mt-4 text-xs font-medium text-slate-400">Dung lượng tối đa 25MB mỗi tệp</p>
          </div>

          {/* Danh sách tài liệu gần đây */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Danh sách gần đây</h3>
              <button className="text-sm text-primary font-medium hover:underline outline-none">Xem tất cả</button>
            </div>

            <div className="divide-y divide-primary/5 border border-primary/10 rounded-xl overflow-hidden">
              {RECENT_FILES.map((file) => (
                <div 
                  key={file.id}
                  onClick={() => file.status === 'Success' && setActiveFileId(file.id)}
                  className={`flex flex-col p-4 transition-colors ${
                    activeFileId === file.id ? 'bg-primary/5' : 'bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800'
                  } ${file.status === 'Success' ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary bg-primary/10 p-2 rounded-lg">{file.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{file.name}</p>
                        <p className="text-xs text-slate-500">{file.size} • {file.time}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {file.status === 'Pending' ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${file.statusColor}-100 text-${file.statusColor}-800 dark:bg-${file.statusColor}-900/30 dark:text-${file.statusColor}-400`}>
                          {file.statusText}
                        </span>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${file.statusColor}-100 text-${file.statusColor}-800 dark:bg-${file.statusColor}-900/30 dark:text-${file.statusColor}-400`}>
                          <span className={`h-1.5 w-1.5 rounded-full bg-${file.statusColor}-500 mr-1.5`}></span>
                          {file.statusText}
                        </span>
                      )}
                      
                      {file.status === 'Failed' ? (
                        <button className="text-slate-400 hover:text-primary"><span className="material-symbols-outlined">refresh</span></button>
                      ) : (
                        <button className="text-slate-400 hover:text-primary"><span className="material-symbols-outlined">more_vert</span></button>
                      )}
                    </div>
                  </div>

                  {/* Thanh tiến trình hiển thị riêng cho trạng thái Pending */}
                  {file.status === 'Pending' && (
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1">
                      <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${file.progress}%` }}></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* NỬA PHẢI: KẾT QUẢ XỬ LÝ AI */}
      {/* ----------------------------------------------------------------- */}
      <div className="w-3/5 flex flex-col bg-slate-50 dark:bg-slate-900/50 overflow-y-auto">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">auto_awesome</span>
              Chi tiết xử lý AI
            </h2>
          </div>

          {/* Vùng xem trước tài liệu (Preview) */}
          <div className="aspect-[4/2] w-full rounded-xl border border-primary/10 bg-white dark:bg-slate-800 shadow-sm overflow-hidden flex items-center justify-center relative group">
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100 dark:bg-slate-800/80">
               <span className="material-symbols-outlined text-6xl mb-2 opacity-50">plagiarism</span>
               <p className="text-sm">Bản xem trước tài liệu đang tải...</p>
            </div>
            <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors flex items-center justify-center">
              <button className="bg-white/90 backdrop-blur rounded-full p-3 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity outline-none">
                <span className="material-symbols-outlined text-slate-900">fullscreen</span>
              </button>
            </div>
            <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-2">
              <div className="bg-slate-900/80 backdrop-blur text-white px-3 py-1 rounded-full text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">zoom_in</span> 100%
              </div>
            </div>
          </div>

          {/* Khối Summary & Insights (sửa theo layout aside) */}
            <aside className="w-full flex flex-col gap-4 overflow-y-auto">
            {/* AI Summary Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-lg">psychology</span>
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">Tóm tắt AI</h3>
                <span className="ml-auto px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px] font-bold rounded-full uppercase tracking-wider">
                    Hoàn tất
                </span>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {/* thay bằng biến dynamic nếu có: summaryText */}
                {summaryText ?? 'Đây là Hợp đồng cung cấp dịch vụ phần mềm giữa Công ty A và Công ty B. Nội dung chính bao gồm việc triển khai hệ thống ERP, thời hạn 12 tháng, giá trị hợp đồng là 500,000,000 VND.'}
                </p>
            </div>

            {/* Extracted Data Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex-1">
                <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">database</span>
                    Dữ liệu trích xuất
                </h3>
                <button className="text-primary text-xs font-semibold hover:underline">Sửa tất cả</button>
                </div>

                <div className="space-y-5">
                {/* Field: Số văn bản */}
                <div className="space-y-1 group">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Số văn bản</label>
                    <div className="flex items-center gap-2">
                    <input
                        className="flex-1 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm font-medium focus:ring-1 focus:ring-primary h-10 px-3"
                        type="text"
                        readOnly
                        value={extracted?.document_number ?? "HD-2024/089-ERP"}
                    />
                    <button className="p-2 text-slate-400 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                    </div>
                </div>

                {/* Field: Ngày ban hành */}
                <div className="space-y-1 group">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Ngày ban hành</label>
                    <div className="flex items-center gap-2">
                    <input
                        className="flex-1 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm font-medium focus:ring-1 focus:ring-primary h-10 px-3"
                        type="text"
                        readOnly
                        value={extracted?.signed_date ?? "15/10/2023"}
                    />
                    <button className="p-2 text-slate-400 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-lg">calendar_today</span>
                    </button>
                    </div>
                </div>

                {/* Field: Loại tài liệu */}
                <div className="space-y-1 group">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Loại tài liệu</label>
                    <div className="flex items-center gap-2">
                    <select
                        className="flex-1 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm font-medium focus:ring-1 focus:ring-primary h-10 px-3 appearance-none"
                        defaultValue={extracted?.document_type ?? "Hợp đồng Kinh tế"}
                        disabled
                    >
                        <option>Hợp đồng Kinh tế</option>
                        <option>Công văn</option>
                        <option>Quyết định</option>
                    </select>
                    <button className="p-2 text-slate-400 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-lg">expand_more</span>
                    </button>
                    </div>
                </div>

                {/* Department Suggestion (Top-K) */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Đề xuất phòng ban</label>

                    {/* Nếu có TOP_K_SUGGESTIONS thì render list, ngược lại hiển thị 1 card mặc định */}
                    {Array.isArray(TOP_K_SUGGESTIONS) && TOP_K_SUGGESTIONS.length > 0 ? (
                    <div className="space-y-3">
                        {TOP_K_SUGGESTIONS.map((s, i) => {
                        const pct = Math.round((s.confidence ?? 0) * 100);
                        const active = s.active;
                        return (
                            <div key={s.id ?? i} className={`p-3 rounded-xl border ${active ? 'bg-primary/5 border-primary/20' : 'border-transparent'} transition-colors`}>
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-3">
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${active ? 'bg-primary text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                                    {i + 1}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{s.title}</p>
                                    <p className="text-xs text-slate-500">{s.metadata ?? '—'}</p>
                                </div>
                                </div>
                                <div className="text-right">
                                <div className="text-xs font-bold text-green-600 dark:text-green-400">{pct}% tin cậy</div>
                                </div>
                            </div>

                            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-primary h-full" style={{ width: `${pct}%` }} />
                            </div>
                            </div>
                        );
                        })}
                    </div>
                    ) : (
                    <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-xl p-3">
                        <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">Phòng Kế hoạch Tài chính</span>
                        <span className="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded">98% tin cậy</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-primary h-full w-[98%]" />
                        </div>
                    </div>
                    )}
                </div>
                </div>
            </div>

            {/* Action Panel */}
            <div className="grid grid-cols-1 gap-2">
                <button className="w-full bg-primary text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-xl">check_circle</span>
                Phê duyệt Tài liệu
                </button>

                <div className="grid grid-cols-2 gap-2">
                <button className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-xl">refresh</span>
                    Xử lý lại
                </button>
                <button className="bg-white dark:bg-slate-800 text-primary font-bold py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-primary/5 transition-all flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-xl">delete</span>
                    Xóa bỏ
                </button>
                </div>
            </div>
            </aside>

          {/* Cảnh báo lưu ý */}
          <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 flex items-start gap-3">
            <span className="material-symbols-outlined text-primary flex-shrink-0">info</span>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Hệ thống AI tự động phân tích và gán nhãn cho tài liệu. Vui lòng kiểm tra kỹ các thông tin quan trọng trước khi nhấn <strong>Phê duyệt điều hướng</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentPage;