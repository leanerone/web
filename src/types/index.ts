export interface Project {
  id: number;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  start_date: string;
  end_date: string;
  progress: number;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  project_id: number;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  due_date: string;
  created_at: string;
  updated_at: string;
}

export interface EquipmentType {
  id: number;
  name: string;
  description: string;
  manufacturer: string;
}

export interface Equipment {
  id: number;
  ap_id: number;
  ap_name: string;
  eq_name: string;
  eq_type: string;
  eq_model: string;
  vendor: string;
  server_id: string;
  driver_type: string;
  driver_version: string;
  snmp_ip: string;
  snmp_port: string;
  driver1_ip: string;
  driver1_port: string;
  driver2_ip: string;
  driver2_port: string;
  area: string;
  baud_rate: string;
  status: 'online' | 'offline' | 'maintenance' | 'decommissioned';
  location: string;
  installed_at: string;
  updated_at: string;
  type?: EquipmentType;
}

export interface Configuration {
  id: number;
  equipment_id: number;
  config_key: string;
  config_value: string;
  version: string;
  applied_at: string;
}

export interface Requirement {
  id: number;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'testing' | 'completed' | 'rejected';
  project_id?: number;
  equipment_id?: number;
  created_at: string;
  updated_at: string;
  equipment?: Equipment;
}

export interface ChangeRecord {
  id: number;
  requirement_id: number;
  change_type: string;
  description: string;
  file_path: string;
  applied_at: string;
}

export interface Report {
  id: number;
  title: string;
  report_date: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface NotesDocument {
  id: number;
  notes_id: string;
  title: string;
  content: string;
  url: string;
  project_id: number;
  sync_at: string;
  created_at: string;
}

export interface AISuggestion {
  id: string;
  type: 'plan' | 'optimize' | 'report';
  content: string;
  suggestions: string[];
  created_at: string;
}

export interface DashboardStats {
  total_projects: number;
  active_projects: number;
  total_equipment: number;
  online_equipment: number;
  pending_requirements: number;
  completed_tasks: number;
  weekly_tasks: number;
  completion_rate: number;
}

export type PriorityColor = 'low' | 'medium' | 'high' | 'critical';
export type StatusColor = 'pending' | 'in_progress' | 'completed' | 'blocked' | 'online' | 'offline' | 'maintenance';

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface SearchParams {
  keyword?: string;
  status?: string;
  priority?: string;
  type?: string;
}

export interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  total?: number;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
}

export interface CreateTaskRequest {
  project_id: number;
  title: string;
  description?: string;
  priority?: string;
  due_date?: string;
}

export interface CreateRequirementRequest {
  title: string;
  description?: string;
  priority?: string;
  project_id?: number;
  equipment_id?: number;
}

export interface AIPlanRequest {
  input: string;
  tasks?: Task[];
  projects?: Project[];
}

export interface AIWeeklyReportRequest {
  start_date: string;
  end_date: string;
  projects?: Project[];
  requirements?: Requirement[];
  tasks?: Task[];
}

export interface User {
  id: number;
  username: string;
  display_name: string;
  email: string;
  role: string;
  department: string;
  team: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface SystemSetting {
  id: number;
  key: string;
  value: string;
  description: string;
  category: string;
  updated_at: string;
}

export interface AISettings {
  openai_api_key: string;
  openai_api_base: string;
  ai_model: string;
}

export interface NotesSettings {
  notes_server_url: string;
  notes_user: string;
  notes_password: string;
}

export interface WorkCategory {
  id: number;
  name: string;
  code: string;
  description?: string;
  icon?: string;
  color?: string;
  sort_order?: number;
  created_at?: string;
}

export interface WorkItem {
  id: number;
  category_id?: number;
  title: string;
  details?: string;
  urgency: 'na' | 'low' | 'medium' | 'high';
  importance: 'na' | 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  priority_score: number;
  due_date?: string;
  project_id?: number;
  source_type: string;
  source_url?: string;
  ai_notes?: string;
  created_at?: string;
  updated_at?: string;
  category?: WorkCategory;
}

export interface DailyPlan {
  id: number;
  plan_date: string;
  user_id?: number;
  items_order?: string;
  ai_suggestions?: string;
  summary?: string;
  created_at?: string;
  updated_at?: string;
}

export interface WorkLog {
  id: number;
  work_item_id: number;
  action: string;
  description?: string;
  created_at?: string;
}

export interface WorkStats {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  blocked: number;
  urgent_count: number;
  important_count: number;
  categories: {
    id: number;
    name: string;
    code: string;
    icon?: string;
    color?: string;
    count: number;
  }[];
}

export interface ImportTableRequest {
  table_text: string;
  project_id?: number;
}

export interface CreateWorkItemRequest {
  category_id?: number;
  title: string;
  details?: string;
  urgency?: 'na' | 'low' | 'medium' | 'high';
  importance?: 'na' | 'low' | 'medium' | 'high';
  status?: 'pending' | 'in_progress' | 'completed' | 'blocked';
  due_date?: string;
  project_id?: number;
  source_type?: string;
  source_url?: string;
  ai_notes?: string;
}