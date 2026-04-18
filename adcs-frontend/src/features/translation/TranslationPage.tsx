import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';

type FileStatus = 'pending' | 'translating' | 'success' | 'error';

interface TranslationFile {
  id: string;
  name: string;
  type: string;
  status: FileStatus;
  comment: string;
}

const TranslationPage: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<TranslationFile[]>([]);
  const [duplicateCount, setDuplicateCount] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);

  // --- Handlers: Upload & Luồng Alternative (Lọc trùng lặp) ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processSelectedFiles(Array.from(e.target.files));
    }
  };

  const processSelectedFiles = (selectedFiles: File[]) => {
    // Bước 1 & Alternative 1, 2: Giả lập Backend lọc tệp trùng lặp (Dựa trên tên file)
    const newFiles: TranslationFile[] = [];
    let duplicates = 0;

    selectedFiles.forEach((file) => {
      const isDuplicate = files.some((f) => f.name === file.name);
      if (isDuplicate) {
        duplicates++;
      } else {
        newFiles.push({
          id: Math.random().toString(36).substring(7),
          name: file.name,
          type: file.name.split('.').pop()?.toLowerCase() || 'unknown',
          status: 'pending', // Bước 2: Chờ xử lý
          comment: '',
        });
      }
    });

    if (duplicates > 0) {
      setDuplicateCount(duplicates);
      // Alternative 3: Cảnh báo
      toast(`Phát hiện ${duplicates} tài liệu trùng lặp đã được loại bỏ.`, { icon: '⚠️' });
    }

    if (newFiles.length > 0) {
      setFiles((prev) => [...prev, ...newFiles]);
      // Bắt đầu luồng xử lý (Bước 3 - 8)
      simulateTranslationProcess(newFiles);
    }
  };

  // --- Handlers: Main Flow (Xử lý dịch thuật) ---
  const simulateTranslationProcess = (newFiles: TranslationFile[]) => {
    // Giả lập Bước 3 - Bước 8: Gửi qua Data Service -> AI Service -> Trả về kết quả
    newFiles.forEach((file, index) => {
      // 1. Chuyển sang trạng thái đang dịch (OCR & Translate)
      setTimeout(() => {
        setFiles((prev) =>
          prev.map((f) => (f.id === file.id ? { ...f, status: 'translating' } : f))
        );
      }, 1000 + index * 500);

      // 2. Chuyển sang trạng thái hoàn tất (Render Word & Hiển thị)
      setTimeout(() => {
        setFiles((prev) =>
          prev.map((f) => (f.id === file.id ? { ...f, status: 'success' } : f))
        );
        toast.success(`Đã dịch xong: ${file.name}`);
      }, 5000 + index * 1000);
    });
  };

  // --- Handlers: Nhận xét (Bước 9 - 12) ---
  const handleCommentChange = (id: string, value: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, comment: value } : f))
    );
  };

  const handleSaveComment = (id: string, fileName: string) => {
    // Bước 10 & 11: Gọi API lưu nhận xét vào Relational DB (Translation_history)
    // api.saveComment(id, comment)...
    
    // Bước 12: Frontend hiển thị thông báo
    toast.success(`Đã lưu nhận xét cho tệp ${fileName}`);
  };

  // --- Handlers: Giao diện ---
  const getIconForType = (type: string) => {
    switch (type) {
      case 'pdf': return <span className="material-symbols-outlined text-red-500">picture_as_pdf</span>;
      case 'docx': case 'doc': return <span className="material-symbols-outlined text-blue-700">description</span>;
      case 'png': case 'jpg': case 'jpeg': return <span className="material-symbols-outlined text-blue-500">image</span>;
      default: return <span className="material-symbols-outlined text-slate-500">draft</span>;
    }
  };

  return (
    <div className="min-h-screen mx-auto p-6 space-y-6 font-sans">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-900">Dịch văn bản</h2>
        </div>
      </div>
      {/* Configuration Bar */}
      <section className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-slate-50 rounded border border-slate-200 flex items-center gap-2 cursor-pointer hover:bg-slate-100 transition-colors">
            <span className="text-[10px] font-bold uppercase text-slate-400">Từ:</span>
            <span className="text-xs font-bold text-[#ed1d23]">Tiếng Việt</span>
            <span className="material-symbols-outlined text-xs">expand_more</span>
          </div>
          <span className="material-symbols-outlined text-slate-300">trending_flat</span>
          <div className="px-3 py-1.5 bg-slate-50 rounded border border-slate-200 flex items-center gap-2 cursor-pointer hover:bg-slate-100 transition-colors">
            <span className="text-[10px] font-bold uppercase text-slate-400">Đến:</span>
            <span className="text-xs font-bold text-slate-800">Tiếng Anh (US)</span>
            <span className="material-symbols-outlined text-xs">expand_more</span>
          </div>
        </div>
      </section>

      {/* Upload Zone & Alert */}
      <section className="space-y-3">
        <input 
          type="file" 
          multiple 
          ref={fileInputRef} 
          className="hidden" 
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
          onChange={handleFileSelect}
        />
        <div 
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files) processSelectedFiles(Array.from(e.dataTransfer.files));
          }}
          className={`w-full h-64 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-4 group transition-colors cursor-pointer 
            ${isDragging ? 'border-[#ed1d23] bg-[#ed1d23]/5' : 'border-slate-200 bg-white hover:border-[#ed1d23]/50'}`}
        >
          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-[#ed1d23] group-hover:bg-[#ed1d23]/5 transition-all">
            <span className="material-symbols-outlined text-4xl">cloud_upload</span>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-slate-800">Kéo thả file vào đây</p>
            <p className="text-xs text-slate-400 mt-1">(Hỗ trợ PDF, Word, PNG, JPG)</p>
          </div>
          <button className="mt-2 px-6 py-2 bg-white border border-slate-200 text-xs font-bold uppercase rounded-lg hover:bg-slate-50 transition-colors">
            Chọn tệp từ máy tính
          </button>
        </div>

        {/* System Alert (Alternative Flow) */}
        {duplicateCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg text-slate-600 border-l-4 border-amber-400 animate-in fade-in slide-in-from-top-2">
            <span className="material-symbols-outlined text-lg text-amber-500">info</span>
            <p className="text-xs font-medium">Phát hiện {duplicateCount} file trùng lặp đã được loại bỏ để tránh xử lý thừa.</p>
          </div>
        )}
      </section>

      {/* Processing List Table */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Danh sách xử lý</h2>
          <button 
            disabled={files.length === 0 || files.some(f => f.status !== 'success')}
            className="flex items-center gap-2 px-4 py-2 bg-[#ed1d23]/10 text-[#ed1d23] rounded-lg text-xs font-bold hover:bg-[#ed1d23]/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-sm">download_for_offline</span>
            Tải tất cả .zip
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-500 tracking-wider">Tên tệp</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-500 tracking-wider">Trạng thái</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-500 tracking-wider w-1/3">Nhận xét</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-500 tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {files.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-400">
                    Chưa có tệp nào được tải lên.
                  </td>
                </tr>
              ) : (
                files.map((file) => (
                  <tr key={file.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {getIconForType(file.type)}
                        <span className="text-xs font-bold text-slate-800">{file.name}</span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      {file.status === 'success' && (
                        <span className="px-2.5 py-1 bg-green-50 text-green-600 text-[10px] font-black rounded uppercase">Hoàn tất</span>
                      )}
                      {file.status === 'translating' && (
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></div>
                          <span className="text-[10px] font-black text-amber-600 uppercase">Đang dịch...</span>
                        </div>
                      )}
                      {file.status === 'pending' && (
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-500 text-[10px] font-black rounded uppercase">Chờ xử lý</span>
                      )}
                    </td>

                    <td className="px-6 py-4 relative group">
                      <input 
                        type="text"
                        value={file.comment}
                        onChange={(e) => handleCommentChange(file.id, e.target.value)}
                        onBlur={() => {
                          if (file.comment.trim()) handleSaveComment(file.id, file.name);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && file.comment.trim()) {
                            e.currentTarget.blur(); // Trigger save
                          }
                        }}
                        placeholder="Thêm nhận xét và nhấn Enter..." 
                        className="bg-transparent border-b border-transparent focus:border-slate-300 p-1 text-xs text-slate-600 focus:ring-0 w-full placeholder:italic transition-colors"
                      />
                    </td>

                    <td className="px-6 py-4 text-right">
                      {file.status === 'success' ? (
                        <button className="text-[10px] font-black text-[#ed1d23] uppercase hover:underline">
                          Tải về (.docx)
                        </button>
                      ) : (
                        <button 
                          onClick={() => setFiles(prev => prev.filter(f => f.id !== file.id))}
                          className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded transition-colors"
                          title="Hủy/Xóa"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default TranslationPage;