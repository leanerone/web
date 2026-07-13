import { create } from 'zustand';
import type { Project, Task, Equipment, Requirement, Report, DashboardStats } from '@/types';

interface AppState {
  sidebarCollapsed: boolean;
  currentPage: string;
  
  projects: Project[];
  tasks: Task[];
  equipment: Equipment[];
  requirements: Requirement[];
  reports: Report[];
  stats: DashboardStats | null;
  
  setSidebarCollapsed: (collapsed: boolean) => void;
  setCurrentPage: (page: string) => void;
  
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (project: Project) => void;
  deleteProject: (id: number) => void;
  
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  deleteTask: (id: number) => void;
  
  setEquipment: (equipment: Equipment[]) => void;
  addEquipment: (item: Equipment) => void;
  updateEquipment: (item: Equipment) => void;
  deleteEquipment: (id: number) => void;
  
  setRequirements: (requirements: Requirement[]) => void;
  addRequirement: (req: Requirement) => void;
  updateRequirement: (req: Requirement) => void;
  deleteRequirement: (id: number) => void;
  
  setReports: (reports: Report[]) => void;
  addReport: (report: Report) => void;
  updateReport: (report: Report) => void;
  deleteReport: (id: number) => void;
  
  setStats: (stats: DashboardStats) => void;
}

const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: false,
  currentPage: 'dashboard',
  
  projects: [],
  tasks: [],
  equipment: [],
  requirements: [],
  reports: [],
  stats: null,
  
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setCurrentPage: (page) => set({ currentPage: page }),
  
  setProjects: (projects) => set({ projects }),
  addProject: (project) => set((state) => ({ projects: [...state.projects, project] })),
  updateProject: (project) => set((state) => ({ 
    projects: state.projects.map(p => p.id === project.id ? project : p) 
  })),
  deleteProject: (id) => set((state) => ({ 
    projects: state.projects.filter(p => p.id !== id) 
  })),
  
  setTasks: (tasks) => set({ tasks }),
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  updateTask: (task) => set((state) => ({ 
    tasks: state.tasks.map(t => t.id === task.id ? task : t) 
  })),
  deleteTask: (id) => set((state) => ({ 
    tasks: state.tasks.filter(t => t.id !== id) 
  })),
  
  setEquipment: (equipment) => set({ equipment }),
  addEquipment: (item) => set((state) => ({ equipment: [...state.equipment, item] })),
  updateEquipment: (item) => set((state) => ({ 
    equipment: state.equipment.map(e => e.id === item.id ? item : e) 
  })),
  deleteEquipment: (id) => set((state) => ({ 
    equipment: state.equipment.filter(e => e.id !== id) 
  })),
  
  setRequirements: (requirements) => set({ requirements }),
  addRequirement: (req) => set((state) => ({ requirements: [...state.requirements, req] })),
  updateRequirement: (req) => set((state) => ({ 
    requirements: state.requirements.map(r => r.id === req.id ? req : r) 
  })),
  deleteRequirement: (id) => set((state) => ({ 
    requirements: state.requirements.filter(r => r.id !== id) 
  })),
  
  setReports: (reports) => set({ reports }),
  addReport: (report) => set((state) => ({ reports: [...state.reports, report] })),
  updateReport: (report) => set((state) => ({ 
    reports: state.reports.map(r => r.id === report.id ? report : r) 
  })),
  deleteReport: (id) => set((state) => ({ 
    reports: state.reports.filter(r => r.id !== id) 
  })),
  
  setStats: (stats) => set({ stats }),
}));

export default useAppStore;