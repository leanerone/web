import { useState, useEffect, useMemo } from 'react';
import { Search, Edit, Trash2, UserPlus, Users } from 'lucide-react';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import EmptyState from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { RoleBadge, UserStatusBadge } from '@/components/ui/Badge';
import { toast } from '@/components/ui/Toast';
import { confirmAction } from '@/components/ui/ConfirmDialog';
import { userAPI } from '@/services/api';
import type { User } from '@/types';

const inputCls =
  'rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 transition-colors focus:border-accent-500 focus:bg-white focus:outline-none';

const labelCls = 'mb-1 block text-sm font-medium text-gray-700';

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    display_name: '',
    email: '',
    role: 'user',
    department: '',
    team: '',
    status: 'active',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await userAPI.list();
      if (res.success) {
        setUsers(res.data);
      } else {
        toast.error(res.message || '用户列表加载失败');
      }
    } catch {
      toast.error('用户列表加载失败，请检查后端服务');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(
    () =>
      users.filter(
        (user) =>
          user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [users, searchQuery]
  );

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingUser(null);
    setFormData({
      username: '',
      display_name: '',
      email: '',
      role: 'user',
      department: '',
      team: '',
      status: 'active',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setModalMode('edit');
    setEditingUser(user);
    setFormData({
      username: user.username,
      display_name: user.display_name,
      email: user.email,
      role: user.role,
      department: user.department,
      team: user.team,
      status: user.status,
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.username) return;
    try {
      if (modalMode === 'edit' && editingUser) {
        const res = await userAPI.update(editingUser.id, formData);
        if (res.success) {
          setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? res.data : u)));
          toast.success('用户已保存');
        } else {
          toast.error(res.message || '保存失败');
        }
      } else {
        const res = await userAPI.create(formData);
        if (res.success) {
          setUsers((prev) => [...prev, res.data]);
          toast.success('用户已添加');
        } else {
          toast.error(res.message || '添加失败');
        }
      }
      setIsModalOpen(false);
    } catch {
      toast.error('保存失败，请重试');
    }
  };

  const handleDelete = async (id: number) => {
    if (!(await confirmAction({ title: '删除用户', message: '确定要删除这个用户吗？', confirmText: '删除', danger: true }))) return;
    try {
      const res = await userAPI.delete(id);
      if (res.success) {
        setUsers((prev) => prev.filter((u) => u.id !== id));
        toast.success('用户已删除');
      } else {
        toast.error(res.message || '删除失败');
      }
    } catch {
      toast.error('删除失败，请重试');
    }
  };

  return (
    <div className="animate-fade-in space-y-4">
      {/* 工具栏 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索用户名、显示名、邮箱..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`${inputCls} w-full pl-9`}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">共 {filteredUsers.length} 位用户</span>
          <Button size="sm" onClick={handleOpenCreate}>
            <UserPlus className="h-4 w-4" /> 添加用户
          </Button>
        </div>
      </div>

      {/* 用户表格 */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <EmptyState
            icon={Users}
            title={searchQuery ? '没有匹配的用户' : '暂无用户'}
            description={searchQuery ? '换个关键词试试' : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60 text-left text-xs font-medium text-gray-500">
                  <th className="px-4 py-2.5 font-medium">用户</th>
                  <th className="px-4 py-2.5 font-medium">邮箱</th>
                  <th className="px-4 py-2.5 font-medium">角色</th>
                  <th className="px-4 py-2.5 font-medium">部门 / 团队</th>
                  <th className="px-4 py-2.5 font-medium">状态</th>
                  <th className="px-4 py-2.5 text-right font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="group transition-colors hover:bg-gray-50">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full brand-gradient">
                          <span className="text-xs font-semibold text-white">
                            {user.display_name?.charAt(0).toUpperCase() || user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{user.display_name || user.username}</p>
                          <p className="text-xs text-gray-400">@{user.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-gray-500">{user.email || '-'}</td>
                    <td className="px-4 py-2.5">
                      <RoleBadge value={user.role} />
                    </td>
                    <td className="px-4 py-2.5 text-gray-500">
                      {[user.department, user.team].filter(Boolean).join(' · ') || '-'}
                    </td>
                    <td className="px-4 py-2.5">
                      <UserStatusBadge status={user.status} />
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-accent-600"
                          title="编辑"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          title="删除"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 新建/编辑弹窗 */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'edit' ? '编辑用户' : '添加用户'}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>用户名 *</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                disabled={modalMode === 'edit'}
                className={`${inputCls} w-full disabled:opacity-50`}
                placeholder="请输入用户名"
              />
            </div>
            <div>
              <label className={labelCls}>显示名</label>
              <input
                type="text"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                className={`${inputCls} w-full`}
                placeholder="请输入显示名"
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>邮箱</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`${inputCls} w-full`}
              placeholder="请输入邮箱"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>角色</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className={`${inputCls} w-full`}
              >
                <option value="admin">管理员</option>
                <option value="engineer">工程师</option>
                <option value="user">普通用户</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>状态</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className={`${inputCls} w-full`}
              >
                <option value="active">启用</option>
                <option value="inactive">停用</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>部门</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className={`${inputCls} w-full`}
                placeholder="请输入部门"
              />
            </div>
            <div>
              <label className={labelCls}>团队</label>
              <input
                type="text"
                value={formData.team}
                onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                className={`${inputCls} w-full`}
                placeholder="请输入团队"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={!formData.username}>
              {modalMode === 'edit' ? '保存修改' : '添加用户'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
