import React, { useState, useEffect } from 'react';
import { departmentApi, type DepartmentTreeResponse, type DepartmentPayload, type DepartmentResponse } from '../../api/department';

const DepartmentManagementPage: React.FC = () => {
  const [treeData, setTreeData] = useState<DepartmentTreeResponse[]>([]);
  const [flatDepartments, setFlatDepartments] = useState<DepartmentResponse[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  const defaultFormState: DepartmentPayload = { 
    id: null, name: '', code: '', description: '', parent_id: null,
    ten_viet_tat: '', ten_hien_thi: '', loai_don_vi: '', cap_don_vi: '',
    level_number: null, is_formal: false, has_seal: false
  };
  
  const [formData, setFormData] = useState<DepartmentPayload>(defaultFormState);
  const [loading, setLoading] = useState(false);
  
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (treeData.length > 0 && expandedNodes.size === 0) {
      const rootIds = treeData.map(n => n.department_id);
      setExpandedNodes(new Set(rootIds));
    }
  }, [treeData]);

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
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const flattenTree = (nodes: DepartmentTreeResponse[]): DepartmentResponse[] => {
    let list: DepartmentResponse[] = [];
    nodes.forEach(node => {
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
    } catch (error: any) {
      console.error("Lỗi tải danh sách phòng ban:", error);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    if (selectedId && !isCreating) {
      const dept = flatDepartments.find(d => d.department_id === selectedId);
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
          parent_id: dept.parent_id || null
        });
      }
    }
  }, [selectedId, isCreating, flatDepartments]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Xử lý Checkbox cho boolean fields
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } 
    // Xử lý Ép kiểu Number cho các trường ID / Cấp độ
    else if (name === 'id' || name === 'parent_id' || name === 'level_number') {
      setFormData(prev => ({ ...prev, [name]: value === '' ? null : Number(value) }));
    } 
    // Các trường text thông thường
    else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      if (isCreating) {
        await departmentApi.create(formData);
        alert('Thêm phòng ban thành công!');
      } else {
        if (selectedId) {
          await departmentApi.update(selectedId, formData);
          alert('Cập nhật phòng ban thành công!');
        }
      }
      await loadDepartments();
      setIsCreating(false);
      if (isCreating) setSelectedId(null);
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Đã có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId || isCreating) return;
    if (!window.confirm('Bạn có chắc chắn muốn xóa phòng ban này?')) return;
    
    try {
      setLoading(true);
      await departmentApi.delete(selectedId);
      alert('Xóa phòng ban thành công!');
      setSelectedId(null);
      await loadDepartments();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Không thể xóa phòng ban có chứa phòng ban con');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setIsCreating(true);
    setSelectedId('new');
    setFormData({ ...defaultFormState, name: 'Phòng ban mới' });
  };

  const RenderNode = ({ node, level }: { node: DepartmentTreeResponse, level: number }) => {
    const isSelected = node.department_id === selectedId;
    const isRoot = level === 0;
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.department_id);
    const isLeafParent = hasChildren && node.children.every(c => !c.children || c.children.length === 0);

    return (
      <div className="flex flex-col items-center relative">
        {!isRoot && <div className="w-0.5 h-8 bg-slate-300 dark:bg-slate-700"></div>}

        <div 
          onClick={() => { setSelectedId(node.department_id); setIsCreating(false); }}
          className={`prevent-drag w-64 bg-white dark:bg-slate-900 border-2 rounded-xl p-4 shadow-lg flex flex-col items-center text-center relative z-10 cursor-pointer transition-all hover:-translate-y-1 ${
            isSelected ? 'border-primary ring-4 ring-primary/10' : (isRoot ? 'border-primary' : 'border-slate-200 dark:border-slate-800 hover:border-primary/50')
          }`}
        >
          {isRoot ? (
             <div className="size-12 rounded-full border-2 border-primary bg-primary/10 flex items-center justify-center text-primary mb-3">
               <span className="material-symbols-outlined text-2xl">account_balance</span>
             </div>
          ) : (
            <div className={`size-10 rounded-full flex items-center justify-center mb-3 ${isSelected ? 'bg-primary/10 text-primary' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
              <span className="material-symbols-outlined">{hasChildren ? 'account_tree' : 'groups'}</span>
            </div>
          )}
          
          <h4 className={`font-bold uppercase tracking-wide text-sm ${isRoot ? 'text-slate-900 dark:text-white' : 'text-slate-800 dark:text-slate-200'}`}>
            {node.ten_hien_thi || node.name}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {node.code || 'Phân nhánh'} {node.id && `(ID: ${node.id})`}
          </p>
          
          {isRoot && <span className="mt-2 text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-bold uppercase">Cấp cao nhất</span>}

          {hasChildren && (
            <button 
              onClick={(e) => toggleExpand(node.department_id, e)}
              className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-full flex items-center justify-center text-slate-600 hover:text-primary hover:border-primary shadow-sm transition-colors prevent-drag outline-none"
            >
              <span className="material-symbols-outlined text-sm">{isExpanded ? 'remove' : 'add'}</span>
            </button>
          )}
        </div>

        {isExpanded && hasChildren && (
          isLeafParent ? (
            <div className="flex flex-col items-center mt-3 relative w-full">
              <div className="w-0.5 h-6 bg-slate-300 dark:bg-slate-700"></div>
              <div className="relative flex flex-col gap-4">
                <div className="absolute top-0 left-[-2rem] h-0.5 bg-slate-300 dark:bg-slate-700" style={{ width: 'calc(50% + 2rem)' }}></div>

                {node.children.map((child, index) => {
                  const isLast = index === node.children.length - 1;
                  const isChildSelected = child.department_id === selectedId;
                  
                  return (
                    <div key={child.department_id} className="relative prevent-drag">
                      <div className="absolute left-[-2rem] w-0.5 bg-slate-300 dark:bg-slate-700" style={{ top: 0, bottom: isLast ? '50%' : '-1rem' }}></div>
                      <div className="absolute top-1/2 left-[-2rem] w-8 h-0.5 bg-slate-300 dark:bg-slate-700 -translate-y-1/2"></div>
                      
                      <div 
                        onClick={() => { setSelectedId(child.department_id); setIsCreating(false); }}
                        className={`w-64 bg-white dark:bg-slate-900 border-2 rounded-xl p-3 shadow-sm flex items-center text-left cursor-pointer transition-all hover:translate-x-1 ${
                          isChildSelected ? 'border-primary bg-primary/5 ring-2 ring-primary/10' : 'border-slate-200 dark:border-slate-800 hover:border-primary/50'
                        }`}
                      >
                        <div className={`size-8 flex-shrink-0 rounded-full flex items-center justify-center mr-3 ${isChildSelected ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                          <span className="material-symbols-outlined text-sm">groups</span>
                        </div>
                        <div>
                          <h4 className={`font-bold text-sm line-clamp-1 ${isChildSelected ? 'text-primary' : 'text-slate-800 dark:text-slate-200'}`}>
                            {child.name}
                          </h4>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              <div className="w-0.5 h-8 bg-slate-300 dark:bg-slate-700 mt-3"></div>
              <div className="flex gap-12 relative pt-0">
                {node.children.length > 1 && (
                  <div className="absolute top-0 h-0.5 bg-slate-300 dark:bg-slate-700" 
                       style={{ left: `calc(${100 / (node.children.length * 2)}%)`, right: `calc(${100 / (node.children.length * 2)}%)` }}>
                  </div>
                )}
                {node.children.map(child => (
                  <RenderNode key={child.department_id} node={child} level={level + 1} />
                ))}
              </div>
            </>
          )
        )}
      </div>
    );
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100">
      
      {/* Workspace Sơ đồ cây */}
      <section className="flex-1 flex flex-col overflow-hidden relative">
        <div className="flex-none p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur z-20">
          <div className="flex items-center gap-2">
            <button onClick={() => setZoom(z => Math.min(z + 0.1, 1.5))} className="p-2 hover:bg-slate-200 rounded outline-none"><span className="material-symbols-outlined">zoom_in</span></button>
            <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.5))} className="p-2 hover:bg-slate-200 rounded outline-none"><span className="material-symbols-outlined">zoom_out</span></button>
            <button onClick={() => { setZoom(1); setPan({x:0, y:0}); }} className="p-2 hover:bg-slate-200 rounded border border-slate-200 ml-2 outline-none"><span className="material-symbols-outlined text-sm">center_focus_strong</span></button>
          </div>
          <button onClick={handleAddClick} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 flex items-center gap-2 outline-none shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-base">add</span> Thêm phòng ban
          </button>
        </div>

        <div 
          className={`flex-1 overflow-hidden bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:20px_20px] ${isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
           <div 
             className="flex flex-col items-center min-w-max p-12 transition-transform duration-75 origin-top" 
             style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
           >
              {treeData.map(rootNode => (
                <RenderNode key={rootNode.department_id} node={rootNode} level={0} />
              ))}
           </div>
        </div>
      </section>

      {/* Panel Chi tiết */}
      {selectedId && (
        <aside className="w-80 h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shadow-2xl z-20 animate-slide-left">
          <div className="flex-none p-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {isCreating ? 'Thêm mới phòng ban' : 'Chi tiết phòng ban'}
              </h3>
              <button onClick={() => setSelectedId(null)} className="text-slate-400 hover:text-slate-600 outline-none">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 custom-scrollbar">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Tên phòng ban <span className="text-primary">*</span></label>
                <input name="name" value={formData.name} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 rounded-lg text-sm px-3 py-2 outline-none focus:ring-1 focus:ring-primary" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Tên hiển thị</label>
                <input name="ten_hien_thi" value={formData.ten_hien_thi || ''} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 rounded-lg text-sm px-3 py-2 outline-none focus:ring-1 focus:ring-primary" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Mã (Code)</label>
                  <input name="code" value={formData.code || ''} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 rounded-lg text-sm px-3 py-2 uppercase outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">ID (Nội bộ)</label>
                  <input type="number" name="id" value={formData.id ?? ''} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 rounded-lg text-sm px-3 py-2 outline-none focus:ring-1 focus:ring-primary" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Tên viết tắt</label>
                  <input name="ten_viet_tat" value={formData.ten_viet_tat || ''} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 rounded-lg text-sm px-3 py-2 outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Cấp độ (Level)</label>
                  <input type="number" name="level_number" value={formData.level_number ?? ''} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 rounded-lg text-sm px-3 py-2 outline-none focus:ring-1 focus:ring-primary" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Phòng ban cấp trên</label>
                <div className="relative">
                  <select 
                    name="parent_id" 
                    value={formData.parent_id ?? ''} 
                    onChange={handleInputChange} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 rounded-lg text-sm px-3 py-2 outline-none focus:ring-1 focus:ring-primary appearance-none"
                  >
                    <option value="">-- Cấp cao nhất --</option>
                    {flatDepartments
                      .filter(d => d.department_id !== selectedId && d.id != null) // Chỉ hiển thị các PB có 'id' nội bộ
                      .map(dept => (
                        <option key={dept.department_id} value={dept.id!}>
                          {dept.name} (ID: {dept.id})
                        </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-sm">expand_more</span>
                </div>
              </div>

              <div className="flex items-center gap-4 py-2">
                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input type="checkbox" name="is_formal" checked={formData.is_formal || false} onChange={handleInputChange} className="rounded text-primary focus:ring-primary" />
                  Đơn vị chính thức
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input type="checkbox" name="has_seal" checked={formData.has_seal || false} onChange={handleInputChange} className="rounded text-primary focus:ring-primary" />
                  Có con dấu
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-bold text-primary uppercase mb-2"><span className="material-symbols-outlined text-sm align-middle mr-1">smart_toy</span>Mô tả (Ngữ cảnh AI)</label>
              <textarea name="description" value={formData.description || ''} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 rounded-lg text-sm px-3 py-2 placeholder:italic outline-none focus:ring-1 focus:ring-primary" rows={4} />
            </div>
          </div>

          <div className="flex-none p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex gap-3">
            <button onClick={handleSave} disabled={loading} className="flex-1 py-2 bg-primary text-white rounded-lg font-bold text-sm hover:bg-primary/90 disabled:opacity-70 transition-all outline-none">
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
            {!isCreating && (
              <button onClick={handleDelete} disabled={loading} className="px-3 py-2 border border-slate-300 rounded-lg text-red-500 hover:bg-red-50 transition-colors outline-none">
                <span className="material-symbols-outlined text-lg">delete</span>
              </button>
            )}
          </div>
        </aside>
      )}
    </div>
  );
};

export default DepartmentManagementPage;