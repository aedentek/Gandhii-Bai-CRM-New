import React from 'react';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface OutlineActionButtonProps {
  onClick: () => void;
  icon: LucideIcon;
  children?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  title?: string;
  className?: string;
  variant?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'gray';
  size?: 'sm' | 'md' | 'lg';
  iconOnly?: boolean;
}

const OutlineActionButton: React.FC<OutlineActionButtonProps> = ({
  onClick,
  icon: Icon,
  children,
  disabled = false,
  loading = false,
  title,
  className = '',
  variant = 'blue',
  size = 'md',
  iconOnly = false,
}) => {
  // Color variants
  const colorClasses = {
    blue: 'border-blue-300 text-blue-600 hover:bg-blue-50',
    green: 'border-green-300 text-green-600 hover:bg-green-50',
    purple: 'border-purple-300 text-purple-600 hover:bg-purple-50',
    orange: 'border-orange-300 text-orange-600 hover:bg-orange-50',
    red: 'border-red-300 text-red-600 hover:bg-red-50',
    gray: 'border-gray-300 text-gray-600 hover:bg-gray-50',
  };

  // Size variants
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2',
    lg: 'text-sm sm:text-base px-3 sm:px-5 py-2 sm:py-3',
  };

  // Icon size variants
  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3 w-3 sm:h-4 sm:w-4',
    lg: 'h-4 w-4 sm:h-5 sm:w-5',
  };

  const baseClasses = 'flex-1 sm:flex-none';
  const combinedClasses = `${baseClasses} ${sizeClasses[size]} ${colorClasses[variant]} ${className}`;

  return (
    <Button
      onClick={onClick}
      disabled={disabled || loading}
      variant="outline"
      className={combinedClasses}
      title={title}
    >
      {loading ? (
        <Icon className={`${iconSizes[size]} animate-spin ${iconOnly ? '' : 'mr-1 sm:mr-2'}`} />
      ) : (
        <Icon className={`${iconSizes[size]} ${iconOnly ? '' : 'mr-1 sm:mr-2'}`} />
      )}
      {!iconOnly && children}
    </Button>
  );
};

export default OutlineActionButton;
