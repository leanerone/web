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
} from '@/types';

const STORAGE_KEY = 'cim_auth';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

// 请求拦截器：自动添加Authorization头
api.interceptors.request.use(
  (config) => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
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
      localStorage.removeItem(STORAGE_KEY);
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
};

export const dashboardAPI = {
  stats: (): Promise<APIResponse<DashboardStats>> =>
    api.get('/dashboard/stats'),
};

export default api;