import React from 'react';
import { RefreshCw, Download, Calendar, Filter, Search, Plus, Eye, Edit, Trash2, LucideIcon } from 'lucide-react';
import OutlineActionButton from './OutlineActionButton';

interface HeaderActionButtonsProps {
  // Refresh button
  onRefresh?: () => void;
  refreshLoading?: boolean;
  refreshDisabled?: boolean;

  // Export button  
  onExport?: () => void;
  exportText?: string;
  exportLoading?: boolean;

  // Month/Year picker button
  onMonthYearClick?: () => void;
  monthYearText?: string;

  // Custom filter button
  onFilter?: () => void;
  filterText?: string;

  // Search button
  onSearch?: () => void;
  searchText?: string;

  // Add/Create button
  onAdd?: () => void;
  addText?: string;
  addVariant?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'gray';

  // Custom buttons array
  customButtons?: Array<{
    icon: LucideIcon;
    onClick: () => void;
    text?: string;
    variant?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'gray';
    loading?: boolean;
    disabled?: boolean;
    title?: string;
    iconOnly?: boolean;
  }>;

  // Layout
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const HeaderActionButtons: React.FC<HeaderActionButtonsProps> = ({
  onRefresh,
  refreshLoading = false,
  refreshDisabled = false,
  
  onExport,
  exportText = 'Export CSV',
  exportLoading = false,
  
  onMonthYearClick,
  monthYearText = 'Select Month',
  
  onFilter,
  filterText = 'Filter',
  
  onSearch,
  searchText = 'Search',
  
  onAdd,
  addText = 'Add New',
  addVariant = 'green',
  
  customButtons = [],
  
  className = '',
  size = 'md',
}) => {
  return (
    <div className={`flex flex-row sm:flex-row gap-1 sm:gap-3 w-full sm:w-auto ${className}`}>
      
      {/* Refresh Button */}
      {onRefresh && (
        <OutlineActionButton
          onClick={onRefresh}
          icon={RefreshCw}
          loading={refreshLoading}
          disabled={refreshDisabled}
          title="Refresh data"
          variant="blue"
          size={size}
          iconOnly
        />
      )}

      {/* Export Button */}
      {onExport && (
        <OutlineActionButton
          onClick={onExport}
          icon={Download}
          loading={exportLoading}
          title="Export data to CSV"
          variant="blue"
          size={size}
        >
          <span className="hidden sm:inline">{exportText}</span>
          <span className="sm:hidden">CSV</span>
        </OutlineActionButton>
      )}

      {/* Month/Year Picker Button */}
      {onMonthYearClick && (
        <OutlineActionButton
          onClick={onMonthYearClick}
          icon={Calendar}
          title="Select month and year"
          variant="blue"
          size={size}
        >
          <span className="hidden sm:inline">{monthYearText}</span>
          <span className="sm:hidden">
            {monthYearText.length > 8 ? monthYearText.slice(0, 8) : monthYearText}
          </span>
        </OutlineActionButton>
      )}

      {/* Filter Button */}
      {onFilter && (
        <OutlineActionButton
          onClick={onFilter}
          icon={Filter}
          title="Filter data"
          variant="blue"
          size={size}
        >
          <span className="hidden sm:inline">{filterText}</span>
          <span className="sm:hidden">Filter</span>
        </OutlineActionButton>
      )}

      {/* Search Button */}
      {onSearch && (
        <OutlineActionButton
          onClick={onSearch}
          icon={Search}
          title="Search data"
          variant="blue"
          size={size}
        >
          <span className="hidden sm:inline">{searchText}</span>
          <span className="sm:hidden">Search</span>
        </OutlineActionButton>
      )}

      {/* Add/Create Button */}
      {onAdd && (
        <OutlineActionButton
          onClick={onAdd}
          icon={Plus}
          title="Add new item"
          variant={addVariant}
          size={size}
        >
          <span className="hidden sm:inline">{addText}</span>
          <span className="sm:hidden">Add</span>
        </OutlineActionButton>
      )}

      {/* Custom Buttons */}
      {customButtons.map((button, index) => (
        <OutlineActionButton
          key={index}
          onClick={button.onClick}
          icon={button.icon}
          loading={button.loading}
          disabled={button.disabled}
          title={button.title}
          variant={button.variant || 'blue'}
          size={size}
          iconOnly={button.iconOnly}
        >
          {!button.iconOnly && button.text}
        </OutlineActionButton>
      ))}

    </div>
  );
};

// Export individual action button types for more specific use cases
export const ActionButtons = {
  Refresh: ({ onClick, loading = false, disabled = false, size = 'md' as const }) => (
    <OutlineActionButton
      onClick={onClick}
      icon={RefreshCw}
      loading={loading}
      disabled={disabled}
      title="Refresh data"
      variant="blue"
      size={size}
      iconOnly
    />
  ),

  Export: ({ onClick, text = 'Export CSV', loading = false, size = 'md' as const }) => (
    <OutlineActionButton
      onClick={onClick}
      icon={Download}
      loading={loading}
      title="Export data to CSV"
      variant="blue"
      size={size}
    >
      <span className="hidden sm:inline">{text}</span>
      <span className="sm:hidden">CSV</span>
    </OutlineActionButton>
  ),

  MonthYear: ({ onClick, text = 'Select Month', size = 'md' as const }) => (
    <OutlineActionButton
      onClick={onClick}
      icon={Calendar}
      title="Select month and year"
      variant="blue"
      size={size}
    >
      <span className="hidden sm:inline">{text}</span>
      <span className="sm:hidden">
        {text.length > 8 ? text.slice(0, 8) : text}
      </span>
    </OutlineActionButton>
  ),

  Add: ({ onClick, text = 'Add New', variant = 'green' as const, size = 'md' as const }) => (
    <OutlineActionButton
      onClick={onClick}
      icon={Plus}
      title="Add new item"
      variant={variant}
      size={size}
    >
      <span className="hidden sm:inline">{text}</span>
      <span className="sm:hidden">Add</span>
    </OutlineActionButton>
  ),

  View: ({ onClick, iconOnly = true, size = 'sm' as const }) => (
    <OutlineActionButton
      onClick={onClick}
      icon={Eye}
      title="View details"
      variant="blue"
      size={size}
      iconOnly={iconOnly}
    />
  ),

  Edit: ({ onClick, iconOnly = true, size = 'sm' as const }) => (
    <OutlineActionButton
      onClick={onClick}
      icon={Edit}
      title="Edit item"
      variant="orange"
      size={size}
      iconOnly={iconOnly}
    />
  ),

  Delete: ({ onClick, iconOnly = true, size = 'sm' as const }) => (
    <OutlineActionButton
      onClick={onClick}
      icon={Trash2}
      title="Delete item"
      variant="red"
      size={size}
      iconOnly={iconOnly}
    />
  ),
};

export default HeaderActionButtons;
