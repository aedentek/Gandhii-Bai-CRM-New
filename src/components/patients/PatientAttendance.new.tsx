// Patient Attendance Management System - Complete CRUD with Fixed ID Handling
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { 
  Search, UserCheck, Filter, RefreshCw, Download, 
  Plus, Eye, Edit2, Trash2, CheckCircle, XCircle, Calendar as CalendarIcon,
  Users, Activity, TrendingUp, CalendarDays, MapPin, Phone, Clock3, AlertCircle
} from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import LoadingScreen from '@/components/shared/LoadingScreen';
import * as XLSX from 'xlsx';

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// Interfaces
interface Patient {
  id: number;
  patient_id: string; // P0001 format
  name: string;
  phone: string;
  email?: string;
  status: 'Active' | 'Inactive';
  photo?: string;
}

interface AttendanceRecord {
  id: number;
  patient_id: string; // Should match numeric patient ID in database
  patient_name: string;
  patient_phone?: string;
  date: string; // YYYY-MM-DD format
  status: 'Present' | 'Absent' | 'Late';
  check_in_time?: string; // HH:MM format
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface AttendanceStats {
  totalPatients: number;
  todayTotal: number;
  todayPresent: number;
  todayAbsent: number;
  todayLate: number;
  todayNotMarked: number;
}

// API Service Class
class PatientAttendanceAPI {
  // Get all patients
  static async getAllPatients(): Promise<Patient[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/patients`);
      if (!response.ok) throw new Error('Failed to fetch patients');
      const data = await response.json();
      
      // Normalize patient data and filter only active patients
      return data
        .filter((p: any) => p.status === 'Active')
        .map((p: any) => ({
          id: p.id,
          patient_id: p.patient_id || `P${String(p.id).padStart(4, '0')}`,
          name: p.name,
          phone: p.phone,
          email: p.email || '',
          status: p.status,
          photo: p.photo
        }));
    } catch (error) {
      console.error('Error fetching patients:', error);
      throw error;
    }
  }

  // Get all attendance records
  static async getAllAttendance(): Promise<AttendanceRecord[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/patient-attendance`);
      if (!response.ok) throw new Error('Failed to fetch attendance records');
      const data = await response.json();
      
      // Normalize attendance data
      return data.map((record: any) => ({
        id: record.id,
        patient_id: record.patient_id, // Keep as numeric for database matching
        patient_name: record.patient_name,
        patient_phone: record.patient_phone,
        date: record.attendance_date || record.date,
        status: record.status,
        check_in_time: record.check_in_time,
        notes: record.notes || '',
        created_at: record.created_at,
        updated_at: record.updated_at
      }));
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      throw error;
    }
  }

  // Add new attendance record
  static async addAttendance(data: {
    patientId: number;
    patientName: string;
    date: string;
    status: 'Present' | 'Absent' | 'Late';
    checkInTime?: string;
    notes?: string;
  }): Promise<AttendanceRecord> {
    try {
      const response = await fetch(`${API_BASE_URL}/patient-attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to add attendance record');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error adding attendance record:', error);
      throw error;
    }
  }

  // Update attendance record
  static async updateAttendance(id: number, data: {
    status?: 'Present' | 'Absent' | 'Late';
    checkInTime?: string;
    notes?: string;
  }): Promise<AttendanceRecord> {
    try {
      const response = await fetch(`${API_BASE_URL}/patient-attendance/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to update attendance record');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error updating attendance record:', error);
      throw error;
    }
  }

  // Delete attendance record
  static async deleteAttendance(id: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/patient-attendance/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to delete attendance record');
      }
    } catch (error) {
      console.error('Error deleting attendance record:', error);
      throw error;
    }
  }
}

