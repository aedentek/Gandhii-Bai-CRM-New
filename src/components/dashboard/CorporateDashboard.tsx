import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Briefcase
} from 'lucide-react';

interface DashboardProps {
  user: { name: string; role: string };
}

interface DashboardStats {
  patients: {
    total: number;
    newToday: number;
    trend: number;
    appointments: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
    trend: number;
    pending: number;
  };
  staff: {
    totalDoctors: number;
    totalStaff: number;
    pendingSalaries: number;
    onDuty: number;
  };
  inventory: {
    medicineProducts: number;
    lowStock: number;
    categories: number;
    orders: number;
  };
  operations: {
    appointments: number;
    consultations: number;
    prescriptions: number;
    emergencies: number;
  };
}

const CorporateDashboard: React.FC<DashboardProps> = ({ user }) => {
  const { toast } = useToast();
  
  // Set custom page title  
  usePageTitle();

  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState<DashboardStats>({
    patients: {
      total: 2847,
      newToday: 23,
      trend: 12.5,
      appointments: 48
    },
    revenue: {
      total: 15420000,
      thisMonth: 2850000,
      trend: 8.2,
      pending: 125000
    },
    staff: {
      totalDoctors: 18,
      totalStaff: 32,
      pendingSalaries: 5,
      onDuty: 24
    },
    inventory: {
      medicineProducts: 1247,
      lowStock: 23,
      categories: 45,
      orders: 12
    },
    operations: {
      appointments: 156,
      consultations: 89,
      prescriptions: 203,
      emergencies: 7
    }
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Simulate fast loading
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading Gandhi Bai CRM...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Corporate Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-8xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Brand Section */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Hospital className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Gandhi Bai Healthcare</h1>
                  <p className="text-sm text-gray-500">Comprehensive Medical CRM</p>
                </div>
              </div>

              {/* Navigation */}
              <nav className="hidden lg:flex items-center space-x-8">
                <Button variant="ghost" className="text-blue-600 bg-blue-50">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
                <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                  <Users className="h-4 w-4 mr-2" />
                  Patients
                </Button>
                <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                  <Stethoscope className="h-4 w-4 mr-2" />
                  Doctors
                </Button>
                <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                  <Calendar className="h-4 w-4 mr-2" />
                  Appointments
                </Button>
                <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                  <Package className="h-4 w-4 mr-2" />
                  Inventory
                </Button>
                <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                  <IndianRupee className="h-4 w-4 mr-2" />
                  Finance
                </Button>
              </nav>
            </div>

            {/* Action Section */}
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600 font-medium">
                  {currentTime.toLocaleTimeString()}
                </span>
              </div>

              <Button variant="outline" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
              </Button>

              <Button variant="outline" size="icon">
                <Search className="h-5 w-5" />
              </Button>

              <Button variant="outline" size="icon">
                <Settings className="h-5 w-5" />
              </Button>

              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-blue-600 text-white text-sm font-semibold">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="max-w-8xl mx-auto px-8 py-8">
        
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {user.name} 👋
              </h2>
              <p className="text-gray-600">
                Here's what's happening at Gandhi Bai Healthcare today, {currentTime.toLocaleDateString('en-IN', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
              <Button variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          {/* Patient Management KPI */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-600 rounded-xl">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  +{stats.patients.trend}%
                </Badge>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-gray-900">{stats.patients.total.toLocaleString()}</h3>
                <p className="text-gray-600 font-medium">Total Patients</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>+{stats.patients.newToday} today</span>
                  <span>•</span>
                  <span>{stats.patients.appointments} appointments</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Revenue KPI */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-600 rounded-xl">
                  <IndianRupee className="h-8 w-8 text-white" />
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  +{stats.revenue.trend}%
                </Badge>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(stats.revenue.thisMonth)}</h3>
                <p className="text-gray-600 font-medium">Monthly Revenue</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>{formatCurrency(stats.revenue.total)} total</span>
                  <span>•</span>
                  <span>{formatCurrency(stats.revenue.pending)} pending</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Staff Management KPI */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-600 rounded-xl">
                  <Stethoscope className="h-8 w-8 text-white" />
                </div>
                <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                  {stats.staff.pendingSalaries} pending
                </Badge>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-gray-900">{stats.staff.totalDoctors + stats.staff.totalStaff}</h3>
                <p className="text-gray-600 font-medium">Medical Team</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>{stats.staff.totalDoctors} doctors</span>
                  <span>•</span>
                  <span>{stats.staff.onDuty} on duty</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inventory KPI */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-600 rounded-xl">
                  <Package className="h-8 w-8 text-white" />
                </div>
                <Badge variant="secondary" className="bg-red-100 text-red-700">
                  {stats.inventory.lowStock} low stock
                </Badge>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-gray-900">{stats.inventory.medicineProducts.toLocaleString()}</h3>
                <p className="text-gray-600 font-medium">Medicine Items</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>{stats.inventory.categories} categories</span>
                  <span>•</span>
                  <span>{stats.inventory.orders} pending orders</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Primary Operations */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Salary Management - Featured Section */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl flex items-center space-x-2">
                      <Wallet className="h-6 w-6" />
                      <span>Staff & Doctor Salary Management</span>
                    </CardTitle>
                    <CardDescription className="text-blue-100">
                      Monthly compensation overview and payments
                    </CardDescription>
                  </div>
                  <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                    <Eye className="h-4 w-4 mr-2" />
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Doctor Salary Section */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-blue-600 rounded-lg">
                        <Stethoscope className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">Medical Doctors</h4>
                        <p className="text-sm text-gray-600">Specialist & General Practitioners</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Active Doctors</span>
                        <span className="font-bold text-2xl text-blue-600">{stats.staff.totalDoctors}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Pending Salaries</span>
                        <Badge className="bg-orange-100 text-orange-700">
                          {Math.floor(stats.staff.pendingSalaries / 2)} pending
                        </Badge>
                      </div>
                      
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                        <IndianRupee className="h-4 w-4 mr-2" />
                        Process Doctor Salaries
                      </Button>
                    </div>
                  </div>

                  {/* Staff Salary Section */}
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-green-600 rounded-lg">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">Support Staff</h4>
                        <p className="text-sm text-gray-600">Nurses, Admin & Technical</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Total Staff</span>
                        <span className="font-bold text-2xl text-green-600">{stats.staff.totalStaff}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Pending Salaries</span>
                        <Badge className="bg-orange-100 text-orange-700">
                          {Math.ceil(stats.staff.pendingSalaries / 2)} pending
                        </Badge>
                      </div>
                      
                      <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                        <IndianRupee className="h-4 w-4 mr-2" />
                        Process Staff Salaries
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">₹24.5L</p>
                      <p className="text-sm text-gray-600">Monthly Payroll</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">95%</p>
                      <p className="text-sm text-gray-600">On-time Payments</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{stats.staff.onDuty}</p>
                      <p className="text-sm text-gray-600">Currently On Duty</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Daily Operations Overview */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  <span>Today's Operations</span>
                </CardTitle>
                <CardDescription>Real-time healthcare service metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{stats.operations.appointments}</p>
                    <p className="text-sm text-gray-600">Appointments</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <HeartHandshake className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{stats.operations.consultations}</p>
                    <p className="text-sm text-gray-600">Consultations</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <Pill className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{stats.operations.prescriptions}</p>
                    <p className="text-sm text-gray-600">Prescriptions</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{stats.operations.emergencies}</p>
                    <p className="text-sm text-gray-600">Emergencies</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            
            {/* Quick Actions */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Briefcase className="h-5 w-5 text-gray-700" />
                  <span>Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white">
                  <UserPlus className="h-4 w-4 mr-3" />
                  Add New Patient
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-3" />
                  Schedule Appointment
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Package className="h-4 w-4 mr-3" />
                  Manage Inventory
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-3" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  <span>System Health</span>
                </CardTitle>
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
                    <span className="text-sm text-gray-600">Backup</span>
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

            {/* Recent Activities */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-purple-600" />
                  <span>Recent Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <UserPlus className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">New patient registered</p>
                    <p className="text-xs text-gray-500">Mrs. Sharma, 45 years • 5 min ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <IndianRupee className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Salary payment processed</p>
                    <p className="text-xs text-gray-500">Dr. Patel • 15 min ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <Package className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Low stock alert</p>
                    <p className="text-xs text-gray-500">Paracetamol 500mg • 1 hour ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Appointment scheduled</p>
                    <p className="text-xs text-gray-500">Mr. Kumar with Dr. Singh • 2 hours ago</p>
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
