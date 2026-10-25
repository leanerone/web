import { create } from 'zustand';
import type { Project, Equipment } from '@/types';

export type Theme = 'classic' | 'modern';

const THEME_KEY = 'cim-theme';
const SIDEBAR_KEY = 'cim-sidebar-collapsed';

function initialTheme(): Theme {
  const saved = localStorage.getItem(THEME_KEY);
  return saved === 'modern' ? 'modern' : 'classic';
}

/** 把主题应用到 <html>（CSS 变量切换的开关） */
export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('theme-classic', theme === 'classic');
}

interface AppState {
  /** classic = 经典亮色侧栏 + 青色主色；modern = 深色侧栏 + 靛蓝主色 */
  theme: Theme;
  sidebarCollapsed: boolean;

  projects: Project[];
  equipment: Equipment[];

  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (project: Project) => void;
  deleteProject: (id: number) => void;

  setEquipment: (equipment: Equipment[]) => void;
}

const useAppStore = create<AppState>((set, get) => ({
  theme: initialTheme(),
  sidebarCollapsed: localStorage.getItem(SIDEBAR_KEY) === '1',

  projects: [],
  equipment: [],

  setTheme: (theme) => {
    set({ theme });
    localStorage.setItem(THEME_KEY, theme);
    applyTheme(theme);
  },

  toggleTheme: () => {
    const next: Theme = get().theme === 'classic' ? 'modern' : 'classic';
    get().setTheme(next);
  },

  setSidebarCollapsed: (collapsed) => {
    set({ sidebarCollapsed: collapsed });
    localStorage.setItem(SIDEBAR_KEY, collapsed ? '1' : '0');
  },

  setProjects: (projects) => set({ projects }),
  addProject: (project) => set((state) => ({ projects: [...state.projects, project] })),
  updateProject: (project) => set((state) => ({
    projects: state.projects.map((p) => (p.id === project.id ? project : p)),
  })),
  deleteProject: (id) => set((state) => ({
    projects: state.projects.filter((p) => p.id !== id),
  })),

  setEquipment: (equipment) => set({ equipment }),
}));

export default useAppStore;
