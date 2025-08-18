# 🎯 CRM Statistics Cards & Table Titles Guide

## Overview
This guide documents the global statistics cards and table title system extracted from the Patient Management page, now available for use across all CRM pages.

## 📊 Statistics Cards System

### 4-Card Grid Layout
```jsx
<div className="crm-stats-grid">
  {/* Your 4 stat cards here */}
</div>
```

### Base Statistics Card Structure
```jsx
<Card className="crm-stat-card crm-stat-card-[color]">
  <CardContent className="relative p-3 sm:p-4 lg:p-6">
    <div className="flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm font-medium text-[color]-700 mb-1 truncate">[Label]</p>
        <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-[color]-900 mb-1">[Value]</p>
        <div className="flex items-center text-xs text-[color]-600">
          <Icon className="w-3 h-3 mr-1 flex-shrink-0" />
          <span className="truncate">[Status Text]</span>
        </div>
      </div>
      <div className="crm-stat-icon crm-stat-icon-[color]">
        <Icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
      </div>
    </div>
  </CardContent>
</Card>
```

### Available Color Variants

#### 🔵 Blue (Info/Primary)
- **Classes**: `crm-stat-card-blue`, `crm-stat-icon-blue`
- **Use Cases**: Total counts, primary metrics
- **Colors**: Blue gradient backgrounds, blue-700 text, blue-900 values

#### 🟢 Green (Success)
- **Classes**: `crm-stat-card-green`, `crm-stat-icon-green`
- **Use Cases**: Active states, positive metrics, success indicators
- **Colors**: Green gradient backgrounds, green-700 text, green-900 values

#### 🔴 Red (Error/Critical)
- **Classes**: `crm-stat-card-red`, `crm-stat-icon-red`
- **Use Cases**: Critical cases, errors, urgent attention needed
- **Colors**: Red gradient backgrounds, red-700 text, red-900 values

#### 🟠 Orange (Warning)
- **Classes**: `crm-stat-card-orange`, `crm-stat-icon-orange`
- **Use Cases**: Warnings, time-based info, moderate priority
- **Colors**: Orange gradient backgrounds, orange-700 text, orange-900 values

#### 🟣 Purple (Special)
- **Classes**: `crm-stat-card-purple`, `crm-stat-icon-purple`
- **Use Cases**: Special features, premium metrics, secondary info
- **Colors**: Purple gradient backgrounds, purple-700 text, purple-900 values

#### 🟡 Yellow (Caution)
- **Classes**: `crm-stat-card-yellow`, `crm-stat-icon-yellow`
- **Use Cases**: Pending states, caution areas, review needed
- **Colors**: Yellow gradient backgrounds, yellow-700 text, yellow-900 values

### Complete Example - Patient Management Style
```jsx
{/* Stats Cards */}
<div className="crm-stats-grid">
  {/* Total Count Card */}
  <Card className="crm-stat-card crm-stat-card-blue">
    <CardContent className="relative p-3 sm:p-4 lg:p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-blue-700 mb-1 truncate">Total Patients</p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-900 mb-1">{totalCount}</p>
          <div className="flex items-center text-xs text-blue-600">
            <TrendingUp className="w-3 h-3 mr-1 flex-shrink-0" />
            <span className="truncate">Registered</span>
          </div>
        </div>
        <div className="crm-stat-icon crm-stat-icon-blue">
          <Users className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
        </div>
      </div>
    </CardContent>
  </Card>
  
  {/* Active Status Card */}
  <Card className="crm-stat-card crm-stat-card-green">
    <CardContent className="relative p-3 sm:p-4 lg:p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-green-700 mb-1 truncate">Active Patients</p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-900 mb-1">{activeCount}</p>
          <div className="flex items-center text-xs text-green-600">
            <UserCheck className="w-3 h-3 mr-1 flex-shrink-0" />
            <span className="truncate">In treatment</span>
          </div>
        </div>
        <div className="crm-stat-icon crm-stat-icon-green">
          <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
        </div>
      </div>
    </CardContent>
  </Card>
  
  {/* Critical Cases Card */}
  <Card className="crm-stat-card crm-stat-card-red">
    <CardContent className="relative p-3 sm:p-4 lg:p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-red-700 mb-1 truncate">Critical Cases</p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-900 mb-1">{criticalCount}</p>
          <div className="flex items-center text-xs text-red-600">
            <Activity className="w-3 h-3 mr-1 flex-shrink-0" />
            <span className="truncate">Urgent care</span>
          </div>
        </div>
        <div className="crm-stat-icon crm-stat-icon-red">
          <Activity className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
        </div>
      </div>
    </CardContent>
  </Card>
  
  {/* Time-based Card */}
  <Card className="crm-stat-card crm-stat-card-orange">
    <CardContent className="relative p-3 sm:p-4 lg:p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-orange-700 mb-1 truncate">Last Updated</p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-900 mb-1">
            {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}
          </p>
          <div className="flex items-center text-xs text-orange-600">
            <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
            <span className="truncate">Today</span>
          </div>
        </div>
        <div className="crm-stat-icon crm-stat-icon-orange">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
        </div>
      </div>
    </CardContent>
  </Card>
</div>
```

