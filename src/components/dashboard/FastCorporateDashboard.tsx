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
  Eye,
  Building,
  Globe,
  Zap,
  Crown,
  Award,
  TrendingUp as ChartUp,
  BarChart3,
  PieChart,
  Settings,
  Filter,
  Calendar as CalendarIcon,
  FileText,
  ChevronRight,
  Layers,
  Gauge,
  Signal,
  Shield,
  Lock,
  CheckCircle as CheckIcon,
  BarChart,
  LineChart,
  DollarSign as Revenue,
  Users as Team,
  Building2,
  Briefcase,
  Headphones,
  MessageSquare,
  Map,
  LayoutDashboard
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

// Memoized components for superior performance and stunning visual design
const MetricCard = memo(({ metric }: { metric: MetricCard }) => {
  const Icon = metric.icon;
  return (
    <Card className={cn(
      "relative overflow-hidden border-0 shadow-2xl hover:shadow-3xl transition-all duration-700 transform hover:-translate-y-3 hover:scale-[1.03] group cursor-pointer bg-gradient-to-br",
      metric.color,
      "before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/30 before:via-transparent before:to-black/10 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500"
    )}>
      {/* Floating orbs for premium aesthetic */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-700" />
      <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/15 rounded-full blur-lg group-hover:blur-xl transition-all duration-700" />
      <div className="absolute top-1/2 right-1/3 w-16 h-16 bg-white/10 rounded-full blur-md group-hover:blur-lg transition-all duration-700" />
      
      <CardHeader className="pb-4 relative z-20">
        <div className="flex items-center justify-between">
          <div className="relative">
            <div className="absolute inset-0 bg-white/30 rounded-2xl blur-md group-hover:blur-lg transition-all duration-500" />
            <div className="relative p-4 bg-white/25 backdrop-blur-xl rounded-2xl border border-white/30 group-hover:bg-white/35 group-hover:scale-110 transition-all duration-500 shadow-xl">
              <Icon className="w-8 h-8 text-white drop-shadow-lg filter brightness-110" />
            </div>
          </div>
          <div className="text-right space-y-1">
            <Badge 
              variant="secondary" 
              className={cn(
                "bg-white/30 backdrop-blur-xl text-white border-white/40 font-bold text-xs px-3 py-1.5 shadow-lg",
                "group-hover:bg-white/40 group-hover:scale-105 transition-all duration-300",
                metric.trend === 'up' ? 'shadow-green-400/30' : 'shadow-red-400/30'
              )}
            >
              <div className="flex items-center gap-1.5">
                {metric.trend === 'up' ? 
                  <TrendingUp className="w-3.5 h-3.5" /> : 
                  <TrendingDown className="w-3.5 h-3.5" />
                }
                <span className="font-bold">+{metric.change}%</span>
              </div>
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="relative z-20 space-y-5">
        <div className="space-y-2">
          <h3 className="text-4xl font-black text-white drop-shadow-lg filter brightness-110 tracking-tight">
            {metric.value}
          </h3>
          <p className="text-white/95 text-sm font-semibold tracking-wide uppercase letter-spacing-wide">
            {metric.title}
          </p>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-white/90 font-medium">
            <span className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-white/80 rounded-full animate-pulse" />
              {metric.description}
            </span>
            <span className="font-bold">{metric.progress}%</span>
          </div>
          <div className="relative">
            <div className="w-full h-2.5 bg-white/20 rounded-full backdrop-blur-sm overflow-hidden shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-white/90 via-white/80 to-white/70 rounded-full transition-all duration-1000 ease-out shadow-lg"
                style={{ width: `${metric.progress}%` }}
              />
            </div>
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-full animate-pulse" />
          </div>
        </div>
        
        {/* Premium achievement indicator */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-yellow-300 animate-pulse" />
            <span className="text-white/80 text-xs font-medium">Premium Analytics</span>
          </div>
          <ChevronRight className="w-4 h-4 text-white/60 group-hover:text-white/90 group-hover:translate-x-1 transition-all duration-300" />
        </div>
      </CardContent>
    </Card>
  );
});

const QuickActionButton = memo(({ action, onClick }: { action: any; onClick: () => void }) => {
  const Icon = action.icon;
  return (
    <Button
      variant="ghost"
      className="group relative w-full h-20 p-0 border-0 bg-gradient-to-br from-white via-slate-50 to-gray-100 hover:from-blue-50 hover:via-indigo-50 hover:to-purple-50 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02] hover:-translate-y-1 overflow-hidden rounded-2xl"
      onClick={onClick}
    >
      {/* Premium background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-200/30 rounded-full blur-xl group-hover:bg-blue-300/40 group-hover:scale-125 transition-all duration-700" />
      <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-indigo-200/30 rounded-full blur-lg group-hover:bg-indigo-300/40 group-hover:scale-110 transition-all duration-700" />
      
      <div className="relative z-10 flex items-center w-full px-6 py-4">
        <div className="flex items-center space-x-5 flex-1">
          {/* Premium icon container */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 rounded-2xl blur-md group-hover:blur-lg transition-all duration-500" />
            <div className={cn(
              "relative w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 border border-white/50",
              action.color.replace('bg-', 'bg-gradient-to-br from-').concat('/90 to-').concat(action.color.replace('bg-', '')).concat('/70')
            )}>
              <Icon className="w-7 h-7 text-white drop-shadow-lg filter brightness-110" />
            </div>
          </div>
          
          {/* Premium content area */}
          <div className="text-left space-y-1.5 flex-1">
            <div className="font-bold text-gray-900 text-base tracking-tight group-hover:text-gray-800 transition-colors duration-300">
              {action.title}
            </div>
            <div className="text-sm text-gray-600 font-medium leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
              {action.description}
            </div>
            
            {/* Premium status indicator */}
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-sm" />
                <span className="text-xs text-green-600 font-semibold">Active</span>
              </div>
              <div className="w-px h-3 bg-gray-300" />
              <span className="text-xs text-gray-500 font-medium">Premium</span>
            </div>
          </div>
          
          {/* Premium arrow indicator */}
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center group-hover:from-blue-100 group-hover:to-indigo-100 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-md">
              <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all duration-300" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Premium shine effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000" />
      </div>
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

  // Optimized static data with useMemo - Premium Corporate Metrics
  const metrics = useMemo<MetricCard[]>(() => [
    {
      id: 'patients',
      title: 'Total Active Patients',
      value: '2,847',
      change: 12.5,
      trend: 'up',
      icon: Users,
      color: 'from-blue-600 via-blue-500 to-cyan-400',
      description: '+127 new this month',
      progress: 89
    },
    {
      id: 'revenue',
      title: 'Monthly Revenue',
      value: '₹28.5L',
      change: 15.8,
      trend: 'up',
      icon: DollarSign,
      color: 'from-emerald-600 via-green-500 to-teal-400',
      description: '₹2.1L above target',
      progress: 94
    },
    {
      id: 'team',
      title: 'Medical Excellence Team',
      value: '63',
      change: 4.2,
      trend: 'up',
      icon: Stethoscope,
      color: 'from-purple-600 via-violet-500 to-fuchsia-400',
      description: '18 specialists, 45 staff',
      progress: 82
    },
    {
      id: 'inventory',
      title: 'Smart Inventory',
      value: '1,247',
      change: 8.1,
      trend: 'up',
      icon: Package,
      color: 'from-orange-600 via-amber-500 to-yellow-400',
      description: 'AI-optimized stock levels',
      progress: 76
    }
  ], []);

  const quickActions = useMemo(() => [
    {
      id: 'patients',
      title: 'Patient Care Hub',
      description: 'Comprehensive patient management & records',
      icon: Heart,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      href: '/patients/list'
    },
    {
      id: 'appointments',
      title: 'Smart Scheduling',
      description: 'AI-powered appointment management system',
      icon: CalendarIcon,
      color: 'bg-gradient-to-br from-green-500 to-green-600',
      href: '/appointments'
    },
    {
      id: 'inventory',
      title: 'Intelligent Pharmacy',
      description: 'Advanced medicine inventory & analytics',
      icon: Pill,
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      href: '/medicine'
    },
    {
      id: 'payments',
      title: 'Financial Excellence',
      description: 'Premium payment & billing solutions',
      icon: CreditCard,
      color: 'bg-gradient-to-br from-orange-500 to-orange-600',
      href: '/patients/payment-fees'
    },
    {
      id: 'staff',
      title: 'Team Management',
      description: 'Professional staff & payroll system',
      icon: Briefcase,
      color: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
      href: '/staff/list'
    },
    {
      id: 'analytics',
      title: 'Business Intelligence',
      description: 'Advanced analytics & performance insights',
      icon: BarChart3,
      color: 'bg-gradient-to-br from-pink-500 to-pink-600',
      href: '/analytics'
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center relative overflow-hidden">
        {/* Premium background effects */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent" />
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full animate-pulse"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-indigo-400/20 rounded-full blur-2xl animate-pulse" />
        
        <div className="text-center space-y-8 relative z-10">
          {/* Premium loading spinner */}
          <div className="relative flex items-center justify-center">
            <div className="w-32 h-32 border-4 border-blue-200/30 rounded-full animate-spin border-t-blue-400 shadow-2xl"></div>
            <div className="absolute w-24 h-24 border-4 border-transparent rounded-full animate-pulse border-t-purple-400 shadow-xl"></div>
            <div className="absolute w-16 h-16 border-4 border-transparent rounded-full animate-spin border-t-indigo-400 shadow-lg" style={{ animationDirection: 'reverse' }}></div>
            
            {/* Central premium logo */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-2xl animate-pulse">
                <Building2 className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-4xl font-black text-white flex items-center justify-center gap-3 tracking-tight">
              <Crown className="w-8 h-8 text-yellow-400 animate-bounce" />
              Premium Healthcare CRM
              <Sparkles className="w-6 h-6 text-blue-400 animate-pulse" />
            </h3>
            <p className="text-xl text-blue-100 font-semibold tracking-wide">
              Gandhi Bai Healthcare • Enterprise Edition
            </p>
            <div className="flex items-center justify-center gap-2 mt-6">
              <Zap className="w-5 h-5 text-yellow-400 animate-pulse" />
              <span className="text-blue-200 font-medium">Lightning-fast loading experience...</span>
            </div>
            
            {/* Premium loading progress */}
            <div className="w-80 mx-auto mt-8">
              <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                <div className="h-full bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 rounded-full animate-pulse shadow-lg" style={{ width: '85%' }} />
              </div>
              <p className="text-center text-blue-200 text-sm mt-2 font-medium">Initializing premium features...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 relative overflow-hidden">
      {/* Premium background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-200/30 to-indigo-300/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-purple-200/30 to-pink-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-gradient-to-br from-cyan-200/20 to-blue-300/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Premium floating elements */}
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-blue-300/40 rounded-full animate-float"
            style={{
              top: `${20 + Math.random() * 60}%`,
              left: `${10 + Math.random() * 80}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${4 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* Ultra-Premium Header */}
      <div className="bg-white/95 backdrop-blur-2xl border-b border-gray-200/50 sticky top-0 z-50 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-indigo-600/5" />
        <div className="px-4 sm:px-6 lg:px-8 relative">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-indigo-600/20 rounded-2xl blur-md" />
                  <div className="relative w-14 h-14 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl border border-blue-300/30">
                    <Building2 className="w-8 h-8 text-white filter drop-shadow-lg" />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Gandhi Bai Healthcare</h1>
                    <Crown className="w-5 h-5 text-yellow-500 animate-pulse" />
                  </div>
                  <p className="text-sm text-gray-600 font-semibold flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-500" />
                    Enterprise CRM • Premium Edition
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Premium time display */}
              <div className="hidden md:flex items-center space-x-3 px-4 py-2.5 bg-gradient-to-r from-gray-50 to-gray-100/80 rounded-2xl border border-gray-200/50 shadow-lg backdrop-blur-sm">
                <Clock className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-700 font-semibold">
                  {currentTime.toLocaleTimeString()}
                </span>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-sm" />
              </div>
              
              {/* Premium action buttons */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh} 
                className="hidden sm:flex h-10 px-4 bg-white/80 backdrop-blur-sm border-gray-300/50 hover:bg-white hover:shadow-lg transition-all duration-300 group"
              >
                <RefreshCw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                <span className="font-semibold">Refresh</span>
              </Button>
              
              <Button 
                size="sm" 
                className="h-10 px-6 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 border-0"
              >
                <Plus className="w-4 h-4 mr-2" />
                <span className="font-bold">Quick Action</span>
              </Button>
              
              {/* Premium avatar */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/30 to-indigo-500/30 rounded-full blur-md animate-pulse" />
                <Avatar className="relative h-10 w-10 ring-4 ring-blue-200/50 shadow-xl">
                  <AvatarFallback className="bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 text-white font-black text-sm">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        {/* Premium Welcome Section */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-3">
              <h2 className="text-5xl font-black text-gray-900 mb-3 flex items-center gap-4 tracking-tight">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Welcome back,
                </span>
                <span className="text-gray-800">{user.name}</span>
                <div className="flex items-center gap-2">
                  <Crown className="w-8 h-8 text-yellow-500 animate-bounce" />
                  <Sparkles className="w-6 h-6 text-blue-500 animate-pulse" />
                </div>
              </h2>
              <div className="flex items-center gap-4">
                <p className="text-xl text-gray-600 font-semibold">
                  Enterprise Dashboard • {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
                <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200 px-4 py-1.5 font-bold text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Premium Active
                  </div>
                </Badge>
              </div>
              
              {/* Premium stats summary */}
              <div className="flex items-center gap-6 mt-6">
                {[
                  { icon: TrendingUp, label: 'Growth', value: '+15.2%', color: 'text-green-600' },
                  { icon: Target, label: 'Efficiency', value: '94%', color: 'text-blue-600' },
                  { icon: Award, label: 'Rating', value: '4.9★', color: 'text-yellow-600' }
                ].map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div key={index} className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-sm">
                      <Icon className={cn("w-5 h-5", stat.color)} />
                      <div>
                        <div className="text-xs text-gray-500 font-medium">{stat.label}</div>
                        <div className={cn("text-sm font-bold", stat.color)}>{stat.value}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Premium Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {metrics.map((metric) => (
            <MetricCard key={metric.id} metric={metric} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Premium Today's Reminders */}
          <div className="lg:col-span-2">
            <Card className="shadow-3xl border-0 bg-white/95 backdrop-blur-2xl overflow-hidden relative">
              {/* Premium card background */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-white/50 to-indigo-50/80" />
              <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-200/20 to-transparent rounded-full -translate-y-48 translate-x-48" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-200/20 to-transparent rounded-full translate-y-32 -translate-x-32" />
              
              <CardHeader className="border-b border-gray-200/50 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 backdrop-blur-sm relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-5">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-400/30 to-indigo-500/30 rounded-2xl blur-lg animate-pulse" />
                      <div className="relative w-16 h-16 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl border border-blue-300/30">
                        <Bell className="w-8 h-8 text-white filter drop-shadow-lg" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <CardTitle className="text-2xl font-black text-gray-900 flex items-center gap-3 tracking-tight">
                        Today's Priority Intelligence
                        <Target className="w-6 h-6 text-blue-600 animate-pulse" />
                      </CardTitle>
                      <CardDescription className="text-base text-gray-600 font-semibold">
                        Advanced AI-powered task management • {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100/80 text-blue-800 px-4 py-2 text-base font-black border border-blue-200/50 shadow-lg">
                    {todayReminders.length} active items
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="p-0 relative z-10">
                {/* Premium Search and Filter */}
                <div className="p-8 border-b border-gray-200/30 bg-gradient-to-r from-gray-50/80 to-blue-50/30 backdrop-blur-sm">
                  <div className="flex flex-col sm:flex-row gap-6">
                    <div className="relative flex-1">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl blur-sm" />
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                        <Input
                          placeholder="🔍 Intelligent search across all tasks..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-12 pr-4 py-3 border-0 bg-white/90 backdrop-blur-sm shadow-lg rounded-2xl text-base font-medium focus:bg-white focus:shadow-xl transition-all duration-300"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      {[
                        { key: 'all', label: 'All Tasks', color: 'border-gray-300 hover:bg-gray-50' },
                        { key: 'high', label: 'High Priority', color: 'border-red-300 text-red-600 hover:bg-red-50' },
                        { key: 'medium', label: 'Medium Priority', color: 'border-yellow-300 text-yellow-600 hover:bg-yellow-50' }
                      ].map((priority) => (
                        <Button
                          key={priority.key}
                          variant={filterPriority === priority.key ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setFilterPriority(priority.key)}
                          className={cn(
                            "px-4 py-2.5 font-semibold text-sm transition-all duration-300 rounded-xl shadow-sm hover:shadow-lg transform hover:scale-105",
                            filterPriority === priority.key 
                              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg" 
                              : `bg-white/80 backdrop-blur-sm ${priority.color}`,
                          )}
                        >
                          {priority.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Premium Reminders List */}
                <div className="divide-y divide-gray-100/50">
                  {todayReminders.length > 0 ? (
                    todayReminders.map((reminder) => (
                      <div key={reminder.id} className="p-6 hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-indigo-50/30 transition-all duration-300 group relative overflow-hidden">
                        {/* Premium item background */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%]" />
                        
                        <div className="flex items-center space-x-6 relative z-10">
                          <div className="relative">
                            <div className="absolute inset-0 rounded-2xl blur-md opacity-50 group-hover:opacity-100 transition-opacity duration-300" 
                                 style={{
                                   background: reminder.type === 'appointment' ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' :
                                              reminder.type === 'payment' ? 'linear-gradient(135deg, #10b981, #047857)' :
                                              reminder.type === 'medicine' ? 'linear-gradient(135deg, #f59e0b, #d97706)' :
                                              'linear-gradient(135deg, #8b5cf6, #7c3aed)'
                                 }} />
                            <div className={cn(
                              "relative w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 border border-white/30",
                              reminder.type === 'appointment' && "bg-gradient-to-br from-blue-500 to-blue-600",
                              reminder.type === 'payment' && "bg-gradient-to-br from-green-500 to-green-600",
                              reminder.type === 'medicine' && "bg-gradient-to-br from-orange-500 to-orange-600",
                              reminder.type === 'followup' && "bg-gradient-to-br from-purple-500 to-purple-600"
                            )}>
                              {getTypeIcon(reminder.type)}
                            </div>
                          </div>
                          
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                              <h3 className="font-bold text-gray-900 text-lg group-hover:text-gray-800 transition-colors duration-300">
                                {reminder.title}
                              </h3>
                              <Badge className={cn(
                                "px-3 py-1.5 text-xs font-bold rounded-xl shadow-sm border",
                                getPriorityColor(reminder.priority)
                              )}>
                                {reminder.priority.toUpperCase()} PRIORITY
                              </Badge>
                            </div>
                            <p className="text-gray-600 font-medium leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                              {reminder.description}
                            </p>
                            
                            {/* Premium metadata */}
                            <div className="flex items-center gap-4 mt-3">
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <CalendarIcon className="w-4 h-4" />
                                <span className="font-medium">Today</span>
                              </div>
                              <div className="w-px h-4 bg-gray-300" />
                              <div className="flex items-center gap-2 text-sm text-blue-600">
                                <Activity className="w-4 h-4" />
                                <span className="font-semibold">Active</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Premium action buttons */}
                          <div className="flex items-center space-x-3">
                            <Button variant="ghost" size="sm" className="w-10 h-10 p-0 rounded-xl hover:bg-blue-100 hover:scale-110 transition-all duration-300 group/btn">
                              <Eye className="w-5 h-5 text-gray-500 group-hover/btn:text-blue-600 transition-colors duration-300" />
                            </Button>
                            <Button variant="ghost" size="sm" className="w-10 h-10 p-0 rounded-xl hover:bg-green-100 hover:scale-110 transition-all duration-300 group/btn">
                              <CheckIcon className="w-5 h-5 text-gray-500 group-hover/btn:text-green-600 transition-colors duration-300" />
                            </Button>
                            <Button variant="ghost" size="sm" className="w-10 h-10 p-0 rounded-xl hover:bg-gray-100 hover:scale-110 transition-all duration-300 group/btn">
                              <MoreHorizontal className="w-5 h-5 text-gray-500 group-hover/btn:text-gray-700 transition-colors duration-300" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-20">
                      <div className="text-gray-500 space-y-6">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-br from-green-300/30 to-blue-400/30 rounded-full blur-2xl animate-pulse" />
                          <div className="relative w-24 h-24 bg-gradient-to-br from-green-500 via-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto shadow-2xl">
                            <CheckCircle className="w-12 h-12 text-white filter drop-shadow-lg" />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <p className="text-2xl font-black text-gray-700 flex items-center justify-center gap-2">
                            Outstanding Work! 
                            <Crown className="w-6 h-6 text-yellow-500" />
                          </p>
                          <p className="text-lg text-gray-600 font-semibold">All priority tasks completed - you're ahead of schedule!</p>
                          <div className="flex items-center justify-center gap-2 mt-4">
                            <Star className="w-5 h-5 text-yellow-400" />
                            <span className="text-sm text-gray-500 font-medium">Premium efficiency achieved</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Premium Sidebar */}
          <div className="space-y-8">
            {/* Premium Quick Actions */}
            <Card className="shadow-3xl border-0 bg-white/95 backdrop-blur-2xl overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50/80 via-white/50 to-pink-50/80" />
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-purple-200/20 to-transparent rounded-full -translate-y-32 translate-x-32" />
              
              <CardHeader className="bg-gradient-to-r from-purple-50/90 to-pink-50/90 backdrop-blur-sm relative z-10 border-b border-gray-200/30">
                <CardTitle className="text-xl font-black text-gray-900 flex items-center gap-3 tracking-tight">
                  <Rocket className="w-6 h-6 text-purple-600 animate-pulse" />
                  Enterprise Navigation
                </CardTitle>
                <CardDescription className="text-base text-gray-600 font-semibold">Premium quick access portal</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-6 relative z-10">
                {quickActions.map((action) => (
                  <QuickActionButton 
                    key={action.id} 
                    action={action} 
                    onClick={() => handleQuickAction(action.href)} 
                  />
                ))}
              </CardContent>
            </Card>

            {/* Premium System Intelligence */}
            <Card className="shadow-3xl border-0 bg-white/95 backdrop-blur-2xl overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-50/80 via-white/50 to-emerald-50/80" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-green-200/20 to-transparent rounded-full translate-y-24 -translate-x-24" />
              
              <CardHeader className="bg-gradient-to-r from-green-50/90 to-emerald-50/90 backdrop-blur-sm relative z-10 border-b border-gray-200/30">
                <CardTitle className="text-xl font-black text-gray-900 flex items-center gap-3 tracking-tight">
                  <Shield className="w-6 h-6 text-green-600 animate-pulse" />
                  System Intelligence
                </CardTitle>
                <CardDescription className="text-base text-gray-600 font-semibold">Real-time performance monitoring</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 p-6 relative z-10">
                {[
                  { 
                    name: 'Database Performance', 
                    status: 'Optimal', 
                    icon: Database, 
                    color: 'text-green-600',
                    metric: '99.9% uptime',
                    bgColor: 'bg-green-100/80'
                  },
                  { 
                    name: 'API Response Time', 
                    status: '< 50ms', 
                    icon: Zap, 
                    color: 'text-blue-600',
                    metric: 'Lightning fast',
                    bgColor: 'bg-blue-100/80'
                  },
                  { 
                    name: 'Security Shield', 
                    status: 'Protected', 
                    icon: Lock, 
                    color: 'text-purple-600',
                    metric: 'Enterprise grade',
                    bgColor: 'bg-purple-100/80'
                  },
                  { 
                    name: 'System Health', 
                    status: 'Excellent', 
                    icon: Activity, 
                    color: 'text-emerald-600',
                    metric: '100% operational',
                    bgColor: 'bg-emerald-100/80'
                  }
                ].map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div key={index} className="group p-4 rounded-2xl hover:bg-white/60 transition-all duration-300 cursor-pointer hover:shadow-lg transform hover:scale-[1.02] relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center space-x-4">
                          <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300", item.bgColor)}>
                            <Icon className={cn("h-6 w-6", item.color)} />
                          </div>
                          <div className="space-y-1">
                            <span className="text-sm font-bold text-gray-900">{item.name}</span>
                            <div className="text-xs text-gray-500 font-medium">{item.metric}</div>
                          </div>
                        </div>
                        <Badge className={cn("font-bold text-xs px-3 py-1.5 shadow-sm", item.bgColor, item.color, "border-0")}>
                          {item.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Premium Live Activity Feed */}
            <Card className="shadow-3xl border-0 bg-white/95 backdrop-blur-2xl overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-50/80 via-white/50 to-red-50/80" />
              <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-orange-200/20 to-transparent rounded-full -translate-y-20 -translate-x-20" />
              
              <CardHeader className="bg-gradient-to-r from-orange-50/90 to-red-50/90 backdrop-blur-sm relative z-10 border-b border-gray-200/30">
                <CardTitle className="text-xl font-black text-gray-900 flex items-center gap-3 tracking-tight">
                  <Signal className="w-6 h-6 text-orange-600 animate-pulse" />
                  Live Intelligence Feed
                </CardTitle>
                <CardDescription className="text-base text-gray-600 font-semibold">Real-time business activity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-6 relative z-10">
                {[
                  { 
                    title: 'New Premium Patient', 
                    desc: 'Mrs. Kavita Patel registered', 
                    time: '2 min', 
                    color: 'bg-gradient-to-r from-green-400 to-emerald-500',
                    icon: Heart
                  },
                  { 
                    title: 'Payment Processed', 
                    desc: '₹25,000 from Mr. Sharma', 
                    time: '5 min', 
                    color: 'bg-gradient-to-r from-blue-400 to-cyan-500',
                    icon: CreditCard
                  },
                  { 
                    title: 'Inventory Restocked', 
                    desc: 'Premium medicine delivery', 
                    time: '8 min', 
                    color: 'bg-gradient-to-r from-orange-400 to-red-500',
                    icon: Package
                  },
                  { 
                    title: 'System Backup', 
                    desc: 'Automated data protection', 
                    time: '12 min', 
                    color: 'bg-gradient-to-r from-purple-400 to-pink-500',
                    icon: Shield
                  }
                ].map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div key={index} className="group flex items-start space-x-4 p-4 rounded-2xl hover:bg-white/60 transition-all duration-300 cursor-pointer hover:shadow-lg transform hover:scale-[1.02] relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="relative">
                        <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300", item.color)}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-pulse shadow-sm" />
                      </div>
                      <div className="text-sm flex-1 space-y-1 relative z-10">
                        <p className="font-bold text-gray-900 group-hover:text-gray-800 transition-colors duration-300">{item.title}</p>
                        <p className="text-gray-600 font-medium group-hover:text-gray-700 transition-colors duration-300">{item.desc}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500 font-medium">{item.time} ago</span>
                          <div className="w-px h-3 bg-gray-300" />
                          <span className="text-xs text-green-600 font-semibold">Live</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
});

export default CorporateDashboard;
