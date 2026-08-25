import { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  AlertTriangle,
  ArrowRight,
  Clock,
  CheckCircle2,
  Edit,
  Trash2,
  Eye,
  Grid3x3,
  List,
  Zap,
  Target,
} from 'lucide-react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { useNavigate } from 'react-router-dom';
import { requirementAPI, equipmentAPI, projectAPI } from '@/services/api';
import useAppStore from '@/stores/appStore';
import type { Requirement, Equipment, CreateRequirementRequest } from '@/types';



// 四象限分类逻辑
// 紧急度: critical=紧急, high=较紧急, medium=一般, low=不紧急
// 重要性: completed=低(已完成), testing=中, pending/in_progress=高(待处理和处理中)
function getQuadrant(req: Requirement): number {
  // Q1: 紧急且重要 (critical + pending/in_progress)
  // Q2: 不紧急但重要 (medium/low + pending/in_progress)
  // Q3: 紧急但不重要 (critical/high + completed/testing)
  // Q4: 不紧急不重要 (medium/low + completed/testing)
  const isUrgent = req.priority === 'critical' || req.priority === 'high';
  const isImportant = req.status === 'pending' || req.status === 'in_progress';

  if (isUrgent && isImportant) return 1;
  if (!isUrgent && isImportant) return 2;
  if (isUrgent && !isImportant) return 3;
  return 4;
}

const quadrantConfig = [
  { id: 1, title: '紧急且重要', subtitle: '立即处理', color: 'border-red-400 bg-red-50', headerColor: 'text-red-600 bg-red-100', icon: Zap },
  { id: 2, title: '重要不紧急', subtitle: '计划安排', color: 'border-blue-400 bg-blue-50', headerColor: 'text-blue-600 bg-blue-100', icon: Target },
  { id: 3, title: '紧急不重要', subtitle: '委托处理', color: 'border-orange-400 bg-orange-50', headerColor: 'text-orange-600 bg-orange-100', icon: AlertTriangle },
  { id: 4, title: '不紧急不重要', subtitle: '待空闲时', color: 'border-gray-300 bg-gray-50', headerColor: 'text-gray-500 bg-gray-100', icon: Clock },
];

