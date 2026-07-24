import { useState, useEffect } from 'react';
import {
  Bot,
  Send,
  Lightbulb,
  Sparkles,
  Clock,
  CheckCircle2,
  RefreshCw,
  FileText,
  TrendingUp,
  Calendar,
  AlertTriangle,
  ArrowUpDown,
  Sun,
  Bell,
  Loader2,
} from 'lucide-react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { aiAPI, workItemsAPI } from '@/services/api';
import type { WorkItem } from '@/types';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  suggestions?: string[];
  timestamp: Date;
}

export default function AIAssistant() {
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'standup' | 'plan' | 'sort' | 'reminders' | 'chat'>('standup');

  const [standupData, setStandupData] = useState<any>(null);
  const [aiPlan, setAiPlan] = useState<string>('');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [sortedItems, setSortedItems] = useState<WorkItem[]>([]);
  const [sortStrategy, setSortStrategy] = useState('priority');
  const [sortExplanation, setSortExplanation] = useState('');
  const [reminderData, setReminderData] = useState<any>(null);

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: '您好！我是您的AI工作规划助手。我可以帮助您：\n\n1. 生成每日站会简报\n2. 智能排序工作任务\n3. 检查逾期提醒\n4. 规划工作优先级\n\n请选择上方功能开始使用！',
      timestamp: new Date(),
    },
  ]);

  useEffect(() => {
    fetchWorkItems();
  }, []);

  const fetchWorkItems = async () => {
    try {
      const res = await workItemsAPI.list({ sort_by: 'priority_score', limit: 200 });
      if (res.success) {
        setWorkItems(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch work items:', err);
    }
  };

  const handleDailyStandup = async () => {
    setLoading(true);
    try {
      const res = await aiAPI.dailyStandup({ work_items: workItems });
      if (res.success) {
        setStandupData(res.data);
      }
    } catch (err) {
      console.error('Daily standup error:', err);
      alert('生成失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSmartSort = async () => {
    setLoading(true);
    try {
      const res = await aiAPI.smartSort({ work_items: workItems, strategy: sortStrategy });
      if (res.success) {
        setSortedItems(res.data.sorted_items);
        setSortExplanation(res.data.explanation);
      }
    } catch (err) {
      console.error('Smart sort error:', err);
      alert('排序失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckReminders = async () => {
    setLoading(true);
    try {
      const res = await aiAPI.checkReminders({ work_items: workItems });
      if (res.success) {
        setReminderData(res.data);
      }
    } catch (err) {
      console.error('Check reminders error:', err);
      alert('检查失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePlan = async () => {
    setLoading(true);
    try {
      const res = await aiAPI.plan({
        input: '帮我规划工作任务的优先级和安排',
        tasks: workItems.map(w => ({ id: w.id, title: w.title, status: w.status, priority: w.priority_score > 7 ? 'high' : 'medium' })),
      });
      if (res.success) {
        setAiPlan(res.data.plan);
        setAiSuggestions(res.data.suggestions);
      }
    } catch (err) {
      console.error('Generate plan error:', err);
      alert('规划失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async () => {
    if (!input.trim()) return;
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await aiAPI.plan({
        input: userMessage.content,
        tasks: workItems.map(w => ({ id: w.id, title: w.title, status: w.status })),
      });
      if (res.success) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: res.data.plan,
          suggestions: res.data.suggestions,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `收到您的需求。当前系统中有 ${workItems.length} 个工作项，我可以帮您进行优先级分析、日程规划等。请问您需要我帮您做什么？`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (score: number) => {
    if (score >= 8) return 'bg-red-500';
    if (score >= 5) return 'bg-yellow-500';
    if (score >= 3) return 'bg-blue-500';
    return 'bg-gray-400';
  };

  const tabs = [
    { id: 'standup' as const, label: '每日站会', icon: Sun },
    { id: 'sort' as const, label: '智能排序', icon: ArrowUpDown },
    { id: 'reminders' as const, label: '提醒检查', icon: Bell },
    { id: 'plan' as const, label: '工作规划', icon: TrendingUp },
    { id: 'chat' as const, label: 'AI对话', icon: Bot },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bot className="w-6 h-6 text-cyan-600" />
            AI规划助手
          </h1>
          <p className="text-sm text-gray-500 mt-1">AI驱动的智能工作规划与提醒</p>
        </div>
        <div className="text-sm text-gray-500">
          当前工作项: <span className="font-medium text-cyan-600">{workItems.length}</span> 个
        </div>
      </div>

      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-cyan-600 border-b-2 border-cyan-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'standup' && (
        <div className="space-y-4">
          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-800 flex items-center gap-2">
                  <Sun className="w-5 h-5 text-orange-500" />
                  每日站会
                </h3>
                <Button onClick={handleDailyStandup} loading={loading}>
                  <Sparkles className="w-4 h-4" />
                  生成今日简报
                </Button>
              </div>

              {!standupData && !loading && (
                <div className="text-center py-8 text-gray-500">
                  <Sun className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p>点击按钮生成今日工作简报</p>
                </div>
              )}

              {standupData && (
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">{standupData.summary}</pre>
                  </div>

                  {standupData.today_tasks.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        今日待办 ({standupData.today_tasks.length})
                      </h4>
                      <div className="space-y-2">
                        {standupData.today_tasks.map((task: any) => (
                          <div key={task.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                            <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority_score || 0)}`} />
                            <span className="text-sm text-gray-700">{task.title}</span>
                            <span className="text-xs text-gray-400 ml-auto">优先级 {task.priority_score?.toFixed(1) || 0}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {standupData.overdue_tasks.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-red-700 mb-2 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        逾期任务 ({standupData.overdue_tasks.length})
                      </h4>
                      <div className="space-y-2">
                        {standupData.overdue_tasks.map((task: any) => (
                          <div key={task.id} className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                            <span className="text-sm text-red-700">{task.title}</span>
                            <span className="text-xs text-red-400 ml-auto">截止: {task.due_date}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'sort' && (
        <div className="space-y-4">
          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-800 flex items-center gap-2">
                  <ArrowUpDown className="w-5 h-5 text-blue-500" />
                  智能排序
                </h3>
                <div className="flex items-center gap-2">
                  <select
                    value={sortStrategy}
                    onChange={(e) => setSortStrategy(e.target.value)}
                    className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="priority">按优先级</option>
                    <option value="deadline">按截止日期</option>
                    <option value="category">按类别</option>
                  </select>
                  <Button onClick={handleSmartSort} loading={loading}>
                    <RefreshCw className="w-4 h-4" />
                    重新排序
                  </Button>
                </div>
              </div>

              {sortExplanation && (
                <p className="text-sm text-gray-500 mb-4 bg-blue-50 p-2 rounded-lg">
                  <Lightbulb className="w-4 h-4 inline mr-1 text-blue-500" />
                  {sortExplanation}
                </p>
              )}

              <div className="space-y-2">
                {(sortedItems.length > 0 ? sortedItems : workItems).map((item, index) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-400 w-6">{index + 1}</span>
                    <div className={`w-2 h-2 rounded-full ${getPriorityColor(item.priority_score)}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-800">{item.title}</span>
                        {item.category && (
                          <span className="text-xs text-gray-500">{item.category.icon} {item.category.name}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <span>优先级: {item.priority_score.toFixed(1)}</span>
                        {item.due_date && <span>截止: {item.due_date}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'reminders' && (
        <div className="space-y-4">
          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-800 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-red-500" />
                  提醒检查
                </h3>
                <Button onClick={handleCheckReminders} loading={loading}>
                  <RefreshCw className="w-4 h-4" />
                  检查提醒
                </Button>
              </div>

              {reminderData && (
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg ${
                    reminderData.overdue_count > 0 || reminderData.high_priority_count > 0
                      ? 'bg-red-50 border border-red-200'
                      : 'bg-green-50 border border-green-200'
                  }`}>
                    <p className={`text-sm font-medium ${
                      reminderData.overdue_count > 0 || reminderData.high_priority_count > 0
                        ? 'text-red-700'
                        : 'text-green-700'
                    }`}>
                      {reminderData.message}
                    </p>
                  </div>

                  {reminderData.reminders.length > 0 && (
                    <div className="space-y-2">
                      {reminderData.reminders.map((reminder: any, idx: number) => (
                        <div key={idx} className={`flex items-center gap-3 p-3 rounded-lg ${
                          reminder.type === 'overdue' ? 'bg-red-50' : 'bg-yellow-50'
                        }`}>
                          {reminder.type === 'overdue' ? (
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                          ) : (
                            <Clock className="w-5 h-5 text-yellow-500" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm text-gray-800">{reminder.title}</p>
                            <p className="text-xs text-gray-500">{reminder.message}</p>
                          </div>
                          {reminder.priority_score && (
                            <span className="text-xs font-medium text-cyan-600">
                              优先级 {reminder.priority_score.toFixed(1)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!reminderData && !loading && (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p>点击按钮检查工作提醒</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'plan' && (
        <div className="space-y-4">
          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-800 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-cyan-500" />
                  工作规划
                </h3>
                <Button onClick={handleGeneratePlan} loading={loading}>
                  <Sparkles className="w-4 h-4" />
                  生成规划
                </Button>
              </div>

              {aiPlan && (
                <div className="space-y-4">
                  <div className="p-4 bg-cyan-50 rounded-lg">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">{aiPlan}</pre>
                  </div>
                  {aiSuggestions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                        <Lightbulb className="w-4 h-4 text-cyan-500" />
                        AI建议
                      </h4>
                      <div className="space-y-2">
                        {aiSuggestions.map((s, i) => (
                          <div key={i} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-700">{s}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!aiPlan && !loading && (
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p>点击按钮生成工作规划建议</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'chat' && (
        <Card className="h-[calc(100vh-300px)] flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.type === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.type === 'user'
                      ? 'bg-cyan-100'
                      : 'bg-gradient-to-br from-cyan-500 to-blue-600'
                  }`}
                >
                  {message.type === 'user' ? (
                    <span className="text-cyan-700 text-xs font-bold">我</span>
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className={`max-w-[70%] ${message.type === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`p-3 rounded-xl ${
                      message.type === 'user'
                        ? 'bg-cyan-100 text-cyan-800 rounded-tr-none'
                        : 'bg-gray-100 text-gray-800 rounded-tl-none'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    {message.suggestions && message.suggestions.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {message.suggestions.map((suggestion, index) => (
                          <p key={index} className="text-xs flex items-start gap-1">
                            <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                            {suggestion}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-100 rounded-xl p-3 rounded-tl-none">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                </div>
              </div>
            )}
          </div>
          <div className="border-t border-gray-200 p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleChat()}
                className="flex-1 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:border-cyan-500"
                placeholder="输入您的问题..."
              />
              <Button onClick={handleChat} disabled={!input.trim() || loading}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
