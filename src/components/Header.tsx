import { Bell, Search, Settings, User, FileDown, X, LogOut, ShieldCheck, Users } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { getRoleLabel } from '@/utils/constants';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'requirement', title: '新需求', message: 'Lot Tracking功能增强', time: '5分钟前', read: false },
    { id: 2, type: 'project', title: '项目更新', message: 'EAP系统升级进度更新至75%', time: '30分钟前', read: false },
    { id: 3, type: 'system', title: '系统通知', message: '下周将进行系统维护', time: '1小时前', read: true },
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      alert(`搜索: ${searchQuery}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  return (
    <header className="h-16 bg-white/70 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="min-w-0">
        <h1 className="text-[17px] font-semibold text-slate-800 tracking-tight truncate">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 truncate">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-1.5">
        <div className={`relative transition-all duration-300 ${searchOpen ? 'w-64 mr-2' : 'w-0'}`}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="搜索项目、机台、需求..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors"
          />
          <button
            onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <Search className="w-[18px] h-[18px]" />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors relative"
          >
            <Bell className="w-[18px] h-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-11 w-80 bg-white rounded-xl shadow-pop border border-slate-200 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800">通知</h3>
                <button
                  onClick={markAllRead}
                  className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                >
                  全部标为已读
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3.5 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors ${
                      notification.read ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        notification.type === 'requirement' ? 'bg-amber-50 text-amber-600' :
                        notification.type === 'project' ? 'bg-brand-50 text-brand-600' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        <Bell className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800">{notification.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{notification.message}</p>
                        <p className="text-[11px] text-slate-400 mt-1">{notification.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <Settings className="w-[18px] h-[18px]" />
          </button>

          {showSettings && (
            <div className="absolute right-0 top-11 w-48 bg-white rounded-xl shadow-pop border border-slate-200 z-50 py-1.5">
              <button
                onClick={(e) => { e.stopPropagation(); setShowSettings(false); navigate('/profile'); }}
                className="w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
              >
                <FileDown className="w-4 h-4 text-slate-400" />
                导入HCL Notes文档
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setShowSettings(false); navigate('/settings'); }}
                className="w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                系统设置
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setShowSettings(false); navigate('/users'); }}
                className="w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
              >
                <Users className="w-4 h-4 text-slate-400" />
                用户管理
              </button>
              <div className="border-t border-slate-100 my-1" />
              <button
                onClick={(e) => { e.stopPropagation(); setShowSettings(false); handleLogout(); }}
                className="w-full px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                退出登录
              </button>
            </div>
          )}
        </div>

        <div
          className="relative flex items-center gap-3 pl-3 ml-1 border-l border-slate-200 cursor-pointer"
          onClick={() => setShowUserMenu(!showUserMenu)}
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-sm shrink-0">
            <span className="text-white font-medium text-sm">
              {user ? getInitials(user.display_name) : <User className="w-5 h-5 text-white" />}
            </span>
          </div>
          <div className="hidden md:block leading-tight">
            <p className="text-sm font-medium text-slate-800">
              {user?.display_name || '未登录'}
            </p>
            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-brand-500" />
              {user ? `${user.team} · ${getRoleLabel(user.role)}` : '半导体CIM团队'}
            </p>
          </div>

          {showUserMenu && (
            <div className="absolute right-0 top-12 w-64 bg-white rounded-xl shadow-pop border border-slate-200 z-50 overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shrink-0">
                    <span className="text-white font-medium">
                      {user ? getInitials(user.display_name) : 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{user?.display_name}</p>
                    <p className="text-xs text-slate-500 truncate">@{user?.username}</p>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">部门</span>
                    <span className="text-slate-700 font-medium">{user?.department || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">团队</span>
                    <span className="text-slate-700 font-medium">{user?.team || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">角色</span>
                    <span className="text-slate-700 font-medium">{user ? getRoleLabel(user.role) : '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">域</span>
                    <span className="text-slate-700 font-medium">{user?.domain || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">登录时间</span>
                    <span className="text-slate-700 font-medium">{user?.login_at || '-'}</span>
                  </div>
                </div>
              </div>
              <div className="py-1.5">
                <button
                  onClick={(e) => { e.stopPropagation(); navigate('/profile'); setShowUserMenu(false); }}
                  className="w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  个人资料
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleLogout(); }}
                  className="w-full px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  退出登录
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
