import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import usePageTitle from '@/hooks/usePageTitle';
import { cn } from "@/lib/utils";
import {
  Users,
  TrendingUp,
  TrendingDown,
  Package,
  Stethoscope,
  RefreshCw,
  Bell,
  Download,
  Clock,
  Calendar,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Search,
  Plus,
  DollarSign,
  UserCheck,
  ShoppingCart,
  CheckCircle,
  CreditCard,
  Sparkles,
  Target,
  Star,
  ArrowRight,
  MoreHorizontal,
  Heart,
  ShieldCheck,
  Rocket,
  Database,
  Wifi,
  Pill,
  Eye
} from 'lucide-react';

interface DashboardProps {
  user: { name: string; role: string };
}

interface MetricCard {
  id: string;
  title: string;
  value: string;
  change: number;
  trend: 'up' | 'down';
  icon: React.ComponentType<any>;
  color: string;
  description: string;
  progress: number;
}

interface ReminderItem {
  id: string;
  type: 'appointment' | 'payment' | 'medicine' | 'followup';
  title: string;
  description: string;
  date: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'completed';
}

// Memoized components for better performance
const MetricCard = memo(({ metric }: { metric: MetricCard }) => {
  const Icon = metric.icon;
  return (
    <Card className={cn(
      "relative overflow-hidden border-0 bg-gradient-to-br shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-[1.02] group cursor-pointer",
      metric.color
    )}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
      
      <CardHeader className="pb-3 relative z-10">
        <div className="flex items-center justify-between">
          <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl group-hover:bg-white/30 transition-all duration-300">
            <Icon className="w-8 h-8 text-white drop-shadow-sm" />
          </div>
          <Badge 
            variant="secondary" 
            className={cn(
              "bg-white/20 backdrop-blur-sm text-white border-white/30 font-semibold",
              metric.trend === 'up' ? 'shadow-green-500/20' : 'shadow-red-500/20'
            )}
          >
            <div className="flex items-center gap-1">
              {metric.trend === 'up' ? 
                <TrendingUp className="w-3 h-3" /> : 
                <TrendingDown className="w-3 h-3" />
              }
              {metric.change}%
            </div>
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="relative z-10">
        <div className="space-y-3">
          <div>
            <h3 className="text-3xl font-bold text-white drop-shadow-sm">{metric.value}</h3>
            <p className="text-white/90 text-sm font-medium">{metric.title}</p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-white/80">
              <span>{metric.description}</span>
              <span>{metric.progress}%</span>
            </div>
            <Progress value={metric.progress} className="h-2 bg-white/20">
              <div className="bg-white/80 h-full rounded-full transition-all duration-500" />
            </Progress>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

const QuickActionButton = memo(({ action, onClick }: { action: any; onClick: () => void }) => {
  const Icon = action.icon;
  return (
    <Button
      variant="outline"
      className="w-full justify-start h-16 border-0 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-indigo-50 hover:shadow-lg transition-all duration-300 transform hover:scale-105 group"
      onClick={onClick}
    >
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300", action.color)}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="text-left">
        <div className="font-semibold text-gray-900 text-sm">{action.title}</div>
        <div className="text-xs text-gray-500">{action.description}</div>
      </div>
      <ArrowRight className="w-4 h-4 ml-auto text-gray-400 group-hover:text-blue-500 transition-colors duration-300" />
    </Button>
  );
});

const CorporateDashboard: React.FC<DashboardProps> = memo(({ user }) => {
  const { toast } = useToast();
  usePageTitle('Dashboard - Gandhi Bai Healthcare');

  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  // Optimized static data with useMemo
  const metrics = useMemo<MetricCard[]>(() => [
    {
      id: 'patients',
      title: 'Total Patients',
      value: '2,847',
      change: 12.5,
      trend: 'up',
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      description: '+23 new today',
      progress: 85
    },
    {
      id: 'revenue',
      title: 'Monthly Revenue',
      value: '₹28.5L',
      change: 8.2,
      trend: 'up',
      icon: DollarSign,
      color: 'from-green-500 to-emerald-500',
      description: '₹1.25L pending',
      progress: 92
    },
    {
      id: 'team',
      title: 'Medical Team',
      value: '63',
      change: 2.1,
      trend: 'up',
      icon: Stethoscope,
      color: 'from-purple-500 to-pink-500',
      description: '18 doctors, 45 staff',
      progress: 78
    },
    {
      id: 'inventory',
      title: 'Medicine Stock',
      value: '1,247',
      change: -5.2,
      trend: 'down',
      icon: Package,
      color: 'from-orange-500 to-red-500',
      description: '23 items low stock',
      progress: 65
    }
  ], []);

  const quickActions = useMemo(() => [
    {
      id: 'patients',
      title: 'Patient Management',
      description: 'View and manage records',
      icon: Users,
      color: 'bg-blue-500',
      href: '/patients/list'
    },
    {
      id: 'appointments',
      title: 'Appointments',
      description: 'Schedule & manage visits',
      icon: Calendar,
      color: 'bg-green-500',
      href: '/appointments'
    },
    {
      id: 'inventory',
      title: 'Medicine Inventory',
      description: 'Manage medicine stock',
      icon: Package,
      color: 'bg-purple-500',
      href: '/medicine'
    },
    {
      id: 'payments',
      title: 'Accounts & Payments',
      description: 'Handle transactions',
      icon: CreditCard,
      color: 'bg-orange-500',
      href: '/patients/payment-fees'
    },
    {
      id: 'staff',
      title: 'Staff Management',
      description: 'Manage team & salaries',
      icon: UserCheck,
      color: 'bg-indigo-500',
      href: '/staff/list'
    },
    {
      id: 'grocery',
      title: 'Grocery Management',
      description: 'Track supplies',
      icon: ShoppingCart,
      color: 'bg-pink-500',
      href: '/grocery'
    }
  ], []);

  const reminders = useMemo<ReminderItem[]>(() => [
    {
      id: '1',
      type: 'appointment',
      title: 'Follow-up Appointment',
      description: 'Mrs. Priya Sharma - Diabetes checkup',
      date: new Date().toISOString().split('T')[0],
      priority: 'high',
      status: 'pending'
    },
    {
      id: '2',
      type: 'payment',
      title: 'Payment Due',
      description: 'Mr. Rajesh Kumar - Monthly fees ₹15,000',
      date: new Date().toISOString().split('T')[0],
      priority: 'medium',
      status: 'pending'
    },
    {
      id: '3',
      type: 'medicine',
      title: 'Low Stock Alert',
      description: 'Paracetamol 500mg - Only 50 tablets left',
      date: new Date().toISOString().split('T')[0],
      priority: 'high',
      status: 'pending'
    },
    {
      id: '4',
      type: 'followup',
      title: 'Lab Report Follow-up',
      description: 'Mr. Suresh Patel - Blood test results review',
      date: new Date().toISOString().split('T')[0],
      priority: 'medium',
      status: 'pending'
    }
  ], []);

  // Optimized filtered reminders with useMemo
  const todayReminders = useMemo(() => {
    const currentDate = new Date().toISOString().split('T')[0];
    return reminders.filter(reminder => 
      reminder.date === currentDate && 
      reminder.status === 'pending' &&
      (filterPriority === 'all' || reminder.priority === filterPriority) &&
      (searchTerm === '' || 
       reminder.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
       reminder.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [reminders, filterPriority, searchTerm]);

  // Optimized callbacks
  const handleQuickAction = useCallback((href: string) => {
    window.location.href = href;
  }, []);

  const handleRefresh = useCallback(() => {
    toast({
      title: "Dashboard Updated",
      description: "All data has been refreshed successfully.",
    });
  }, [toast]);

  const getPriorityColor = useCallback((priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }, []);

  const getTypeIcon = useCallback((type: string) => {
    switch (type) {
      case 'appointment': return <Calendar className="w-4 h-4" />;
      case 'payment': return <CreditCard className="w-4 h-4" />;
      case 'medicine': return <Pill className="w-4 h-4" />;
      case 'followup': return <Activity className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  }, []);

  // Optimized effects
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every minute instead of every second
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Super fast loading
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent rounded-full animate-pulse border-t-blue-400"></div>
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-2">
              <Rocket className="w-6 h-6 text-blue-600" />
              Lightning Fast Loading...
            </h3>
            <p className="text-sm text-gray-600">Gandhi Bai Healthcare CRM</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Ultra-Fast Header */}
      <div className="bg-white/90 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-50 shadow-lg">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Rocket className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Gandhi Bai Healthcare</h1>
                  <p className="text-xs text-gray-500">⚡ Lightning Fast CRM</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="hidden md:flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600 font-medium">
                  {currentTime.toLocaleTimeString()}
                </span>
              </div>
              
              <Button variant="outline" size="sm" onClick={handleRefresh} className="hidden sm:flex">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              
              <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg hover:shadow-xl transition-all duration-300">
                <Plus className="w-4 h-4 mr-2" />
                Quick Actions
              </Button>
              
              <Avatar className="h-8 w-8 ring-2 ring-blue-200">
                <AvatarFallback className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Optimized Welcome Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                Welcome back, {user.name} 
                <div className="flex items-center gap-1">
                  <Star className="w-6 h-6 text-yellow-500" />
                  <Sparkles className="w-5 h-5 text-blue-500" />
                </div>
              </h2>
              <p className="text-gray-600">
                ⚡ Super-fast dashboard • {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Optimized Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric) => (
            <MetricCard key={metric.id} metric={metric} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Today's Reminders - Optimized */}
          <div className="lg:col-span-2">
            <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-xl overflow-hidden">
              <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Bell className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
                        Today's Priority Tasks
                        <Target className="w-5 h-5 text-blue-600" />
                      </CardTitle>
                      <CardDescription>
                        Lightning-fast filtered view • {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 px-3 py-1 text-sm font-semibold">
                    {todayReminders.length} items
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                {/* Ultra-fast Search and Filter */}
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="⚡ Instant search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 border-0 bg-white shadow-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      {['all', 'high', 'medium'].map((priority) => (
                        <Button
                          key={priority}
                          variant={filterPriority === priority ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setFilterPriority(priority)}
                          className={cn(
                            "transition-all duration-200",
                            priority === 'high' && "text-red-600 border-red-200 hover:bg-red-50",
                            priority === 'medium' && "text-yellow-600 border-yellow-200 hover:bg-yellow-50"
                          )}
                        >
                          {priority.charAt(0).toUpperCase() + priority.slice(1)}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Optimized Reminders List */}
                <div className="divide-y divide-gray-100">
                  {todayReminders.length > 0 ? (
                    todayReminders.map((reminder) => (
                      <div key={reminder.id} className="p-4 hover:bg-gray-50/50 transition-colors duration-200 group">
                        <div className="flex items-center space-x-4">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200",
                            reminder.type === 'appointment' && "bg-blue-100 text-blue-600",
                            reminder.type === 'payment' && "bg-green-100 text-green-600",
                            reminder.type === 'medicine' && "bg-orange-100 text-orange-600",
                            reminder.type === 'followup' && "bg-purple-100 text-purple-600"
                          )}>
                            {getTypeIcon(reminder.type)}
                          </div>
                          
                          <div className="flex-1 space-y-1">
                            <div className="font-semibold text-gray-900">{reminder.title}</div>
                            <div className="text-sm text-gray-500">{reminder.description}</div>
                          </div>
                          
                          <Badge className={getPriorityColor(reminder.priority)}>
                            {reminder.priority.toUpperCase()}
                          </Badge>
                          
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm" className="hover:bg-blue-50">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="hover:bg-green-50">
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-gray-500 space-y-3">
                        <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto">
                          <CheckCircle className="w-8 h-8 text-white" />
                        </div>
                        <p className="text-lg font-semibold text-gray-700">All caught up! 🎉</p>
                        <p className="text-sm">No reminders for today - you're doing great!</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Optimized Sidebar */}
          <div className="space-y-6">
            {/* Lightning Quick Actions */}
            <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-xl">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-purple-600" />
                  Quick Navigation
                </CardTitle>
                <CardDescription>Lightning-fast access</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                {quickActions.map((action) => (
                  <QuickActionButton 
                    key={action.id} 
                    action={action} 
                    onClick={() => handleQuickAction(action.href)} 
                  />
                ))}
              </CardContent>
            </Card>

            {/* System Health - Optimized */}
            <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-xl">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-green-600" />
                  System Performance
                </CardTitle>
                <CardDescription>Real-time monitoring</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
                {[
                  { name: 'Database', status: 'Online', icon: Database, color: 'text-green-500' },
                  { name: 'API Services', status: 'Running', icon: Wifi, color: 'text-green-500' },
                  { name: 'Backup', status: 'Scheduled', icon: ShieldCheck, color: 'text-blue-500' },
                  { name: 'Performance', status: 'Optimized', icon: Rocket, color: 'text-purple-500' }
                ].map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                      <div className="flex items-center space-x-3">
                        <Icon className={cn("h-4 w-4", item.color)} />
                        <span className="text-sm text-gray-600">{item.name}</span>
                      </div>
                      <Badge className="bg-green-100 text-green-700 text-xs">{item.status}</Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Recent Activity - Super Fast */}
            <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-xl">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50">
                <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-orange-600" />
                  Live Activity
                </CardTitle>
                <CardDescription>Real-time updates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
                {[
                  { title: 'New Patient', desc: 'Mrs. Kavita Patel', time: '2 min', color: 'bg-green-500' },
                  { title: 'Payment Received', desc: '₹15,000 from Mr. Sharma', time: '3 min', color: 'bg-blue-500' },
                  { title: 'Medicine Restocked', desc: 'Paracetamol 500mg', time: '5 min', color: 'bg-orange-500' }
                ].map((item, index) => (
                  <div key={index} className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                    <div className={cn("w-2 h-2 rounded-full mt-2", item.color)}></div>
                    <div className="text-sm flex-1">
                      <p className="font-medium text-gray-900">{item.title}</p>
                      <p className="text-gray-500">{item.desc} • {item.time} ago</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
});

export default CorporateDashboard;
