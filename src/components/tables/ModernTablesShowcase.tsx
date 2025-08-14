import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import ModernTableDemo from './ModernTableDemo';
import { 
  Table, 
  Users, 
  Building,
  Eye,
  Settings,
  Database,
  BarChart3,
  FileText,
  Package,
  UserCheck,
  Calendar,
  Stethoscope,
  Pill
} from 'lucide-react';

const ModernTablesShowcase: React.FC = () => {
  const [activeExample, setActiveExample] = useState<string | null>(null);

  const tableExamples = [
    {
      id: 'basic',
      title: 'Basic Data Table',
      description: 'Clean data presentation with search and filters',
      icon: <Table className="h-5 w-5" />,
      color: 'blue',
      demo: {
        title: 'Users Directory',
        subtitle: 'Manage system users and their permissions'
      }
    },
    {
      id: 'suppliers',
      title: 'Supplier Management',
      description: 'Advanced table with action buttons and status',
      icon: <Building className="h-5 w-5" />,
      color: 'green',
      demo: {
        title: 'Supplier Database',
        subtitle: 'Track and manage your business suppliers'
      }
    },
    {
      id: 'staff',
      title: 'Staff Directory',
      description: 'Employee management with photos and roles',
      icon: <UserCheck className="h-5 w-5" />,
      color: 'purple',
      demo: {
        title: 'Staff Management',
        subtitle: 'Manage your healthcare staff and departments'
      }
    },
    {
      id: 'patients',
      title: 'Patient Records',
      description: 'Medical records with patient information',
      icon: <Stethoscope className="h-5 w-5" />,
      color: 'red',
      demo: {
        title: 'Patient Database',
        subtitle: 'Comprehensive patient management system'
      }
    },
    {
      id: 'inventory',
      title: 'Medicine Inventory',
      description: 'Stock tracking and inventory management',
      icon: <Pill className="h-5 w-5" />,
      color: 'orange',
      demo: {
        title: 'Medicine Stock',
        subtitle: 'Track medicine inventory and expiration dates'
      }
    },
    {
      id: 'analytics',
      title: 'Analytics Dashboard',
      description: 'Data visualization and reporting tables',
      icon: <BarChart3 className="h-5 w-5" />,
      color: 'indigo',
      demo: {
        title: 'Performance Analytics',
        subtitle: 'Monitor system performance and user activity'
      }
    }
  ];

  const colorClasses = {
    blue: 'border-blue-200 hover:border-blue-300 bg-blue-50/50',
    green: 'border-green-200 hover:border-green-300 bg-green-50/50',
    purple: 'border-purple-200 hover:border-purple-300 bg-purple-50/50',
    red: 'border-red-200 hover:border-red-300 bg-red-50/50',
    orange: 'border-orange-200 hover:border-orange-300 bg-orange-50/50',
    indigo: 'border-indigo-200 hover:border-indigo-300 bg-indigo-50/50'
  };

  const iconColorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    red: 'text-red-600',
    orange: 'text-orange-600',
    indigo: 'text-indigo-600'
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl text-white">
            <Table className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">
            Modern Tables Showcase
          </h1>
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Experience the new modern table design system with enhanced user experience, 
          beautiful styling, and powerful functionality for your CRM.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Badge variant="outline" className="px-3 py-1 text-sm">
            <Database className="h-4 w-4 mr-2" />
            Advanced Data Display
          </Badge>
          <Badge variant="outline" className="px-3 py-1 text-sm">
            <Eye className="h-4 w-4 mr-2" />
            Interactive Actions
          </Badge>
          <Badge variant="outline" className="px-3 py-1 text-sm">
            <Settings className="h-4 w-4 mr-2" />
            Customizable Design
          </Badge>
        </div>
      </div>

      {/* Table Examples Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tableExamples.map((example) => (
          <Card 
            key={example.id} 
            className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${colorClasses[example.color as keyof typeof colorClasses]}`}
          >
            <CardHeader className="text-center space-y-3">
              <div className={`mx-auto p-3 rounded-xl bg-white shadow-sm ${iconColorClasses[example.color as keyof typeof iconColorClasses]}`}>
                {example.icon}
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                {example.title}
              </CardTitle>
              <p className="text-gray-600 text-sm">
                {example.description}
              </p>
            </CardHeader>
            <CardContent className="text-center">
              <Dialog>
                <DialogTrigger asChild>
                  <button 
                    className="modern-form-btn-primary w-full"
                    onClick={() => setActiveExample(example.id)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Table
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                  <ModernTableDemo
                    title={example.demo.title}
                    subtitle={example.demo.subtitle}
                  />
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Features Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-center mb-8 text-gray-900">
          Table Design Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="text-center border-gray-200 hover:border-blue-300 hover:shadow-md transition-all">
            <CardHeader>
              <div className="mx-auto p-3 bg-blue-100 text-blue-600 rounded-xl w-fit">
                <Table className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg">Modern Design</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Professional gradient headers with beautiful styling and smooth animations
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-gray-200 hover:border-green-300 hover:shadow-md transition-all">
            <CardHeader>
              <div className="mx-auto p-3 bg-green-100 text-green-600 rounded-xl w-fit">
                <Settings className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg">Interactive Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Color-coded action buttons with hover effects and tooltips
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-gray-200 hover:border-purple-300 hover:shadow-md transition-all">
            <CardHeader>
              <div className="mx-auto p-3 bg-purple-100 text-purple-600 rounded-xl w-fit">
                <Database className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg">Advanced Features</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Search, filtering, pagination, and sorting capabilities
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all">
            <CardHeader>
              <div className="mx-auto p-3 bg-indigo-100 text-indigo-600 rounded-xl w-fit">
                <Eye className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg">User Experience</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Responsive design with loading states and empty state handling
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Implementation Features */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-center text-xl text-blue-900 flex items-center justify-center gap-2">
            <FileText className="h-5 w-5" />
            Table System Features
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Design Elements:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Gradient header backgrounds with icons</li>
                <li>• Professional blue color scheme</li>
                <li>• Hover effects and smooth transitions</li>
                <li>• Status badges with color coding</li>
                <li>• Row striping and selection states</li>
                <li>• Shadow effects and rounded corners</li>
                <li>• Modern typography and spacing</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Functional Features:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Real-time search functionality</li>
                <li>• Advanced filtering options</li>
                <li>• Pagination with page controls</li>
                <li>• Row selection and bulk actions</li>
                <li>• Action buttons with tooltips</li>
                <li>• Loading and empty states</li>
                <li>• Responsive mobile design</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Action Buttons */}
      <Card className="bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200">
        <CardHeader>
          <CardTitle className="text-center text-xl text-gray-900 flex items-center justify-center gap-2">
            <Settings className="h-5 w-5" />
            Available Action Buttons
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center space-y-2">
              <button className="modern-table-action-btn view w-full">
                <Eye className="w-4 h-4" />
              </button>
              <p className="text-xs text-gray-600">View Details</p>
            </div>
            <div className="text-center space-y-2">
              <button className="modern-table-action-btn edit w-full">
                <Settings className="w-4 h-4" />
              </button>
              <p className="text-xs text-gray-600">Edit Record</p>
            </div>
            <div className="text-center space-y-2">
              <button className="modern-table-action-btn delete w-full">
                <FileText className="w-4 h-4" />
              </button>
              <p className="text-xs text-gray-600">Delete Item</p>
            </div>
            <div className="text-center space-y-2">
              <button className="modern-table-action-btn approve w-full">
                <Users className="w-4 h-4" />
              </button>
              <p className="text-xs text-gray-600">Approve</p>
            </div>
            <div className="text-center space-y-2">
              <button className="modern-table-action-btn warning w-full">
                <Calendar className="w-4 h-4" />
              </button>
              <p className="text-xs text-gray-600">Warning</p>
            </div>
            <div className="text-center space-y-2">
              <button className="modern-table-action-btn secondary w-full">
                <Package className="w-4 h-4" />
              </button>
              <p className="text-xs text-gray-600">Secondary</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModernTablesShowcase;
