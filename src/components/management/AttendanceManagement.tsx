import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { CalendarIcon, Search, Users, Download, CheckCircle, XCircle, Clock, RefreshCw, RotateCcw, UserCheck, UserX, Timer, ClockIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DatabaseService } from '@/services/databaseService';

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
      Present: { className: 'bg-green-100 text-green-700 border border-green-200', icon: CheckCircle },
      Absent: { className: 'bg-red-100 text-red-700 border border-red-200', icon: XCircle },
      Late: { className: 'bg-orange-100 text-orange-700 border border-orange-200', icon: Timer },
      'Half Day': { className: 'bg-yellow-100 text-yellow-700 border border-yellow-200', icon: Clock }
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Professional Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 hover:shadow-md hover:scale-[1.01] transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center transition-all duration-300 hover:bg-blue-700 hover:scale-110">
                <UserCheck className="w-6 h-6 text-white transition-transform duration-300 hover:rotate-3" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 transition-colors duration-300 hover:text-blue-600">Staff Attendance</h1>
                <p className="text-sm text-gray-600 mt-1">Manage and track staff attendance records</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button 
                onClick={refreshData}
                disabled={loading}
                variant="outline"
                className="modern-btn modern-btn-primary flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''} transition-transform duration-300 hover:rotate-180`} />
                <span className="font-medium">Refresh</span>
              </Button>

              <Button 
                onClick={exportAttendance}
                className="flex items-center space-x-2 hover:scale-105 transition-all duration-300 hover:shadow-md bg-green-600 hover:bg-green-700 text-white"
              >
                <Download className="h-4 w-4 transition-transform duration-300 hover:scale-110" />
                <span className="font-medium">Export</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Professional Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card className="bg-white hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 border-l-4 border-l-blue-500">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm font-medium text-blue-600">Total Staff</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{staff.length}</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 border-l-4 border-l-green-500">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm font-medium text-green-600">Present Today</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.present}</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 border-l-4 border-l-red-500">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm font-medium text-red-600">Absent Today</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.absent}</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <UserX className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 border-l-4 border-l-orange-500">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm font-medium text-orange-600">Late Today</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.late}</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Timer className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white/80 backdrop-blur-sm border border-blue-200/50 rounded-xl p-6 shadow-lg">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search staff by name, ID, or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 border-blue-200 focus:border-blue-400 focus:ring-blue-400 bg-white/90 backdrop-blur-sm transition-all duration-300"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="bg-white/80 backdrop-blur-sm border border-blue-200/50 rounded-xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-200/50">
            <h2 className="text-xl font-semibold text-blue-800">
              Staff Attendance for {format(selectedDate, 'EEEE, MMMM dd, yyyy')}
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80 hover:bg-gray-50">
                  <TableHead className="text-center font-semibold text-gray-700">S No</TableHead>
                  <TableHead className="text-center font-semibold text-gray-700">Profile</TableHead>
                  <TableHead className="text-center font-semibold text-gray-700">Staff ID</TableHead>
                  <TableHead className="text-center font-semibold text-gray-700">Staff Name</TableHead>
                  <TableHead className="text-center font-semibold text-gray-700">Role</TableHead>
                  <TableHead className="text-center font-semibold text-gray-700">Status</TableHead>
                  <TableHead className="text-center font-semibold text-gray-700">Check In</TableHead>
                  <TableHead className="text-center font-semibold text-gray-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentStaff.length > 0 ? (
                  currentStaff.map((member, idx) => {
                    const attendance = getAttendanceForDate(member.id, selectedDate);
                    return (
                      <TableRow key={member.id} className="hover:bg-blue-50/50 transition-colors duration-200">
                        <TableCell className="text-center font-medium text-gray-700">{startIndex + idx + 1}</TableCell>
                        <TableCell className="text-center">
                          {member.photo ? (
                            <img
                              src={member.photo}
                              alt={member.name || 'Profile'}
                              className="w-10 h-10 rounded-full object-cover mx-auto border-2 border-blue-200 shadow-sm"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mx-auto text-white font-semibold shadow-sm">
                              {member.name ? member.name.charAt(0).toUpperCase() : 'N'}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center font-medium text-blue-700">{member.id}</TableCell>
                        <TableCell className="text-center font-medium text-gray-700">{member.name}</TableCell>
                        <TableCell className="text-center text-gray-600">{member.role}</TableCell>
                        <TableCell className="text-center">
                          {attendance ? (
                            getStatusBadge(attendance.status)
                          ) : (
                            <Badge className="bg-gray-100 text-gray-600 border border-gray-300">
                              <ClockIcon className="w-3 h-3 mr-1" />
                              Not Updated
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center font-mono text-sm text-gray-600">
                          {attendance?.check_in || '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-wrap justify-center gap-1">
                            <Button
                              size="sm"
                              onClick={() => markAttendance(member.id, member.name, 'Present')}
                              className={cn(
                                "h-8 px-3 text-xs font-medium transition-all duration-200 shadow-sm",
                                attendance?.status === 'Present' 
                                  ? "bg-green-600 hover:bg-green-700 text-white shadow-green-200" 
                                  : "bg-green-50 border border-green-200 text-green-700 hover:bg-green-600 hover:text-white hover:border-green-600"
                              )}
                              disabled={markingAttendance === member.id || loading}
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Present
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => markAttendance(member.id, member.name, 'Late')}
                              className={cn(
                                "h-8 px-3 text-xs font-medium transition-all duration-200 shadow-sm",
                                attendance?.status === 'Late'
                                  ? "bg-orange-600 hover:bg-orange-700 text-white shadow-orange-200"
                                  : "bg-orange-50 border border-orange-200 text-orange-700 hover:bg-orange-600 hover:text-white hover:border-orange-600"
                              )}
                              disabled={markingAttendance === member.id || loading}
                            >
                              <Timer className="w-3 h-3 mr-1" />
                              Late
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => markAttendance(member.id, member.name, 'Absent')}
                              className={cn(
                                "h-8 px-3 text-xs font-medium transition-all duration-200 shadow-sm",
                                attendance?.status === 'Absent'
                                  ? "bg-red-600 hover:bg-red-700 text-white shadow-red-200"
                                  : "bg-red-50 border border-red-200 text-red-700 hover:bg-red-600 hover:text-white hover:border-red-600"
                              )}
                              disabled={markingAttendance === member.id || loading}
                            >
                              <UserX className="w-3 h-3 mr-1" />
                              Absent
                            </Button>
                            {attendance && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  const dateString = format(selectedDate, 'yyyy-MM-dd');
                                  const attendanceRecord = attendanceRecords.find(record => 
                                    record.staff_id === member.id && record.date === dateString
                                  );
                                  
                                  if (attendanceRecord && attendanceRecord.id) {
                                    setAttendanceRecords(prev => 
                                      prev.filter(record => record.id !== attendanceRecord.id)
                                    );

                                    toast({
                                      title: "Attendance Reset",
                                      description: `${member.name}'s attendance has been reset`,
                                    });

                                    DatabaseService.deleteStaffAttendance(attendanceRecord.id).catch(error => {
                                      console.error('Error resetting attendance:', error);
                                      setAttendanceRecords(prev => [...prev, attendanceRecord]);
                                      toast({
                                        title: "Error",
                                        description: "Failed to reset attendance",
                                        variant: "destructive",
                                      });
                                    });
                                  }
                                }}
                                className="h-8 px-3 text-xs font-medium bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-600 hover:text-white hover:border-gray-600 transition-all duration-200 shadow-sm"
                                disabled={markingAttendance === member.id || loading}
                              >
                                <RotateCcw className="w-3 h-3 mr-1" />
                                Reset
                              </Button>
                            )}
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
                          <p className="text-gray-500">
                            {loading ? (
                              <div className="flex items-center justify-center space-x-2">
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                <span>Loading staff data...</span>
                              </div>
                            ) : (
                              "No staff match your search criteria or no staff have been added yet."
                            )}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-gray-50/80 px-6 py-4 border-t border-gray-200/50">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <p className="text-sm text-gray-600">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredStaff.length)} of {filteredStaff.length} staff
                </p>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="border-blue-200 text-blue-600 hover:bg-blue-50"
                  >
                    Previous
                  </Button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNumber = i + Math.max(1, currentPage - 2);
                    if (pageNumber > totalPages) return null;
                    return (
                      <Button
                        key={pageNumber}
                        variant={currentPage === pageNumber ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNumber)}
                        className={cn(
                          "w-10 h-8",
                          currentPage === pageNumber 
                            ? "bg-blue-600 text-white hover:bg-blue-700" 
                            : "border-blue-200 text-blue-600 hover:bg-blue-50"
                        )}
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="border-blue-200 text-blue-600 hover:bg-blue-50"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceManagement;