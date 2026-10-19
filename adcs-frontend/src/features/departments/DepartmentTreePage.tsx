import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { usePermission } from '../../hooks/usePermission';
import { departmentApi, type DepartmentTreeResponse, type DepartmentPayload, type DepartmentResponse } from '../../api/department';

const DepartmentManagementPage: React.FC = () => {
  const { hasPermission } = usePermission();
  const [treeData, setTreeData] = useState<DepartmentTreeResponse[]>([]);
  const [flatDepartments, setFlatDepartments] = useState<DepartmentResponse[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [viewMode, setViewMode] = useState<'tree' | 'table'>('tree');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const defaultFormState: DepartmentPayload = {
    id: null,
    name: '',
    code: '',
    description: '',
    parent_id: null,
    ten_viet_tat: '',
    ten_hien_thi: '',
    loai_don_vi: '',
    cap_don_vi: '',
    level_number: null,
    is_formal: false,
    has_seal: false,
  };

  const [formData, setFormData] = useState<DepartmentPayload>(defaultFormState);
  const [loading, setLoading] = useState(false);

  const [zoom, setZoom] = useState(0.95);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (treeData.length > 0 && expandedNodes.size === 0) {
      const rootIds = treeData.map((n) => n.department_id);
      setExpandedNodes(new Set(rootIds));
    }
  }, [treeData]);

  const handleExpandAll = () => {
    const allIds = flatDepartments.map((d) => d.department_id);
    setExpandedNodes(new Set(allIds));
  };

  const handleCollapseAll = () => {
    const rootIds = treeData.map((n) => n.department_id);
    setExpandedNodes(new Set(rootIds));
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as Element).closest('.prevent-drag')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const flattenTree = (nodes: DepartmentTreeResponse[]): DepartmentResponse[] => {
    let list: DepartmentResponse[] = [];
    nodes.forEach((node) => {
      const { children, ...rest } = node;
      list.push(rest);
      if (children && children.length > 0) {
        list = list.concat(flattenTree(children));
      }
    });
    return list;
  };

  const loadDepartments = async () => {
    try {
      const data = await departmentApi.getAll();
      setTreeData(data);
      setFlatDepartments(flattenTree(data));
    } catch {
      toast.error('Không thể tải danh sách phòng ban');
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    if (selectedId && !isCreating) {
      const dept = flatDepartments.find((d) => d.department_id === selectedId);
      if (dept) {
        setFormData({
          id: dept.id || null,
          name: dept.name,
          code: dept.code || '',
          description: dept.description || '',
          ten_viet_tat: dept.ten_viet_tat || '',
          ten_hien_thi: dept.ten_hien_thi || '',
          loai_don_vi: dept.loai_don_vi || '',
          cap_don_vi: dept.cap_don_vi || '',
          level_number: dept.level_number || null,
          is_formal: dept.is_formal || false,
          has_seal: dept.has_seal || false,
          parent_id: dept.parent_id || null,
        });
      }
    }
  }, [selectedId, isCreating, flatDepartments]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name === 'id' || name === 'parent_id' || name === 'level_number') {
      setFormData((prev) => ({ ...prev, [name]: value === '' ? null : Number(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.name.trim()) {
      toast.error('Vui lòng nhập tên phòng ban!');
      return;
    }
    if (!formData.description || formData.description.trim().length < 10) {
      toast.error('Vui lòng nhập mô tả chức năng nhiệm vụ (tối thiểu 10 ký tự) để AI phân loại chính xác!');
      return;
    }

    try {
      setLoading(true);
      if (isCreating) {
        await departmentApi.create(formData);
        toast.success('Thêm phòng ban mới thành công!');
      } else if (selectedId) {
        await departmentApi.update(selectedId, formData);
        toast.success('Cập nhật thông tin phòng ban thành công!');
      }
      await loadDepartments();
      setIsCreating(false);
      if (isCreating) setSelectedId(null);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Đã có lỗi xảy ra khi lưu phòng ban');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedId || isCreating) return;
    try {
      setLoading(true);
      await departmentApi.delete(selectedId);
      toast.success('Đã xóa phòng ban thành công!');
      setShowDeleteConfirm(false);
      setSelectedId(null);
      await loadDepartments();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Không thể xóa phòng ban có chứa đơn vị trực thuộc');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setIsCreating(true);
    setSelectedId('new');
    setFormData({ ...defaultFormState, name: 'Phòng ban mới' });
  };

  const filteredDepartments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return flatDepartments;
    return flatDepartments.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.ten_hien_thi && d.ten_hien_thi.toLowerCase().includes(q)) ||
        (d.code && d.code.toLowerCase().includes(q)) ||
        (d.description && d.description.toLowerCase().includes(q))
    );
  }, [flatDepartments, searchQuery]);

  const getParentName = (parentId?: number | null) => {
    if (!parentId) return '— (Cấp cao nhất)';
    const parent = flatDepartments.find((d) => d.id === parentId);
    return parent ? parent.ten_hien_thi || parent.name : `ID: ${parentId}`;
  };

  const RenderNode = ({ node, level }: { node: DepartmentTreeResponse; level: number }) => {
    const isSelected = node.department_id === selectedId;
    const isRoot = level === 0;
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.department_id);
    const isLeafParent = hasChildren && node.children.every((c) => !c.children || c.children.length === 0);
    const isMatchedSearch =
      searchQuery.trim().length > 0 &&
      (node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (node.code && node.code.toLowerCase().includes(searchQuery.toLowerCase())));

    return (
      <div className="flex flex-col items-center relative">
        {!isRoot && <div className="w-0.5 h-8 bg-slate-300 dark:bg-slate-700"></div>}

        <div
          onClick={() => {
            setSelectedId(node.department_id);
            setIsCreating(false);
          }}
          className={`prevent-drag w-64 bg-white dark:bg-slate-900 border-2 rounded-2xl p-4 shadow-md flex flex-col items-center text-center relative z-10 cursor-pointer transition-all hover:-translate-y-0.5 ${
            isSelected
              ? 'border-primary ring-4 ring-primary/15 shadow-lg'
              : isMatchedSearch
              ? 'border-amber-500 ring-4 ring-amber-500/20'
              : isRoot
              ? 'border-primary/80'
              : 'border-slate-200 dark:border-slate-800 hover:border-primary/50'
          }`}
        >
          {isRoot ? (
            <div className="size-11 rounded-2xl border border-primary/30 bg-primary/10 flex items-center justify-center text-primary mb-2.5">
              <span className="material-symbols-outlined text-2xl">account_balance</span>
            </div>
          ) : (
            <div
              className={`size-9 rounded-xl flex items-center justify-center mb-2.5 ${
                isSelected ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{hasChildren ? 'account_tree' : 'groups'}</span>
            </div>
          )}

          <h4
            className={`font-bold uppercase tracking-wide text-xs sm:text-sm line-clamp-2 ${
              isRoot ? 'text-slate-900 dark:text-white' : 'text-slate-800 dark:text-slate-200'
            }`}
          >
            {node.ten_hien_thi || node.name}
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
            {node.code || 'ĐƠN VỊ'} {node.id && `• #${node.id}`}
          </p>

          {isRoot && (
            <span className="mt-2 text-[10px] bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-bold uppercase">
              Cấp Học viện
            </span>
          )}

          {hasChildren && (
            <button
              onClick={(e) => toggleExpand(node.department_id, e)}
              className="absolute -bottom-3 left-1/2 -translate-x-1/2 size-6 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-primary hover:border-primary shadow-sm transition-colors prevent-drag outline-none cursor-pointer"
              title={isExpanded ? 'Thu gọn nhánh' : `Mở rộng (${node.children.length} đơn vị)`}
            >
              <span className="material-symbols-outlined text-sm">{isExpanded ? 'remove' : 'add'}</span>
            </button>
          )}
        </div>

        {isExpanded &&
          hasChildren &&
          (isLeafParent ? (
            <div className="flex flex-col items-center mt-3 relative w-full">
              <div className="w-0.5 h-6 bg-slate-300 dark:bg-slate-700"></div>
              <div className="relative flex flex-col gap-3">
                <div
                  className="absolute top-0 left-[-1.5rem] h-0.5 bg-slate-300 dark:bg-slate-700"
                  style={{ width: 'calc(50% + 1.5rem)' }}
                ></div>

                {node.children.map((child, index) => {
                  const isLast = index === node.children.length - 1;
                  const isChildSelected = child.department_id === selectedId;
                  const isChildMatched =
                    searchQuery.trim().length > 0 &&
                    (child.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (child.code && child.code.toLowerCase().includes(searchQuery.toLowerCase())));

                  return (
                    <div key={child.department_id} className="relative prevent-drag">
                      <div
                        className="absolute left-[-1.5rem] w-0.5 bg-slate-300 dark:bg-slate-700"
                        style={{ top: 0, bottom: isLast ? '50%' : '-0.75rem' }}
                      ></div>
                      <div className="absolute top-1/2 left-[-1.5rem] w-6 h-0.5 bg-slate-300 dark:bg-slate-700 -translate-y-1/2"></div>

                      <div
                        onClick={() => {
                          setSelectedId(child.department_id);
                          setIsCreating(false);
                        }}
                        className={`w-64 bg-white dark:bg-slate-900 border-2 rounded-xl p-3 shadow-sm flex items-center text-left cursor-pointer transition-all hover:translate-x-1 ${
                          isChildSelected
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/15'
                            : isChildMatched
                            ? 'border-amber-500 ring-2 ring-amber-500/20'
                            : 'border-slate-200 dark:border-slate-800 hover:border-primary/50'
                        }`}
                      >
                        <div
                          className={`size-8 shrink-0 rounded-lg flex items-center justify-center mr-3 ${
                            isChildSelected
                              ? 'bg-primary text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          <span className="material-symbols-outlined text-sm">groups</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4
                            className={`font-bold text-xs sm:text-sm truncate ${
                              isChildSelected ? 'text-primary' : 'text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {child.ten_hien_thi || child.name}
                          </h4>
                          {child.code && (
                            <p className="text-[10px] text-slate-400 font-mono truncate">{child.code}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-0.5 h-8 bg-slate-300 dark:bg-slate-700 mt-3 pointer-events-none"></div>
              <div className="flex flex-row items-start justify-center">
                {node.children.map((child, index) => {
                  const isFirst = index === 0;
                  const isLast = index === node.children.length - 1;
                  const hasOnlyOneChild = node.children.length === 1;

                  return (
                    <div key={child.department_id} className="relative flex flex-col items-center px-5">
                      {!hasOnlyOneChild && (
                        <>
                          <div
                            className={`absolute top-0 left-0 w-1/2 h-0.5 bg-slate-300 dark:bg-slate-700 pointer-events-none ${
                              isFirst ? 'hidden' : ''
                            }`}
                          />
                          <div
                            className={`absolute top-0 left-1/2 w-1/2 h-0.5 bg-slate-300 dark:bg-slate-700 pointer-events-none ${
                              isLast ? 'hidden' : ''
                            }`}
                          />
                        </>
                      )}
                      <RenderNode node={child} level={level + 1} />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
      </div>
    );
  };

  return (
    <div className="flex flex-1 h-[calc(100vh-3.5rem)] w-full overflow-hidden bg-slate-50 dark:bg-slate-950 font-display text-slate-900 dark:text-slate-100 relative">
      {/* Khu vực chính: Sơ đồ cây hoặc Danh sách bảng */}
      <section className="flex-1 flex flex-col overflow-hidden relative min-w-0">
        {/* Thanh công cụ điều khiển (Toolbar) */}
        <div className="flex-none p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-20 shadow-sm">
          {/* Chuyển đổi Sơ đồ cây / Bảng danh sách + Tìm kiếm */}
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[240px]">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('tree')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'tree'
                    ? 'bg-white dark:bg-slate-900 text-primary shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">account_tree</span>
                Sơ đồ cây
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-900 text-primary shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">table_rows</span>
                Danh sách ({flatDepartments.length})
              </button>
            </div>

            {/* Ô tìm kiếm đơn vị */}
            <div className="relative flex-1 max-w-xs">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[17px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tên đơn vị, mã code..."
                className="w-full pl-9 pr-7 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-primary text-slate-900 dark:text-white"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <span className="material-symbols-outlined text-[15px]">close</span>
                </button>
              )}
            </div>
          </div>

          {/* Công cụ Zoom / Mở rộng & Nút Thêm mới */}
          <div className="flex items-center gap-2">
            {viewMode === 'tree' && (
              <div className="hidden sm:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(z - 0.1, 0.4))}
                  className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 outline-none cursor-pointer"
                  title="Thu nhỏ"
                >
                  <span className="material-symbols-outlined text-[18px]">zoom_out</span>
                </button>
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 px-1.5 min-w-[44px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(z + 0.1, 1.5))}
                  className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 outline-none cursor-pointer"
                  title="Phóng to"
                >
                  <span className="material-symbols-outlined text-[18px]">zoom_in</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setZoom(0.95);
                    setPan({ x: 0, y: 0 });
                  }}
                  className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 outline-none cursor-pointer"
                  title="Căn giữa màn hình"
                >
                  <span className="material-symbols-outlined text-[18px]">center_focus_strong</span>
                </button>
                <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-0.5" />
                <button
                  type="button"
                  onClick={handleExpandAll}
                  className="px-2 py-1 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-[11px] font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
                  title="Mở rộng toàn bộ cây"
                >
                  Mở hết
                </button>
                <button
                  type="button"
                  onClick={handleCollapseAll}
                  className="px-2 py-1 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-[11px] font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
                  title="Thu gọn về cấp gốc"
                >
                  Thu gọn
                </button>
              </div>
            )}

            {hasPermission('department.create') && <button
              type="button"
              onClick={handleAddClick}
              className="px-3.5 py-2 bg-primary text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-primary/90 flex items-center gap-1.5 outline-none shadow-md shadow-primary/20 cursor-pointer shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Thêm phòng ban</span>
            </button>}
          </div>
        </div>

        {/* Nội dung: Sơ đồ cây HOẶC Danh sách bảng */}
        {viewMode === 'tree' ? (
          <div
            className={`flex-1 overflow-hidden bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:20px_20px] ${
              isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'
            }`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <div
              className="flex flex-row items-start justify-center gap-16 min-w-max p-10 transition-transform duration-75 origin-top"
              style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
            >
              {treeData.map((rootNode) => (
                <RenderNode key={rootNode.department_id} node={rootNode} level={0} />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
            <div className="max-w-6xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse text-xs min-w-[760px]">
                  <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4">Mã / ID</th>
                      <th className="py-3.5 px-4">Tên đơn vị / Phòng ban</th>
                      <th className="py-3.5 px-4">Đơn vị cấp trên</th>
                      <th className="py-3.5 px-4">Thuộc tính</th>
                      <th className="py-3.5 px-4">Mô tả ngữ cảnh AI</th>
                      <th className="py-3.5 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {filteredDepartments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          Không tìm thấy phòng ban nào phù hợp với từ khóa "{searchQuery}".
                        </td>
                      </tr>
                    ) : (
                      filteredDepartments.map((dept) => {
                        const isSelected = dept.department_id === selectedId;
                        return (
                          <tr
                            key={dept.department_id}
                            onClick={() => {
                              setSelectedId(dept.department_id);
                              setIsCreating(false);
                            }}
                            className={`transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-primary/5 dark:bg-primary/10'
                                : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                            }`}
                          >
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className="font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                                {dept.code || 'N/A'}
                              </span>
                              {dept.id != null && (
                                <span className="ml-1.5 text-[11px] text-slate-400 font-mono">#{dept.id}</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              <p className="font-bold text-slate-900 dark:text-white">
                                {dept.ten_hien_thi || dept.name}
                              </p>
                              {dept.ten_viet_tat && (
                                <p className="text-[11px] text-slate-400">Viết tắt: {dept.ten_viet_tat}</p>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium">
                              {getParentName(dept.parent_id)}
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                {dept.is_formal && (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                                    Chính thức
                                  </span>
                                )}
                                {dept.has_seal && (
                                  <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                                    Có con dấu
                                  </span>
                                )}
                                {!dept.is_formal && !dept.has_seal && (
                                  <span className="text-slate-400 text-[11px]">Phân nhánh</span>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 max-w-xs">
                              {dept.description ? (
                                <p className="text-slate-600 dark:text-slate-400 line-clamp-2">{dept.description}</p>
                              ) : (
                                <span className="text-amber-600 dark:text-amber-400 italic text-[11px]">
                                  Chưa cấu hình ngữ cảnh AI
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                type="button"
                                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-primary hover:text-white text-slate-700 dark:text-slate-300 font-bold transition-colors"
                              >
                                Chỉnh sửa
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
        )}
      </section>

      {/* Backdrop trên mobile khi mở Panel Chi tiết */}
      {selectedId && (
        <div
          onClick={() => setSelectedId(null)}
          className="fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Panel Chi tiết / Chỉnh sửa phòng ban (Responsive Drawer trên Mobile, Side Panel trên Desktop) */}
      {selectedId && (
        <aside className="fixed inset-y-0 right-0 z-40 w-full max-w-md lg:static lg:w-96 h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shadow-2xl animate-slide-left shrink-0">
          <div className="flex-none px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">{isCreating ? 'add_business' : 'domain'}</span>
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                  {isCreating ? 'Thêm mới phòng ban' : 'Chi tiết phòng ban'}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Cấu hình thông tin hành chính & ngữ cảnh AI
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedId(null)}
              className="size-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 outline-none cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 custom-scrollbar">
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                  Tên phòng ban <span className="text-primary">*</span>
                </label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                  Tên hiển thị đầy đủ
                </label>
                <input
                  name="ten_hien_thi"
                  value={formData.ten_hien_thi || ''}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    Mã đơn vị (Code)
                  </label>
                  <input
                    name="code"
                    value={formData.code || ''}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm px-3 py-2 uppercase font-mono text-slate-900 dark:text-white outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    ID nội bộ
                  </label>
                  <input
                    type="number"
                    name="id"
                    value={formData.id ?? ''}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm px-3 py-2 font-mono text-slate-900 dark:text-white outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    Tên viết tắt
                  </label>
                  <input
                    name="ten_viet_tat"
                    value={formData.ten_viet_tat || ''}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    Cấp độ (Level)
                  </label>
                  <input
                    type="number"
                    name="level_number"
                    value={formData.level_number ?? ''}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                  Phòng ban cấp trên
                </label>
                <div className="relative">
                  <select
                    name="parent_id"
                    value={formData.parent_id ?? ''}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-primary appearance-none"
                  >
                    <option value="">-- Cấp cao nhất --</option>
                    {flatDepartments
                      .filter((d) => d.department_id !== selectedId && d.id != null)
                      .map((dept) => (
                        <option key={dept.department_id} value={dept.id!}>
                          {dept.name} (ID: {dept.id})
                        </option>
                      ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-sm">
                    expand_more
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-5 py-1.5">
                <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_formal"
                    checked={formData.is_formal || false}
                    onChange={handleInputChange}
                    className="rounded text-primary focus:ring-primary"
                  />
                  Đơn vị chính thức
                </label>
                <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    name="has_seal"
                    checked={formData.has_seal || false}
                    onChange={handleInputChange}
                    className="rounded text-primary focus:ring-primary"
                  />
                  Có con dấu
                </label>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-bold text-primary uppercase mb-1">
                <span className="material-symbols-outlined text-sm align-middle mr-1">smart_toy</span>
                Mô tả chức năng nhiệm vụ (Ngữ cảnh AI) <span className="text-rose-500">*</span>
              </label>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2 leading-relaxed">
                Mô tả này được nạp trực tiếp vào AI để tự động phân luồng và gán phòng ban xử lý văn bản chính xác (tối thiểu 10 ký tự).
              </p>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                placeholder="Ví dụ: Tiếp nhận, thẩm định văn bản hành chính, quản lý công văn đi đến, lưu trữ hồ sơ của Học viện..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm px-3 py-2 text-slate-900 dark:text-white placeholder:italic outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                rows={4}
              />
            </div>
          </div>

          <div className="flex-none p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex gap-2.5">
            {hasPermission(isCreating ? 'department.create' : 'department.update') && <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 py-2.5 bg-primary text-white rounded-xl font-bold text-xs sm:text-sm hover:bg-primary/90 disabled:opacity-70 transition-all outline-none shadow-md shadow-primary/20 cursor-pointer"
            >
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>}
            {!isCreating && hasPermission("department.delete") && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading}
                className="px-3.5 py-2.5 border border-rose-200 dark:border-rose-800/60 bg-rose-50 dark:bg-rose-950/30 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors outline-none cursor-pointer"
                title="Xóa phòng ban"
              >
                <span className="material-symbols-outlined text-[18px] block">delete</span>
              </button>
            )}
          </div>
        </aside>
      )}

      {/* Modal xác nhận xóa phòng ban */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 animate-scale-up">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="size-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">warning</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Xác nhận xóa phòng ban</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
              Bạn có chắc chắn muốn xóa phòng ban <strong>"{formData.name}"</strong> không? Các phòng ban có chứa đơn vị trực thuộc sẽ không thể xóa.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={loading}
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md cursor-pointer"
              >
                {loading ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentManagementPage;