import { useState, useEffect, useCallback } from 'react';
import {
  FolderKanban,
  Cpu,
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Bot,
  RefreshCw,
  Zap,
  Target,
  Calendar,
} from 'lucide-react';
import Card from '@/components/Card';
import StatsCard from '@/components/StatsCard';
import Button from '@/components/Button';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI, projectAPI, requirementAPI, workItemsAPI } from '@/services/api';
import type { DashboardStats, Project, Requirement, WorkStats, WorkItem } from '@/types';

const REFRESH_INTERVAL = 60_000; // 60秒自动刷新

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [workStats, setWorkStats] = useState<WorkStats | null>(null);
  const [todayItems, setTodayItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [statsRes, projectsRes, reqRes, workStatsRes, itemsRes] = await Promise.allSettled([
        dashboardAPI.stats(),
        projectAPI.list(),
        requirementAPI.list(),
        workItemsAPI.getStats(),
        workItemsAPI.list({ sort_by: 'priority_score', limit: 8 }),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value.success) setStats(statsRes.value.data);
      if (projectsRes.status === 'fulfilled' && projectsRes.value.success) setProjects(projectsRes.value.data);
      if (reqRes.status === 'fulfilled' && reqRes.value.success) setRequirements(reqRes.value.data);
      if (workStatsRes.status === 'fulfilled' && workStatsRes.value.success) setWorkStats(workStatsRes.value.data);
      if (itemsRes.status === 'fulfilled' && itemsRes.value.success) setTodayItems(itemsRes.value.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const timer = setInterval(() => fetchData(true), REFRESH_INTERVAL);
    return () => clearInterval(timer);
  }, [fetchData]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      dev: 'bg-blue-50 text-blue-600',
      testing: 'bg-orange-50 text-orange-600',
      deploying: 'bg-purple-50 text-purple-600',
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

  const reqStatusLabels: Record<string, string> = {
    dev: '开发中', testing: '测试中', deploying: '上线中', completed: '已完成',
    pending: '待处理', in_progress: '进行中', rejected: '已拒绝',
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-100 border border-gray-200 rounded-xl p-5 animate-pulse h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-gray-100 border border-gray-200 rounded-xl p-5 animate-pulse h-64" />
          <div className="bg-gray-100 border border-gray-200 rounded-xl p-5 animate-pulse h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in p-6">
      {/* 顶部刷新栏 */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          {lastUpdated ? `最后更新: ${lastUpdated.toLocaleTimeString()} (每60秒自动刷新)` : '加载中...'}
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fetchData(true)}
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? '刷新中...' : '手动刷新'}
        </Button>
      </div>

      {/* 统计卡片 - 全局资源 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="项目总数"
          value={stats?.total_projects ?? 0}
          icon={<FolderKanban className="w-6 h-6" />}
          color="cyan"
        />
        <StatsCard
          title="机台数量"
          value={stats?.total_equipment ?? 0}
          icon={<Cpu className="w-6 h-6" />}
          color="green"
        />
        <StatsCard
          title="待处理需求"
          value={stats?.pending_requirements ?? 0}
          icon={<ClipboardList className="w-6 h-6" />}
          color="orange"
        />
        <StatsCard
          title="工作项总数"
          value={workStats?.total ?? 0}
          icon={<CheckCircle2 className="w-6 h-6" />}
          color="purple"
        />
      </div>

      {/* 工作统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm">待处理工作</p>
              <h3 className="text-2xl font-bold mt-1 text-gray-800">{workStats?.pending ?? 0}</h3>
            </div>
            <Clock className="w-8 h-8 text-orange-400" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm">进行中</p>
              <h3 className="text-2xl font-bold mt-1 text-gray-800">{workStats?.in_progress ?? 0}</h3>
            </div>
            <Zap className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm">已完成</p>
              <h3 className="text-2xl font-bold mt-1 text-gray-800">{workStats?.completed ?? 0}</h3>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm">本周完成率</p>
              <h3 className="text-2xl font-bold mt-1 text-gray-800">{stats?.completion_rate ?? 0}%</h3>
            </div>
            <Target className="w-8 h-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* 中部三栏 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* 今日高优先级工作 */}
        <Card
          title="今日高优先级工作"
          className="lg:col-span-2"
          footer={
            <Button variant="ghost" className="w-full justify-center" onClick={() => navigate('/work-items')}>
              查看全部工作项 <ArrowRight className="w-4 h-4" />
            </Button>
          }
        >
          <div className="space-y-3">
            {todayItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">暂无工作项，请先创建</div>
            ) : (
              todayItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                  onClick={() => navigate('/work-items')}
                >
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    item.urgency === 'high' ? 'bg-red-500' :
                    item.urgency === 'medium' ? 'bg-yellow-500' : 'bg-gray-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-800 truncate">{item.title}</h4>
                    {item.due_date && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>截止: {item.due_date}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs text-gray-500">优先级</div>
                    <div className="text-lg font-bold text-cyan-600">{item.priority_score.toFixed(1)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* 待处理需求 */}
        <Card
          title="待处理需求"
          footer={
            <Button variant="ghost" className="w-full justify-center" onClick={() => navigate('/requirements')}>
              查看全部需求 <ArrowRight className="w-4 h-4" />
            </Button>
          }
        >
          <div className="space-y-3">
            {requirements.filter((r) => r.status !== 'completed').slice(0, 5).map((req) => (
              <div
                key={req.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition cursor-pointer"
                onClick={() => navigate(`/requirements/${req.id}`)}
              >
                <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${req.priority === 'high' || req.priority === 'critical' ? 'text-orange-600' : 'text-gray-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 truncate">{req.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(req.status)}`}>
                      {reqStatusLabels[req.status] || req.status}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(req.priority)}`}>
                      {req.priority === 'high' ? '高' : req.priority === 'critical' ? '紧急' : req.priority === 'medium' ? '中' : '低'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {requirements.filter((r) => r.status !== 'completed').length === 0 && (
              <div className="text-center py-8 text-gray-500">暂无待处理需求</div>
            )}
          </div>
        </Card>
      </div>

      {/* 底部三栏 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 进行中项目 */}
        <Card
          title="进行中的项目"
          footer={
            <Button variant="ghost" className="w-full justify-center" onClick={() => navigate('/projects')}>
              查看全部项目 <ArrowRight className="w-4 h-4" />
            </Button>
          }
        >
          <div className="space-y-4">
            {projects.filter((p) => p.status === 'active').slice(0, 4).map((project) => (
              <div
                key={project.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition cursor-pointer"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <FolderKanban className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{project.name}</p>
                  <span className="text-xs text-gray-500">{project.progress}%</span>
                </div>
                <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-500"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>
            ))}
            {projects.filter((p) => p.status === 'active').length === 0 && (
              <div className="text-center py-8 text-gray-500">暂无进行中项目</div>
            )}
          </div>
        </Card>

        {/* 工作类别分布 */}
        <Card title="工作类别分布">
          <div className="space-y-3">
            {workStats?.categories.map((cat) => {
              const maxCount = Math.max(...workStats.categories.map((c) => c.count), 1);
              const percentage = (cat.count / maxCount) * 100;
              return (
                <div key={cat.id}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-700 flex items-center gap-1">
                      {cat.icon} {cat.name}
                    </span>
                    <span className="text-gray-500 font-medium">{cat.count}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${percentage}%`, backgroundColor: cat.color || '#6B7280' }}
                    />
                  </div>
                </div>
              );
            })}
            {(!workStats?.categories || workStats.categories.length === 0) && (
              <div className="text-center py-8 text-gray-500 text-sm">暂无工作类别数据</div>
            )}
          </div>
        </Card>

        {/* AI智能提示 */}
        <Card title="AI智能提示">
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-cyan-50 rounded-lg border border-cyan-200">
              <Bot className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-cyan-600 font-medium mb-1">AI助手建议</p>
                <ul className="space-y-2">
                  <li className="text-sm text-gray-700 flex items-start gap-2">
                    <ArrowRight className="w-3 h-3 text-cyan-600 flex-shrink-0 mt-1" />
                    当前有 {requirements.filter((r) => r.status !== 'completed').length} 个待处理需求
                  </li>
                  <li className="text-sm text-gray-700 flex items-start gap-2">
                    <ArrowRight className="w-3 h-3 text-cyan-600 flex-shrink-0 mt-1" />
                    {workStats?.pending ?? 0} 个工作项待处理，{workStats?.in_progress ?? 0} 个进行中
                  </li>
                  <li className="text-sm text-gray-700 flex items-start gap-2">
                    <ArrowRight className="w-3 h-3 text-cyan-600 flex-shrink-0 mt-1" />
                    本周完成率 {stats?.completion_rate ?? 0}%
                  </li>
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
      </div>
    </div>
  );
}