export default function Requirements() {
  const navigate = useNavigate();
  const { requirements, equipment, projects, setRequirements, setEquipment, setProjects, addRequirement, updateRequirement, deleteRequirement } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'quadrant'>('kanban');
  const [formData, setFormData] = useState<CreateRequirementRequest>({ title: '', description: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reqRes, equipRes, projectRes] = await Promise.all([
          requirementAPI.list(),
          equipmentAPI.list(),
          projectAPI.list(),
        ]);
        if (reqRes.success) {
          setRequirements(reqRes.data);
        }
        if (equipRes.success) {
          setEquipment(equipRes.data);
        }
        if (projectRes.success) {
          setProjects(projectRes.data);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [setRequirements, setEquipment]);

  const filteredRequirements = requirements.filter((req) => {
    const matchesSearch = req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || req.priority === priorityFilter;
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    return matchesSearch && matchesPriority && matchesStatus;
  });

  const handleCreate = async () => {
    if (!formData.title) return;
    try {
      const res = await requirementAPI.create(formData);
      if (res.success) {
        addRequirement(res.data);
      }
    } catch (err) {
      console.error('Failed to create requirement:', err);
    }
    setIsCreateModalOpen(false);
    setFormData({ title: '', description: '' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个需求吗？')) return;
    try {
      await requirementAPI.delete(id);
      deleteRequirement(id);
    } catch (err) {
      console.error('Failed to delete requirement:', err);
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-100 text-gray-600',
      medium: 'bg-blue-50 text-blue-600',
      high: 'bg-orange-50 text-orange-600',
      critical: 'bg-red-50 text-red-600',
    };
    return colors[priority] || 'bg-gray-100 text-gray-600';
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      low: '低',
      medium: '中',
      high: '高',
      critical: '紧急',
    };
    return labels[priority] || priority;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-gray-100 text-gray-600',
      in_progress: 'bg-cyan-50 text-cyan-600',
      testing: 'bg-blue-50 text-blue-600',
      completed: 'bg-green-50 text-green-600',
      rejected: 'bg-red-50 text-red-600',
    };
    return colors[status] || 'bg-gray-100 text-gray-600';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: '待处理',
      in_progress: '处理中',
      testing: '测试中',
      completed: '已完成',
      rejected: '已拒绝',
    };
    return labels[status] || status;
  };

  const getEquipmentName = (equipmentName?: string) => {
    if (!equipmentName) return '未关联';
    const eq = equipment.find((e) => (e.equipment ?? String(e.id)) === equipmentName);
    return eq ? (eq.eq_name || eq.equipment || '未知机台') : equipmentName;
  };

  const statusOrder = { pending: 0, in_progress: 1, testing: 2, completed: 3, rejected: 4 };
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

  const sortedRequirements = [...filteredRequirements].sort((a, b) => {
    return statusOrder[a.status] - statusOrder[b.status] || priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return (
    <div className="animate-fade-in">
      <div className="p-6">
        <Card className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索需求标题或描述..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-cyan-500 w-full sm:w-64"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="pl-10 pr-8 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-cyan-500 appearance-none w-full sm:w-36"
                >
                  <option value="all">全部优先级</option>
                  <option value="critical">紧急</option>
                  <option value="high">高</option>
                  <option value="medium">中</option>
                  <option value="low">低</option>
                </select>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-cyan-500 appearance-none w-full sm:w-36"
              >
                <option value="all">全部状态</option>
                <option value="pending">待处理</option>
                <option value="in_progress">处理中</option>
                <option value="testing">测试中</option>
                <option value="completed">已完成</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'kanban' ? 'bg-white text-cyan-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <List className="w-4 h-4" />
                  看板
                </button>
                <button
                  onClick={() => setViewMode('quadrant')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'quadrant' ? 'bg-white text-cyan-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Grid3x3 className="w-4 h-4" />
                  四象限
                </button>
              </div>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="w-4 h-4" />
                创建需求
              </Button>
            </div>
          </div>
        </Card>

        {/* 看板视图 */}
        {viewMode === 'kanban' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {['pending', 'in_progress', 'testing', 'completed', 'rejected'].map((status) => {
              const statusRequirements = sortedRequirements.filter((r) => r.status === status);
              return (
                <Card key={status} title={getStatusLabel(status)} className="lg:col-span-1">
                  <div className="space-y-3">
                    {loading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="p-3 bg-gray-50 rounded-lg animate-pulse h-16" />
                        ))}
                      </div>
                    ) : statusRequirements.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <ClipboardList className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm">暂无需求</p>
                      </div>
                    ) : (
                      statusRequirements.map((req) => (
                        <div 
                          key={req.id} 
                          className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group border border-gray-200"
                          onClick={() => navigate(`/requirements/${req.id}`)}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className="text-sm font-medium text-gray-800 truncate flex-1">{req.title}</h4>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/requirements/${req.id}`); }}>
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button variant="danger" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(req.id); }}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mb-2 line-clamp-2">{req.description}</p>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(req.priority)}`}>
                              {getPriorityLabel(req.priority)}
                            </span>
                            <span className="text-xs text-gray-400">{new Date(req.created_at).toLocaleDateString()}</span>
                          </div>
                          {req.equipment_name && (
                            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                              {getEquipmentName(req.equipment_name)}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* 四象限视图 */}
        {viewMode === 'quadrant' && (
          <div className="space-y-4">
            <Card>
              <div className="p-4 bg-cyan-50 rounded-lg mb-4">
                <div className="flex items-center gap-2 text-sm text-cyan-700">
                  <Grid3x3 className="w-4 h-4" />
                  <span className="font-medium">需求紧急度四象限分析</span>
                  <span className="text-cyan-600">- 根据优先级和状态自动分类，帮助合理分配工作优先级</span>
                </div>
              </div>

              {/* 轴标签 */}
              <div className="flex items-center justify-center mb-2">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                  <span className="px-3 py-1 bg-gray-100 rounded-full">重要性（状态） →</span>
                </div>
              </div>

              <div className="flex">
                {/* Y轴标签 */}
                <div className="flex flex-col items-center justify-around w-8 pr-2">
                  <span className="text-xs font-medium text-gray-500 -rotate-90 whitespace-nowrap">← 紧急度</span>
                </div>

                {/* 四象限网格 */}
                <div className="flex-1 grid grid-cols-2 gap-3" style={{ minHeight: '500px' }}>
                  {/* Q1: 紧急且重要 */}
                  <div className={`border-2 rounded-xl ${quadrantConfig[0].color} flex flex-col`}>
                    <div className={`flex items-center gap-2 px-4 py-3 ${quadrantConfig[0].headerColor} rounded-t-xl`}>
                      <Zap className="w-4 h-4" />
                      <span className="font-semibold text-sm">{quadrantConfig[0].title}</span>
                      <span className="text-xs opacity-75">- {quadrantConfig[0].subtitle}</span>
                      <span className="ml-auto text-xs font-bold bg-white/50 px-2 py-0.5 rounded-full">
                        {filteredRequirements.filter(r => getQuadrant(r) === 1).length}
                      </span>
                    </div>
                    <div className="flex-1 p-3 space-y-2 overflow-y-auto" style={{ maxHeight: '400px' }}>
                      {filteredRequirements.filter(r => getQuadrant(r) === 1).map(req => (
                        <div 
                          key={req.id} 
                          className="p-3 bg-white rounded-lg border border-red-200 hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => navigate(`/requirements/${req.id}`)}
                        >
                          <div className="flex items-start justify-between mb-1">
                            <span className="text-sm font-medium text-gray-800 flex-1">{req.title}</span>
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getPriorityColor(req.priority)}`}>
                              {getPriorityLabel(req.priority)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-2 mb-1">{req.description}</p>
                          <div className="flex items-center justify-between">
                            <span className={`px-1.5 py-0.5 rounded text-xs ${getStatusColor(req.status)}`}>
                              {getStatusLabel(req.status)}
                            </span>
                            <span className="text-xs text-gray-400">{getEquipmentName(req.equipment_name)}</span>
                          </div>
                        </div>
                      ))}
                      {filteredRequirements.filter(r => getQuadrant(r) === 1).length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                          <CheckCircle2 className="w-8 h-8 mx-auto mb-1 opacity-50" />
                          <p className="text-xs">暂无需求</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Q2: 重要不紧急 */}
                  <div className={`border-2 rounded-xl ${quadrantConfig[1].color} flex flex-col`}>
                    <div className={`flex items-center gap-2 px-4 py-3 ${quadrantConfig[1].headerColor} rounded-t-xl`}>
                      <Target className="w-4 h-4" />
                      <span className="font-semibold text-sm">{quadrantConfig[1].title}</span>
                      <span className="text-xs opacity-75">- {quadrantConfig[1].subtitle}</span>
                      <span className="ml-auto text-xs font-bold bg-white/50 px-2 py-0.5 rounded-full">
                        {filteredRequirements.filter(r => getQuadrant(r) === 2).length}
                      </span>
                    </div>
                    <div className="flex-1 p-3 space-y-2 overflow-y-auto" style={{ maxHeight: '400px' }}>
                      {filteredRequirements.filter(r => getQuadrant(r) === 2).map(req => (
                        <div 
                          key={req.id} 
                          className="p-3 bg-white rounded-lg border border-blue-200 hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => navigate(`/requirements/${req.id}`)}
                        >
                          <div className="flex items-start justify-between mb-1">
                            <span className="text-sm font-medium text-gray-800 flex-1">{req.title}</span>
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getPriorityColor(req.priority)}`}>
                              {getPriorityLabel(req.priority)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-2 mb-1">{req.description}</p>
                          <div className="flex items-center justify-between">
                            <span className={`px-1.5 py-0.5 rounded text-xs ${getStatusColor(req.status)}`}>
                              {getStatusLabel(req.status)}
                            </span>
                            <span className="text-xs text-gray-400">{getEquipmentName(req.equipment_name)}</span>
                          </div>
                        </div>
                      ))}
                      {filteredRequirements.filter(r => getQuadrant(r) === 2).length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                          <CheckCircle2 className="w-8 h-8 mx-auto mb-1 opacity-50" />
                          <p className="text-xs">暂无需求</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Q3: 紧急不重要 */}
                  <div className={`border-2 rounded-xl ${quadrantConfig[2].color} flex flex-col`}>
                    <div className={`flex items-center gap-2 px-4 py-3 ${quadrantConfig[2].headerColor} rounded-t-xl`}>
                      <AlertTriangle className="w-4 h-4" />
                      <span className="font-semibold text-sm">{quadrantConfig[2].title}</span>
                      <span className="text-xs opacity-75">- {quadrantConfig[2].subtitle}</span>
                      <span className="ml-auto text-xs font-bold bg-white/50 px-2 py-0.5 rounded-full">
                        {filteredRequirements.filter(r => getQuadrant(r) === 3).length}
                      </span>
                    </div>
                    <div className="flex-1 p-3 space-y-2 overflow-y-auto" style={{ maxHeight: '400px' }}>
                      {filteredRequirements.filter(r => getQuadrant(r) === 3).map(req => (
                        <div 
                          key={req.id} 
                          className="p-3 bg-white rounded-lg border border-orange-200 hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => navigate(`/requirements/${req.id}`)}
                        >
                          <div className="flex items-start justify-between mb-1">
                            <span className="text-sm font-medium text-gray-800 flex-1">{req.title}</span>
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getPriorityColor(req.priority)}`}>
                              {getPriorityLabel(req.priority)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-2 mb-1">{req.description}</p>
                          <div className="flex items-center justify-between">
                            <span className={`px-1.5 py-0.5 rounded text-xs ${getStatusColor(req.status)}`}>
                              {getStatusLabel(req.status)}
                            </span>
                            <span className="text-xs text-gray-400">{getEquipmentName(req.equipment_name)}</span>
                          </div>
                        </div>
                      ))}
                      {filteredRequirements.filter(r => getQuadrant(r) === 3).length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                          <CheckCircle2 className="w-8 h-8 mx-auto mb-1 opacity-50" />
                          <p className="text-xs">暂无需求</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Q4: 不紧急不重要 */}
                  <div className={`border-2 rounded-xl ${quadrantConfig[3].color} flex flex-col`}>
                    <div className={`flex items-center gap-2 px-4 py-3 ${quadrantConfig[3].headerColor} rounded-t-xl`}>
                      <Clock className="w-4 h-4" />
                      <span className="font-semibold text-sm">{quadrantConfig[3].title}</span>
                      <span className="text-xs opacity-75">- {quadrantConfig[3].subtitle}</span>
                      <span className="ml-auto text-xs font-bold bg-white/50 px-2 py-0.5 rounded-full">
                        {filteredRequirements.filter(r => getQuadrant(r) === 4).length}
                      </span>
                    </div>
                    <div className="flex-1 p-3 space-y-2 overflow-y-auto" style={{ maxHeight: '400px' }}>
                      {filteredRequirements.filter(r => getQuadrant(r) === 4).map(req => (
                        <div 
                          key={req.id} 
                          className="p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => navigate(`/requirements/${req.id}`)}
                        >
                          <div className="flex items-start justify-between mb-1">
                            <span className="text-sm font-medium text-gray-800 flex-1">{req.title}</span>
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getPriorityColor(req.priority)}`}>
                              {getPriorityLabel(req.priority)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-2 mb-1">{req.description}</p>
                          <div className="flex items-center justify-between">
                            <span className={`px-1.5 py-0.5 rounded text-xs ${getStatusColor(req.status)}`}>
                              {getStatusLabel(req.status)}
                            </span>
                            <span className="text-xs text-gray-400">{getEquipmentName(req.equipment_name)}</span>
                          </div>
                        </div>
                      ))}
                      {filteredRequirements.filter(r => getQuadrant(r) === 4).length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                          <CheckCircle2 className="w-8 h-8 mx-auto mb-1 opacity-50" />
                          <p className="text-xs">暂无需求</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center mt-4 gap-6 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-red-200 rounded"></span>
                  <span>Q1 立即处理</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-blue-200 rounded"></span>
                  <span>Q2 计划安排</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-orange-200 rounded"></span>
                  <span>Q3 委托处理</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-gray-200 rounded"></span>
                  <span>Q4 待空闲时</span>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

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
            <label className="block text-sm font-medium text-gray-700 mb-1">需求标题 *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-cyan-500"
              placeholder="请输入需求标题"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">优先级</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-cyan-500"
            >
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
              <option value="critical">紧急</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">关联项目</label>
            <select
              value={formData.project_id}
              onChange={(e) => setFormData({ ...formData, project_id: parseInt(e.target.value) || undefined })}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-cyan-500"
            >
              <option value="">不关联项目</option>
              {projects.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">关联机台</label>
            <select
              value={formData.equipment_name ?? ''}
              onChange={(e) => setFormData({ ...formData, equipment_name: e.target.value || undefined })}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-cyan-500"
            >
              <option value="">不关联机台</option>
              {equipment.map((item) => {
                const eqKey = String(item.equipment ?? item.id ?? item.eq_name);
                return (
                  <option key={eqKey} value={eqKey}>{item.eq_name} ({item.ap_name})</option>
                );
              })}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">需求描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-cyan-500 resize-none"
              rows={4}
              placeholder="请输入需求描述..."
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-4">
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
