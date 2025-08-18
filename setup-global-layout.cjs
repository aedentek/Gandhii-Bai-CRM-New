/**
 * Global Layout Setup Script
 * 
 * This script helps you apply the global page layout design system to all pages in your CRM project.
 * Run this script to automatically add the global CSS import to your main files.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const projectRoot = process.cwd();
const srcPath = path.join(projectRoot, 'src');
const globalCSSImport = "import './styles/global-page-layout.css';";

// Files that should have the global CSS import
const mainFiles = [
  'src/App.tsx',
  'src/main.tsx',
  'src/index.tsx'
];

// Function to add import to a file if not already present
function addGlobalCSSImport(filePath) {
  const fullPath = path.join(projectRoot, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ File not found: ${filePath}`);
    return false;
  }

  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    
    // Check if import already exists
    if (content.includes("global-page-layout.css")) {
      console.log(`✅ ${filePath} already has global CSS import`);
      return true;
    }

    // Find the best place to add the import (after other CSS imports)
    const lines = content.split('\n');
    let insertIndex = 0;
    
    // Look for existing CSS imports
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes("import") && lines[i].includes(".css")) {
        insertIndex = i + 1;
      } else if (lines[i].includes("import") && !lines[i].includes(".css")) {
        if (insertIndex === 0) insertIndex = i + 1;
      }
    }

    // If no imports found, add at the beginning
    if (insertIndex === 0) {
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() !== '' && !lines[i].startsWith('//') && !lines[i].startsWith('/*')) {
          insertIndex = i;
          break;
        }
      }
    }

    // Insert the import
    lines.splice(insertIndex, 0, globalCSSImport);
    const newContent = lines.join('\n');
    
    fs.writeFileSync(fullPath, newContent);
    console.log(`✅ Added global CSS import to ${filePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Function to create a component template with global layout
function createComponentTemplate(componentName, componentType = 'page') {
  const templates = {
    page: `import React, { useState, useEffect } from 'react';
import { Search, Plus, Download, Edit, Trash2, Eye } from 'lucide-react';
import '../styles/global-page-layout.css';

interface ${componentName}Props {
  // Define your props here
}

const ${componentName}: React.FC<${componentName}Props> = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  useEffect(() => {
    // Load your data here
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Fetch your data here
      // const response = await fetch('/api/your-endpoint');
      // const data = await response.json();
      // setData(data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="global-page">
      {/* Page Header */}
      <div className="global-page-header">
        <div className="global-page-header-content">
          <div>
            <h1 className="global-page-title">${componentName.replace(/([A-Z])/g, ' $1').trim()}</h1>
            <p className="global-page-subtitle">Manage your ${componentName.toLowerCase()} efficiently</p>
          </div>
          <div className="global-page-header-actions">
            <button className="global-btn global-btn-secondary">
              <Download className="w-4 h-4" />
              Export
            </button>
            <button className="global-btn global-btn-primary">
              <Plus className="w-4 h-4" />
              Add New
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="global-content">
        {/* Search Section */}
        <div className="global-search-section">
          <div className="global-search-grid">
            <input 
              className="global-search-input" 
              placeholder="Search..." 
            />
            <button className="global-btn global-btn-secondary">
              <Search className="w-4 h-4" />
              Search
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="global-table-container">
          <div className="global-table-header">
            <h3 className="global-table-title">${componentName} List</h3>
            <div className="global-table-actions">
              <button className="global-btn global-btn-primary">
                <Plus className="w-4 h-4" />
                Add New
              </button>
            </div>
          </div>
          
          <table className="global-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="text-center py-8">
                    Loading...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-8">
                    No data found
                  </td>
                </tr>
              ) : (
                data.map((item, index) => (
                  <tr key={index}>
                    <td>{item.id}</td>
                    <td>{item.name}</td>
                    <td>
                      <div className="flex justify-center gap-2">
                        <button className="global-btn global-btn-secondary p-2">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="global-btn global-btn-secondary p-2">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="global-btn global-btn-danger p-2">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ${componentName};`,
    
    form: `import React, { useState } from 'react';
import { Save, X, Upload } from 'lucide-react';
import '../styles/global-page-layout.css';

interface ${componentName}Props {
  onSave?: (data: any) => void;
  onCancel?: () => void;
  initialData?: any;
}

const ${componentName}: React.FC<${componentName}Props> = ({ onSave, onCancel, initialData }) => {
  const [formData, setFormData] = useState(initialData || {
    name: '',
    email: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      // Handle form submission
      if (onSave) {
        await onSave(formData);
      }
    } catch (error) {
      console.error('Error saving data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="global-page">
      {/* Page Header */}
      <div className="global-page-header">
        <div className="global-page-header-content">
          <h1 className="global-page-title">
            {initialData ? 'Edit' : 'Add'} ${componentName.replace(/([A-Z])/g, ' $1').trim()}
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="global-content">
        <form onSubmit={handleSubmit}>
          <div className="global-form-container">
            <div className="global-form-header">
              <h3 className="global-form-title">
                ${componentName.replace(/([A-Z])/g, ' $1').trim()} Information
              </h3>
            </div>
            
            <div className="global-form-content">
              <div className="global-form-grid">
                <div>
                  <label className="block text-sm font-medium global-text-secondary mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    className="global-search-input w-full"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium global-text-secondary mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    className="global-search-input w-full"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter email"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium global-text-secondary mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    className="global-search-input w-full"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
            </div>
            
            <div className="global-form-actions">
              <div className="flex gap-2">
                <button
                  type="button"
                  className="global-btn global-btn-secondary"
                  onClick={onCancel}
                  disabled={loading}
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  type="submit"
                  className="global-btn global-btn-primary"
                  disabled={loading}
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ${componentName};`
  };

  return templates[componentType] || templates.page;
}

// Main execution
console.log('🚀 Setting up Global Page Layout Design System...\n');

// 1. Add global CSS import to main files
console.log('📝 Adding global CSS imports to main files:');
let successCount = 0;
for (const file of mainFiles) {
  if (addGlobalCSSImport(file)) {
    successCount++;
  }
}

console.log(`\n✅ Successfully added imports to ${successCount}/${mainFiles.length} files\n`);

// 2. Check if global CSS file exists
const globalCSSPath = path.join(srcPath, 'styles', 'global-page-layout.css');
if (fs.existsSync(globalCSSPath)) {
  console.log('✅ Global CSS file exists: src/styles/global-page-layout.css');
} else {
  console.log('❌ Global CSS file not found. Please ensure src/styles/global-page-layout.css exists.');
}

// 3. Check if guide exists
const guidePath = path.join(srcPath, 'styles', 'GLOBAL_LAYOUT_GUIDE.md');
if (fs.existsSync(guidePath)) {
  console.log('✅ Guide file exists: src/styles/GLOBAL_LAYOUT_GUIDE.md');
} else {
  console.log('❌ Guide file not found. Please ensure src/styles/GLOBAL_LAYOUT_GUIDE.md exists.');
}

// 4. Check if example component exists
const examplePath = path.join(srcPath, 'components', 'examples', 'GlobalLayoutExample.tsx');
if (fs.existsSync(examplePath)) {
  console.log('✅ Example component exists: src/components/examples/GlobalLayoutExample.tsx');
} else {
  console.log('❌ Example component not found. Please ensure src/components/examples/GlobalLayoutExample.tsx exists.');
}

console.log('\n🎉 Global Layout Setup Complete!\n');

console.log('📋 Next Steps:');
console.log('1. Review the guide: src/styles/GLOBAL_LAYOUT_GUIDE.md');
console.log('2. Check the example: src/components/examples/GlobalLayoutExample.tsx');
console.log('3. Apply global classes to your existing components');
console.log('4. Use the component templates for new pages\n');

console.log('🎨 Key Classes to Use:');
console.log('• .global-page - Wrap your entire page');
console.log('• .global-page-header - Beautiful page headers');
console.log('• .global-content - Main content area');
console.log('• .global-table-container - Enhanced tables');
console.log('• .global-form-container - Professional forms');
console.log('• .global-btn .global-btn-primary - Styled buttons');
console.log('• .global-card - Content cards\n');

// Function to generate component if requested
process.argv.forEach((arg, index) => {
  if (arg === '--generate' && process.argv[index + 1]) {
    const componentName = process.argv[index + 1];
    const componentType = process.argv[index + 2] || 'page';
    
    const componentPath = path.join(srcPath, 'components', `${componentName}.tsx`);
    const template = createComponentTemplate(componentName, componentType);
    
    if (!fs.existsSync(componentPath)) {
      fs.writeFileSync(componentPath, template);
      console.log(`✅ Generated component: src/components/${componentName}.tsx`);
    } else {
      console.log(`❌ Component already exists: src/components/${componentName}.tsx`);
    }
  }
});

console.log('💡 To generate a new component with global layout:');
console.log('   node setup-global-layout.cjs --generate ComponentName [page|form]');

module.exports = {
  addGlobalCSSImport,
  createComponentTemplate
};
