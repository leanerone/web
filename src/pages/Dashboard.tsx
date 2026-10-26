import { useState, useEffect, useCallback } from 'react';
import {
  FolderKanban,
  Cpu,
  ClipboardList,
  Briefcase,
  ArrowRight,
  Calendar,
  Clock,
  RefreshCw,
  Target,
  Zap,
  CheckCircle2,
  Sparkles,
  ListTodo,
  AlertCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '@/components/Card';
import StatsCard from '@/components/StatsCard';
import Button from '@/components/Button';
import Badge, { RequirementStatusBadge, PriorityBadge } from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { StatsSkeleton, Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/Toast';
import { priorityScoreStyle } from '@/constants/status';
import { dashboardAPI, projectAPI, requirementAPI, workItemsAPI } from '@/services/api';
import { todayLocal } from '@/lib/utils';
import type { DashboardStats, Project, Requirement, WorkStats, WorkItem } from '@/types';

const REFRESH_INTERVAL = 60_000;

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [workStats, setWorkStats] = useState<WorkStats | null>(null);
  const [todoItems, setTodoItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

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
      if (itemsRes.status === 'fulfilled' && itemsRes.value.success) setTodoItems(itemsRes.value.data);
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
    const timer = setInterval(() => {
      // 后台标签页不轮询，回到前台时下一轮会自动补上
      if (!document.hidden) fetchData(true);
    }, REFRESH_INTERVAL);
    return () => clearInterval(timer);
  }, [fetchData]);

  /** 勾选待办后只静默刷新统计数字，不重拉项目/需求/待办全量列表 */
  const refreshStatsQuiet = useCallback(async () => {
    try {
      const [statsRes, workStatsRes] = await Promise.allSettled([
        dashboardAPI.stats(),
        workItemsAPI.getStats(),
      ]);
      if (statsRes.status === 'fulfilled' && statsRes.value.success) setStats(statsRes.value.data);
      if (workStatsRes.status === 'fulfilled' && workStatsRes.value.success) setWorkStats(workStatsRes.value.data);
    } catch {
      // 静默失败，60 秒后的整轮刷新会纠正
    }
  }, []);

  /** 真实勾选完成/恢复 */
  const toggleItem = async (item: WorkItem) => {
    const nextStatus = item.status === 'completed' ? 'pending' : 'completed';
    setTogglingId(item.id);
    try {
      const res = await workItemsAPI.update(item.id, { status: nextStatus });
      if (res.success) {
        setTodoItems((prev) =>
          nextStatus === 'completed' ? prev.filter((i) => i.id !== item.id) : prev.map((i) => (i.id === item.id ? res.data : i))
        );
        toast.success(nextStatus === 'completed' ? '已完成，干得漂亮' : '已恢复为待处理');
        refreshStatsQuiet();
      } else {
        toast.error(res.message || '状态更新失败');
      }
    } catch {
      toast.error('状态更新失败，请检查后端服务');
    } finally {
      setTogglingId(null);
    }
  };

  // 未完成的工作项 = 待办；已完成的不占今日待办
  const openItems = todoItems.filter((i) => i.status !== 'completed');
  const pendingRequirements = requirements.filter((r) => r.status !== 'completed');
  const activeProjects = projects.filter((p) => p.status === 'active');

  const today = todayLocal();
  const dueSoon = openItems
    .filter((i) => i.due_date)
    .sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''))
    .slice(0, 5);

  if (loading) {
    return (
      <div className="animate-fade-in space-y-6">
        <StatsSkeleton />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-80 lg:col-span-2" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* 顶部问候 + 刷新 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {new Date().getHours() < 12 ? '早上好' : new Date().getHours() < 18 ? '下午好' : '晚上好'}，
            今天有 {openItems.length} 项工作待处理
          </h2>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
            <Clock className="h-3 w-3" />
            {lastUpdated ? `最后更新 ${lastUpdated.toLocaleTimeString()} · 每 60 秒自动刷新` : '加载中...'}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => fetchData(true)} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      {/* 全局统计 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="进行中项目"
          value={stats?.active_projects ?? activeProjects.length}
          icon={<FolderKanban className="h-5 w-5" />}
          color="accent"
          onClick={() => navigate('/projects')}
        />
        <StatsCard
          title="机台总数"
          value={stats?.total_equipment ?? 0}
          icon={<Cpu className="h-5 w-5" />}
          color="green"
          onClick={() => navigate('/equipment')}
        />
        <StatsCard
          title="待处理需求"
          value={stats?.pending_requirements ?? pendingRequirements.length}
          icon={<ClipboardList className="h-5 w-5" />}
          color="orange"
          onClick={() => navigate('/requirements')}
        />
        <StatsCard
          title="本周完成率"
          value={`${stats?.completion_rate ?? 0}%`}
          icon={<Target className="h-5 w-5" />}
          color="purple"
        />
      </div>

      {/* 中部：今日待办 + 右侧栏 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 今日待办 */}
        <Card
          title="今日待办"
          className="lg:col-span-2"
          footer={
            <Button variant="ghost" className="w-full justify-center" onClick={() => navigate('/work-items')}>
              进入工作台 <ArrowRight className="h-4 w-4" />
            </Button>
          }
        >
          {openItems.length === 0 ? (
            <EmptyState
              icon={ListTodo}
              title="太棒了，待办清空了"
              description="去工作台规划下一批工作项"
              action={<Button variant="secondary" onClick={() => navigate('/work-items')}>新建工作项</Button>}
            />
          ) : (
            <ul className="-mx-2 divide-y divide-gray-50">
              {openItems.map((item) => {
                const score = priorityScoreStyle(item.priority_score);
                const overdue = item.due_date && item.due_date < today;
                return (
                  <li key={item.id} className="group flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-gray-50">
                    <button
                      onClick={() => toggleItem(item)}
                      disabled={togglingId === item.id}
                      className="flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full border-2 border-gray-300 text-transparent transition-colors hover:border-emerald-500 hover:text-emerald-500 disabled:opacity-50"
                      title="标记完成"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </button>
                    <div className="min-w-0 flex-1 cursor-pointer" onClick={() => navigate('/work-items')}>
                      <p className="truncate text-sm font-medium text-gray-800">{item.title}</p>
                      {item.category && (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: item.category.color || '#9CA3AF' }} />
                          {item.category.name}
                        </p>
                      )}
                    </div>
                    {item.due_date && (
                      <Badge tone={overdue ? 'red' : 'gray'} className="hidden sm:inline-flex">
                        {overdue && <AlertCircle className="h-3 w-3" />}
                        {overdue ? '已逾期' : ''} {item.due_date.slice(5)}
                      </Badge>
                    )}
                    <Badge tone={score.tone} className="tabular-nums">{score.label}</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* 右侧：近期截止 + 需求动态 */}
        <div className="space-y-6">
          <Card title="近期截止">
            {dueSoon.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">暂无带截止日期的待办</p>
            ) : (
              <ul className="space-y-2.5">
                {dueSoon.map((item) => {
                  const overdue = (item.due_date || '') < today;
                  return (
                    <li key={item.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="min-w-0 flex-1 truncate text-gray-700">{item.title}</span>
                      <span className={`flex-shrink-0 text-xs tabular-nums ${overdue ? 'font-medium text-red-600' : 'text-gray-400'}`}>
                        {item.due_date?.slice(5)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card
            title="需求动态"
            footer={
              <Button variant="ghost" className="w-full justify-center" onClick={() => navigate('/requirements')}>
                查看全部需求 <ArrowRight className="h-4 w-4" />
              </Button>
            }
          >
            {pendingRequirements.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">暂无待处理需求</p>
            ) : (
              <ul className="space-y-2.5">
                {pendingRequirements.slice(0, 5).map((req) => (
                  <li
                    key={req.id}
                    className="cursor-pointer rounded-lg p-2 transition-colors hover:bg-gray-50"
                    onClick={() => navigate(`/requirements/${req.id}`)}
                  >
                    <p className="truncate text-sm text-gray-700">{req.title}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <RequirementStatusBadge status={req.status} />
                      <PriorityBadge value={req.priority} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {/* 底部：项目进度 / 类别分布 / 快捷入口 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card
          title="项目进度"
          footer={
            <Button variant="ghost" className="w-full justify-center" onClick={() => navigate('/projects')}>
              全部项目 <ArrowRight className="h-4 w-4" />
            </Button>
          }
        >
          {activeProjects.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">暂无进行中项目</p>
          ) : (
            <ul className="space-y-3">
              {activeProjects.slice(0, 4).map((project) => (
                <li
                  key={project.id}
                  className="cursor-pointer rounded-lg p-2 transition-colors hover:bg-gray-50"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <p className="min-w-0 flex-1 truncate text-sm font-medium text-gray-700">{project.name}</p>
                    <span className="text-xs tabular-nums text-gray-400">{project.progress}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-accent-500 transition-all duration-500"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="工作类别分布">
          {(!workStats?.categories || workStats.categories.length === 0) ? (
            <p className="py-6 text-center text-sm text-gray-400">暂无类别数据</p>
          ) : (
            <ul className="space-y-3">
              {workStats.categories.map((cat) => {
                const maxCount = Math.max(...workStats.categories.map((c) => c.count), 1);
                return (
                  <li key={cat.id}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 text-gray-600">
                        <span>{cat.icon}</span> {cat.name}
                      </span>
                      <span className="font-medium tabular-nums text-gray-400">{cat.count}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${(cat.count / maxCount) * 100}%`, backgroundColor: cat.color || '#6B7280' }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card title="快捷入口">
          <div className="grid grid-cols-2 gap-2.5">
            <QuickAction
              icon={<Zap className="h-4 w-4" />}
              label="AI 智能排序"
              tone="bg-accent-50 text-accent-600"
              onClick={() => navigate('/work-items?sort=open')}
            />
            <QuickAction
              icon={<Sparkles className="h-4 w-4" />}
              label="AI 生成周报"
              tone="bg-purple-50 text-purple-600"
              onClick={() => navigate('/weekly-report')}
            />
            <QuickAction
              icon={<Briefcase className="h-4 w-4" />}
              label="新建工作项"
              tone="bg-blue-50 text-blue-600"
              onClick={() => navigate('/work-items')}
            />
            <QuickAction
              icon={<Calendar className="h-4 w-4" />}
              label="个人资料"
              tone="bg-amber-50 text-amber-600"
              onClick={() => navigate('/profile')}
            />
          </div>
          <p className="mt-4 border-t border-gray-50 pt-3 text-xs leading-relaxed text-gray-400">
            提示：AI 相关功能需先在「设置 → AI 配置」中完成配置并测试连接。
          </p>
        </Card>
      </div>
    </div>
  );
}

function QuickAction({ icon, label, tone, onClick }: { icon: React.ReactNode; label: string; tone: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-start gap-2 rounded-lg border border-gray-100 p-3 text-left transition-colors hover:border-gray-200 hover:bg-gray-50"
    >
      <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}>{icon}</span>
      <span className="text-xs font-medium text-gray-600">{label}</span>
    </button>
  );
}
