import { useState, useEffect } from 'react';
import {
  Settings,
  Bot,
  Database,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Key,
  Globe,
} from 'lucide-react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { settingsAPI } from '@/services/api';
import type { AISettings, NotesSettings } from '@/types';

export default function SystemSettings() {
  const [activeTab, setActiveTab] = useState<'ai' | 'notes' | 'general'>('ai');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  // AI 连接测试状态
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; reply?: string; model?: string; elapsed?: number } | null>(null);

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

  useEffect(() => {
    fetchSettings();
  }, [activeTab]);

  const fetchSettings = async () => {
    try {
      if (activeTab === 'ai') {
        const res = await settingsAPI.getAISettings();
        if (res.success) {
          setAiSettings(res.data);
        }
      } else if (activeTab === 'notes') {
        const res = await settingsAPI.getNotesSettings();
        if (res.success) {
          setNotesSettings(res.data);
        }
      } else if (activeTab === 'general') {
        const res = await settingsAPI.get('system_name');
        if (res.success && res.data) {
          setGeneralSettings({ system_name: res.data.value });
        }
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      if (activeTab === 'ai') {
        await settingsAPI.saveAISettings(aiSettings);
      } else if (activeTab === 'notes') {
        await settingsAPI.saveNotesSettings(notesSettings);
      } else if (activeTab === 'general') {
        await settingsAPI.update('system_name', generalSettings.system_name, '系统名称', 'general');
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      alert('保存失败，请重试');
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
        setTestResult({
          success: false,
          message: res.message || '测试请求失败，请检查后端服务是否运行',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.response?.data?.detail || err?.message || '测试请求异常，请检查后端服务和网络',
      });
    } finally {
      setTesting(false);
    }
  };

  const tabs = [
    { id: 'general', label: '通用设置', icon: Settings },
    { id: 'ai', label: 'AI配置', icon: Bot },
    { id: 'notes', label: 'Notes配置', icon: Database },
  ] as const;

  return (
    <div className="animate-fade-in p-6">
      <Card className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center">
              <Settings className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">系统设置</h2>
              <p className="text-sm text-gray-500">配置系统参数和集成选项</p>
            </div>
          </div>
          <Button onClick={handleSave} loading={saving}>
            {saveSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                已保存
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                保存设置
              </>
            )}
          </Button>
        </div>
      </Card>

      <div className="flex gap-6">
        <div className="w-56 flex-shrink-0">
          <Card>
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-600 font-medium'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </Card>
        </div>

        <div className="flex-1">
          {activeTab === 'general' && (
            <Card>
              <h3 className="text-lg font-semibold text-gray-800 mb-6">通用设置</h3>
              <div className="space-y-6 max-w-xl">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Globe className="w-4 h-4 inline mr-2" />
                    系统名称
                  </label>
                  <input
                    type="text"
                    value={generalSettings.system_name}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, system_name: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-cyan-500"
                    placeholder="请输入系统名称"
                  />
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'ai' && (
            <Card>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">AI大模型配置</h3>
              <p className="text-sm text-gray-500 mb-6">配置AI助手使用的大模型API连接信息</p>
              
              <div className="space-y-6 max-w-xl">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Key className="w-4 h-4 inline mr-2" />
                    API Key
                  </label>
                  <input
                    type="password"
                    value={aiSettings.openai_api_key}
                    onChange={(e) => setAiSettings({ ...aiSettings, openai_api_key: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-cyan-500"
                    placeholder="请输入API Key"
                  />
                  <p className="text-xs text-gray-400 mt-1">用于访问大模型API的密钥</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Globe className="w-4 h-4 inline mr-2" />
                    API Base URL
                  </label>
                  <input
                    type="text"
                    value={aiSettings.openai_api_base}
                    onChange={(e) => setAiSettings({ ...aiSettings, openai_api_base: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-cyan-500"
                    placeholder="https://api.openai.com/v1"
                  />
                  <p className="text-xs text-gray-400 mt-1">API基础地址，支持OpenAI兼容的API服务</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Bot className="w-4 h-4 inline mr-2" />
                    模型名称
                  </label>
                  <input
                    type="text"
                    value={aiSettings.ai_model}
                    onChange={(e) => setAiSettings({ ...aiSettings, ai_model: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-cyan-500"
                    placeholder="gpt-4o-mini"
                  />
                  <p className="text-xs text-gray-400 mt-1">使用的大模型名称</p>
                </div>

                <div className="pt-4">
                  <Button variant="secondary" onClick={handleTestConnection} loading={testing}>
                    <RefreshCw className="w-4 h-4" />
                    {testing ? '测试中...' : '测试连接'}
                  </Button>
                  {testResult && (
                    <div className={`mt-3 p-3 rounded-lg border text-sm ${
                      testResult.success
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : 'bg-red-50 border-red-200 text-red-700'
                    }`}>
                      <div className="flex items-start gap-2">
                        {testResult.success ? (
                          <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{testResult.success ? '连接成功' : '连接失败'}</p>
                          <p className="text-xs mt-1 break-words">{testResult.message}</p>
                          {testResult.reply && (
                            <p className="text-xs mt-1 text-gray-500">模型回复: {testResult.reply}</p>
                          )}
                          {testResult.model && (
                            <p className="text-xs mt-0.5 text-gray-400">模型: {testResult.model}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'notes' && (
            <Card>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">HCL Notes配置</h3>
              <p className="text-sm text-gray-500 mb-6">配置HCL Notes文档同步连接信息</p>
              
              <div className="space-y-6 max-w-xl">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Globe className="w-4 h-4 inline mr-2" />
                    Notes服务器URL
                  </label>
                  <input
                    type="text"
                    value={notesSettings.notes_server_url}
                    onChange={(e) => setNotesSettings({ ...notesSettings, notes_server_url: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-cyan-500"
                    placeholder="http://your-notes-server"
                  />
                  <p className="text-xs text-gray-400 mt-1">HCL Notes服务器的API地址</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      用户名
                    </label>
                    <input
                      type="text"
                      value={notesSettings.notes_user}
                      onChange={(e) => setNotesSettings({ ...notesSettings, notes_user: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-cyan-500"
                      placeholder="Notes用户名"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      密码
                    </label>
                    <input
                      type="password"
                      value={notesSettings.notes_password}
                      onChange={(e) => setNotesSettings({ ...notesSettings, notes_password: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-cyan-500"
                      placeholder="Notes密码"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <Button variant="secondary" onClick={handleTestConnection}>
                    <RefreshCw className="w-4 h-4" />
                    测试连接
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
