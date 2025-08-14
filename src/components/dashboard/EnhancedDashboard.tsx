import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Plus,
  Pencil,
  Eye,
  Trash2,
  Search,
  CalendarDays,
  Package,
  Bell,
  Settings,
  IndianRupee,
  FileText,
  Building
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardProps {
  user: { name: string; role: string };
}

const EnhancedDashboard: React.FC<DashboardProps> = ({ user }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Initialize with null, will be set when user selects a date
  const [selectedFilterDate, setSelectedFilterDate] = useState<Date | null>(null);
  
  // Function to handle date selection
  const handleDateSelect = (dateString: string) => {
    if (dateString) {
      // Create date at start of selected day
      const date = new Date(dateString + 'T00:00:00');
      console.log('Setting filter date:', {
        input: dateString,
        date: date,
        formatted: date.toLocaleDateString('en-GB')
      });
      setSelectedFilterDate(date);
    } else {
      setSelectedFilterDate(null);
    }
  };

  // Function to format date consistently
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Month and year state for filtering
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [showMonthYearDialog, setShowMonthYearDialog] = useState(false);
  const [filterMonth, setFilterMonth] = useState<number | null>(new Date().getMonth());
  const [filterYear, setFilterYear] = useState<number | null>(currentYear);
  const [showMonthDateDialog, setShowMonthDateDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [stats, setStats] = useState({
    totalPatients: 0,
    activeDoctors: 0,
    totalStaff: 0,
    totalMedicines: 0,
    pendingApprovals: 0,
    totalRevenue: 0,
    inStockProducts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [currentLeadPage, setCurrentLeadPage] = useState(1);
  const leadsPerPage = 10;

  const [leads, setLeads] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Helper function to format time differences
  const formatTimeAgo = (date: string | Date) => {
    const now = new Date();
    const activityDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 120) return '1 hour ago';
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  // Fetch recent activities
  useEffect(() => {
    const fetchRecentActivities = async () => {
      try {
        const { DatabaseService } = await import('@/services/databaseService');
        
        // Get various activities
        const [patients, medicines, appointments, staff] = await Promise.all([
          DatabaseService.getAllPatients(),
          DatabaseService.getAllMedicineProducts(),
          DatabaseService.getAllPatientAttendance(),
          DatabaseService.getAllStaff()
        ]);

        // Process recent activities
        const activities = [];
        
        // Add patient activities
        patients.slice(-5).forEach(p => {
          if (p.createdAt) {
            activities.push({
              id: `patient-${p.id}`,
              text: `New patient registered: ${p.name}`,
              time: new Date(p.createdAt).getTime(),
              displayTime: formatTimeAgo(p.createdAt),
              type: 'patient',
              icon: UserPlus
            });
          }
        });

        // Add medicine activities
        medicines.slice(-5).forEach(m => {
          if (m.updatedAt) {
            activities.push({
              id: `medicine-${m.id}`,
              text: `Medicine stock updated: ${m.name}`,
              time: new Date(m.updatedAt).getTime(),
              displayTime: formatTimeAgo(m.updatedAt),
              type: 'medicine',
              icon: Pill
            });
          }
        });

        // Sort by time and take most recent 4
        const sortedActivities = activities
          .sort((a, b) => b.time - a.time)
          .slice(0, 4)
          .map(activity => ({
            ...activity,
            time: activity.displayTime
          }));

        setRecentActivities(sortedActivities);
      } catch (error) {
        console.error('Failed to fetch recent activities:', error);
        setRecentActivities([]);
      }
    };

    fetchRecentActivities();
    // Refresh activities every 5 minutes
    const interval = setInterval(fetchRecentActivities, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Fetch leads
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const { DatabaseService } = await import('@/services/databaseService');
        const allLeads = await DatabaseService.getAllLeads();
        
        // Filter leads based on search query
        const filteredLeads = allLeads.filter(lead => 
          lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lead.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lead.status.toLowerCase().includes(searchQuery.toLowerCase())
        );
        
        setLeads(filteredLeads);
      } catch (error) {
        console.error('Failed to fetch leads:', error);
        setLeads([]);
      }
    };

    fetchLeads();
  }, [searchQuery]);

  const [todaySchedule, setTodaySchedule] = useState([
    { id: 1, time: '09:00 AM', patient: 'John Doe', doctor: 'Dr. Smith', type: 'Consultation', status: 'confirmed' },
    { id: 2, time: '10:30 AM', patient: 'Jane Wilson', doctor: 'Dr. Johnson', type: 'Follow-up', status: 'pending' },
    { id: 3, time: '02:00 PM', patient: 'Mike Brown', doctor: 'Dr. Davis', type: 'Surgery', status: 'confirmed' },
    { id: 4, time: '03:30 PM', patient: 'Sarah Lee', doctor: 'Dr. Smith', type: 'Consultation', status: 'cancelled' }
  ]);

  useEffect(() => {
    // Load statistics including real patient, doctor and staff counts
    const loadStats = async () => {
      try {
        const { DatabaseService } = await import('@/services/databaseService');
        const [patients, doctors, staff, medicines] = await Promise.all([
          DatabaseService.getAllPatients(),
          DatabaseService.getAllDoctors(),
          DatabaseService.getAllStaff(),
          DatabaseService.getAllGeneralProducts()
        ]);
        
        // Filter active doctors
        const activeDoctorCount = doctors.filter(doctor => doctor.status === 'Active').length;
        
        // Filter active staff
        const activeStaffCount = staff.filter(s => s.status === 'Active').length;
        
        // Calculate medicine stock statistics
        const medicineStats = medicines.reduce((acc: any, medicine: any) => {
          const stockLevel = medicine.quantity || 0;
          const minStock = medicine.minStock || 10; // Default minimum stock level
          
          if (stockLevel <= 0) {
            acc.outOfStockProducts++;
          } else if (stockLevel <= minStock) {
            acc.lowStockProducts++;
          } else {
            acc.inStockProducts++;
          }
          return acc;
        }, { inStockProducts: 0, lowStockProducts: 0, outOfStockProducts: 0 });

        setStats({
          totalPatients: patients.length,
          activeDoctors: activeDoctorCount,
          totalStaff: activeStaffCount,
          totalMedicines: medicines.length,
          pendingApprovals: 8,
          totalRevenue: 85420,
          ...medicineStats
        });
      } catch (error) {
        console.error('Failed to load statistics:', error);
      }
    };

    loadStats();
    
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [filterMonth, filterYear]);

  // Enhanced stat cards with real data and attractive design
  const statCards = [
    {
      title: 'Total Revenue',
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      description: '+8% from last month',
      icon: IndianRupee,
      gradient: 'from-emerald-500 to-emerald-600',
      bgPattern: 'bg-emerald-500/10',
      trend: 'up'
    },
    {
      title: 'Total Patients',
      value: stats.totalPatients.toLocaleString(),
      description: '+12% from last month',
      icon: Users,
      gradient: 'from-blue-500 to-blue-600',
      bgPattern: 'bg-blue-500/10',
      trend: 'up'
    },
    {
      title: 'Active Doctors',
      value: stats.activeDoctors.toString(),
      description: '2 new this week',
      icon: Stethoscope,
      gradient: 'from-purple-500 to-purple-600',
      bgPattern: 'bg-purple-500/10',
      trend: 'up'
    },
    {
      title: 'Total Staff',
      value: stats.totalStaff.toString(),
      description: 'Active staff members',
      icon: Building,
      gradient: 'from-teal-500 to-teal-600',
      bgPattern: 'bg-teal-500/10',
      trend: 'neutral'
    },
    {
      title: 'Total Medicines',
      value: stats.totalMedicines.toString(),
      description: `${stats.lowStockProducts} low stock alerts`,
      icon: Pill,
      gradient: 'from-orange-500 to-orange-600',
      bgPattern: 'bg-orange-500/10',
      trend: stats.lowStockProducts > 0 ? 'down' : 'neutral'
    },
    {
      title: 'Pending Approvals',
      value: stats.pendingApprovals.toString(),
      description: 'Requires attention',
      icon: AlertCircle,
      gradient: 'from-red-500 to-red-600',
      bgPattern: 'bg-red-500/10',
      trend: 'neutral'
    }
  ];

  // Quick stats for inventory
  const quickStats = [
    {
      label: 'In Stock',
      value: stats.inStockProducts,
      color: 'text-green-600',
      bg: 'bg-green-100',
      icon: CheckCircle
    },
    {
      label: 'Low Stock',
      value: stats.lowStockProducts,
      color: 'text-yellow-600',
      bg: 'bg-yellow-100',
      icon: AlertCircle
    },
    {
      label: 'Out of Stock',
      value: stats.outOfStockProducts,
      color: 'text-red-600',
      bg: 'bg-red-100',
      icon: Package
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800">Confirmed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-6">
      {/* Enhanced Modern Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Live Dashboard</span>
              <Badge variant="outline" className="text-xs">
                {currentTime.toLocaleTimeString()}
              </Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
              Gandhi Bai CRM Dashboard
            </h1>
            {/* <p className="text-gray-600">Welcome back, {user.name} • {filterMonth !== null ? months[filterMonth] : 'All'} {filterYear}</p> */}
          </div>
          
          {/* Header Actions */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Input 
                placeholder="Search patients, doctors..." 
                className="pl-10 w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => setShowMonthYearDialog(true)}
            >
              <CalendarDays className="h-4 w-4" />
              Filter Period
            </Button>
            <Button variant="outline" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                {stats.pendingApprovals}
              </span>
            </Button>
            <div className="flex items-center gap-3 p-2 bg-white rounded-lg shadow-sm border">
              <Avatar className="h-10 w-10">
                <AvatarImage src="/api/placeholder/40/40" />
                <AvatarFallback className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <div className="font-semibold text-sm">{user.name}</div>
                <div className="text-xs text-gray-500">{user.role}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Month/Year Selection Dialog */}
      <Dialog open={showMonthYearDialog} onOpenChange={setShowMonthYearDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Month and Year</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Select
                value={selectedMonth.toString()}
                onValueChange={(value) => setSelectedMonth(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setFilterMonth(selectedMonth);
                setFilterYear(selectedYear);
                setShowMonthYearDialog(false);
              }}
            >
              Apply Filter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Statistics Cards with Modern Design */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} className="relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 group">
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-95`}></div>
              <div className="absolute inset-0 bg-black/10"></div>
              <div className={`absolute top-0 right-0 w-32 h-32 ${card.bgPattern} rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-500`}></div>
              
              <CardContent className="relative p-6 text-white">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-white/80 text-sm font-medium">{card.title}</p>
                    <p className="text-3xl font-bold">{card.value}</p>
                    <p className="text-white/70 text-xs">{card.description}</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm group-hover:bg-white/30 transition-colors duration-300">
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  {card.trend === 'up' && <TrendingUp className="h-4 w-4 text-white/80" />}
                  {card.trend === 'down' && <TrendingDown className="h-4 w-4 text-white/80" />}
                  {card.trend === 'neutral' && <Activity className="h-4 w-4 text-white/80" />}
                  <span className="text-xs text-white/70">vs last period</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Inventory Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                  <div className={`p-3 ${stat.bg} rounded-lg`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart and Activities Section */}
        <div className="lg:col-span-2 space-y-8">
          {/* Recent Activities */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="border-b bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="text-xl flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-600" />
                Recent Activities
              </CardTitle>
              <CardDescription>Latest updates across your healthcare system</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {recentActivities.length > 0 ? recentActivities.map((activity: any) => {
                  const Icon = activity.icon || FileText;
                  return (
                    <div key={activity.id} className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Icon className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.text}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-center text-gray-500 py-12">
                    <Activity className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-lg font-medium">No recent activities</p>
                    <p className="text-sm">Activities will appear here as they happen</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Today's Schedule */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-pink-50">
              <CardTitle className="text-xl flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                Today's Schedule
              </CardTitle>
              <CardDescription>Appointments and events for today</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {todaySchedule.map((appointment) => (
                  <div key={appointment.id} className="flex items-center gap-4 p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                    <div className="text-center min-w-[80px]">
                      <div className="text-sm font-bold text-gray-900">{appointment.time}</div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{appointment.patient}</p>
                      <p className="text-xs text-gray-500">{appointment.doctor} • {appointment.type}</p>
                    </div>
                    {getStatusBadge(appointment.status)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="shadow-xl border-0 bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
            <CardHeader className="border-b border-white/20">
              <CardTitle className="text-white">Quick Actions</CardTitle>
              <CardDescription className="text-white/80">Frequently used features</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              <Button className="w-full justify-start bg-white/20 hover:bg-white/30 text-white border-white/30">
                <UserPlus className="h-4 w-4 mr-3" />
                Add New Patient
              </Button>
              <Button className="w-full justify-start bg-white/20 hover:bg-white/30 text-white border-white/30">
                <Calendar className="h-4 w-4 mr-3" />
                Schedule Appointment
              </Button>
              <Button className="w-full justify-start bg-white/20 hover:bg-white/30 text-white border-white/30">
                <Package className="h-4 w-4 mr-3" />
                Manage Inventory
              </Button>
              <Button className="w-full justify-start bg-white/20 hover:bg-white/30 text-white border-white/30">
                <ClipboardCheck className="h-4 w-4 mr-3" />
                View Reports
              </Button>
            </CardContent>
          </Card>

          {/* Recent Leads */}
          {leads.length > 0 && (
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="border-b bg-gradient-to-r from-yellow-50 to-orange-50">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-orange-600" />
                  Recent Leads
                </CardTitle>
                <CardDescription>Latest lead submissions</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {leads.slice(0, 5).map((lead: any) => (
                    <div key={lead.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{lead.name}</p>
                        <p className="text-xs text-gray-500">{lead.category}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {lead.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* System Status */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-600" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
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
                  <span className="text-sm text-gray-600">Backup Status</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-yellow-600">Pending</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDashboard;
