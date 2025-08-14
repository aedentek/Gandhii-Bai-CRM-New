// Enhanced Patient Attendance with PatientAttendance Design + Full CRUD + Tracking System
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { 
  Search, UserCheck, Clock, Calendar, Filter, RefreshCw, Download, 
  Plus, Eye, Edit2, Trash2, CheckCircle, XCircle, Calendar as CalendarIcon,
  Users, Activity, TrendingUp, CalendarDays, MapPin, Phone, Clock3
} from 'lucide-react';
import { format, parseISO, isSameDay, startOfMonth, endOfMonth } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { PatientService } from '@/services/patientService';
import { DatabaseService } from '@/services/databaseService';
import LoadingScreen from '@/components/shared/LoadingScreen';
import * as XLSX from 'xlsx';

interface AttendanceRecord {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_phone: string;
  patient_image?: string;
  attendance_date: string;
  check_in_time: string;
  check_out_time?: string;
  status: 'Present' | 'Absent' | 'Late';
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface NewAttendance {
  patient_id: string;
  attendance_date: string;
  check_in_time: string;
  check_out_time?: string;
  status: 'Present' | 'Absent' | 'Late';
  notes?: string;
}

const PatientAttendance: React.FC = () => {
  const navigate = useNavigate();

  // Helper function to get status badge styling (similar to DoctorAttendance)
  const getStatusBadge = (status: string) => {
    const variants: any = {
      Present: 'bg-green-100 text-green-700 border border-green-200',
      Absent: 'bg-red-100 text-red-700 border border-red-200',
      Late: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    };
    return variants[status] || 'bg-gray-100 text-gray-600 border border-gray-200';
  };

  // Get attendance status for today
  const getTodayAttendance = (patientId: string) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return attendanceRecords.find(record => 
      record && record.patient_id === patientId && record.attendance_date === today
    );
  };
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');  // Remove default date filter
  const [viewMode, setViewMode] = useState<'patients' | 'attendance'>('patients'); // New view mode
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<AttendanceRecord | null>(null);

  const itemsPerPage = 10;

  // New attendance form
  const [newAttendance, setNewAttendance] = useState<NewAttendance>({
    patient_id: '',
    attendance_date: format(new Date(), 'yyyy-MM-dd'),
    check_in_time: format(new Date(), 'HH:mm'),
    check_out_time: '',
    status: 'Present',
    notes: ''
  });

  // Stats for header cards
  const [stats, setStats] = useState({
    totalToday: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (viewMode === 'patients') {
      filterPatients();
    } else {
      filterRecords();
    }
  }, [attendanceRecords, patients, searchTerm, statusFilter, dateFilter, viewMode]);

