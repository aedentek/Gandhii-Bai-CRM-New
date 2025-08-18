# 📅 CRM Month/Year Picker Button Guide

## Overview
This guide documents the global month/year picker button system extracted from the Grocery Stock Management page, now available for use across all CRM pages.

## 📅 Month/Year Button System

### Basic Implementation
```jsx
<Button 
  onClick={() => setShowMonthYearDialog(true)}
  variant="outline"
  className="crm-month-year-btn"
>
  <Calendar className="crm-month-year-btn-icon" />
  <span className="crm-month-year-btn-text">
    {filterMonth !== null && filterYear !== null 
      ? `${months[filterMonth]} ${filterYear}`
      : `${months[selectedMonth]} ${selectedYear}`
    }
  </span>
  <span className="crm-month-year-btn-text-mobile">
    {filterMonth !== null && filterYear !== null 
      ? `${months[filterMonth].slice(0, 3)} ${filterYear}`
      : `${months[selectedMonth].slice(0, 3)} ${selectedYear}`
    }
  </span>
</Button>
```

### Available Variants

#### 🔷 Standard Month/Year Button
- **Class**: `crm-month-year-btn`
- **Style**: Clean white background with gray border
- **Use Case**: Default month/year picker for filters and forms

#### 🔵 Gradient Month/Year Button  
- **Class**: `crm-month-year-btn crm-month-year-btn-gradient`
- **Style**: Subtle gray gradient with enhanced hover effects
- **Use Case**: Premium sections, dashboard headers

#### 🟦 Blue Month/Year Button
- **Class**: `crm-month-year-btn crm-month-year-btn-blue`
- **Style**: Blue gradient background with blue text
- **Use Case**: Primary actions, featured filters

### Complete Component Structure

#### State Management
```jsx
// Month and year state for filtering
const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const currentYear = new Date().getFullYear();
const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
const [selectedYear, setSelectedYear] = useState(currentYear);
const [showMonthYearDialog, setShowMonthYearDialog] = useState(false);
const [filterMonth, setFilterMonth] = useState<number | null>(new Date().getMonth());
const [filterYear, setFilterYear] = useState<number | null>(currentYear);
```

#### Full Implementation Example
```jsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import MonthYearPickerDialog from '@/components/shared/MonthYearPickerDialog';

const MyComponent = () => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [showMonthYearDialog, setShowMonthYearDialog] = useState(false);
  const [filterMonth, setFilterMonth] = useState<number | null>(new Date().getMonth());
  const [filterYear, setFilterYear] = useState<number | null>(currentYear);

  return (
    <>
      {/* Month/Year Filter Button */}
      <Button 
        onClick={() => setShowMonthYearDialog(true)}
        variant="outline"
        className="crm-month-year-btn"
      >
        <Calendar className="crm-month-year-btn-icon" />
        <span className="crm-month-year-btn-text">
          {filterMonth !== null && filterYear !== null 
            ? `${months[filterMonth]} ${filterYear}`
            : `${months[selectedMonth]} ${selectedYear}`
          }
        </span>
        <span className="crm-month-year-btn-text-mobile">
          {filterMonth !== null && filterYear !== null 
            ? `${months[filterMonth].slice(0, 3)} ${filterYear}`
            : `${months[selectedMonth].slice(0, 3)} ${selectedYear}`
          }
        </span>
      </Button>

      {/* Month/Year Picker Dialog */}
      <MonthYearPickerDialog
        open={showMonthYearDialog}
        onOpenChange={setShowMonthYearDialog}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onMonthYearChange={(month, year) => {
          setSelectedMonth(month);
          setSelectedYear(year);
          setFilterMonth(month);
          setFilterYear(year);
          // Apply filters here
        }}
      />
    </>
  );
};
```

## 🎨 Design Features

### Responsive Design
- **Mobile (< 640px)**: 
  - Compact padding (`0.25rem 0.5rem`)
  - Small icons (`0.75rem`)
  - Abbreviated month names (e.g., "Jan 2025")
  - Flexible width with minimum 120px

- **Desktop (640px+)**:
  - Standard padding (`0.5rem 1rem`)
  - Regular icons (`1rem`)
  - Full month names (e.g., "January 2025")
  - Fixed width with minimum 140px

### Interactive States
- **Hover**: Subtle background color change and border darkening
- **Focus**: Blue ring outline for accessibility
- **Disabled**: Reduced opacity and disabled cursor

### Typography
- **Mobile**: 12px font size
- **Desktop**: 14px font size
- **Weight**: Medium (500) for professional appearance

## 📱 Responsive Behavior

