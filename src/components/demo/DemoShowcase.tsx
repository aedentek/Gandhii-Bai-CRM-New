import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Palette,
  Monitor,
  Smartphone,
  Tablet,
  Layout,
  BarChart3,
  Users,
  Settings,
  Eye,
  Code,
  Zap,
  Star,
  Check
} from 'lucide-react';

const DemoShowcase: React.FC = () => {
  const [selectedView, setSelectedView] = useState('desktop');

  const features = [
    {
      icon: Layout,
      title: 'Modern Dashboard Design',
      description: 'Clean, professional interface matching the provided design',
      status: 'completed'
    },
    {
      icon: Smartphone,
      title: 'Mobile Responsive',
      description: 'Automatically adapts to mobile screens with touch-friendly interface',
      status: 'completed'
    },
    {
      icon: BarChart3,
      title: 'Interactive Charts',
      description: 'Beautiful animated charts and data visualizations',
      status: 'completed'
    },
    {
      icon: Users,
      title: 'User Profile Integration',
      description: 'Dynamic user information and avatar display',
      status: 'completed'
    },
    {
      icon: Palette,
      title: 'Modern Color Scheme',
      description: 'Blue/orange theme matching the reference design',
      status: 'completed'
    },
    {
      icon: Zap,
      title: 'Smooth Animations',
      description: 'Subtle transitions and hover effects',
      status: 'completed'
    }
  ];

  const viewports = [
    { id: 'desktop', label: 'Desktop', icon: Monitor, width: '100%' },
    { id: 'tablet', label: 'Tablet', icon: Tablet, width: '768px' },
    { id: 'mobile', label: 'Mobile', icon: Smartphone, width: '375px' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Modern Dashboard Design
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            A responsive, modern dashboard interface based on your design reference
          </p>
          
          {/* Status Badge */}
          <Badge className="bg-green-100 text-green-800 px-4 py-2 text-lg">
            <Check className="h-4 w-4 mr-2" />
            Implementation Complete
          </Badge>
        </div>

        {/* Viewport Selector */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-lg">
            {viewports.map((viewport) => {
              const Icon = viewport.icon;
              return (
                <Button
                  key={viewport.id}
                  variant={selectedView === viewport.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedView(viewport.id)}
                  className="mx-1"
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {viewport.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="mb-8">
          <Card className="overflow-hidden">
            <CardHeader className="bg-gray-50 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Live Preview
                </CardTitle>
                <Badge variant="secondary">
                  {viewports.find(v => v.id === selectedView)?.width}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex justify-center bg-gray-200 p-4">
                <div 
                  className="bg-white rounded-lg shadow-xl transition-all duration-300"
                  style={{ 
                    width: viewports.find(v => v.id === selectedView)?.width,
                    maxWidth: '100%',
                    height: selectedView === 'mobile' ? '600px' : '500px'
                  }}
                >
                  <iframe
                    src="/dashboard"
                    className="w-full h-full rounded-lg"
                    title="Dashboard Preview"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3">
                        {feature.description}
                      </p>
                      <Badge 
                        variant={feature.status === 'completed' ? 'default' : 'secondary'}
                        className={feature.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        {feature.status === 'completed' ? 'Completed' : 'In Progress'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Implementation Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Technical Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Technical Implementation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Framework & Tools:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• React 18 + TypeScript</li>
                  <li>• Tailwind CSS for styling</li>
                  <li>• shadcn/ui component library</li>
                  <li>• Lucide React icons</li>
                  <li>• Responsive design patterns</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Key Features:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Auto-detects screen size</li>
                  <li>• Modern sidebar navigation</li>
                  <li>• Interactive data visualization</li>
                  <li>• Smooth animations</li>
                  <li>• Touch-friendly mobile interface</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Design Specifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Design Specifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Color Scheme:</h4>
                <div className="grid grid-cols-4 gap-2">
                  <div className="space-y-1">
                    <div className="w-full h-8 bg-blue-600 rounded"></div>
                    <span className="text-xs text-gray-600">Primary Blue</span>
                  </div>
                  <div className="space-y-1">
                    <div className="w-full h-8 bg-orange-500 rounded"></div>
                    <span className="text-xs text-gray-600">Accent Orange</span>
                  </div>
                  <div className="space-y-1">
                    <div className="w-full h-8 bg-gray-900 rounded"></div>
                    <span className="text-xs text-gray-600">Sidebar Dark</span>
                  </div>
                  <div className="space-y-1">
                    <div className="w-full h-8 bg-gray-50 rounded border"></div>
                    <span className="text-xs text-gray-600">Background</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Layout:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Left sidebar navigation</li>
                  <li>• Main content area with cards</li>
                  <li>• Stats grid at the top</li>
                  <li>• Chart visualizations</li>
                  <li>• Quick actions sidebar</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-8">
          <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
            <a href="/dashboard">
              <Eye className="h-4 w-4 mr-2" />
              View Live Dashboard
            </a>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href="/">
              <Settings className="h-4 w-4 mr-2" />
              Back to Original
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DemoShowcase;
