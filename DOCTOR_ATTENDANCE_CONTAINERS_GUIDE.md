# Doctor Attendance Container Background Styles Guide

This guide documents the global CSS classes extracted from the Doctor Attendance page for consistent container background styling across the entire CRM system.

## 🎨 Available Container Background Classes

### 1. **Page Background**
```css
.crm-page-bg
```
**Usage**: Main page wrapper with beautiful gradient background
**Description**: Multi-color gradient from blue to indigo to purple with responsive padding
**Example**:
```tsx
<div className="crm-page-bg">
  {/* Your page content */}
</div>
```

### 2. **Header Container**
```css
.crm-header-container
```
**Usage**: Page headers with translucent glass effect
**Description**: Semi-transparent white background with backdrop blur and subtle shadows
**Example**:
```tsx
<div className="crm-header-container">
  <div className="flex items-center gap-3">
    <div className="crm-header-icon">
      <YourIcon className="h-6 w-6 text-blue-600" />
    </div>
    <h1>Page Title</h1>
  </div>
</div>
```

### 3. **Header Icon Background**
```css
.crm-header-icon
```
**Usage**: Icon containers in headers
**Description**: Light blue background with responsive padding

### 4. **Stats Cards**
```css
.crm-stat-card
.crm-stat-card-blue
.crm-stat-card-green
.crm-stat-card-red
.crm-stat-card-orange
```
**Usage**: Statistics/metrics cards with color-coded themes
**Description**: Gradient backgrounds with hover animations and decorative elements

**Example**:
```tsx
<Card className="crm-stat-card crm-stat-card-blue">
  <CardContent className="relative p-4">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-blue-700">Total Items</p>
        <p className="text-3xl font-bold text-blue-900">150</p>
      </div>
      <div className="crm-stat-icon crm-stat-icon-blue">
        <YourIcon className="w-6 h-6 text-white" />
      </div>
    </div>
  </CardContent>
</Card>
```

### 5. **Stats Card Icons**
```css
.crm-stat-icon
.crm-stat-icon-blue
.crm-stat-icon-green
.crm-stat-icon-red
.crm-stat-icon-orange
```
**Usage**: Icon containers within stats cards
**Description**: Colored backgrounds that change on card hover

### 6. **Table Container**
```css
.crm-table-container
```
**Usage**: Main table wrapper with glass effect
**Description**: Semi-transparent background with backdrop blur
**Example**:
```tsx
<Card className="crm-table-container">
  <CardHeader className="crm-table-header">
    <CardTitle>Table Title</CardTitle>
  </CardHeader>
  <CardContent className="p-0">
    <Table>
      {/* Table content */}
    </Table>
  </CardContent>
</Card>
```

### 7. **Table Header**
```css
.crm-table-header
```
**Usage**: Table header sections
**Description**: Consistent padding with bottom border

### 8. **Pagination Container**
```css
.crm-pagination-container
```
**Usage**: Table pagination controls
**Description**: Flex layout with top border and consistent spacing

### 9. **Controls Container**
```css
.crm-controls-container
```
**Usage**: Search, filters, and control sections
**Description**: Glass effect container for form controls and filters

## 🎯 Color Variants

### Stats Card Colors:
- **Blue** (`crm-stat-card-blue`): Total counts, primary metrics
- **Green** (`crm-stat-card-green`): Positive metrics, active items
- **Red** (`crm-stat-card-red`): Alerts, inactive items, issues
- **Orange** (`crm-stat-card-orange`): Warnings, pending items

### Icon Colors:
- **Blue** (`crm-stat-icon-blue`): Primary actions
- **Green** (`crm-stat-icon-green`): Success states
- **Red** (`crm-stat-icon-red`): Alert states
- **Orange** (`crm-stat-icon-orange`): Warning states

## 📱 Responsive Features

All container classes include responsive design:
- **Mobile**: Optimized padding and spacing
- **Tablet** (640px+): Increased padding and border radius
- **Desktop** (1024px+): Full visual effects and larger spacing

## 🔧 Implementation Examples

### Full Page Layout:
```tsx
<div className="crm-page-bg">
  <div className="max-w-7xl mx-auto space-y-6">
    {/* Header */}
    <div className="crm-header-container">
      <div className="flex items-center gap-3">
        <div className="crm-header-icon">
          <YourIcon className="h-6 w-6 text-blue-600" />
        </div>
        <h1>Page Title</h1>
      </div>
    </div>

    {/* Stats Grid */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="crm-stat-card crm-stat-card-blue">
        {/* Blue stat card content */}
      </Card>
      <Card className="crm-stat-card crm-stat-card-green">
        {/* Green stat card content */}
      </Card>
    </div>

    {/* Controls */}
    <div className="crm-controls-container">
      {/* Search and filter controls */}
    </div>

    {/* Table */}
    <Card className="crm-table-container">
      <CardHeader className="crm-table-header">
        <CardTitle>Data Table</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          {/* Table content */}
        </Table>
        <div className="crm-pagination-container">
          {/* Pagination controls */}
        </div>
      </CardContent>
    </Card>
  </div>
</div>
```

## ✨ Special Effects

### Glass Morphism:
- Semi-transparent backgrounds
- Backdrop blur effects
- Subtle borders and shadows

### Hover Animations:
- Stats cards lift on hover
- Icon colors change on parent hover
- Smooth transitions (300ms)

### Decorative Elements:
- Gradient overlays on stats cards
- Circular decorative elements
- Layered visual depth

## 🔄 Usage Across CRM

These classes can be used in:
- ✅ Doctor Attendance (original)
- ✅ Patient Management
- ✅ General Categories
- ✅ Medicine Categories
- ✅ Staff Management
- ✅ Lead Management
- ✅ Any other CRM pages

## 📝 Best Practices

1. **Consistency**: Use the same color coding throughout the app
2. **Hierarchy**: Use appropriate containers for different content types
3. **Responsive**: Classes handle responsive design automatically
4. **Accessibility**: Maintain good contrast ratios
5. **Performance**: Backdrop blur effects work best on modern browsers

---

*Generated from Doctor Attendance page styles for global CRM use*
