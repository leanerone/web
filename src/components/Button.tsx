import type { ReactNode, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  loading?: boolean;
}

const variantStyles = {
  primary: 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 shadow-lg hover:shadow-cyan-500/25',
  secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300',
  success: 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200',
  warning: 'bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200',
  danger: 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200',
  ghost: 'text-gray-600 hover:bg-gray-100 hover:text-gray-800',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  loading = false,
  disabled,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${variantStyles[variant]} ${sizeStyles[size]} ${className || ''}`}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : (
        children
      )}
    </button>
  );
}
