import {
  level,
  priority,
  requirementStatus,
  projectStatus,
  equipmentStatus,
  taskStatus,
  userStatus,
  role,
} from '@/constants/status';

export interface BadgeProps {
  children: React.ReactNode;
  tone?: keyof typeof toneClass;
  className?: string;
  /** 可选：前置小圆点 */
  dot?: boolean;
}

const toneClass = {
  gray: 'bg-gray-100 text-gray-600 ring-gray-200',
  blue: 'bg-blue-50 text-blue-700 ring-blue-200',
  accent: 'bg-accent-50 text-accent-700 ring-accent-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  purple: 'bg-purple-50 text-purple-700 ring-purple-200',
} as const;

const dotClass = {
  gray: 'bg-gray-400',
  blue: 'bg-blue-500',
  accent: 'bg-accent-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  emerald: 'bg-emerald-500',
  purple: 'bg-purple-500',
} as const;

export default function Badge({ children, tone = 'gray', className = '', dot = false }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${toneClass[tone]} ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dotClass[tone]}`} />}
      {children}
    </span>
  );
}

// ── 语义徽章：页面统一从这里取，替代各页自写的 getStatusColor ──

type Style = ReturnType<typeof taskStatus.style>;

export function TaskStatusBadge({ status }: { status?: string | null }) {
  const s: Style = taskStatus.style(status);
  return <Badge tone={s.tone} dot>{s.label}</Badge>;
}

export function RequirementStatusBadge({ status }: { status?: string | null }) {
  const s = requirementStatus.style(status);
  return <Badge tone={s.tone} dot>{s.label}</Badge>;
}

export function ProjectStatusBadge({ status }: { status?: string | null }) {
  const s = projectStatus.style(status);
  return <Badge tone={s.tone} dot>{s.label}</Badge>;
}

export function EquipmentStatusBadge({ status }: { status?: string | null }) {
  const s = equipmentStatus.style(status);
  return <Badge tone={s.tone} dot>{s.label}</Badge>;
}

export function PriorityBadge({ value }: { value?: string | null }) {
  const s = priority.style(value);
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export function LevelBadge({ value }: { value?: string | null }) {
  const s = level.style(value);
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export function UserStatusBadge({ status }: { status?: string | null }) {
  const s = userStatus.style(status);
  return <Badge tone={s.tone} dot>{s.label}</Badge>;
}

export function RoleBadge({ value }: { value?: string | null }) {
  const s = role.style(value);
  return <Badge tone={s.tone}>{s.label}</Badge>;
}
