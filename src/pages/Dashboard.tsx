import { useState, useEffect } from 'react';
import { 
  FolderKanban, 
  Cpu, 
  ClipboardList, 
  CheckCircle2, 
  TrendingUp,
  Clock,
  AlertTriangle,
  ArrowRight,
  Bot,
} from 'lucide-react';
import Card from '@/components/Card';
import StatsCard from '@/components/StatsCard';
import Button from '@/components/Button';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI, projectAPI, requirementAPI, equipmentAPI } from '@/services/api';
import useAppStore from '@/stores/appStore';
import type { DashboardStats, Project, Requirement, Equipment } from '@/types';

const mockStats: DashboardStats = {
  total_projects: 24,
  active_projects: 18,
  total_equipment: 1024,
  online_equipment: 987,
  pending_requirements: 12,
  completed_tasks: 156,
  weekly_tasks: 32,
  completion_rate: 87,
};

const mockProjects: Project[] = [
  { id: 1, name: 'EAP系统升级v2.0', description: '升级现有EAP系统至新版本', status: 'active', start_date: '2026-01-15', end_date: '2026-06-30', progress: 75, created_at: '2026-01-15', updated_at: '2026-07-13' },
  { id: 2, name: 'Litho机台驱动优化', description: '优化光刻机关键驱动性能', status: 'active', start_date: '2026-03-01', end_date: '2026-08-31', progress: 45, created_at: '2026-03-01', updated_at: '2026-07-13' },
  { id: 3, name: 'CMP设备集成', description: '集成新CMP设备至CIM系统', status: 'active', start_date: '2026-05-01', end_date: '2026-11-30', progress: 20, created_at: '2026-05-01', updated_at: '2026-07-13' },
];

const mockRequirements: Requirement[] = [
  { id: 1, title: 'Lot Tracking功能增强', description: '增加Lot实时追踪功能', priority: 'high', status: 'pending', created_at: '2026-07-10', updated_at: '2026-07-10' },
  { id: 2, title: 'EPI机台参数调整', description: '调整EPI机台工艺参数配置', priority: 'medium', status: 'in_progress', created_at: '2026-07-08', updated_at: '2026-07-12' },
  { id: 3, title: 'WAT数据采集优化', description: '优化WAT测试数据采集效率', priority: 'high', status: 'pending', created_at: '2026-07-11', updated_at: '2026-07-11' },
];

const mockEquipment: Equipment[] = [
  { id: 1, type_id: 1, name: 'LITHO-001', location: 'Fab-A-1F', status: 'online', driver_version: 'v3.2.1', installed_at: '2025-06-15', updated_at: '2026-07-13' },
  { id: 2, type_id: 2, name: 'EPI-005', location: 'Fab-B-2F', status: 'maintenance', driver_version: 'v2.1.0', installed_at: '2024-12-01', updated_at: '2026-07-12' },
];