  const filterPatients = () => {
    let filtered = patients.filter(patient => {
      if (!patient) return false;
      
      const matchesSearch = 
        (patient.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (patient.id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (patient.phone || '').includes(searchTerm);

      const isActive = patient.status === 'Active';
      
      return matchesSearch && isActive;
    });

    setFilteredPatients(filtered);
    setCurrentPage(1);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Loading patient attendance data...');
      
      const [recordsData, patientsData] = await Promise.all([
        DatabaseService.getAllPatientAttendance(),
        PatientService.getAllPatientsWithMedia()
      ]);

      console.log('📊 Patient data loaded:', patientsData.length, 'patients');
      console.log('📊 Sample patient photo data:', patientsData.slice(0, 2).map(p => ({
        name: p.name,
        photo: p.photo,
        photoUrl: p.photoUrl,
        hasPhoto: p.hasPhoto
      })));
      
      console.log('Records data:', recordsData);
      console.log('Patients data:', patientsData);
      console.log('Sample patient data:', patientsData[0]); // Debug patient structure

      // Ensure recordsData is an array
      const safeRecordsData = Array.isArray(recordsData) ? recordsData : [];
      const safePatientsData = Array.isArray(patientsData) ? patientsData : [];

      setAttendanceRecords(safeRecordsData);
      setPatients(safePatientsData);
      
      // Calculate today's stats
      const today = format(new Date(), 'yyyy-MM-dd');
      const todayRecords = safeRecordsData.filter((record: AttendanceRecord) => 
        record && record.attendance_date === today
      );
      
      setStats({
        totalToday: todayRecords.length,
        presentToday: todayRecords.filter((r: AttendanceRecord) => r && r.status === 'Present').length,
        absentToday: todayRecords.filter((r: AttendanceRecord) => r && r.status === 'Absent').length,
        lateToday: todayRecords.filter((r: AttendanceRecord) => r && r.status === 'Late').length
      });
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load attendance data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterRecords = () => {
    let filtered = attendanceRecords.filter(record => {
      // Add null/undefined checks
      if (!record) return false;
      
      const matchesSearch = 
        (record.patient_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (record.patient_id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (record.patient_phone || '').includes(searchTerm);

      const matchesStatus = statusFilter === 'All' || record.status === statusFilter;
      const matchesDate = !dateFilter || record.attendance_date === dateFilter;

      return matchesSearch && matchesStatus && matchesDate;
    });

    setFilteredRecords(filtered);
    setCurrentPage(1);
  };

  const handleAddAttendance = async () => {
    try {
      if (!newAttendance.patient_id || !newAttendance.attendance_date) {
        toast({
          title: "Error",
          description: "Please select patient and date",
          variant: "destructive",
        });
        return;
      }

      // Get patient name
      const selectedPatient = patients.find(p => p.id === newAttendance.patient_id);
      if (!selectedPatient) {
        toast({
          title: "Error",
          description: "Selected patient not found",
          variant: "destructive",
        });
        return;
      }

      await DatabaseService.addPatientAttendance({
        patientId: newAttendance.patient_id,
        patientName: selectedPatient.name,
        date: newAttendance.attendance_date,
        status: newAttendance.status,
        checkInTime: newAttendance.check_in_time,
        notes: newAttendance.notes
      });
      toast({
        title: "Success",
        description: "Attendance record added successfully",
      });
      
      setShowAddModal(false);
      setNewAttendance({
        patient_id: '',
        attendance_date: format(new Date(), 'yyyy-MM-dd'),
        check_in_time: format(new Date(), 'HH:mm'),
        check_out_time: '',
        status: 'Present',
        notes: ''
      });
      loadData();
    } catch (error) {
      console.error('Error adding attendance:', error);
      toast({
        title: "Error",
        description: "Failed to add attendance record",
        variant: "destructive",
      });
    }
  };

  const handleEditAttendance = async () => {
    try {
      if (!selectedRecord) return;

      await DatabaseService.updatePatientAttendance(selectedRecord.id, {
        checkInTime: selectedRecord.check_in_time,
        status: selectedRecord.status,
        notes: selectedRecord.notes
      });

      toast({
        title: "Success",
        description: "Attendance record updated successfully",
      });
      
      setShowEditModal(false);
      setSelectedRecord(null);
      loadData();
    } catch (error) {
      console.error('Error updating attendance:', error);
      toast({
        title: "Error",
        description: "Failed to update attendance record",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAttendance = async () => {
    try {
      if (!deleteRecord) return;

      await DatabaseService.deletePatientAttendance(deleteRecord.patient_id, deleteRecord.attendance_date);
      toast({
        title: "Success",
        description: "Attendance record deleted successfully",
      });
      
      setShowDeleteModal(false);
      setDeleteRecord(null);
      loadData();
    } catch (error) {
      console.error('Error deleting attendance:', error);
      toast({
        title: "Error",
        description: "Failed to delete attendance record",
        variant: "destructive",
      });
    }
  };

  const exportToExcel = () => {
    const exportData = filteredRecords.map((record, index) => ({
      'S.No': index + 1,
      'Patient ID': record.patient_id,
      'Patient Name': record.patient_name,
      'Phone': record.patient_phone,
      'Date': record.attendance_date,
      'Check In': record.check_in_time,
      'Check Out': record.check_out_time || 'N/A',
      'Status': record.status,
      'Notes': record.notes || 'N/A',
      'Created': format(parseISO(record.created_at), 'dd/MM/yyyy HH:mm')
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
    XLSX.writeFile(wb, `patient-attendance-${dateFilter || 'all'}.xlsx`);

    toast({
      title: "Success",
      description: "Attendance records exported successfully",
    });
  };

  const markQuickAttendance = async (patientId: string, status: 'Present' | 'Absent' | 'Late') => {
    try {
      // Get patient name
      const selectedPatient = patients.find(p => p.id === patientId);
      if (!selectedPatient) {
        toast({
          title: "Error",
          description: "Selected patient not found",
          variant: "destructive",
        });
        return;
      }

      await DatabaseService.addPatientAttendance({
        patientId: patientId,
        patientName: selectedPatient.name,
        date: format(new Date(), 'yyyy-MM-dd'),
        checkInTime: format(new Date(), 'HH:mm'),
        status,
        notes: `Quick ${status} mark`
      });
      toast({
        title: "Success",
        description: `Patient marked as ${status}`,
      });
      loadData();
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast({
        title: "Error",
        description: "Failed to mark attendance",
        variant: "destructive",
      });
    }
  };

  // Pagination
  const currentData = viewMode === 'patients' ? filteredPatients : filteredRecords;
  const totalPages = Math.ceil(currentData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRecords = viewMode === 'patients' ? 
    filteredPatients.slice(startIndex, endIndex) : 
    filteredRecords.slice(startIndex, endIndex);

  if (loading) {
    return <LoadingScreen message="Loading attendance records..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Professional Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 hover:shadow-md hover:scale-[1.01] transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center transition-all duration-300 hover:bg-green-700 hover:scale-110">
                <UserCheck className="w-6 h-6 text-white transition-transform duration-300 hover:rotate-3" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 transition-colors duration-300 hover:text-green-600">Patient Attendance</h1>
                <p className="text-sm text-gray-600 mt-1"></p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                <Button
                  size="sm"
                  variant={viewMode === 'patients' ? 'default' : 'ghost'}
                  onClick={() => setViewMode('patients')}
                  className={`transition-all duration-200 ${viewMode === 'patients' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                >
                  Patients ({filteredPatients.length})
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'attendance' ? 'default' : 'ghost'}
                  onClick={() => setViewMode('attendance')}
                  className={`transition-all duration-200 ${viewMode === 'attendance' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                >
                  Attendance ({filteredRecords.length})
                </Button>
              </div>
              
              <Button 
                onClick={loadData}
                disabled={loading}
                variant="outline"
                className="flex items-center space-x-2 hover:scale-105 transition-all duration-300 hover:shadow-md border-green-300 hover:border-green-500 hover:bg-green-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''} transition-transform duration-300 hover:rotate-180 text-green-600`} />
                <span className="font-medium">Refresh</span>
              </Button>
              
              <Button 
                onClick={exportToExcel}
                variant="outline"
                className="flex items-center space-x-2 hover:scale-105 transition-all duration-300 hover:shadow-md border-blue-300 hover:border-blue-500 hover:bg-blue-50"
              >
                <Download className="h-4 w-4 transition-transform duration-300 hover:scale-110 text-blue-600" />
                <span className="font-medium">Export</span>
              </Button>
              
              <Button 
                onClick={() => setShowAddModal(true)}
                className="flex items-center space-x-2 hover:scale-105 transition-all duration-300 hover:shadow-md bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="h-4 w-4 transition-transform duration-300 hover:scale-110" />
                <span className="font-medium">Mark Attendance</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Professional Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500"></div>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors duration-300">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Total Today</p>
                  <p className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">{stats.totalToday}</p>
                </div>
              </div>
              <div className="mt-4 h-1 bg-blue-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-green-500"></div>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors duration-300">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Present Today</p>
                  <p className="text-2xl font-bold text-gray-900 group-hover:text-green-600 transition-colors duration-300">{stats.presentToday}</p>
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
                  <p className="text-2xl font-bold text-gray-900 group-hover:text-red-600 transition-colors duration-300">{stats.absentToday}</p>
                </div>
              </div>
              <div className="mt-4 h-1 bg-red-200 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-orange-500"></div>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors duration-300">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Late Today</p>
                  <p className="text-2xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors duration-300">{stats.lateToday}</p>
                </div>
              </div>
              <div className="mt-4 h-1 bg-orange-200 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={viewMode === 'patients' ? "Search by patient name, ID, or phone..." : "Search by patient name, ID, or phone..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-green-500 focus:ring-green-500"
                />
              </div>
            </div>
            {viewMode === 'attendance' && (
              <div className="w-full lg:w-48">
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                />
              </div>
            )}
            {viewMode === 'attendance' && (
              <div className="w-full lg:w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="All">All Status</option>
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="Late">Late</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Attendance Table */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-100 p-6">
            <CardTitle className="text-xl font-semibold text-gray-900">
              {viewMode === 'patients' ? 
                `Active Patients (${currentData.length})` : 
                `Attendance Records (${currentData.length})`
              }
              {viewMode === 'attendance' && dateFilter && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  for {format(parseISO(dateFilter), 'dd/MM/yyyy')}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-center font-semibold text-gray-900 py-4 px-6">S.No</TableHead>
                    <TableHead className="text-center font-semibold text-gray-900 py-4 px-6">Profile</TableHead>
                    <TableHead className="text-center font-semibold text-gray-900 py-4 px-6">Patient Id</TableHead>
                    <TableHead className="text-left font-semibold text-gray-900 py-4 px-6">Name</TableHead>
                    {viewMode === 'patients' && (
                      <>
                        <TableHead className="text-center font-semibold text-gray-900 py-4 px-6">Age</TableHead>
                        <TableHead className="text-center font-semibold text-gray-900 py-4 px-6">Gender</TableHead>
                        <TableHead className="text-center font-semibold text-gray-900 py-4 px-6">Status</TableHead>
                        <TableHead className="text-center font-semibold text-gray-900 py-4 px-6">Timing</TableHead>
                        <TableHead className="text-center font-semibold text-gray-900 py-4 px-6">Actions</TableHead>
                      </>
                    )}
                    {viewMode === 'attendance' && (
                      <>
                        <TableHead className="text-center font-semibold text-gray-900 py-4 px-6">Date</TableHead>
                        <TableHead className="text-center font-semibold text-gray-900 py-4 px-6">Time</TableHead>
                        <TableHead className="text-center font-semibold text-gray-900 py-4 px-6">Status</TableHead>
                        <TableHead className="text-center font-semibold text-gray-900 py-4 px-6">Actions</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentRecords.length > 0 ? (
                    currentRecords.map((record, index) => {
                      // Add safety checks for all record properties
                      if (!record) return null;
                      
                      if (viewMode === 'patients') {
                        // Render patient row
                        return (
                          <TableRow key={record.id || index} className="hover:bg-gray-50 transition-colors duration-200">
                            <TableCell className="text-center font-medium text-gray-700 py-4 px-6">
                              {startIndex + index + 1}
                            </TableCell>
                            <TableCell className="text-center py-4 px-6">
                              <div className="flex items-center justify-center">
                                <div className="flex-shrink-0 relative">
                                  {(record.photo || record.photoUrl) ? (
                                    <>
                                      <img
                                        src={record.photoUrl || record.photo}
                                        alt={record.name || 'Patient'}
                                        className="w-10 h-10 rounded-full object-cover border border-gray-200"
                                        onError={(e) => {
                                          console.log('❌ Image failed to load for patient:', record.name);
                                          console.log('   Photo field:', record.photo);
                                          console.log('   PhotoURL field:', record.photoUrl);
                                          console.log('   Attempted URL:', record.photoUrl || record.photo);
                                          // Hide image and show avatar fallback
                                          const target = e.target as HTMLImageElement;
                                          target.style.display = 'none';
                                          const avatarDiv = target.nextElementSibling as HTMLElement;
                                          if (avatarDiv) avatarDiv.style.display = 'flex';
                                        }}
                                        onLoad={() => {
                                          console.log('✅ Image loaded successfully for patient:', record.name);
                                        }}
                                      />
                                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center border border-green-200" style={{display: 'none'}}>
                                        <span className="text-sm font-semibold text-green-600">
                                          {(record.name || 'P').charAt(0).toUpperCase()}
                                        </span>
                                      </div>
                                    </>
                                  ) : (
                                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center border border-green-200">
                                      <span className="text-sm font-semibold text-green-600">
                                        {(record.name || 'P').charAt(0).toUpperCase()}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center py-4 px-6">
                              <span className="font-medium text-blue-600">{record.id || 'N/A'}</span>
                            </TableCell>
                            <TableCell className="text-left py-4 px-6">
                              <div className="font-medium text-gray-900">{record.name || 'Unknown Patient'}</div>
                            </TableCell>
                            <TableCell className="text-center py-4 px-6">
                              <span className="font-medium text-gray-900">{record.age || 'N/A'}</span>
                            </TableCell>
                            <TableCell className="text-center py-4 px-6">
                              <span className="font-medium text-gray-900">{record.gender || 'N/A'}</span>
                            </TableCell>
                            <TableCell className="text-center py-4 px-6">
                              {(() => {
                                const todayAttendance = getTodayAttendance(record.originalId || record.id);
                                return todayAttendance ? (
                                  <Badge className={getStatusBadge(todayAttendance.status)}>
                                    {todayAttendance.status}
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">Not Marked</Badge>
                                );
                              })()}
                            </TableCell>
                            <TableCell className="text-center py-4 px-6">
                              <div className="flex items-center justify-center">
                                <Clock3 className="w-4 h-4 text-gray-500" />
                                <span className="ml-1 text-sm text-gray-600">09:00 AM</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center py-4 px-6">
                              <div className="flex items-center justify-center space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => markQuickAttendance(record.originalId || record.id, 'Present')}
                                  className="h-8 w-8 p-0 border-green-300 hover:border-green-500 hover:bg-green-50 hover:scale-105 transition-all duration-300"
                                >
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => markQuickAttendance(record.originalId || record.id, 'Late')}
                                  className="h-8 w-8 p-0 border-yellow-300 hover:border-yellow-500 hover:bg-yellow-50 hover:scale-105 transition-all duration-300"
                                >
                                  <Clock className="h-4 w-4 text-yellow-600" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => markQuickAttendance(record.originalId || record.id, 'Absent')}
                                  className="h-8 w-8 p-0 border-red-300 hover:border-red-500 hover:bg-red-50 hover:scale-105 transition-all duration-300"
                                >
                                  <XCircle className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      } else {
                        // Render attendance record row
                        return (
                          <TableRow key={record.id || index} className="hover:bg-gray-50 transition-colors duration-200">
                            <TableCell className="text-center font-medium text-gray-700 py-4 px-6">
                              {startIndex + index + 1}
                            </TableCell>
                            <TableCell className="py-4 px-6">
                              <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0">
                                  {record.patient_image ? (
                                    <img
                                      src={record.patient_image}
                                      alt={record.patient_name || 'Patient'}
                                      className="w-10 h-10 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                      <span className="text-sm font-semibold text-green-600">
                                        {(record.patient_name || 'P').charAt(0).toUpperCase()}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">{record.patient_name || 'Unknown Patient'}</div>
                                  <div className="text-sm text-gray-500 flex items-center space-x-3">
                                    <span className="font-medium text-blue-600">ID: {record.patient_id || 'N/A'}</span>
                                    <div className="flex items-center">
                                      <Phone className="w-3 h-3 mr-1" />
                                      {record.patient_phone || 'No phone'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center py-4 px-6">
                              <div className="flex items-center justify-center">
                                <CalendarIcon className="w-4 h-4 mr-1 text-gray-400" />
                                <span className="font-medium text-gray-900">
                                  {record.attendance_date ? format(parseISO(record.attendance_date), 'dd/MM/yyyy') : 'No date'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center py-4 px-6">
                              <div className="space-y-1">
                                <div className="flex items-center justify-center text-sm text-green-600">
                                  <Clock3 className="w-3 h-3 mr-1" />
                                In: {record.check_in_time || 'Not recorded'}
                              </div>
                              {record.check_out_time && (
                                <div className="flex items-center justify-center text-sm text-red-600">
                                  <Clock3 className="w-3 h-3 mr-1" />
                                  Out: {record.check_out_time}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center py-4 px-6">
                            <Badge 
                              variant={
                                record.status === 'Present' ? 'default' :
                                record.status === 'Late' ? 'secondary' : 'destructive'
                              }
                              className={
                                record.status === 'Present' ? 'bg-green-100 text-green-800 border-green-300' :
                                record.status === 'Late' ? 'bg-orange-100 text-orange-800 border-orange-300' :
                                'bg-red-100 text-red-800 border-red-300'
                              }
                            >
                              {record.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center py-4 px-6">
                            <div className="flex items-center justify-center space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedRecord(record);
                                  setShowEditModal(true);
                                }}
                                className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 hover:border-blue-400 action-btn-edit rounded-lg transition-all duration-300"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setDeleteRecord(record);
                                  setShowDeleteModal(true);
                                }}
                                className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-400 action-btn-delete rounded-lg transition-all duration-300"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        );
                      }
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={viewMode === 'patients' ? 9 : 6} className="text-center py-12">
                        <div className="flex flex-col items-center justify-center space-y-4">
                          <div className="p-4 bg-gray-100 rounded-full">
                            <UserCheck className="h-8 w-8 text-gray-400" />
                          </div>
                          <div className="text-center">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                              {viewMode === 'patients' ? 'No active patients found' : 'No attendance records found'}
                            </h3>
                            <p className="text-gray-500">
                              {viewMode === 'patients' ? 
                                'No active patients match your search criteria.' : 
                                'No attendance records match your search criteria or date filter.'
                              }
                            </p>
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
              Showing {startIndex + 1} to {Math.min(endIndex, currentData.length)} of {currentData.length} records
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

        {/* Add Attendance Modal */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Mark Attendance</DialogTitle>
              <DialogDescription>
                Record patient attendance for today or selected date.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Patient</label>
                <select
                  value={newAttendance.patient_id}
                  onChange={(e) => setNewAttendance({...newAttendance, patient_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select Patient</option>
                  {patients.map(patient => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name} ({patient.id})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <Input
                  type="date"
                  value={newAttendance.attendance_date}
                  onChange={(e) => setNewAttendance({...newAttendance, attendance_date: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Check In</label>
                  <Input
                    type="time"
                    value={newAttendance.check_in_time}
                    onChange={(e) => setNewAttendance({...newAttendance, check_in_time: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Check Out</label>
                  <Input
                    type="time"
                    value={newAttendance.check_out_time}
                    onChange={(e) => setNewAttendance({...newAttendance, check_out_time: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={newAttendance.status}
                  onChange={(e) => setNewAttendance({...newAttendance, status: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="Late">Late</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <Input
                  value={newAttendance.notes}
                  onChange={(e) => setNewAttendance({...newAttendance, notes: e.target.value})}
                  placeholder="Optional notes..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddAttendance}>
                Mark Attendance
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Attendance Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Attendance</DialogTitle>
              <DialogDescription>
                Update attendance record for {selectedRecord?.patient_name}.
              </DialogDescription>
            </DialogHeader>
            {selectedRecord && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Check In</label>
                    <Input
                      type="time"
                      value={selectedRecord.check_in_time}
                      onChange={(e) => setSelectedRecord({
                        ...selectedRecord,
                        check_in_time: e.target.value
                      })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Check Out</label>
                    <Input
                      type="time"
                      value={selectedRecord.check_out_time || ''}
                      onChange={(e) => setSelectedRecord({
                        ...selectedRecord,
                        check_out_time: e.target.value
                      })}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={selectedRecord.status}
                    onChange={(e) => setSelectedRecord({
                      ...selectedRecord,
                      status: e.target.value as any
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="Late">Late</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <Input
                    value={selectedRecord.notes || ''}
                    onChange={(e) => setSelectedRecord({
                      ...selectedRecord,
                      notes: e.target.value
                    })}
                    placeholder="Optional notes..."
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditAttendance}>
                Update Attendance
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this attendance record for "{deleteRecord?.patient_name}" on {deleteRecord?.attendance_date}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteAttendance}>
                Delete Record
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default PatientAttendance;
