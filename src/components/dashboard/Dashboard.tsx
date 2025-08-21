import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  Package
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardProps {
  user: { name: string; role: string };
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
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

  const [leads, setLeads] = useState([
    {
      id: 1,
      date: '2025-08-01',
      name: 'SABARISH T',
      phone: '9876543211',
      reminderDate: '2025-08-05',
      category: 'Technology',
      description: 'Fresh red tomatoes',
      status: 'Reminder'
    },
    {
      id: 2,
      date: '2025-07-29',
      name: 'Test1111',
      phone: '9999999999',
      reminderDate: '2025-08-21',
      category: 'Test1111',
      description: '',
      status: 'Reminder'
    },
    {
      id: 3,
      date: '2025-08-01',
      name: 'SABARISH T',
      phone: '9999999999',
      reminderDate: '2025-08-01',
      category: 'Testing',
      description: '',
      status: 'Reminder'
    },
    {
      id: 4,
      date: '2025-09-30',
      name: 'Shweta Agarwal',
      phone: '6987654322',
      reminderDate: '2025-10-04',
      category: 'Technology',
      description: 'Budget constraints for IT upgrade',
      status: 'Not Interested'
    },
    {
      id: 5,
      date: '2025-09-28',
      name: 'Prakash Reddy',
      phone: '',
      reminderDate: '2025-10-08',
      category: 'Finance',
      description: 'Needs education loan for daughter',
      status: 'Reminder'
    },
    {
      id: 6,
      date: '2025-09-26',
      name: 'Lalita Nair',
      phone: '',
      reminderDate: '2025-09-27',
      category: 'Healthcare',
      description: 'Completed health checkup package',
      status: 'Closed'
    }
  ]);
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
              type: 'patient'
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
              type: 'medicine'
            });
          }
        });

        // Add appointment activities
        appointments.slice(-5).forEach(a => {
          if (a.createdAt) {
            activities.push({
              id: `appointment-${a.id}`,
              text: `Appointment scheduled: ${a.doctorName || 'Doctor'}`,
              time: new Date(a.createdAt).getTime(),
              displayTime: formatTimeAgo(a.createdAt),
              type: 'appointment'
            });
          }
        });

        // Add staff activities
        staff.slice(-5).forEach(s => {
          if (s.updatedAt) {
            activities.push({
              id: `staff-${s.id}`,
              text: `Staff member updated: ${s.name}`,
              time: new Date(s.updatedAt).getTime(),
              displayTime: formatTimeAgo(s.updatedAt),
              type: 'staff'
            });
          }
        });

        // Sort by time and take most recent 4
        const sortedActivities = activities
          .sort((a, b) => b.time - a.time)
          .slice(0, 4)
          .map(activity => ({
            ...activity,
            time: activity.displayTime // Replace timestamp with formatted time for display
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

  // Fetch leads with month/year filtering
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const { DatabaseService } = await import('@/services/databaseService');
        const allLeads = await DatabaseService.getAllLeads();
        
        // Apply month/year filtering if active
        let filteredLeads = allLeads;
        if (filterMonth !== null && filterYear !== null) {
          filteredLeads = allLeads.filter(lead => {
            // Filter by reminder date within the selected month/year
            if (lead.reminderDate) {
              const reminderDate = new Date(lead.reminderDate);
              return reminderDate.getMonth() === filterMonth && reminderDate.getFullYear() === filterYear;
            }
            // Also include leads created in the selected month/year
            if (lead.created_at || lead.date) {
              const createdDate = new Date(lead.created_at || lead.date);
              return createdDate.getMonth() === filterMonth && createdDate.getFullYear() === filterYear;
            }
            return false;
          });
        }
        
        // Apply search filter
        filteredLeads = filteredLeads.filter(lead => 
          lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (lead.email && lead.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (lead.phone && lead.phone.toLowerCase().includes(searchQuery.toLowerCase())) ||
          lead.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (lead.category && lead.category.toLowerCase().includes(searchQuery.toLowerCase()))
        );
        
        setLeads(filteredLeads);
      } catch (error) {
        console.error('Failed to fetch leads:', error);
        setLeads([]);
      }
    };

    fetchLeads();
  }, [searchQuery, filterMonth, filterYear]);

  // Reminders state for Leads List
  const [reminders, setReminders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const remindersPerPage = 5;

  // Fetch reminders from database
  useEffect(() => {
    const fetchReminders = async () => {
      try {
        const { DatabaseService } = await import('@/services/databaseService');
        const startIndex = (currentPage - 1) * remindersPerPage;
        
        // Fetch leads with reminders
        const leads = await DatabaseService.getAllLeads();
        
        // Filter leads with reminders and paginate
        const leadsWithReminders = leads
          .filter(lead => lead.reminderDate) // Only get leads that have reminder dates
          .sort((a, b) => new Date(a.reminderDate).getTime() - new Date(b.reminderDate).getTime())
          .slice(startIndex, startIndex + remindersPerPage);
        
        // Transform leads data into reminder format
        const formattedReminders = leadsWithReminders.map(lead => ({
          id: lead.id,
          leadName: lead.name,
          reminderDate: lead.reminderDate,
          status: lead.reminderStatus || 'Pending',
          type: lead.reminderType || 'Follow-up'
        }));

        setReminders(formattedReminders);
      } catch (error) {
        console.error('Failed to fetch reminders:', error);
        setReminders([]);
      }
    };

    fetchReminders();
  }, [currentPage]);

  const [todaySchedule, setTodaySchedule] = useState([
    { id: 1, time: '09:00 AM', patient: 'John Doe', doctor: 'Dr. Smith', type: 'Consultation', status: 'confirmed' },
    { id: 2, time: '10:30 AM', patient: 'Jane Wilson', doctor: 'Dr. Johnson', type: 'Follow-up', status: 'pending' },
    { id: 3, time: '02:00 PM', patient: 'Mike Brown', doctor: 'Dr. Davis', type: 'Surgery', status: 'confirmed' },
    { id: 4, time: '03:30 PM', patient: 'Sarah Lee', doctor: 'Dr. Smith', type: 'Consultation', status: 'cancelled' }
  ]);

  useEffect(() => {
    // Load statistics including real patient, doctor and staff counts based on month/year filter
    const loadStats = async () => {
      try {
        const { DatabaseService } = await import('@/services/databaseService');
        const [patients, doctors, staff, medicines, leads, salaryPayments, doctorAdvances] = await Promise.all([
          DatabaseService.getAllPatients(),
          DatabaseService.getAllDoctors(),
          DatabaseService.getAllStaff(),
          DatabaseService.getAllGeneralProducts(),
          DatabaseService.getAllLeads(),
          DatabaseService.getAllDoctorSalaryPayments(),
          DatabaseService.getAllDoctorAdvances()
        ]);
        
        // Apply month/year filtering based on filterMonth and filterYear
        const filterByMonthYear = (items: any[], dateField: string) => {
          if (filterMonth === null || filterYear === null) return items;
          
          return items.filter(item => {
            const itemDate = new Date(item[dateField]);
            if (isNaN(itemDate.getTime())) return true; // Include items with invalid dates
            return itemDate.getMonth() === filterMonth && itemDate.getFullYear() === filterYear;
          });
        };

        // Filter data based on selected month/year
        const filteredPatients = filterByMonthYear(patients, 'createdAt');
        const filteredStaff = filterByMonthYear(staff, 'createdAt');
        const filteredLeads = filterByMonthYear(leads, 'created_at');
        
        // For cumulative data (total counts), show all records up to the selected month/year
        const getCumulativeCount = (items: any[], dateField: string) => {
          if (filterMonth === null || filterYear === null) return items.length;
          
          const endDate = new Date(filterYear, filterMonth + 1, 0); // Last day of selected month
          return items.filter(item => {
            const itemDate = new Date(item[dateField]);
            if (isNaN(itemDate.getTime())) return true;
            return itemDate <= endDate;
          }).length;
        };

        // Calculate monthly revenue from salary payments and doctor advances
        let monthlyRevenue = 0;
        if (filterMonth !== null && filterYear !== null) {
          const filteredPayments = filterByMonthYear(salaryPayments, 'payment_date');
          const filteredAdvances = filterByMonthYear(doctorAdvances, 'date');
          
          monthlyRevenue = filteredPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0) +
                          filteredAdvances.reduce((sum, advance) => sum + (advance.amount || 0), 0);
        }
        
        // Filter active doctors (cumulative up to selected month)
        const activeDoctorCount = doctors.filter(doctor => {
          if (doctor.status !== 'Active') return false;
          if (filterMonth === null || filterYear === null) return true;
          
          const joinDate = new Date(doctor.join_date || doctor.createdAt);
          if (isNaN(joinDate.getTime())) return true;
          
          const endDate = new Date(filterYear, filterMonth + 1, 0);
          return joinDate <= endDate;
        }).length;
        
        // Filter active staff (cumulative up to selected month)
        const activeStaffCount = staff.filter(s => {
          if (s.status !== 'Active') return false;
          if (filterMonth === null || filterYear === null) return true;
          
          const joinDate = new Date(s.join_date || s.createdAt);
          if (isNaN(joinDate.getTime())) return true;
          
          const endDate = new Date(filterYear, filterMonth + 1, 0);
          return joinDate <= endDate;
        }).length;
        
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
          totalPatients: getCumulativeCount(patients, 'createdAt'),
          activeDoctors: activeDoctorCount,
          totalStaff: activeStaffCount,
          totalMedicines: medicines.length,
          pendingApprovals: filteredLeads.filter(lead => lead.status === 'Pending' || lead.status === 'Reminder').length,
          totalRevenue: Math.round(monthlyRevenue),
          ...medicineStats
        });
      } catch (error) {
        console.error('Failed to load statistics:', error);
        // Keep previous values or set to 0 in case of error
        setStats(prev => ({
          ...prev,
          totalPatients: prev.totalPatients || 0,
          activeDoctors: prev.activeDoctors || 0
        }));
      }
    };

    loadStats();
  }, [filterMonth, filterYear]);

  const getMonthYearText = () => {
    if (filterMonth === null || filterYear === null) return 'All Time';
    return `${months[filterMonth]} ${filterYear}`;
  };

  const statCards = [
    {
      title: 'Total Patients',
      value: stats.totalPatients.toLocaleString(),
      description: `As of ${getMonthYearText()}`,
      icon: Users,
      trend: 'up',
      color: 'text-blue-600',
      bgGradient: 'from-blue-50 to-blue-100/50 dark:from-blue-900/50 dark:to-blue-800/30',
      borderColor: 'border-blue-200 hover:border-blue-300 dark:border-blue-700 dark:hover:border-blue-600'
    },
    {
      title: 'Active Doctors',
      value: stats.activeDoctors.toString(),
      description: `Active in ${getMonthYearText()}`,
      icon: Stethoscope,
      trend: 'up',
      color: 'text-green-600',
      bgGradient: 'from-green-50 to-green-100/50 dark:from-green-900/50 dark:to-green-800/30',
      borderColor: 'border-green-200 hover:border-green-300 dark:border-green-700 dark:hover:border-green-600'
    },
    {
      title: 'Total Staff',
      value: stats.totalStaff.toString(),
      description: `Active staff members`,
      icon: Users,
      trend: 'neutral',
      color: 'text-orange-600',
      bgGradient: 'from-orange-50 to-orange-100/50 dark:from-orange-900/50 dark:to-orange-800/30',
      borderColor: 'border-orange-200 hover:border-orange-300 dark:border-orange-700 dark:hover:border-orange-600'
    },
    {
      title: 'Total Medicines',
      value: stats.totalMedicines.toString(),
      description: `${stats.lowStockProducts} low stock alerts`,
      icon: Pill,
      trend: stats.lowStockProducts > 0 ? 'down' : 'neutral',
      color: 'text-purple-600',
      bgGradient: 'from-purple-50 to-purple-100/50 dark:from-purple-900/50 dark:to-purple-800/30',
      borderColor: 'border-purple-200 hover:border-purple-300 dark:border-purple-700 dark:hover:border-purple-600'
    },
    {
      title: 'Pending Leads',
      value: stats.pendingApprovals.toString(),
      description: `Requires attention in ${getMonthYearText()}`,
      icon: AlertCircle,
      trend: 'neutral',
      color: 'text-red-600',
      bgGradient: 'from-red-50 to-red-100/50 dark:from-red-900/50 dark:to-red-800/30',
      borderColor: 'border-red-200 hover:border-red-300 dark:border-red-700 dark:hover:border-red-600'
    },
    {
      title: `Revenue (${getMonthYearText()})`,
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      description: filterMonth !== null && filterYear !== null ? 'Monthly revenue' : 'Total revenue',
      icon: TrendingUp,
      trend: 'up',
      color: 'text-emerald-600',
      bgGradient: 'from-emerald-50 to-emerald-100/50 dark:from-emerald-900/50 dark:to-emerald-800/30',
      borderColor: 'border-emerald-200 hover:border-emerald-300 dark:border-emerald-700 dark:hover:border-emerald-600'
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
    <div className="min-h-screen space-y-6 bg-gradient-to-b from-gray-50 via-gray-50 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-6 rounded-lg">
      {/* Welcome Header with Enhanced Month/Year Filter */}
      <div className="flex justify-between items-start backdrop-blur-sm bg-gradient-to-r from-white/40 via-blue-50/30 to-purple-50/30 dark:from-gray-800/40 dark:via-blue-900/20 dark:to-purple-900/20 p-6 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 shadow-xl hover:shadow-2xl transition-all duration-300">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300">
            Welcome back, {user.name}!
          </h1>
          <p className="text-muted-foreground font-medium">
            {getMonthYearText() !== 'All Time' 
              ? `Viewing data for ${getMonthYearText()}` 
              : "Here's your complete healthcare facility overview"
            }
          </p>
        </div>
        <div className="flex items-center gap-3">
          {(filterMonth !== null || filterYear !== null) && (
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 bg-red-50/70 hover:bg-red-100 border-red-200 hover:border-red-400 text-red-700 hover:text-red-800 transition-all duration-300"
              onClick={() => {
                setFilterMonth(null);
                setFilterYear(null);
                setSelectedMonth(new Date().getMonth());
                setSelectedYear(new Date().getFullYear());
              }}
            >
              <Clock className="h-4 w-4" />
              Show All Data
            </Button>
          )}
          <Button
            variant="outline"
            className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 border-blue-200 hover:border-blue-400 text-blue-700 hover:text-blue-800 shadow-md hover:shadow-lg transition-all duration-300"
            onClick={() => setShowMonthYearDialog(true)}
          >
            <CalendarDays className="h-4 w-4" />
            <span className="font-medium">
              {getMonthYearText()}
            </span>
          </Button>
        </div>
      </div>

      {/* Enhanced Month/Year Selection Dialog */}
      <Dialog open={showMonthYearDialog} onOpenChange={setShowMonthYearDialog}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 border border-gray-200/60 dark:border-gray-700/60 shadow-2xl">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
              Select Time Period
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Filter dashboard data by specific month and year
            </p>
          </DialogHeader>
          <div className="grid gap-6 py-6">
            <div className="grid gap-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Month</label>
              <Select
                value={selectedMonth.toString()}
                onValueChange={(value) => setSelectedMonth(parseInt(value))}
              >
                <SelectTrigger className="bg-white/70 backdrop-blur-sm border-gray-200 hover:border-blue-400 transition-all duration-300">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-md border-gray-200">
                  {months.map((month, index) => (
                    <SelectItem key={index} value={index.toString()} className="hover:bg-blue-50">
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Year</label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger className="bg-white/70 backdrop-blur-sm border-gray-200 hover:border-blue-400 transition-all duration-300">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-md border-gray-200">
                  {Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map((year) => (
                    <SelectItem key={year} value={year.toString()} className="hover:bg-blue-50">
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedMonth !== null && selectedYear !== null && (
              <div className="bg-blue-50/70 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-800/50 rounded-lg p-3">
                <p className="text-sm text-blue-700 dark:text-blue-300 font-medium text-center">
                  Preview: {months[selectedMonth]} {selectedYear}
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="flex gap-3 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
            <Button
              variant="outline"
              onClick={() => setShowMonthYearDialog(false)}
              className="flex-1 border-gray-300 hover:border-gray-400 transition-all duration-300"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setFilterMonth(selectedMonth);
                setFilterYear(selectedYear);
                setShowMonthYearDialog(false);
              }}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
            >
              Apply Filter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Date Selection Dialog for Daily Leads */}
      <Dialog open={showMonthDateDialog} onOpenChange={setShowMonthDateDialog}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 border border-gray-200/60 dark:border-gray-700/60 shadow-2xl">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400">
              Select Reminder Date
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Filter lead reminders by specific date
            </p>
          </DialogHeader>
          <div className="grid gap-6 py-6">
            <div className="grid gap-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  handleDateSelect(e.target.value);
                }}
                className="bg-white/70 backdrop-blur-sm border-gray-200 hover:border-green-400 focus:border-green-500 transition-all duration-300"
              />
            </div>
            {selectedDate && (
              <div className="bg-green-50/70 dark:bg-green-900/20 border border-green-200/50 dark:border-green-800/50 rounded-lg p-3">
                <p className="text-sm text-green-700 dark:text-green-300 font-medium text-center">
                  Showing reminders for: {new Date(selectedDate).toLocaleDateString('en-GB', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="flex gap-3 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
            <Button 
              variant="outline" 
              onClick={() => setShowMonthDateDialog(false)}
              className="flex-1 border-gray-300 hover:border-gray-400 transition-all duration-300"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                handleDateSelect(selectedDate);
                setShowMonthDateDialog(false);
              }}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
            >
              Apply Filter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card, index) => (
          <Card key={index} className={cn(
            "group transition-all hover:shadow-2xl transform hover:-translate-y-2 duration-300 overflow-hidden backdrop-blur-sm bg-gradient-to-br",
            card.bgGradient,
            card.borderColor,
            "border hover:shadow-lg"
          )}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="space-y-2 flex-1">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <card.icon className={cn("h-5 w-5 transform group-hover:scale-110 transition-transform duration-300", card.color)} />
                  {card.title}
                </CardTitle>
                <div className={cn(
                  "text-3xl font-bold tracking-tight group-hover:scale-105 transition-all duration-300",
                  card.color
                )}>{card.value}</div>
              </div>
              <div className={cn(
                "p-3 rounded-full transform group-hover:scale-110 transition-all duration-300 shadow-lg",
                card.trend === 'up' && "bg-green-100/80 dark:bg-green-900/50 group-hover:bg-green-200/90 dark:group-hover:bg-green-800/60",
                card.trend === 'down' && "bg-red-100/80 dark:bg-red-900/50 group-hover:bg-red-200/90 dark:group-hover:bg-red-800/60",
                card.trend === 'neutral' && "bg-gray-100/80 dark:bg-gray-700/50 group-hover:bg-gray-200/90 dark:group-hover:bg-gray-600/60"
              )}>
                {card.trend === 'up' && <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />}
                {card.trend === 'down' && <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />}
                {card.trend === 'neutral' && <Activity className="h-5 w-5 text-gray-600 dark:text-gray-400" />}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center text-sm font-medium">
                <div className={cn(
                  "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm",
                  card.trend === 'up' && "bg-green-100/70 text-green-800 dark:bg-green-900/70 dark:text-green-200",
                  card.trend === 'down' && "bg-red-100/70 text-red-800 dark:bg-red-900/70 dark:text-red-200",
                  card.trend === 'neutral' && "bg-gray-100/70 text-gray-800 dark:bg-gray-700/70 dark:text-gray-200"
                )}>
                  {card.description}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Medicine Stock Management */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-left bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">Medicine Stock Management</h2>
        <div className="grid gap-4 grid-cols-4">
          <Card className="group transition-all hover:shadow-2xl transform hover:-translate-y-2 duration-300 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/50 dark:to-green-800/30 border border-green-200 hover:border-green-300 dark:border-green-700 dark:hover:border-green-600">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-green-800 dark:text-green-300 group-hover:text-green-700 dark:group-hover:text-green-200 transition-colors duration-300">In Stock Products</CardTitle>
              <div className="h-8 w-8 rounded-full bg-green-100/80 dark:bg-green-800/80 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                <Package className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-800 dark:text-green-300 group-hover:text-green-700 dark:group-hover:text-green-200 transition-colors duration-300">{stats.inStockProducts}</div>
            </CardContent>
          </Card>

          <Card className="group transition-all hover:shadow-2xl transform hover:-translate-y-2 duration-300 bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-900/50 dark:to-yellow-800/30 border border-yellow-200 hover:border-yellow-300 dark:border-yellow-700 dark:hover:border-yellow-600">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-yellow-800 dark:text-yellow-300 group-hover:text-yellow-700 dark:group-hover:text-yellow-200 transition-colors duration-300">Low Stock Products</CardTitle>
              <div className="h-8 w-8 rounded-full bg-yellow-100/80 dark:bg-yellow-800/80 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-800 dark:text-yellow-300 group-hover:text-yellow-700 dark:group-hover:text-yellow-200 transition-colors duration-300">{stats.lowStockProducts}</div>
            </CardContent>
          </Card>

          <Card className="group transition-all hover:shadow-2xl transform hover:-translate-y-2 duration-300 bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-900/50 dark:to-red-800/30 border border-red-200 hover:border-red-300 dark:border-red-700 dark:hover:border-red-600">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-red-800 dark:text-red-300 group-hover:text-red-700 dark:group-hover:text-red-200 transition-colors duration-300">Out of Stock</CardTitle>
              <div className="h-8 w-8 rounded-full bg-red-100/80 dark:bg-red-800/80 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-800 dark:text-red-300 group-hover:text-red-700 dark:group-hover:text-red-200 transition-colors duration-300">{stats.outOfStockProducts}</div>
            </CardContent>
          </Card>

          <Card className="group transition-all hover:shadow-2xl transform hover:-translate-y-2 duration-300 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/50 dark:to-blue-800/30 border border-blue-200 hover:border-blue-300 dark:border-blue-700 dark:hover:border-blue-600">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-300 group-hover:text-blue-700 dark:group-hover:text-blue-200 transition-colors duration-300">Total Products</CardTitle>
              <div className="h-8 w-8 rounded-full bg-blue-100/80 dark:bg-blue-800/80 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-800 dark:text-blue-300 group-hover:text-blue-700 dark:group-hover:text-blue-200 transition-colors duration-300">{stats.totalMedicines}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Medicine Accounts */}
      <div className="mt-6">
        <div className="grid gap-4 grid-cols-3">
          <Card className="group transition-all hover:shadow-2xl transform hover:-translate-y-2 duration-300 backdrop-blur-sm bg-gradient-to-br from-white/50 via-white/40 to-white/30 dark:from-gray-800/50 dark:via-gray-800/40 dark:to-gray-800/30 border border-gray-200/50 dark:border-gray-700/50 hover:border-blue-200/50 dark:hover:border-blue-700/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">Purchase Amount</CardTitle>
              <div className="h-8 w-8 rounded-full bg-blue-100/80 dark:bg-blue-800/80 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">₹1,91,863.25</div>
              <p className="text-xs text-muted-foreground mt-1 group-hover:text-blue-500/70 dark:group-hover:text-blue-300/70 transition-colors duration-300">Purchase Amount</p>
            </CardContent>
          </Card>

          <Card className="group transition-all hover:shadow-2xl transform hover:-translate-y-2 duration-300 backdrop-blur-sm bg-gradient-to-br from-white/50 via-white/40 to-white/30 dark:from-gray-800/50 dark:via-gray-800/40 dark:to-gray-800/30 border border-gray-200/50 dark:border-gray-700/50 hover:border-red-200/50 dark:hover:border-red-700/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-300">Settlement Amount</CardTitle>
              <div className="h-8 w-8 rounded-full bg-red-100/80 dark:bg-red-800/80 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-300">₹694.75</div>
              <p className="text-xs text-muted-foreground mt-1 group-hover:text-red-500/70 dark:group-hover:text-red-300/70 transition-colors duration-300">Settlement Amount</p>
            </CardContent>
          </Card>

          <Card className="group transition-all hover:shadow-2xl transform hover:-translate-y-2 duration-300 backdrop-blur-sm bg-gradient-to-br from-white/50 via-white/40 to-white/30 dark:from-gray-800/50 dark:via-gray-800/40 dark:to-gray-800/30 border border-gray-200/50 dark:border-gray-700/50 hover:border-orange-200/50 dark:hover:border-orange-700/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-300">Balance Amount</CardTitle>
              <div className="h-8 w-8 rounded-full bg-orange-100/80 dark:bg-orange-800/80 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                <Package className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-300">₹1,91,168.50</div>
              <p className="text-xs text-muted-foreground mt-1 group-hover:text-orange-500/70 dark:group-hover:text-orange-300/70 transition-colors duration-300">Balance Amount</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Grocery Stock Management */}

      {/* Grocery Stock Management */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-left bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400">Grocery Stock Management</h2>
        <div className="grid gap-4 grid-cols-4">
          <Card className="group transition-all hover:shadow-2xl transform hover:-translate-y-2 duration-300 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/50 dark:to-green-800/30 border border-green-200 hover:border-green-300 dark:border-green-700 dark:hover:border-green-600">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-green-800 dark:text-green-300 group-hover:text-green-700 dark:group-hover:text-green-200 transition-colors duration-300">In Stock Products</CardTitle>
              <div className="h-8 w-8 rounded-full bg-green-100/80 dark:bg-green-800/80 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                <Package className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-800 dark:text-green-300 group-hover:text-green-700 dark:group-hover:text-green-200 transition-colors duration-300">5</div>
            </CardContent>
          </Card>

          <Card className="group transition-all hover:shadow-2xl transform hover:-translate-y-2 duration-300 bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-900/50 dark:to-yellow-800/30 border border-yellow-200 hover:border-yellow-300 dark:border-yellow-700 dark:hover:border-yellow-600">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-yellow-800 dark:text-yellow-300 group-hover:text-yellow-700 dark:group-hover:text-yellow-200 transition-colors duration-300">Low Stock Products</CardTitle>
              <div className="h-8 w-8 rounded-full bg-yellow-100/80 dark:bg-yellow-800/80 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                <Package className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-800 dark:text-yellow-300 group-hover:text-yellow-700 dark:group-hover:text-yellow-200 transition-colors duration-300">0</div>
            </CardContent>
          </Card>

          <Card className="group transition-all hover:shadow-2xl transform hover:-translate-y-2 duration-300 bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-900/50 dark:to-red-800/30 border border-red-200 hover:border-red-300 dark:border-red-700 dark:hover:border-red-600">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-red-800 dark:text-red-300 group-hover:text-red-700 dark:group-hover:text-red-200 transition-colors duration-300">Out of Stock</CardTitle>
              <div className="h-8 w-8 rounded-full bg-red-100/80 dark:bg-red-800/80 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                <Package className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-800 dark:text-red-300 group-hover:text-red-700 dark:group-hover:text-red-200 transition-colors duration-300">0</div>
            </CardContent>
          </Card>

          <Card className="group transition-all hover:shadow-2xl transform hover:-translate-y-2 duration-300 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/50 dark:to-blue-800/30 border border-blue-200 hover:border-blue-300 dark:border-blue-700 dark:hover:border-blue-600">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-300 group-hover:text-blue-700 dark:group-hover:text-blue-200 transition-colors duration-300">Total Products</CardTitle>
              <div className="h-8 w-8 rounded-full bg-blue-100/80 dark:bg-blue-800/80 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-800 dark:text-blue-300 group-hover:text-blue-700 dark:group-hover:text-blue-200 transition-colors duration-300">5</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Grocery Stock Accounts */}
      <div className="mt-6">
        <div className="grid gap-4 grid-cols-3">
          <Card className="group transition-all hover:shadow-2xl transform hover:-translate-y-2 duration-300 backdrop-blur-sm bg-gradient-to-br from-white/50 via-white/40 to-white/30 dark:from-gray-800/50 dark:via-gray-800/40 dark:to-gray-800/30 border border-gray-200/50 dark:border-gray-700/50 hover:border-blue-200/50 dark:hover:border-blue-700/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">Purchase Amount</CardTitle>
              <div className="h-8 w-8 rounded-full bg-blue-100/80 dark:bg-blue-800/80 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">₹1,91,863.25</div>
              <p className="text-xs text-muted-foreground mt-1 group-hover:text-blue-500/70 dark:group-hover:text-blue-300/70 transition-colors duration-300">Purchase Amount</p>
            </CardContent>
          </Card>

          <Card className="group transition-all hover:shadow-2xl transform hover:-translate-y-2 duration-300 backdrop-blur-sm bg-gradient-to-br from-white/50 via-white/40 to-white/30 dark:from-gray-800/50 dark:via-gray-800/40 dark:to-gray-800/30 border border-gray-200/50 dark:border-gray-700/50 hover:border-red-200/50 dark:hover:border-red-700/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-300">Settlement Amount</CardTitle>
              <div className="h-8 w-8 rounded-full bg-red-100/80 dark:bg-red-800/80 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-300">₹694.75</div>
              <p className="text-xs text-muted-foreground mt-1 group-hover:text-red-500/70 dark:group-hover:text-red-300/70 transition-colors duration-300">Settlement Amount</p>
            </CardContent>
          </Card>

          <Card className="group transition-all hover:shadow-2xl transform hover:-translate-y-2 duration-300 backdrop-blur-sm bg-gradient-to-br from-white/50 via-white/40 to-white/30 dark:from-gray-800/50 dark:via-gray-800/40 dark:to-gray-800/30 border border-gray-200/50 dark:border-gray-700/50 hover:border-orange-200/50 dark:hover:border-orange-700/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-300">Balance Amount</CardTitle>
              <div className="h-8 w-8 rounded-full bg-orange-100/80 dark:bg-orange-800/80 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                <Package className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-300">₹1,91,168.50</div>
              <p className="text-xs text-muted-foreground mt-1 group-hover:text-orange-500/70 dark:group-hover:text-orange-300/70 transition-colors duration-300">Balance Amount</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* General Stock Management */}
      <div className="mt-6">
        <h2 className="text-2xl font-bold mb-4 text-left bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">General Stock Management</h2>

        <div className="grid gap-4 grid-cols-4">
          <Card className="group transition-all hover:shadow-2xl transform hover:-translate-y-2 duration-300 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/50 dark:to-green-800/30 border border-green-200 hover:border-green-300 dark:border-green-700 dark:hover:border-green-600">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-green-800 dark:text-green-300 group-hover:text-green-700 dark:group-hover:text-green-200 transition-colors duration-300">In Stock Products</CardTitle>
              <div className="h-8 w-8 rounded-full bg-green-100/80 dark:bg-green-800/80 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                <Package className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-800 dark:text-green-300 group-hover:text-green-700 dark:group-hover:text-green-200 transition-colors duration-300">18</div>
            </CardContent>
          </Card>

          <Card className="group transition-all hover:shadow-2xl transform hover:-translate-y-2 duration-300 bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-900/50 dark:to-yellow-800/30 border border-yellow-200 hover:border-yellow-300 dark:border-yellow-700 dark:hover:border-yellow-600">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-yellow-800 dark:text-yellow-300 group-hover:text-yellow-700 dark:group-hover:text-yellow-200 transition-colors duration-300">Low Stock Products</CardTitle>
              <div className="h-8 w-8 rounded-full bg-yellow-100/80 dark:bg-yellow-800/80 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                <Package className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-800 dark:text-yellow-300 group-hover:text-yellow-700 dark:group-hover:text-yellow-200 transition-colors duration-300">5</div>
            </CardContent>
          </Card>

          <Card className="group transition-all hover:shadow-2xl transform hover:-translate-y-2 duration-300 bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-900/50 dark:to-red-800/30 border border-red-200 hover:border-red-300 dark:border-red-700 dark:hover:border-red-600">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-red-800 dark:text-red-300 group-hover:text-red-700 dark:group-hover:text-red-200 transition-colors duration-300">Out of Stock</CardTitle>
              <div className="h-8 w-8 rounded-full bg-red-100/80 dark:bg-red-800/80 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                <Package className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-800 dark:text-red-300 group-hover:text-red-700 dark:group-hover:text-red-200 transition-colors duration-300">0</div>
            </CardContent>
          </Card>

          <Card className="group transition-all hover:shadow-2xl transform hover:-translate-y-2 duration-300 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/50 dark:to-blue-800/30 border border-blue-200 hover:border-blue-300 dark:border-blue-700 dark:hover:border-blue-600">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-300 group-hover:text-blue-700 dark:group-hover:text-blue-200 transition-colors duration-300">Total Balance Stock</CardTitle>
              <div className="h-8 w-8 rounded-full bg-blue-100/80 dark:bg-blue-800/80 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-800 dark:text-blue-300 group-hover:text-blue-700 dark:group-hover:text-blue-200 transition-colors duration-300">5999</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* General Purchase Accounts */}
      <div className="mt-6">
        <div className="grid gap-4 grid-cols-3">
          <Card className="group transition-all hover:shadow-2xl transform hover:-translate-y-2 duration-300 backdrop-blur-sm bg-gradient-to-br from-white/50 via-white/40 to-white/30 dark:from-gray-800/50 dark:via-gray-800/40 dark:to-gray-800/30 border border-gray-200/50 dark:border-gray-700/50 hover:border-blue-200/50 dark:hover:border-blue-700/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">Purchase Amount</CardTitle>
              <div className="h-8 w-8 rounded-full bg-blue-100/80 dark:bg-blue-800/80 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">₹11,10,100.00</div>
              <p className="text-xs text-muted-foreground mt-1 group-hover:text-blue-500/70 dark:group-hover:text-blue-300/70 transition-colors duration-300">Purchase Amount</p>
            </CardContent>
          </Card>

          <Card className="group transition-all hover:shadow-2xl transform hover:-translate-y-2 duration-300 backdrop-blur-sm bg-gradient-to-br from-white/50 via-white/40 to-white/30 dark:from-gray-800/50 dark:via-gray-800/40 dark:to-gray-800/30 border border-gray-200/50 dark:border-gray-700/50 hover:border-red-200/50 dark:hover:border-red-700/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-300">Settlement Amount</CardTitle>
              <div className="h-8 w-8 rounded-full bg-red-100/80 dark:bg-red-800/80 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-300">₹1,50,000.00</div>
              <p className="text-xs text-muted-foreground mt-1 group-hover:text-red-500/70 dark:group-hover:text-red-300/70 transition-colors duration-300">Settlement Amount</p>
            </CardContent>
          </Card>

          <Card className="group transition-all hover:shadow-2xl transform hover:-translate-y-2 duration-300 backdrop-blur-sm bg-gradient-to-br from-white/50 via-white/40 to-white/30 dark:from-gray-800/50 dark:via-gray-800/40 dark:to-gray-800/30 border border-gray-200/50 dark:border-gray-700/50 hover:border-orange-200/50 dark:hover:border-orange-700/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-300">Balance Amount</CardTitle>
              <div className="h-8 w-8 rounded-full bg-orange-100/80 dark:bg-orange-800/80 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                <Package className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-300">₹9,60,100.00</div>
              <p className="text-xs text-muted-foreground mt-1 group-hover:text-orange-500/70 dark:group-hover:text-orange-300/70 transition-colors duration-300">Balance Amount</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Lead Reminders */}
      {/* Lead Reminders */}
{/* <Card className="mt-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
  <CardHeader className="border-b border-gray-200 dark:border-gray-700">
    <CardTitle className="flex items-center text-xl font-bold text-purple-600 dark:text-purple-400">
      <Clock className="h-6 w-6 mr-2 text-purple-500" />
      Lead Reminders
    </CardTitle>
    <CardDescription className="text-gray-500 dark:text-gray-400">
      Upcoming reminders from Leads List
    </CardDescription>
  </CardHeader>
  <CardContent className="p-0">
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {reminders.map((reminder) => (
        <div key={reminder.id} className="flex items-start justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
          <div className="flex flex-col">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
              {reminder.leadName}
            </h3>
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-1">
              <Calendar className="h-4 w-4 mr-2 text-purple-500" />
              {new Date(reminder.reminderDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
            <p className="text-sm text-purple-500 dark:text-purple-400">
              {reminder.type}
            </p>
          </div>
          <Badge variant="secondary" className={cn(
            "px-2.5 py-0.5 text-xs font-semibold",
            reminder.status === 'Completed' && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
            reminder.status === 'Pending' && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
            reminder.status === 'Scheduled' && "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
          )}>
            {reminder.status}
          </Badge>
        </div>
      ))}
    </div>
    <div className="flex justify-between items-center p-4 border-t border-gray-200 dark:border-gray-700">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
        disabled={currentPage === 1}
      >
        Previous
      </Button>
      <span className="text-sm text-gray-500 dark:text-gray-400">
        Page {currentPage}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setCurrentPage(prev => prev + 1)}
        disabled={reminders.length <= remindersPerPage * currentPage}
      >
        Next
      </Button>
    </div>
  </CardContent>
</Card> */}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Activities */}
        {/* <Card className="lg:col-span-4 backdrop-blur-sm bg-gradient-to-br from-white/50 to-gray-50/30 dark:from-gray-800/50 dark:to-gray-900/30 border border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
              <Activity className="h-6 w-6 mr-2 text-blue-500" />
              Recent Activities
            </CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400 font-medium">
              Latest updates and activities in your healthcare system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} 
                className="group flex items-center space-x-4 p-4 rounded-xl bg-gradient-to-r from-white/70 to-gray-50/70 dark:from-gray-800/70 dark:to-gray-700/70 border border-gray-100/80 dark:border-gray-600/80 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-x-1">
                <div className="flex-shrink-0">
                  <div className={cn(
                    "p-3 rounded-xl transform transition-all duration-300 group-hover:scale-110",
                    activity.type === 'patient' && "bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800",
                    activity.type === 'medicine' && "bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800",
                    activity.type === 'appointment' && "bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800",
                    activity.type === 'staff' && "bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900 dark:to-orange-800"
                  )}>
                    {activity.type === 'patient' && <UserPlus className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
                    {activity.type === 'medicine' && <Pill className="h-6 w-6 text-purple-600 dark:text-purple-400" />}
                    {activity.type === 'appointment' && <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />}
                    {activity.type === 'staff' && <Users className="h-6 w-6 text-orange-600 dark:text-orange-400" />}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-foreground truncate tracking-tight">
                    {activity.text}
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center mt-1 font-medium">
                    <Clock className="h-4 w-4 mr-1.5" />
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card> */}

        {/* Enhanced Leads Table with Month/Year Filtering */}
        <Card className="col-span-7 backdrop-blur-sm bg-gradient-to-br from-white/60 to-gray-50/40 dark:from-gray-800/60 dark:to-gray-900/40 border border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
          <CardHeader className="pb-4 bg-gradient-to-r from-blue-50/80 to-purple-50/80 dark:from-blue-900/20 dark:to-purple-900/20 rounded-t-lg border-b border-blue-100/50 dark:border-blue-800/50">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <CardTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 flex items-center gap-2">
                    <Users className="h-6 w-6 text-blue-500" />
                    Lead Reminders {getMonthYearText() !== 'All Time' && `- ${getMonthYearText()}`}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 bg-white/70 hover:bg-white border-blue-200 hover:border-blue-400 text-blue-700 hover:text-blue-800 transition-all duration-300"
                      onClick={() => setShowMonthDateDialog(true)}
                    >
                      <CalendarDays className="h-4 w-4" />
                      Filter by Date
                    </Button>
                    {(filterMonth !== null || selectedFilterDate) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 bg-red-50/70 hover:bg-red-100 border-red-200 hover:border-red-400 text-red-700 hover:text-red-800 transition-all duration-300"
                        onClick={() => {
                          setFilterMonth(null);
                          setFilterYear(null);
                          setSelectedFilterDate(null);
                          setSelectedDate(new Date().toISOString().split('T')[0]);
                        }}
                      >
                        <Clock className="h-4 w-4" />
                        Clear Filters
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-3 text-gray-500" />
                    <Input
                      type="search"
                      placeholder="Search leads..."
                      className="pl-9 pr-4 py-2 bg-white/70 backdrop-blur-sm border-gray-200 focus:border-blue-400 transition-all duration-300"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Badge variant="secondary" className="bg-blue-100/70 text-blue-800 font-medium px-3 py-1">
                    {leads.length} leads
                  </Badge>
                </div>
            </div>
            {(filterMonth !== null || selectedFilterDate) && (
              <div className="mt-3 flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">
                  {selectedFilterDate 
                    ? `Showing reminders for ${new Date(selectedFilterDate).toLocaleDateString('en-GB', { 
                        day: '2-digit', month: '2-digit', year: 'numeric' 
                      })}` 
                    : `Showing data for ${getMonthYearText()}`
                  }
                </span>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px] text-center">S.NO</TableHead>
                    <TableHead className="text-center">Date</TableHead>
                    <TableHead className="text-center">Name</TableHead>
                    <TableHead className="text-center">Contact Number</TableHead>
                    <TableHead className="text-center">Reminder Date</TableHead>
                    <TableHead className="text-center">Category</TableHead>
                    <TableHead className="text-center">Description</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    // Get today's date at start of day in local timezone
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    
                    // Filter leads based on selected date or today
                    const filteredLeads = leads.filter(lead => {
                      // Convert reminder date to local timezone date at start of day
                      const reminderDate = new Date(lead.reminderDate);
                      reminderDate.setHours(0, 0, 0, 0);
                      
                      // Get comparison date from selectedFilterDate or use today
                      let compareDate;
                      if (selectedFilterDate) {
                        // Convert the YYYY-MM-DD format to a Date object
                        compareDate = new Date(selectedFilterDate);
                      } else {
                        compareDate = today;
                      }
                      compareDate.setHours(0, 0, 0, 0);
                      
                      // Format both dates to DD/MM/YYYY for comparison
                      const reminderDateFormatted = reminderDate.toLocaleDateString('en-GB');
                      const compareDateFormatted = compareDate.toLocaleDateString('en-GB');
                      
                      console.log('Date comparison:', {
                        selectedFilter: selectedFilterDate,
                        reminderDate: reminderDateFormatted,
                        compareDate: compareDateFormatted,
                        isMatch: reminderDateFormatted === compareDateFormatted
                      });
                      
                      console.log('Date comparison:', {
                        selectedFilterDate,
                        parsedCompareDate: compareDate.toLocaleDateString('en-GB'),
                        reminderDate: reminderDate.toLocaleDateString('en-GB')
                      });
                      
                      // Convert both dates to date strings in DD/MM/YYYY format
                      const reminderDateStr = reminderDate.toLocaleDateString('en-GB');
                      const compareDateStr = compareDate.toLocaleDateString('en-GB');
                      
                      // Compare the formatted dates
                      return reminderDateFormatted === compareDateFormatted;
                    });

                    // Show appropriate message when no leads are found
                    if (filteredLeads.length === 0) {
                      const message = selectedFilterDate 
                        ? `No Lead Reminders for ${new Date(selectedFilterDate).toLocaleDateString('en-GB', { 
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}`
                        : 'No Lead Reminders Today';
                      
                      return (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8 text-gray-500 font-medium">
                            {message}
                          </TableCell>
                        </TableRow>
                      );
                    }

                    return filteredLeads.map((lead, index) => (
                      <TableRow key={lead.id}>
                        <TableCell className="text-center">{index + 1}</TableCell>
                        <TableCell className="text-center">{new Date(lead.date).toLocaleDateString('en-GB', { 
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}</TableCell>
                        <TableCell className="text-center font-medium">{lead.name}</TableCell>
                        <TableCell className="text-center">{lead.phone || '9876543211'}</TableCell>
                        <TableCell className="text-center">{new Date(lead.reminderDate).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}</TableCell>
                        <TableCell className="text-center">{lead.category}</TableCell>
                        <TableCell className="text-center max-w-[200px] truncate">{lead.description}</TableCell>
                        <TableCell className="text-center">
                          <span className={
                            lead.status === 'Reminder' ? 'text-orange-500 font-medium' :
                            lead.status === 'Not Interested' ? 'text-red-500 font-medium' :
                            lead.status === 'Closed' ? 'text-green-500 font-medium' :
                            'text-gray-500 font-medium'
                          }>
                            {lead.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 hover:border-blue-400 action-btn-edit rounded-lg transition-all duration-300"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ));
                  })()}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        {/* <Card className="lg:col-span-3 backdrop-blur-sm bg-gradient-to-br from-white/50 to-gray-50/30 dark:from-gray-800/50 dark:to-gray-900/30 border border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400">
              <ClipboardCheck className="h-6 w-6 mr-2 text-green-500" />
              Today's Schedule
            </CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400 font-medium">
              Upcoming appointments and procedures
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {todaySchedule.map((appointment) => (
              <div 
                key={appointment.id} 
                className="group flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-white/70 to-gray-50/70 dark:from-gray-800/70 dark:to-gray-700/70 border border-gray-100/80 dark:border-gray-600/80 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-x-1"
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900">
                      <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-base font-semibold tracking-tight">{appointment.time}</span>
                  </div>
                  <div>
                    <p className="text-base font-medium text-foreground">{appointment.patient}</p>
                    <p className="text-sm text-muted-foreground flex items-center mt-1">
                      <Stethoscope className="h-4 w-4 mr-1.5" />
                      {appointment.doctor} • {appointment.type}
                    </p>
                  </div>
                </div>
                <div className="transform transition-all duration-300 group-hover:scale-105">
                  {appointment.status === 'confirmed' && (
                    <Badge className="bg-gradient-to-r from-green-100 to-green-200 text-green-800 dark:from-green-900 dark:to-green-800 dark:text-green-200 font-medium px-3 py-1">
                      Confirmed
                    </Badge>
                  )}
                  {appointment.status === 'pending' && (
                    <Badge className="bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 dark:from-yellow-900 dark:to-yellow-800 dark:text-yellow-200 font-medium px-3 py-1">
                      Pending
                    </Badge>
                  )}
                  {appointment.status === 'cancelled' && (
                    <Badge className="bg-gradient-to-r from-red-100 to-red-200 text-red-800 dark:from-red-900 dark:to-red-800 dark:text-red-200 font-medium px-3 py-1">
                      Cancelled
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card> */}
      </div>

      {/* Quick Actions */}
      <Card className="backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50">
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-bold">
            <Heart className="h-6 w-6 mr-2 text-pink-500" />
            Quick Actions
          </CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400">
            Frequently used functions for healthcare management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button 
              className="h-24 flex-col space-y-3 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
            >
              <UserPlus className="h-7 w-7" />
              <span className="font-semibold">Add Patient</span>
            </Button>
            <Button 
              className="h-24 flex-col space-y-3 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
            >
              <Calendar className="h-7 w-7" />
              <span className="font-semibold">Schedule Appointment</span>
            </Button>
            <Button 
              className="h-24 flex-col space-y-3 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
            >
              <Pill className="h-7 w-7" />
              <span className="font-semibold">Add Medicine</span>
            </Button>
            <Button 
              className="h-24 flex-col space-y-3 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
            >
              <Stethoscope className="h-7 w-7" />
              <span className="font-semibold">Doctor Schedule</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;