const PatientAttendance: React.FC = () => {
  const navigate = useNavigate();

  // State management
  const [patients, setPatients] = useState<Patient[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    patientId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    status: 'Present' as 'Present' | 'Absent' | 'Late',
    checkInTime: format(new Date(), 'HH:mm'),
    notes: ''
  });

  // Stats
  const [stats, setStats] = useState<AttendanceStats>({
    totalPatients: 0,
    todayTotal: 0,
    todayPresent: 0,
    todayAbsent: 0,
    todayLate: 0,
    todayNotMarked: 0
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Helper functions
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Present': return 'bg-green-100 text-green-700 border border-green-200';
      case 'Absent': return 'bg-red-100 text-red-700 border border-red-200';
      case 'Late': return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
      default: return 'bg-gray-100 text-gray-600 border border-gray-200';
    }
  };

  const formatPatientId = (id: string | number): string => {
    const numericId = typeof id === 'string' ? parseInt(id.replace(/^P0*/, '')) : id;
    return `P${numericId.toString().padStart(4, '0')}`;
  };

  const getAttendanceForDate = (patientId: number, targetDate: string): AttendanceRecord | null => {
    return attendanceRecords.find(record => 
      record.patient_id === patientId.toString() && record.date === targetDate
    ) || null;
  };

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Loading patient attendance data...');
      
      const [patientsData, attendanceData] = await Promise.all([
        PatientAttendanceAPI.getAllPatients(),
        PatientAttendanceAPI.getAllAttendance()
      ]);

      console.log('Loaded patients:', patientsData.length);
      console.log('Loaded attendance records:', attendanceData.length);
      console.log('Sample patient:', patientsData[0]);
      console.log('Sample attendance:', attendanceData[0]);

      setPatients(patientsData);
      setAttendanceRecords(attendanceData);

      // Calculate stats
      calculateStats(patientsData, attendanceData, dateFilter);

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      setRefreshing(true);
      await loadData();
      toast({
        title: "Success",
        description: "Data refreshed successfully",
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: "Error",
        description: "Failed to refresh data",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const calculateStats = (patientsData: Patient[], attendanceData: AttendanceRecord[], targetDate: string) => {
    const todayRecords = attendanceData.filter(record => record.date === targetDate);
    const presentCount = todayRecords.filter(r => r.status === 'Present').length;
    const absentCount = todayRecords.filter(r => r.status === 'Absent').length;
    const lateCount = todayRecords.filter(r => r.status === 'Late').length;
    const totalPatients = patientsData.length;
    const notMarkedCount = totalPatients - todayRecords.length;

    setStats({
      totalPatients,
      todayTotal: todayRecords.length,
      todayPresent: presentCount,
      todayAbsent: absentCount,
      todayLate: lateCount,
      todayNotMarked: notMarkedCount
    });
  };

  // Filter patients based on search and status
  const filterPatients = () => {
    let filtered = patients.filter(patient => {
      const matchesSearch = 
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phone.includes(searchTerm);

      const attendance = getAttendanceForDate(patient.id, dateFilter);
      
      if (statusFilter === 'All') return matchesSearch;
      if (statusFilter === 'Not Marked') return matchesSearch && !attendance;
      
      return matchesSearch && attendance && attendance.status === statusFilter;
    });

    // Sort by patient_id
    filtered.sort((a, b) => a.patient_id.localeCompare(b.patient_id, undefined, { numeric: true }));

    setFilteredPatients(filtered);
    setCurrentPage(1);
  };

  // CRUD operations
  const handleMarkAttendance = async (patient: Patient, status: 'Present' | 'Absent' | 'Late') => {
    try {
      const existingAttendance = getAttendanceForDate(patient.id, dateFilter);
      
      if (existingAttendance) {
        // Update existing record
        await PatientAttendanceAPI.updateAttendance(existingAttendance.id, {
          status,
          checkInTime: status === 'Present' ? format(new Date(), 'HH:mm') : undefined
        });
      } else {
        // Create new record
        await PatientAttendanceAPI.addAttendance({
          patientId: patient.id,
          patientName: patient.name,
          date: dateFilter,
          status,
          checkInTime: status === 'Present' ? format(new Date(), 'HH:mm') : undefined
        });
      }

      toast({
        title: "Success",
        description: `Attendance marked as ${status} for ${patient.name}`,
      });

      await refreshData();
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast({
        title: "Error",
        description: "Failed to mark attendance",
        variant: "destructive",
      });
    }
  };

  const handleAddAttendance = async () => {
    try {
      if (!formData.patientId || !formData.date) {
        toast({
          title: "Error",
          description: "Please select patient and date",
          variant: "destructive",
        });
        return;
      }

      const patient = patients.find(p => p.id.toString() === formData.patientId);
      if (!patient) {
        toast({
          title: "Error",
          description: "Selected patient not found",
          variant: "destructive",
        });
        return;
      }

      await PatientAttendanceAPI.addAttendance({
        patientId: patient.id,
        patientName: patient.name,
        date: formData.date,
        status: formData.status,
        checkInTime: formData.checkInTime,
        notes: formData.notes
      });

      toast({
        title: "Success",
        description: "Attendance record added successfully",
      });

      setShowAddModal(false);
      resetForm();
      await refreshData();
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

      await PatientAttendanceAPI.updateAttendance(selectedRecord.id, {
        status: selectedRecord.status,
        checkInTime: selectedRecord.check_in_time,
        notes: selectedRecord.notes
      });

      toast({
        title: "Success",
        description: "Attendance record updated successfully",
      });

      setShowEditModal(false);
      setSelectedRecord(null);
      await refreshData();
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
      if (!selectedRecord) return;

      await PatientAttendanceAPI.deleteAttendance(selectedRecord.id);

      toast({
        title: "Success",
        description: "Attendance record deleted successfully",
      });

      setShowDeleteModal(false);
      setSelectedRecord(null);
      await refreshData();
    } catch (error) {
      console.error('Error deleting attendance:', error);
      toast({
        title: "Error",
        description: "Failed to delete attendance record",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      patientId: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      status: 'Present',
      checkInTime: format(new Date(), 'HH:mm'),
      notes: ''
    });
  };

  const exportToExcel = () => {
    try {
      const exportData = filteredPatients.map(patient => {
        const attendance = getAttendanceForDate(patient.id, dateFilter);
        return {
          'Patient ID': patient.patient_id,
          'Patient Name': patient.name,
          'Phone': patient.phone,
          'Status': attendance ? attendance.status : 'Not Marked',
          'Check In Time': attendance ? attendance.check_in_time : '-',
          'Notes': attendance ? attendance.notes : '-',
          'Date': dateFilter
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Patient Attendance');
      
      const fileName = `Patient_Attendance_${dateFilter}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      toast({
        title: "Success",
        description: `Attendance data exported to ${fileName}`,
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      });
    }
  };

  // Effects
  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterPatients();
  }, [patients, attendanceRecords, searchTerm, statusFilter, dateFilter]);

  useEffect(() => {
    calculateStats(patients, attendanceRecords, dateFilter);
  }, [patients, attendanceRecords, dateFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Patient Attendance</h1>
          <p className="text-gray-600">Manage daily patient attendance records</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={refreshData}
            disabled={refreshing}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Attendance
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Patients</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalPatients}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.todayTotal}</p>
              </div>
              <Activity className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Present</p>
                <p className="text-2xl font-bold text-green-600">{stats.todayPresent}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Absent</p>
                <p className="text-2xl font-bold text-red-600">{stats.todayAbsent}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Late</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.todayLate}</p>
              </div>
              <Clock3 className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Not Marked</p>
                <p className="text-2xl font-bold text-orange-600">{stats.todayNotMarked}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Patients</SelectItem>
                <SelectItem value="Present">Present</SelectItem>
                <SelectItem value="Absent">Absent</SelectItem>
                <SelectItem value="Late">Late</SelectItem>
                <SelectItem value="Not Marked">Not Marked</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="pl-10"
              />
            </div>

            <Button
              onClick={exportToExcel}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Patient List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Patient Attendance - {format(new Date(dateFilter), 'dd MMM yyyy')}
            <Badge variant="outline" className="ml-2">
              {filteredPatients.length} patients
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPatients.map((patient) => {
                  const attendance = getAttendanceForDate(patient.id, dateFilter);
                  
                  return (
                    <TableRow key={patient.id}>
                      <TableCell className="font-medium">{patient.patient_id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {patient.photo && (
                            <img
                              src={`${import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:4000'}/${patient.photo}`}
                              alt={patient.name}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          )}
                          <div>
                            <p className="font-medium">{patient.name}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{patient.phone}</TableCell>
                      <TableCell>
                        {attendance ? (
                          <Badge className={getStatusBadgeClass(attendance.status)}>
                            {attendance.status}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50 text-gray-600">
                            Not Marked
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {attendance?.check_in_time || '-'}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {attendance?.notes || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {!attendance ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleMarkAttendance(patient, 'Present')}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Present
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarkAttendance(patient, 'Absent')}
                                className="border-red-200 text-red-600 hover:bg-red-50"
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Absent
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarkAttendance(patient, 'Late')}
                                className="border-yellow-200 text-yellow-600 hover:bg-yellow-50"
                              >
                                <Clock3 className="h-4 w-4 mr-1" />
                                Late
                              </Button>
                            </>
                          ) : (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedRecord(attendance);
                                  setShowEditModal(true);
                                }}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedRecord(attendance);
                                  setShowDeleteModal(true);
                                }}
                                className="text-red-600 border-red-200 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-600">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredPatients.length)} of {filteredPatients.length} patients
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="flex items-center px-3 py-1 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Attendance Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Attendance Record</DialogTitle>
            <DialogDescription>
              Add a new attendance record for a patient.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Patient</label>
              <Select value={formData.patientId} onValueChange={(value) => setFormData(prev => ({ ...prev, patientId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id.toString()}>
                      {patient.patient_id} - {patient.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={formData.status} onValueChange={(value: 'Present' | 'Absent' | 'Late') => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Present">Present</SelectItem>
                  <SelectItem value="Absent">Absent</SelectItem>
                  <SelectItem value="Late">Late</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Check In Time</label>
              <Input
                type="time"
                value={formData.checkInTime}
                onChange={(e) => setFormData(prev => ({ ...prev, checkInTime: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Notes</label>
              <Input
                placeholder="Optional notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddAttendance}>
              Add Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Attendance Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Attendance Record</DialogTitle>
            <DialogDescription>
              Update the attendance record details.
            </DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Patient</label>
                <Input
                  value={selectedRecord.patient_name}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Date</label>
                <Input
                  value={selectedRecord.date}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Status</label>
                <Select 
                  value={selectedRecord.status} 
                  onValueChange={(value: 'Present' | 'Absent' | 'Late') => 
                    setSelectedRecord(prev => prev ? { ...prev, status: value } : null)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Present">Present</SelectItem>
                    <SelectItem value="Absent">Absent</SelectItem>
                    <SelectItem value="Late">Late</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Check In Time</label>
                <Input
                  type="time"
                  value={selectedRecord.check_in_time || ''}
                  onChange={(e) => setSelectedRecord(prev => prev ? { ...prev, check_in_time: e.target.value } : null)}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Notes</label>
                <Input
                  placeholder="Optional notes"
                  value={selectedRecord.notes || ''}
                  onChange={(e) => setSelectedRecord(prev => prev ? { ...prev, notes: e.target.value } : null)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditAttendance}>
              Update Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Attendance Record</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this attendance record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p><strong>Patient:</strong> {selectedRecord.patient_name}</p>
              <p><strong>Date:</strong> {selectedRecord.date}</p>
              <p><strong>Status:</strong> {selectedRecord.status}</p>
            </div>
          )}
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
  );
};

export default PatientAttendance;
