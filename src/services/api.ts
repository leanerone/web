import axios from 'axios';
import type {
  Project,
  Task,
  Equipment,
  EquipmentType,
  Requirement,
  Report,
  NotesDocument,
  Configuration,
  DashboardStats,
  APIResponse,
  CreateProjectRequest,
  CreateTaskRequest,
  CreateRequirementRequest,
  AIPlanRequest,
  AIWeeklyReportRequest,
  PaginationParams,
  SearchParams,
  User,
  AISettings,
  NotesSettings,
  SystemSetting,
  WorkCategory,
  WorkItem,
  WorkLog,
  DailyPlan,
  WorkStats,
  CreateWorkItemRequest,
} from '@/types';
import { AUTH_STORAGE_KEY } from '@/utils/constants';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

// 请求拦截器：自动添加Authorization头
api.interceptors.request.use(
  (config) => {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.token) {
          config.headers.Authorization = `Bearer ${parsed.token}`;
        }
      }
    } catch {
      // ignore
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error);
    // 401未授权时跳转登录页
    if (error.response?.status === 401) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const projectAPI = {
  list: (params?: PaginationParams & SearchParams): Promise<APIResponse<Project[]>> =>
    api.get('/projects', { params }),
  
  get: (id: number): Promise<APIResponse<Project>> =>
    api.get(`/projects/${id}`),
  
  create: (data: CreateProjectRequest): Promise<APIResponse<Project>> =>
    api.post('/projects', data),
  
  update: (id: number, data: Partial<Project>): Promise<APIResponse<Project>> =>
    api.put(`/projects/${id}`, data),
  
  delete: (id: number): Promise<APIResponse<void>> =>
    api.delete(`/projects/${id}`),
};

export const taskAPI = {
  list: (projectId: number): Promise<APIResponse<Task[]>> =>
    api.get(`/projects/${projectId}/tasks`),
  
  create: (data: CreateTaskRequest): Promise<APIResponse<Task>> =>
    api.post('/tasks', data),
  
  update: (id: number, data: Partial<Task>): Promise<APIResponse<Task>> =>
    api.put(`/tasks/${id}`, data),
  
  delete: (id: number): Promise<APIResponse<void>> =>
    api.delete(`/tasks/${id}`),
};

export const equipmentAPI = {
  list: (params?: PaginationParams & SearchParams): Promise<APIResponse<Equipment[]>> =>
    api.get('/equipment', { params }),
  
  get: (id: number): Promise<APIResponse<Equipment>> =>
    api.get(`/equipment/${id}`),
  
  create: (data: Partial<Equipment>): Promise<APIResponse<Equipment>> =>
    api.post('/equipment', data),
  
  update: (id: number, data: Partial<Equipment>): Promise<APIResponse<Equipment>> =>
    api.put(`/equipment/${id}`, data),
  
  delete: (id: number): Promise<APIResponse<void>> =>
    api.delete(`/equipment/${id}`),
  
  types: (): Promise<APIResponse<EquipmentType[]>> =>
    api.get('/equipment/types'),
  
  configurations: (equipmentId: number): Promise<APIResponse<Configuration[]>> =>
    api.get(`/equipment/${equipmentId}/configurations`),
};

export const requirementAPI = {
  list: (params?: PaginationParams & SearchParams): Promise<APIResponse<Requirement[]>> =>
    api.get('/requirements', { params }),
  
  get: (id: number): Promise<APIResponse<Requirement>> =>
    api.get(`/requirements/${id}`),
  
  create: (data: CreateRequirementRequest): Promise<APIResponse<Requirement>> =>
    api.post('/requirements', data),
  
  update: (id: number, data: Partial<Requirement>): Promise<APIResponse<Requirement>> =>
    api.put(`/requirements/${id}`, data),
  
  delete: (id: number): Promise<APIResponse<void>> =>
    api.delete(`/requirements/${id}`),
};

export const reportAPI = {
  list: (params?: PaginationParams): Promise<APIResponse<Report[]>> =>
    api.get('/reports', { params }),
  
  get: (id: number): Promise<APIResponse<Report>> =>
    api.get(`/reports/${id}`),
  
  create: (data: Partial<Report>): Promise<APIResponse<Report>> =>
    api.post('/reports', data),
  
  update: (id: number, data: Partial<Report>): Promise<APIResponse<Report>> =>
    api.put(`/reports/${id}`, data),
  
  delete: (id: number): Promise<APIResponse<void>> =>
    api.delete(`/reports/${id}`),
};

export const aiAPI = {
  plan: (data: AIPlanRequest): Promise<APIResponse<{ suggestions: string[]; plan: string }>> =>
    api.post('/ai/plan', data),
  
  optimize: (data: { tasks: Task[] }): Promise<APIResponse<{ optimized_tasks: Task[]; suggestions: string[] }>> =>
    api.post('/ai/optimize', data),
  
  weeklyReport: (data: AIWeeklyReportRequest): Promise<APIResponse<{ content: string }>> =>
    api.post('/ai/weekly-report', data),

  dailyStandup: (data: { work_items?: WorkItem[]; date?: string }): Promise<APIResponse<{
    today_tasks: WorkItem[];
    overdue_tasks: WorkItem[];
    suggestions: string[];
    summary: string;
  }>> =>
    api.post('/ai/daily-standup', data),

  smartSort: (data: { work_items: WorkItem[]; strategy?: string }): Promise<APIResponse<{
    sorted_items: WorkItem[];
    strategy: string;
    explanation: string;
  }>> =>
    api.post('/ai/smart-sort', data),

  checkReminders: (data: { work_items?: WorkItem[]; date?: string }): Promise<APIResponse<{
    overdue_count: number;
    high_priority_count: number;
    reminders: { type: string; item_id: number; title: string; message: string }[];
    message: string;
  }>> =>
    api.post('/ai/check-reminders', data),
};

