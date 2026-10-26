import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Bot,
  Database,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Key,
  Globe,
  SlidersHorizontal,
  Users,
  User,
} from 'lucide-react';
import Button from '@/components/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/Toast';
import UserManagement from '@/pages/Users';
import Profile from '@/pages/Profile';
import { settingsAPI } from '@/services/api';
import type { AISettings, NotesSettings } from '@/types';

const inputCls =
  'w-full rounded-lg border border-gray-300 bg-gray-50 px-3.5 py-2 text-sm text-gray-800 placeholder-gray-400 transition-colors focus:border-accent-500 focus:bg-white focus:outline-none';
const labelCls = 'mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700';
const hintCls = 'mt-1 text-xs text-gray-400';

type Tab = 'general' | 'ai' | 'notes' | 'members' | 'account';

export default function SystemSettings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const t = searchParams.get('tab');
    return t === 'ai' || t === 'notes' || t === 'members' || t === 'account' ? t : 'general';
  });

  // SPA 内导航改变 ?tab= 时组件不会重挂载，必须显式跟随 URL
  useEffect(() => {
    const t = searchParams.get('tab');
    if (t === 'ai' || t === 'notes' || t === 'members' || t === 'account') {
      setActiveTab((prev) => (prev === t ? prev : t));
    }
  }, [searchParams]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    reply?: string;
    model?: string;
    elapsed?: number;
  } | null>(null);

  const [aiSettings, setAiSettings] = useState<AISettings>({
    openai_api_key: '',
    openai_api_base: 'https://api.openai.com/v1',
    ai_model: 'gpt-4o-mini',
  });

  const [notesSettings, setNotesSettings] = useState<NotesSettings>({
    notes_server_url: '',
    notes_user: '',
    notes_password: '',
  });

  const [generalSettings, setGeneralSettings] = useState({
    system_name: 'CIM Work Manager',
  });

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'ai') {
        const res = await settingsAPI.getAISettings();
        if (res.success) setAiSettings(res.data);
      } else if (activeTab === 'notes') {
        const res = await settingsAPI.getNotesSettings();
        if (res.success) setNotesSettings(res.data);
      } else {
        const res = await settingsAPI.get('system_name');
        if (res.success && res.data) setGeneralSettings({ system_name: res.data.value });
      }
    } catch {
      toast.error('设置加载失败，请检查后端服务');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    setTestResult(null);
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (activeTab === 'ai') {
        const res = await settingsAPI.saveAISettings(aiSettings);
        if (res.success) toast.success('AI 配置已保存');
        else toast.error(res.message || '保存失败');
      } else if (activeTab === 'notes') {
        const res = await settingsAPI.saveNotesSettings(notesSettings);
        if (res.success) toast.success('Notes 配置已保存');
        else toast.error(res.message || '保存失败');
      } else {
        const res = await settingsAPI.update('system_name', generalSettings.system_name, '系统名称', 'general');
        if (res.success) toast.success('通用设置已保存');
        else toast.error(res.message || '保存失败');
      }
    } catch {
      toast.error('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await settingsAPI.testAIConnection();
      if (res.success && res.data) {
        setTestResult({
          success: res.data.success,
          message: res.data.message,
          reply: res.data.reply,
          model: res.data.model,
          elapsed: res.data.elapsed,
        });
      } else {
        setTestResult({ success: false, message: res.message || '测试请求失败，请检查后端服务是否运行' });
      }
    } catch (err) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        (err as Error)?.message ||
        '测试请求异常，请检查后端服务和网络';
      setTestResult({ success: false, message: detail });
    } finally {
      setTesting(false);
    }
  };

  const tabs: { id: Tab; label: string; description: string; icon: typeof Bot }[] = [
    { id: 'general', label: '通用', description: '系统基础信息', icon: SlidersHorizontal },
    { id: 'ai', label: 'AI 配置', description: '大模型 API 连接', icon: Bot },
    { id: 'notes', label: 'Notes', description: 'HCL Notes 文档同步', icon: Database },
    { id: 'members', label: '成员', description: '用户与权限管理', icon: Users },
    { id: 'account', label: '账户', description: '个人资料与 Notes 同步', icon: User },
  ];

  const currentTab = tabs.find((t) => t.id === activeTab)!;

  const switchTab = (tab: Tab) => {
    setActiveTab(tab);
    setSearchParams(tab === 'general' ? {} : { tab }, { replace: true });
  };

  return (
    <div className="animate-fade-in flex gap-8">
      {/* 左侧分区导航 */}
      <nav className="w-52 flex-shrink-0">
        <p className="mb-2 px-3 text-[10px] font-medium uppercase tracking-wider text-gray-400">设置</p>
        <ul className="space-y-0.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <li key={tab.id}>
                <button
                  onClick={() => switchTab(tab.id)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    active
                      ? 'bg-gray-100 font-medium text-gray-900'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? 'text-accent-600' : 'text-gray-400'}`} />
                  {tab.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* 右侧内容 */}
      <div className="min-w-0 flex-1">
        {activeTab === 'members' ? (
          <UserManagement />
        ) : activeTab === 'account' ? (
          <Profile />
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900">{currentTab.label}</h2>
                <p className="mt-0.5 text-xs text-gray-400">{currentTab.description}</p>
              </div>
              <Button onClick={handleSave} loading={saving} size="sm">
                <Save className="h-4 w-4" /> 保存
              </Button>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              {loading ? (
            <div className="space-y-4 p-6">
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-1/2" />
            </div>
          ) : activeTab === 'general' ? (
            <div className="space-y-5 p-6">
              <div className="max-w-md">
                <label className={labelCls}>
                  <Globe className="h-4 w-4 text-gray-400" /> 系统名称
                </label>
                <input
                  type="text"
                  value={generalSettings.system_name}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, system_name: e.target.value })}
                  className={inputCls}
                  placeholder="请输入系统名称"
                />
                <p className={hintCls}>显示在浏览器标题和侧栏顶部</p>
              </div>
            </div>
          ) : activeTab === 'ai' ? (
            <div className="space-y-5 p-6">
              <div className="max-w-md">
                <label className={labelCls}>
                  <Key className="h-4 w-4 text-gray-400" /> API Key
                </label>
                <input
                  type="password"
                  value={aiSettings.openai_api_key}
                  onChange={(e) => setAiSettings({ ...aiSettings, openai_api_key: e.target.value })}
                  className={inputCls}
                  placeholder="请输入 API Key"
                />
                <p className={hintCls}>用于访问大模型 API 的密钥，仅保存在本地后端</p>
              </div>
              <div className="max-w-md">
                <label className={labelCls}>
                  <Globe className="h-4 w-4 text-gray-400" /> API Base URL
                </label>
                <input
                  type="text"
                  value={aiSettings.openai_api_base}
                  onChange={(e) => setAiSettings({ ...aiSettings, openai_api_base: e.target.value })}
                  className={inputCls}
                  placeholder="https://api.openai.com/v1"
                />
                <p className={hintCls}>支持 OpenAI 兼容的 API 服务</p>
              </div>
              <div className="max-w-md">
                <label className={labelCls}>
                  <Bot className="h-4 w-4 text-gray-400" /> 模型名称
                </label>
                <input
                  type="text"
                  value={aiSettings.ai_model}
                  onChange={(e) => setAiSettings({ ...aiSettings, ai_model: e.target.value })}
                  className={inputCls}
                  placeholder="gpt-4o-mini"
                />
              </div>
              <div className="border-t border-gray-100 pt-4">
                <Button variant="secondary" size="sm" onClick={handleTestConnection} loading={testing}>
                  <RefreshCw className="h-4 w-4" />
                  {testing ? '测试中...' : '测试连接'}
                </Button>
                {testResult && (
                  <div
                    className={`mt-3 max-w-md rounded-lg border p-3 text-sm ${
                      testResult.success
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-red-200 bg-red-50 text-red-700'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {testResult.success ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
                      ) : (
                        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{testResult.success ? '连接成功' : '连接失败'}</p>
                        <p className="mt-1 break-words text-xs">{testResult.message}</p>
                        {testResult.reply && <p className="mt-1 text-xs text-gray-500">模型回复: {testResult.reply}</p>}
                        {testResult.model && (
                          <p className="mt-0.5 text-xs text-gray-400">
                            模型: {testResult.model}
                            {testResult.elapsed ? ` · 耗时 ${testResult.elapsed}s` : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-5 p-6">
              <div className="max-w-md">
                <label className={labelCls}>
                  <Globe className="h-4 w-4 text-gray-400" /> Notes 服务器 URL
                </label>
                <input
                  type="text"
                  value={notesSettings.notes_server_url}
                  onChange={(e) => setNotesSettings({ ...notesSettings, notes_server_url: e.target.value })}
                  className={inputCls}
                  placeholder="http://your-notes-server"
                />
                <p className={hintCls}>HCL Notes 服务器的 API 地址</p>
              </div>
              <div className="grid max-w-md grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>用户名</label>
                  <input
                    type="text"
                    value={notesSettings.notes_user}
                    onChange={(e) => setNotesSettings({ ...notesSettings, notes_user: e.target.value })}
                    className={inputCls}
                    placeholder="Notes 用户名"
                  />
                </div>
                <div>
                  <label className={labelCls}>密码</label>
                  <input
                    type="password"
                    value={notesSettings.notes_password}
                    onChange={(e) => setNotesSettings({ ...notesSettings, notes_password: e.target.value })}
                    className={inputCls}
                    placeholder="Notes 密码"
                  />
                </div>
              </div>
              <p className={hintCls}>保存后可在「设置 → 账户」页执行文档同步与导入</p>
            </div>
          )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
