import { useState, useEffect, useRef } from 'react';
import { 
  FolderKanban, 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  Calendar,
  TrendingUp,
  Edit,
  Trash2,
  Eye,
  Copy,
  Archive,
} from 'lucide-react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { useNavigate } from 'react-router-dom';
import { projectAPI } from '@/services/api';
import useAppStore from '@/stores/appStore';
import type { Project, CreateProjectRequest } from '@/types';

const mockProjects: Project[] = [
  { id: 1, name: 'EAP系统升级v2.0', description: '升级现有EAP系统至新版本，支持更多机台类型', status: 'active', start_date: '2026-01-15', end_date: '2026-06-30', progress: 75, created_at: '2026-01-15', updated_at: '2026-07-13' },
  { id: 2, name: 'Litho机台驱动优化', description: '优化光刻机关键驱动性能，提升吞吐量', status: 'active', start_date: '2026-03-01', end_date: '2026-08-31', progress: 45, created_at: '2026-03-01', updated_at: '2026-07-13' },
  { id: 3, name: 'CMP设备集成', description: '集成新CMP设备至CIM系统，完成接口开发', status: 'active', start_date: '2026-05-01', end_date: '2026-11-30', progress: 20, created_at: '2026-05-01', updated_at: '2026-07-13' },
  { id: 4, name: 'PECVD监控系统开发', description: '开发PECVD设备实时监控系统', status: 'completed', start_date: '2025-10-01', end_date: '2026-03-31', progress: 100, created_at: '2025-10-01', updated_at: '2026-03-31' },
  { id: 5, name: 'Metrology数据整合', description: '整合各类量测设备数据，建立统一数据仓库', status: 'paused', start_date: '2026-02-01', end_date: '2026-09-30', progress: 30, created_at: '2026-02-01', updated_at: '2026-06-15' },
];

