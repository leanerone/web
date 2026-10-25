import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Shield,
  Settings,
  Globe,
  FileDown,
  RefreshCw,
  ExternalLink,
  LogOut,
  Monitor,
  Save,
} from 'lucide-react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { useAuthStore } from '@/stores/authStore';
import { notesAPI, settingsAPI } from '@/services/api';
import type { NotesDocument, NotesSettings } from '@/types';

const getRoleLabel = (role: string) => {
  const labels: Record<string, string> = {
    admin: '管理员',
    engineer: '工程师',
    user: '普通用户',
  };
  return labels[role] || role;
};

export default function Profile() {
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [notesDocs, setNotesDocs] = useState<NotesDocument[]>([]);
  const [notesSettings, setNotesSettings] = useState<NotesSettings>({
    notes_server_url: '',
    notes_user: '',
    notes_password: '',
  });
  const [notesUrlInput, setNotesUrlInput] = useState('');
  const [parsedNotesUrl, setParsedNotesUrl] = useState<{
    title: string;
    database: string;
    view: string;
    document: string;
    server: string;
  } | null>(null);
  const { user, logout, expiresAt } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotesDocs();
    fetchNotesSettings();
  }, []);

  const fetchNotesDocs = async () => {
    try {
      const res = await notesAPI.documents();
      if (res.success) {
        setNotesDocs(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch notes documents:', err);
    }
  };

  const fetchNotesSettings = async () => {
    try {
      const res = await settingsAPI.getNotesSettings();
      if (res.success) {
        setNotesSettings(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch notes settings:', err);
    }
  };

  const handleSaveNotesSettings = async () => {
    try {
      const res = await settingsAPI.saveNotesSettings(notesSettings);
      if (res.success) {
        alert('Notes配置已保存');
      }
    } catch (err) {
      console.error('Failed to save notes settings:', err);
      alert('保存失败，请重试');
    }
  };

  const handleSyncNotes = async () => {
    setSyncing(true);
    try {
      await handleSaveNotesSettings();
      const res = await notesAPI.sync();
      if (res.success) {
        await fetchNotesDocs();
        alert(`同步成功！已同步 ${res.data.synced_count} 个文档`);
      }
    } catch (err) {
      console.error('Failed to sync notes:', err);
      alert('同步失败，请检查配置');
    } finally {
      setSyncing(false);
    }
  };

  const handleParseNotesUrl = async () => {
    if (!notesUrlInput.trim()) {
      alert('请输入Notes URL');
      return;
    }
    try {
      const res = await notesAPI.parseUrl(notesUrlInput);
      if (res.success) {
        setParsedNotesUrl(res.data);
      }
    } catch (err) {
      console.error('Failed to parse notes URL:', err);
      alert('解析失败，请检查URL格式');
    }
  };

  const handleImportByUrl = async () => {
    if (!notesUrlInput.trim()) {
      alert('请输入Notes URL');
      return;
    }
    try {
      const res = await notesAPI.importByUrl(notesUrlInput);
      if (res.success) {
        await fetchNotesDocs();
        alert(`导入成功！已导入 ${res.data.length} 个文档`);
        setNotesUrlInput('');
        setParsedNotesUrl(null);
      }
    } catch (err) {
      console.error('Failed to import by URL:', err);
      alert('导入失败，请重试');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="animate-fade-in">
      <div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full brand-gradient flex items-center justify-center mb-4">
                <span className="text-3xl font-bold text-white">
                  {user?.display_name?.charAt(0).toUpperCase() || <User className="w-12 h-12 text-white" />}
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-800">{user?.display_name || '未登录'}</h2>
              <p className="text-sm text-gray-500">{user ? getRoleLabel(user.role) : '-'}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-3 py-1 bg-accent-50 text-accent-600 rounded-full text-xs font-medium">
                  {user?.team || '半导体CIM团队'}
                </span>
                <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-medium flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Windows认证
                </span>
              </div>
              <div className="mt-4 w-full pt-4 border-t border-gray-100 space-y-2 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>用户名：</span>
                  <span className="text-gray-800 font-medium">@{user?.username || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span>域：</span>
                  <span className="text-gray-800">{user?.domain || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span>登录时间：</span>
                  <span className="text-gray-800">{user?.login_at || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span>会话过期：</span>
                  <span className="text-gray-800">{expiresAt || '-'}</span>
                </div>
              </div>
              <Button variant="danger" size="sm" className="mt-4 w-full" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
                退出登录
              </Button>
            </div>
          </Card>

          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800">基本信息</h3>
              <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-medium flex items-center gap-1">
                <Shield className="w-3 h-3" />
                来自Windows域认证
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">邮箱</span>
                </div>
                <p className="text-gray-800">{user?.username ? `${user.username}（域账号登录，未配置邮箱）` : '-'}</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <User className="w-4 h-4" />
                  <span className="text-sm">用户名</span>
                </div>
                <p className="text-gray-800">{user?.username || '-'}</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm">显示名</span>
                </div>
                <p className="text-gray-800">{user?.display_name || '-'}</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm">角色</span>
                </div>
                <p className="text-gray-800">{user ? getRoleLabel(user.role) : '-'}</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <Settings className="w-4 h-4" />
                  <span className="text-sm">部门</span>
                </div>
                <p className="text-gray-800">{user?.department || '-'}</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <Settings className="w-4 h-4" />
                  <span className="text-sm">团队</span>
                </div>
                <p className="text-gray-800">{user?.team || '-'}</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <Globe className="w-4 h-4" />
                  <span className="text-sm">域</span>
                </div>
                <p className="text-gray-800">{user?.domain || '-'}</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <Monitor className="w-4 h-4" />
                  <span className="text-sm">计算机</span>
                </div>
                <p className="text-gray-800">{user?.computer || '-'}</p>
              </div>
            </div>
          </Card>

          <Card className="lg:col-span-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">HCL Notes 文档同步</h3>
              <Button onClick={() => setIsNotesModalOpen(true)}>
                <FileDown className="w-4 h-4" />
                导入文档
              </Button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 border-b border-gray-200">
                    <th className="pb-3 px-4">文档标题</th>
                    <th className="pb-3 px-4">同步日期</th>
                    <th className="pb-3 px-4">状态</th>
                    <th className="pb-3 px-4">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {notesDocs.map((doc) => (
                    <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <FileDown className="w-4 h-4 text-accent-600" />
                          <span className="text-gray-800">{doc.title}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-500">{doc.sync_at || '-'}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          doc.sync_at ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                        }`}>
                          {doc.sync_at ? '已同步' : '待同步'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {doc.url && (
                          <Button variant="ghost" size="sm" onClick={() => window.open(doc.url, '_blank')}>
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {notesDocs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-400">
                        暂无同步的文档
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

        </div>
      </div>

      <Modal 
        isOpen={isNotesModalOpen} 
        onClose={() => setIsNotesModalOpen(false)} 
        title="导入HCL Notes文档"
        size="xl"
      >
        <div className="space-y-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              此功能可以将HCL Notes中的工作文档同步到系统中，支持项目文档、需求文档、技术文档等类型。
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes服务器URL</label>
              <input
                type="text"
                value={notesSettings.notes_server_url}
                onChange={(e) => setNotesSettings({ ...notesSettings, notes_server_url: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-accent-500"
                placeholder="http://your-notes-server"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
                <input
                  type="text"
                  value={notesSettings.notes_user}
                  onChange={(e) => setNotesSettings({ ...notesSettings, notes_user: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-accent-500"
                  placeholder="Notes用户名"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
                <input
                  type="password"
                  value={notesSettings.notes_password}
                  onChange={(e) => setNotesSettings({ ...notesSettings, notes_password: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-accent-500"
                  placeholder="Notes密码"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">选择要同步的文档类型</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <input type="checkbox" defaultChecked className="rounded text-accent-600 focus:ring-accent-500" />
                <span className="text-sm text-gray-700">项目文档</span>
              </label>
              <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <input type="checkbox" defaultChecked className="rounded text-accent-600 focus:ring-accent-500" />
                <span className="text-sm text-gray-700">需求文档</span>
              </label>
              <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <input type="checkbox" className="rounded text-accent-600 focus:ring-accent-500" />
                <span className="text-sm text-gray-700">技术文档</span>
              </label>
              <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <input type="checkbox" className="rounded text-accent-600 focus:ring-accent-500" />
                <span className="text-sm text-gray-700">会议记录</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <Button variant="secondary" onClick={handleSaveNotesSettings}>
              <Save className="w-4 h-4" />
              保存配置
            </Button>
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => setIsNotesModalOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSyncNotes} loading={syncing}>
                <RefreshCw className="w-4 h-4" />
                开始同步
              </Button>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">通过Notes URL直接导入</h3>
            <p className="text-xs text-gray-500 mb-3">粘贴HCL Notes文档链接，系统将解析并导入文档信息</p>
            <textarea
              value={notesUrlInput}
              onChange={(e) => {
                setNotesUrlInput(e.target.value);
                setParsedNotesUrl(null);
              }}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-accent-500 font-mono text-sm"
              rows={6}
              placeholder="粘贴Notes URL，例如：&#10;MES ProjectDatabaseV2 - 【EAP Design Doc】2025080078...&#10;&lt;NDL&gt;&#10;&lt;REPLICA 4825766C:0028F9A0&gt;&#10;&lt;VIEW OFBC418B5D:6AFFDB0B-ON48257F47:000AD1B2&gt;&#10;&lt;NOTE OF9D767B94:10B9886C-ON48258CF2:0003E294&gt;&#10;&lt;/NDL&gt;"
            />
            <div className="flex items-center gap-3 mt-3">
              <Button variant="secondary" onClick={handleParseNotesUrl}>
                解析URL
              </Button>
              <Button onClick={handleImportByUrl}>
                导入文档
              </Button>
            </div>
            {parsedNotesUrl && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="text-sm font-medium text-green-800 mb-2">解析结果</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-green-600">标题:</span> {parsedNotesUrl.title}</div>
                  <div><span className="text-green-600">数据库:</span> {parsedNotesUrl.database}</div>
                  <div><span className="text-green-600">视图:</span> {parsedNotesUrl.view}</div>
                  <div><span className="text-green-600">服务器:</span> {parsedNotesUrl.server}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
