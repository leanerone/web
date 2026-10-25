import {
  LayoutDashboard,
  FolderKanban,
  Cpu,
  ClipboardList,
  FileText,
  ChevronLeft,
  ChevronRight,
  Zap,
  Settings,
  Briefcase,
  Sun,
  Moon,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAppStore from '@/stores/appStore';

interface NavItem {
  id: string;
  icon: typeof LayoutDashboard;
  label: string;
  path: string;
}

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: '总览',
    items: [
      { id: 'dashboard', icon: LayoutDashboard, label: '仪表盘', path: '/dashboard' },
    ],
  },
  {
    label: '执行',
    items: [
      { id: 'work-items', icon: Briefcase, label: '工作台', path: '/work-items' },
      { id: 'projects', icon: FolderKanban, label: '项目', path: '/projects' },
      { id: 'requirements', icon: ClipboardList, label: '需求', path: '/requirements' },
    ],
  },
  {
    label: '数据',
    items: [
      { id: 'equipment', icon: Cpu, label: '机台', path: '/equipment' },
    ],
  },
  {
    label: '产出',
    items: [
      { id: 'weekly-report', icon: FileText, label: '周报', path: '/weekly-report' },
    ],
  },
  {
    label: '管理',
    items: [
      { id: 'settings', icon: Settings, label: '设置', path: '/settings' },
    ],
  },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, sidebarCollapsed, setSidebarCollapsed, toggleTheme } = useAppStore();

  const classic = theme === 'classic';
  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <aside
      className={`fixed left-0 top-0 z-50 flex h-screen flex-col transition-all duration-200 ${
        sidebarCollapsed ? 'w-16' : 'w-60'
      } ${
        classic
          ? 'border-r border-gray-200 bg-white'
          : 'border-r border-gray-800 bg-gray-900'
      }`}
    >
      <div className={`flex h-14 flex-shrink-0 items-center border-b px-4 ${classic ? 'border-gray-200' : 'border-gray-800/80'}`}>
        <div className={`flex w-full items-center gap-2.5 ${sidebarCollapsed ? 'justify-center' : ''}`}>
          <div className="brand-gradient flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg shadow-lg shadow-accent-500/25">
            <Zap className="h-[18px] w-[18px] text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <span className={`block truncate text-sm font-semibold ${classic ? 'text-gray-900' : 'text-white'}`}>
                CIM Manager
              </span>
              <span className={`block truncate text-[10px] leading-tight ${classic ? 'text-gray-400' : 'text-gray-500'}`}>
                工作项目管理系统
              </span>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4">
            {!sidebarCollapsed && (
              <p className={`mb-1 px-3 text-[10px] font-medium uppercase tracking-wider ${classic ? 'text-gray-400' : 'text-gray-600'}`}>
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => navigate(item.path)}
                      title={sidebarCollapsed ? item.label : undefined}
                      className={`relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                        sidebarCollapsed ? 'justify-center' : ''
                      } ${
                        active
                          ? classic
                            ? 'bg-accent-50 font-medium text-accent-700'
                            : 'bg-white/10 font-medium text-white'
                          : classic
                            ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            : 'text-gray-400 hover:bg-white/5 hover:text-gray-100'
                      }`}
                    >
                      {active && (
                        <span className={`absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full ${classic ? 'bg-accent-500' : 'bg-accent-400'}`} />
                      )}
                      <Icon className={`h-4 w-4 flex-shrink-0 ${
                        active
                          ? classic ? 'text-accent-600' : 'text-accent-300'
                          : classic ? 'text-gray-400' : 'text-gray-500'
                      }`} />
                      {!sidebarCollapsed && <span>{item.label}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className={`flex items-center border-t p-2 ${classic ? 'border-gray-200' : 'border-gray-800/80'}`}>
        <button
          onClick={toggleTheme}
          className={`flex flex-1 items-center justify-center rounded-lg p-2.5 transition-colors ${
            classic
              ? 'text-gray-400 hover:bg-gray-100 hover:text-accent-600'
              : 'text-gray-500 hover:bg-white/5 hover:text-accent-300'
          }`}
          title={classic ? '切换到现代主题（深色侧栏）' : '切换到经典主题（浅色侧栏）'}
        >
          {classic ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={`flex flex-1 items-center justify-center rounded-lg p-2.5 transition-colors ${
            classic
              ? 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
              : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
          }`}
          title={sidebarCollapsed ? '展开侧栏' : '收起侧栏'}
        >
          {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
}
