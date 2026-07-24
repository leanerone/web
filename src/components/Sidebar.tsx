import { useState } from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  Cpu,
  ClipboardList,
  Bot,
  FileText,
  User,
  ChevronLeft,
  ChevronRight,
  Zap,
  Settings,
  Users,
  Briefcase,
  Target,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAppStore from '@/stores/appStore';

const menuItems = [
  { id: 'work-dashboard', icon: Target, label: '工作仪表盘', path: '/work-dashboard' },
  { id: 'work-items', icon: Briefcase, label: '工作管理', path: '/work-items' },
  { id: 'dashboard', icon: LayoutDashboard, label: '系统仪表盘', path: '/dashboard' },
  { id: 'projects', icon: FolderKanban, label: '项目管理', path: '/projects' },
  { id: 'equipment', icon: Cpu, label: '机台管理', path: '/equipment' },
  { id: 'requirements', icon: ClipboardList, label: '需求管理', path: '/requirements' },
  { id: 'ai-assistant', icon: Bot, label: 'AI规划助手', path: '/ai-assistant' },
  { id: 'weekly-report', icon: FileText, label: '周报管理', path: '/weekly-report' },
  { id: 'users', icon: Users, label: '用户管理', path: '/users' },
  { id: 'settings', icon: Settings, label: '系统设置', path: '/settings' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarCollapsed, setSidebarCollapsed, currentPage, setCurrentPage } = useAppStore();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const handleNavigate = (item: typeof menuItems[0]) => {
    navigate(item.path);
    setCurrentPage(item.id);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 z-50 flex flex-col ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="p-4 flex items-center justify-between border-b border-gray-200">
        <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col">
              <span className="text-lg font-bold text-gray-800">CIM Manager</span>
              <span className="text-xs text-gray-500">工作项目管理系统</span>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            const hovered = hoveredItem === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => handleNavigate(item)}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group relative ${
                    active
                      ? 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-600 border-l-2 border-cyan-500'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                  } ${sidebarCollapsed ? 'justify-center' : ''}`}
                >
                  <Icon className={`w-5 h-5 transition-transform duration-200 ${active || hovered ? 'scale-110' : ''}`} />
                  {!sidebarCollapsed && (
                    <span className="font-medium text-sm">{item.label}</span>
                  )}
                  {sidebarCollapsed && hovered && (
                    <div className="absolute left-full ml-2 px-3 py-2 bg-gray-800 rounded-lg shadow-lg text-sm text-white whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-2 border-t border-gray-200">
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="w-full flex items-center justify-center p-3 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all duration-200"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
        <button
          onClick={() => navigate('/profile')}
          onMouseEnter={() => setHoveredItem('profile')}
          onMouseLeave={() => setHoveredItem(null)}
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all duration-200 ${
            sidebarCollapsed ? 'justify-center' : ''
          }`}
        >
          <User className="w-5 h-5" />
          {!sidebarCollapsed && <span className="font-medium text-sm">个人资料</span>}
          {sidebarCollapsed && hoveredItem === 'profile' && (
            <div className="absolute left-full ml-2 px-3 py-2 bg-gray-800 rounded-lg shadow-lg text-sm text-white whitespace-nowrap z-50">
              个人资料
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}
