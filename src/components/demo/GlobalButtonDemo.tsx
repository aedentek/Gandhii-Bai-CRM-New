import React from 'react';
import { Download, Plus, RefreshCw, Edit2, Trash2, Eye } from 'lucide-react';

const GlobalButtonDemo: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-gray-900">Global Button Design System</h1>
          <p className="text-lg text-gray-600">Standardized button styles for consistent CRM design</p>
        </div>

        {/* Primary Global Buttons */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900">1. Global Primary Buttons (.global-btn)</h2>
          <p className="text-gray-600 mb-6">Based on Export CSV button styling from Doctor Attendance page</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-700">Export Buttons</h3>
              <button className="global-btn">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </button>
              <button className="btn-export-csv">
                <Download className="h-4 w-4 mr-2" />
                Utility Class
              </button>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-700">Add Buttons</h3>
              <button className="global-btn">
                <Plus className="h-4 w-4 mr-2" />
                Add New Item
              </button>
              <button className="btn-add-item">
                <Plus className="h-4 w-4 mr-2" />
                Utility Class
              </button>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-700">Refresh Buttons</h3>
              <button className="global-btn">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </button>
              <button className="btn-refresh">
                <RefreshCw className="h-4 w-4 mr-2" />
                Utility Class
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons for Tables */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900">2. Table Action Buttons (.action-btn-lead)</h2>
          <p className="text-gray-600 mb-6">Based on Edit/Delete buttons from Lead Categories page</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-700">Edit Actions</h3>
              <div className="action-buttons-container">
                <button className="action-btn-lead action-btn-edit" title="Edit Item">
                  <Edit2 className="h-4 w-4" />
                </button>
                <span className="text-sm text-gray-600">Blue theme for edit actions</span>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-700">Delete Actions</h3>
              <div className="action-buttons-container">
                <button className="action-btn-lead action-btn-delete" title="Delete Item">
                  <Trash2 className="h-4 w-4" />
                </button>
                <span className="text-sm text-gray-600">Red theme for delete actions</span>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-700">View Actions</h3>
              <div className="action-buttons-container">
                <button className="action-btn-lead action-btn-view" title="View Details">
                  <Eye className="h-4 w-4" />
                </button>
                <span className="text-sm text-gray-600">Green theme for view actions</span>
              </div>
            </div>
          </div>

          {/* Complete action button row example */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-700 mb-4">Example Table Row Actions</h4>
            <div className="action-buttons-container">
              <button className="action-btn-lead action-btn-view h-8 w-8 sm:h-9 sm:w-9 p-0" title="View Details">
                <Eye className="h-4 w-4" />
              </button>
              <button className="action-btn-lead action-btn-edit h-8 w-8 sm:h-9 sm:w-9 p-0" title="Edit Item">
                <Edit2 className="h-4 w-4" />
              </button>
              <button className="action-btn-lead action-btn-delete h-8 w-8 sm:h-9 sm:w-9 p-0" title="Delete Item">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Responsive Examples */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900">3. Responsive Behavior</h2>
          <p className="text-gray-600 mb-6">Buttons adapt to different screen sizes with proper responsive classes</p>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Responsive Export Button</h3>
              <button className="global-btn flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2">
                <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">CSV</span>
              </button>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Responsive Action Buttons</h3>
              <div className="action-buttons-container">
                <button className="action-btn-lead action-btn-edit h-8 w-8 sm:h-9 sm:w-9 p-0" title="Edit">
                  <Edit2 className="h-3 w-3 sm:h-4 sm:w-4" />
                </button>
                <button className="action-btn-lead action-btn-delete h-8 w-8 sm:h-9 sm:w-9 p-0" title="Delete">
                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Guide */}
        <div className="bg-gray-900 text-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold mb-6">4. Usage Guide</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-green-400 font-semibold mb-4">Global Primary Buttons</h3>
              <div className="space-y-3 font-mono text-sm">
                <div className="bg-gray-800 p-3 rounded">
                  <span className="text-blue-400">className=</span>
                  <span className="text-orange-400">"global-btn"</span>
                </div>
                <div className="bg-gray-800 p-3 rounded">
                  <span className="text-blue-400">className=</span>
                  <span className="text-orange-400">"btn-export-csv"</span>
                </div>
                <div className="bg-gray-800 p-3 rounded">
                  <span className="text-blue-400">className=</span>
                  <span className="text-orange-400">"btn-add-item"</span>
                </div>
                <div className="bg-gray-800 p-3 rounded">
                  <span className="text-blue-400">className=</span>
                  <span className="text-orange-400">"btn-refresh"</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-green-400 font-semibold mb-4">Table Action Buttons</h3>
              <div className="space-y-3 font-mono text-sm">
                <div className="bg-gray-800 p-3 rounded">
                  <span className="text-blue-400">className=</span>
                  <span className="text-orange-400">"action-btn-lead action-btn-edit"</span>
                </div>
                <div className="bg-gray-800 p-3 rounded">
                  <span className="text-blue-400">className=</span>
                  <span className="text-orange-400">"action-btn-lead action-btn-delete"</span>
                </div>
                <div className="bg-gray-800 p-3 rounded">
                  <span className="text-blue-400">className=</span>
                  <span className="text-orange-400">"action-btn-lead action-btn-view"</span>
                </div>
                <div className="bg-gray-800 p-3 rounded">
                  <span className="text-blue-400">className=</span>
                  <span className="text-orange-400">"action-buttons-container"</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900">5. Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Shimmer Effects</h3>
              <p className="text-blue-800 text-sm">Elegant shimmer animation on hover for premium feel</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">Responsive Design</h3>
              <p className="text-green-800 text-sm">Adapts perfectly to mobile, tablet, and desktop screens</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-semibold text-purple-900 mb-2">Accessibility</h3>
              <p className="text-purple-800 text-sm">Focus states, reduced motion, and high contrast support</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <h3 className="font-semibold text-orange-900 mb-2">Consistent Styling</h3>
              <p className="text-orange-800 text-sm">Unified design language across all CRM components</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <h3 className="font-semibold text-red-900 mb-2">Dark Mode Ready</h3>
              <p className="text-red-800 text-sm">Built-in dark mode support for future enhancement</p>
            </div>
            <div className="p-4 bg-indigo-50 rounded-lg">
              <h3 className="font-semibold text-indigo-900 mb-2">Performance</h3>
              <p className="text-indigo-800 text-sm">Optimized CSS with minimal impact on bundle size</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default GlobalButtonDemo;
