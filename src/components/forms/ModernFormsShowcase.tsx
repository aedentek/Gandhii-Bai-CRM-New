import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import ModernFormExample from './ModernFormExample';
import { 
  FileText, 
  Users, 
  Building, 
  Eye, 
  Settings, 
  Plus,
  Edit,
  UserPlus,
  Building2,
  Stethoscope,
  Pill,
  Calendar
} from 'lucide-react';

const ModernFormsShowcase: React.FC = () => {
  const [activeExample, setActiveExample] = useState<string | null>(null);

  const formExamples = [
    {
      id: 'basic',
      title: 'Basic Contact Form',
      description: 'Simple contact form with validation',
      icon: <FileText className="h-5 w-5" />,
      color: 'blue',
      demo: {
        title: 'Contact Information',
        subtitle: 'Enter your contact details'
      }
    },
    {
      id: 'user',
      title: 'User Registration',
      description: 'User account creation form',
      icon: <UserPlus className="h-5 w-5" />,
      color: 'green',
      demo: {
        title: 'Create User Account',
        subtitle: 'Set up a new user account'
      }
    },
    {
      id: 'supplier',
      title: 'Supplier Management',
      description: 'Add new supplier information',
      icon: <Building2 className="h-5 w-5" />,
      color: 'purple',
      demo: {
        title: 'Add New Supplier',
        subtitle: 'Enter supplier company details'
      }
    },
    {
      id: 'patient',
      title: 'Patient Registration',
      description: 'Medical patient intake form',
      icon: <Stethoscope className="h-5 w-5" />,
      color: 'red',
      demo: {
        title: 'Patient Registration',
        subtitle: 'Enter patient medical information'
      }
    },
    {
      id: 'medicine',
      title: 'Medicine Inventory',
      description: 'Add medicine to inventory',
      icon: <Pill className="h-5 w-5" />,
      color: 'orange',
      demo: {
        title: 'Add Medicine',
        subtitle: 'Register new medicine in inventory'
      }
    },
    {
      id: 'appointment',
      title: 'Appointment Booking',
      description: 'Schedule medical appointments',
      icon: <Calendar className="h-5 w-5" />,
      color: 'indigo',
      demo: {
        title: 'Book Appointment',
        subtitle: 'Schedule a medical consultation'
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
            <FileText className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">
            Modern Forms Showcase
          </h1>
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Experience the new modern form design system inspired by contemporary UI/UX patterns. 
          Clean, accessible, and beautifully styled forms for your CRM.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Badge variant="outline" className="px-3 py-1 text-sm">
            <Settings className="h-4 w-4 mr-2" />
            Modern Design System
          </Badge>
          <Badge variant="outline" className="px-3 py-1 text-sm">
            <Eye className="h-4 w-4 mr-2" />
            Accessibility Focused
          </Badge>
          <Badge variant="outline" className="px-3 py-1 text-sm">
            <Users className="h-4 w-4 mr-2" />
            User Experience
          </Badge>
        </div>
      </div>

      {/* Form Examples Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {formExamples.map((example) => (
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
                    View Form
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <ModernFormExample
                    title={example.demo.title}
                    subtitle={example.demo.subtitle}
                    onSubmit={(data) => {
                      console.log('Form submitted:', data);
                      alert(`${example.title} form submitted successfully!`);
                    }}
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
          Design System Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="text-center border-gray-200 hover:border-blue-300 hover:shadow-md transition-all">
            <CardHeader>
              <div className="mx-auto p-3 bg-blue-100 text-blue-600 rounded-xl w-fit">
                <FileText className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg">Modern Styling</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Clean, modern aesthetic with gradient accents and smooth animations
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-gray-200 hover:border-green-300 hover:shadow-md transition-all">
            <CardHeader>
              <div className="mx-auto p-3 bg-green-100 text-green-600 rounded-xl w-fit">
                <Settings className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg">Consistent Design</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Unified design language across all forms and components
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-gray-200 hover:border-purple-300 hover:shadow-md transition-all">
            <CardHeader>
              <div className="mx-auto p-3 bg-purple-100 text-purple-600 rounded-xl w-fit">
                <Eye className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg">User Focused</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Intuitive interactions with clear feedback and validation
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all">
            <CardHeader>
              <div className="mx-auto p-3 bg-indigo-100 text-indigo-600 rounded-xl w-fit">
                <Users className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg">Accessible</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                WCAG compliant with keyboard navigation and screen reader support
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Implementation Note */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-center text-xl text-blue-900 flex items-center justify-center gap-2">
            <FileText className="h-5 w-5" />
            Implementation Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">CSS Classes Available:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <code className="bg-blue-100 px-1 rounded">modern-form-container</code></li>
                <li>• <code className="bg-blue-100 px-1 rounded">modern-form-card</code></li>
                <li>• <code className="bg-blue-100 px-1 rounded">modern-form-header</code></li>
                <li>• <code className="bg-blue-100 px-1 rounded">modern-form-section</code></li>
                <li>• <code className="bg-blue-100 px-1 rounded">modern-form-group</code></li>
                <li>• <code className="bg-blue-100 px-1 rounded">modern-form-input</code></li>
                <li>• <code className="bg-blue-100 px-1 rounded">modern-form-btn-primary</code></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Form Components:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Input fields with focus states</li>
                <li>• Select dropdowns with custom styling</li>
                <li>• Textarea with auto-resize</li>
                <li>• Checkbox and radio buttons</li>
                <li>• File upload areas</li>
                <li>• Button variants (primary, secondary, danger)</li>
                <li>• Error states and validation feedback</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModernFormsShowcase;
