import { useCallback, useState } from 'react';
import { User, LogOut, ShieldCheck, Sun, Moon, Bell, AlertCircle, Zap, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import useAppStore from '@/stores/appStore';
import { useClickOutside } from '@/hooks/useClickOutside';
import { workItemsAPI } from '@/services/api';
import { todayLocal } from '@/lib/utils';
import { role } from '@/constants/status';
import type { WorkItem } from '@/types';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

interface ReminderItem {
  type: string;
  item_id: number;
  title: string;
  message: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useAppStore();
  const userMenu = useClickOutside<HTMLDivElement>(() => {});
  const notifMenu = useClickOutside<HTMLDivElement>(() => {});
  const [notifLoading, setNotifLoading] = useState(false);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [notifLoaded, setNotifLoaded] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name: string) => (name ? name.charAt(0).toUpperCase() : 'U');

  /** 打开通知时拉取工作项，逾期/高优先级判断纯前端可算，无需再 POST 整包给后端 */
  const loadNotifications = useCallback(async () => {
    setNotifLoading(true);
    try {
      const res = await workItemsAPI.list({ sort_by: 'priority_score', limit: 200 });
      const items: WorkItem[] = res.success ? res.data : [];
      const today = todayLocal();
      const next: ReminderItem[] = [];
      for (const it of items) {
        if (it.status === 'completed') continue;
        const overdue = !!it.due_date && it.due_date < today;
        const high = it.urgency === 'high' || it.importance === 'high';
        if (!overdue && !high) continue;
        next.push({
          type: overdue ? 'overdue' : 'high_priority',
          item_id: it.id,
          title: it.title,
          message: overdue ? `任务已逾期，截止 ${it.due_date}` : '高优先级任务待处理',
        });
      }
      setReminders(next);
    } catch {
      setReminders([]);
    } finally {
      setNotifLoading(false);
      setNotifLoaded(true);
    }
  }, []);

  const handleToggleNotif = () => {
    const next = !notifMenu.open;
    notifMenu.setOpen(next);
    if (next && !notifLoaded) loadNotifications();
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-gray-200 bg-white/90 px-6 backdrop-blur">
      <div className="flex items-baseline gap-3">
        <h1 className="text-base font-semibold text-gray-900">{title}</h1>
        {subtitle && <p className="hidden text-xs text-gray-400 sm:block">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => window.dispatchEvent(new Event('cim:open-palette'))}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs text-gray-400 transition-colors hover:border-gray-300 hover:text-gray-500"
          title="全局搜索 (Ctrl+K)"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">搜索</span>
          <kbd className="hidden rounded border border-gray-200 bg-white px-1 text-[10px] md:inline">Ctrl K</kbd>
        </button>

        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-accent-600"
          title={theme === 'classic' ? '切换到现代主题（深色侧栏）' : '切换到经典主题（浅色侧栏）'}
        >
          {theme === 'classic' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </button>

        {/* 通知：真实逾期/高优先级提醒 */}
        <div className="relative" ref={notifMenu.ref}>
          <button
            onClick={handleToggleNotif}
            className="relative rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            title="提醒"
          >
            <Bell className="h-[18px] w-[18px]" />
            {reminders.length > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                {reminders.length > 9 ? '9+' : reminders.length}
              </span>
            )}
          </button>

          {notifMenu.open && (
            <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border border-gray-200 bg-white shadow-lg">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <h3 className="text-sm font-semibold text-gray-800">提醒</h3>
                <button
                  onClick={loadNotifications}
                  className="text-xs text-accent-600 hover:text-accent-700"
                >
                  刷新
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifLoading ? (
                  <div className="space-y-2 p-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />
                    ))}
                  </div>
                ) : reminders.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Zap className="mx-auto mb-2 h-6 w-6 text-gray-300" />
                    <p className="text-sm text-gray-400">一切正常，没有需要关注的提醒</p>
                  </div>
                ) : (
                  reminders.map((r, idx) => (
                    <button
                      key={`${r.item_id}-${idx}`}
                      onClick={() => {
                        notifMenu.setOpen(false);
                        navigate('/work-items');
                      }}
                      className="flex w-full items-start gap-3 border-b border-gray-50 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-gray-50"
                    >
                      <AlertCircle
                        className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
                          r.type === 'overdue' ? 'text-red-500' : 'text-amber-500'
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-800">{r.title}</p>
                        <p className="mt-0.5 text-xs text-gray-400">{r.message}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
              {reminders.length > 0 && (
                <button
                  onClick={() => {
                    notifMenu.setOpen(false);
                    navigate('/work-items');
                  }}
                  className="w-full border-t border-gray-100 py-2.5 text-center text-xs text-accent-600 transition-colors hover:bg-gray-50"
                >
                  前往工作台处理
                </button>
              )}
            </div>
          )}
        </div>

        <div className="relative" ref={userMenu.ref}>
          <button
            onClick={() => userMenu.setOpen(!userMenu.open)}
            className="flex items-center gap-2.5 rounded-lg py-1 pl-1 pr-2 transition-colors hover:bg-gray-100"
          >
            <div className="brand-gradient flex h-8 w-8 items-center justify-center rounded-full">
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
                  <div className="brand-gradient flex h-9 w-9 items-center justify-center rounded-full">
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
                  onClick={() => { userMenu.setOpen(false); navigate('/settings?tab=account'); }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50"
                >
                  <User className="h-4 w-4" />
                  个人资料（设置）
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
