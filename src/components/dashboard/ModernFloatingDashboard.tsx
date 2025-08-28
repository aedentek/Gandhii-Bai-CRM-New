import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Search,
  Filter,
  MoreHorizontal,
  Zap,
  ShoppingCart,
  DollarSign,
  Package,
  FileText,
  BarChart3,
  PieChart,
  Globe,
  Wifi,
  Database,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";

interface DashboardProps {
  user: { name: string; role: string };
}

interface DashboardStats {
  patients: {
    total: number;
    newToday: number;
    activeToday: number;
    trend: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    trend: number;
  };
  staff: {
    totalDoctors: number;
    totalStaff: number;
    pendingSalaries: number;
    paidSalaries: number;
  };
  inventory: {
    medicineProducts: number;
    lowStock: number;
    categories: number;
    recentSales: number;
  };
}

interface RecentActivity {
  id: string;
  type: 'patient' | 'salary' | 'medicine' | 'appointment';
  title: string;
  description: string;
  time: string;
  status: 'success' | 'warning' | 'info' | 'error';
  amount?: number;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  status: 'online' | 'offline' | 'busy';
  pendingSalary?: number;
  lastActive: string;
}

const ModernFloatingDashboard: React.FC<DashboardProps> = ({ user }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    patients: { total: 0, newToday: 0, activeToday: 0, trend: 0 },
    revenue: { total: 0, thisMonth: 0, lastMonth: 0, trend: 0 },
    staff: { totalDoctors: 0, totalStaff: 0, pendingSalaries: 0, paidSalaries: 0 },
    inventory: { medicineProducts: 0, lowStock: 0, categories: 0, recentSales: 0 }
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading dashboard data...');

      // Load all data in parallel
      const [patientsData, doctorsData, staffData, medicineData] = await Promise.all([
        loadPatientsData(),
        loadDoctorsData(), 
        loadStaffData(),
        loadMedicineData()
      ]);

      // Calculate stats
      const newStats: DashboardStats = {
        patients: {
          total: patientsData.total,
          newToday: patientsData.newToday,
          activeToday: patientsData.activeToday,
          trend: patientsData.trend
        },
        revenue: {
          total: patientsData.totalRevenue,
          thisMonth: patientsData.thisMonthRevenue,
          lastMonth: patientsData.lastMonthRevenue,
          trend: patientsData.revenueTrend
        },
        staff: {
          totalDoctors: doctorsData.total,
          totalStaff: staffData.total,
          pendingSalaries: doctorsData.pendingSalaries + staffData.pendingSalaries,
          paidSalaries: doctorsData.paidSalaries + staffData.paidSalaries
        },
        inventory: {
          medicineProducts: medicineData.total,
          lowStock: medicineData.lowStock,
          categories: medicineData.categories,
          recentSales: medicineData.recentSales
        }
      };

      setStats(newStats);

      // Load recent activities
      const activities = await loadRecentActivities();
      setRecentActivities(activities);

      // Load team data
      const team = await loadTeamData(doctorsData, staffData);
      setTeamMembers(team);

      console.log('✅ Dashboard data loaded successfully');
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPatientsData = async () => {
    try {
      const response = await fetch('/api/patients');
      const patients = await response.json();
      
      const today = new Date();
      const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      
      const todayPatients = patients.filter(p => 
        new Date(p.created_at).toDateString() === today.toDateString()
      );
      
      const thisMonthPatients = patients.filter(p => 
        new Date(p.created_at) >= thisMonth
      );
      
      const lastMonthPatients = patients.filter(p => 
        new Date(p.created_at) >= lastMonth && new Date(p.created_at) < thisMonth
      );

      const thisMonthRevenue = thisMonthPatients.reduce((sum, p) => 
        sum + (parseFloat(p.totalAmount) || 0), 0
      );
      
      const lastMonthRevenue = lastMonthPatients.reduce((sum, p) => 
        sum + (parseFloat(p.totalAmount) || 0), 0
      );

      const totalRevenue = patients.reduce((sum, p) => 
        sum + (parseFloat(p.totalAmount) || 0), 0
      );

      const revenueTrend = lastMonthRevenue > 0 ? 
        ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

      const trend = lastMonthPatients.length > 0 ? 
        ((thisMonthPatients.length - lastMonthPatients.length) / lastMonthPatients.length) * 100 : 0;

      return {
        total: patients.length,
        newToday: todayPatients.length,
        activeToday: patients.filter(p => p.status === 'Active').length,
        trend: Math.round(trend),
        totalRevenue,
        thisMonthRevenue,
        lastMonthRevenue,
        revenueTrend: Math.round(revenueTrend)
      };
    } catch (error) {
      console.error('Error loading patients:', error);
      return {
        total: 0, newToday: 0, activeToday: 0, trend: 0,
        totalRevenue: 0, thisMonthRevenue: 0, lastMonthRevenue: 0, revenueTrend: 0
      };
    }
  };

  const loadDoctorsData = async () => {
    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      const response = await fetch(`/api/doctor-salaries?month=${currentMonth}&year=${currentYear}`);
      const data = await response.json();
      
      if (data.success) {
        const doctors = data.data;
        const pending = doctors.filter(d => d.status === 'Pending').length;
        const paid = doctors.filter(d => d.status === 'Paid').length;
        
        return {
          total: doctors.length,
          pendingSalaries: pending,
          paidSalaries: paid,
          doctors: doctors
        };
      }
      
      return { total: 0, pendingSalaries: 0, paidSalaries: 0, doctors: [] };
    } catch (error) {
      console.error('Error loading doctors:', error);
      return { total: 0, pendingSalaries: 0, paidSalaries: 0, doctors: [] };
    }
  };

  const loadStaffData = async () => {
    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      const response = await fetch(`/api/staff-salaries?month=${currentMonth}&year=${currentYear}`);
      const data = await response.json();
      
      if (data.success) {
        const staff = data.data;
        const pending = staff.filter(s => s.status === 'Pending').length;
        const paid = staff.filter(s => s.status === 'Paid').length;
        
        return {
          total: staff.length,
          pendingSalaries: pending,
          paidSalaries: paid,
          staff: staff
        };
      }
      
      return { total: 0, pendingSalaries: 0, paidSalaries: 0, staff: [] };
    } catch (error) {
      console.error('Error loading staff:', error);
      return { total: 0, pendingSalaries: 0, paidSalaries: 0, staff: [] };
    }
  };

  const loadMedicineData = async () => {
    try {
      const [productsResponse, categoriesResponse] = await Promise.all([
        fetch('/api/medicine-products'),
        fetch('/api/medicine-categories')
      ]);
      
      const products = await productsResponse.json();
      const categories = await categoriesResponse.json();
      
      const lowStockItems = products.filter(p => 
        parseInt(p.quantity) <= (parseInt(p.minStockLevel) || 10)
      );
      
      return {
        total: products.length,
        lowStock: lowStockItems.length,
        categories: categories.length,
        recentSales: products.filter(p => 
          new Date(p.updated_at) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length
      };
    } catch (error) {
      console.error('Error loading medicine data:', error);
      return { total: 0, lowStock: 0, categories: 0, recentSales: 0 };
    }
  };

  const loadRecentActivities = async (): Promise<RecentActivity[]> => {
    // Mock recent activities - in real app, this would come from an activity log API
    return [
      {
        id: '1',
        type: 'patient',
        title: 'New Patient Registration',
        description: 'John Doe registered for consultation',
        time: '2 minutes ago',
        status: 'success'
      },
      {
        id: '2',
        type: 'salary',
        title: 'Salary Payment Processed',
        description: 'Dr. Smith salary payment completed',
        time: '15 minutes ago',
        status: 'success',
        amount: 85000
      },
      {
        id: '3',
        type: 'medicine',
        title: 'Low Stock Alert',
        description: 'Paracetamol stock is running low',
        time: '1 hour ago',
        status: 'warning'
      },
      {
        id: '4',
        type: 'appointment',
        title: 'Appointment Scheduled',
        description: 'Follow-up appointment for Patient #P0001',
        time: '2 hours ago',
        status: 'info'
      }
    ];
  };

  const loadTeamData = async (doctorsData: any, staffData: any): Promise<TeamMember[]> => {
    const team: TeamMember[] = [];
    
    // Add top doctors
    if (doctorsData.doctors) {
      doctorsData.doctors.slice(0, 3).forEach((doctor: any) => {
        team.push({
          id: doctor.id,
          name: doctor.name,
          role: 'Doctor',
          status: 'online',
          pendingSalary: doctor.status === 'Pending' ? doctor.balance : 0,
          lastActive: '2 min ago'
        });
      });
    }
    
    // Add top staff
    if (staffData.staff) {
      staffData.staff.slice(0, 2).forEach((staff: any) => {
        team.push({
          id: staff.id,
          name: staff.name,
          role: staff.role || 'Staff',
          status: 'online',
          pendingSalary: staff.status === 'Pending' ? staff.balance : 0,
          lastActive: '5 min ago'
        });
      });
    }
    
    return team;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'patient': return <UserPlus className="h-4 w-4" />;
      case 'salary': return <IndianRupee className="h-4 w-4" />;
      case 'medicine': return <Pill className="h-4 w-4" />;
      case 'appointment': return <Calendar className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-orange-600 bg-orange-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'info': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pl-1 pr-3 sm:pl-2 sm:pr-4 lg:pl-3 lg:pr-6 py-4 sm:py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gandhi Bai CRM</h1>
            <p className="text-gray-600">Let's see the current statistic performance.</p>
          </div>
          
          {/* Header Actions */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>{currentTime.toLocaleDateString()}</span>
              <span>{currentTime.toLocaleTimeString()}</span>
            </div>
            
            <Button variant="outline" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                {stats.inventory.lowStock}
              </span>
            </Button>
            
            <Button variant="outline" size="icon" onClick={loadDashboardData}>
              <RefreshCw className="h-5 w-5" />
            </Button>
            
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>

        {/* Quick Stats Tabs */}
        <div className="flex items-center gap-4 mt-6">
          <Badge className="bg-blue-100 text-blue-800 px-3 py-1">Overview</Badge>
          <Badge variant="outline" className="px-3 py-1">Performance</Badge>
          <Badge variant="outline" className="px-3 py-1">Activity</Badge>
          <Badge variant="outline" className="px-3 py-1">Product</Badge>
          <Badge variant="outline" className="px-3 py-1">Task</Badge>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Sidebar - Stats Cards */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Top Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Overall Revenue Card */}
            <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0 shadow-xl">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-lg">Overall Revenue</CardTitle>
                  <TrendingUp className="h-5 w-5 text-blue-200" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-3xl font-bold">{formatCurrency(stats.revenue.total)}</div>
                  <div className="flex items-center gap-2 text-blue-200">
                    <span className={cn(
                      "flex items-center gap-1 text-sm",
                      stats.revenue.trend >= 0 ? "text-green-300" : "text-red-300"
                    )}>
                      {stats.revenue.trend >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {Math.abs(stats.revenue.trend)}%
                    </span>
                    <span className="text-sm">Than last month</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Patients */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-gray-700">Total Patients</CardTitle>
                  <Users className="h-5 w-5 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-gray-900">{stats.patients.total.toLocaleString()}</div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "flex items-center gap-1 text-sm",
                      stats.patients.trend >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {stats.patients.trend >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {Math.abs(stats.patients.trend)}%
                    </span>
                    <span className="text-sm text-gray-500">+{stats.patients.newToday} today</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Finance Balance */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-gray-700">Finance Balance</CardTitle>
                  <MoreHorizontal className="h-5 w-5 text-gray-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-gray-900">{formatCurrency(stats.revenue.thisMonth)}</div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-xs text-gray-500">Build</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                      <span className="text-xs text-gray-500">Total Earning</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-gray-500">Total Target</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sales Summary Chart Area */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Patient Registration Summary</CardTitle>
                  <CardDescription>Monthly patient registration trends</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">This Year</Badge>
                  <Badge variant="outline">Summary</Badge>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Chart Placeholder - Replace with actual chart component */}
              <div className="h-64 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-blue-400 mx-auto mb-2" />
                  <p className="text-gray-500">Patient Registration Chart</p>
                  <p className="text-sm text-gray-400">Chart component can be integrated here</p>
                </div>
              </div>
              
              {/* Chart Legend */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                    <span className="text-sm text-gray-600">Patients</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-300 rounded-sm"></div>
                    <span className="text-sm text-gray-600">Revenue</span>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {stats.patients.newToday} new registrations today
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Medicine Stock Category */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Package className="h-5 w-5 text-purple-600" />
                    Medicine Stock Category
                  </CardTitle>
                  <CardDescription>Product sales and inventory overview</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Daily</Badge>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Product Sales Chart */}
                <div className="md:col-span-2">
                  <div className="h-48 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <PieChart className="h-12 w-12 text-purple-400 mx-auto mb-2" />
                      <p className="text-gray-500">Medicine Categories Chart</p>
                      <p className="text-sm text-gray-400">Stock distribution by category</p>
                    </div>
                  </div>
                </div>
                
                {/* Top Categories */}
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-purple-600">{stats.inventory.medicineProducts}</div>
                    <div className="text-sm text-gray-500">Product sales</div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">Ecommerce</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm">Brand Ambassador</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Direct Buy</span>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <TrendingUp className="h-4 w-4" />
                      <span>+12.2% You sold 2,921 items compared to last month</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Top 3 Staff Salary */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Staff Salary Status</CardTitle>
                <Badge className="bg-blue-100 text-blue-800">Daily</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{stats.staff.totalDoctors + stats.staff.totalStaff}</div>
                  <div className="text-xs text-gray-500">Total</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{stats.staff.paidSalaries}</div>
                  <div className="text-xs text-gray-500">Paid</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">{stats.staff.pendingSalaries}</div>
                  <div className="text-xs text-gray-500">Pending</div>
                </div>
              </div>
              
              <div className="space-y-3">
                {teamMembers.slice(0, 5).map((member) => (
                  <div key={member.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{member.name}</div>
                      <div className="text-xs text-gray-500">{member.role}</div>
                    </div>
                    <div className="text-right">
                      {member.pendingSalary ? (
                        <div className="text-xs text-orange-600 font-medium">
                          ₹{member.pendingSalary.toLocaleString()}
                        </div>
                      ) : (
                        <div className="text-xs text-green-600">Paid</div>
                      )}
                      <div className={cn(
                        "w-2 h-2 rounded-full ml-auto mt-1",
                        member.status === 'online' ? 'bg-green-500' : 'bg-gray-300'
                      )}></div>
                    </div>
                  </div>
                ))}
              </div>
              
              <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                <IndianRupee className="h-4 w-4 mr-2" />
                Manage Salaries
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Recent Activity</CardTitle>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={cn(
                    "p-2 rounded-lg flex-shrink-0",
                    getStatusColor(activity.status)
                  )}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{activity.title}</div>
                    <div className="text-xs text-gray-500 truncate">{activity.description}</div>
                    {activity.amount && (
                      <div className="text-xs font-medium text-green-600 mt-1">
                        {formatCurrency(activity.amount)}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 flex-shrink-0">
                    {activity.time}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* System Status */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-500" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Database</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-600">Online</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">API Services</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-600">Healthy</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Low Stock Alerts</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-orange-600">{stats.inventory.lowStock} Items</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Backup Status</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-blue-600">Scheduled</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ModernFloatingDashboard;
