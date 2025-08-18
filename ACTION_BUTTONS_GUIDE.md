# 🎨 Global Action Button Design System

## Overview
This document provides a comprehensive guide for using the global action button system across your CRM project. All action buttons follow a consistent color pattern and design language for maximum usability and visual harmony.

## 🚀 Quick Start

### Basic Usage
```tsx
import { Eye, Edit2, Trash2, Plus, Download } from 'lucide-react';

// Always include the base class 'action-btn-lead'
// Add the appropriate color variant class
<Button className="action-btn-lead action-btn-view h-8 w-8 p-0">
  <Eye className="h-4 w-4" />
</Button>
```

## 🎨 Available Action Button Variants

### 1. **View/Info Actions** (Green)
- **Class:** `action-btn-lead action-btn-view`
- **Color:** Green theme (#059669)
- **Use for:** View details, show info, preview
```tsx
<Button className="action-btn-lead action-btn-view h-8 w-8 p-0" title="View Details">
  <Eye className="h-4 w-4" />
</Button>
```

### 2. **Edit/Modify Actions** (Blue)
- **Class:** `action-btn-lead action-btn-edit`
- **Color:** Blue theme (#2563eb)
- **Use for:** Edit, modify, update
```tsx
<Button className="action-btn-lead action-btn-edit h-8 w-8 p-0" title="Edit">
  <Edit2 className="h-4 w-4" />
</Button>
```

### 3. **Delete/Remove Actions** (Red)
- **Class:** `action-btn-lead action-btn-delete`
- **Color:** Red theme (#dc2626)
- **Use for:** Delete, remove, destroy
```tsx
<Button className="action-btn-lead action-btn-delete h-8 w-8 p-0" title="Delete">
  <Trash2 className="h-4 w-4" />
</Button>
```

### 4. **Add/Create Actions** (Violet)
- **Class:** `action-btn-lead action-btn-add`
- **Color:** Violet theme (#7c3aed)
- **Use for:** Add new, create, plus
```tsx
<Button className="action-btn-lead action-btn-add h-8 w-8 p-0" title="Add New">
  <Plus className="h-4 w-4" />
</Button>
```

### 5. **Download/Export Actions** (Cyan)
- **Class:** `action-btn-lead action-btn-download`
- **Color:** Cyan theme (#0891b2)
- **Use for:** Download, export, save
```tsx
<Button className="action-btn-lead action-btn-download h-8 w-8 p-0" title="Download">
  <Download className="h-4 w-4" />
</Button>
```

### 6. **Settings/Configure Actions** (Orange)
- **Class:** `action-btn-lead action-btn-settings`
- **Color:** Orange theme (#ea580c)
- **Use for:** Settings, configure, options
```tsx
<Button className="action-btn-lead action-btn-settings h-8 w-8 p-0" title="Settings">
  <Settings className="h-4 w-4" />
</Button>
```

### 7. **Warning/Alert Actions** (Amber)
- **Class:** `action-btn-lead action-btn-warning`
- **Color:** Amber theme (#d97706)
- **Use for:** Warnings, alerts, caution
```tsx
<Button className="action-btn-lead action-btn-warning h-8 w-8 p-0" title="Warning">
  <AlertTriangle className="h-4 w-4" />
</Button>
```

### 8. **Disable/Block Actions** (Gray)
- **Class:** `action-btn-lead action-btn-disable`
- **Color:** Gray theme (#6b7280)
- **Use for:** Disable, block, deactivate
```tsx
<Button className="action-btn-lead action-btn-disable h-8 w-8 p-0" title="Disable">
  <Ban className="h-4 w-4" />
</Button>
```

### 9. **Send/Share Actions** (Purple)
- **Class:** `action-btn-lead action-btn-send`
- **Color:** Purple theme (#8b5cf6)
- **Use for:** Send, share, publish
```tsx
<Button className="action-btn-lead action-btn-send h-8 w-8 p-0" title="Send">
  <Send className="h-4 w-4" />
</Button>
```

### 10. **Print Actions** (Black)
- **Class:** `action-btn-lead action-btn-print`
- **Color:** Black theme (#1f2937)
- **Use for:** Print, PDF generate
```tsx
<Button className="action-btn-lead action-btn-print h-8 w-8 p-0" title="Print">
  <Printer className="h-4 w-4" />
</Button>
```

### 11. **Refresh/Reload Actions** (Teal)
- **Class:** `action-btn-lead action-btn-refresh`
- **Color:** Teal theme (#0d9488)
- **Use for:** Refresh, reload, sync
```tsx
<Button className="action-btn-lead action-btn-refresh h-8 w-8 p-0" title="Refresh">
  <RefreshCw className="h-4 w-4" />
</Button>
```

## 📐 Sizing Guidelines

### Standard Table Actions
```tsx
// Recommended for table rows
className="action-btn-lead action-btn-edit h-8 w-8 sm:h-9 sm:w-9 p-0"
```

### Compact Actions
```tsx
// For tight spaces
className="action-btn-lead action-btn-view h-6 w-6 p-0"
```

### Larger Actions
```tsx
// For emphasis or accessibility
className="action-btn-lead action-btn-delete h-10 w-10 p-0"
```

## 🎯 Implementation Examples

### Complete Table Actions Row
```tsx
<TableCell className="text-center">
  <div className="flex items-center justify-center gap-2">
    <Button 
      className="action-btn-lead action-btn-view h-8 w-8 p-0"
      onClick={() => handleView(item)}
      title="View Details"
    >
      <Eye className="h-4 w-4" />
    </Button>
    
    <Button 
      className="action-btn-lead action-btn-edit h-8 w-8 p-0"
      onClick={() => handleEdit(item)}
      title="Edit"
    >
      <Edit2 className="h-4 w-4" />
    </Button>
    
    <Button 
      className="action-btn-lead action-btn-download h-8 w-8 p-0"
      onClick={() => handleDownload(item)}
      title="Download"
    >
      <Download className="h-4 w-4" />
    </Button>
    
    <Button 
      className="action-btn-lead action-btn-delete h-8 w-8 p-0"
      onClick={() => handleDelete(item)}
      title="Delete"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  </div>
</TableCell>
```

### Conditional Actions
```tsx
<div className="flex items-center justify-center gap-2">
  {/* Always show view */}
  <Button className="action-btn-lead action-btn-view h-8 w-8 p-0">
    <Eye className="h-4 w-4" />
  </Button>
  
  {/* Show edit only if user has permission */}
  {canEdit && (
    <Button className="action-btn-lead action-btn-edit h-8 w-8 p-0">
      <Edit2 className="h-4 w-4" />
    </Button>
  )}
  
  {/* Show delete only for active items */}
  {item.status === 'active' && (
    <Button className="action-btn-lead action-btn-delete h-8 w-8 p-0">
      <Trash2 className="h-4 w-4" />
    </Button>
  )}
</div>
```

## 🔧 Advanced Usage

### With Loading States
```tsx
<Button 
  className="action-btn-lead action-btn-refresh h-8 w-8 p-0"
  disabled={isLoading}
>
  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
</Button>
```

### With Tooltips
```tsx
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

<Tooltip>
  <TooltipTrigger asChild>
    <Button className="action-btn-lead action-btn-edit h-8 w-8 p-0">
      <Edit2 className="h-4 w-4" />
    </Button>
  </TooltipTrigger>
  <TooltipContent>
    <p>Edit this category</p>
  </TooltipContent>
</Tooltip>
```

## 🎨 Color Reference

| Variant | Primary Color | Hover Color | Background | Border |
|---------|---------------|-------------|------------|---------|
| view | Green (#059669) | Green (#047857) | #f0fdf4 | #86efac |
| edit | Blue (#2563eb) | Blue (#1d4ed8) | #eff6ff | #93c5fd |
| delete | Red (#dc2626) | Red (#b91c1c) | #fef2f2 | #fecaca |
| add | Violet (#7c3aed) | Violet (#6d28d9) | #f5f3ff | #c4b5fd |
| download | Cyan (#0891b2) | Cyan (#0e7490) | #ecfeff | #67e8f9 |
| settings | Orange (#ea580c) | Orange (#c2410c) | #fff7ed | #fed7aa |
| warning | Amber (#d97706) | Amber (#b45309) | #fffbeb | #fde68a |
| disable | Gray (#6b7280) | Gray (#4b5563) | #f9fafb | #d1d5db |
| send | Purple (#8b5cf6) | Purple (#7c3aed) | #faf5ff | #c4b5fd |
| print | Black (#1f2937) | Black (#111827) | #ffffff | #e5e7eb |
| refresh | Teal (#0d9488) | Teal (#0f766e) | #f0fdfa | #99f6e4 |

## ✨ Features

- **Consistent Design Language**: All buttons follow the same visual pattern
- **Responsive**: Automatically adapts to different screen sizes
- **Accessible**: Includes focus states and proper contrast ratios
- **Hover Effects**: Smooth animations with translateY and shadow effects
- **Dark Mode Ready**: Automatically adjusts for dark mode preferences
- **Touch Friendly**: Optimized for mobile and touch devices

## 🚀 Migration Guide

### From Old Styles
```tsx
// OLD - Inconsistent styling
<Button className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200">
  <Edit2 className="h-4 w-4" />
</Button>

// NEW - Global consistent styling
<Button className="action-btn-lead action-btn-edit h-8 w-8 p-0">
  <Edit2 className="h-4 w-4" />
</Button>
```

## 📝 Best Practices

1. **Always include the base class** `action-btn-lead`
2. **Use semantic color variants** that match the action purpose
3. **Include meaningful titles** for accessibility
4. **Keep icon sizes consistent** (usually h-4 w-4)
5. **Group related actions** together in logical order
6. **Use conditional rendering** for permission-based actions
7. **Maintain consistent spacing** between action buttons

## 🤝 Contributing

When adding new action button variants:
1. Follow the existing color pattern
2. Ensure sufficient contrast ratios
3. Add both normal and hover states
4. Include focus and disabled states
5. Update this documentation

---

**Happy Coding! 🚀**
