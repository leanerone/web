import { Bell, Search, Settings, User, FileDown, X, LogOut, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

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

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: '管理员',
      engineer: '工程师',
      user: '普通用户',
    };
    return labels[role] || role;
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  return (
    <header className="h-16 bg-white/80 backdrop-blur-sm border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-40">
      <div>
        <h1 className="text-xl font-bold text-gray-800">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        <div className={`relative transition-all duration-300 ${searchOpen ? 'w-64' : 'w-0'}`}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索项目、机台、需求..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-cyan-500 transition-colors"
          />
          <button 
            onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all duration-200"
        >
          <Search className="w-5 h-5" />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all duration-200 relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 top-10 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">通知</h3>
                <button 
                  onClick={markAllRead}
                  className="text-xs text-cyan-600 hover:text-cyan-700"
                >
                  全部标为已读
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                      notification.read ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        notification.type === 'requirement' ? 'bg-orange-50 text-orange-600' :
                        notification.type === 'project' ? 'bg-cyan-50 text-cyan-600' :
                        'bg-gray-50 text-gray-600'
                      }`}>
                        <Bell className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">{notification.title}</p>
                        <p className="text-xs text-gray-500 mt-1 truncate">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
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
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all duration-200"
          >
            <Settings className="w-5 h-5" />
          </button>
          
          {showSettings && (
            <div className="absolute right-0 top-10 w-48 bg-white rounded-xl shadow-xl border border-gray-200 z-50">
              <div className="py-2">
                <button className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
                  <FileDown className="w-4 h-4" />
                  导入HCL Notes文档
                </button>
                <button className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  系统设置
                </button>
                <button className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  用户管理
                </button>
                <div className="border-t border-gray-200 my-2" />
                <button
                  onClick={(e) => { e.stopPropagation(); setShowSettings(false); handleLogout(); }}
                  className="w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  退出登录
                </button>
              </div>
            </div>
          )}
        </div>

        <div
          className="relative flex items-center gap-3 pl-4 border-l border-gray-200 cursor-pointer"
          onClick={() => setShowUserMenu(!showUserMenu)}
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <span className="text-white font-medium text-sm">
              {user ? getInitials(user.display_name) : <User className="w-5 h-5 text-white" />}
            </span>
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-gray-800">
              {user?.display_name || '未登录'}
            </p>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-green-500" />
              {user ? `${user.team} · ${getRoleLabel(user.role)}` : '半导体CIM团队'}
            </p>
          </div>

          {showUserMenu && (
            <div className="absolute right-0 top-12 w-64 bg-white rounded-xl shadow-xl border border-gray-200 z-50">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                    <span className="text-white font-medium">
                      {user ? getInitials(user.display_name) : 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{user?.display_name}</p>
                    <p className="text-xs text-gray-500 truncate">@{user?.username}</p>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>部门：</span>
                    <span className="text-gray-800">{user?.department || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>团队：</span>
                    <span className="text-gray-800">{user?.team || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>角色：</span>
                    <span className="text-gray-800">{user ? getRoleLabel(user.role) : '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>域：</span>
                    <span className="text-gray-800">{user?.domain || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>计算机：</span>
                    <span className="text-gray-800">{user?.computer || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>登录时间：</span>
                    <span className="text-gray-800">{user?.login_at || '-'}</span>
                  </div>
                </div>
              </div>
              <div className="py-2">
                <button
                  onClick={(e) => { e.stopPropagation(); navigate('/profile'); setShowUserMenu(false); }}
                  className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  个人资料
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleLogout(); }}
                  className="w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-50 transition-colors flex items-center gap-2"
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
