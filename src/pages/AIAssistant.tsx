import { useState } from 'react';
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
} from 'lucide-react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { aiAPI } from '@/services/api';
import type { Task, Project } from '@/types';

const mockTasks: Task[] = [
  { id: 1, project_id: 1, title: '完成EAP系统API接口设计', description: '', status: 'pending', priority: 'high', due_date: '2026-07-15', created_at: '2026-07-10', updated_at: '2026-07-10' },
  { id: 2, project_id: 1, title: '编写数据库迁移脚本', description: '', status: 'in_progress', priority: 'medium', due_date: '2026-07-18', created_at: '2026-07-08', updated_at: '2026-07-12' },
  { id: 3, project_id: 2, title: '优化Litho驱动性能', description: '', status: 'pending', priority: 'critical', due_date: '2026-07-20', created_at: '2026-07-11', updated_at: '2026-07-11' },
  { id: 4, project_id: 3, title: 'CMP设备接口开发', description: '', status: 'pending', priority: 'medium', due_date: '2026-07-25', created_at: '2026-07-05', updated_at: '2026-07-05' },
];

const mockProjects: Project[] = [
  { id: 1, name: 'EAP系统升级v2.0', description: '', status: 'active', start_date: '2026-01-15', end_date: '2026-06-30', progress: 75, created_at: '2026-01-15', updated_at: '2026-07-13' },
  { id: 2, name: 'Litho机台驱动优化', description: '', status: 'active', start_date: '2026-03-01', end_date: '2026-08-31', progress: 45, created_at: '2026-03-01', updated_at: '2026-07-13' },
];

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  suggestions?: string[];
  timestamp: Date;
}

