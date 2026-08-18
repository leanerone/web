interface CardProps {
  title?: string;
  className?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  hover?: boolean;
  onClick?: () => void;
}

export default function Card({ title, className, children, footer, hover = false, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-soft ${
        hover
          ? 'hover:border-brand-300 hover:shadow-lift transition-all duration-200 cursor-pointer'
          : ''
      } ${className || ''}`}
    >
      {title && (
        <div className="px-4 py-3 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800 tracking-tight">{title}</h3>
        </div>
      )}
      <div className="p-4">{children}</div>
      {footer && (
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/40">{footer}</div>
      )}
    </div>
  );
}
