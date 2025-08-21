# Header Action Buttons Components

This package provides reusable header action button components with consistent styling across your CRM application.

## Components

### 1. `OutlineActionButton`
Base component for creating outline-style buttons with consistent styling.

### 2. `HeaderActionButtons` 
All-in-one component with common header actions (refresh, export, month/year picker, etc.)

### 3. `ActionButtons`
Individual button components for specific actions.

## Quick Start

### Import the components:
```tsx
import HeaderActionButtons, { ActionButtons } from '@/components/ui/HeaderActionButtons';
import OutlineActionButton from '@/components/ui/OutlineActionButton';
```

## Usage Examples

### Method 1: All-in-one HeaderActionButtons
```tsx
<HeaderActionButtons
  onRefresh={handleRefresh}
  refreshLoading={loading}
  
  onExport={handleExport}
  exportText="Export CSV"
  
  onMonthYearClick={handleMonthYearClick}
  monthYearText={`${months[selectedMonth]} ${selectedYear}`}
/>
```

### Method 2: Individual ActionButtons
```tsx
<div className="flex flex-row gap-3">
  <ActionButtons.Refresh 
    onClick={handleRefresh}
    loading={loading}
  />
  
  <ActionButtons.Export 
    onClick={handleExport}
    text="Download CSV"
  />
  
  <ActionButtons.MonthYear 
    onClick={handleMonthYearClick}
    text={`${months[selectedMonth]} ${selectedYear}`}
  />
</div>
```

### Method 3: Custom OutlineActionButton
```tsx
<OutlineActionButton
  onClick={handleCustomAction}
  icon={CustomIcon}
  variant="purple"
  size="lg"
  title="Custom action"
>
  Custom Text
</OutlineActionButton>
```

## Props

### HeaderActionButtons Props
- `onRefresh?: () => void` - Refresh button click handler
- `refreshLoading?: boolean` - Show loading spinner on refresh button
- `onExport?: () => void` - Export button click handler
- `exportText?: string` - Custom export button text (default: "Export CSV")
- `onMonthYearClick?: () => void` - Month/Year picker button click handler
- `monthYearText?: string` - Month/Year display text
- `size?: 'sm' | 'md' | 'lg'` - Button size (default: 'md')

### OutlineActionButton Props
- `onClick: () => void` - Button click handler
- `icon: LucideIcon` - Icon component from lucide-react
- `children?: React.ReactNode` - Button text content
- `variant?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'gray'` - Color variant
- `size?: 'sm' | 'md' | 'lg'` - Button size
- `loading?: boolean` - Show loading spinner
- `disabled?: boolean` - Disable button
- `iconOnly?: boolean` - Show only icon without text

## Color Variants
- `blue` - Blue outline with blue text
- `green` - Green outline with green text  
- `purple` - Purple outline with purple text
- `orange` - Orange outline with orange text
- `red` - Red outline with red text
- `gray` - Gray outline with gray text

## Size Variants
- `sm` - Small size (text-xs, compact padding)
- `md` - Medium size (text-xs sm:text-sm, responsive padding) - Default
- `lg` - Large size (text-sm sm:text-base, larger padding)

## Responsive Design
All buttons are responsive by default:
- On small screens: Show abbreviated text or icons only
- On larger screens: Show full text with icons
- Flexible layout adapts to available space

## Table Action Buttons
For table row actions, use the individual ActionButtons:

```tsx
<div className="flex items-center gap-2">
  <ActionButtons.View onClick={() => handleView(item)} />
  <ActionButtons.Edit onClick={() => handleEdit(item)} />
  <ActionButtons.Delete onClick={() => handleDelete(item)} />
</div>
```

## Integration Example

Replace your existing button section with HeaderActionButtons:

```tsx
// Before
<div className="flex flex-row gap-3">
  <Button variant="outline" onClick={handleRefresh}>
    <RefreshCw className="h-4 w-4" />
  </Button>
  <Button onClick={handleExport}>
    <Download className="h-4 w-4 mr-2" />
    Export CSV
  </Button>
</div>

// After
<HeaderActionButtons
  onRefresh={handleRefresh}
  refreshLoading={loading}
  onExport={handleExport}
  exportText="Export CSV"
/>
```

This provides consistent styling, responsive design, and easier maintenance across all pages.
