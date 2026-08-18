import type { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: { value: number; label: string };
  color: 'brand' | 'emerald' | 'amber' | 'violet';
}

// 统一到低饱和品牌色系，去掉 scale 放大，只保留 lift 阴影过渡
const colorStyles = {
  brand: { bg: 'bg-brand-50', icon: 'text-brand-600' },
  emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600' },
  amber: { bg: 'bg-amber-50', icon: 'text-amber-600' },
  violet: { bg: 'bg-violet-50', icon: 'text-violet-600' },
};

export default function StatsCard({ title, value, icon, trend, color }: StatsCardProps) {
  const styles = colorStyles[color];

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-soft transition-all duration-200 hover:shadow-lift hover:border-slate-300">
      <div className="flex items-start justify-between">
        <div className={`p-2.5 rounded-lg ${styles.bg}`}>
          <div className={`${styles.icon} w-5 h-5`}>{icon}</div>
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-xs font-medium ${
              trend.value >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            <span>
              {trend.value >= 0 ? '+' : ''}
              {trend.value}%
            </span>
            <span className="text-slate-400">{trend.label}</span>
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-[26px] font-semibold text-slate-800 tracking-tight leading-none">{value}</p>
        <p className="text-[13px] text-slate-500 mt-1.5">{title}</p>
      </div>
    </div>
  );
}
