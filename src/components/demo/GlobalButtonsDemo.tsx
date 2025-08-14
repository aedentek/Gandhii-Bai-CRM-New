import React from 'react';
import { RefreshCw, Download, Plus, Calendar, Trash2, X } from 'lucide-react';

const GlobalButtonsDemo: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Global Header Buttons Demo</h1>
          <p className="text-lg text-gray-600">Standardized button styles for consistent UI across all pages</p>
        </div>

        {/* Complete Button Set Example */}
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Complete Header Button Set</h2>
          <div className="header-actions-container">
            <button className="header-action-btn--refresh">
              <RefreshCw className="header-action-btn__icon" />
              <span className="header-action-btn__text">Refresh</span>
            </button>
            
            <button className="header-action-btn--date-selector">
              <span className="header-action-btn__text">August 2025</span>
            </button>
            
            <button className="header-action-btn--export">
              <Download className="header-action-btn__icon" />
              <span className="header-action-btn__text header-action-btn__text--sm-hidden">Export CSV</span>
            </button>
            
            <button className="header-action-btn--clear">
              <X className="header-action-btn__icon" />
              <span className="header-action-btn__text">Clear Filter</span>
            </button>
            
            <button className="header-action-btn--primary">
              <Plus className="header-action-btn__icon" />
              <span className="header-action-btn__text">Add Lead</span>
            </button>
          </div>
        </div>

        {/* Individual Button Types */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Refresh Button</h3>
            <button className="header-action-btn--refresh">
              <RefreshCw className="header-action-btn__icon" />
              <span className="header-action-btn__text">Refresh Data</span>
            </button>
            <p className="text-sm text-gray-600 mt-2">Blue theme, spinning icon when loading</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Date Selector</h3>
            <button className="header-action-btn--date-selector">
              <Calendar className="header-action-btn__icon" />
              <span className="header-action-btn__text">Select Month</span>
            </button>
            <p className="text-sm text-gray-600 mt-2">Purple theme for date/time controls</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Export Button</h3>
            <button className="header-action-btn--export">
              <Download className="header-action-btn__icon" />
              <span className="header-action-btn__text">Export Data</span>
            </button>
            <p className="text-sm text-gray-600 mt-2">Green theme for export/download actions</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Primary Action</h3>
            <button className="header-action-btn--primary">
              <Plus className="header-action-btn__icon" />
              <span className="header-action-btn__text">Add New Item</span>
            </button>
            <p className="text-sm text-gray-600 mt-2">Gradient theme for main actions</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Clear/Reset Button</h3>
            <button className="header-action-btn--clear">
              <X className="header-action-btn__icon" />
              <span className="header-action-btn__text">Clear Filters</span>
            </button>
            <p className="text-sm text-gray-600 mt-2">Gray theme for neutral actions</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Warning/Delete Button</h3>
            <button className="header-action-btn--warning">
              <Trash2 className="header-action-btn__icon" />
              <span className="header-action-btn__text">Delete Item</span>
            </button>
            <p className="text-sm text-gray-600 mt-2">Red theme for destructive actions</p>
          </div>
        </div>

        {/* Quick Utility Classes */}
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Quick Utility Classes</h2>
          <p className="text-gray-600 mb-4">For faster implementation, you can use these utility classes:</p>
          <div className="space-y-2">
            <button className="btn-header-refresh">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh (Utility Class)
            </button>
            <button className="btn-header-export">
              <Download className="w-4 h-4 mr-2" />
              Export (Utility Class)
            </button>
            <button className="btn-header-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add (Utility Class)
            </button>
          </div>
        </div>

        {/* Code Examples */}
        <div className="bg-gray-900 text-white rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Usage Examples</h2>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="text-green-400 font-medium mb-2">Container:</h4>
              <code className="block bg-gray-800 p-2 rounded">{`<div className="header-actions-container">`}</code>
            </div>
            <div>
              <h4 className="text-green-400 font-medium mb-2">Refresh Button:</h4>
              <code className="block bg-gray-800 p-2 rounded">
{`<button className="header-action-btn--refresh">
  <RefreshCw className="header-action-btn__icon" />
  <span className="header-action-btn__text">Refresh</span>
</button>`}
              </code>
            </div>
            <div>
              <h4 className="text-green-400 font-medium mb-2">Primary Action:</h4>
              <code className="block bg-gray-800 p-2 rounded">
{`<button className="header-action-btn--primary">
  <Plus className="header-action-btn__icon" />
  <span className="header-action-btn__text">Add Lead</span>
</button>`}
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalButtonsDemo;
