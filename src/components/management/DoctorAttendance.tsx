// --- Doctor Attendance with PatientAttendance Design Pattern ---
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { CalendarIcon, Search, Users, Download, CheckCircle, XCircle, Clock, RotateCcw, Trash2, UserCheck, UserX, Timer, ClockIcon, Activity, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { DatabaseService } from '@/services/databaseService';
import LoadingScreen from '@/components/shared/LoadingScreen';

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

const getStatusBadge = (status: string) => {
  const variants: any = {
    Present: 'bg-green-100 text-green-700 border border-green-200',
    Absent: 'bg-red-100 text-red-700 border border-red-200',
    Late: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    'Half Day': 'bg-blue-100 text-blue-700 border border-blue-200',
  };
  return variants[status] || 'bg-gray-100 text-gray-600 border border-gray-200';
};

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
  const [deleteAttendance, setDeleteAttendance] = useState<DoctorAttendance | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
  }, []);

  useEffect(() => {
    loadDoctors();
    loadAttendanceRecords();
  }, []);

  useEffect(() => {
    const filtered = doctors.filter((doctor) =>
      doctor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredDoctors(filtered);
    setCurrentPage(1);
  }, [doctors, searchTerm]);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      const data = await DatabaseService.getAllDoctors();
      setDoctors(data);
    } catch (error) {
      console.error('Error loading doctors:', error);
      toast({
        title: "Error",
        description: "Failed to load doctors",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceRecords = async () => {
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const records = await DatabaseService.getAllDoctorAttendance();
      const filteredRecords = records.filter((record: any) => record.date === dateStr);
      setAttendanceRecords(filteredRecords);
    } catch (error) {
      console.error('Error loading attendance records:', error);
    }
  };

  const getAttendanceForDate = (doctorId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return attendanceRecords.find(
      (record) => record.doctor_id === doctorId && record.date === dateStr
    );
  };

  const markAttendance = async (doctorId: string, doctorName: string, status: 'Present' | 'Absent' | 'Late' | 'Half Day') => {
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const timeStr = format(new Date(), 'HH:mm:ss');
      
      await DatabaseService.markDoctorAttendance({
        doctor_id: doctorId,
        doctor_name: doctorName,
        date: dateStr,
        check_in: timeStr,
        status: status,
      });

      await loadAttendanceRecords();
      toast({
        title: "Success",
        description: `Attendance marked as ${status} for ${doctorName}`,
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

  const resetAttendance = async (doctorId: string, doctorName: string) => {
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      // Find the attendance record to delete
      const recordToDelete = attendanceRecords.find(
        record => record.doctor_id === doctorId && record.date === dateStr
      );
      
      if (recordToDelete) {
        await DatabaseService.deleteDoctorAttendance(recordToDelete.id);
      }
      
      await loadAttendanceRecords();
      toast({
        title: "Success",
        description: `Attendance reset for ${doctorName}`,
      });
    } catch (error) {
      console.error('Error resetting attendance:', error);
      toast({
        title: "Error",
        description: "Failed to reset attendance",
        variant: "destructive",
      });
    }
  };

  const downloadMonthlyReport = () => {
    const monthStart = new Date(downloadMonth.getFullYear(), downloadMonth.getMonth(), 1);
    const monthEnd = new Date(downloadMonth.getFullYear(), downloadMonth.getMonth() + 1, 0);
    
    const reportData = [];
    for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
      const dateStr = format(d, 'yyyy-MM-dd');
      doctors.forEach(doctor => {
        const attendance = attendanceRecords.find(
          record => record.doctor_id === doctor.id && record.date === dateStr
        );
        reportData.push({
          Date: format(d, 'dd/MM/yyyy'),
          'Doctor ID': doctor.id,
          'Doctor Name': doctor.name,
          Status: attendance?.status || 'Not Marked',
          'Check In': attendance?.check_in || '-',
          'Check Out': attendance?.check_out || '-',
        });
      });
    }

    const ws = XLSX.utils.json_to_sheet(reportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Doctor Attendance');
    XLSX.writeFile(wb, `doctor-attendance-${format(downloadMonth, 'yyyy-MM')}.xlsx`);
  };

  const totalPages = Math.ceil(filteredDoctors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDoctors = filteredDoctors.slice(startIndex, endIndex);

  const stats = {
    present: attendanceRecords.filter(r => r.status === 'Present').length,
    absent: attendanceRecords.filter(r => r.status === 'Absent').length,
    late: attendanceRecords.filter(r => r.status === 'Late').length,
    total: filteredDoctors.length,
  };

  if (loading) {
    return <LoadingScreen message="Loading doctor attendance data..." />;
  }

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
                <h1 className="text-2xl font-semibold text-gray-900 transition-colors duration-300 hover:text-blue-600">Doctor Attendance</h1>
                <p className="text-sm text-gray-600 mt-1">Track and manage doctor attendance records</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button 
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                  loadDoctors();
                  loadAttendanceRecords();
                }}
                disabled={loading}
                variant="outline"
                className="flex items-center space-x-2 hover:scale-105 transition-all duration-300 hover:shadow-md border-blue-300 hover:border-blue-500 hover:bg-blue-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''} transition-transform duration-300 hover:rotate-180 text-blue-600`} />
                <span className="font-medium">Refresh</span>
              </Button>
              
              <Button 
                onClick={downloadMonthlyReport}
                variant="outline"
                className="flex items-center space-x-2 hover:scale-105 transition-all duration-300 hover:shadow-md border-green-300 hover:border-green-500 hover:bg-green-50"
              >
                <Download className="h-4 w-4 transition-transform duration-300 hover:scale-110 text-green-600" />
                <span className="font-medium">Export</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Professional Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-green-500"></div>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors duration-300">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Present Today</p>
                  <p className="text-2xl font-bold text-gray-900 group-hover:text-green-600 transition-colors duration-300">{stats.present}</p>
                </div>
              </div>
              <div className="mt-4 h-1 bg-green-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-red-500"></div>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors duration-300">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Absent Today</p>
                  <p className="text-2xl font-bold text-gray-900 group-hover:text-red-600 transition-colors duration-300">{stats.absent}</p>
                </div>
              </div>
              <div className="mt-4 h-1 bg-red-200 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-yellow-500"></div>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-lg group-hover:bg-yellow-200 transition-colors duration-300">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Late Today</p>
                  <p className="text-2xl font-bold text-gray-900 group-hover:text-yellow-600 transition-colors duration-300">{stats.late}</p>
                </div>
              </div>
              <div className="mt-4 h-1 bg-yellow-200 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-500 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500"></div>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors duration-300">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Total Doctors</p>
                  <p className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">{stats.total}</p>
                </div>
              </div>
              <div className="mt-4 h-1 bg-blue-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Date Selection */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search doctors by name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto border-gray-300 hover:border-blue-500 hover:bg-blue-50">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedDate, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        setSelectedDate(date);
                        loadAttendanceRecords();
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Attendance Table */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-100 p-6">
            <CardTitle className="text-xl font-semibold text-gray-900">
              Attendance for {format(selectedDate, 'EEEE, MMMM dd, yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-center font-semibold text-gray-900 py-4 px-6">S.No</TableHead>
                    <TableHead className="text-left font-semibold text-gray-900 py-4 px-6">Doctor</TableHead>
                    <TableHead className="text-center font-semibold text-gray-900 py-4 px-6">Status</TableHead>
                    <TableHead className="text-center font-semibold text-gray-900 py-4 px-6">Check In</TableHead>
                    <TableHead className="text-center font-semibold text-gray-900 py-4 px-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentDoctors.length > 0 ? (
                    currentDoctors.map((doctor, idx) => {
                      const attendance = getAttendanceForDate(doctor.id, selectedDate);
                      return (
                        <TableRow key={doctor.id} className="hover:bg-gray-50 transition-colors duration-200">
                          <TableCell className="text-center font-medium text-gray-700 py-4 px-6">{startIndex + idx + 1}</TableCell>
                          <TableCell className="py-4 px-6">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-semibold text-blue-600">
                                  {doctor.name?.charAt(0)?.toUpperCase() || 'D'}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{doctor.name}</div>
                                <div className="text-sm text-gray-500">{doctor.id}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center py-4 px-6">
                            {attendance ? (
                              <Badge className={getStatusBadge(attendance.status)}>
                                {attendance.status}
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Not Marked</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center py-4 px-6">
                            <span className="text-sm text-gray-600">
                              {attendance?.check_in || '-'}
                            </span>
                          </TableCell>
                          <TableCell className="text-center py-4 px-6">
                            <div className="flex items-center justify-center space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => markAttendance(doctor.id, doctor.name, 'Present')}
                                className="h-8 w-8 p-0 border-green-300 hover:border-green-500 hover:bg-green-50 hover:scale-105 transition-all duration-300"
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => markAttendance(doctor.id, doctor.name, 'Late')}
                                className="h-8 w-8 p-0 border-yellow-300 hover:border-yellow-500 hover:bg-yellow-50 hover:scale-105 transition-all duration-300"
                              >
                                <Clock className="h-4 w-4 text-yellow-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => markAttendance(doctor.id, doctor.name, 'Absent')}
                                className="h-8 w-8 p-0 border-red-300 hover:border-red-500 hover:bg-red-50 hover:scale-105 transition-all duration-300"
                              >
                                <XCircle className="h-4 w-4 text-red-600" />
                              </Button>
                              {attendance && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => resetAttendance(doctor.id, doctor.name)}
                                  className="h-8 w-8 p-0 border-gray-300 hover:border-gray-500 hover:bg-gray-50 hover:scale-105 transition-all duration-300"
                                >
                                  <RotateCcw className="h-4 w-4 text-gray-600" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12">
                        <div className="flex flex-col items-center justify-center space-y-4">
                          <div className="p-4 bg-gray-100 rounded-full">
                            <Users className="h-8 w-8 text-gray-400" />
                          </div>
                          <div className="text-center">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No doctors found</h3>
                            <p className="text-gray-500">No doctors match your search criteria.</p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-700">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredDoctors.length)} of {filteredDoctors.length} doctors
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorAttendance;
