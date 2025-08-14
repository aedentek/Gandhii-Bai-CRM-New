import React from 'react';
import { RefreshCw } from 'lucide-react';

export interface LoadingSpinnerProps {
  message?: string;
  showIcon?: boolean;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'blue' | 'gray' | 'green' | 'red' | 'purple' | 'orange';
  center?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = "Loading...", 
  showIcon = true,
  className = "",
  size = "md",
  color = "blue",
  center = true
}) => {
  const sizeClasses = {
    xs: { icon: "h-3 w-3", text: "text-xs" },
    sm: { icon: "h-4 w-4", text: "text-sm" },
    md: { icon: "h-6 w-6", text: "text-base" },
    lg: { icon: "h-8 w-8", text: "text-lg" },
    xl: { icon: "h-10 w-10", text: "text-xl" }
  };

  const colorClasses = {
    blue: "text-blue-600",
    gray: "text-gray-600", 
    green: "text-green-600",
    red: "text-red-600",
    purple: "text-purple-600",
    orange: "text-orange-600"
  };

  const currentSize = sizeClasses[size];
  const currentColor = colorClasses[color];

  const containerClass = center 
    ? "flex items-center justify-center py-4" 
    : "flex items-center py-2";

  return (
    <div className={`${containerClass} ${className}`}>
      {showIcon && (
        <RefreshCw className={`${currentSize.icon} animate-spin ${currentColor}`} />
      )}
      <span className={`${showIcon ? 'ml-3' : ''} ${currentSize.text} ${currentColor}`}>
        {message}
      </span>
    </div>
  );
};

export default LoadingSpinner;
