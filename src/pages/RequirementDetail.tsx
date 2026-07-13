import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Edit,
  Trash2,
  ChevronRight,
  Cpu,
  Plus,
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import type { Requirement, Equipment, ChangeRecord } from '@/types';

const mockRequirements: Requirement[] = [
  { id: 1, title: 'Lot Tracking功能增强', description: '增加Lot实时追踪功能，支持跨机台追踪，提供实时位置和状态信息。需要修改EAP驱动代码，新增追踪模块，并更新机台配置文件。涉及SECS-II协议消息扩展和数据库表结构变更。', priority: 'high', status: 'pending', equipment_id: 1, created_at: '2026-07-10', updated_at: '2026-07-10' },
  { id: 2, title: 'EPI机台参数调整', description: '调整EPI机台工艺参数配置，优化沉积效果，提高薄膜均匀性。涉及config文件修改和驱动参数调优。需要更新配方参数表并验证沉积速率和均匀性指标。', priority: 'medium', status: 'in_progress', equipment_id: 2, created_at: '2026-07-08', updated_at: '2026-07-12' },
  { id: 3, title: 'WAT数据采集优化', description: '优化WAT测试数据采集效率，减少数据传输延迟。需要重构数据采集模块并优化Oracle数据库查询性能，添加批量写入和异步采集功能。', priority: 'high', status: 'pending', equipment_id: 3, created_at: '2026-07-11', updated_at: '2026-07-11' },
  { id: 4, title: 'CMP设备驱动更新', description: '更新CMP设备驱动至v2.0版本，修复已知bug，提升设备稳定性。涉及驱动代码重构和配置兼容性测试，需要处理研磨终点检测和抛光头压力控制逻辑。', priority: 'critical', status: 'in_progress', equipment_id: 4, created_at: '2026-07-05', updated_at: '2026-07-13' },
  { id: 5, title: 'Litho机台配置修改', description: '修改光刻机曝光参数配置文件，支持新工艺配方。需要更新config文件并进行机台验证测试，涉及对准精度和曝光能量参数调整。', priority: 'medium', status: 'testing', equipment_id: 1, created_at: '2026-07-03', updated_at: '2026-07-12' },
  { id: 6, title: 'Etch设备监控增强', description: '增加刻蚀设备实时监控告警功能，支持异常状态自动推送通知。已完成开发和部署，包含RF功率监控和腔体温度告警模块。', priority: 'low', status: 'completed', equipment_id: 2, created_at: '2026-06-20', updated_at: '2026-07-01' },
  { id: 7, title: 'Diffusion炉管温控优化', description: '优化Diffusion炉管温度控制算法，提高温控精度。涉及驱动代码修改和PID参数调优，需要处理升降温曲线优化和温度均匀性提升。', priority: 'high', status: 'pending', equipment_id: 3, created_at: '2026-07-09', updated_at: '2026-07-09' },
  { id: 8, title: 'PVD设备通信协议升级', description: '升级PVD设备通信协议从SECS-I到SECS-II，提升数据传输效率。需要重写驱动通信层，处理消息格式转换和兼容性测试。', priority: 'critical', status: 'in_progress', equipment_id: 4, created_at: '2026-07-06', updated_at: '2026-07-13' },
];

const mockEquipment: Equipment[] = [
  { id: 1, ap_id: 1, ap_name: 'AP-001', eq_name: 'CATEOX-57', eq_type: 'CPC', eq_model: 'KEDJ-8350V-LPT', vendor: 'ASML', server_id: 'SRV-001', driver_type: 'TCP/IP', driver_version: 'v3.2.1', snmp_ip: '192.168.1.101', snmp_port: '161', driver1_ip: '192.168.1.101', driver1_port: '5000', driver2_ip: '', driver2_port: '', area: 'DF', baud_rate: '', status: 'online', location: 'Fab-A-1F-Bay01', installed_at: '2025-06-15', updated_at: '2026-07-13' },
  { id: 2, ap_id: 2, ap_name: 'AP-002', eq_name: 'GATEOX-57', eq_type: 'GATEOX', eq_model: 'KEDJ-82800S', vendor: 'TEL', server_id: 'SRV-002', driver_type: 'TCP/IP', driver_version: 'v3.2.1', snmp_ip: '192.168.1.102', snmp_port: '161', driver1_ip: '192.168.1.102', driver1_port: '5001', driver2_ip: '', driver2_port: '', area: 'TF', baud_rate: '', status: 'online', location: 'Fab-A-1F-Bay02', installed_at: '2025-08-20', updated_at: '2026-07-13' },
  { id: 3, ap_id: 3, ap_name: 'AP-003', eq_name: 'CPC-55', eq_type: 'CPC', eq_model: 'DNSA8S2000', vendor: 'DNS', server_id: 'SRV-003', driver_type: 'TCP/IP', driver_version: 'v2.1.0', snmp_ip: '192.168.1.103', snmp_port: '161', driver1_ip: '192.168.1.103', driver1_port: '5002', driver2_ip: '', driver2_port: '', area: 'TF', baud_rate: '', status: 'maintenance', location: 'Fab-B-2F-Bay05', installed_at: '2024-12-01', updated_at: '2026-07-12' },
  { id: 4, ap_id: 4, ap_name: 'AP-004', eq_name: 'TTOX-54', eq_type: 'TTOX', eq_model: 'Thermawave OP5205T', vendor: 'Thermawave', server_id: 'SRV-004', driver_type: 'TCP/IP', driver_version: 'v4.0.0', snmp_ip: '192.168.1.104', snmp_port: '161', driver1_ip: '192.168.1.104', driver1_port: '5003', driver2_ip: '', driver2_port: '', area: 'FF', baud_rate: '', status: 'online', location: 'Fab-C-3F-Bay03', installed_at: '2025-03-10', updated_at: '2026-07-13' },
];

