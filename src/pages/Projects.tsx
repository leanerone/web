import { useState, useEffect, useRef } from 'react';
import {
  FolderKanban,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Archive,
} from 'lucide-react';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import EmptyState from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { ProjectStatusBadge } from '@/components/ui/Badge';
import { toast } from '@/components/ui/Toast';
import { confirmAction } from '@/components/ui/ConfirmDialog';
import { useNavigate } from 'react-router-dom';
import { projectAPI } from '@/services/api';
import useAppStore from '@/stores/appStore';
import type { Project, CreateProjectRequest } from '@/types';

const inputCls =
  'rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 transition-colors focus:border-accent-500 focus:bg-white focus:outline-none';

export default function Projects() {
  const navigate = useNavigate();
  const { addProject, updateProject, deleteProject } = useAppStore();
  const [projects, setProjects] = useState<Project[]>([]);
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
          setProjects(res.data);
        } else {
          toast.error(res.message || '项目列表加载失败');
        }
      } catch {
        toast.error('项目列表加载失败，请检查后端服务');
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

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

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase());
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
    try {
      if (modalMode === 'edit' && editingProject) {
        const res = await projectAPI.update(editingProject.id, {
          name: formData.name,
          description: formData.description,
          status: formData.status as Project['status'],
          progress: formData.progress,
          start_date: formData.start_date,
          end_date: formData.end_date,
        });
        if (res.success) {
          setProjects((prev) => prev.map((p) => (p.id === editingProject.id ? res.data : p)));
          updateProject(res.data);
          toast.success('项目已保存');
        } else {
          toast.error(res.message || '保存失败');
        }
      } else {
        const res = await projectAPI.create(formData);
        if (res.success) {
          setProjects((prev) => [res.data, ...prev]);
          addProject(res.data);
          toast.success('项目已创建');
        } else {
          toast.error(res.message || '创建失败');
        }
      }
      setIsModalOpen(false);
      setFormData({ name: '', description: '' });
    } catch {
      toast.error('保存失败，请重试');
    }
  };

  const handleDelete = async (id: number) => {
    if (!(await confirmAction({ title: '删除项目', message: '确定要删除这个项目吗？项目下的任务将一并删除。', confirmText: '删除', danger: true }))) return;
    setOpenMenuId(null);
    try {
      const res = await projectAPI.delete(id);
      if (res.success) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
        deleteProject(id);
        toast.success('项目已删除');
      } else {
        toast.error(res.message || '删除失败');
      }
    } catch {
      toast.error('删除失败，请重试');
    }
  };

  const handleCopy = async (project: Project) => {
    setOpenMenuId(null);
    try {
      const res = await projectAPI.create({
        name: `${project.name} (副本)`,
        description: project.description,
        start_date: project.start_date,
        end_date: project.end_date,
      });
      if (res.success) {
        setProjects((prev) => [res.data, ...prev]);
        addProject(res.data);
        toast.success('已复制项目');
      } else {
        toast.error(res.message || '复制失败');
      }
    } catch {
      toast.error('复制失败，请重试');
    }
  };

  const handleArchive = async (project: Project) => {
    setOpenMenuId(null);
    try {
      const res = await projectAPI.update(project.id, { status: 'paused' });
      if (res.success) {
        setProjects((prev) => prev.map((p) => (p.id === project.id ? res.data : p)));
        updateProject(res.data);
        toast.success('项目已归档');
      } else {
        toast.error(res.message || '归档失败');
      }
    } catch {
      toast.error('归档失败，请重试');
    }
  };

  return (
    <div className="animate-fade-in space-y-4">
      {/* 工具栏 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索项目名称或描述..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${inputCls} w-full pl-9`}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={inputCls}
          >
            <option value="all">全部状态</option>
            <option value="active">进行中</option>
            <option value="completed">已完成</option>
            <option value="paused">已暂停</option>
            <option value="cancelled">已取消</option>
          </select>
          <span className="text-xs text-gray-400">共 {filteredProjects.length} 个项目</span>
        </div>
        <Button size="sm" onClick={handleOpenCreate}>
          <Plus className="h-4 w-4" /> 创建项目
        </Button>
      </div>

      {/* 项目卡片网格 */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <EmptyState
            icon={FolderKanban}
            title={searchQuery ? '没有匹配的项目' : '暂无项目'}
            description={searchQuery ? '换个关键词试试' : '创建第一个项目，跟踪进度与任务'}
            action={<Button onClick={handleOpenCreate}>创建项目</Button>}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              onClick={() => navigate(`/projects/${project.id}`)}
              className="group cursor-pointer rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:border-gray-300 hover:shadow-md"
            >
              <div className="p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-accent-50">
                      <FolderKanban className="h-[18px] w-[18px] text-accent-600" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-gray-900">{project.name}</h3>
                      <p className="mt-0.5 text-xs text-gray-400">
                        {project.start_date ? `${project.start_date} ~ ${project.end_date || '进行中'}` : '未排期'}
                      </p>
                    </div>
                  </div>
                  <div
                    className="relative flex-shrink-0"
                    ref={openMenuId === project.id ? menuRef : undefined}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => setOpenMenuId(openMenuId === project.id ? null : project.id)}
                      className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                      title="更多操作"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                    {openMenuId === project.id && (
                      <div className="absolute right-0 top-9 z-50 w-40 rounded-lg border border-gray-200 bg-white py-1.5 shadow-lg">
                        <button
                          onClick={() => handleOpenEdit(project)}
                          className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50"
                        >
                          <Edit className="h-3.5 w-3.5" /> 编辑
                        </button>
                        <button
                          onClick={() => handleCopy(project)}
                          className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50"
                        >
                          <Copy className="h-3.5 w-3.5" /> 复制
                        </button>
                        {project.status !== 'paused' && project.status !== 'completed' && (
                          <button
                            onClick={() => handleArchive(project)}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50"
                          >
                            <Archive className="h-3.5 w-3.5" /> 归档
                          </button>
                        )}
                        <div className="my-1 border-t border-gray-100" />
                        <button
                          onClick={() => handleDelete(project.id)}
                          className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> 删除
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {project.description && (
                  <p className="mb-3 line-clamp-2 min-h-[2.5rem] text-xs leading-relaxed text-gray-500">
                    {project.description}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <ProjectStatusBadge status={project.status} />
                  <span className="text-xs font-medium tabular-nums text-gray-500">{project.progress}%</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      project.status === 'completed' ? 'bg-emerald-500' : 'bg-accent-500'
                    }`}
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 新建/编辑弹窗 */}
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
            <label className="mb-1 block text-sm font-medium text-gray-700">项目名称 *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`${inputCls} w-full`}
              placeholder="请输入项目名称"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">项目描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={`${inputCls} w-full resize-none`}
              rows={4}
              placeholder="请输入项目描述..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">开始日期</label>
              <input
                type="date"
                value={formData.start_date || ''}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className={`${inputCls} w-full`}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">结束日期</label>
              <input
                type="date"
                value={formData.end_date || ''}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className={`${inputCls} w-full`}
              />
            </div>
          </div>
          {modalMode === 'edit' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">项目状态</label>
                <select
                  value={formData.status || 'active'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className={`${inputCls} w-full`}
                >
                  <option value="active">进行中</option>
                  <option value="completed">已完成</option>
                  <option value="paused">已暂停</option>
                  <option value="cancelled">已取消</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">项目进度 (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progress ?? 0}
                  onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })}
                  className={`${inputCls} w-full`}
                />
              </div>
            </div>
          )}
          <div className="flex items-center justify-end gap-2 pt-1">
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
