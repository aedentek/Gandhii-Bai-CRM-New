#!/usr/bin/env node

/**
 * CRM Design System Application Script
 * 
 * This script helps apply the global CRM design system to existing pages
 * Run this script and follow the instructions to update your pages.
 */

const fs = require('fs');
const path = require('path');

const DESIGN_GUIDE = `
# How to Apply Global CRM Design to Your Pages

## Step 1: Import the CSS
Add this import to your component:
\`\`\`tsx
import '../../styles/global-crm-design.css';
\`\`\`

## Step 2: Wrap Your Page Content
Replace your existing page wrapper with:
\`\`\`tsx
return (
  <div className="crm-page">
    <div className="crm-container">
      {/* Your content goes here */}
    </div>
  </div>
);
\`\`\`

## Step 3: Add Header Section
Replace your existing header with:
\`\`\`tsx
{/* Header Section */}
<div className="crm-header">
  <div className="crm-header-content">
    <div className="crm-header-title">
      <div className="crm-header-icon">
        <YourIcon />
      </div>
      <div>
        <h1 className="crm-page-title">Your Page Title</h1>
      </div>
    </div>
    
    <div className="crm-header-actions">
      <button className="crm-btn crm-btn-primary">
        <RefreshCw />
        <span className="crm-hidden-mobile">Refresh</span>
        <span className="crm-hidden-desktop">↻</span>
      </button>
      
      <button className="crm-btn crm-btn-secondary">
        <Download />
        <span className="crm-hidden-mobile">Export CSV</span>
        <span className="crm-hidden-desktop">CSV</span>
      </button>
    </div>
  </div>
</div>
\`\`\`

## Step 4: Add Stats Cards (Optional)
If your page has statistics, add:
\`\`\`tsx
{/* Stats Cards */}
<div className="crm-stats-grid">
  
  {/* Example Blue Card */}
  <div className="crm-stat-card blue">
    <div className="crm-stat-content">
      <div className="crm-stat-layout">
        <div className="crm-stat-info">
          <p className="crm-stat-label blue">Total Items</p>
          <p className="crm-stat-value blue">24</p>
          <div className="crm-stat-trend blue">
            <TrendingUp />
            <span>Active</span>
          </div>
        </div>
        <div className="crm-stat-icon blue">
          <Users />
        </div>
      </div>
    </div>
  </div>

  {/* Add more cards with different colors: green, red, orange */}
  
</div>
\`\`\`

## Step 5: Add Search Section (Optional)
If your page has search/filter functionality:
\`\`\`tsx
{/* Search and Filter Section */}
<div className="crm-search-section">
  <div className="crm-search-input">
    <input
      type="text"
      placeholder="Search..."
      className="crm-input"
    />
    <div className="crm-search-icon">
      <Search />
    </div>
  </div>
  
  <div className="crm-filter-actions">
    <select className="crm-select">
      <option>All</option>
      <option>Active</option>
      <option>Inactive</option>
    </select>
  </div>
</div>
\`\`\`

## Step 6: Convert Your Main Content
Wrap your main content in:
\`\`\`tsx
{/* Main Content Card */}
<div className="crm-content-card">
  
  {/* Content Header */}
  <div className="crm-content-header">
    <div className="crm-content-header-layout">
      <h2 className="crm-content-title">
        <Activity />
        Your Content Title
      </h2>
      <div className="crm-content-meta">
        <Clock />
        <span>Last updated: {new Date().toLocaleString()}</span>
      </div>
    </div>
  </div>

  {/* Your existing content here */}
  
</div>
\`\`\`

## Step 7: Convert Tables (If Any)
Replace your existing table with:
\`\`\`tsx
{/* Table Container */}
<div className="crm-table-container">
  <table className="crm-table">
    <thead className="crm-table-header">
      <tr className="crm-table-header-row">
        <th className="crm-table-header-cell">
          <div className="crm-table-header-content">
            <span>Header 1</span>
          </div>
        </th>
        {/* More headers */}
      </tr>
    </thead>
    <tbody className="crm-table-body">
      <tr className="crm-table-row">
        <td className="crm-table-cell">Data 1</td>
        {/* More cells */}
      </tr>
    </tbody>
  </table>
</div>
\`\`\`

## Step 8: Update Action Buttons
Replace action buttons with:
\`\`\`tsx
<div className="crm-action-buttons">
  <button className="crm-btn crm-btn-sm crm-btn-success">
    <Eye />
  </button>
  <button className="crm-btn crm-btn-sm crm-btn-secondary">
    <Edit2 />
  </button>
  <button className="crm-btn crm-btn-sm crm-btn-danger">
    <Trash2 />
  </button>
</div>
\`\`\`

## Step 9: Add Status Badges
Replace status indicators with:
\`\`\`tsx
<span className="crm-badge crm-badge-present">Active</span>
<span className="crm-badge crm-badge-absent">Inactive</span>
<span className="crm-badge crm-badge-late">Warning</span>
<span className="crm-badge crm-badge-not-marked">Unknown</span>
\`\`\`

## Step 10: Add Pagination (If Needed)
Add pagination at the bottom:
\`\`\`tsx
{/* Pagination */}
<div className="crm-pagination">
  <p className="crm-pagination-info">
    Showing 1 to 10 of 100 results
  </p>
  <div className="crm-pagination-controls">
    <button className="crm-btn crm-btn-secondary">Previous</button>
    <span>Page 1 of 10</span>
    <button className="crm-btn crm-btn-secondary">Next</button>
  </div>
</div>
\`\`\`

## Available CSS Classes:

### Layout Classes:
- \`crm-page\` - Main page wrapper
- \`crm-container\` - Content container
- \`crm-header\` - Header section
- \`crm-content-card\` - Main content wrapper

### Stats Cards:
- \`crm-stats-grid\` - Grid container
- \`crm-stat-card\` with variants: \`blue\`, \`green\`, \`red\`, \`orange\`

### Tables:
- \`crm-table\` - Table element
- \`crm-table-header\` - Table header
- \`crm-table-body\` - Table body
- \`crm-table-row\` - Table row
- \`crm-table-cell\` - Table cell

### Buttons:
- \`crm-btn\` - Base button
- Variants: \`crm-btn-primary\`, \`crm-btn-secondary\`, \`crm-btn-success\`, \`crm-btn-warning\`, \`crm-btn-danger\`
- Sizes: \`crm-btn-sm\` - Small button

### Badges:
- \`crm-badge\` - Base badge
- Variants: \`crm-badge-present\`, \`crm-badge-absent\`, \`crm-badge-late\`, \`crm-badge-not-marked\`

### Utilities:
- \`crm-hidden-mobile\` - Hide on mobile
- \`crm-hidden-desktop\` - Hide on desktop
- \`crm-loading\` - Loading state
- \`crm-empty-state\` - Empty state

## Color Scheme:
- Blue: Primary/Total counts
- Green: Success/Present/Active
- Red: Error/Critical/Absent
- Orange: Warning/Late/Pending

For a complete example, see: \`src/components/examples/CRMDesignExample.tsx\`
`;

console.log("🎨 CRM Design System Application Guide");
console.log("=====================================");
console.log(DESIGN_GUIDE);

// Check if global CSS file exists
const globalCSSPath = path.join(__dirname, 'src', 'styles', 'global-crm-design.css');
if (fs.existsSync(globalCSSPath)) {
  console.log("✅ Global CRM CSS file found at: src/styles/global-crm-design.css");
} else {
  console.log("❌ Global CRM CSS file not found. Please create src/styles/global-crm-design.css first.");
}

// Check if example file exists
const examplePath = path.join(__dirname, 'src', 'components', 'examples', 'CRMDesignExample.tsx');
if (fs.existsSync(examplePath)) {
  console.log("✅ Example component found at: src/components/examples/CRMDesignExample.tsx");
} else {
  console.log("❌ Example component not found. Please create the example component first.");
}

console.log("\n🚀 Ready to apply the design system to your pages!");
console.log("📖 Follow the steps above to update your existing components.");
console.log("🔗 View the example component for a complete reference implementation.");
