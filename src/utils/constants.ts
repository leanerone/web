// 认证 token 在 localStorage 中的存储键
export const AUTH_STORAGE_KEY = 'cim_auth';

// 工作项状态样式与标签
export const workStatusColors: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  blocked: 'bg-red-100 text-red-700',
};

export const workStatusLabels: Record<string, string> = {
  pending: '待处理',
  in_progress: '进行中',
  completed: '已完成',
  blocked: '受阻',
};

// 紧急度样式与标签
export const urgencyColors: Record<string, string> = {
  na: 'bg-gray-100 text-gray-500',
  low: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
};

export const urgencyLabels: Record<string, string> = {
  na: 'N/A',
  low: '低',
  medium: '中',
  high: '高',
};

// 重要度样式与标签
export const importanceColors: Record<string, string> = {
  na: 'bg-gray-100 text-gray-500',
  low: 'bg-green-100 text-green-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-purple-100 text-purple-700',
};

export const importanceLabels: Record<string, string> = {
  na: 'N/A',
  low: '低',
  medium: '中',
  high: '高',
};

// 用户角色
export const getRoleLabel = (role: string): string => {
  const labels: Record<string, string> = {
    admin: '管理员',
    engineer: '工程师',
    user: '普通用户',
  };
  return labels[role] || role;
};

export const getRoleColor = (role: string): string => {
  const colors: Record<string, string> = {
    admin: 'bg-red-50 text-red-600',
    engineer: 'bg-blue-50 text-blue-600',
    user: 'bg-gray-100 text-gray-600',
  };
  return colors[role] || 'bg-gray-100 text-gray-600';
};
