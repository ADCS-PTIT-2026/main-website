import React, { useState, useEffect } from 'react';
import { searchDocuments, getDocumentTypes, type DocumentResponse, type DocumentType } from '../../../api/document';
import { departmentApi, type DepartmentResponse } from '../../../api/department';

const flattenDepartments = (nodes: any[]): DepartmentResponse[] => {
  let list: DepartmentResponse[] = [];
  nodes.forEach((node) => {
    const { children, ...rest } = node;
    list.push(rest);
    if (children && children.length > 0) {
      list = list.concat(flattenDepartments(children));
    }
  });
  return list;
};

const getFileIconUI = (document: DocumentResponse) => {
  const type = document.loai_van_ban_text?.toLowerCase() || '';
  if (type.includes('nghị quyết') || type.includes('quyết định')) return { icon: 'picture_as_pdf', text: 'PDF', bg: 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30', textCol: 'text-primary' };
  if (type.includes('báo cáo') || type.includes('công văn')) return { icon: 'article', text: 'DOCX', bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30', textCol: 'text-blue-600' };
  return { icon: 'description', text: 'VĂN BẢN', bg: 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-900/30', textCol: 'text-orange-600' };
};

const DocumentRepositoryPage: React.FC = () => {
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [docTypes, setDocTypes] = useState<DocumentType[]>([]);

  // --- STATES QUẢN LÝ TÌM KIẾM & BỘ LỌC ---
  const [searchInput, setSearchInput] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'confidence' | 'newest'>('confidence');
  const [category, setCategory] = useState<'all' | 'promulgated' | 'recent'>('all');

  // --- STATES DỮ LIỆU & PHÂN TRANG ---
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [deptTree, typesData] = await Promise.all([
          departmentApi.getAll(),
          getDocumentTypes().catch(() => [])
        ]);
        setDepartments(flattenDepartments(deptTree));
        setDocTypes(typesData);
      } catch (error) {
        console.error("Lỗi tải bộ lọc:", error);
      }
    };
    fetchFilters();
  }, []);

  // Fetch danh sách tài liệu mỗi khi bộ lọc, trang, hoặc query thay đổi
  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const response = await searchDocuments({
        query: activeQuery,
        department_id: selectedDept || undefined,
        document_type_ids: selectedTypes.length > 0 ? selectedTypes : undefined,
        sort_by: sortBy,
        page: currentPage,
        limit: 10,
      });
      setDocuments(response.data);
      setTotalItems(response.total);
      setTotalPages(response.total_pages);
    } catch (error) {
      console.error("Lỗi tìm kiếm tài liệu:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [activeQuery, selectedDept, selectedTypes, sortBy, currentPage, category]);

  const handleSearchSubmit = () => {
    setCurrentPage(1);
    setActiveQuery(searchInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearchSubmit();
  };

  const toggleDocType = (id: string) => {
    setCurrentPage(1);
    setSelectedTypes(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const formatDate = (dateString?: string | Date | null) => {
    if (!dateString) return 'Đang cập nhật';
    return new Date(dateString).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen flex flex-col">
      <main className="flex flex-1 overflow-hidden h-[calc(100vh-64px)]">
        
        {/* LEFT SIDEBAR: FILTERS */}
        <aside className="w-72 bg-white dark:bg-slate-900 border-r border-primary/10 flex flex-col p-6 gap-6 overflow-y-auto hidden lg:flex">
          <div className="flex flex-col gap-4">
            <h3 className="text-slate-900 dark:text-slate-100 text-sm font-bold uppercase tracking-wider">Bộ lọc Metadata</h3>
            
            {/* Danh mục */}
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">DANH MỤC</p>
              <div 
                onClick={() => {setCategory('all'); setCurrentPage(1);}}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${category === 'all' ? 'bg-primary text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <span className="material-symbols-outlined text-[20px]">description</span>
                <p className="text-sm font-medium">Tất cả tài liệu</p>
              </div>
              <div 
                onClick={() => {setCategory('promulgated'); setCurrentPage(1);}}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${category === 'promulgated' ? 'bg-primary text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <span className="material-symbols-outlined text-[20px]">verified</span>
                <p className="text-sm font-medium">Văn bản ban hành</p>
              </div>
              <div 
                onClick={() => {setCategory('recent'); setCurrentPage(1);}}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${category === 'recent' ? 'bg-primary text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <span className="material-symbols-outlined text-[20px]">schedule</span>
                <p className="text-sm font-medium">Tài liệu gần đây</p>
              </div>
            </div>
            <hr className="border-primary/5"/>
            
            <div className="space-y-4">
              {/* Ngày ban hành */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">NGÀY BAN HÀNH</label>
                <button className="flex h-10 w-full items-center justify-between rounded-lg bg-slate-100 dark:bg-slate-800 px-3 text-sm outline-none">
                  <span>Chọn khoảng ngày</span>
                  <span className="material-symbols-outlined">calendar_today</span>
                </button>
              </div>

              {/* Loại văn bản từ API */}
              {docTypes.length > 0 && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">LOẠI VĂN BẢN</label>
                  <div className="space-y-2">
                    {docTypes.map(type => (
                      <label key={type.id} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={selectedTypes.includes(type.id)}
                          onChange={() => toggleDocType(type.id)}
                          className="rounded text-primary focus:ring-primary border-slate-300" 
                        />
                        <span>{type.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Phòng ban từ API */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Phòng ban xử lý</label>
                <select 
                  value={selectedDept}
                  onChange={(e) => {setSelectedDept(e.target.value); setCurrentPage(1);}}
                  className="w-full rounded-lg bg-slate-100 dark:bg-slate-800 border-none text-sm focus:ring-primary outline-none"
                >
                  <option value="">Tất cả phòng ban</option>
                  {departments.map(dept => (
                    <option key={dept.department_id} value={dept.department_id}>{dept.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </aside>

        {/* CENTER CONTENT: SEARCH & RESULTS */}
        <section className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-y-auto">
          
          {/* Search Header Section */}
          <div className="p-6 bg-white dark:bg-slate-900 border-b border-primary/10 space-y-4 sticky top-0 z-10">
            <div className="max-w-4xl mx-auto flex flex-col gap-4">
              <div className="flex w-full items-stretch h-14 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary transition-all shadow-sm">
                <div className="flex items-center justify-center pl-4 text-slate-400">
                  <span className="material-symbols-outlined">search</span>
                </div>
                <input 
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-lg px-4 placeholder:text-slate-400 outline-none" 
                  placeholder="Nhập từ khóa tìm kiếm tài liệu..." 
                />
                <div className="flex items-center pr-2">
                  <button 
                    onClick={handleSearchSubmit}
                    className="bg-primary text-white h-10 px-6 rounded-lg font-bold hover:bg-primary/90 transition-colors outline-none"
                  >
                    Tìm kiếm
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Results List */}
          <div className="p-6 max-w-4xl mx-auto w-full space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-slate-500 text-sm font-medium">
                {isLoading ? 'Đang tìm kiếm...' : `Tìm thấy ${totalItems} kết quả`}
                {activeQuery && !isLoading && ` cho "${activeQuery}"`}
              </h4>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-400">Sắp xếp:</span>
                <select 
                  value={sortBy}
                  onChange={(e) => {setSortBy(e.target.value as any); setCurrentPage(1);}}
                  className="bg-transparent border-none text-sm font-semibold focus:ring-0 p-0 text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                >
                  <option value="confidence">Độ tương đồng cao nhất</option>
                  <option value="newest">Mới nhất</option>
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
                 <p className="text-slate-500">Không tìm thấy tài liệu nào phù hợp với bộ lọc hiện tại.</p>
               </div>
            ) : (
              documents.map(doc => {
                const ui = getFileIconUI(doc);
                // Tìm tên phòng ban hiển thị
                const deptName = departments.find(d => d.department_id === doc.assigned_department_id)?.name || 'Chưa phân bổ';

                return (
                  <div key={doc.document_id} className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-primary/5 hover:border-primary/20 hover:shadow-md transition-all group">
                    <div className="flex gap-4">
                      {/* Icon Card */}
                      <div className={`h-20 w-16 rounded flex flex-col items-center justify-center border ${ui.bg}`}>
                        <span className={`material-symbols-outlined text-3xl ${ui.textCol}`}>{ui.icon}</span>
                        <span className={`text-[10px] font-bold mt-1 ${ui.textCol}`}>{ui.text}</span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            {/* Tiêu đề */}
                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors cursor-pointer truncate">
                              {doc.trich_yeu || doc.so_ky_hieu || `Tài liệu chưa có tiêu đề (${doc.document_id.substring(0,8)})`}
                            </h3>
                            
                            {/* Meta data tags */}
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                              <span className="text-xs text-slate-400 flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">event</span> {formatDate(doc.ngay_van_ban)}
                              </span>
                              <span className="text-xs text-slate-400 flex items-center gap-1 max-w-[200px] truncate">
                                <span className="material-symbols-outlined text-sm">apartment</span> {deptName}
                              </span>
                              {doc.so_ky_hieu && (
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                  <span className="material-symbols-outlined text-sm">description</span> {doc.so_ky_hieu}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Confidence Score AI */}
                          {doc.confidence && (
                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                              <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full text-xs font-bold border border-green-100 dark:border-green-900/30">
                                <span className="material-symbols-outlined text-[14px]">bolt</span>
                                {Math.round(doc.confidence * 100)}% Tương đồng
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Summary / Trích yếu */}
                        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                          {doc.summary || doc.trich_yeu || 'Không có tóm tắt cho tài liệu này.'}
                        </p>
                        
                        {/* Actions */}
                        <div className="mt-4 flex items-center gap-3">
                          <button className="text-sm font-bold text-slate-500 flex items-center gap-1 hover:text-slate-700 outline-none">
                            <span className="material-symbols-outlined text-[18px]">download</span> Tải về
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Pagination Controls */}
            {!isLoading && totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6 pb-10">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 outline-none"
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button 
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors outline-none font-bold ${
                      currentPage === page 
                        ? 'bg-primary text-white' 
                        : 'border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 outline-none"
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default DocumentRepositoryPage;