const aiSuggestions = [
  '今日建议优先处理Lot Tracking功能增强需求',
  'Litho机台驱动优化项目进度落后，建议加快推进',
  '本周计划完成32个任务，当前完成率87%',
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { setStats, setProjects, setRequirements, setEquipment } = useAppStore();
  const [stats, setStatsData] = useState<DashboardStats>(mockStats);
  const [projects, setProjectsData] = useState<Project[]>(mockProjects);
  const [requirements, setRequirementsData] = useState<Requirement[]>(mockRequirements);
  const [equipment, setEquipmentData] = useState<Equipment[]>(mockEquipment);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, projectsRes, reqRes, equipRes] = await Promise.all([
          dashboardAPI.stats(),
          projectAPI.list(),
          requirementAPI.list(),
          equipmentAPI.list(),
        ]);
        
        if (statsRes.success) setStatsData(statsRes.data);
        if (projectsRes.success) setProjectsData(projectsRes.data);
        if (reqRes.success) setRequirementsData(reqRes.data);
        if (equipRes.success) setEquipmentData(equipRes.data);
        
        setStats(statsRes.success ? statsRes.data : mockStats);
        setProjects(projectsRes.success ? projectsRes.data : mockProjects);
        setRequirements(reqRes.success ? reqRes.data : mockRequirements);
        setEquipment(equipRes.success ? equipRes.data : mockEquipment);
      } catch {
        setStats(mockStats);
        setProjects(mockProjects);
        setRequirements(mockRequirements);
        setEquipment(mockEquipment);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [setStats, setProjects, setRequirements, setEquipment]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-gray-100 text-gray-500',
      in_progress: 'bg-blue-50 text-blue-600',
      completed: 'bg-green-50 text-green-600',
      active: 'bg-green-50 text-green-600',
      online: 'bg-green-50 text-green-600',
      offline: 'bg-red-50 text-red-600',
      maintenance: 'bg-orange-50 text-orange-600',
    };
    return colors[status] || 'bg-gray-100 text-gray-500';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-100 text-gray-500',
      medium: 'bg-blue-50 text-blue-600',
      high: 'bg-orange-50 text-orange-600',
      critical: 'bg-red-50 text-red-600',
    };
    return colors[priority] || 'bg-gray-100 text-gray-500';
  };

  return (
    <div className="animate-fade-in">
      <div className="p-6">
        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-gray-100 border border-gray-200 rounded-xl p-5 animate-pulse" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-gray-100 border border-gray-200 rounded-xl p-5 animate-pulse" />
              <div className="bg-gray-100 border border-gray-200 rounded-xl p-5 animate-pulse" />
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatsCard
                title="项目总数"
                value={stats.total_projects}
                icon={<FolderKanban className="w-6 h-6" />}
                color="cyan"
                trend={{ value: 12, label: '较上周' }}
              />
              <StatsCard
                title="机台数量"
                value={stats.total_equipment}
                icon={<Cpu className="w-6 h-6" />}
                color="green"
                trend={{ value: 5, label: '较上月' }}
              />
              <StatsCard
                title="待处理需求"
                value={stats.pending_requirements}
                icon={<ClipboardList className="w-6 h-6" />}
                color="orange"
              />
              <StatsCard
                title="本周任务完成率"
                value={`${stats.completion_rate}%`}
                icon={<CheckCircle2 className="w-6 h-6" />}
                color="purple"
                trend={{ value: stats.completion_rate - 80, label: '目标' }}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card title="AI智能提示" className="lg:col-span-1">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                    <Bot className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-cyan-600 font-medium mb-1">AI助手建议</p>
                      <ul className="space-y-2">
                        {aiSuggestions.map((suggestion, index) => (
                          <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                            <ArrowRight className="w-3 h-3 text-cyan-600 flex-shrink-0 mt-1" />
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-cyan-600 hover:text-cyan-500"
                    onClick={() => navigate('/ai-assistant')}
                  >
                    获取更多AI建议
                  </Button>
                </div>
              </Card>

              <Card 
                title="进行中的项目" 
                footer={
                  <Button 
                    variant="ghost" 
                    className="w-full justify-center"
                    onClick={() => navigate('/projects')}
                  >
                    查看全部项目
                  </Button>
                }
              >
                <div className="space-y-4">
                  {projects.slice(0, 3).map((project) => (
                    <div key={project.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate(`/projects/${project.id}`)}>
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <FolderKanban className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{project.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(project.status)}`}>
                            {project.status === 'active' ? '进行中' : project.status}
                          </span>
                          <span className="text-xs text-gray-500">{project.progress}%</span>
                        </div>
                      </div>
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-500"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card 
                title="待处理需求" 
                footer={
                  <Button 
                    variant="ghost" 
                    className="w-full justify-center"
                    onClick={() => navigate('/requirements')}
                  >
                    查看全部需求
                  </Button>
                }
              >
                <div className="space-y-3">
                  {requirements.slice(0, 4).map((req) => (
                    <div key={req.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate(`/requirements/${req.id}`)}>
                      <AlertTriangle className={`w-4 h-4 ${req.priority === 'high' || req.priority === 'critical' ? 'text-orange-600' : 'text-gray-400'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 truncate">{req.title}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(req.priority)} mt-1 inline-block`}>
                          {req.priority === 'high' ? '高优先级' : req.priority === 'medium' ? '中优先级' : '低优先级'}
                        </span>
                      </div>
                      <Clock className="w-4 h-4 text-gray-400" />
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div className="mt-6">
              <Card title="机台状态概览">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs font-medium text-gray-500 border-b border-gray-200">
                        <th className="pb-3 px-4">机台名称</th>
                        <th className="pb-3 px-4">机型</th>
                        <th className="pb-3 px-4">位置</th>
                        <th className="pb-3 px-4">驱动版本</th>
                        <th className="pb-3 px-4">状态</th>
                      </tr>
                    </thead>
                    <tbody>
                      {equipment.slice(0, 5).map((item) => (
                        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4 text-sm text-gray-800">{item.name}</td>
                          <td className="py-3 px-4 text-sm text-gray-500">{item.type?.name || '未知机型'}</td>
                          <td className="py-3 px-4 text-sm text-gray-500">{item.location}</td>
                          <td className="py-3 px-4 text-sm text-gray-500">{item.driver_version}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'online' ? 'bg-green-500' : item.status === 'maintenance' ? 'bg-orange-500' : 'bg-red-500'}`} />
                              {item.status === 'online' ? '在线' : item.status === 'offline' ? '离线' : '维护中'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    显示 {equipment.length} 台机台，其中 {stats.online_equipment} 台在线
                  </p>
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => navigate('/equipment')}
                  >
                    <TrendingUp className="w-4 h-4" />
                    查看全部机台
                  </Button>
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}