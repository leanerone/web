import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({ icon: Icon = Inbox, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 text-center ${className}`}>
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
        <Icon className="h-6 w-6 text-gray-400" />
      </div>
      <p className="mt-3 text-sm font-medium text-gray-700">{title}</p>
      {description && <p className="mt-1 text-xs text-gray-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
