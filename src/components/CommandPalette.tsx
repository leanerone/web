import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  LayoutDashboard,
  Briefcase,
  FolderKanban,
  ClipboardList,
  Cpu,
  FileText,
  Settings,
  Users,
  Sparkles,
  Sun,
  Upload,
  Plus,
  CornerDownLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { projectAPI, requirementAPI, workItemsAPI } from '@/services/api';
import useAppStore from '@/stores/appStore';
import type { Project, Requirement, WorkItem } from '@/types';

interface PaletteItem {
  id: string;
  group: string;
  label: string;
  hint?: string;
  icon: React.ReactNode;
  keywords: string;
  action: () => void;
}

const NAV_ITEMS = [
  { label: '仪表盘', path: '/dashboard', icon: LayoutDashboard, keywords: 'dashboard 总览 工作台首页' },
  { label: '工作台', path: '/work-items', icon: Briefcase, keywords: '工作项 待办 任务 work items' },
  { label: '项目', path: '/projects', icon: FolderKanban, keywords: 'projects 项目管理' },
  { label: '需求', path: '/requirements', icon: ClipboardList, keywords: 'requirements 需求管理 看板' },
  { label: '机台', path: '/equipment', icon: Cpu, keywords: 'equipment 设备 equip' },
  { label: '周报', path: '/weekly-report', icon: FileText, keywords: '周报 报告 weekly report' },
  { label: '设置', path: '/settings', icon: Settings, keywords: 'settings 配置 ai notes' },
  { label: '用户', path: '/users', icon: Users, keywords: 'users 成员 权限' },
];

/** 关键字高亮：命中部分加粗着色 */
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span className="font-semibold text-accent-600">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function CommandPalette() {
  const navigate = useNavigate();
  const { toggleTheme } = useAppStore();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // 全局快捷键: Ctrl/⌘+K；以及自定义事件（Header 搜索按钮触发）
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    const onOpenEvent = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('cim:open-palette', onOpenEvent);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('cim:open-palette', onOpenEvent);
    };
  }, []);

  // 首次打开时懒加载数据
  useEffect(() => {
    if (!open || loaded) return;
    setLoading(true);
    Promise.allSettled([
      workItemsAPI.list({ sort_by: 'priority_score', limit: 50 }),
      requirementAPI.list({ page: 1, limit: 50 }),
      projectAPI.list(),
    ]).then(([w, r, p]) => {
      if (w.status === 'fulfilled' && w.value.success) setWorkItems(w.value.data);
      if (r.status === 'fulfilled' && r.value.success) setRequirements(r.value.data);
      if (p.status === 'fulfilled' && p.value.success) setProjects(p.value.data);
      setLoaded(true);
      setLoading(false);
    });
  }, [open, loaded]);

  // 打开时重置
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIdx(0);
    }
  }, [open]);

  const items = useMemo<PaletteItem[]>(() => {
    const navItems: PaletteItem[] = NAV_ITEMS.map((n) => ({
      id: `nav-${n.path}`,
      group: '页面',
      label: n.label,
      icon: <n.icon className="h-4 w-4" />,
      keywords: n.keywords,
      action: () => navigate(n.path),
    }));

    const actionItems: PaletteItem[] = [
      {
        id: 'act-new-work',
        group: '快捷动作',
        label: '新建工作项',
        icon: <Plus className="h-4 w-4" />,
        keywords: '新建 创建 添加 工作项 new',
        action: () => navigate('/work-items?new=1'),
      },
      {
        id: 'act-new-req',
        group: '快捷动作',
        label: '创建需求',
        icon: <Plus className="h-4 w-4" />,
        keywords: '新建 创建 需求 requirement',
        action: () => navigate('/requirements?new=1'),
      },
      {
        id: 'act-import',
        group: '快捷动作',
        label: '导入表格到工作台',
        icon: <Upload className="h-4 w-4" />,
        keywords: '导入 excel 表格 import',
        action: () => navigate('/work-items?import=1'),
      },
      {
        id: 'act-weekly',
        group: '快捷动作',
        label: 'AI 生成周报',
        icon: <Sparkles className="h-4 w-4" />,
        keywords: '周报 ai 生成 weekly',
        action: () => navigate('/weekly-report'),
      },
      {
        id: 'act-theme',
        group: '快捷动作',
        label: '切换主题（经典 / 现代）',
        icon: <Sun className="h-4 w-4" />,
        keywords: '主题 深色 浅色 切换 theme',
        action: () => toggleTheme(),
      },
    ];

    const workItemsItems: PaletteItem[] = workItems.map((w) => ({
      id: `work-${w.id}`,
      group: '工作项',
      label: w.title,
      hint: `优先级 ${w.priority_score.toFixed(1)}`,
      icon: <Briefcase className="h-4 w-4" />,
      keywords: (w.details || '') + w.title,
      action: () => navigate('/work-items'),
    }));

    const reqItems: PaletteItem[] = requirements.map((r) => ({
      id: `req-${r.id}`,
      group: '需求',
      label: r.title,
      hint: `#${r.id}`,
      icon: <ClipboardList className="h-4 w-4" />,
      keywords: (r.description || '') + r.title,
      action: () => navigate(`/requirements/${r.id}`),
    }));

    const projItems: PaletteItem[] = projects.map((p) => ({
      id: `proj-${p.id}`,
      group: '项目',
      label: p.name,
      icon: <FolderKanban className="h-4 w-4" />,
      keywords: (p.description || '') + p.name,
      action: () => navigate(`/projects/${p.id}`),
    }));

    return [...navItems, ...workItemsItems, ...reqItems, ...projItems, ...actionItems];
  }, [navigate, toggleTheme, workItems, requirements, projects]);

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!q) return items;
    return items.filter((it) => it.label.toLowerCase().includes(q) || it.keywords.toLowerCase().includes(q));
  }, [items, q]);

  // 连续分组展示
  const grouped = useMemo(() => {
    const groups: { name: string; items: PaletteItem[] }[] = [];
    for (const it of filtered) {
      const g = groups.find((x) => x.name === it.group);
      if (g) g.items.push(it);
      else groups.push({ name: it.group, items: [it] });
    }
    return groups;
  }, [filtered]);

  // 过滤变化时重置选中项
  useEffect(() => setSelectedIdx(0), [query]);

  const runItem = useCallback((it: PaletteItem) => {
    setOpen(false);
    it.action();
  }, []);

  // 键盘导航
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const flat = filtered[selectedIdx];
      if (flat) runItem(flat);
    }
  };

  // 选中项滚动到可见区域
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${selectedIdx}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIdx]);

  if (!open) return null;

  let flatIdx = -1;

  return (
    <div className="fixed inset-0 z-[150] flex items-start justify-center px-4 pt-[12vh]">
      <div className="fixed inset-0 bg-gray-900/30" onClick={() => setOpen(false)} />
      <div
        className="relative w-full max-w-xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl"
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-2.5 border-b border-gray-100 px-4">
          <Search className="h-4 w-4 flex-shrink-0 text-gray-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索页面、工作项、需求、项目，或输入快捷动作..."
            className="w-full bg-transparent py-3.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
          />
          <kbd className="flex-shrink-0 rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-400">
            ESC
          </kbd>
        </div>

        <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-2">
          {loading ? (
            <div className="space-y-2 p-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">没有匹配「{query}」的结果</p>
          ) : (
            grouped.map((g) => (
              <div key={g.name} className="mb-1.5">
                <p className="px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-gray-400">
                  {g.name}
                </p>
                {g.items.map((it) => {
                  flatIdx += 1;
                  const idx = flatIdx;
                  const selected = idx === selectedIdx;
                  return (
                    <button
                      key={it.id}
                      data-idx={idx}
                      onMouseEnter={() => setSelectedIdx(idx)}
                      onClick={() => runItem(it)}
                      className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors ${
                        selected ? 'bg-accent-50' : ''
                      }`}
                    >
                      <span className={`flex-shrink-0 ${selected ? 'text-accent-600' : 'text-gray-400'}`}>
                        {it.icon}
                      </span>
                      <span className={`min-w-0 flex-1 truncate text-sm ${selected ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                        <Highlight text={it.label} query={q} />
                        {it.hint && <span className="ml-2 text-xs font-normal text-gray-400">{it.hint}</span>}
                      </span>
                      {selected && <CornerDownLeft className="h-3.5 w-3.5 flex-shrink-0 text-gray-300" />}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center gap-4 border-t border-gray-100 bg-gray-50/60 px-4 py-2 text-[11px] text-gray-400">
          <span><kbd className="rounded border border-gray-200 bg-white px-1">↑↓</kbd> 选择</span>
          <span><kbd className="rounded border border-gray-200 bg-white px-1">Enter</kbd> 打开</span>
          <span><kbd className="rounded border border-gray-200 bg-white px-1">Ctrl K</kbd> 唤起/关闭</span>
        </div>
      </div>
    </div>
  );
}