export default function Projects() {
  const navigate = useNavigate();
  const { setProjects, addProject, deleteProject } = useAppStore();
  const [projectList, setProjectList] = useState<Project[]>(mockProjects);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<CreateProjectRequest & { status?: string; progress?: number; start_date?: string; end_date?: string }>({ name: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await projectAPI.list();
        if (res.success) {
          setProjectList(res.data);
          setProjects(res.data);
        }
      } catch {
        setProjectList(mockProjects);
        setProjects(mockProjects);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [setProjects]);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredProjects = projectList.filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingProject(null);
    setFormData({ name: '', description: '', start_date: '', end_date: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (project: Project) => {
    setModalMode('edit');
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description,
      status: project.status,
      progress: project.progress,
      start_date: project.start_date,
      end_date: project.end_date,
    });
    setIsModalOpen(true);
    setOpenMenuId(null);
  };

  const handleSave = async () => {
    if (!formData.name) return;
    if (modalMode === 'edit' && editingProject) {
      const updatedProject: Project = {
        ...editingProject,
        name: formData.name,
        description: formData.description || '',
        status: (formData.status as Project['status']) || editingProject.status,
        progress: formData.progress ?? editingProject.progress,
        start_date: formData.start_date || editingProject.start_date,
        end_date: formData.end_date || editingProject.end_date,
        updated_at: new Date().toISOString(),
      };
      setProjectList((prev) => prev.map((p) => p.id === editingProject.id ? updatedProject : p));
    } else {
      try {
        const res = await projectAPI.create(formData);
        if (res.success) {
          addProject(res.data);
          setProjectList((prev) => [res.data, ...prev]);
        }
      } catch {
        const newProject: Project = {
          id: Date.now(),
          ...formData,
          status: 'active',
          progress: 0,
          start_date: formData.start_date || new Date().toISOString().split('T')[0],
          end_date: formData.end_date || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        addProject(newProject);
        setProjectList((prev) => [newProject, ...prev]);
      }
    }
    setIsModalOpen(false);
    setFormData({ name: '', description: '' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个项目吗？')) return;
    setOpenMenuId(null);
    try {
      await projectAPI.delete(id);
      deleteProject(id);
      setProjectList((prev) => prev.filter((p) => p.id !== id));
    } catch {
      deleteProject(id);
      setProjectList((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const handleCopy = (project: Project) => {
    const copiedProject: Project = {
      ...project,
      id: Date.now(),
      name: `${project.name} (副本)`,
      status: 'active',
      progress: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addProject(copiedProject);
    setProjectList((prev) => [copiedProject, ...prev]);
    setOpenMenuId(null);
  };

  const handleArchive = (project: Project) => {
    const archivedProject: Project = {
      ...project,
      status: 'paused',
      updated_at: new Date().toISOString(),
    };
    setProjectList((prev) => prev.map((p) => p.id === project.id ? archivedProject : p));
    setOpenMenuId(null);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-50 text-green-600',
      completed: 'bg-gray-100 text-gray-500',
      paused: 'bg-orange-50 text-orange-600',
      cancelled: 'bg-red-50 text-red-600',
    };
    return colors[status] || 'bg-gray-100 text-gray-500';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: '进行中',
      completed: '已完成',
      paused: '已暂停',
      cancelled: '已取消',
    };
    return labels[status] || status;
  };

  return (
    <div className="animate-fade-in">
      <div className="p-6">
        <Card className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索项目名称或描述..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-cyan-500 w-full sm:w-64"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 pr-8 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-cyan-500 appearance-none w-full sm:w-48"
                >
                  <option value="all">全部状态</option>
                  <option value="active">进行中</option>
                  <option value="completed">已完成</option>
                  <option value="paused">已暂停</option>
                  <option value="cancelled">已取消</option>
                </select>
              </div>
            </div>
            <Button onClick={handleOpenCreate}>
              <Plus className="w-4 h-4" />
              创建新项目
            </Button>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            [1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-gray-100 border border-gray-200 rounded-xl p-5 animate-pulse" />
            ))
          ) : filteredProjects.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <FolderKanban className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">暂无项目</p>
              <Button onClick={handleOpenCreate} className="mt-4">
                创建第一个项目
              </Button>
            </div>
          ) : (
            filteredProjects.map((project) => (
              <Card key={project.id} title={project.name} hover className="group">
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{project.description}</p>
                
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{project.start_date} ~ {project.end_date || '待定'}</span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                      {getStatusLabel(project.status)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-cyan-600" />
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          project.status === 'completed' ? 'bg-green-500' : 'bg-gradient-to-r from-cyan-500 to-blue-600'
                        }`}
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-12 text-right">{project.progress}%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <Eye className="w-4 h-4" />
                    查看详情
                  </Button>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(project)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(project.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <div className="relative" ref={openMenuId === project.id ? menuRef : undefined}>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setOpenMenuId(openMenuId === project.id ? null : project.id)}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                      {openMenuId === project.id && (
                        <div className="absolute right-0 top-10 w-44 bg-white rounded-xl shadow-xl border border-gray-200 z-50 py-2">
                          <button
                            onClick={() => handleOpenEdit(project)}
                            className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            编辑项目
                          </button>
                          <button
                            onClick={() => handleCopy(project)}
                            className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                          >
                            <Copy className="w-4 h-4" />
                            复制项目
                          </button>
                          <button
                            onClick={() => navigate(`/projects/${project.id}`)}
                            className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            查看详情
                          </button>
                          {project.status !== 'paused' && project.status !== 'completed' && (
                            <button
                              onClick={() => handleArchive(project)}
                              className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                            >
                              <Archive className="w-4 h-4" />
                              归档项目
                            </button>
                          )}
                          <div className="border-t border-gray-200 my-1" />
                          <button
                            onClick={() => handleDelete(project.id)}
                            className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            删除项目
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setFormData({ name: '', description: '' });
        }} 
        title={modalMode === 'edit' ? '编辑项目' : '创建新项目'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">项目名称 *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-cyan-500"
              placeholder="请输入项目名称"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">项目描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-cyan-500 resize-none"
              rows={4}
              placeholder="请输入项目描述..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
              <input
                type="date"
                value={formData.start_date || ''}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
              <input
                type="date"
                value={formData.end_date || ''}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
          {modalMode === 'edit' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">项目状态</label>
                <select
                  value={formData.status || 'active'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-cyan-500"
                >
                  <option value="active">进行中</option>
                  <option value="completed">已完成</option>
                  <option value="paused">已暂停</option>
                  <option value="cancelled">已取消</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">项目进度 (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progress ?? 0}
                  onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          )}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={!formData.name}>
              {modalMode === 'edit' ? '保存修改' : '创建项目'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
