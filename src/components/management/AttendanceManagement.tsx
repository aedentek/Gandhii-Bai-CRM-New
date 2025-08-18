import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { CalendarIcon, Search, Users, Download, CheckCircle, XCircle, Clock, RefreshCw, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DatabaseService } from '@/services/databaseService';
import '@/styles/global-crm-design.css';
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
  notes?: string;
}

const AttendanceManagement: React.FC = () => {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [downloadMonth, setDownloadMonth] = useState<Date>(new Date());
  const [staff, setStaff] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<StaffAttendance[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredStaff, setFilteredStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAttendance, setMarkingAttendance] = useState<string | null>(null);

  // Debounced search to improve performance
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const filterStaff = useCallback(() => {
    let filtered = staff;
    if (debouncedSearchTerm) {
      filtered = staff.filter(member =>
        member.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        member.id.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        (member.role && member.role.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
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
  }, [staff, debouncedSearchTerm]);

  useEffect(() => {
    loadStaff();
    loadAttendanceRecords();
  }, []);

  useEffect(() => {
    if (staff.length > 0) {
      loadAttendanceRecords();
    }
  }, [selectedDate]);

  useEffect(() => {
    filterStaff();
  }, [staff, debouncedSearchTerm, filterStaff]);

  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, staff]);

  const loadStaff = async () => {
    try {
      console.log('Loading staff data...');
      const data = await DatabaseService.getAllStaff();
      console.log('Loaded staff data:', data.length, data);
      
      // Filter out deleted staff and ensure proper data structure
      const activeStaff = data.filter((staff: any) => staff.status !== 'deleted' && staff.name);
      setStaff(activeStaff);
      
      // Save to localStorage as backup
      localStorage.setItem('staff', JSON.stringify(activeStaff));
    } catch (error) {
      console.error('Error loading staff:', error);
      
      // Fallback to localStorage
      const stored = localStorage.getItem('staff');
      if (stored) {
        try {
          const fallbackData = JSON.parse(stored);
          console.log('Using fallback staff data:', fallbackData.length, fallbackData);
          const activeStaff = fallbackData.filter((staff: any) => staff.status !== 'deleted' && staff.name);
          setStaff(activeStaff);
          toast({
            title: "Using Local Data",
            description: "Loaded staff from local storage due to connection issue",
            variant: "default",
          });
        } catch (parseError) {
          console.error('Error parsing localStorage staff data:', parseError);
          setStaff([]);
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to load staff from database",
          variant: "destructive",
        });
        setStaff([]);
      }
    }
  };

  const loadAttendanceRecords = async () => {
    try {
      setLoading(true);
      console.log('Loading staff attendance records...');
      const data = await DatabaseService.getAllStaffAttendance();
      console.log('Loaded staff attendance records:', data.length, data);
      
      // Ensure data is properly formatted
      const formattedData = data.map((record: any) => ({
        ...record,
        date: record.date ? format(new Date(record.date), 'yyyy-MM-dd') : record.date
      }));
      
      setAttendanceRecords(formattedData);
      
      // Save to localStorage as backup
      localStorage.setItem('staffAttendance', JSON.stringify(formattedData));
    } catch (error) {
      console.error('Error loading  records:', error);
      
      // Fallback to localStorage
      const stored = localStorage.getItem('staffAttendance');
      if (stored) {
        try {
          const fallbackData = JSON.parse(stored);
          console.log('Using fallback attendance data:', fallbackData.length, fallbackData);
          setAttendanceRecords(fallbackData);
          toast({
            title: "Using Local Data",
            description: "Loaded attendance records from local storage due to connection issue",
            variant: "default",
          });
        } catch (parseError) {
          console.error('Error parsing localStorage attendance data:', parseError);
          setAttendanceRecords([]);
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to load attendance records from database",
          variant: "destructive",
        });
        setAttendanceRecords([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = useCallback(async (staffId: string, staffName: string, status: 'Present' | 'Absent' | 'Late') => {
    setMarkingAttendance(staffId);
    const dateString = format(selectedDate, 'yyyy-MM-dd');
    const currentTime = new Date();
    const checkIn = status !== 'Absent' ? format(currentTime, 'HH:mm:ss') : '';

    console.log('Marking attendance:', { staffId, staffName, status, dateString, checkIn });

    // Check if attendance already exists for this staff and date
    const existingAttendance = attendanceRecords.find(record => {
      const recordDate = record.date ? format(new Date(record.date), 'yyyy-MM-dd') : '';
      return record.staff_id === staffId && recordDate === dateString;
    });

    const attendanceData = {
      staff_id: staffId,
      staff_name: staffName,
      date: dateString,
      check_in: checkIn,
      status,
      notes: `Marked by system at ${format(currentTime, 'HH:mm:ss')}`
    };

    // Local-first approach: Update UI immediately
    let updatedRecords;
    if (existingAttendance) {
      // Update existing attendance
      updatedRecords = attendanceRecords.map(record => 
        record.id === existingAttendance.id 
          ? { ...record, ...attendanceData, check_out: existingAttendance.check_out }
          : record
      );
    } else {
      // Create new attendance record
      const newRecord = {
        id: Date.now(),
        ...attendanceData
      };
      updatedRecords = [...attendanceRecords, newRecord];
    }

    // Update UI immediately
    setAttendanceRecords(updatedRecords);
    localStorage.setItem('staffAttendance', JSON.stringify(updatedRecords));
    
    // Show success message immediately
    toast({
      title: "Attendance Marked",
      description: `${staffName} marked as ${status} for ${format(selectedDate, 'MMM dd, yyyy')}`,
    });

    // Try to sync with database in background (silently)
    try {
      if (existingAttendance) {
        await DatabaseService.updateStaffAttendance(existingAttendance.id, {
          ...attendanceData,
          check_out: existingAttendance.check_out
        });
      } else {
        await DatabaseService.markStaffAttendance(attendanceData);
      }
      console.log('Successfully synced attendance to database');
    } catch (error) {
      console.error('Background sync failed (data saved locally):', error);
      // No error popup - just log for debugging
    }

    setMarkingAttendance(null);
  }, [selectedDate, attendanceRecords]);

  const getAttendanceForDate = useCallback((staffId: string, date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const record = attendanceRecords.find(
      record => {
        // Convert database date to yyyy-MM-dd format for comparison
        const recordDate = record.date ? format(new Date(record.date), 'yyyy-MM-dd') : '';
        return record.staff_id === staffId && recordDate === dateString && record.status && ['Present', 'Absent', 'Late', 'Half Day'].includes(record.status);
      }
    );
    console.log(`Looking for ${staffId} on ${dateString}, found:`, record); // Debug log
    return record || null;
  }, [attendanceRecords]);

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

  const getAttendanceStats = useCallback(() => {
    if (staff.length === 0) {
      return { total: 0, present: 0, absent: 0, late: 0 };
    }
    const dateString = format(selectedDate, 'yyyy-MM-dd');
    
    // Count all staff and their attendance status
    let present = 0, absent = 0, late = 0;
    
    staff.forEach(member => {
      const attendance = attendanceRecords.find(record => {
        // Convert database date to yyyy-MM-dd format for comparison
        const recordDate = record.date ? format(new Date(record.date), 'yyyy-MM-dd') : record.date;
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
    
    console.log(`Stats for ${dateString}:`, { total: staff.length, present, absent, late, attendanceRecords: attendanceRecords.length });
    
    return {
      total: staff.length,
      present,
      absent,
      late
    };
  }, [attendanceRecords, selectedDate, staff]);

  const exportAttendance = () => {
    const currentMonth = format(downloadMonth, 'yyyy-MM');
    const year = downloadMonth.getFullYear();
    const month = downloadMonth.getMonth();
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
      ...attendanceRecords.filter(r => r.date.startsWith(currentMonth)).map(r => r.staff_id)
    ]));
    const rows = staffIds.map((sid, idx) => {
      const row: Record<string, string | number> = {
        'S NO': idx + 1,
        'Staff ID': sid,
        'Staff Name': staffMap[sid] || ''
      };
      dateColumns.forEach(dateStr => {
        const rec = attendanceRecords.find(r => r.staff_id === sid && r.date === dateStr);
        row[format(new Date(dateStr), 'dd/MM')] = rec ? rec.status : '';
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
      description: `Staff attendance for ${format(downloadMonth, 'MMMM yyyy')} exported to CSV file`,
    });
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentStaff = filteredStaff.slice(startIndex, endIndex);

  // Memoize stats calculation for better performance
  const stats = React.useMemo(() => getAttendanceStats(), [getAttendanceStats]);

  const refreshData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadStaff(), loadAttendanceRecords()]);
      toast({
        title: "Data Refreshed",
        description: "Staff and attendance data has been refreshed",
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: "Refresh Failed",
        description: "Some data may not be up to date",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="crm-page-bg">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header Section */}
        <div className="crm-header-container">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
            <div className="flex items-center gap-3">
              <div className="crm-header-icon">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Staff Attendance</h1>
                <p className="text-sm sm:text-base text-gray-600">Manage daily attendance and track staff presence</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <Button 
                onClick={refreshData}
                disabled={loading}
                className="global-btn flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
              >
                <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
                <span className="sm:hidden">↻</span>
              </Button>

              <Button 
                onClick={exportAttendance}
                className="global-btn flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">CSV</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="crm-stats-grid">
          <Card className="crm-stat-card crm-stat-card-blue">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-blue-700 mb-1 truncate">Total Staff</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-900 mb-1">{staff.length}</p>
                  <div className="flex items-center text-xs text-blue-600">
                    <Users className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Registered</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-blue">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="crm-stat-card crm-stat-card-green">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-green-700 mb-1 truncate">Present Today</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-900 mb-1">{stats.present}</p>
                  <div className="flex items-center text-xs text-green-600">
                    <CheckCircle className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Active</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-green">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="crm-stat-card crm-stat-card-red">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-red-700 mb-1 truncate">Absent Today</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-900 mb-1">{stats.absent}</p>
                  <div className="flex items-center text-xs text-red-600">
                    <XCircle className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Missing</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-red">
                  <XCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="crm-stat-card crm-stat-card-orange">
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
                <div className="crm-stat-icon crm-stat-icon-orange">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Date Selection and Controls */}
        <Card className="crm-controls-container">
          <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            {/* Daily Attendance Section */}
            <div className="flex flex-col md:flex-row gap-4 items-center border-b pb-4">
              <div className="flex items-center space-x-4">
                <Label>Daily Attendance Date:</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[240px] justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
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

              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search staff..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Monthly Download Section */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex items-center space-x-4">
                <Label>Download Month:</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[240px] justify-start text-left font-normal",
                        !downloadMonth && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {downloadMonth ? format(downloadMonth, "MMMM yyyy") : "Pick month & year"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={downloadMonth}
                      onSelect={(date) => date && setDownloadMonth(date)}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Button 
                  variant="outline" 
                  onClick={exportAttendance}
                  className="global-btn global-btn-secondary"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Monthly CSV
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      <Card className="crm-table-container">
        <CardHeader className="crm-table-header">
          <div className="crm-table-title">
            <Users className="crm-table-title-icon" />
            <span className="crm-table-title-text">Staff Attendance for {format(selectedDate, 'EEEE, MMMM dd, yyyy')}</span>
            <span className="crm-table-title-text-mobile">Attendance {format(selectedDate, 'dd/MM')}</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">S No</TableHead>
                <TableHead className="text-center">Profile Photo</TableHead>
                <TableHead className="text-center">Staff ID</TableHead>
                <TableHead className="text-center">Staff Name</TableHead>
                <TableHead className="text-center">Role</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Check In</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentStaff.length > 0 ? (
                currentStaff.map((member, idx) => {
                  const attendance = getAttendanceForDate(member.id, selectedDate);
                  return (
                    <TableRow key={member.id} className="hover:bg-muted/50">
                      <TableCell className="text-center font-medium">{startIndex + idx + 1}</TableCell>
                      <TableCell className="text-center">
                        {member.photo ? (
                          <img
                            src={member.photo}
                            alt={member.name || 'Profile'}
                            className="w-8 h-8 rounded-full object-cover mx-auto"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mx-auto text-xs text-muted-foreground">
                            N/A
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center font-medium">{member.id}</TableCell>
                      <TableCell className="text-center">{member.name}</TableCell>
                      <TableCell className="text-center">{member.role}</TableCell>
                      <TableCell className="text-center">
                        {attendance ? (
                          getStatusBadge(attendance.status)
                        ) : (
                          <span className="text-muted-foreground">Not Updated</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {attendance?.check_in || ''}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex space-x-1 justify-center">
                          <Button
                            size="sm"
                            onClick={() => markAttendance(member.id, member.name, 'Present')}
                            variant={attendance?.status === 'Present' ? "default" : "outline"}
                            className={`action-btn-lead ${attendance?.status === 'Present' ? 'action-btn-present active' : 'action-btn-present'}`}
                            title="Present"
                            disabled={markingAttendance === member.id || loading}
                          >
                            P
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => markAttendance(member.id, member.name, 'Late')}
                            variant={attendance?.status === 'Late' ? "default" : "outline"}
                            className={`action-btn-lead ${attendance?.status === 'Late' ? 'action-btn-late active' : 'action-btn-late'}`}
                            title="Late"
                            disabled={markingAttendance === member.id || loading}
                          >
                            L
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => markAttendance(member.id, member.name, 'Absent')}
                            variant={attendance?.status === 'Absent' ? "default" : "outline"}
                            className={`action-btn-lead ${attendance?.status === 'Absent' ? 'action-btn-absent active' : 'action-btn-absent'}`}
                            title="Absent"
                            disabled={markingAttendance === member.id || loading}
                          >
                            A
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              // Implementing reset functionality
                              const dateString = format(selectedDate, 'yyyy-MM-dd');
                              const attendanceRecord = attendanceRecords.find(record => 
                                record.staff_id === member.id && record.date === dateString
                              );
                              
                              if (attendanceRecord && attendanceRecord.id) {
                                // Update UI immediately
                                setAttendanceRecords(prev => 
                                  prev.filter(record => record.id !== attendanceRecord.id)
                                );

                                // Show feedback
                                toast({
                                  title: "Attendance Reset",
                                  description: `${member.name}'s attendance has been reset`,
                                });

                                // Sync with database
                                DatabaseService.deleteStaffAttendance(attendanceRecord.id).catch(error => {
                                  console.error('Error resetting attendance:', error);
                                  // Revert on failure
                                  setAttendanceRecords(prev => [...prev, attendanceRecord]);
                                  toast({
                                    title: "Error",
                                    description: "Failed to reset attendance",
                                    variant: "destructive",
                                  });
                                });
                              }
                            }}
                            variant="outline"
                            className="action-btn-lead action-btn-reset"
                            title="Reset Attendance"
                            disabled={!attendance || markingAttendance === member.id || loading}
                          >
                            <RotateCcw className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {loading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Loading staff data...</span>
                      </div>
                    ) : (
                      "No staff members found. Please add staff first."
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center px-6 py-4 border-t">
              <div className="text-sm text-gray-600">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredStaff.length)} of {filteredStaff.length} staff
              </div>
              <div className="flex items-center gap-1">
                <Button 
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  className="px-3 py-1 text-sm"
                >
                  Previous
                </Button>
                {[...Array(totalPages)].map((_, idx) => {
                  const pageNum = idx + 1;
                  return (
                    <Button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      className={`px-3 py-1 text-sm min-w-[32px] ${
                        currentPage === pageNum 
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                          : "hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                <Button 
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  className="px-3 py-1 text-sm"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default AttendanceManagement;