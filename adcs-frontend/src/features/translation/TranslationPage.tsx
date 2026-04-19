import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  uploadTranslationFiles, 
  getTranslations, 
  updateTranslationComment, 
  type TranslationFile 
} from '../../api/translation';
import { useNavigate } from 'react-router-dom';

const TranslationPage: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<TranslationFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    
    if (!token) {
      alert('Vui lòng đăng nhập lại để tiếp tục!');
      navigate('/login', { replace: true });
      return;
    }
  }, []);

  const fetchFiles = async () => {
    try {
      const data = await getTranslations();
      setFiles(data);
    } catch (error) {
      console.error("Lỗi tải danh sách dịch:", error);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  useEffect(() => {
    const hasActiveTasks = files.some(f => f.status === 'pending' || f.status === 'translating');
    let interval: ReturnType<typeof setInterval>;

    if (hasActiveTasks) {
      interval = setInterval(() => {
        fetchFiles();
      }, 3000);
    }

    return () => clearInterval(interval);
  }, [files]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processSelectedFiles(Array.from(e.target.files));
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processSelectedFiles = async (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;
    
    setIsUploading(true);
    const toastId = toast.loading("Đang tải tệp lên...");

    try {
      const response = await uploadTranslationFiles(selectedFiles);
      
      if (response.duplicate_count > 0) {
        toast(`Phát hiện ${response.duplicate_count} tài liệu trùng lặp đã được loại bỏ.`, { icon: '⚠️', duration: 5000 });
      }

      toast.success("Đã đẩy tệp vào hàng đợi dịch!", { id: toastId });

      fetchFiles();
    } catch (error) {
      toast.error("Lỗi khi tải tệp lên. Vui lòng thử lại.", { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCommentChange = (id: string, value: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, comment: value } : f))
    );
  };

  const handleSaveComment = async (id: string, fileName: string, comment: string) => {
    if (!comment.trim()) return;

    try {
      await updateTranslationComment(id, comment);
      toast.success(`Đã lưu nhận xét cho tệp ${fileName}`);
    } catch (error) {
      toast.error("Không thể lưu nhận xét");
    }
  };

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

      {/* Upload Zone */}
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
          onClick={() => !isUploading && fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files && !isUploading) processSelectedFiles(Array.from(e.dataTransfer.files));
          }}
          className={`w-full h-64 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-4 group transition-colors 
            ${isUploading ? 'opacity-50 cursor-not-allowed border-slate-200' : 'cursor-pointer'}
            ${isDragging ? 'border-[#ed1d23] bg-[#ed1d23]/5' : 'border-slate-200 bg-white hover:border-[#ed1d23]/50'}`}
        >
          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-[#ed1d23] group-hover:bg-[#ed1d23]/5 transition-all">
            <span className="material-symbols-outlined text-4xl">cloud_upload</span>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-slate-800">Kéo thả file vào đây</p>
            <p className="text-xs text-slate-400 mt-1">(Hỗ trợ PDF, Word, PNG, JPG)</p>
          </div>
          <button disabled={isUploading} className="mt-2 px-6 py-2 bg-white border border-slate-200 text-xs font-bold uppercase rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50">
            {isUploading ? "Đang xử lý tải lên..." : "Chọn tệp từ máy tính"}
          </button>
        </div>
      </section>

      {/* Processing List Table */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Danh sách xử lý</h2>
          <button 
            disabled={files.length === 0 || !files.some(f => f.status === 'success')}
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
                        {getIconForType(file.file_type)}
                        <span className="text-xs font-bold text-slate-800">{file.filename}</span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      {file.status === 'success' && (
                        <span className="px-2.5 py-1 bg-green-50 text-green-600 text-[10px] font-black rounded uppercase">Hoàn tất</span>
                      )}
                      {file.status === 'failed' && (
                        <span className="px-2.5 py-1 bg-red-50 text-red-600 text-[10px] font-black rounded uppercase">Lỗi xử lý</span>
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
                        value={file.comment || ''}
                        onChange={(e) => handleCommentChange(file.id, e.target.value)}
                        onBlur={() => handleSaveComment(file.id, file.filename, file.comment)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.currentTarget.blur();
                          }
                        }}
                        placeholder="Thêm nhận xét và nhấn Enter..." 
                        className="bg-transparent border-b border-transparent focus:border-slate-300 p-1 text-xs text-slate-600 focus:ring-0 w-full placeholder:italic transition-colors outline-none"
                      />
                    </td>

                    <td className="px-6 py-4 text-right">
                      {file.status === 'success' && file.result_file_url ? (
                        <a 
                          href={file.result_file_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-[10px] font-black text-[#ed1d23] uppercase hover:underline cursor-pointer"
                        >
                          Tải về (.docx)
                        </a>
                      ) : (
                        <button 
                          className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded transition-colors disabled:opacity-30"
                          title="Chức năng xóa tạm thời ẩn"
                          disabled
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