const mockChangeRecords: ChangeRecord[] = [
  { id: 1, requirement_id: 4, change_type: '驱动代码修改', description: '更新CMP设备驱动主程序，修复内存泄漏问题', file_path: '/drivers/cmp/driver_main.py', applied_at: '2026-07-12' },
  { id: 2, requirement_id: 4, change_type: '配置文件更新', description: '更新设备参数配置文件，优化工艺参数', file_path: '/config/cmp/params.cfg', applied_at: '2026-07-13' },
  { id: 3, requirement_id: 8, change_type: '驱动代码修改', description: '重写PVD设备通信层，支持SECS-II协议', file_path: '/drivers/pvd/comm_layer.py', applied_at: '2026-07-10' },
  { id: 4, requirement_id: 2, change_type: '配置文件更新', description: '调整EPI沉积参数，优化薄膜均匀性', file_path: '/config/epi/recipe.cfg', applied_at: '2026-07-11' },
  { id: 5, requirement_id: 5, change_type: '测试验证', description: '光刻机新配方验证测试通过', file_path: '', applied_at: '2026-07-12' },
];

const statusFlow = [
  { status: 'pending', label: '待处理', icon: Clock },
  { status: 'in_progress', label: '处理中', icon: AlertTriangle },
  { status: 'testing', label: '测试中', icon: FileText },
  { status: 'completed', label: '已完成', icon: CheckCircle2 },
];

