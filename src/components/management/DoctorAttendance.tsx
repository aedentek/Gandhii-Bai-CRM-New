import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { CalendarIcon, Search, Users, Download, CheckCircle, XCircle, Clock, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { DatabaseService } from '@/services/databaseService';

interface DoctorAttendance {
  id: number;
  doctor_id: string;
  doctor_name: string;
  date: string;
  check_in: string;
  check_out?: string;
  status: 'Present' | 'Absent' | 'Late' | 'Half Day';
  working_hours?: string;
}

const DoctorAttendance: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [downloadMonth, setDownloadMonth] = useState<Date>(new Date());
  const [doctors, setDoctors] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<DoctorAttendance[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredDoctors, setFilteredDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Set initial page when component mounts
  useEffect(() => {
    setCurrentPage(1);
  }, []);

  useEffect(() => {
    loadDoctors();
    loadAttendanceRecords();
  }, [selectedDate]);

  useEffect(() => {
    filterDoctors();
  }, [doctors, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, doctors]);

  // Ensure we stay on first page when data changes
  useEffect(() => {
    if (filteredDoctors.length > 0) {
      setCurrentPage(1);
    }
  }, [filteredDoctors.length]);

  const filterDoctors = () => {
    let filtered = doctors;
    if (searchTerm) {
      filtered = doctors.filter(doctor =>
        doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doctor.role && doctor.role.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Sort doctors by ID in ascending order
    filtered.sort((a, b) => {
      const getNum = (id: string) => {
        if (!id) return 0;
        const match = id.match(/DOC(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      };
      return getNum(a.id) - getNum(b.id);
    });
    
    setFilteredDoctors(filtered);
  };

  const loadDoctors = async () => {
    try {
      const data = await DatabaseService.getAllDoctors();
      setDoctors(data);
      setCurrentPage(1); // Ensure we start from the first page
    } catch (error) {
      console.error('Error loading doctors:', error);
      toast({
        title: "Error",
        description: "Failed to load doctors",
        variant: "destructive",
      });
    }
  };

  const loadAttendanceRecords = async () => {
    try {
      setLoading(true);
      // Load all attendance records and filter on client side for better reliability
      const data = await DatabaseService.getAllDoctorAttendance();
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

  const resetAttendance = async (doctorId: string, doctorName: string) => {
    try {
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      
      // Find the attendance record to delete
      const attendanceRecord = attendanceRecords.find(record => 
        record.doctor_id === doctorId && format(new Date(record.date), 'yyyy-MM-dd') === dateString
      );
      
      if (attendanceRecord && attendanceRecord.id) {
        await DatabaseService.deleteDoctorAttendance(attendanceRecord.id);
        
        // Update the local attendance records by filtering out the reset record
        setAttendanceRecords(prev => 
          prev.filter(record => record.id !== attendanceRecord.id)
        );

        toast({
          title: "Attendance Reset",
          description: `${doctorName}'s attendance has been reset`,
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

  const markAttendance = async (doctorId: string, doctorName: string, status: 'Present' | 'Absent' | 'Late') => {
    try {
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      const checkIn = status !== 'Absent' ? format(new Date(), 'HH:mm:ss') : '';
      
      await DatabaseService.markDoctorAttendance({
        doctor_id: doctorId,
        doctor_name: doctorName,
        date: dateString,
        check_in: checkIn,
        status
      });

      await loadAttendanceRecords();
      toast({
        title: "Attendance Marked",
        description: `${doctorName} marked as ${status}`,
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

  const getAttendanceForDate = (doctorId: string, date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const record = attendanceRecords.find(
      record => {
        // Convert database date to yyyy-MM-dd format for comparison
        const recordDate = record.date ? format(new Date(record.date), 'yyyy-MM-dd') : '';
        return record.doctor_id === doctorId && recordDate === dateString;
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
    const currentMonth = format(downloadMonth, 'yyyy-MM');
    const year = downloadMonth.getFullYear();
    const month = downloadMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dateColumns = Array.from({ length: daysInMonth }, (_, i) => {
      const d = new Date(year, month, i + 1);
      return format(d, 'yyyy-MM-dd');
    });
    const doctorMap = doctors.reduce((acc, d) => {
      acc[d.id] = d.name;
      return acc;
    }, {} as Record<string, string>);
    const doctorIds = Array.from(new Set([
      ...doctors.map(d => d.id),
      ...attendanceRecords.filter(r => {
        const recordDate = new Date(r.date);
        return recordDate.getMonth() === month && recordDate.getFullYear() === year;
      }).map(r => r.doctor_id)
    ]));
    const rows = doctorIds.map((did, idx) => {
      const row: Record<string, string | number> = {
        'S NO': idx + 1,
        'Doctor ID': did,
        'Doctor Name': doctorMap[did] || ''
      };
      dateColumns.forEach(dateStr => {
        const rec = attendanceRecords.find(r => {
          const recordDate = format(new Date(r.date), 'yyyy-MM-dd');
          return r.doctor_id === did && recordDate === dateStr;
        });
        row[format(new Date(dateStr), 'dd/MM')] = rec ? rec.status : '-';
      });
      return row;
    });
    const header = ['S NO', 'Doctor ID', 'Doctor Name', ...dateColumns.map(d => format(new Date(d), 'dd/MM'))];
    const csvRows = [header.join(',')];
    rows.forEach(row => {
      csvRows.push(header.map(h => row[h] ?? '').join(','));
    });
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `doctor-attendance-${currentMonth}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast({
      title: "Export Successful",
      description: `Doctor attendance for ${format(downloadMonth, 'MMMM yyyy')} exported to CSV file`,
    });
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredDoctors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDoctors = filteredDoctors.slice(startIndex, endIndex);

  const getAttendanceStats = () => {
    if (doctors.length === 0) {
      return { total: 0, present: 0, absent: 0, late: 0 };
    }
    const dateString = format(selectedDate, 'yyyy-MM-dd');
    
    // Count all doctors and their attendance status
    let present = 0, absent = 0, late = 0;
    
    doctors.forEach(doctor => {
      const attendance = attendanceRecords.find(record => {
        const recordDate = record.date ? format(new Date(record.date), 'yyyy-MM-dd') : '';
        return record.doctor_id === doctor.id && recordDate === dateString;
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
      total: doctors.length,
      present,
      absent,
      late
    };
  };

  const stats = getAttendanceStats();

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-primary rounded-lg">
            <Users className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Doctor Attendance</h1>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="shadow-card">
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total Doctors</div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-success">{stats.present}</div>
                <div className="text-sm text-muted-foreground">Present</div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-destructive">{stats.absent}</div>
                <div className="text-sm text-muted-foreground">Absent</div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-warning">{stats.late}</div>
                <div className="text-sm text-muted-foreground">Late</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Date Selection and Controls */}
      <Card className="mb-6 shadow-card">
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
                    placeholder="Search doctors..."
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

              <div className="flex space-x-2">
                <Button variant="outline" onClick={exportAttendance}>
                  <Download className="w-4 h-4 mr-2" />
                  Monthly CSV
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>
            Doctor Attendance for {format(selectedDate, 'EEEE, MMMM dd, yyyy')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">S No</TableHead>
                <TableHead className="text-center">Profile Photo</TableHead>
                <TableHead className="text-center">Doctor ID</TableHead>
                <TableHead className="text-center">Doctor Name</TableHead>
                <TableHead className="text-center">Role</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Check In</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentDoctors.length > 0 ? (
                currentDoctors.map((doctor, idx) => {
                  const attendance = getAttendanceForDate(doctor.id, selectedDate);
                  return (
                    <TableRow key={doctor.id} className="hover:bg-muted/50">
                      <TableCell className="text-center font-medium">{startIndex + idx + 1}</TableCell>
                      <TableCell className="text-center">
                        {doctor.photo ? (
                          <img
                            src={doctor.photo}
                            alt={doctor.name || 'Profile'}
                            className="w-8 h-8 rounded-full object-cover mx-auto"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mx-auto text-xs text-muted-foreground">
                            N/A
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center font-medium">{doctor.id}</TableCell>
                      <TableCell className="text-center">{doctor.name}</TableCell>
                      <TableCell className="text-center">{doctor.role}</TableCell>
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
                            onClick={() => markAttendance(doctor.id, doctor.name, 'Present')}
                            variant={attendance?.status === 'Present' ? "default" : "outline"}
                            className={attendance?.status === 'Present' 
                              ? "bg-green-600 hover:bg-green-700 text-white px-2" 
                              : "border-green-600 text-green-600 hover:bg-green-600 hover:text-white px-2"
                            }
                            title="Present"
                          >
                            P
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => markAttendance(doctor.id, doctor.name, 'Late')}
                            variant={attendance?.status === 'Late' ? "default" : "outline"}
                            className={attendance?.status === 'Late'
                              ? "bg-yellow-600 hover:bg-yellow-700 text-white px-2"
                              : "border-yellow-600 text-yellow-600 hover:bg-yellow-600 hover:text-white px-2"
                            }
                            title="Late"
                          >
                            L
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => markAttendance(doctor.id, doctor.name, 'Absent')}
                            variant={attendance?.status === 'Absent' ? "default" : "outline"}
                            className={attendance?.status === 'Absent'
                              ? "bg-red-600 hover:bg-red-700 text-white px-2"
                              : "border-red-600 text-red-600 hover:bg-red-600 hover:text-white px-2"
                            }
                            title="Absent"
                          >
                            A
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => resetAttendance(doctor.id, doctor.name)}
                            variant="outline"
                            className="border-gray-600 text-gray-600 hover:bg-gray-600 hover:text-white px-2"
                            title="Reset Attendance"
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
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No doctors found. Please add doctors first.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredDoctors.length)} of {filteredDoctors.length} doctors
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
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
                      "w-8",
                      currentPage === pageNumber && "bg-primary text-primary-foreground"
                    )}
                  >
                    {pageNumber}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
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
  );
};

export default DoctorAttendance;
