import React from 'react';
import { LucideIcon, RefreshCw, Download, Plus, X, Calendar } from 'lucide-react';

export interface ActionButton {
  id: string;
  label: string;
  icon?: LucideIcon;
  variant: 'refresh' | 'date-selector' | 'export' | 'primary' | 'clear' | 'warning';
  onClick: () => void;
  disabled?: boolean;
  hideTextOnMobile?: boolean;
  loading?: boolean;
  children?: React.ReactNode; // For custom content like date picker text
  badge?: number; // For notification badges
}

interface ActionButtonContainerProps {
  buttons: ActionButton[];
  className?: string;
  title?: string; // Optional title for the button group
}

export const ActionButtonContainer: React.FC<ActionButtonContainerProps> = ({
  buttons,
  className = '',
  title
}) => {
  const getButtonClasses = (variant: ActionButton['variant'], disabled?: boolean, loading?: boolean) => {
    const variantClasses = {
      refresh: 'header-action-btn--refresh',
      'date-selector': 'header-action-btn--date-selector',
      export: 'header-action-btn--export',
      primary: 'header-action-btn--primary',
      clear: 'header-action-btn--clear',
      warning: 'header-action-btn--warning'
    };
    
    let classes = variantClasses[variant];
    
    if (disabled || loading) {
      classes += ' opacity-50 cursor-not-allowed';
    }
    
    if (loading) {
      classes += ' header-action-btn--loading';
    }
    
    return classes;
  };

  return (
    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
      {title && (
        <h2 className="text-xl font-semibold">{title}</h2>
      )}
      
      <div className={`header-actions-container ${className}`}>
        {buttons.map((button) => {
          const IconComponent = button.icon;
          
          return (
            <button
              key={button.id}
              onClick={button.onClick}
              disabled={button.disabled || button.loading}
              className={getButtonClasses(button.variant, button.disabled, button.loading)}
              aria-label={button.label}
              title={button.label}
            >
              {IconComponent && (
                <IconComponent 
                  className={`header-action-btn__icon ${button.loading ? 'animate-spin' : ''}`} 
                />
              )}
              
              {button.children ? (
                button.children
              ) : (
                <span 
                  className={`header-action-btn__text ${button.hideTextOnMobile ? 'header-action-btn__text--sm-hidden' : ''}`}
                >
                  {button.label}
                </span>
              )}

              {button.badge && button.badge > 0 && (
                <span className="header-action-btn__badge">
                  {button.badge > 99 ? '99+' : button.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Convenience hook for common button configurations
export const useCommonActions = () => {
  const createRefreshAction = (onRefresh: () => void, loading?: boolean): ActionButton => ({
    id: 'refresh',
    label: 'Refresh',
    variant: 'refresh',
    onClick: onRefresh,
    loading,
    icon: RefreshCw
  });

  const createExportAction = (onExport: () => void, label = 'Export CSV'): ActionButton => ({
    id: 'export',
    label,
    variant: 'export',
    onClick: onExport,
    hideTextOnMobile: true,
    icon: Download
  });

  const createAddAction = (onAdd: () => void, label = 'Add Item'): ActionButton => ({
    id: 'add',
    label,
    variant: 'primary',
    onClick: onAdd,
    icon: Plus
  });

  const createDateSelectorAction = (onClick: () => void, displayText: string): ActionButton => ({
    id: 'date-selector',
    label: displayText,
    variant: 'date-selector',
    onClick,
    icon: Calendar,
    children: <span className="header-action-btn__text">{displayText}</span>
  });

  const createClearFilterAction = (onClear: () => void): ActionButton => ({
    id: 'clear-filter',
    label: 'Clear Filter',
    variant: 'clear',
    onClick: onClear,
    icon: X
  });

  return {
    createRefreshAction,
    createExportAction,
    createAddAction,
    createDateSelectorAction,
    createClearFilterAction
  };
};
