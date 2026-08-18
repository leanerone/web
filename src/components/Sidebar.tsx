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
  const { sidebarCollapsed, setSidebarCollapsed, setCurrentPage } = useAppStore();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const handleNavigate = (item: (typeof menuItems)[0]) => {
    navigate(item.path);
    setCurrentPage(item.id);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-dark-900 border-r border-white/5 transition-all duration-300 z-50 flex flex-col ${
        sidebarCollapsed ? 'w-[68px]' : 'w-64'
      }`}
    >
      {/* 品牌区 */}
      <div className={`h-16 flex items-center border-b border-white/5 ${sidebarCollapsed ? 'justify-center px-2' : 'px-4 gap-3'}`}>
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-600/20 shrink-0">
          <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
        {!sidebarCollapsed && (
          <div className="flex flex-col leading-tight overflow-hidden">
            <span className="text-[15px] font-semibold text-white tracking-tight">CIM Manager</span>
            <span className="text-[11px] text-dark-300 truncate">工作项管理平台</span>
          </div>
        )}
      </div>

      {/* 导航 */}
      <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
        <ul className="space-y-0.5 px-2">
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
                  className={`group relative w-full flex items-center gap-3 rounded-lg transition-colors duration-150 ${
                    sidebarCollapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
                  } ${
                    active
                      ? 'bg-brand-500/10 text-brand-300'
                      : 'text-dark-300 hover:bg-white/5 hover:text-dark-100'
                  }`}
                >
                  {/* 激活态左侧指示条 */}
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-brand-400" />
                  )}
                  <Icon
                    className={`w-[18px] h-[18px] shrink-0 transition-transform duration-150 ${
                      active ? 'text-brand-300' : 'group-hover:translate-x-0'
                    }`}
                    strokeWidth={active ? 2.25 : 1.75}
                  />
                  {!sidebarCollapsed && (
                    <span className={`text-[13px] truncate ${active ? 'font-medium' : 'font-normal'}`}>
                      {item.label}
                    </span>
                  )}
                  {/* 折叠态悬浮提示 */}
                  {sidebarCollapsed && hovered && (
                    <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-dark-700 rounded-md shadow-pop text-xs text-white whitespace-nowrap z-50 border border-white/5">
                      {item.label}
                    </div>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* 底部：折叠 + 个人资料 */}
      <div className="p-2 border-t border-white/5 space-y-0.5">
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={`w-full flex items-center gap-3 rounded-lg py-2.5 text-dark-400 hover:bg-white/5 hover:text-dark-100 transition-colors duration-150 ${
            sidebarCollapsed ? 'justify-center' : 'px-3'
          }`}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-[18px] h-[18px]" />
          ) : (
            <>
              <ChevronLeft className="w-[18px] h-[18px]" />
              <span className="text-[13px]">收起</span>
            </>
          )}
        </button>
        <button
          onClick={() => navigate('/profile')}
          onMouseEnter={() => setHoveredItem('profile')}
          onMouseLeave={() => setHoveredItem(null)}
          className={`group relative w-full flex items-center gap-3 rounded-lg py-2.5 text-dark-400 hover:bg-white/5 hover:text-dark-100 transition-colors duration-150 ${
            sidebarCollapsed ? 'justify-center' : 'px-3'
          }`}
        >
          <User className="w-[18px] h-[18px]" strokeWidth={1.75} />
          {!sidebarCollapsed && <span className="text-[13px]">个人资料</span>}
          {sidebarCollapsed && hoveredItem === 'profile' && (
            <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-dark-700 rounded-md shadow-pop text-xs text-white whitespace-nowrap z-50 border border-white/5">
              个人资料
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}
