import { useState, useEffect } from 'react';
import {
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Flag,
  Calendar,
  Sparkles,
  ArrowRight,
  Zap,
  Target,
  BarChart3,
  PieChart,
} from 'lucide-react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { workItemsAPI } from '@/services/api';
import type { WorkStats, WorkItem, DailyPlan } from '@/types';

const statusColors: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  blocked: 'bg-red-100 text-red-700',
};

const statusLabels: Record<string, string> = {
  pending: '待处理',
  in_progress: '进行中',
  completed: '已完成',
  blocked: '受阻',
};

export default function WorkDashboard() {
  const [stats, setStats] = useState<WorkStats | null>(null);
  const [todayItems, setTodayItems] = useState<WorkItem[]>([]);
  const [dailyPlan, setDailyPlan] = useState<DailyPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, itemsRes, planRes] = await Promise.allSettled([
        workItemsAPI.getStats(),
        workItemsAPI.list({ sort_by: 'priority_score', limit: 10 }),
        workItemsAPI.getDailyPlan(),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value.success) setStats(statsRes.value.data);
      if (itemsRes.status === 'fulfilled' && itemsRes.value.success) setTodayItems(itemsRes.value.data);
      if (planRes.status === 'fulfilled' && planRes.value.success) setDailyPlan(planRes.value.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateAIPlan = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const highPriority = todayItems.filter(
        (item) => item.urgency === 'high' || item.importance === 'high'
      );
      const urgentItems = todayItems.filter((item) => item.urgency === 'high');
      
      const suggestions = `今日建议：\n1. 优先处理 ${urgentItems.length} 个紧急任务\n2. 按优先级排序处理工作项\n3. 合理安排时间，保持工作节奏`;
      const summary = `今日共 ${todayItems.length} 项工作，其中 ${highPriority.length} 项为高优先级`;

      const res = await workItemsAPI.saveDailyPlan({
        plan_date: today,
        ai_suggestions: suggestions,
        summary,
      });
      if (res.success) {
        setDailyPlan(res.data);
        alert('AI规划已生成！');
      }
    } catch (err) {
      console.error('Failed to generate AI plan:', err);
      alert('生成失败，请重试');
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Target className="w-6 h-6 text-cyan-600" />
            工作仪表盘
          </h1>
          <p className="text-sm text-gray-500 mt-1">今日工作总览与AI智能规划</p>
        </div>
        <Button onClick={generateAIPlan}>
          <Sparkles className="w-4 h-4" />
          生成AI规划
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cyan-100 text-sm">总工作项</p>
                <h3 className="text-3xl font-bold mt-1">{stats?.total || 0}</h3>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6" />
              </div>
            </div>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm">待处理</p>
                <h3 className="text-3xl font-bold mt-1">{stats?.pending || 0}</h3>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">进行中</p>
                <h3 className="text-3xl font-bold mt-1">{stats?.in_progress || 0}</h3>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">已完成</p>
                <h3 className="text-3xl font-bold mt-1">{stats?.completed || 0}</h3>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-800 flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyan-500" />
                今日高优先级工作
              </h3>
              <button className="text-sm text-cyan-600 hover:text-cyan-700 flex items-center gap-1">
                查看全部 <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {todayItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">暂无工作项，请先导入或创建</div>
              ) : (
                todayItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    <div
                      className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                        item.urgency === 'high' ? 'bg-red-500' :
                        item.urgency === 'medium' ? 'bg-yellow-500' :
                        item.urgency === 'low' ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[item.status]}`}>
                          {statusLabels[item.status]}
                        </span>
                        {item.category && (
                          <span className="text-xs text-gray-500">
                            {item.category.icon} {item.category.name}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-medium text-gray-800">{item.title}</h4>
                      {item.due_date && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          <span>截止: {item.due_date}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">优先级</div>
                      <div className="text-lg font-bold text-cyan-600">{item.priority_score.toFixed(1)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <h3 className="font-medium text-gray-800 flex items-center gap-2 mb-4">
              <PieChart className="w-5 h-5 text-purple-500" />
              工作类别分布
            </h3>
            <div className="space-y-3">
              {stats?.categories.map((cat) => {
                const maxCount = Math.max(...stats.categories.map((c) => c.count), 1);
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
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: cat.color || '#6B7280',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
              {stats?.categories.length === 0 && (
                <div className="text-center py-4 text-gray-500 text-sm">暂无数据</div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {dailyPlan && (
        <Card className="bg-gradient-to-r from-cyan-50 to-purple-50">
          <div className="p-4">
            <h3 className="font-medium text-gray-800 flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-purple-500" />
              AI每日规划
            </h3>
            {dailyPlan.ai_suggestions && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">💡 AI建议</h4>
                <p className="text-sm text-gray-600 whitespace-pre-line">{dailyPlan.ai_suggestions}</p>
              </div>
            )}
            {dailyPlan.summary && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">📊 今日摘要</h4>
                <p className="text-sm text-gray-600">{dailyPlan.summary}</p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
