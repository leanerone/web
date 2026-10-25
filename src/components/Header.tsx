import { User, LogOut, ShieldCheck, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import useAppStore from '@/stores/appStore';
import { useClickOutside } from '@/hooks/useClickOutside';
import { role } from '@/constants/status';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useAppStore();
  const userMenu = useClickOutside<HTMLDivElement>(() => {});

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name: string) => (name ? name.charAt(0).toUpperCase() : 'U');

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-gray-200 bg-white/90 px-6 backdrop-blur">
      <div className="flex items-baseline gap-3">
        <h1 className="text-base font-semibold text-gray-900">{title}</h1>
        {subtitle && <p className="hidden text-xs text-gray-400 sm:block">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-accent-600"
          title={theme === 'classic' ? '切换到现代主题（深色侧栏）' : '切换到经典主题（浅色侧栏）'}
        >
          {theme === 'classic' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </button>

        <div className="relative" ref={userMenu.ref}>
          <button
            onClick={() => userMenu.setOpen(!userMenu.open)}
            className="flex items-center gap-2.5 rounded-lg py-1 pl-1 pr-2 transition-colors hover:bg-gray-100"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full brand-gradient">
              <span className="text-sm font-medium text-white">
                {user ? getInitials(user.display_name) : <User className="h-4 w-4 text-white" />}
              </span>
            </div>
            <div className="hidden text-left md:block">
              <p className="text-sm font-medium leading-tight text-gray-800">
                {user?.display_name || '未登录'}
              </p>
              <p className="flex items-center gap-1 text-xs leading-tight text-gray-400">
                <ShieldCheck className="h-3 w-3 text-emerald-500" />
                {user ? role.label(user.role) : '半导体CIM团队'}
              </p>
            </div>
          </button>

          {userMenu.open && (
            <div className="absolute right-0 top-11 z-50 w-64 rounded-xl border border-gray-200 bg-white shadow-lg">
              <div className="border-b border-gray-100 p-4">
                <div className="mb-2 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full brand-gradient">
                    <span className="font-medium text-white">{user ? getInitials(user.display_name) : 'U'}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-800">{user?.display_name}</p>
                    <p className="truncate text-xs text-gray-400">@{user?.username}</p>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>部门</span>
                    <span className="text-gray-700">{user?.department || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>团队</span>
                    <span className="text-gray-700">{user?.team || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>角色</span>
                    <span className="text-gray-700">{user ? role.label(user.role) : '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>登录时间</span>
                    <span className="text-gray-700">{user?.login_at || '-'}</span>
                  </div>
                </div>
              </div>
              <div className="py-1.5">
                <button
                  onClick={() => { userMenu.setOpen(false); navigate('/profile'); }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50"
                >
                  <User className="h-4 w-4" />
                  个人资料
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
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
