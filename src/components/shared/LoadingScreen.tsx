import React from 'react';
import { RefreshCw } from 'lucide-react';

export interface LoadingScreenProps {
  message?: string;
  showIcon?: boolean;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = "Loading...", 
  showIcon = true,
  className = "",
  size = "medium"
}) => {
  const sizeClasses = {
    small: {
      container: "py-4",
      icon: "h-6 w-6",
      text: "text-base"
    },
    medium: {
      container: "py-8",
      icon: "h-8 w-8",
      text: "text-lg"
    },
    large: {
      container: "py-12",
      icon: "h-10 w-10",
      text: "text-xl"
    }
  };

  const currentSize = sizeClasses[size];

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 px-2 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 ${className}`}>
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-2xl p-4 sm:p-6 shadow-lg">
          <div className={`flex items-center justify-center ${currentSize.container}`}>
            {showIcon && (
              <RefreshCw className={`${currentSize.icon} animate-spin text-blue-600`} />
            )}
            <span className={`ml-3 ${currentSize.text} text-gray-700`}>{message}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
