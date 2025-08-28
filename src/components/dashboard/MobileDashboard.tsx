import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Search,
  Bell,
  Settings,
  User,
  Home,
  BarChart3,
  Calendar,
  MessageSquare,
  MapPin,
  File,
  Menu,
  X,
  Plus,
  Download,
  Star,
  TrendingUp,
  Heart,
  IndianRupee
} from 'lucide-react';

interface MobileDashboardProps {
  user: { name: string; role: string };
}

const MobileDashboard: React.FC<MobileDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const stats = [
    { label: 'Earning', value: '₹62,800', color: 'blue', icon: IndianRupee },
    { label: 'Share', value: '2434', color: 'orange', icon: TrendingUp },
    { label: 'Likes', value: '1259', color: 'yellow', icon: Heart },
    { label: 'Rating', value: '8.5', color: 'green', icon: Star }
  ];

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'messages', label: 'Messages', icon: MessageSquare, badge: 3 },
    { id: 'files', label: 'Files', icon: File }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Mobile Header */}
      <header className="bg-white shadow-sm border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/api/placeholder/32/32" />
            <AvatarFallback className="bg-blue-600 text-white text-sm">
              {user.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Hi, {user.name.split(' ')[0]}</h1>
            <p className="text-xs text-gray-500">{user.role}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
              3
            </span>
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Search Bar */}
      <div className="px-4 py-3 bg-white border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input 
            placeholder="Search..." 
            className="pl-10 bg-gray-50 border-0 focus:bg-white focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className={`${
                stat.color === 'blue' ? 'bg-blue-600 text-white' : 'bg-white'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${
                        stat.color === 'blue' ? 'text-blue-100' : 'text-gray-600'
                      }`}>
                        {stat.label}
                      </p>
                      <p className={`text-xl font-bold ${
                        stat.color === 'blue' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {stat.value}
                      </p>
                    </div>
                    <div className={`p-2 rounded-lg ${
                      stat.color === 'blue' 
                        ? 'bg-white/20' 
                        : stat.color === 'orange' 
                        ? 'bg-orange-100' 
                        : stat.color === 'yellow'
                        ? 'bg-yellow-100'
                        : 'bg-green-100'
                    }`}>
                      <Icon className={`h-5 w-5 ${
                        stat.color === 'blue' 
                          ? 'text-white' 
                          : stat.color === 'orange'
                          ? 'text-orange-600'
                          : stat.color === 'yellow'
                          ? 'text-yellow-600'
                          : 'text-green-600'
                      }`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Chart Section */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Results</CardTitle>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                2024
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-32 flex items-end justify-between gap-1 p-2">
              {[45, 52, 48, 61, 55, 58, 62, 49, 44, 53, 67, 71].map((value, index) => (
                <div key={index} className="flex flex-col items-center gap-1 flex-1">
                  <div className="relative w-full bg-gray-200 rounded-t-sm min-h-[20px]">
                    <div 
                      className={`absolute bottom-0 w-full rounded-t-sm transition-all duration-500 ${
                        index % 2 === 0 ? 'bg-blue-500' : 'bg-orange-400'
                      }`}
                      style={{ height: `${value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center mt-3">
              <Button variant="outline" size="sm" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Progress Circle */}
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="relative inline-block">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    stroke="#E5E7EB"
                    strokeWidth="6"
                    fill="transparent"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    stroke="#F59E0B"
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 32}`}
                    strokeDashoffset={`${2 * Math.PI * 32 * (1 - 45 / 100)}`}
                    className="transition-all duration-500"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-gray-900">45%</span>
                </div>
              </div>
              <div className="mt-3">
                <h3 className="font-semibold text-gray-900">Project Progress</h3>
                <p className="text-sm text-gray-600 mt-1">Almost there!</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Check Now
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm">
                <User className="h-4 w-4 mr-2" />
                Add User
              </Button>
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t px-2 py-2">
        <div className="flex items-center justify-around">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <Button
                key={item.id}
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center space-y-1 h-auto py-2 px-3 relative ${
                  isActive ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
                {item.badge && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </Button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default MobileDashboard;
