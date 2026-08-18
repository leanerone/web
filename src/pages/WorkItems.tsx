import { useState, useEffect } from 'react';
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Calendar,
  Flag,
  AlertTriangle,
  Clock,
  CheckCircle,
  X,
  Upload,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { workItemsAPI } from '@/services/api';
import {
  workStatusColors as statusColors,
  workStatusLabels as statusLabels,
  urgencyColors,
  urgencyLabels,
  importanceColors,
  importanceLabels,
} from '@/utils/constants';
import type { WorkCategory, WorkItem, CreateWorkItemRequest } from '@/types';

export default function WorkItems() {
  const [categories, setCategories] = useState<WorkCategory[]>([]);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('');
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WorkItem | null>(null);
  const [importedCount, setImportedCount] = useState<number | null>(null);
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchWorkItems();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await workItemsAPI.listCategories();
      if (res.success) {
        setCategories(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchWorkItems = async () => {
    setLoading(true);
    try {
      const params: any = { sort_by: 'priority_score', limit: 200 };
      if (selectedCategory) params.category_id = selectedCategory;
      if (statusFilter) params.status = statusFilter;
      if (urgencyFilter) params.urgency = urgencyFilter;
      
      const res = await workItemsAPI.list(params);
      if (res.success) {
        setWorkItems(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch work items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      fetchWorkItems();
      return;
    }
    const filtered = workItems.filter(
      (item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.details && item.details.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setWorkItems(filtered);
  };

  const handleCreateItem = async (data: CreateWorkItemRequest) => {
    try {
      const res = await workItemsAPI.create(data);
      if (res.success) {
        setIsCreateModalOpen(false);
        fetchWorkItems();
      }
    } catch (err) {
      console.error('Failed to create work item:', err);
      alert('创建失败，请重试');
    }
  };

  const handleUpdateItem = async (id: number, data: Partial<CreateWorkItemRequest>) => {
    try {
      const res = await workItemsAPI.update(id, data);
      if (res.success) {
        setEditingItem(null);
        fetchWorkItems();
      }
    } catch (err) {
      console.error('Failed to update work item:', err);
      alert('更新失败，请重试');
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm('确定要删除这个工作项吗？')) return;
    try {
      const res = await workItemsAPI.delete(id);
      if (res.success) {
        fetchWorkItems();
      }
    } catch (err) {
      console.error('Failed to delete work item:', err);
      alert('删除失败，请重试');
    }
  };

  const handleImportTable = async (tableText: string) => {
    try {
      const res = await workItemsAPI.importTable(tableText);
      if (res.success) {
        setImportedCount(res.count);
        setIsImportModalOpen(false);
        fetchWorkItems();
      }
    } catch (err) {
      console.error('Failed to import table:', err);
      alert('导入失败，请检查格式');
    }
  };

  const getPriorityScoreColor = (score: number) => {
    if (score >= 8) return 'bg-red-500';
    if (score >= 5) return 'bg-yellow-500';
    if (score >= 3) return 'bg-blue-500';
    return 'bg-gray-400';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-cyan-600" />
            工作管理
          </h1>
          <p className="text-sm text-gray-500 mt-1">管理日常工作项目，AI智能规划与提醒</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => setIsImportModalOpen(true)}>
            <Upload className="w-4 h-4" />
            导入表格
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4" />
            新建工作项
          </Button>
        </div>
      </div>

      <Card>
        <div className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:border-cyan-500"
                placeholder="搜索工作项..."
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); fetchWorkItems(); }}
                className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:border-cyan-500"
              >
                <option value="">所有状态</option>
                <option value="pending">待处理</option>
                <option value="in_progress">进行中</option>
                <option value="completed">已完成</option>
                <option value="blocked">受阻</option>
              </select>
              <select
                value={urgencyFilter}
                onChange={(e) => { setUrgencyFilter(e.target.value); fetchWorkItems(); }}
                className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:border-cyan-500"
              >
                <option value="">所有紧急度</option>
                <option value="high">高</option>
                <option value="medium">中</option>
                <option value="low">低</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1">
          <div className="p-4">
            <h3 className="font-medium text-gray-800 mb-3">工作类别</h3>
            <div className="space-y-1">
              <button
                onClick={() => { setSelectedCategory(null); fetchWorkItems(); }}
                className={`w-full text-left px-3 py-2 rounded-lg transition ${
                  !selectedCategory ? 'bg-cyan-100 text-cyan-700' : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                全部工作
              </button>
              {categories.map((cat) => {
                const count = workItems.filter((w) => w.category_id === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => { setSelectedCategory(cat.id); fetchWorkItems(); }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition flex items-center justify-between ${
                      selectedCategory === cat.id ? 'bg-cyan-100 text-cyan-700' : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{cat.icon}</span>
                      {cat.name}
                    </span>
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        <div className="lg:col-span-3 space-y-3">
          {loading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : workItems.length === 0 ? (
            <Card>
              <div className="p-8 text-center">
                <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">暂无工作项</h3>
                <p className="text-gray-500 mb-4">点击"导入表格"快速添加，或手动创建</p>
                <div className="flex items-center justify-center gap-3">
                  <Button variant="secondary" onClick={() => setIsImportModalOpen(true)}>
                    <Upload className="w-4 h-4" />
                    导入表格
                  </Button>
                  <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="w-4 h-4" />
                    新建工作项
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            workItems.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition">
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[item.status]}`}>
                          {statusLabels[item.status]}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${urgencyColors[item.urgency]}`}>
                          <Flag className="w-3 h-3 inline mr-1" />
                          {urgencyLabels[item.urgency]}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${importanceColors[item.importance]}`}>
                          重要: {importanceLabels[item.importance]}
                        </span>
                        {item.category && (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                            {item.category.icon} {item.category.name}
                          </span>
                        )}
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${getPriorityScoreColor(item.priority_score)}`} />
                          <span className="text-xs text-gray-500">优先级: {item.priority_score.toFixed(1)}</span>
                        </div>
                      </div>
                      <h3 className="font-medium text-gray-800 mb-1">{item.title}</h3>
                      {item.details && (
                        <p className="text-sm text-gray-600 line-clamp-2">{item.details}</p>
                      )}
                      {item.due_date && (
                        <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          <span>截止: {item.due_date}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingItem(item)}
                        className="p-2 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {(isCreateModalOpen || editingItem) && (
        <WorkItemModal
          isOpen={isCreateModalOpen || !!editingItem}
          onClose={() => { setIsCreateModalOpen(false); setEditingItem(null); }}
          categories={categories}
          item={editingItem}
          onSubmit={editingItem ? 
            (data) => handleUpdateItem(editingItem.id, data) : 
            handleCreateItem
          }
        />
      )}

      <ImportTableModal
        isOpen={isImportModalOpen}
        onClose={() => { setIsImportModalOpen(false); setImportedCount(null); }}
        onImport={handleImportTable}
        importedCount={importedCount}
      />
    </div>
  );
}

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
      alert('请输入工作项标题');
      return;
    }
    onSubmit({
      title: title.trim(),
      details: details.trim() || undefined,
      category_id: categoryId,
      urgency: urgency as any,
      importance: importance as any,
      status: status as any,
      due_date: dueDate || undefined,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? '编辑工作项' : '新建工作项'}
      size="md"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">标题 *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:border-cyan-500"
            placeholder="工作项标题"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">详情</label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:border-cyan-500"
            placeholder="工作项详情描述"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">类别</label>
            <select
              value={categoryId || ''}
              onChange={(e) => setCategoryId(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:border-cyan-500"
            >
              <option value="">选择类别</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:border-cyan-500"
            >
              <option value="pending">待处理</option>
              <option value="in_progress">进行中</option>
              <option value="completed">已完成</option>
              <option value="blocked">受阻</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">紧急度</label>
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:border-cyan-500"
            >
              <option value="na">N/A</option>
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">重要性</label>
            <select
              value={importance}
              onChange={(e) => setImportance(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:border-cyan-500"
            >
              <option value="na">N/A</option>
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">截止日期</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 pt-4">
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
  const [isParsing, setIsParsing] = useState(false);

  const handleImport = () => {
    if (!tableText.trim()) {
      alert('请粘贴表格内容');
      return;
    }
    setIsParsing(true);
    setTimeout(() => {
      onImport(tableText);
      setIsParsing(false);
      setTableText('');
    }, 500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="导入工作表格"
      size="lg"
    >
      <div className="space-y-4">
        <div className="p-4 bg-cyan-50 rounded-lg">
          <h4 className="font-medium text-cyan-800 mb-2">📋 使用说明</h4>
          <ol className="text-sm text-cyan-700 space-y-1 list-decimal list-inside">
            <li>从Excel或表格复制工作项内容</li>
            <li>粘贴到下方文本框（支持Tab分隔或竖线分隔格式）</li>
            <li>格式：类别 | 项目名 | 详情 | 紧急度 | 重要性</li>
          </ol>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">表格内容</label>
          <textarea
            value={tableText}
            onChange={(e) => setTableText(e.target.value)}
            rows={10}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:border-cyan-500 font-mono text-sm"
            placeholder="粘贴表格内容..."
          />
        </div>
        {importedCount !== null && (
          <div className="p-4 bg-green-50 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-green-700">成功导入 {importedCount} 个工作项！</span>
          </div>
        )}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={onClose}>取消</Button>
          <Button onClick={handleImport} loading={isParsing}>
            <Sparkles className="w-4 h-4" />
            AI解析导入
          </Button>
        </div>
      </div>
    </Modal>
  );
}