export default function AIAssistant() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: '您好！我是您的AI工作规划助手。我可以帮助您：\n\n1. 规划工作任务和优先级\n2. 分析项目进度并给出建议\n3. 生成周报内容\n\n请告诉我您的工作内容，我来帮您规划！',
      timestamp: new Date(),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'plan' | 'optimize'>('chat');
  const [aiPlan, setAiPlan] = useState<string>('');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await aiAPI.plan({
        input,
        tasks: mockTasks,
        projects: mockProjects,
      });

      if (res.success) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: res.data.plan,
          suggestions: res.data.suggestions,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
        setAiPlan(res.data.plan);
        setAiSuggestions(res.data.suggestions);
      } else {
        const mockResponse: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: `根据您的输入，我为您生成了以下工作规划：\n\n1. 分析当前任务优先级\n2. 建议优先处理紧急任务\n3. 合理分配时间资源\n\n建议：${input}`,
          suggestions: ['优先处理高优先级任务', '合理安排时间', '定期回顾进度'],
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, mockResponse]);
        setAiPlan(mockResponse.content);
        setAiSuggestions(mockResponse.suggestions || []);
      }
    } catch {
      const mockResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `根据您的输入，我为您生成了以下工作规划：\n\n1. 分析当前任务优先级\n2. 建议优先处理紧急任务\n3. 合理分配时间资源\n\n建议：${input}`,
        suggestions: ['优先处理高优先级任务', '合理安排时间', '定期回顾进度'],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, mockResponse]);
      setAiPlan(mockResponse.content);
      setAiSuggestions(mockResponse.suggestions || []);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePlan = async () => {
    setLoading(true);
    try {
      const res = await aiAPI.plan({
        input: '帮我规划本周的工作任务',
        tasks: mockTasks,
        projects: mockProjects,
      });
      if (res.success) {
        setAiPlan(res.data.plan);
        setAiSuggestions(res.data.suggestions);
      }
    } catch {
      setAiPlan(`本周工作规划建议：\n\n1. 优先处理紧急任务：优化Litho驱动性能（截止日期：2026-07-20）\n2. 继续进行中任务：编写数据库迁移脚本\n3. 计划新任务：完成EAP系统API接口设计\n\n时间分配建议：\n- 周一至周二：Litho驱动优化\n- 周三至周四：数据库迁移\n- 周五：API接口设计\n\n项目进度提醒：\n- EAP系统升级：75%完成，预计下周完成\n- Litho机台驱动优化：45%完成，进度偏慢`);
      setAiSuggestions([
        '建议每天上午优先处理高优先级任务',
        '定期检查项目进度，及时调整计划',
        '注意CMP设备接口开发的时间安排',
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleOptimizeTasks = async () => {
    setLoading(true);
    try {
      const res = await aiAPI.optimize({ tasks: mockTasks });
      if (res.success) {
        console.log('Optimized tasks:', res.data);
      }
    } catch {
      console.log('Optimization complete');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'chat', label: '智能对话', icon: Bot },
    { id: 'plan', label: '工作规划', icon: TrendingUp },
    { id: 'optimize', label: '任务优化', icon: Sparkles },
  ] as const;

  return (
    <div className="animate-fade-in h-full">
      <div className="p-6">
        <Card className="h-[calc(100vh-200px)] flex flex-col">
          <div className="flex border-b border-dark-700 mb-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-cyan-400 border-b-2 border-cyan-500'
                      : 'text-dark-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto">
            {activeTab === 'chat' && (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.type === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.type === 'user'
                          ? 'bg-cyan-500/20'
                          : 'bg-gradient-to-br from-cyan-500 to-primary-600'
                      }`}
                    >
                      {message.type === 'user' ? (
                        <span className="text-cyan-400 font-bold">用户</span>
                      ) : (
                        <Bot className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div
                      className={`max-w-[70%] ${
                        message.type === 'user' ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div
                        className={`p-4 rounded-xl ${
                          message.type === 'user'
                            ? 'bg-cyan-500/10 border border-cyan-500/30 rounded-tr-none'
                            : 'bg-dark-700/50 rounded-tl-none'
                        }`}
                      >
                        <p className="text-sm text-dark-200 whitespace-pre-wrap">{message.content}</p>
                        {message.suggestions && message.suggestions.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <p className="text-xs text-cyan-400 font-medium flex items-center gap-1">
                              <Lightbulb className="w-3 h-3" />
                              建议：
                            </p>
                            {message.suggestions.map((suggestion, index) => (
                              <p key={index} className="text-xs text-dark-300 flex items-start gap-2">
                                <CheckCircle2 className="w-3 h-3 text-success flex-shrink-0 mt-0.5" />
                                {suggestion}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-dark-500 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-primary-600 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div className="bg-dark-700/50 rounded-xl p-4 rounded-tl-none">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-dark-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-dark-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-dark-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'plan' && (
              <div className="space-y-4">
                {aiPlan ? (
                  <div className="bg-dark-700/50 rounded-xl p-4">
                    <p className="text-sm text-dark-200 whitespace-pre-wrap">{aiPlan}</p>
                    {aiSuggestions.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-xs text-cyan-400 font-medium flex items-center gap-1">
                          <Lightbulb className="w-3 h-3" />
                          AI建议：
                        </p>
                        {aiSuggestions.map((suggestion, index) => (
                          <p key={index} className="text-xs text-dark-300 flex items-start gap-2">
                            <CheckCircle2 className="w-3 h-3 text-success flex-shrink-0 mt-0.5" />
                            {suggestion}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Sparkles className="w-16 h-16 text-dark-600 mb-4" />
                    <p className="text-dark-400 mb-2">点击下方按钮生成工作规划</p>
                    <p className="text-sm text-dark-500">AI将根据您的任务和项目进行智能分析</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'optimize' && (
              <div className="space-y-4">
                <Card title="当前任务列表">
                  <div className="space-y-3">
                    {mockTasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 bg-dark-700/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className={`w-2 h-2 rounded-full ${
                            task.priority === 'critical' ? 'bg-error' : 
                            task.priority === 'high' ? 'bg-warning' : 
                            task.priority === 'medium' ? 'bg-primary-500' : 'bg-dark-400'
                          }`} />
                          <div>
                            <p className="text-sm text-white">{task.title}</p>
                            <p className="text-xs text-dark-500">截止日期: {task.due_date}</p>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          task.status === 'pending' ? 'bg-dark-600 text-dark-300' :
                          task.status === 'in_progress' ? 'bg-warning/20 text-warning' :
                          'bg-success/20 text-success'
                        }`}>
                          {task.status === 'pending' ? '待处理' : task.status === 'in_progress' ? '进行中' : '已完成'}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
                  <p className="text-sm text-cyan-400 mb-2">AI优化建议</p>
                  <ul className="space-y-2 text-sm text-dark-300">
                    <li className="flex items-start gap-2">
                      <TrendingUp className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <span>优先处理紧急任务：优化Litho驱动性能</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-primary-400 flex-shrink-0 mt-0.5" />
                      <span>合理分配时间，避免任务积压</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                      <span>建议每天结束时更新任务状态</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-dark-700 pt-4 mt-4">
            {activeTab === 'chat' && (
              <div className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  className="flex-1 px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:border-cyan-500"
                  placeholder="输入您的工作内容，让AI帮您规划..."
                />
                <Button onClick={handleSend} disabled={!input.trim() || loading}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            )}
            {activeTab === 'plan' && (
              <Button onClick={handleGeneratePlan} loading={loading} className="w-full">
                <Sparkles className="w-4 h-4" />
                生成工作规划
              </Button>
            )}
            {activeTab === 'optimize' && (
              <Button onClick={handleOptimizeTasks} loading={loading} className="w-full">
                <RefreshCw className="w-4 h-4" />
                优化任务优先级
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}