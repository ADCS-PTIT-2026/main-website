import DocumentIntegrationState from '../../integration/DocumentIntegrationState';
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { searchDocuments, deleteDocument, type DocumentResponse } from '../../../api/document';
import { departmentApi } from '../../../api/department';
import axiosClient from '../../../api/axiosClient';
import { Authorized } from '../../../components/common/Authorized';

const getFileIconUI = (document: DocumentResponse) => {
  const type = document.loai_van_ban_text?.toLowerCase() || '';
  if (type.includes('nghị quyết') || type.includes('quyết định')) {
    return {
      icon: 'picture_as_pdf',
      text: 'PDF',
      bg: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200/70 dark:border-rose-900/40',
      textCol: 'text-primary',
    };
  }
  if (type.includes('báo cáo') || type.includes('công văn')) {
    return {
      icon: 'article',
      text: 'DOCX',
      bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200/70 dark:border-blue-900/40',
      textCol: 'text-blue-600 dark:text-blue-400',
    };
  }
  return {
    icon: 'description',
    text: 'VĂN BẢN',
    bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200/70 dark:border-amber-900/40',
    textCol: 'text-amber-600 dark:text-amber-400',
  };
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
  const [searchMode, setSearchMode] = useState<'hybrid' | 'semantic' | 'keyword' | 'exact'>('keyword');
  const [dsSearch, setDsSearch] = useState(false);
  const [sourceType, setSourceType] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [urgency, setUrgency] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [searchError, setSearchError] = useState('');
  useEffect(() => {
    axiosClient.get<never, { data_service_search: boolean }>('/documents/search-capabilities').then((response) => {
      setDsSearch(Boolean(response.data_service_search));
      if (response.data_service_search) setSearchMode('hybrid');
    }).catch(() => setDsSearch(false));
  }, []);
  const [sortBy, setSortBy] = useState<'relevance' | 'newest'>('newest');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
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
  const [modalMobileTab, setModalMobileTab] = useState<'info' | 'file'>('info');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

  // --- STATE CHO FILE RAW VIEWER ---
  const [rawFileUrl, setRawFileUrl] = useState<string | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    departmentApi
      .getAll()
      .then((tree) => {
        const flatList: { id: string; name: string }[] = [];
        const traverse = (nodes: any[]) => {
          nodes.forEach((node) => {
            flatList.push({
              id: String(node.department_id || node.id),
              name: node.ten_hien_thi || node.name,
            });
            if (node.children && node.children.length > 0) {
              traverse(node.children);
            }
          });
        };
        traverse(tree || []);
        setDepartments(flatList);
      })
      .catch(() => {
        // Ignore error silently
      });
  }, []);

  const fetchDocuments = async () => {
    setIsLoading(true);
    setSearchError('');
    try {
      const response = await searchDocuments({
        query: activeQuery.trim() ? activeQuery.trim() : undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        department_id: selectedDepartment !== 'all' ? selectedDepartment : undefined,
        document_type: selectedDocType !== 'all' ? selectedDocType : undefined,
        sort_by: sortBy, search_mode: searchMode, source_type: sourceType || undefined, status: statusFilter || undefined, do_khan: urgency || undefined,
        page: currentPage,
        page_size: ITEMS_PER_PAGE,
      });

      setWarnings(response.warnings || []);
      let resultData: DocumentResponse[] = [];
      let total = 0;
      let pages = 1;

      if (Array.isArray(response)) {
        resultData = response;
        total = response.length;
        pages = Math.ceil(total / ITEMS_PER_PAGE);
      } else if (response) {
        const rawItems = response.data || (response as any).results || (response as any).items || [];

        resultData = rawItems;

        total = response.total ?? resultData.length;
        pages = response.total_pages ?? Math.ceil(total / ITEMS_PER_PAGE);
      }

      setDocuments(resultData);
      setTotalItems(total);
      setTotalPages(pages > 0 ? pages : 1);
    } catch {
      setSearchError('Không thể tìm kiếm lúc này. Vui lòng thử lại; kết quả chưa được cập nhật.');
      setWarnings([]);
      setDocuments([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [activeQuery, currentPage, selectedDocType, selectedDepartment, startDate, endDate, sortBy, searchMode, sourceType, statusFilter, urgency]);

  useEffect(() => {
    if (selectedDocument) {
      setModalMobileTab('info');
      setIsLoadingFile(true);
      setFileError(null);
      axiosClient
        .get(`/documents/${selectedDocument.document_id}/file`, { responseType: 'blob' })
        .then((response: any) => {
          const url = URL.createObjectURL(response);
          setRawFileUrl(url);
          setIsLoadingFile(false);
        })
        .catch(() => {
          setFileError('Không thể tải tệp hiển thị. Tệp gốc có thể không tồn tại hoặc máy chủ đang bận.');
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
      toast.error('Ngày bắt đầu không được lớn hơn ngày kết thúc!');
      return;
    }
    setStartDate(newStartDate);
    setCurrentPage(1);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value;
    if (startDate && newEndDate < startDate) {
      toast.error('Ngày kết thúc không được nhỏ hơn ngày bắt đầu!');
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
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getDepartmentName = (deptId?: string | null) => {
    if (!deptId) return 'Chưa phân bổ';
    return departments.find((d) => String(d.id) === String(deptId))?.name || deptId;
  };

  const handleDeleteDocument = async (force: boolean = false) => {
    if (!selectedDocument) return;

    setIsDeleting(true);
    setDeleteErrorMessage(null);
    try {
      await deleteDocument(selectedDocument.document_id, force);
      toast.success('Đã xóa văn bản thành công đồng bộ trên hệ thống!');
      setSelectedDocument(null);
      setIsDeleteOpen(false);
      fetchDocuments();
    } catch (error: any) {
      const detail = error?.response?.data?.detail || 'Không thể xóa văn bản lúc này. Vui lòng thử lại!';
      setDeleteErrorMessage(detail);
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (isDeleteOpen || selectedDocument) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDeleteOpen, selectedDocument]);

  const hasActiveFilters = Boolean(
    searchInput || activeQuery || selectedDocType !== 'all' || selectedDepartment !== 'all' || startDate || endDate
  );

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 font-display text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {searchError && <p role="alert" className="text-rose-600 dark:text-rose-400">{searchError} <button className="underline" onClick={() => void fetchDocuments()}>Thử lại</button></p>}
        {!!warnings.length && <p role="status">Tìm kiếm ngữ nghĩa tạm không khả dụng; kết quả đang dùng tìm kiếm từ khóa.</p>}
        <div className="grid sm:grid-cols-4 gap-3">
          <label>Chế độ tìm kiếm<select className="block w-full rounded-lg p-2 bg-white dark:bg-slate-800 border" value={searchMode} onChange={e => { setSearchMode(e.target.value as typeof searchMode); setCurrentPage(1); }}>
            <option value="keyword">Từ khóa</option><option disabled={!dsSearch} value="hybrid">Kết hợp</option><option disabled={!dsSearch} value="semantic">Ngữ nghĩa</option><option disabled={!dsSearch} value="exact">Cụm từ chính xác</option>
          </select></label>
          <label>Nguồn<select className="block w-full rounded-lg p-2 bg-white dark:bg-slate-800 border" value={sourceType} onChange={e => { setSourceType(e.target.value); setCurrentPage(1); }}><option value="">Mọi nguồn</option><option value="user_upload">Người dùng</option><option value="crawler">Crawler</option></select></label>
          <label>Trạng thái<select className="block w-full rounded-lg p-2 bg-white dark:bg-slate-800 border" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}><option value="">Mặc định</option><option value="processed">Đã xử lý</option><option value="approved">Đã duyệt</option><option value="queued">Đang chờ</option><option value="failed">Lỗi</option></select></label>
          <label>Độ khẩn<select className="block w-full rounded-lg p-2 bg-white dark:bg-slate-800 border" value={urgency} onChange={e => { setUrgency(e.target.value); setCurrentPage(1); }}><option value="">Mọi mức</option><option value="Thường">Thường</option><option value="Khẩn">Khẩn</option><option value="Thượng khẩn">Thượng khẩn</option><option value="Hỏa tốc">Hỏa tốc</option></select></label>
        </div>
        {/* Khối Tìm kiếm Ngữ nghĩa & Bộ lọc đa chiều */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
          {/* Thanh tìm kiếm lớn */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="flex-1 flex items-center h-12 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary transition-all">
              <span className="material-symbols-outlined text-slate-400 text-[20px] mr-2.5">search</span>
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm sm:text-base text-slate-900 dark:text-white placeholder:text-slate-400 outline-none"
                placeholder="Tìm kiếm ngữ nghĩa (Semantic Search) theo nội dung, số hiệu, trích yếu..."
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    if (activeQuery) {
                      setActiveQuery('');
                      setCurrentPage(1);
                    }
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={handleSearchSubmit}
              className="h-12 px-6 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 shadow-md shadow-primary/20 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">manage_search</span>
              Tìm kiếm AI
            </button>
          </div>

          {/* Hàng bộ lọc chi tiết */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            {/* Lọc loại văn bản */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 h-10">
              <span className="text-slate-400 material-symbols-outlined text-[17px]">category</span>
              <select
                value={selectedDocType}
                onChange={(e) => {
                  setSelectedDocType(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent border-none text-xs font-semibold focus:ring-0 text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
              >
                {COMMON_DOC_TYPES.map((t) => (
                  <option key={t.value} value={t.value} className="bg-white dark:bg-slate-900">
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Lọc phòng ban */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 h-10 max-w-xs">
              <span className="text-slate-400 material-symbols-outlined text-[17px]">domain</span>
              <select
                value={selectedDepartment}
                onChange={(e) => {
                  setSelectedDepartment(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent border-none text-xs font-semibold focus:ring-0 text-slate-700 dark:text-slate-200 outline-none cursor-pointer truncate max-w-[180px]"
              >
                <option value="all" className="bg-white dark:bg-slate-900">
                  Tất cả phòng ban
                </option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id} className="bg-white dark:bg-slate-900">
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Lọc ngày tháng */}
            <div className="flex flex-wrap items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 min-h-[40px]">
              <span className="text-slate-400 material-symbols-outlined text-[17px]">calendar_month</span>
              <input
                type="date"
                value={startDate}
                max={endDate || undefined}
                onChange={handleStartDateChange}
                title="Từ ngày"
                className="bg-transparent border-none text-xs font-medium focus:ring-0 p-0 outline-none text-slate-700 dark:text-slate-200 w-[112px]"
              />
              <span className="text-slate-400 text-xs">→</span>
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={handleEndDateChange}
                title="Đến ngày"
                className="bg-transparent border-none text-xs font-medium focus:ring-0 p-0 outline-none text-slate-700 dark:text-slate-200 w-[112px]"
              />
            </div>

            {/* Nút đặt lại */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilter}
                className="flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-100/60 bg-rose-50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-800/50 px-3 h-10 rounded-xl font-bold transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                Đặt lại bộ lọc
              </button>
            )}
          </div>
        </section>

        {/* Thanh điều khiển kết quả: Số lượng + Sắp xếp + Chế độ xem (Thẻ / Bảng) */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm font-semibold">
              {isLoading ? (
                'Đang truy vấn kho lưu trữ...'
              ) : (
                <>
                  Hiển thị <strong className="text-slate-900 dark:text-white">{documents.length}</strong> /{' '}
                  <strong className="text-slate-900 dark:text-white">{totalItems}</strong> văn bản
                </>
              )}
              {activeQuery && !isLoading && (
                <span>
                  {' '}
                  cho từ khóa <span className="text-primary font-bold">"{activeQuery}"</span>
                </span>
              )}
            </h2>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Sắp xếp */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 h-9 rounded-xl shadow-sm">
              <span className="text-slate-400 material-symbols-outlined text-[16px]">sort</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="bg-transparent border-none text-xs font-bold focus:ring-0 p-0 text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
              >
                <option value="newest" className="bg-white dark:bg-slate-900">
                  Mới nhất trước
                </option>
                <option disabled={!dsSearch} value="relevance" className="bg-white dark:bg-slate-900">
                  Độ liên quan
                </option>
              </select>
            </div>

            {/* Chuyển đổi dạng Thẻ / Bảng */}
            <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl shadow-sm">
              <button
                type="button"
                onClick={() => setViewMode('card')}
                className={`p-1.5 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                  viewMode === 'card'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
                title="Chế độ xem thẻ"
              >
                <span className="material-symbols-outlined text-[18px]">view_agenda</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
                title="Chế độ xem bảng"
              >
                <span className="material-symbols-outlined text-[18px]">table_rows</span>
              </button>
            </div>
          </div>
        </div>

        {/* Danh sách kết quả */}
        {isLoading ? (
          <div className="flex flex-col justify-center items-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span className="material-symbols-outlined animate-spin text-4xl text-primary mb-2">sync</span>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Đang tìm kiếm trong Vector DB...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="size-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <span className="material-symbols-outlined text-4xl">search_off</span>
            </div>
            <p className="text-base font-bold text-slate-800 dark:text-slate-200">Không tìm thấy văn bản phù hợp</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Hãy thử thay đổi từ khóa tìm kiếm hoặc đặt lại bộ lọc thời gian / phòng ban.
            </p>
          </div>
        ) : viewMode === 'card' ? (
          <div className="grid grid-cols-1 gap-3.5">
            {documents.map((doc) => {
              const ui = getFileIconUI(doc);
              return (
                <div
                  key={doc.document_id}
                  onClick={() => setSelectedDocument(doc)}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 hover:border-primary/40 hover:shadow-md transition-all group cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`h-16 w-14 sm:h-20 sm:w-16 rounded-xl flex flex-col items-center justify-center border ${ui.bg} shrink-0`}
                    >
                      <span className={`material-symbols-outlined text-2xl sm:text-3xl ${ui.textCol}`}>{ui.icon}</span>
                      <span className={`text-[9px] font-bold mt-1 ${ui.textCol}`}>{ui.text}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <DocumentIntegrationState document={doc} />
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors line-clamp-2">
                          {doc.trich_yeu || doc.so_ky_hieu || `Văn bản #${doc.document_id.substring(0, 8)}`}
                        </h3>

                        {doc.similarity != null && (
                          <span
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 self-start ${
                              doc.similarity >= 0.845
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
                            }`}
                          >
                            Tương đồng: {Math.round(doc.similarity * 100)}%
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-2.5">
                        {doc.so_ky_hieu && (
                          <span className="text-xs text-slate-600 dark:text-slate-300 font-semibold flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                            <span className="material-symbols-outlined text-[14px] text-primary">tag</span>
                            {doc.so_ky_hieu}
                          </span>
                        )}
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                          <span className="material-symbols-outlined text-[14px]">event</span>
                          {formatDate(doc.ngay_van_ban)}
                        </span>
                        {doc.don_vi_ban_hanh && (
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg truncate max-w-xs">
                            <span className="material-symbols-outlined text-[14px]">account_balance</span>
                            {doc.don_vi_ban_hanh}
                          </span>
                        )}
                        {doc.assigned_department_id && (
                          <span className="text-xs text-primary font-semibold flex items-center gap-1 bg-primary/10 px-2.5 py-1 rounded-lg">
                            <span className="material-symbols-outlined text-[14px]">domain</span>
                            {getDepartmentName(doc.assigned_department_id)}
                          </span>
                        )}
                      </div>

                      <p className="mt-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {doc.summary || doc.trich_yeu || 'Chưa có tóm tắt nội dung cho văn bản này.'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Chế độ xem Bảng (Table View) giúp quét nhanh hàng loạt văn bản */
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse text-xs min-w-[820px]">
                <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Số ký hiệu</th>
                    <th className="py-3.5 px-4">Trích yếu / Tóm tắt</th>
                    <th className="py-3.5 px-4">Loại VB</th>
                    <th className="py-3.5 px-4">Phòng ban</th>
                    <th className="py-3.5 px-4">Ngày ban hành</th>
                    <th className="py-3.5 px-4 text-right">Xem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {documents.map((doc) => (
                    <tr
                      key={doc.document_id}
                      onClick={() => setSelectedDocument(doc)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-4 font-bold text-primary whitespace-nowrap">
                        {doc.so_ky_hieu || `#${doc.document_id.slice(0, 8)}`}
                      </td>
                      <td className="py-3.5 px-4 max-w-md">
                        <p className="font-bold text-slate-900 dark:text-white line-clamp-1">
                          {doc.trich_yeu || 'Không có trích yếu'}
                        </p>
                        {doc.summary && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                            {doc.summary}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                          {doc.loai_van_ban_text || 'Văn bản'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 dark:text-slate-300 font-medium">
                        {getDepartmentName(doc.assigned_department_id)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400">
                        {formatDate(doc.ngay_van_ban)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Phân trang */}
        {!isLoading && totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-4 pb-8">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="size-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">chevron_left</span>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`size-9 flex items-center justify-center rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentPage === page
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="size-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          </div>
        )}
      </div>

      {/* --- MODAL CHI TIẾT VĂN BẢN VỚI RAW VIEWER --- */}
      {selectedDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-2 sm:p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-7xl h-[94vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 animate-scale-up">
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined">description</span>
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                    {selectedDocument.so_ky_hieu || selectedDocument.trich_yeu || 'Văn bản lưu trữ'}
                  </h2>
                  <p className="text-[11px] text-slate-500 font-mono truncate">ID: {selectedDocument.document_id}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedDocument(null)}
                className="size-9 flex items-center justify-center rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors outline-none cursor-pointer shrink-0"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Mobile Tab Switcher trong Modal (< lg) */}
            <div className="lg:hidden flex items-center gap-2 p-2.5 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setModalMobileTab('info')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  modalMobileTab === 'info'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Thông tin & Tóm tắt AI
              </button>
              <button
                type="button"
                onClick={() => setModalMobileTab('file')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  modalMobileTab === 'file'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Tệp văn bản gốc
              </button>
            </div>

            {/* Modal Body: Chia 2 cột trên màn hình lớn */}
            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row bg-slate-50/50 dark:bg-slate-950 p-3 sm:p-5 gap-5">
              {/* CỘT TRÁI: HIỂN THỊ FILE GỐC (RAW FILE VIEWER) */}
              <div
                className={`flex-[1.6] bg-slate-200/70 dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 relative flex flex-col shadow-inner ${
                  modalMobileTab === 'info' ? 'hidden lg:flex' : 'flex'
                }`}
              >
                {isLoadingFile ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-6">
                    <span className="material-symbols-outlined animate-spin text-4xl text-primary mb-2">sync</span>
                    <p className="text-xs sm:text-sm font-medium">Đang tải tệp văn bản gốc...</p>
                  </div>
                ) : fileError ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-rose-500 p-8 text-center">
                    <span className="material-symbols-outlined text-5xl mb-3 opacity-70">broken_image</span>
                    <p className="text-sm font-semibold">{fileError}</p>
                  </div>
                ) : rawFileUrl ? (
                  <iframe
                    src={rawFileUrl}
                    className="w-full h-full flex-1 border-none bg-white"
                    title="Trình xem văn bản"
                  />
                ) : (
                  <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                    Không có tệp để hiển thị
                  </div>
                )}
              </div>

              {/* CỘT PHẢI: METADATA VÀ AI SUMMARY */}
              <div
                className={`flex-1 lg:max-w-[440px] overflow-y-auto space-y-4 custom-scrollbar pr-1 ${
                  modalMobileTab === 'file' ? 'hidden lg:block' : 'block'
                }`}
              >
                {/* AI Summary */}
                <div className="bg-primary/5 dark:bg-primary/10 p-4 sm:p-5 rounded-2xl border border-primary/20">
                  <div className="flex items-center justify-between mb-2.5">
                    <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">smart_toy</span>
                      Tóm tắt AI
                    </h3>
                    {selectedDocument.similarity != null && (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 bg-white dark:bg-slate-800 text-primary rounded-full shadow-sm">
                        Độ tương đồng: {Math.round(selectedDocument.similarity * 100)}%
                      </span>
                    )}
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-xs sm:text-sm">
                    {selectedDocument.summary || 'AI chưa tạo tóm tắt cho văn bản này.'}
                  </p>
                </div>

                {/* Trích yếu */}
                <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">short_text</span>
                    Trích yếu nội dung
                  </h3>
                  <p className="text-slate-900 dark:text-slate-100 text-sm font-semibold leading-relaxed">
                    {selectedDocument.trich_yeu || 'Không có thông tin trích yếu.'}
                  </p>
                </div>

                {/* Key Points */}
                {selectedDocument.key_points && selectedDocument.key_points.length > 0 && (
                  <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">format_list_bulleted</span>
                      Điểm chính
                    </h3>
                    <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                      {selectedDocument.key_points.map((point, idx) => (
                        <li key={idx}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Thuộc tính Metadata */}
                <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">
                    Thuộc tính hành chính
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Loại văn bản</p>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                        {selectedDocument.loai_van_ban_text || 'Chưa phân loại'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Ngày ban hành</p>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                        {formatDate(selectedDocument.ngay_van_ban)}
                      </p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Cơ quan ban hành</p>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                        {selectedDocument.don_vi_ban_hanh || 'Không rõ'}
                      </p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Người ký</p>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                        {selectedDocument.nguoi_ky
                          ? `${selectedDocument.nguoi_ky} (${selectedDocument.chuc_vu_nguoi_ky || 'Không rõ chức vụ'})`
                          : 'Không có thông tin'}
                      </p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Phòng ban phụ trách</p>
                      <p className="font-bold text-primary mt-0.5">
                        {getDepartmentName(selectedDocument.assigned_department_id)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-4 sm:px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end gap-2.5 shrink-0">
              <button
                onClick={() => setSelectedDocument(null)}
                className="px-4 py-2 text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl transition-colors outline-none cursor-pointer"
              >
                Đóng
              </button>

              <Authorized permission="doc:delete">
                <button
                  onClick={() => {
                    setDeleteErrorMessage(null);
                    setIsDeleteOpen(true);
                  }}
                  disabled={isDeleting}
                  className="px-4 py-2 text-xs sm:text-sm font-bold bg-rose-600 text-white hover:bg-rose-700 rounded-xl shadow-md shadow-rose-600/20 flex items-center gap-1.5 outline-none disabled:opacity-70 cursor-pointer transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                  Xóa văn bản
                </button>
              </Authorized>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteOpen && (
        <div
          onClick={() => {
            setIsDeleteOpen(false);
            setDeleteErrorMessage(null);
          }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-800 animate-scale-up"
          >
            <div className="flex items-center justify-center size-12 rounded-full bg-rose-100 dark:bg-rose-900/30 mx-auto mb-4">
              <span className="material-symbols-outlined text-rose-600 text-2xl">warning</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-center text-slate-900 dark:text-white mb-2">
              Xóa văn bản khỏi kho lưu trữ?
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 text-center mb-5 leading-relaxed">
              Bạn có chắc muốn xóa{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {selectedDocument?.so_ky_hieu || selectedDocument?.trich_yeu || 'văn bản này'}
              </span>
              ? Hành động này sẽ đồng bộ xóa trên cả Data Service & Vector DB.
            </p>

            {deleteErrorMessage && (
              <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-200">
                <p className="font-bold mb-1">Cảnh báo:</p>
                <p>{deleteErrorMessage}</p>
                <p className="mt-2 text-[11px] text-slate-500 font-medium">
                  Bạn có muốn tiếp tục xóa cưỡng bức trên Web DB không?
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => {
                  setIsDeleteOpen(false);
                  setDeleteErrorMessage(null);
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 outline-none transition-colors cursor-pointer"
              >
                Hủy
              </button>
              {deleteErrorMessage ? (
                <button
                  onClick={() => handleDeleteDocument(true)}
                  className="px-4 py-2 rounded-xl bg-amber-600 text-white hover:bg-amber-700 text-xs font-bold outline-none transition-colors cursor-pointer"
                >
                  Xóa cưỡng bức (Force)
                </button>
              ) : (
                <button
                  onClick={() => handleDeleteDocument(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 text-xs font-bold outline-none transition-colors cursor-pointer"
                >
                  {isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentRepositoryPage;