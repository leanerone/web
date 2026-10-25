import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  Search,
  Calendar,
  Upload,
  Download,
  Trash2,
  Edit3,
  Sparkles,
  FolderPlus,
  X,
  ListTodo,
  Briefcase,
} from 'lucide-react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import Badge, { TaskStatusBadge, LevelBadge } from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/Toast';
import { level, taskStatus, priorityScoreStyle } from '@/constants/status';
import { workItemsAPI } from '@/services/api';
import type { WorkCategory, WorkItem, CreateWorkItemRequest } from '@/types';

const inputCls =
  'rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 transition-colors focus:border-accent-500 focus:bg-white focus:outline-none';

export default function WorkItems() {
  const [categories, setCategories] = useState<WorkCategory[]>([]);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WorkItem | null>(null);
  const [importedCount, setImportedCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await workItemsAPI.listCategories();
      if (res.success) setCategories(res.data);
    } catch {
      toast.error('类别加载失败');
    }
  }, []);

  const fetchWorkItems = useCallback(async () => {
    setLoading(true);
    try {
      const params: {
        sort_by: string;
        limit: number;
        category_id?: number;
        status?: string;
        urgency?: string;
      } = { sort_by: 'priority_score', limit: 200 };
      if (selectedCategory) params.category_id = selectedCategory;
      if (statusFilter) params.status = statusFilter;
      if (urgencyFilter) params.urgency = urgencyFilter;

      const res = await workItemsAPI.list(params);
      if (res.success) {
        setWorkItems(res.data);
      } else {
        toast.error(res.message || '工作项加载失败');
      }
    } catch {
      toast.error('工作项加载失败，请检查后端服务');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, statusFilter, urgencyFilter]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchWorkItems();
  }, [fetchWorkItems]);

  /** 搜索只影响展示层，不破坏已加载列表 */
  const visibleItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return workItems;
    return workItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.details && item.details.toLowerCase().includes(q))
    );
  }, [workItems, searchQuery]);

  const toggleStatus = async (item: WorkItem) => {
    const nextStatus = item.status === 'completed' ? 'pending' : 'completed';
    try {
      const res = await workItemsAPI.update(item.id, { status: nextStatus });
      if (res.success) {
        setWorkItems((prev) => prev.map((i) => (i.id === item.id ? res.data : i)));
        toast.success(nextStatus === 'completed' ? '已完成' : '已恢复为待处理');
      } else {
        toast.error(res.message || '状态更新失败');
      }
    } catch {
      toast.error('状态更新失败');
    }
  };

  const handleCreateItem = async (data: CreateWorkItemRequest) => {
    try {
      const res = await workItemsAPI.create(data);
      if (res.success) {
        setIsCreateModalOpen(false);
        toast.success('工作项已创建');
        fetchWorkItems();
      } else {
        toast.error(res.message || '创建失败');
      }
    } catch {
      toast.error('创建失败，请重试');
    }
  };

  const handleUpdateItem = async (id: number, data: Partial<CreateWorkItemRequest>) => {
    try {
      const res = await workItemsAPI.update(id, data);
      if (res.success) {
        setEditingItem(null);
        toast.success('已保存');
        fetchWorkItems();
      } else {
        toast.error(res.message || '保存失败');
      }
    } catch {
      toast.error('保存失败，请重试');
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm('确定要删除这个工作项吗？')) return;
    try {
      const res = await workItemsAPI.delete(id);
      if (res.success) {
        setWorkItems((prev) => prev.filter((i) => i.id !== id));
        toast.success('已删除');
      } else {
        toast.error(res.message || '删除失败');
      }
    } catch {
      toast.error('删除失败，请重试');
    }
  };

  const handleImportTable = async (tableText: string) => {
    try {
      const res = await workItemsAPI.importTable(tableText);
      if (res.success) {
        setImportedCount(res.data.count);
        setIsImportModalOpen(false);
        toast.success(`成功导入 ${res.data.count} 个工作项`);
        fetchWorkItems();
      } else {
        toast.error(res.message || '导入失败');
      }
    } catch {
      toast.error('导入失败，请检查表格格式');
    }
  };

  const handleCreateCategory = async (data: { name: string; code: string; description?: string; icon?: string; color?: string }) => {
    try {
      const res = await workItemsAPI.createCategory(data);
      if (res.success) {
        setIsCategoryModalOpen(false);
        toast.success('类别已创建');
        fetchCategories();
      } else {
        toast.error(res.message || '创建类别失败');
      }
    } catch {
      toast.error('创建类别失败，请重试');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('确定要删除这个类别吗？关联的工作项将变为无类别。')) return;
    try {
      const res = await workItemsAPI.deleteCategory(id);
      if (res.success) {
        if (selectedCategory === id) setSelectedCategory(null);
        toast.success('类别已删除');
        fetchCategories();
        fetchWorkItems();
      } else {
        toast.error(res.message || '删除类别失败');
      }
    } catch {
      toast.error('删除类别失败，请重试');
    }
  };

  const handleExportTable = () => {
    const headers = ['类别', '标题', '详情', '紧急度', '重要性', '状态', '优先级分数', '截止日期', '创建时间'];
    const rows = visibleItems.map((item) => {
      const catName = categories.find((c) => c.id === item.category_id)?.name || '';
      return [
        catName,
        item.title,
        item.details || '',
        level.label(item.urgency),
        level.label(item.importance),
        taskStatus.label(item.status),
        item.priority_score.toFixed(1),
        item.due_date || '',
        item.created_at || '',
      ];
    });
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `work_items_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success('已导出 CSV');
  };

  const openCount = workItems.filter((i) => i.status !== 'completed').length;

  return (
    <div className="animate-fade-in space-y-4">
      {/* 工具栏：搜索 + 筛选 + 操作 */}
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${inputCls} w-full pl-9`}
              placeholder="搜索工作项..."
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={inputCls}
          >
            <option value="">所有状态</option>
            <option value="pending">待处理</option>
            <option value="in_progress">进行中</option>
            <option value="completed">已完成</option>
            <option value="blocked">受阻</option>
          </select>
          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            className={inputCls}
          >
            <option value="">所有紧急度</option>
            <option value="high">紧急度高</option>
            <option value="medium">紧急度中</option>
            <option value="low">紧急度低</option>
          </select>
          <span className="text-xs text-gray-400">
            共 {visibleItems.length} 项 · 未完成 {openCount} 项
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleExportTable} disabled={visibleItems.length === 0}>
            <Download className="h-4 w-4" /> 导出
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setIsImportModalOpen(true)}>
            <Upload className="h-4 w-4" /> 导入
          </Button>
          <Button size="sm" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4" /> 新建工作项
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* 类别侧栏 */}
        <Card className="lg:col-span-1 h-fit">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">工作类别</h3>
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="rounded-md p-1.5 text-accent-600 transition hover:bg-accent-50"
              title="添加类别"
            >
              <FolderPlus className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-0.5">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
                !selectedCategory ? 'bg-accent-50 font-medium text-accent-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center gap-2"><Briefcase className="h-3.5 w-3.5" /> 全部工作</span>
              <span className="text-xs tabular-nums text-gray-400">{workItems.length}</span>
            </button>
            {categories.map((cat) => {
              const count = workItems.filter((w) => w.category_id === cat.id).length;
              const active = selectedCategory === cat.id;
              return (
                <div
                  key={cat.id}
                  className={`group flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
                    active ? 'bg-accent-50 font-medium text-accent-700' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <button onClick={() => setSelectedCategory(cat.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                    <span>{cat.icon}</span>
                    <span className="truncate">{cat.name}</span>
                  </button>
                  <div className="flex items-center gap-1">
                    <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-xs tabular-nums text-gray-500">{count}</span>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-0.5 text-gray-300 opacity-0 transition group-hover:opacity-100 hover:text-red-500"
                      title="删除类别"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* 工作项列表 */}
        <div className="space-y-2 lg:col-span-3">
          {loading ? (
            <Card><ListSkeleton rows={6} /></Card>
          ) : visibleItems.length === 0 ? (
            <Card>
              <EmptyState
                icon={ListTodo}
                title={searchQuery ? '没有匹配的工作项' : '暂无工作项'}
                description={searchQuery ? '换个关键词试试' : '从 Excel 粘贴导入，或手动创建'}
                action={
                  searchQuery ? undefined : (
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="secondary" onClick={() => setIsImportModalOpen(true)}>
                        <Upload className="h-4 w-4" /> 导入表格
                      </Button>
                      <Button onClick={() => setIsCreateModalOpen(true)}>
                        <Plus className="h-4 w-4" /> 新建工作项
                      </Button>
                    </div>
                  )
                }
              />
            </Card>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <ul className="divide-y divide-gray-100">
                {visibleItems.map((item) => (
                  <WorkItemRow
                    key={item.id}
                    item={item}
                    onToggle={() => toggleStatus(item)}
                    onEdit={() => setEditingItem(item)}
                    onDelete={() => handleDeleteItem(item.id)}
                  />
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {(isCreateModalOpen || editingItem) && (
        <WorkItemModal
          isOpen={isCreateModalOpen || !!editingItem}
          onClose={() => { setIsCreateModalOpen(false); setEditingItem(null); }}
          categories={categories}
          item={editingItem}
          onSubmit={editingItem ? (data) => handleUpdateItem(editingItem.id, data) : handleCreateItem}
        />
      )}

      <ImportTableModal
        isOpen={isImportModalOpen}
        onClose={() => { setIsImportModalOpen(false); setImportedCount(null); }}
        onImport={handleImportTable}
        importedCount={importedCount}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSubmit={handleCreateCategory}
      />
    </div>
  );
}

/** Linear 风格紧凑行：勾选 + 标题 + 徽章 + hover 操作 */
function WorkItemRow({
  item,
  onToggle,
  onEdit,
  onDelete,
}: {
  item: WorkItem;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const done = item.status === 'completed';
  const score = priorityScoreStyle(item.priority_score);
  const overdue = item.due_date && item.due_date < new Date().toISOString().split('T')[0] && !done;

  return (
    <li className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50">
      <button
        onClick={onToggle}
        className={`flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          done
            ? 'border-emerald-500 bg-emerald-500 text-white'
            : 'border-gray-300 text-transparent hover:border-emerald-500 hover:text-emerald-500'
        }`}
        title={done ? '恢复为待处理' : '标记完成'}
      >
        <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none">
          <path d="M2.5 6.5L5 9L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className={`truncate text-sm ${done ? 'text-gray-400 line-through' : 'font-medium text-gray-800'}`}>
            {item.title}
          </p>
          {item.category && (
            <span className="hidden flex-shrink-0 items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 text-xs text-gray-500 sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: item.category.color || '#9CA3AF' }} />
              {item.category.name}
            </span>
          )}
        </div>
        {item.details && (
          <p className="mt-0.5 truncate text-xs text-gray-400">{item.details}</p>
        )}
      </div>

      {item.due_date && (
        <span className={`hidden flex-shrink-0 items-center gap-1 text-xs md:flex ${overdue ? 'font-medium text-red-600' : 'text-gray-400'}`}>
          <Calendar className="h-3.5 w-3.5" />
          {item.due_date.slice(5)}
        </span>
      )}

      <div className="hidden flex-shrink-0 items-center gap-1.5 sm:flex">
        <LevelBadge value={item.urgency} />
        <TaskStatusBadge status={item.status} />
        <Badge tone={score.tone} className="tabular-nums">{score.label}</Badge>
      </div>

      <div className="flex flex-shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button onClick={onEdit} className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-accent-600" title="编辑">
          <Edit3 className="h-4 w-4" />
        </button>
        <button onClick={onDelete} className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600" title="删除">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}

// ── 弹窗组件 ──

interface WorkItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: WorkCategory[];
  item?: WorkItem | null;
  onSubmit: (data: CreateWorkItemRequest) => void;
}

function WorkItemModal({ isOpen, onClose, categories, item, onSubmit }: WorkItemModalProps) {
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [urgency, setUrgency] = useState('na');
  const [importance, setImportance] = useState('na');
  const [status, setStatus] = useState('pending');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (item) {
      setTitle(item.title || '');
      setDetails(item.details || '');
      setCategoryId(item.category_id || null);
      setUrgency(item.urgency || 'na');
      setImportance(item.importance || 'na');
      setStatus(item.status || 'pending');
      setDueDate(item.due_date || '');
    } else {
      setTitle('');
      setDetails('');
      setCategoryId(null);
      setUrgency('na');
      setImportance('na');
      setStatus('pending');
      setDueDate('');
    }
  }, [item, isOpen]);

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error('请输入工作项标题');
      return;
    }
    onSubmit({
      title: title.trim(),
      details: details.trim() || undefined,
      category_id: categoryId ?? undefined,
      urgency: urgency as CreateWorkItemRequest['urgency'],
      importance: importance as CreateWorkItemRequest['importance'],
      status: status as CreateWorkItemRequest['status'],
      due_date: dueDate || undefined,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={item ? '编辑工作项' : '新建工作项'} size="md">
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">标题 *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`${inputCls} w-full`}
            placeholder="工作项标题"
            autoFocus
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">详情</label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={3}
            className={`${inputCls} w-full resize-none`}
            placeholder="工作项详情描述"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">类别</label>
            <select
              value={categoryId || ''}
              onChange={(e) => setCategoryId(e.target.value ? parseInt(e.target.value) : null)}
              className={`${inputCls} w-full`}
            >
              <option value="">不关联类别</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">状态</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${inputCls} w-full`}>
              {Object.entries(taskStatus.labels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">紧急度</label>
            <select value={urgency} onChange={(e) => setUrgency(e.target.value)} className={`${inputCls} w-full`}>
              <option value="na">N/A</option>
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">重要性</label>
            <select value={importance} onChange={(e) => setImportance(e.target.value)} className={`${inputCls} w-full`}>
              <option value="na">N/A</option>
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">截止日期</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={`${inputCls} w-full`}
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose}>取消</Button>
          <Button onClick={handleSubmit}>{item ? '保存' : '创建'}</Button>
        </div>
      </div>
    </Modal>
  );
}

interface ImportTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (tableText: string) => void;
  importedCount: number | null;
}

function ImportTableModal({ isOpen, onClose, onImport, importedCount }: ImportTableModalProps) {
  const [tableText, setTableText] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = () => {
    if (!tableText.trim()) {
      toast.error('请粘贴表格内容');
      return;
    }
    setIsImporting(true);
    onImport(tableText);
    setIsImporting(false);
    setTableText('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="导入工作表格" size="lg">
      <div className="space-y-4">
        <div className="rounded-lg bg-accent-50 p-4">
          <h4 className="mb-2 text-sm font-medium text-accent-800">使用说明</h4>
          <ol className="list-inside list-decimal space-y-1 text-sm text-accent-700">
            <li>可先用「导出」下载当前数据作为格式模板</li>
            <li>从 Excel 或表格复制工作项内容粘贴到下方</li>
            <li>支持 Tab 分隔或竖线分隔格式</li>
            <li>格式：类别 | 标题 | 详情 | 紧急度 | 重要性</li>
            <li>紧急度/重要性可选值：high、medium、low、na</li>
          </ol>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">表格内容</label>
          <textarea
            value={tableText}
            onChange={(e) => setTableText(e.target.value)}
            rows={10}
            className={`${inputCls} w-full resize-none font-mono`}
            placeholder="粘贴表格内容..."
          />
        </div>
        {importedCount !== null && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
            <Sparkles className="h-4 w-4" />
            上次导入成功：{importedCount} 个工作项
          </div>
        )}
        <div className="flex items-center justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose}>取消</Button>
          <Button onClick={handleImport} loading={isImporting}>
            <Sparkles className="h-4 w-4" />
            解析并导入
          </Button>
        </div>
      </div>
    </Modal>
  );
}

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; code: string; description?: string; icon?: string; color?: string }) => void;
}

function CategoryModal({ isOpen, onClose, onSubmit }: CategoryModalProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('📁');
  const [color, setColor] = useState('#6B7280');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setCode('');
      setDescription('');
      setIcon('📁');
      setColor('#6B7280');
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error('请输入类别名称');
      return;
    }
    if (!code.trim()) {
      toast.error('请输入类别编码');
      return;
    }
    onSubmit({
      name: name.trim(),
      code: code.trim().toLowerCase().replace(/\s+/g, '_'),
      description: description.trim() || undefined,
      icon: icon.trim() || '📁',
      color: color,
    });
  };

  const iconOptions = ['📁', '🔄', '📋', '🔬', '🚀', '🤖', '🔧', '📦', '🔗', '⚡', '🎯', '💡'];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="新建工作类别" size="md">
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">类别名称 *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`${inputCls} w-full`}
            placeholder="如：设备维护"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">类别编码 *（英文，自动生成）</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className={`${inputCls} w-full`}
            placeholder="如：equipment_maintenance"
          />
          <p className="mt-1 text-xs text-gray-400">用于唯一标识，仅支持英文和下划线</p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">描述</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`${inputCls} w-full`}
            placeholder="类别描述（可选）"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">图标</label>
            <div className="flex flex-wrap gap-1.5">
              {iconOptions.map((ic) => (
                <button
                  key={ic}
                  onClick={() => setIcon(ic)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-base transition ${
                    icon === ic ? 'bg-accent-100 ring-2 ring-accent-500' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">颜色</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-9 w-full cursor-pointer rounded-lg border border-gray-300 bg-gray-50"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose}>取消</Button>
          <Button onClick={handleSubmit}>创建类别</Button>
        </div>
      </div>
    </Modal>
  );
}