### Text Display
```jsx
{/* Desktop: Shows "January 2025" */}
<span className="crm-month-year-btn-text">
  {months[filterMonth]} {filterYear}
</span>

{/* Mobile: Shows "Jan 2025" */}
<span className="crm-month-year-btn-text-mobile">
  {months[filterMonth].slice(0, 3)} {filterYear}
</span>
```

### Icon Sizing
```jsx
<Calendar className="crm-month-year-btn-icon" />
{/* 
  Mobile: 12px (0.75rem)
  Desktop: 16px (1rem)
*/}
```

## 🎯 Usage Examples

### Filter Bar in Headers
```jsx
<div className="flex gap-2">
  <Button className="global-btn global-btn-secondary">
    <RefreshCw className="w-4 h-4 mr-2" />
    Refresh
  </Button>
  
  <Button className="crm-month-year-btn">
    <Calendar className="crm-month-year-btn-icon" />
    <span className="crm-month-year-btn-text">January 2025</span>
    <span className="crm-month-year-btn-text-mobile">Jan 2025</span>
  </Button>
  
  <Button className="global-btn global-btn-primary">
    <Download className="w-4 h-4 mr-2" />
    Export
  </Button>
</div>
```

### Premium Dashboard Section
```jsx
<Button className="crm-month-year-btn crm-month-year-btn-gradient">
  <Calendar className="crm-month-year-btn-icon" />
  <span className="crm-month-year-btn-text">Financial Period: January 2025</span>
  <span className="crm-month-year-btn-text-mobile">Jan 2025</span>
</Button>
```

### Primary Filter Section
```jsx
<Button className="crm-month-year-btn crm-month-year-btn-blue">
  <Calendar className="crm-month-year-btn-icon" />
  <span className="crm-month-year-btn-text">Report Period: January 2025</span>
  <span className="crm-month-year-btn-text-mobile">Jan 2025</span>
</Button>
```

## 🔧 Integration with MonthYearPickerDialog

The button works seamlessly with the existing `MonthYearPickerDialog` component:

```jsx
import MonthYearPickerDialog from '@/components/shared/MonthYearPickerDialog';

// Button triggers dialog
<Button 
  onClick={() => setShowMonthYearDialog(true)}
  className="crm-month-year-btn"
>
  {/* Button content */}
</Button>

// Dialog handles month/year selection
<MonthYearPickerDialog
  open={showMonthYearDialog}
  onOpenChange={setShowMonthYearDialog}
  selectedMonth={selectedMonth}
  selectedYear={selectedYear}
  onMonthYearChange={(month, year) => {
    setSelectedMonth(month);
    setSelectedYear(year);
    setFilterMonth(month);
    setFilterYear(year);
  }}
/>
```

## 🎨 Customization Options

### Custom Width
```jsx
<Button className="crm-month-year-btn" style={{ minWidth: '200px' }}>
  {/* Extended width for longer text */}
</Button>
```

### Custom Colors
```jsx
/* Add custom variant in your component CSS */
.my-custom-month-btn {
  @apply crm-month-year-btn;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-color: #f59e0b;
  color: #92400e;
}
```

## 🛠️ Best Practices

1. **Consistent Placement**: Always place month/year buttons in filter bars or control sections
2. **Icon Usage**: Always include the Calendar icon for visual clarity
3. **Responsive Text**: Use both desktop and mobile text spans for optimal UX
4. **State Management**: Connect to proper state management for filtering functionality
5. **Accessibility**: Ensure proper ARIA labels and keyboard navigation
6. **Loading States**: Disable button during data loading operations

## 🔍 Integration Examples

### Patient Management Page
```jsx
<Button className="crm-month-year-btn">
  <Calendar className="crm-month-year-btn-icon" />
  <span className="crm-month-year-btn-text">Patient Records: {months[month]} {year}</span>
  <span className="crm-month-year-btn-text-mobile">{months[month].slice(0,3)} {year}</span>
</Button>
```

### Financial Reports Page
```jsx
<Button className="crm-month-year-btn crm-month-year-btn-blue">
  <Calendar className="crm-month-year-btn-icon" />
  <span className="crm-month-year-btn-text">Financial Period: {months[month]} {year}</span>
  <span className="crm-month-year-btn-text-mobile">{months[month].slice(0,3)} {year}</span>
</Button>
```

### Inventory Management Page
```jsx
<Button className="crm-month-year-btn crm-month-year-btn-gradient">
  <Calendar className="crm-month-year-btn-icon" />
  <span className="crm-month-year-btn-text">Stock Report: {months[month]} {year}</span>
  <span className="crm-month-year-btn-text-mobile">{months[month].slice(0,3)} {year}</span>
</Button>
```

---

**Extracted from**: Grocery Stock Management page  
**Global File**: `src/styles/global-crm-design.css`  
**Dialog Component**: `@/components/shared/MonthYearPickerDialog`  
**Last Updated**: 2025-08-18
