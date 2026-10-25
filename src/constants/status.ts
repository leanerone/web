/**
 * 全项目唯一的状态/优先级 → 颜色 + 中文文案映射。
 * 任何页面不得再本地定义 getStatusColor/getPriorityColor 等重复函数。
 */

export type Tone = 'gray' | 'blue' | 'accent' | 'amber' | 'red' | 'emerald' | 'purple';

export interface BadgeStyle {
  label: string;
  tone: Tone;
  /** 软底徽章样式 */
  className: string;
  /** 实心圆点颜色 */
  dot: string;
}

const toneStyles: Record<Tone, { className: string; dot: string }> = {
  gray: { className: 'bg-gray-100 text-gray-600 ring-gray-200', dot: 'bg-gray-400' },
  blue: { className: 'bg-blue-50 text-blue-700 ring-blue-200', dot: 'bg-blue-500' },
  accent: { className: 'bg-accent-50 text-accent-700 ring-accent-200', dot: 'bg-accent-500' },
  amber: { className: 'bg-amber-50 text-amber-700 ring-amber-200', dot: 'bg-amber-500' },
  red: { className: 'bg-red-50 text-red-700 ring-red-200', dot: 'bg-red-500' },
  emerald: { className: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
  purple: { className: 'bg-purple-50 text-purple-700 ring-purple-200', dot: 'bg-purple-500' },
};

function make(map: Record<string, { label: string; tone: Tone }>) {
  const labels: Record<string, string> = {};
  const styles: Record<string, BadgeStyle> = {};
  for (const [key, v] of Object.entries(map)) {
    labels[key] = v.label;
    styles[key] = { label: v.label, tone: v.tone, ...toneStyles[v.tone] };
  }
  return {
    labels,
    styles,
    label(key?: string | null): string {
      return (key && labels[key]) || key || '—';
    },
    style(key?: string | null): BadgeStyle {
      return (key && styles[key]) || { label: key || '—', tone: 'gray', ...toneStyles.gray };
    },
  };
}

/** 工作项/任务状态: pending | in_progress | completed | blocked */
export const taskStatus = make({
  pending: { label: '待处理', tone: 'gray' },
  in_progress: { label: '进行中', tone: 'blue' },
  completed: { label: '已完成', tone: 'emerald' },
  blocked: { label: '已阻塞', tone: 'red' },
});

/** 需求状态: dev | testing | deploying | completed (+pending/in_progress/rejected 容错) */
export const requirementStatus = make({
  pending: { label: '待处理', tone: 'gray' },
  dev: { label: '开发中', tone: 'blue' },
  in_progress: { label: '进行中', tone: 'blue' },
  testing: { label: '测试中', tone: 'amber' },
  deploying: { label: '上线中', tone: 'purple' },
  completed: { label: '已完成', tone: 'emerald' },
  rejected: { label: '已拒绝', tone: 'red' },
});

/** 项目状态: active | completed | paused | cancelled */
export const projectStatus = make({
  active: { label: '进行中', tone: 'emerald' },
  completed: { label: '已完成', tone: 'blue' },
  paused: { label: '已暂停', tone: 'amber' },
  cancelled: { label: '已取消', tone: 'gray' },
});

/** 机台状态: online | offline | maintenance | decommissioned */
export const equipmentStatus = make({
  online: { label: '在线', tone: 'emerald' },
  offline: { label: '离线', tone: 'red' },
  maintenance: { label: '维护中', tone: 'amber' },
  decommissioned: { label: '已停用', tone: 'gray' },
});

/** 优先级: low | medium | high | critical */
export const priority = make({
  low: { label: '低', tone: 'gray' },
  medium: { label: '中', tone: 'blue' },
  high: { label: '高', tone: 'amber' },
  critical: { label: '紧急', tone: 'red' },
});

/** 紧急度/重要性(工作项四档): na | low | medium | high */
export const level = make({
  na: { label: '—', tone: 'gray' },
  low: { label: '低', tone: 'gray' },
  medium: { label: '中', tone: 'blue' },
  high: { label: '高', tone: 'amber' },
});

/** 用户角色 */
export const role = make({
  admin: { label: '管理员', tone: 'purple' },
  manager: { label: '管理者', tone: 'blue' },
  engineer: { label: '工程师', tone: 'accent' },
  user: { label: '普通用户', tone: 'gray' },
});

/** 用户状态 */
export const userStatus = make({
  active: { label: '启用', tone: 'emerald' },
  inactive: { label: '停用', tone: 'gray' },
  disabled: { label: '已禁用', tone: 'red' },
});

/** 优先级分数(工作项 AI 排序分 0-10) */
export function priorityScoreStyle(score: number): BadgeStyle {
  if (score >= 8) return { label: score.toFixed(1), tone: 'red', ...toneStyles.red };
  if (score >= 5) return { label: score.toFixed(1), tone: 'amber', ...toneStyles.amber };
  if (score >= 3) return { label: score.toFixed(1), tone: 'blue', ...toneStyles.blue };
  return { label: score.toFixed(1), tone: 'gray', ...toneStyles.gray };
}
