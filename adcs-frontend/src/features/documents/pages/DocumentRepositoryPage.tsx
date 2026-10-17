import React, { useState, useEffect } from 'react';
import { searchDocuments, deleteDocument, type DocumentResponse } from '../../../api/document';
import { departmentApi } from '../../../api/department';
import axiosClient from '../../../api/axiosClient';
import { Authorized } from '../../../components/common/Authorized';

const getFileIconUI = (document: DocumentResponse) => {
  const type = document.loai_van_ban_text?.toLowerCase() || '';
  if (type.includes('nghị quyết') || type.includes('quyết định')) return { icon: 'picture_as_pdf', text: 'PDF', bg: 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30', textCol: 'text-primary' };
  if (type.includes('báo cáo') || type.includes('công văn')) return { icon: 'article', text: 'DOCX', bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30', textCol: 'text-blue-600' };
  return { icon: 'description', text: 'VĂN BẢN', bg: 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-900/30', textCol: 'text-orange-600' };
};

const COMMON_DOC_TYPES = [
  { value: 'all', label: 'Tất cả loại VB' },
  { value: 'Quyết định', label: 'Quyết định' },
  { value: 'Nghị quyết', label: 'Nghị quyết' },
  { value: 'Công văn', label: 'Công văn' },
  { value: 'Thông báo', label: 'Thông báo' },
  { value: 'Tờ trình', label: 'Tờ trình' },
  { value: 'Báo cáo', label: 'Báo cáo' },
  { value: 'Kế hoạch', label: 'Kế hoạch' },
];

const DocumentRepositoryPage: React.FC = () => {
  const [searchInput, setSearchInput] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [sortBy, setSortBy] = useState<'confidence' | 'newest'>('newest');
  const [selectedDocType, setSelectedDocType] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const [selectedDocument, setSelectedDocument] = useState<DocumentResponse | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

  // --- STATE CHO FILE RAW VIEWER ---
  const [rawFileUrl, setRawFileUrl] = useState<string | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const ITEMS_PER_PAGE = 20;

  // Lấy danh sách phòng ban cho dropdown bộ lọc
  useEffect(() => {
    departmentApi.getAll()
      .then((tree) => {
        const flatList: { id: string; name: string }[] = [];
        const traverse = (nodes: any[]) => {
          nodes.forEach(node => {
            flatList.push({
              id: String(node.department_id || node.id),
              name: node.ten_hien_thi || node.name
            });
            if (node.children && node.children.length > 0) {
              traverse(node.children);
            }
          });
        };
        traverse(tree || []);
        setDepartments(flatList);
      })
      .catch((err) => console.error("Lỗi lấy danh sách phòng ban:", err));
  }, []);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const response = await searchDocuments({
        query: activeQuery.trim() ? activeQuery.trim() : undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        department_id: selectedDepartment !== 'all' ? selectedDepartment : undefined,
        document_type: selectedDocType !== 'all' ? selectedDocType : undefined,
        sort_by: sortBy,
        page: currentPage,
        page_size: ITEMS_PER_PAGE
      });
      
      let resultData: DocumentResponse[] = [];
      let total = 0;
      let pages = 1;

      if (Array.isArray(response)) {
        resultData = response;
        total = response.length;
        pages = Math.ceil(total / ITEMS_PER_PAGE);
      } else if (response) {
        const rawItems = response.data || (response as any).results || (response as any).items || [];
        
        resultData = rawItems.map((item: any) => {
          if (item.document) {
            return {
              document_id: item.document_id,
              confidence: item.best_similarity,
              ...item.document
            };
          }
          return item;
        });

        total = response.total ?? resultData.length;
        pages = response.total_pages ?? Math.ceil(total / ITEMS_PER_PAGE);
      }

      setDocuments(resultData);
      setTotalItems(total);
      setTotalPages(pages > 0 ? pages : 1);
      
    } catch (error) {
      console.error("Lỗi tải văn bản:", error);
      setDocuments([]); 
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [activeQuery, currentPage, selectedDocType, selectedDepartment, startDate, endDate, sortBy]);

  // --- LOGIC FETCH RAW FILE KHI MỞ MODAL ---
  useEffect(() => {
    if (selectedDocument) {
      setIsLoadingFile(true);
      setFileError(null);
      axiosClient.get(`/documents/${selectedDocument.document_id}/file`, { responseType: 'blob' })
        .then((response: any) => {
          const url = URL.createObjectURL(response);
          setRawFileUrl(url);
          setIsLoadingFile(false);
        })
        .catch(err => {
          console.error("Lỗi tải file raw:", err);
          setFileError("Không thể tải file hiển thị. File có thể không tồn tại hoặc lỗi máy chủ.");
          setIsLoadingFile(false);
        });
    } else {
      if (rawFileUrl) {
        URL.revokeObjectURL(rawFileUrl);
      }
      setRawFileUrl(null);
    }
  }, [selectedDocument]);

  const handleSearchSubmit = () => {
    setCurrentPage(1);
    setActiveQuery(searchInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearchSubmit();
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    if (endDate && newStartDate > endDate) {
      alert("Ngày bắt đầu không được lớn hơn ngày kết thúc!");
      return; 
    }
    setStartDate(newStartDate);
    setCurrentPage(1);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value;
    if (startDate && newEndDate < startDate) {
      alert("Ngày kết thúc không được nhỏ hơn ngày bắt đầu!");
      return; 
    }
    setEndDate(newEndDate);
    setCurrentPage(1);
  };

  const handleResetFilter = () => {
    setSearchInput('');
    setActiveQuery('');
    setSelectedDocType('all');
    setSelectedDepartment('all');
    setStartDate('');
    setEndDate('');
    setSortBy('newest');
    setCurrentPage(1);
  };

  const formatDate = (dateString?: string | Date | null) => {
    if (!dateString) return 'Đang cập nhật';
    return new Date(dateString).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleDeleteDocument = async (force: boolean = false) => {
    if (!selectedDocument) return;

    setIsDeleting(true);
    setDeleteErrorMessage(null);
    try {
      await deleteDocument(selectedDocument.document_id, force);
      alert('Đã xóa văn bản thành công đồng bộ trên hệ thống!');
      setSelectedDocument(null);
      setIsDeleteOpen(false);
      fetchDocuments();
    } catch (error: any) {
      console.error("Lỗi khi xóa văn bản:", error);
      const detail = error?.response?.data?.detail || 'Không thể xóa văn bản lúc này. Vui lòng thử lại!';
      setDeleteErrorMessage(detail);
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (isDeleteOpen || selectedDocument) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
  }, [isDeleteOpen, selectedDocument]);

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen flex flex-col relative">
      <main className="flex flex-1 overflow-hidden h-[calc(100vh-64px)]">
        <section className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-y-auto">
          
          <div className="p-6 bg-white dark:bg-slate-900 border-b border-primary/10 space-y-4 sticky top-0 z-10 shadow-sm">
            <div className="max-w-5xl mx-auto flex flex-col gap-4">
              
              <div className="flex w-full items-stretch h-14 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary transition-all">
                <div className="flex items-center justify-center pl-4 text-slate-400">
                  <span className="material-symbols-outlined">search</span>
                </div>
                <input 
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-lg px-4 placeholder:text-slate-400 outline-none" 
                  placeholder="Nhập từ khóa tìm kiếm văn bản..." 
                />
                <div className="flex items-center pr-2">
                  <button onClick={handleSearchSubmit} className="bg-primary text-white h-10 px-6 rounded-lg font-bold hover:bg-primary/90 transition-colors outline-none">
                    Tìm kiếm
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Lọc loại văn bản */}
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg px-2.5 h-10">
                  <span className="text-slate-500 material-symbols-outlined text-[18px]">category</span>
                  <select 
                    value={selectedDocType} 
                    onChange={(e) => { setSelectedDocType(e.target.value); setCurrentPage(1); }} 
                    className="bg-transparent border-none text-sm font-medium focus:ring-0 text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                  >
                    {COMMON_DOC_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                {/* Lọc phòng ban */}
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg px-2.5 h-10 max-w-xs">
                  <span className="text-slate-500 material-symbols-outlined text-[18px]">domain</span>
                  <select 
                    value={selectedDepartment} 
                    onChange={(e) => { setSelectedDepartment(e.target.value); setCurrentPage(1); }} 
                    className="bg-transparent border-none text-sm font-medium focus:ring-0 text-slate-700 dark:text-slate-200 outline-none cursor-pointer truncate"
                  >
                    <option value="all">Tất cả phòng ban</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                
                {/* Lọc ngày tháng */}
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg px-3 h-10">
                  <span className="text-slate-500 material-symbols-outlined text-[18px]">calendar_month</span>
                  <input 
                    type="date" 
                    value={startDate} 
                    max={endDate || undefined}
                    onChange={handleStartDateChange} 
                    title="Từ ngày"
                    className="bg-transparent border-none text-sm focus:ring-0 p-0 outline-none text-slate-700 dark:text-slate-200 w-[120px]" 
                  />
                  <span className="text-slate-400">-</span>
                  <input 
                    type="date" 
                    value={endDate} 
                    min={startDate || undefined}
                    onChange={handleEndDateChange} 
                    title="Đến ngày"
                    className="bg-transparent border-none text-sm focus:ring-0 p-0 outline-none text-slate-700 dark:text-slate-200 w-[120px]" 
                  />
                </div>

                {/* Nút đặt lại */}
                {(searchInput || activeQuery || selectedDocType !== 'all' || selectedDepartment !== 'all' || startDate || endDate) && (
                  <button 
                    onClick={handleResetFilter}
                    className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 bg-rose-50 dark:bg-rose-950/30 px-3 py-2 rounded-lg font-medium transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                    Đặt lại
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 max-w-5xl mx-auto w-full space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-slate-500 text-sm font-medium">
                {isLoading ? 'Đang tải dữ liệu...' : `Hiển thị ${documents.length} / ${totalItems} văn bản`}
                {activeQuery && !isLoading && ` cho "${activeQuery}"`}
              </h4>
              <div className="flex items-center gap-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg shadow-sm">
                <span className="text-slate-400 material-symbols-outlined text-[18px]">sort</span>
                <select value={sortBy} onChange={(e) => {setSortBy(e.target.value as any); setCurrentPage(1);}} className="bg-transparent border-none text-sm font-semibold focus:ring-0 p-0 text-slate-700 dark:text-slate-200 outline-none cursor-pointer">
                  <option value="newest">Mới nhất</option>
                  <option value="confidence">Độ tương đồng (AI)</option>
                </select>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span>
              </div>
            ) : documents.length === 0 ? (
               <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                 <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">search_off</span>
                 <p className="text-slate-500">Không tìm thấy văn bản nào phù hợp.</p>
               </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {documents.map(doc => {
                  const ui = getFileIconUI(doc);

                  return (
                    <div 
                      key={doc.document_id} 
                      onClick={() => setSelectedDocument(doc)}
                      className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-primary/5 hover:border-primary/30 hover:shadow-md transition-all group cursor-pointer"
                    >
                      <div className="flex gap-5">
                        <div className={`h-20 w-16 rounded flex flex-col items-center justify-center border ${ui.bg} flex-shrink-0`}>
                          <span className={`material-symbols-outlined text-3xl ${ui.textCol}`}>{ui.icon}</span>
                          <span className={`text-[10px] font-bold mt-1 ${ui.textCol}`}>{ui.text}</span>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors truncate">
                                {doc.trich_yeu || doc.so_ky_hieu || `văn bản chưa có tiêu đề (${doc.document_id.substring(0,8)})`}
                              </h3>
                              
                              <div className="flex flex-wrap gap-x-5 gap-y-2 mt-2">
                                <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                  <span className="material-symbols-outlined text-[16px]">event</span> {formatDate(doc.ngay_van_ban)}
                                </span>
                                {doc.so_ky_hieu && (
                                  <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                    <span className="material-symbols-outlined text-[16px]">pin</span> {doc.so_ky_hieu}
                                  </span>
                                )}
                                  <span
                                    className={`text-xs font-bold px-2 py-1 rounded-full ${
                                      doc.confidence != null && doc.confidence >= 0.845
                                        ? 'bg-green-100 text-green-800'
                                        : doc.confidence != null
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-slate-100 text-slate-500'
                                    }`}
                                  >
                                    {doc.confidence != null
                                      ? `Độ tương đồng: ${Math.round(doc.confidence * 100)}%`
                                      : 'Chưa có điểm AI'}
                                  </span>
                              </div>
                            </div>
                          </div>
                          
                          <p className="mt-4 text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                            {doc.summary || doc.trich_yeu || 'Không có tóm tắt cho văn bản này.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!isLoading && totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-8 pb-12">
                 <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-50"><span className="material-symbols-outlined">chevron_left</span></button>
                 {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button key={page} onClick={() => setCurrentPage(page)} className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold ${currentPage === page ? 'bg-primary text-white shadow-md shadow-primary/20' : 'border border-slate-200 hover:bg-slate-100'}`}>{page}</button>
                ))}
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-50"><span className="material-symbols-outlined">chevron_right</span></button>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* --- MODAL CHI TIẾT văn bản VỚI RAW VIEWER --- */}
      {selectedDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[95vw] lg:max-w-7xl h-full max-h-[95vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="size-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined">description</span>
                </div>
                <div>
                  <h2 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-1">
                    {selectedDocument.so_ky_hieu || 'văn bản không có số hiệu'}
                  </h2>
                  <p className="text-xs text-slate-500">ID: {selectedDocument.document_id}</p>
                </div>
              </div>
              
              <button 
                onClick={() => setSelectedDocument(null)}
                className="size-8 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors outline-none"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Modal Body: Chia làm 2 cột hiển thị ngang trên màn hình lớn */}
            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row bg-slate-50/50 dark:bg-slate-900 p-6 gap-6">
              
              {/* CỘT TRÁI: HIỂN THỊ FILE GỐC (RAW FILE VIEWER) */}
              <div className="flex-[2] bg-slate-200 dark:bg-slate-950 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 relative flex flex-col shadow-inner">
                {isLoadingFile ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                    <span className="material-symbols-outlined animate-spin text-4xl text-primary mb-2">sync</span>
                    <p className="text-sm font-medium">Đang tải văn bản...</p>
                  </div>
                ) : fileError ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-rose-500 p-8 text-center">
                    <span className="material-symbols-outlined text-5xl mb-3">broken_image</span>
                    <p className="font-semibold">{fileError}</p>
                  </div>
                ) : rawFileUrl ? (
                  <iframe 
                    src={rawFileUrl} 
                    className="w-full h-full flex-1 border-none bg-white" 
                    title="Trình xem văn bản"
                  />
                ) : (
                   <div className="flex-1 flex items-center justify-center text-slate-400">
                      Không có file để hiển thị
                   </div>
                )}
              </div>

              {/* CỘT PHẢI: METADATA VÀ AI SUMMARY */}
              <div className="flex-1 lg:max-w-[400px] overflow-y-auto space-y-6 custom-scrollbar pr-2">
                
                {/* AI Summary */}
                <div className="bg-primary/5 dark:bg-primary/10 p-5 rounded-xl border border-primary/20">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">smart_toy</span>
                      AI Tóm tắt
                    </h3>
                    {selectedDocument.confidence && (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-white dark:bg-slate-800 text-primary rounded-full shadow-sm">
                        Độ tương đồng: {Math.round(selectedDocument.confidence * 100)}%
                      </span>
                    )}
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-sm">
                    {selectedDocument.summary || 'AI chưa tạo tóm tắt cho văn bản này.'}
                  </p>
                </div>

                {/* Trích yếu */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">short_text</span>
                    Trích yếu nội dung
                  </h3>
                  <p className="text-slate-800 dark:text-slate-200 text-[15px] font-medium leading-relaxed">
                    {selectedDocument.trich_yeu || 'Không có thông tin trích yếu.'}
                  </p>
                </div>

                {/* Key Points */}
                {selectedDocument.key_points && selectedDocument.key_points.length > 0 && (
                  <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">format_list_bulleted</span>
                      Điểm chính
                    </h3>
                    <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                      {selectedDocument.key_points.map((point, idx) => (
                        <li key={idx}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Thuộc tính Metadata */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-700 pb-2">
                    Thuộc tính văn bản
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-semibold text-slate-500 uppercase">Loại văn bản</p>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                          {selectedDocument.loai_van_ban_text || 'Chưa phân loại'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-slate-500 uppercase">Ngày ban hành</p>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                          {formatDate(selectedDocument.ngay_van_ban)}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase">Cơ quan ban hành</p>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                        {selectedDocument.don_vi_ban_hanh || 'Không rõ'}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase">Người ký</p>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                        {selectedDocument.nguoi_ky ? `${selectedDocument.nguoi_ky} (${selectedDocument.chuc_vu_nguoi_ky || 'Không rõ chức vụ'})` : 'Không có thông tin'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Gợi ý phòng ban (Top 3) & Cán bộ đề xuất (W9 & W10) */}
                {selectedDocument.suggested_departments && selectedDocument.suggested_departments.length > 0 && (
                  <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">corporate_fare</span>
                      Phòng ban đề xuất (AI Top 3)
                    </h3>
                    <div className="space-y-2">
                      {selectedDocument.suggested_departments.map((dept: any, idx: number) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-slate-900 dark:text-slate-100 mr-2">#{idx + 1} {dept.name}</span>
                            {dept.reasoning && <p className="text-slate-500 text-[11px] mt-0.5">{dept.reasoning}</p>}
                          </div>
                          {dept.confidence != null && (
                            <span className="font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                              {Math.round(dept.confidence * 100)}%
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedDocument.proposed_assignees && selectedDocument.proposed_assignees.length > 0 && (
                  <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">badge</span>
                      Cán bộ xử lý đề xuất
                    </h3>
                    <div className="space-y-2">
                      {selectedDocument.proposed_assignees.map((assignee: any, idx: number) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs">
                          <p className="font-bold text-slate-900 dark:text-slate-100">{assignee.name} <span className="font-normal text-slate-500">({assignee.position || 'Cán bộ'})</span></p>
                          {assignee.email && <p className="text-slate-500 text-[11px]">{assignee.email}</p>}
                          {assignee.reasoning && <p className="text-slate-400 text-[11px] italic mt-0.5">{assignee.reasoning}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Card System */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-700 pb-2">
                    Hệ thống
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-semibold text-slate-500 uppercase">Phân bổ phòng ban</p>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                          {departments.find(d => String(d.id) === String(selectedDocument.assigned_department_id))?.name || selectedDocument.assigned_department_id || 'Chưa phân bổ'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end gap-3 flex-shrink-0">
              <button 
                onClick={() => setSelectedDocument(null)}
                className="px-5 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg transition-colors outline-none"
              >
                Đóng
              </button>
              
              <Authorized permission="doc:delete">
                <button 
                  onClick={ () => { setDeleteErrorMessage(null); setIsDeleteOpen(true); }}
                  disabled={isDeleting}
                  className="px-5 py-2 text-sm font-bold bg-rose-600 text-white hover:bg-rose-700 rounded-lg shadow-lg shadow-rose-600/20 flex items-center gap-2 outline-none disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                >
                  {isDeleting ? (
                    <>
                      <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                      Đang xóa...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                      Xóa văn bản
                    </>
                  )}
                </button>
              </Authorized>
            </div>

          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (W11: Hỗ trợ Force Delete khi Data Service lỗi) */}
      {isDeleteOpen && (
        <div onClick={() => { setIsDeleteOpen(false); setDeleteErrorMessage(null); }} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md p-6 animate-fade-in">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 mx-auto mb-4">
              <span className="material-symbols-outlined text-red-600">warning</span>
            </div>
            <h2 className="text-lg font-bold text-center mb-2">Xóa văn bản?</h2>
            <p className="text-sm text-slate-500 text-center mb-4">
              Bạn có chắc muốn xóa <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedDocument?.so_ky_hieu || selectedDocument?.trich_yeu || 'văn bản này'}</span>? Hành động này sẽ đồng bộ xóa trên cả Data Service & Vector DB.
            </p>

            {deleteErrorMessage && (
              <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-200">
                <p className="font-semibold mb-1">Cảnh báo:</p>
                <p>{deleteErrorMessage}</p>
                <p className="mt-2 text-[11px] text-slate-500 font-medium">Bạn có muốn tiếp tục xóa cưỡng bức trên Web DB không?</p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button onClick={() => { setIsDeleteOpen(false); setDeleteErrorMessage(null); }} className="px-4 py-2 rounded-lg border text-slate-600 hover:bg-slate-50 outline-none transition-colors">Hủy</button>
              {deleteErrorMessage ? (
                <button onClick={() => handleDeleteDocument(true)} className="px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 font-semibold outline-none transition-colors">Xóa cưỡng bức (Force)</button>
              ) : (
                <button onClick={() => handleDeleteDocument(false)} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-semibold outline-none transition-colors">Xóa</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentRepositoryPage;