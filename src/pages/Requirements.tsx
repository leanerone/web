import { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  Grid3x3,
  List,
  Zap,
  Target,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { PriorityBadge, RequirementStatusBadge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/Toast';
import { priority, requirementStatus } from '@/constants/status';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { requirementAPI, equipmentAPI, projectAPI } from '@/services/api';
import useAppStore from '@/stores/appStore';
import type { Requirement, CreateRequirementRequest } from '@/types';

const inputCls =
  'rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 transition-colors focus:border-accent-500 focus:bg-white focus:outline-none';

// 四象限分类逻辑
// 重要性: dev(开发中)=重要；testing/deploying/completed=次要
// 紧急度: critical/high=紧急；medium/low=不紧急
function getQuadrant(req: Requirement): number {
  const isUrgent = req.priority === 'critical' || req.priority === 'high';
  const isImportant = req.status === 'dev';
  if (isUrgent && isImportant) return 1;
  if (!isUrgent && isImportant) return 2;
  if (isUrgent && !isImportant) return 3;
  return 4;
}

const quadrantConfig = [
  { id: 1, title: '紧急且重要', subtitle: '立即处理', icon: Zap, ring: 'ring-red-200', header: 'bg-red-50 text-red-700', card: 'hover:border-red-300', dot: 'bg-red-200' },
  { id: 2, title: '重要不紧急', subtitle: '计划安排', icon: Target, ring: 'ring-blue-200', header: 'bg-blue-50 text-blue-700', card: 'hover:border-blue-300', dot: 'bg-blue-200' },
  { id: 3, title: '紧急不重要', subtitle: '委托处理', icon: AlertTriangle, ring: 'ring-amber-200', header: 'bg-amber-50 text-amber-700', card: 'hover:border-amber-300', dot: 'bg-amber-200' },
  { id: 4, title: '不紧急不重要', subtitle: '待空闲时', icon: Clock, ring: 'ring-gray-200', header: 'bg-gray-50 text-gray-600', card: 'hover:border-gray-300', dot: 'bg-gray-200' },
];

const KANBAN_STATUSES = ['dev', 'testing', 'deploying', 'completed'] as const;

export default function Requirements() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { equipment, projects, setEquipment, setProjects } = useAppStore();
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [equipmentFilter, setEquipmentFilter] = useState<string>(searchParams.get('equipment') || 'all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'quadrant'>('kanban');
  const [formData, setFormData] = useState<CreateRequirementRequest>({ title: '', description: '' });
  const [loading, setLoading] = useState(true);
  // 看板拖拽状态
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reqRes, equipRes, projectRes] = await Promise.allSettled([
          requirementAPI.list(),
          equipmentAPI.list(),
          projectAPI.list(),
        ]);
        if (reqRes.status === 'fulfilled' && reqRes.value.success) setRequirements(reqRes.value.data);
        if (equipRes.status === 'fulfilled' && equipRes.value.success) setEquipment(equipRes.value.data);
        if (projectRes.status === 'fulfilled' && projectRes.value.success) setProjects(projectRes.value.data);
        if (reqRes.status === 'fulfilled' && !reqRes.value.success) {
          toast.error(reqRes.value.message || '需求列表加载失败');
        }
      } catch {
        toast.error('需求列表加载失败，请检查后端服务');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredRequirements = useMemo(
    () =>
      requirements.filter((req) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch = req.title.toLowerCase().includes(q) ||
          req.description?.toLowerCase().includes(q);
        const matchesPriority = priorityFilter === 'all' || req.priority === priorityFilter;
        const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
        const matchesEquipment = equipmentFilter === 'all' || (() => {
          if (!req.equipment_name) return false;
          try {
            const arr = JSON.parse(req.equipment_name);
            if (Array.isArray(arr)) return arr.includes(equipmentFilter);
          } catch {
            /* 旧数据为单值 */
          }
          return req.equipment_name === equipmentFilter;
        })();
        return matchesSearch && matchesPriority && matchesStatus && matchesEquipment;
      }),
    [requirements, searchQuery, priorityFilter, statusFilter, equipmentFilter]
  );

  // 同步 URL 参数（机台页跳转过来时自动选中）
  useEffect(() => {
    const eq = searchParams.get('equipment');
    if (eq && eq !== equipmentFilter) {
      setEquipmentFilter(eq);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleEquipmentFilterChange = (val: string) => {
    setEquipmentFilter(val);
    if (val === 'all') {
      searchParams.delete('equipment');
    } else {
      searchParams.set('equipment', val);
    }
    setSearchParams(searchParams, { replace: true });
  };

  /** 拖拽卡片到目标状态列：乐观更新 + PUT 失败回滚（后端会自动写入变更记录） */
  const handleDropOnColumn = async (newStatus: string) => {
    setDragOverStatus(null);
    const dragId = draggingId;
    setDraggingId(null);
    if (dragId === null) return;
    const req = requirements.find((r) => r.id === dragId);
    if (!req || req.status === newStatus) return;

    const prevRequirements = requirements;
    // 乐观更新
    setRequirements((prev) => prev.map((r) => (r.id === dragId ? { ...r, status: newStatus as Requirement['status'] } : r)));
    try {
      const res = await requirementAPI.update(dragId, { status: newStatus as Requirement['status'] });
      if (res.success) {
        toast.success(`已移动到「${requirementStatus.label(newStatus)}」`);
      } else {
        setRequirements(prevRequirements);
        toast.error(res.message || '状态更新失败');
      }
    } catch {
      setRequirements(prevRequirements);
      toast.error('状态更新失败，请检查后端服务');
    }
  };

  const handleCreate = async () => {
    if (!formData.title) return;
    try {
      const res = await requirementAPI.create(formData);
      if (res.success) {
        setRequirements((prev) => [res.data, ...prev]);
        toast.success('需求已创建');
      } else {
        toast.error(res.message || '创建失败');
      }
    } catch {
      toast.error('创建失败，请重试');
    }
    setIsCreateModalOpen(false);
    setFormData({ title: '', description: '' });
  };

  // 解析 equipment_name (JSON 数组字符串) 为机台名称展示文本, 兼容旧单值
  const getEquipmentName = (equipmentName?: string) => {
    if (!equipmentName) return '';
    let names: string[] = [];
    try {
      const arr = JSON.parse(equipmentName);
      if (Array.isArray(arr)) names = arr.map(String);
      else names = [equipmentName];
    } catch {
      names = [equipmentName];
    }
    if (names.length === 0) return '';
    const labels = names.map((n) => {
      const eq = equipment.find((e) => (e.equipment ?? String(e.id)) === n);
      return eq ? (eq.eq_name || eq.equipment || n) : n;
    });
    const txt = labels.join(', ');
    return labels.length > 1 ? `${txt} 等${labels.length}台` : txt;
  };

  const statusOrder: Record<string, number> = { dev: 0, testing: 1, deploying: 2, completed: 3 };
  const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

  const sortedRequirements = [...filteredRequirements].sort((a, b) => {
    return (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9) || (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9);
  });

  const quadrants = quadrantConfig.map((cfg) => ({
    ...cfg,
    items: filteredRequirements.filter((r) => getQuadrant(r) === cfg.id),
  }));

  return (
    <div className="animate-fade-in space-y-4">
      {/* 工具栏 */}
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索需求标题或描述..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${inputCls} w-full pl-9`}
            />
          </div>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className={inputCls}>
            <option value="all">全部优先级</option>
            <option value="critical">紧急</option>
            <option value="high">高</option>
            <option value="medium">中</option>
            <option value="low">低</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inputCls}>
            <option value="all">全部状态</option>
            {KANBAN_STATUSES.map((s) => (
              <option key={s} value={s}>{requirementStatus.label(s)}</option>
            ))}
          </select>
          <select
            value={equipmentFilter}
            onChange={(e) => handleEquipmentFilterChange(e.target.value)}
            className={`${inputCls} sm:w-44`}
            title="按关联机台筛选"
          >
            <option value="all">全部机台</option>
            {equipment.map((item) => {
              const eqKey = String(item.equipment ?? item.id ?? item.eq_name);
              const label = item.eq_name || item.equipment || `机台 #${item.id}`;
              return (
                <option key={eqKey} value={eqKey}>{label}</option>
              );
            })}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 bg-white p-0.5 shadow-sm">
            {(['kanban', 'quadrant'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === mode ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {mode === 'kanban' ? <List className="h-3.5 w-3.5" /> : <Grid3x3 className="h-3.5 w-3.5" />}
                {mode === 'kanban' ? '看板' : '四象限'}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4" /> 创建需求
          </Button>
        </div>
      </div>

      {/* 看板视图 */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {KANBAN_STATUSES.map((status) => {
            const items = sortedRequirements.filter((r) => r.status === status);
            const s = requirementStatus.style(status);
            const isDragOver = dragOverStatus === status && draggingId !== null;
            return (
              <div
                key={status}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragOverStatus !== status) setDragOverStatus(status);
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverStatus(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDropOnColumn(status);
                }}
                className={`flex flex-col rounded-xl border bg-gray-50/60 transition-colors ${
                  isDragOver ? 'border-accent-400 bg-accent-50/50 ring-2 ring-accent-200' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between px-3.5 py-2.5">
                  <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                    {s.label}
                  </span>
                  <span className="rounded-full bg-gray-200/70 px-2 py-0.5 text-xs tabular-nums text-gray-500">
                    {items.length}
                  </span>
                </div>
                <div className="min-h-[80px] space-y-2 p-2 pt-0">
                  {loading ? (
                    Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-20" />)
                  ) : items.length === 0 ? (
                    <div className={`rounded-lg border border-dashed py-8 text-center text-xs ${
                      isDragOver ? 'border-accent-300 text-accent-400' : 'border-gray-200 text-gray-300'
                    }`}>
                      {isDragOver ? '松开移动到此列' : '暂无需求'}
                    </div>
                  ) : (
                    items.map((req) => (
                      <div
                        key={req.id}
                        draggable
                        onDragStart={(e) => {
                          setDraggingId(req.id);
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onDragEnd={() => {
                          setDraggingId(null);
                          setDragOverStatus(null);
                        }}
                        onClick={() => navigate(`/requirements/${req.id}`)}
                        className={`group cursor-pointer rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-all hover:border-gray-300 hover:shadow-md ${
                          draggingId === req.id ? 'opacity-40' : ''
                        }`}
                      >
                        <h4 className="text-sm font-medium leading-snug text-gray-800">{req.title}</h4>
                        {req.description && (
                          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-400">{req.description}</p>
                        )}
                        <div className="mt-2.5 flex items-center justify-between gap-2">
                          <PriorityBadge value={req.priority} />
                          <span className="text-xs tabular-nums text-gray-300">
                            {req.created_at ? new Date(req.created_at).toLocaleDateString() : ''}
                          </span>
                        </div>
                        {req.equipment_name && (
                          <p className="mt-2 flex items-center gap-1.5 border-t border-gray-50 pt-2 text-xs text-gray-400">
                            <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent-400" />
                            <span className="truncate">{getEquipmentName(req.equipment_name)}</span>
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 四象限视图 */}
      {viewMode === 'quadrant' && (
        <div>
          <div className="mb-3 flex items-center justify-center">
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
              重要性（状态） →
            </span>
          </div>
          <div className="flex">
            <div className="flex w-8 flex-shrink-0 items-center justify-center">
              <span className="whitespace-nowrap text-xs font-medium text-gray-400 [-writing-mode:vertical-rl] rotate-180">
                ← 紧急度
              </span>
            </div>
            <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-2">
              {quadrants.map((q) => {
                const Icon = q.icon;
                return (
                  <div key={q.id} className={`flex flex-col rounded-xl ring-1 ${q.ring} bg-white overflow-hidden`}>
                    <div className={`flex items-center gap-2 px-4 py-2.5 ${q.header}`}>
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-semibold">{q.title}</span>
                      <span className="text-xs opacity-75">{q.subtitle}</span>
                      <span className="ml-auto rounded-full bg-white/60 px-2 py-0.5 text-xs font-bold tabular-nums">
                        {q.items.length}
                      </span>
                    </div>
                    <div className="max-h-96 flex-1 space-y-2 overflow-y-auto p-2.5">
                      {q.items.length === 0 ? (
                        <div className="py-8 text-center text-xs text-gray-300">暂无需求</div>
                      ) : (
                        q.items.map((req) => (
                          <div
                            key={req.id}
                            className={`cursor-pointer rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-colors ${q.card}`}
                            onClick={() => navigate(`/requirements/${req.id}`)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="flex-1 text-sm font-medium leading-snug text-gray-800">{req.title}</span>
                              <PriorityBadge value={req.priority} />
                            </div>
                            {req.description && (
                              <p className="mt-1 line-clamp-2 text-xs text-gray-400">{req.description}</p>
                            )}
                            <div className="mt-2 flex items-center justify-between">
                              <RequirementStatusBadge status={req.status} />
                              <span className="truncate text-xs text-gray-300">{getEquipmentName(req.equipment_name) || '未关联机台'}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-center gap-6 text-xs text-gray-400">
            {quadrantConfig.map((q) => (
              <span key={q.id} className="flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded ${q.dot}`} />
                Q{q.id} {q.subtitle}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 创建需求弹窗 */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setFormData({ title: '', description: '' });
        }}
        title="创建需求"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">需求标题 *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={`${inputCls} w-full`}
              placeholder="请输入需求标题"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">优先级</label>
              <select
                value={formData.priority || 'medium'}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className={`${inputCls} w-full`}
              >
                {['low', 'medium', 'high', 'critical'].map((p) => (
                  <option key={p} value={p}>{priority.label(p)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">关联项目</label>
              <select
                value={formData.project_id || ''}
                onChange={(e) => setFormData({ ...formData, project_id: parseInt(e.target.value) || undefined })}
                className={`${inputCls} w-full`}
              >
                <option value="">不关联项目</option>
                {projects.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">关联机台</label>
            <select
              value={formData.equipment_name ?? ''}
              onChange={(e) => setFormData({ ...formData, equipment_name: e.target.value || undefined })}
              className={`${inputCls} w-full`}
            >
              <option value="">不关联机台</option>
              {equipment.map((item) => {
                const eqKey = String(item.equipment ?? item.id ?? item.eq_name);
                return (
                  <option key={eqKey} value={eqKey}>{item.eq_name || item.equipment}（{item.ap_name}）</option>
                );
              })}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">需求描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={`${inputCls} w-full resize-none`}
              rows={4}
              placeholder="请输入需求描述..."
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreate} disabled={!formData.title}>
              创建需求
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
