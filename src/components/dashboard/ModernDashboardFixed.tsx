import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import MobileDashboard from './MobileDashboard';
import {
  Users, 
  Stethoscope, 
  Calendar, 
  Pill,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  AlertCircle,
  CheckCircle,
  Heart,
  UserPlus,
  ClipboardCheck,
  Download,
  IndianRupee,
  Eye,
  Star,
  Settings,
  Bell,
  Menu,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardProps {
  user: { name: string; role: string };
}

// Hook to detect mobile screen size
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
};

// Mock data for demonstration
const mockData = {
  stats: {
    earning: 628,
    share: 2434,
    likes: 1259,
    rating: 8.5
  },
  chartData: [
    { month: 'Jan', value: 45 },
    { month: 'Feb', value: 52 },
    { month: 'Mar', value: 48 },
    { month: 'Apr', value: 61 },
    { month: 'May', value: 55 },
    { month: 'Jun', value: 58 },
    { month: 'Jul', value: 62 },
    { month: 'Aug', value: 49 },
    { month: 'Sep', value: 44 },
    { month: 'Oct', value: 53 },
    { month: 'Nov', value: 67 },
    { month: 'Dec', value: 71 }
  ],
  completion: 45
};

const ModernDashboard: React.FC<DashboardProps> = ({ user }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const isMobile = useIsMobile();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Return mobile layout for small screens
  if (isMobile) {
    return <MobileDashboard user={user} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard User</h1>
            <p className="text-gray-600 mt-1">Welcome back, {user.name}</p>
          </div>
          
          {/* Header Actions */}
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                3
              </span>
            </Button>
            <Button variant="outline" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
            <div className="hidden md:block">
              <div className="flex items-center gap-3 pl-3 border-l">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/api/placeholder/32/32" />
                  <AvatarFallback className="bg-blue-600 text-white">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <div className="font-medium">{user.name}</div>
                  <div className="text-gray-500">{user.role}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
        {/* Earning Card */}
        <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Earning</p>
                <p className="text-2xl font-bold">$ {mockData.stats.earning}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-lg">
                <IndianRupee className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Share Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Share</p>
                <p className="text-2xl font-bold text-gray-900">{mockData.stats.share}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Likes Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Likes</p>
                <p className="text-2xl font-bold text-gray-900">{mockData.stats.likes}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Heart className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rating Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Rating</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-gray-900">{mockData.stats.rating}</p>
                  <Star className="h-5 w-5 text-yellow-500 fill-current" />
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Star className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Results Chart */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Result</CardTitle>
                <CardDescription>Monthly performance overview</CardDescription>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                2024
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="h-64 md:h-80">
                {/* Chart Container */}
                <div className="w-full h-full flex items-end justify-between gap-2 p-4">
                  {mockData.chartData.map((item, index) => (
                    <div key={item.month} className="flex flex-col items-center gap-2 flex-1">
                      <div className="relative w-full bg-gray-200 rounded-t-sm min-h-[40px]">
                        <div 
                          className={cn(
                            "absolute bottom-0 w-full rounded-t-sm transition-all duration-500",
                            index % 2 === 0 ? "bg-blue-500" : "bg-orange-400"
                          )}
                          style={{ height: `${item.value}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 font-medium">{item.month}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full" />
                    <span className="text-sm text-gray-600">Current Year</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-400 rounded-full" />
                    <span className="text-sm text-gray-600">Previous Year</span>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Wave Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>Real-time analytics overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-40 md:h-48 relative overflow-hidden">
                {/* Animated wave background */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="gradient1" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.1" />
                    </linearGradient>
                    <linearGradient id="gradient2" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.1" />
                    </linearGradient>
                  </defs>
                  
                  {/* Blue wave */}
                  <path
                    d="M0,100 Q100,50 200,80 T400,60 L400,200 L0,200 Z"
                    fill="url(#gradient1)"
                  />
                  
                  {/* Orange wave */}
                  <path
                    d="M0,120 Q100,80 200,100 T400,90 L400,200 L0,200 Z"
                    fill="url(#gradient2)"
                  />
                  
                  {/* Wave lines */}
                  <path
                    d="M0,100 Q100,50 200,80 T400,60"
                    stroke="#3B82F6"
                    strokeWidth="2"
                    fill="none"
                  />
                  <path
                    d="M0,120 Q100,80 200,100 T400,90"
                    stroke="#F59E0B"
                    strokeWidth="2"
                    fill="none"
                  />
                </svg>
                
                {/* Legend */}
                <div className="absolute top-4 left-4 flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span className="text-sm text-gray-600">Lorem Ipsum</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-400 rounded-full" />
                    <span className="text-sm text-gray-600">Dolor Amet</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Completion Card */}
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="relative inline-block">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="#E5E7EB"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="#F59E0B"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - mockData.completion / 100)}`}
                      className="transition-all duration-500"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold text-gray-900">{mockData.completion}%</span>
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="font-semibold text-gray-900">Lorem Ipsum</h3>
                  <p className="text-sm text-gray-600 mt-1">Lorem Ipsum</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Button */}
          <Card>
            <CardContent className="p-6">
              <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                Check Now
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Patient
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Appointment
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <ClipboardCheck className="h-4 w-4 mr-2" />
                View Reports
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ModernDashboard;
