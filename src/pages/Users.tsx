import { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Shield,
  UserPlus,
  X,
  Check,
} from 'lucide-react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { userAPI } from '@/services/api';
import type { User } from '@/types';

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
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
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
          setUsers((prev) => prev.map((u) => u.id === editingUser.id ? res.data : u));
        }
      } else {
        const res = await userAPI.create(formData);
        if (res.success) {
          setUsers((prev) => [...prev, res.data]);
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save user:', err);
      alert('保存失败，请重试');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个用户吗？')) return;
    try {
      await userAPI.delete(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      console.error('Failed to delete user:', err);
      alert('删除失败，请重试');
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: '管理员',
      engineer: '工程师',
      user: '普通用户',
    };
    return labels[role] || role;
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-50 text-red-600',
      engineer: 'bg-blue-50 text-blue-600',
      user: 'bg-gray-100 text-gray-600',
    };
    return colors[role] || 'bg-gray-100 text-gray-600';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: '正常',
      inactive: '停用',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    return status === 'active'
      ? 'bg-green-50 text-green-600'
      : 'bg-gray-100 text-gray-500';
  };

  return (
    <div className="animate-fade-in p-6">
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">用户管理</h2>
              <p className="text-sm text-gray-500">管理系统用户和权限</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索用户..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-cyan-500 w-64"
              />
            </div>
            <Button onClick={handleOpenCreate}>
              <UserPlus className="w-4 h-4" />
              添加用户
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 border-b border-gray-200">
                <th className="pb-3 px-4">用户名</th>
                <th className="pb-3 px-4">显示名</th>
                <th className="pb-3 px-4">邮箱</th>
                <th className="pb-3 px-4">角色</th>
                <th className="pb-3 px-4">部门</th>
                <th className="pb-3 px-4">团队</th>
                <th className="pb-3 px-4">状态</th>
                <th className="pb-3 px-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="border-b border-gray-100">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((j) => (
                      <td key={j} className="py-3 px-4">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>暂无用户</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                          <span className="text-xs font-bold text-white">
                            {user.display_name?.charAt(0).toUpperCase() || user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-800">{user.username}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{user.display_name || '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{user.email || '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                        <Shield className="w-3 h-3" />
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{user.department || '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{user.team || '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                        {user.status === 'active' ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        {getStatusLabel(user.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(user)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => handleDelete(user.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'edit' ? '编辑用户' : '添加用户'}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">用户名 *</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                disabled={modalMode === 'edit'}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                placeholder="请输入用户名"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">显示名</label>
              <input
                type="text"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-cyan-500"
                placeholder="请输入显示名"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-cyan-500"
              placeholder="请输入邮箱"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-cyan-500"
              >
                <option value="admin">管理员</option>
                <option value="engineer">工程师</option>
                <option value="user">普通用户</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-cyan-500"
              >
                <option value="active">正常</option>
                <option value="inactive">停用</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">部门</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-cyan-500"
                placeholder="请输入部门"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">团队</label>
              <input
                type="text"
                value={formData.team}
                onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-cyan-500"
                placeholder="请输入团队"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-4">
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
