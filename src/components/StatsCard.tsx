import type { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: { value: number; label: string };
  color: 'accent' | 'green' | 'orange' | 'purple';
  onClick?: () => void;
}

const colorStyles = {
  accent: { bg: 'bg-accent-50', icon: 'text-accent-600' },
  green: { bg: 'bg-emerald-50', icon: 'text-emerald-600' },
  orange: { bg: 'bg-amber-50', icon: 'text-amber-600' },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-600' },
};

export default function StatsCard({ title, value, icon, trend, color, onClick }: StatsCardProps) {
  const styles = colorStyles[color];

  return (
    <div
      onClick={onClick}
      className={`rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow ${
        onClick ? 'cursor-pointer hover:border-gray-300 hover:shadow-md' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${styles.bg} ${styles.icon}`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-xs font-medium ${trend.value >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-semibold tabular-nums text-gray-900">{value}</p>
      <p className="mt-0.5 text-xs text-gray-400">{title}</p>
    </div>
  );
}
