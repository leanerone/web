import type { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: { value: number; label: string };
  color: 'cyan' | 'green' | 'orange' | 'purple';
}

const colorStyles = {
  cyan: {
    bg: 'bg-cyan-50',
    icon: 'text-cyan-600',
    border: 'border-cyan-100',
  },
  green: {
    bg: 'bg-green-50',
    icon: 'text-green-600',
    border: 'border-green-100',
  },
  orange: {
    bg: 'bg-orange-50',
    icon: 'text-orange-600',
    border: 'border-orange-100',
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'text-purple-600',
    border: 'border-purple-100',
  },
};

export default function StatsCard({ title, value, icon, trend, color }: StatsCardProps) {
  const styles = colorStyles[color];
  
  return (
    <div className={`bg-white border ${styles.border} rounded-xl p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}>
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-lg ${styles.bg}`}>
          <div className={styles.icon}>{icon}</div>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${
            trend.value >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            <span>{trend.value >= 0 ? '+' : ''}{trend.value}%</span>
            <span className="text-gray-500">{trend.label}</span>
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-sm text-gray-500 mt-1">{title}</p>
      </div>
    </div>
  );
}
