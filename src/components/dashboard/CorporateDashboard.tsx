import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import usePageTitle from '@/hooks/usePageTitle';
import { cn } from "@/lib/utils";
import {
  Hospital,
  Users,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Package,
  Stethoscope,
  UserPlus,
  Eye,
  RefreshCw,
  Bell,
  Download,
  Clock,
  Wallet,
  Calendar,
  BarChart3,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Search,
  Settings,
  MoreVertical,
  ArrowUpRight,
  HeartHandshake,
  Pill,
  FileText,
  Shield,
  Phone,
  Mail,
  MapPin,
  Award,
  Target,
  Briefcase,
  Plus,
  DollarSign,
  Edit,
  UserCheck,
  ShoppingCart,
  Filter,
  CheckCircle,
  CreditCard
} from 'lucide-react';

interface DashboardProps {
  user: { name: string; role: string };
}

interface DashboardStats {
  totalPatients: number;
  activePatients: number;
  totalStaff: number;
  activeStaff: number;
  totalDoctors: number;
  activeDoctors: number;
  monthlyRevenue: number;
  pendingPayments: number;
  medicineItems: number;
  lowStockItems: number;
  todayAppointments: number;
  pendingAppointments: number;
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

const CorporateDashboard: React.FC<DashboardProps> = ({ user }) => {
  const { toast } = useToast();
  
  // Set custom page title  
  usePageTitle('Dashboard - Gandhi Bai Healthcare');

  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 2847,
    activePatients: 2823,
    totalStaff: 45,
    activeStaff: 42,
    totalDoctors: 18,
    activeDoctors: 16,
    monthlyRevenue: 2850000,
    pendingPayments: 125000,
    medicineItems: 1247,
    lowStockItems: 23,
    todayAppointments: 48,
    pendingAppointments: 5
  });

  const [reminders, setReminders] = useState<ReminderItem[]>([
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
    },
    {
      id: '5',
      type: 'appointment',
      title: 'New Patient Consultation',
      description: 'Ms. Kavita Mehta - Initial checkup',
      date: new Date().toISOString().split('T')[0],
      priority: 'medium',
      status: 'pending'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const currentDate = new Date().toISOString().split('T')[0];
  
  const todayReminders = reminders.filter(reminder => 
    reminder.date === currentDate && 
    reminder.status === 'pending' &&
    (filterPriority === 'all' || reminder.priority === filterPriority) &&
    (searchTerm === '' || 
     reminder.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
     reminder.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Simulate fast loading
    setTimeout(() => setLoading(false), 800);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'appointment': return <Calendar className="w-4 h-4" />;
      case 'payment': return <CreditCard className="w-4 h-4" />;
      case 'medicine': return <Pill className="w-4 h-4" />;
      case 'followup': return <Activity className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
          <div className="space-y-2">
            <p className="text-xl font-semibold text-gray-800">Loading Gandhi Bai Healthcare...</p>
            <p className="text-sm text-gray-600">Preparing your professional dashboard</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Gandhi Bai Healthcare</h1>
                  <p className="text-xs text-gray-500">Comprehensive Medical CRM</p>
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
              <Button variant="outline" size="sm" className="hidden sm:flex">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600">
                <Plus className="w-4 h-4 mr-2" />
                Quick Actions
              </Button>
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-blue-600 text-white text-sm font-semibold">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome back, {user.name} 👋
              </h2>
              <p className="text-gray-600">
                Here's what's happening at Gandhi Bai Healthcare today, {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-3">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Patients Card */}
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Users className="w-8 h-8 text-blue-100" />
                <Badge variant="secondary" className="bg-blue-400/20 text-blue-100 border-blue-300/30">
                  +12.5%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">{stats.totalPatients.toLocaleString()}</h3>
                <p className="text-blue-100 text-sm">Total Patients</p>
                <div className="flex items-center text-xs text-blue-200">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  <span>+{stats.totalPatients - stats.activePatients} today</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Card */}
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <DollarSign className="w-8 h-8 text-green-100" />
                <Badge variant="secondary" className="bg-green-400/20 text-green-100 border-green-300/30">
                  +8.2%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">{formatCurrency(stats.monthlyRevenue)}</h3>
                <p className="text-green-100 text-sm">Monthly Revenue</p>
                <div className="flex items-center text-xs text-green-200">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  <span>{formatCurrency(stats.pendingPayments)} pending</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Medical Team Card */}
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Stethoscope className="w-8 h-8 text-purple-100" />
                <Badge variant="secondary" className="bg-purple-400/20 text-purple-100 border-purple-300/30">
                  {stats.pendingAppointments} pending
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">{stats.activeDoctors + stats.activeStaff}</h3>
                <p className="text-purple-100 text-sm">Medical Team</p>
                <div className="flex items-center text-xs text-purple-200">
                  <UserCheck className="w-3 h-3 mr-1" />
                  <span>{stats.activeDoctors} doctors • {stats.activeStaff} staff</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inventory Card */}
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Pill className="w-8 h-8 text-orange-100" />
                <Badge variant="secondary" className="bg-orange-400/20 text-orange-100 border-orange-300/30">
                  {stats.lowStockItems} low stock
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">{stats.medicineItems.toLocaleString()}</h3>
                <p className="text-orange-100 text-sm">Medicine Items</p>
                <div className="flex items-center text-xs text-orange-200">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  <span>{stats.lowStockItems} need restocking</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Today's Reminders */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                      <Bell className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-gray-900">Today's Priority Reminders</CardTitle>
                      <CardDescription>Current tasks for {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {todayReminders.length} items
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {/* Search and Filter */}
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search reminders..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant={filterPriority === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterPriority('all')}
                      >
                        All
                      </Button>
                      <Button
                        variant={filterPriority === 'high' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterPriority('high')}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        High
                      </Button>
                      <Button
                        variant={filterPriority === 'medium' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterPriority('medium')}
                        className="text-yellow-600 border-yellow-200 hover:bg-yellow-50"
                      >
                        Medium
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Reminders Table */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/50">
                        <TableHead className="font-semibold text-gray-900">Type</TableHead>
                        <TableHead className="font-semibold text-gray-900">Task</TableHead>
                        <TableHead className="font-semibold text-gray-900">Priority</TableHead>
                        <TableHead className="font-semibold text-gray-900">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {todayReminders.length > 0 ? (
                        todayReminders.map((reminder) => (
                          <TableRow key={reminder.id} className="hover:bg-gray-50/50 transition-colors">
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <div className={cn(
                                  "w-8 h-8 rounded-lg flex items-center justify-center",
                                  reminder.type === 'appointment' && "bg-blue-100 text-blue-600",
                                  reminder.type === 'payment' && "bg-green-100 text-green-600",
                                  reminder.type === 'medicine' && "bg-orange-100 text-orange-600",
                                  reminder.type === 'followup' && "bg-purple-100 text-purple-600"
                                )}>
                                  {getTypeIcon(reminder.type)}
                                </div>
                                <span className="font-medium text-sm capitalize">{reminder.type}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-medium text-gray-900">{reminder.title}</div>
                                <div className="text-sm text-gray-500">{reminder.description}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getPriorityColor(reminder.priority)}>
                                {reminder.priority.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button variant="ghost" size="sm">
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8">
                            <div className="text-gray-500">
                              <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                              <p>No reminders for today</p>
                              <p className="text-sm">You're all caught up! 🎉</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            {/* Quick Navigation */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900">Quick Navigation</CardTitle>
                <CardDescription>Access key modules</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start h-12" asChild>
                  <a href="/patients/list">
                    <Users className="w-5 h-5 mr-3" />
                    Patient Management
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-start h-12" asChild>
                  <a href="/staff/list">
                    <UserCheck className="w-5 h-5 mr-3" />
                    Staff Management
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-start h-12" asChild>
                  <a href="/doctors/list">
                    <Stethoscope className="w-5 h-5 mr-3" />
                    Doctors Directory
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-start h-12" asChild>
                  <a href="/medicine">
                    <Pill className="w-5 h-5 mr-3" />
                    Medicine Inventory
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-start h-12" asChild>
                  <a href="/patients/payment-fees">
                    <CreditCard className="w-5 h-5 mr-3" />
                    Accounts & Payments
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-start h-12" asChild>
                  <a href="/grocery">
                    <ShoppingCart className="w-5 h-5 mr-3" />
                    Grocery Management
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900">System Health</CardTitle>
                <CardDescription>Real-time system monitoring</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-600">Database</span>
                  </div>
                  <Badge className="bg-green-100 text-green-700">Online</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-600">API Services</span>
                  </div>
                  <Badge className="bg-green-100 text-green-700">Running</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-gray-600">Backup Status</span>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700">Scheduled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <span className="text-sm text-gray-600">Storage</span>
                  </div>
                  <Badge className="bg-orange-100 text-orange-700">78% Used</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900">Recent Activity</CardTitle>
                <CardDescription>Latest system updates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">New patient registered</p>
                      <p className="text-gray-500">Mrs. Kavita Patel - 2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">Payment received</p>
                      <p className="text-gray-500">₹15,000 from Mr. Sharma - 3 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">Medicine restocked</p>
                      <p className="text-gray-500">Paracetamol 500mg - 4 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">Appointment scheduled</p>
                      <p className="text-gray-500">Mr. Kumar with Dr. Singh - 4 hours ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CorporateDashboard;

// export default CorporateDashboard;
