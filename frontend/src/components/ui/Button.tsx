import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  Icon?: LucideIcon;
}

const Button: React.FC<ButtonProps> = ({ 
  Icon, 
  variant = 'primary', 
  size = 'md', 
  children,
  className = '',
  ...rest 
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
  
  const variantClasses = {
    primary: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500', // Primary Hijau
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    warning: 'bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-400',
  }[variant] || 'bg-blue-600 text-white'; 

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base font-medium',
  }[size];

  const iconSizeClasses = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }[size];

  return (
    <button className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`} {...rest}>
      {Icon && <Icon className={`mr-2 ${iconSizeClasses}`} />}
      {children}
    </button>
  );
};
export default Button;