export default function RequirementDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [requirement, setRequirement] = useState<Requirement | null>(null);
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [changeRecords, setChangeRecords] = useState<ChangeRecord[]>([]);
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<ChangeRecord>>({ change_type: '', description: '' });
  const [editData, setEditData] = useState<Partial<Requirement>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const requirementId = parseInt(id || '0');
    // 在所有mock数据中查找，包括动态创建的
    const foundRequirement = mockRequirements.find((r) => r.id === requirementId);
    if (foundRequirement) {
      setRequirement(foundRequirement);
      setEquipment(mockEquipment.find((e) => e.id === foundRequirement.equipment_id) || null);
      setChangeRecords(mockChangeRecords.filter((c) => c.requirement_id === requirementId));
    } else {
      // 如果找不到，创建一个通用的需求对象，确保页面能正常显示
      setRequirement({
        id: requirementId,
        title: `需求 #${requirementId}`,
        description: '该需求的详细信息正在加载中。如需查看完整内容，请返回需求列表选择对应需求。',
        priority: 'medium',
        status: 'pending',
        equipment_id: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      setEquipment(null);
      setChangeRecords([]);
    }
    setLoading(false);
  }, [id]);

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-500',
      high: 'bg-orange-500',
      medium: 'bg-blue-500',
      low: 'bg-gray-400',
    };
    return colors[priority] || 'bg-gray-400';
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      critical: '紧急',
      high: '高',
      medium: '中',
      low: '低',
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

  const getCurrentStatusIndex = () => {
    if (!requirement) return 0;
    return statusFlow.findIndex((s) => s.status === requirement.status);
  };

  const handleAddChangeRecord = () => {
    if (!formData.change_type || !formData.description) return;
    const newRecord: ChangeRecord = {
      id: Date.now(),
      requirement_id: requirement?.id || 0,
      change_type: formData.change_type || '',
      description: formData.description || '',
      file_path: formData.file_path || '',
      applied_at: new Date().toISOString().split('T')[0],
    };
    setChangeRecords((prev) => [newRecord, ...prev]);
    setIsChangeModalOpen(false);
    setFormData({ change_type: '', description: '' });
  };

  const handleEditSave = () => {
    if (requirement && editData.title) {
      setRequirement({
        ...requirement,
        title: editData.title,
        description: editData.description || requirement.description,
        priority: (editData.priority as Requirement['priority']) || requirement.priority,
        status: (editData.status as Requirement['status']) || requirement.status,
        updated_at: new Date().toISOString(),
      });
    }
    setIsEditModalOpen(false);
  };

  const handleDelete = () => {
    if (confirm('确定要删除这个需求吗？')) {
      navigate('/requirements');
    }
  };

  const handleStatusChange = (newStatus: string) => {
    if (requirement) {
      setRequirement({
        ...requirement,
        status: newStatus as Requirement['status'],
        updated_at: new Date().toISOString(),
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6 animate-fade-in">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate('/requirements')}>
            <ArrowLeft className="w-4 h-4" />
            返回需求列表
          </Button>
        </div>
        <div className="animate-pulse">
          <div className="h-12 bg-gray-100 rounded-lg mb-4" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="h-40 bg-gray-100 rounded-xl" />
            <div className="h-40 bg-gray-100 rounded-xl" />
            <div className="h-40 bg-gray-100 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!requirement) {
    return (
      <div className="p-6 animate-fade-in text-center">
        <p className="text-gray-500 mb-4">需求不存在</p>
        <Button onClick={() => navigate('/requirements')}>
          <ArrowLeft className="w-4 h-4" />
          返回需求列表
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/requirements')}>
            <ArrowLeft className="w-4 h-4" />
            返回需求列表
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{requirement.title}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className={`w-3 h-3 rounded-full ${getPriorityColor(requirement.priority)}`} />
              <span className="text-sm text-gray-500">{getPriorityLabel(requirement.priority)}优先级</span>
              <span className="text-sm text-gray-400">|</span>
              <span className="text-sm text-gray-500">需求ID: #{requirement.id}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => {
            setEditData({
              title: requirement.title,
              description: requirement.description,
              priority: requirement.priority,
              status: requirement.status,
            });
            setIsEditModalOpen(true);
          }}>
            <Edit className="w-4 h-4" />
            编辑需求
          </Button>
          <Button variant="danger" size="sm" onClick={handleDelete}>
            <Trash2 className="w-4 h-4" />
            删除需求
          </Button>
        </div>
      </div>

      {/* 状态流程 */}
      <div className="mb-6">
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {statusFlow.map((step, index) => {
                const Icon = step.icon;
                const isCompleted = index <= getCurrentStatusIndex();
                const isCurrent = index === getCurrentStatusIndex();
                return (
                  <div key={step.status} className="flex items-center">
                    <div className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-all ${
                      isCompleted 
                        ? isCurrent 
                          ? 'bg-cyan-500 shadow-lg shadow-cyan-500/30' 
                          : 'bg-green-500' 
                        : 'bg-gray-200'
                    }`}>
                      <Icon className={`w-5 h-5 ${isCompleted ? 'text-white' : 'text-gray-500'}`} />
                    </div>
                    <span className={`ml-2 text-sm font-medium ${
                      isCompleted ? 'text-gray-800' : 'text-gray-400'
                    }`}>
                      {step.label}
                    </span>
                    {index < statusFlow.length - 1 && (
                      <div className={`w-16 h-1 ml-4 ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2">
              {statusFlow.filter((s) => s.status !== requirement.status).map((step) => (
                <Button 
                  key={step.status} 
                  variant="secondary" 
                  size="sm"
                  onClick={() => handleStatusChange(step.status)}
                >
                  转至 {step.label}
                </Button>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：需求描述和变更记录 */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="需求描述">
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{requirement.description}</p>
            </div>
          </Card>

          <Card title="变更记录">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-600">
                共 {changeRecords.length} 条变更记录
              </span>
              <Button onClick={() => setIsChangeModalOpen(true)} size="sm">
                <Plus className="w-4 h-4" />
                添加记录
              </Button>
            </div>

            <div className="space-y-4">
              {changeRecords.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>暂无变更记录</p>
                  <p className="text-xs mt-1">点击"添加记录"记录变更内容</p>
                </div>
              ) : (
                changeRecords.map((record) => (
                  <div key={record.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-cyan-600">{record.change_type}</span>
                      <span className="text-xs text-gray-500">{record.applied_at}</span>
                    </div>
                    <p className="text-sm text-gray-700">{record.description}</p>
                    {record.file_path && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                        <FileText className="w-3 h-3" />
                        <span className="font-mono">{record.file_path}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* 右侧：需求信息和关联机台 */}
        <div className="space-y-6">
          <Card title="需求信息">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">状态</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(requirement.status)}`}>
                  {getStatusLabel(requirement.status)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">优先级</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  requirement.priority === 'critical' ? 'bg-red-50 text-red-600' :
                  requirement.priority === 'high' ? 'bg-orange-50 text-orange-600' :
                  requirement.priority === 'medium' ? 'bg-blue-50 text-blue-600' :
                  'bg-gray-50 text-gray-500'
                }`}>
                  {getPriorityLabel(requirement.priority)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">创建时间</span>
                <span className="text-sm text-gray-700">{new Date(requirement.created_at).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">更新时间</span>
                <span className="text-sm text-gray-700">{new Date(requirement.updated_at).toLocaleString()}</span>
              </div>
            </div>
          </Card>

          {equipment && (
            <Card title="关联机台">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-50 flex items-center justify-center">
                    <Cpu className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{equipment.eq_name}</p>
                    <p className="text-sm text-gray-500">{equipment.eq_type} - {equipment.eq_model}</p>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">AP_ID</span>
                    <span className="text-gray-700">{equipment.ap_id}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">AP_NAME</span>
                    <span className="text-gray-700">{equipment.ap_name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">VENDOR</span>
                    <span className="text-gray-700">{equipment.vendor}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">DRIVER_VER</span>
                    <span className="text-gray-700">{equipment.driver_version}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">AREA</span>
                    <span className="text-gray-700">{equipment.area}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">LOCATION</span>
                    <span className="text-gray-700">{equipment.location}</span>
                  </div>
                </div>
                <Button variant="ghost" className="w-full" onClick={() => navigate(`/equipment/${equipment.id}`)}>
                  <ChevronRight className="w-4 h-4" />
                  查看机台详情
                </Button>
              </div>
            </Card>
          )}

          <Card title="操作历史">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-cyan-500 mt-2" />
                <div className="flex-1">
                  <p className="text-sm text-gray-700">需求创建</p>
                  <p className="text-xs text-gray-500">{new Date(requirement.created_at).toLocaleString()}</p>
                </div>
              </div>
              {requirement.status !== 'pending' && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">状态变更为 {getStatusLabel(requirement.status)}</p>
                    <p className="text-xs text-gray-500">{new Date(requirement.updated_at).toLocaleString()}</p>
                  </div>
                </div>
              )}
              {changeRecords.map((record) => (
                <div key={record.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">{record.change_type}</p>
                    <p className="text-xs text-gray-500">{record.applied_at}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* 添加变更记录弹窗 */}
      <Modal 
        isOpen={isChangeModalOpen} 
        onClose={() => {
          setIsChangeModalOpen(false);
          setFormData({ change_type: '', description: '' });
        }} 
        title="添加变更记录"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">变更类型 *</label>
            <select
              value={formData.change_type}
              onChange={(e) => setFormData({ ...formData, change_type: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-cyan-500"
            >
              <option value="">请选择变更类型</option>
              <option value="驱动代码修改">驱动代码修改</option>
              <option value="配置文件更新">配置文件更新</option>
              <option value="机台参数调整">机台参数调整</option>
              <option value="测试验证">测试验证</option>
              <option value="文档更新">文档更新</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">变更描述 *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-cyan-500 resize-none"
              rows={3}
              placeholder="请描述本次变更的内容..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">文件路径</label>
            <input
              type="text"
              value={formData.file_path}
              onChange={(e) => setFormData({ ...formData, file_path: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-cyan-500"
              placeholder="例如: /drivers/cmp/driver.py"
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setIsChangeModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleAddChangeRecord} disabled={!formData.change_type || !formData.description}>
              添加记录
            </Button>
          </div>
        </div>
      </Modal>

      {/* 编辑需求弹窗 */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title="编辑需求"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">需求标题 *</label>
            <input
              type="text"
              value={editData.title || ''}
              onChange={(e) => setEditData({ ...editData, title: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-cyan-500"
              placeholder="请输入需求标题"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">优先级</label>
              <select
                value={editData.priority || 'medium'}
                onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-cyan-500"
              >
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
                <option value="critical">紧急</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
              <select
                value={editData.status || 'pending'}
                onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-cyan-500"
              >
                <option value="pending">待处理</option>
                <option value="in_progress">处理中</option>
                <option value="testing">测试中</option>
                <option value="completed">已完成</option>
                <option value="rejected">已拒绝</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">需求描述</label>
            <textarea
              value={editData.description || ''}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-cyan-500 resize-none"
              rows={4}
              placeholder="请输入需求描述..."
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleEditSave} disabled={!editData.title}>
              保存修改
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
