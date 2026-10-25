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
      className={`bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm ${
        hover || onClick ? 'hover:border-gray-300 hover:shadow-md transition-all cursor-pointer' : ''
      } ${className || ''}`}
    >
      {title && (
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        </div>
      )}
      <div className="p-4">{children}</div>
      {footer && (
        <div className="px-4 py-3 border-t border-gray-200">{footer}</div>
      )}
    </div>
  );
}
