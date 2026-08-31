import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  TrendingUp,
  CheckCircle2,
  Clock,
  Plus,
  Edit,
  Trash2,
  Target,
  Save,
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { projectAPI, taskAPI } from '@/services/api';
import type { Project, Task } from '@/types';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  const [editProject, setEditProject] = useState<Partial<Project>>({});
  const [savingProject, setSavingProject] = useState(false);
  const [formData, setFormData] = useState<Partial<Task>>({ title: '', priority: 'medium' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjectDetail = async () => {
      const projectId = parseInt(id || '0');
      try {
        const projectRes = await projectAPI.get(projectId);
        if (projectRes.success) {
          setProject(projectRes.data);
        }

        const tasksRes = await taskAPI.list(projectId);
        if (tasksRes.success) {
          setProjectTasks(tasksRes.data);
        }
      } catch (err) {
        console.error('Failed to fetch project detail:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjectDetail();
  }, [id]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: 'bg-green-500',
      in_progress: 'bg-cyan-500',
      pending: 'bg-gray-400',
      blocked: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-400';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      completed: '已完成',
      in_progress: '进行中',
      pending: '待处理',
      blocked: '阻塞',
    };
    return labels[status] || status;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-50 text-red-600',
      high: 'bg-orange-50 text-orange-600',
      medium: 'bg-blue-50 text-blue-600',
      low: 'bg-gray-50 text-gray-500',
    };
    return colors[priority] || 'bg-gray-50 text-gray-500';
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      critical: '紧急',
      high: '高',
      medium: '中',
      low: '低',
    };
    return labels[priority] || priority;
  };

  const handleCreateTask = async () => {
    if (!formData.title || !project) return;
    try {
      const res = await taskAPI.create({
        project_id: project.id,
        title: formData.title,
        description: formData.description,
        priority: (formData.priority as Task['priority']) || 'medium',
        due_date: formData.due_date,
      });
      if (res.success) {
        setProjectTasks((prev) => [...prev, res.data]);
        // 创建任务后刷新项目进度
        const refreshed = await projectAPI.get(project.id);
        if (refreshed.success) setProject(refreshed.data);
      }
    } catch (err) {
      console.error('Failed to create task:', err);
    }
    setIsCreateTaskModalOpen(false);
    setFormData({ title: '', priority: 'medium' });
  };

  // 切换任务完成状态 (checkbox)
  const handleToggleTask = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    // 乐观更新
    setProjectTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)));
    try {
      const res = await taskAPI.update(task.id, { status: newStatus });
      if (!res.success) {
        // 回滚
        setProjectTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t)));
        alert('状态更新失败');
        return;
      }
      // 刷新项目进度
      if (project) {
        const refreshed = await projectAPI.get(project.id);
        if (refreshed.success) setProject(refreshed.data);
      }
    } catch (err) {
      console.error('Failed to toggle task:', err);
      setProjectTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t)));
    }
  };

  // 删除任务
  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('确定删除该任务？')) return;
    setProjectTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      const res = await taskAPI.delete(taskId);
      if (res.success) {
        if (project) {
          const refreshed = await projectAPI.get(project.id);
          if (refreshed.success) setProject(refreshed.data);
        }
      }
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  // 编辑项目: 初始化弹窗数据
  const openEditProject = () => {
    if (!project) return;
    setEditProject({
      name: project.name,
      description: project.description,
      status: project.status,
      start_date: project.start_date,
      end_date: project.end_date,
      progress: project.progress,
    });
    setIsEditProjectModalOpen(true);
  };

  // 保存项目编辑
  const handleSaveProject = async () => {
    if (!project || !editProject.name) return;
    setSavingProject(true);
    try {
      const res = await projectAPI.update(project.id, {
        name: editProject.name,
        description: editProject.description,
        status: (editProject.status as Project['status']) || project.status,
        start_date: editProject.start_date,
        end_date: editProject.end_date,
      });
      if (res.success) {
        setProject({ ...project, ...res.data });
      } else {
        alert('保存失败: ' + (res.message || ''));
      }
    } catch (err) {
      console.error('Failed to update project:', err);
      alert('保存失败，请重试');
    } finally {
      setSavingProject(false);
    }
    setIsEditProjectModalOpen(false);
  };

  // 删除项目
  const handleDeleteProject = async () => {
    if (!project) return;
    if (!confirm(`确定删除项目"${project.name}"？此操作不可撤销，关联任务将一并删除。`)) return;
    try {
      const res = await projectAPI.delete(project.id);
      if (res.success) {
        navigate('/projects');
      } else {
        alert('删除失败: ' + (res.message || ''));
      }
    } catch (err) {
      console.error('Failed to delete project:', err);
      alert('删除失败，请重试');
    }
  };

  const calculateTaskProgress = () => {
    const total = projectTasks.length;
    const completed = projectTasks.filter((t) => t.status === 'completed').length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const getGanttBarStyle = (task: Task, index: number) => {
    const startDate = new Date(project?.start_date || new Date());
    const endDate = new Date(project?.end_date || new Date());
    const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

    const taskStart = new Date(task.created_at);
    const taskEnd = new Date(task.due_date || project?.end_date || new Date());

    const left = Math.max(0, ((taskStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) / totalDays * 100);
    const width = Math.min(100 - left, ((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24)) / totalDays * 100);

    return {
      top: `${index * 28 + 8}px`,
      left: `${left}%`,
      width: `${width}%`,
    };
  };

  if (loading || !project) {
    return (
      <div className="p-6 animate-fade-in">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate('/projects')}>
            <ArrowLeft className="w-4 h-4" />
            返回项目列表
          </Button>
        </div>
        <div className="animate-pulse">
          <div className="h-12 bg-gray-100 rounded-lg mb-4" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="h-40 bg-gray-100 rounded-xl" />
            <div className="h-40 bg-gray-100 rounded-xl" />
            <div className="h-40 bg-gray-100 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/projects')}>
            <ArrowLeft className="w-4 h-4" />
            返回项目列表
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{project.name}</h1>
            <p className="text-sm text-gray-500">{project.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={openEditProject}>
            <Edit className="w-4 h-4" />
            编辑项目
          </Button>
          <Button variant="danger" size="sm" onClick={handleDeleteProject}>
            <Trash2 className="w-4 h-4" />
            删除项目
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">项目进度</p>
              <p className="text-3xl font-bold text-gray-800">{project.progress}%</p>
            </div>
            <div className="w-16 h-16 rounded-full bg-cyan-50 flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-cyan-600" />
            </div>
          </div>
          <div className="mt-4 h-3 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-500"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">任务完成率</p>
              <p className="text-3xl font-bold text-gray-800">{calculateTaskProgress()}%</p>
            </div>
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">已完成</span>
              <span className="text-gray-800">{projectTasks.filter(t => t.status === 'completed').length} / {projectTasks.length}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-500"
                style={{ width: `${calculateTaskProgress()}%` }}
              />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">项目状态</p>
              <p className="text-xl font-bold text-gray-800">
                {project.status === 'active' ? '进行中' : 
                 project.status === 'completed' ? '已完成' :
                 project.status === 'paused' ? '已暂停' : '已取消'}
              </p>
            </div>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              project.status === 'active' ? 'bg-cyan-50' :
              project.status === 'completed' ? 'bg-green-50' :
              project.status === 'paused' ? 'bg-orange-50' : 'bg-gray-50'
            }`}>
              <Target className={`w-8 h-8 ${
                project.status === 'active' ? 'text-cyan-600' :
                project.status === 'completed' ? 'text-green-600' :
                project.status === 'paused' ? 'text-orange-600' : 'text-gray-500'
              }`} />
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>开始: {project.start_date}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>结束: {project.end_date}</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="项目甘特图">
          <div className="relative h-80 bg-gray-50 rounded-lg border border-gray-200">
            <div className="absolute top-0 left-0 right-0 h-8 bg-gray-100 border-b border-gray-200 flex items-center px-4">
              <div className="w-48 flex-shrink-0 text-sm font-medium text-gray-600">任务名称</div>
              <div className="flex-1 flex justify-between text-xs text-gray-500">
                <span>{project.start_date}</span>
                <span>{project.end_date}</span>
              </div>
            </div>
            <div className="absolute top-8 left-0 right-0 bottom-0 overflow-y-auto">
              <div className="relative">
                {projectTasks.map((task, index) => (
                  <div key={task.id} className="h-28 border-b border-gray-100 relative">
                    <div className="absolute left-0 top-0 w-48 h-full px-4 flex flex-col justify-center">
                      <p className="text-sm font-medium text-gray-800 truncate">{task.title}</p>
                      <p className="text-xs text-gray-500">{task.due_date}</p>
                    </div>
                    <div className="absolute left-48 top-0 right-0 h-full">
                      <div 
                        className={`absolute h-4 rounded-full ${getStatusColor(task.status)} opacity-80`}
                        style={getGanttBarStyle(task, index)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-green-500" />
              <span className="text-xs text-gray-600">已完成</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-cyan-500" />
              <span className="text-xs text-gray-600">进行中</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-gray-400" />
              <span className="text-xs text-gray-600">待处理</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-red-500" />
              <span className="text-xs text-gray-600">阻塞</span>
            </div>
          </div>
        </Card>

        <Card title="任务状态概览">
          <div className="space-y-4">
            {(() => {
              const total = projectTasks.length;
              const byStatus = {
                completed: projectTasks.filter((t) => t.status === 'completed').length,
                in_progress: projectTasks.filter((t) => t.status === 'in_progress').length,
                pending: projectTasks.filter((t) => t.status === 'pending').length,
                blocked: projectTasks.filter((t) => t.status === 'blocked').length,
              };
              const items = [
                { label: '已完成', count: byStatus.completed, color: 'bg-green-500', text: 'text-green-600' },
                { label: '进行中', count: byStatus.in_progress, color: 'bg-cyan-500', text: 'text-cyan-600' },
                { label: '待处理', count: byStatus.pending, color: 'bg-gray-400', text: 'text-gray-500' },
                { label: '阻塞', count: byStatus.blocked, color: 'bg-red-500', text: 'text-red-600' },
              ];
              return (
                <>
                  {items.map((it) => (
                    <div key={it.label} className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${it.color}`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-gray-700">{it.label}</p>
                          <span className={`text-sm font-semibold ${it.text}`}>
                            {it.count} 个 {total > 0 ? `(${Math.round((it.count / total) * 100)}%)` : ''}
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${it.color} transition-all duration-500`}
                            style={{ width: `${total > 0 ? (it.count / total) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {total === 0 && (
                    <p className="text-center text-sm text-gray-400 py-2">暂无任务，点击右上方"添加任务"开始</p>
                  )}
                </>
              );
            })()}
          </div>
        </Card>
      </div>

      <Card title="任务列表" className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              共 {projectTasks.length} 个任务
            </span>
            <span className="text-sm text-green-600">
              {projectTasks.filter(t => t.status === 'completed').length} 个已完成
            </span>
          </div>
          <Button onClick={() => setIsCreateTaskModalOpen(true)}>
            <Plus className="w-4 h-4" />
            添加任务
          </Button>
        </div>

        <div className="space-y-3">
          {projectTasks.length === 0 ? (
            <div className="py-8 text-center text-gray-400">
              <p>暂无任务</p>
              <Button onClick={() => setIsCreateTaskModalOpen(true)} className="mt-4">
                <Plus className="w-4 h-4" />
                添加第一个任务
              </Button>
            </div>
          ) : (
            projectTasks.map((task) => (
              <div 
                key={task.id} 
                className={`p-4 rounded-lg border transition-all ${
                  task.status === 'completed' 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-white border-gray-200 hover:border-cyan-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleTask(task)}
                      title={task.status === 'completed' ? '标记为待处理' : '标记为已完成'}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        task.status === 'completed'
                          ? 'bg-green-500 border-green-500'
                          : 'border-gray-300 hover:border-cyan-500'
                      }`}
                    >
                      {task.status === 'completed' && (
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      )}
                    </button>
                    <div>
                      <h4 className={`font-medium ${task.status === 'completed' ? 'text-green-700 line-through' : 'text-gray-800'}`}>
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPriorityColor(task.priority)}`}>
                      {getPriorityLabel(task.priority)}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      task.status === 'completed' ? 'bg-green-50 text-green-600' :
                      task.status === 'in_progress' ? 'bg-cyan-50 text-cyan-600' :
                      'bg-gray-50 text-gray-500'
                    }`}>
                      {getStatusLabel(task.status)}
                    </span>
                    {task.due_date && (
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        {task.due_date}
                      </div>
                    )}
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      title="删除任务"
                      className="inline-flex items-center justify-center w-7 h-7 rounded text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Modal 
        isOpen={isCreateTaskModalOpen} 
        onClose={() => {
          setIsCreateTaskModalOpen(false);
          setFormData({ title: '', priority: 'medium' });
        }} 
        title="添加任务"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">任务名称 *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-cyan-500"
              placeholder="请输入任务名称"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">任务描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-cyan-500 resize-none"
              rows={3}
              placeholder="请输入任务描述..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">优先级</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as Task['priority'] })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-cyan-500"
              >
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
                <option value="critical">紧急</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">截止日期</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setIsCreateTaskModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreateTask} disabled={!formData.title}>
              添加任务
            </Button>
          </div>
        </div>
      </Modal>

      {/* 编辑项目弹窗 */}
      <Modal
        isOpen={isEditProjectModalOpen}
        onClose={() => setIsEditProjectModalOpen(false)}
        title="编辑项目"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">项目名称 *</label>
            <input
              type="text"
              value={editProject.name || ''}
              onChange={(e) => setEditProject({ ...editProject, name: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-cyan-500"
              placeholder="项目名称"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">项目描述</label>
            <textarea
              value={editProject.description || ''}
              onChange={(e) => setEditProject({ ...editProject, description: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-cyan-500 resize-none"
              rows={3}
              placeholder="项目描述..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">项目状态</label>
              <select
                value={editProject.status || 'active'}
                onChange={(e) => setEditProject({ ...editProject, status: e.target.value as Project['status'] })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-cyan-500"
              >
                <option value="active">进行中</option>
                <option value="paused">已暂停</option>
                <option value="completed">已完成</option>
                <option value="cancelled">已取消</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">当前进度</label>
              <div className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700">
                {editProject.progress ?? 0}% <span className="text-xs text-gray-400">(由任务自动计算)</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
              <input
                type="date"
                value={editProject.start_date || ''}
                onChange={(e) => setEditProject({ ...editProject, start_date: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
              <input
                type="date"
                value={editProject.end_date || ''}
                onChange={(e) => setEditProject({ ...editProject, end_date: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setIsEditProjectModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveProject} disabled={savingProject || !editProject.name}>
              <Save className="w-4 h-4" />
              {savingProject ? '保存中...' : '保存'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