## 📋 Table Title System

### Table Title with Icon
For table headers inside cards:
```jsx
<CardHeader className="crm-table-header">
  <div className="crm-table-title">
    <Icon className="crm-table-title-icon" />
    <span className="crm-table-title-text">Table Name ({count})</span>
    <span className="crm-table-title-text-mobile">Name ({count})</span>
  </div>
</CardHeader>
```

### Page Title with Icon
For main page headers:
```jsx
<div className="crm-page-title">
  <Icon className="crm-page-title-icon" />
  <span>Page Title</span>
</div>
```

### Section Title with Icon
For card section headers:
```jsx
<div className="crm-section-title">
  <Icon className="crm-section-title-icon" />
  <span>Section Title</span>
</div>
```

## 🎨 Design Features

### Statistics Cards
- **Glass Morphism**: Semi-transparent backgrounds with backdrop blur
- **Gradient Overlays**: Subtle color gradients for visual depth
- **Hover Effects**: Scale and shadow animations on hover
- **Responsive Icons**: Adaptive sizing across screen sizes
- **Semantic Colors**: Meaningful color associations
- **Progressive Enhancement**: Mobile-first responsive design

### Table Titles
- **Consistent Iconography**: Standardized icon placement and sizing
- **Responsive Text**: Mobile/desktop text variations
- **Color Coding**: Blue accent for professional appearance
- **Flexible Layout**: Works with any icon and text combination

## 📱 Responsive Behavior

### Statistics Cards
- **Mobile (< 640px)**: 2-column grid, compact padding, smaller icons
- **Tablet (640px+)**: 2-column grid, medium padding, standard icons  
- **Desktop (1024px+)**: 4-column grid, full padding, large icons

### Titles
- **Mobile**: Smaller icons and text, abbreviated labels
- **Desktop**: Full-size icons and text, complete labels

## 🛠️ Implementation Examples

### Staff Management Page
```jsx
<div className="crm-stats-grid">
  <Card className="crm-stat-card crm-stat-card-blue">
    {/* Total Staff */}
  </Card>
  <Card className="crm-stat-card crm-stat-card-green">
    {/* Present Today */}
  </Card>
  <Card className="crm-stat-card crm-stat-card-red">
    {/* Absent Today */}
  </Card>
  <Card className="crm-stat-card crm-stat-card-orange">
    {/* Late Today */}
  </Card>
</div>
```

### Inventory Management Page
```jsx
<div className="crm-stats-grid">
  <Card className="crm-stat-card crm-stat-card-blue">
    {/* Total Items */}
  </Card>
  <Card className="crm-stat-card crm-stat-card-green">
    {/* In Stock */}
  </Card>
  <Card className="crm-stat-card crm-stat-card-yellow">
    {/* Low Stock */}
  </Card>
  <Card className="crm-stat-card crm-stat-card-red">
    {/* Out of Stock */}
  </Card>
</div>
```

## 🎯 Best Practices

1. **Color Consistency**: Use semantic colors consistently across pages
2. **Icon Selection**: Choose icons that clearly represent the metric
3. **Text Hierarchy**: Keep labels concise, values prominent
4. **Responsive Design**: Test on all screen sizes
5. **Accessibility**: Ensure sufficient color contrast
6. **Performance**: Use appropriate image optimization for icons

---

**Created from**: Patient Management page design patterns  
**Global File**: `src/styles/global-crm-design.css`  
**Last Updated**: 2025-08-18
