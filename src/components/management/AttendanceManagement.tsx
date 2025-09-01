import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ActionButtons } from '@/components/ui/HeaderActionButtons';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { CalendarIcon, Search, Users, Download, CheckCircle, XCircle, Clock, RotateCcw, UserCheck, Activity, TrendingUp, RefreshCw, Calendar as CalendarLucide, UserPlus, Stethoscope, Plus, CalendarDays } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { DatabaseService } from '@/services/databaseService';
import MonthYearPickerDialog from '@/components/shared/MonthYearPickerDialog';
import usePageTitle from '@/hooks/usePageTitle';
import '../../styles/modern-forms.css';
import '../../styles/modern-tables.css';

interface StaffAttendance {
  id: number;
  staff_id: string;
  staff_name: string;
  date: string;
  check_in: string;
  check_out?: string;
  status: 'Present' | 'Absent' | 'Late' | 'Half Day';
  working_hours?: string;
}

const AttendanceManagement: React.FC = () => {
  // Set page title
  usePageTitle();

  // Helper function to get staff image URL with proxy
  const getStaffImageUrl = (photo: string | undefined | null): string => {
    if (!photo) return '';
    
    // If it's base64 data, return as is
    if (photo.startsWith('data:image/')) {
      return photo;
    }
    
    // If it's a file path, use proxy for image processing
    if (photo.startsWith('/') || photo.startsWith('http')) {
      return `${import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:4000'}${photo.startsWith('/') ? '' : '/'}${photo}`;
    }
    
    // Default proxy path
    return `${import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:4000'}/${photo}`;
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [downloadMonth, setDownloadMonth] = useState<Date>(new Date());
  const [staff, setStaff] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<StaffAttendance[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredStaff, setFilteredStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Set initial page when component mounts
  useEffect(() => {
    setCurrentPage(1);
  }, []);

  useEffect(() => {
    loadStaff();
    loadAttendanceRecords();
  }, [selectedDate]);

  useEffect(() => {
    filterStaff();
  }, [staff, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, staff]);

  // Ensure we stay on first page when data changes
  useEffect(() => {
    if (filteredStaff.length > 0) {
      setCurrentPage(1);
    }
  }, [filteredStaff.length]);

  const filterStaff = () => {
    let filtered = staff;
    if (searchTerm) {
      filtered = staff.filter(member =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.role && member.role.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Sort staff by ID in ascending order
    filtered.sort((a, b) => {
      const getNum = (id: string) => {
        if (!id) return 0;
        const match = id.match(/STF(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      };
      return getNum(a.id) - getNum(b.id);
    });
    
    setFilteredStaff(filtered);
  };

  const loadStaff = async () => {
    try {
      const data = await DatabaseService.getAllStaff();
      // Filter out deleted staff
      const activeStaff = data.filter((staff: any) => staff.status !== 'deleted' && staff.name);
      setStaff(activeStaff);
      setCurrentPage(1); // Ensure we start from the first page
    } catch (error) {
      console.error('Error loading staff:', error);
      toast({
        title: "Error",
        description: "Failed to load staff",
        variant: "destructive",
      });
    }
  };

  const loadAttendanceRecords = async () => {
    try {
      setLoading(true);
      // Load all attendance records and filter on client side for better reliability
      const data = await DatabaseService.getAllStaffAttendance();
      console.log('Loaded attendance records:', data); // Debug log
      setAttendanceRecords(data);
    } catch (error) {
      console.error('Error loading attendance records:', error);
      toast({
        title: "Error",
        description: "Failed to load attendance records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetAttendance = async (staffId: string, staffName: string) => {
    try {
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      
      // Find the attendance record to delete
      const attendanceRecord = attendanceRecords.find(record => 
        record.staff_id === staffId && format(new Date(record.date), 'yyyy-MM-dd') === dateString
      );
      
      if (attendanceRecord && attendanceRecord.id) {
        await DatabaseService.deleteStaffAttendance(attendanceRecord.id);
        
        // Update the local attendance records by filtering out the reset record
        setAttendanceRecords(prev => 
          prev.filter(record => record.id !== attendanceRecord.id)
        );

        toast({
          title: "Attendance Reset",
          description: `${staffName}'s attendance has been reset`,
        });
      }
    } catch (error) {
      console.error('Error resetting attendance:', error);
      toast({
        title: "Error",
        description: "Failed to reset attendance",
        variant: "destructive",
      });
    }
  };

  const markAttendance = async (staffId: string, staffName: string, status: 'Present' | 'Absent' | 'Late') => {
    try {
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      const checkIn = status !== 'Absent' ? format(new Date(), 'HH:mm:ss') : '';
      
      await DatabaseService.markStaffAttendance({
        staff_id: staffId,
        staff_name: staffName,
        date: dateString,
        check_in: checkIn,
        status
      });

      await loadAttendanceRecords();
      toast({
        title: "Attendance Marked",
        description: `${staffName} marked as ${status}`,
      });
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast({
        title: "Error",
        description: "Failed to mark attendance",
        variant: "destructive",
      });
    }
  };

  const getAttendanceForDate = (staffId: string, date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const record = attendanceRecords.find(
      record => {
        // Convert database date to yyyy-MM-dd format for comparison
        const recordDate = record.date ? format(new Date(record.date), 'yyyy-MM-dd') : '';
        return record.staff_id === staffId && recordDate === dateString;
      }
    );
    // Only return the record if it has a valid status
    if (record && ['Present', 'Absent', 'Late', 'Half Day'].includes(record.status)) {
      return record;
    }
    return null;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      Present: { className: 'bg-success text-success-foreground', icon: CheckCircle },
      Absent: { className: 'bg-destructive text-destructive-foreground', icon: XCircle },
      Late: { className: 'bg-warning text-warning-foreground', icon: Clock },
      'Half Day': { className: 'bg-warning text-warning-foreground', icon: Clock }
    };
    const variant = variants[status as keyof typeof variants];
    if (!variant) return null;
    const Icon = variant.icon;
    return (
      <Badge className={variant.className}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const exportAttendance = () => {
    // Use selected month/year from the popup filter
    const exportMonth = filterMonth !== null ? filterMonth : new Date().getMonth();
    const exportYear = filterYear !== null ? filterYear : new Date().getFullYear();
    
    // Create date object for the selected month/year
    const exportDate = new Date(exportYear, exportMonth, 1);
    const currentMonth = format(exportDate, 'yyyy-MM');
    const year = exportYear;
    const month = exportMonth;
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dateColumns = Array.from({ length: daysInMonth }, (_, i) => {
      const d = new Date(year, month, i + 1);
      return format(d, 'yyyy-MM-dd');
    });
    const staffMap = staff.reduce((acc, s) => {
      acc[s.id] = s.name;
      return acc;
    }, {} as Record<string, string>);
    const staffIds = Array.from(new Set([
      ...staff.map(s => s.id),
      ...attendanceRecords.filter(r => {
        const recordDate = new Date(r.date);
        return recordDate.getMonth() === month && recordDate.getFullYear() === year;
      }).map(r => r.staff_id)
    ]));
    const rows = staffIds.map((sid, idx) => {
      const row: Record<string, string | number> = {
        'S NO': idx + 1,
        'Staff ID': sid,
        'Staff Name': staffMap[sid] || ''
      };
      dateColumns.forEach(dateStr => {
        const rec = attendanceRecords.find(r => {
          const recordDate = format(new Date(r.date), 'yyyy-MM-dd');
          return r.staff_id === sid && recordDate === dateStr;
        });
        row[format(new Date(dateStr), 'dd/MM')] = rec ? rec.status : '-';
      });
      return row;
    });
    const header = ['S NO', 'Staff ID', 'Staff Name', ...dateColumns.map(d => format(new Date(d), 'dd/MM'))];
    const csvRows = [header.join(',')];
    rows.forEach(row => {
      csvRows.push(header.map(h => row[h] ?? '').join(','));
    });
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `staff-attendance-${currentMonth}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast({
      title: "Export Successful",
      description: `Staff attendance for ${format(exportDate, 'MMMM yyyy')} exported to CSV file`,
    });
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentStaff = filteredStaff.slice(startIndex, endIndex);

  const getAttendanceStats = () => {
    if (staff.length === 0) {
      return { total: 0, present: 0, absent: 0, late: 0 };
    }
    const dateString = format(selectedDate, 'yyyy-MM-dd');
    
    // Count all staff and their attendance status
    let present = 0, absent = 0, late = 0;
    
    staff.forEach(member => {
      const attendance = attendanceRecords.find(record => {
        const recordDate = record.date ? format(new Date(record.date), 'yyyy-MM-dd') : '';
        return record.staff_id === member.id && recordDate === dateString;
      });
      
      if (attendance) {
        switch (attendance.status) {
          case 'Present':
            present++;
            break;
          case 'Absent':
            absent++;
            break;
          case 'Late':
            late++;
            break;
        }
      }
    });
    
    return {
      total: staff.length,
      present,
      absent,
      late
    };
  };

  const stats = getAttendanceStats();

  return (
    <div className="crm-page-bg">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header Section */}
        <div className="crm-header-container">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="crm-header-icon">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Staff Attendance</h1>
                {/* <p className="text-sm text-gray-600 mt-1">Track daily staff attendance and schedules</p> */}
              </div>
            </div>
          
            <div className="flex flex-row sm:flex-row gap-1 sm:gap-3 w-full sm:w-auto">
              <ActionButtons.Refresh 
                onClick={loadStaff}
                loading={loading}
                disabled={loading}
              />
              
              <ActionButtons.MonthYear 
                onClick={() => setShowMonthYearDialog(true)}
                text={filterMonth !== null && filterYear !== null 
                  ? `${months[filterMonth].slice(0, 3)} ${filterYear}`
                  : `${months[selectedMonth].slice(0, 3)} ${selectedYear}`
                }
              />
              
              {/* Export CSV Button */}
              <Button 
                onClick={exportAttendance}
                className="global-btn flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
                title="Export filtered attendance to CSV"
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">CSV</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          {/* Total Staff Card */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100/80 border-0 rounded-xl lg:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/10"></div>
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-200/20 rounded-full -mr-8 -mt-8"></div>
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-blue-700 mb-1 truncate">Total Staff</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-900 mb-1">{stats.total}</p>
                  <div className="flex items-center text-xs text-blue-600">
                    <TrendingUp className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Active</span>
                  </div>
                </div>
                <div className="p-2 sm:p-3 bg-blue-500 rounded-lg lg:rounded-xl shadow-md group-hover:bg-blue-600 transition-colors duration-300 flex-shrink-0">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Present Today Card */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-green-50 to-green-100/80 border-0 rounded-xl lg:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-green-600/10"></div>
            <div className="absolute top-0 right-0 w-16 h-16 bg-green-200/20 rounded-full -mr-8 -mt-8"></div>
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-green-700 mb-1 truncate">Present Today</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-900 mb-1">{stats.present}</p>
                  <div className="flex items-center text-xs text-green-600">
                    <UserCheck className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">On duty</span>
                  </div>
                </div>
                <div className="p-2 sm:p-3 bg-green-500 rounded-lg lg:rounded-xl shadow-md group-hover:bg-green-600 transition-colors duration-300 flex-shrink-0">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Absent Today Card */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-red-50 to-red-100/80 border-0 rounded-xl lg:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-red-600/10"></div>
            <div className="absolute top-0 right-0 w-16 h-16 bg-red-200/20 rounded-full -mr-8 -mt-8"></div>
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-red-700 mb-1 truncate">Absent Today</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-900 mb-1">{stats.absent}</p>
                  <div className="flex items-center text-xs text-red-600">
                    <Activity className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Not present</span>
                  </div>
                </div>
                <div className="p-2 sm:p-3 bg-red-500 rounded-lg lg:rounded-xl shadow-md group-hover:bg-red-600 transition-colors duration-300 flex-shrink-0">
                  <XCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Late Today Card */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100/80 border-0 rounded-xl lg:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-orange-600/10"></div>
            <div className="absolute top-0 right-0 w-16 h-16 bg-orange-200/20 rounded-full -mr-8 -mt-8"></div>
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-orange-700 mb-1 truncate">Late Today</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-900 mb-1">{stats.late}</p>
                  <div className="flex items-center text-xs text-orange-600">
                    <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Delayed</span>
                  </div>
                </div>
                <div className="p-2 sm:p-3 bg-orange-500 rounded-lg lg:rounded-xl shadow-md group-hover:bg-orange-600 transition-colors duration-300 flex-shrink-0">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Date Selection and Controls */}
        <Card className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-xl sm:rounded-2xl shadow-lg mb-6 sm:mb-8">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
              {/* Search Bar - Full Width on Mobile, Flexible on Desktop */}
              <div className="flex-1 w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search staff..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-gray-200 focus:border-blue-500 rounded-lg w-full h-10"
                  />
                </div>
              </div>

              {/* Date Selection - Full Width on Mobile, Auto Width on Desktop */}
              <div className="w-full lg:w-auto flex justify-center lg:justify-end">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full lg:w-[240px] justify-start text-left font-normal border-gray-200 hover:border-blue-300 h-10",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span className="truncate">
                        {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Table */}
        <Card className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-xl sm:rounded-2xl shadow-lg">
          <CardHeader className="p-4 sm:p-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <CardTitle className="text-lg sm:text-xl text-gray-900">
                Staff Attendance for {format(selectedDate, 'EEEE, MMMM dd, yyyy')}
              </CardTitle>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>Last updated: {format(new Date(), 'MMM dd, yyyy HH:mm')}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Loading attendance...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="w-full min-w-[800px]">
                  <TableHeader>
                    <TableRow className="bg-gray-50 border-b">
                      <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                        <div className="flex items-center justify-center">
                          <span>S No</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                          <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>Photo</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                        <div className="flex items-center justify-center">
                          <span>Staff ID</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                        <div className="flex items-center justify-center">
                          <span>Name</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                        <div className="flex items-center justify-center">
                          <span>Role</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                          <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>Status</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                          <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>Check In</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                        <div className="flex items-center justify-center">
                          <span>Actions</span>
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentStaff.length > 0 ? (
                      currentStaff.map((member, idx) => {
                        const attendance = getAttendanceForDate(member.id, selectedDate);
                        return (
                          <TableRow key={member.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                            <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{startIndex + idx + 1}</TableCell>
                            <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center">
                              <div className="flex justify-center">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage 
                                    src={getStaffImageUrl(member.photo)} 
                                    alt={member.name}
                                  />
                                  <AvatarFallback className="bg-blue-100 text-blue-600 font-medium">
                                    {member.name.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              </div>
                            </TableCell>
                            <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm font-medium text-blue-600 whitespace-nowrap">
                              {member.id}
                            </TableCell>
                            <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm font-medium text-gray-900 whitespace-nowrap">
                              {member.name}
                            </TableCell>
                            <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                              {member.role}
                            </TableCell>
                            <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center whitespace-nowrap">
                              {attendance ? (
                                getStatusBadge(attendance.status)
                              ) : (
                                <Badge className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-medium">
                                  Not Updated
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                              {attendance?.check_in || '-'}
                            </TableCell>
                            <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3">
                              <div className="action-buttons-container">
                                <Button
                                  size="sm"
                                  onClick={() => markAttendance(member.id, member.name, 'Present')}
                                  variant="outline"
                                  className={`action-btn-lead action-btn-present h-8 w-8 sm:h-9 sm:w-9 p-0 ${
                                    attendance?.status === 'Present' ? 'active' : ''
                                  }`}
                                  title="Mark Present"
                                >
                                  <CheckCircle className="h-4 w-4 sm:h-4 sm:w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => markAttendance(member.id, member.name, 'Late')}
                                  variant="outline"
                                  className={`action-btn-lead action-btn-late h-8 w-8 sm:h-9 sm:w-9 p-0 ${
                                    attendance?.status === 'Late' ? 'active' : ''
                                  }`}
                                  title="Mark Late"
                                >
                                  <Clock className="h-4 w-4 sm:h-4 sm:w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => markAttendance(member.id, member.name, 'Absent')}
                                  variant="outline"
                                  className={`action-btn-lead action-btn-absent h-8 w-8 sm:h-9 sm:w-9 p-0 ${
                                    attendance?.status === 'Absent' ? 'active' : ''
                                  }`}
                                  title="Mark Absent"
                                >
                                  <XCircle className="h-4 w-4 sm:h-4 sm:w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => resetAttendance(member.id, member.name)}
                                  variant="outline"
                                  className="action-btn-lead action-btn-reset h-8 w-8 sm:h-9 sm:w-9 p-0"
                                  title="Reset Attendance"
                                >
                                  <RotateCcw className="h-4 w-4 sm:h-4 sm:w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12">
                          <div className="flex flex-col items-center justify-center space-y-4">
                            <div className="p-4 bg-gray-100 rounded-full">
                              <Users className="h-8 w-8 text-gray-400" />
                            </div>
                            <div className="text-center">
                              <h3 className="text-lg font-medium text-gray-900 mb-2">No staff found</h3>
                              <p className="text-gray-500">No staff match your search criteria or no staff have been added yet.</p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between p-4 border-t border-gray-100">
                    <p className="text-sm text-gray-600">
                      Showing {startIndex + 1} to {Math.min(endIndex, filteredStaff.length)} of {filteredStaff.length} staff
                    </p>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="border-gray-200 text-gray-600 hover:bg-gray-50"
                      >
                        Previous
                      </Button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                        <Button
                          key={pageNumber}
                          variant={currentPage === pageNumber ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNumber)}
                          className={cn(
                            "w-8 h-8",
                            currentPage === pageNumber 
                              ? "bg-blue-600 text-white hover:bg-blue-700" 
                              : "border-gray-200 text-gray-600 hover:bg-gray-50"
                          )}
                        >
                          {pageNumber}
                        </Button>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="border-gray-200 text-gray-600 hover:bg-gray-50"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Month/Year Picker Dialog */}
        <MonthYearPickerDialog
          open={showMonthYearDialog}
          onOpenChange={setShowMonthYearDialog}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
          onApply={() => {
            setFilterMonth(selectedMonth);
            setFilterYear(selectedYear);
            setShowMonthYearDialog(false);
            loadAttendanceRecords(); // Reload attendance records for the selected month/year
          }}
          title="Select Month & Year"
          description="Filter attendance records by specific month and year"
          previewText="attendance records"
        />
      </div>
    </div>
  );
};

export default AttendanceManagement;