export const notesAPI = {
  sync: (): Promise<APIResponse<{ synced_count: number }>> =>
    api.get('/notes/sync'),
  
  import: (data: { project_id?: number; notes_id?: string }): Promise<APIResponse<NotesDocument[]>> =>
    api.post('/notes/import', data),
  
  documents: (params?: { project_id?: number }): Promise<APIResponse<NotesDocument[]>> =>
    api.get('/notes/documents', { params }),
  
  getDocument: (id: number): Promise<APIResponse<NotesDocument>> =>
    api.get(`/notes/documents/${id}`),
  
  parseUrl: (url: string): Promise<APIResponse<{
    title: string;
    database: string;
    view: string;
    document: string;
    server: string;
    replica_id: string;
    view_id: string;
    note_id: string;
    original_url: string;
  }>> =>
    api.post('/notes/parse-url', { url }),
  
  importByUrl: (url: string, project_id?: number): Promise<APIResponse<NotesDocument[]>> =>
    api.post('/notes/import-by-url', { url, project_id }),
};

export const dashboardAPI = {
  stats: (): Promise<APIResponse<DashboardStats>> =>
    api.get('/dashboard/stats'),
};

export const userAPI = {
  list: (): Promise<APIResponse<User[]>> =>
    api.get('/users'),
  
  get: (id: number): Promise<APIResponse<User>> =>
    api.get(`/users/${id}`),
  
  create: (data: Partial<User>): Promise<APIResponse<User>> =>
    api.post('/users', data),
  
  update: (id: number, data: Partial<User>): Promise<APIResponse<User>> =>
    api.put(`/users/${id}`, data),
  
  delete: (id: number): Promise<APIResponse<void>> =>
    api.delete(`/users/${id}`),
};

export const settingsAPI = {
  list: (category?: string): Promise<APIResponse<SystemSetting[]>> =>
    api.get('/settings', { params: category ? { category } : {} }),
  
  get: (key: string): Promise<APIResponse<SystemSetting>> =>
    api.get(`/settings/${key}`),
  
  update: (key: string, value: string, description?: string, category?: string): Promise<APIResponse<SystemSetting>> =>
    api.put(`/settings/${key}`, null, { params: { value, description, category } }),
  
  getAISettings: (): Promise<APIResponse<AISettings>> =>
    api.get('/settings/ai/config'),
  
  saveAISettings: (data: AISettings): Promise<APIResponse<void>> =>
    api.post('/settings/ai/config', data),
  
  getNotesSettings: (): Promise<APIResponse<NotesSettings>> =>
    api.get('/settings/notes/config'),
  
  saveNotesSettings: (data: NotesSettings): Promise<APIResponse<void>> =>
    api.post('/settings/notes/config', data),
};

export const workItemsAPI = {
  listCategories: (): Promise<APIResponse<WorkCategory[]>> =>
    api.get('/work/categories'),

  createCategory: (data: Partial<WorkCategory>): Promise<APIResponse<WorkCategory>> =>
    api.post('/work/categories', data),

  updateCategory: (id: number, data: Partial<WorkCategory>): Promise<APIResponse<WorkCategory>> =>
    api.put(`/work/categories/${id}`, data),

  deleteCategory: (id: number): Promise<APIResponse<void>> =>
    api.delete(`/work/categories/${id}`),

  initCategories: (): Promise<APIResponse<void>> =>
    api.post('/work/categories/init'),

  list: (params?: {
    category_id?: number;
    status?: string;
    project_id?: number;
    urgency?: string;
    importance?: string;
    sort_by?: string;
    limit?: number;
    offset?: number;
  }): Promise<APIResponse<WorkItem[]>> =>
    api.get('/work/items', { params }),

  get: (id: number): Promise<APIResponse<WorkItem>> =>
    api.get(`/work/items/${id}`),

  create: (data: CreateWorkItemRequest): Promise<APIResponse<WorkItem>> =>
    api.post('/work/items', data),

  update: (id: number, data: Partial<CreateWorkItemRequest>): Promise<APIResponse<WorkItem>> =>
    api.put(`/work/items/${id}`, data),

  delete: (id: number): Promise<APIResponse<void>> =>
    api.delete(`/work/items/${id}`),

  importTable: (table_text: string, project_id?: number): Promise<APIResponse<{ data: WorkItem[]; count: number }>> =>
    api.post('/work/import-table', { table_text, project_id }),

  getLogs: (work_item_id?: number): Promise<APIResponse<WorkLog[]>> =>
    api.get('/work/logs', { params: work_item_id ? { work_item_id } : {} }),

  getDailyPlan: (plan_date?: string, user_id?: number): Promise<APIResponse<DailyPlan>> =>
    api.get('/work/daily-plan', { params: { plan_date, user_id } }),

  saveDailyPlan: (data: { plan_date: string; items_order?: string; ai_suggestions?: string; summary?: string; user_id?: number }): Promise<APIResponse<DailyPlan>> =>
    api.post('/work/daily-plan', data),

  getStats: (): Promise<APIResponse<WorkStats>> =>
    api.get('/work/stats'),
};

export default api;