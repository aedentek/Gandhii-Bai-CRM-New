// ✅ FIXED Patient Attendance Management System - Complete CRUD with Proper ID Handling
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ActionButtons } from '@/components/ui/HeaderActionButtons';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { 
  Search, RefreshCw, CheckCircle, XCircle, Calendar as CalendarIcon,
  Users, Activity, Clock3, AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import LoadingScreen from '@/components/shared/LoadingScreen';
import '@/styles/global-crm-design.css';

// API Base URL
const API_BASE_URL = 'http://localhost:4000/api';

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

// API Service Class
class PatientAttendanceAPI {
  // Get all patients
  static async getAllPatients(): Promise<Patient[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/patients`);
      if (!response.ok) throw new Error('Failed to fetch patients');
      const data = await response.json();
      
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
      
      return data.map((record: any) => ({
        id: record.id,
        patient_id: record.patient_id,
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

  // Stats
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayTotal: 0,
    todayPresent: 0,
    todayAbsent: 0,
    todayLate: 0,
    todayNotMarked: 0
  });

  // Helper functions
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Present': return 'bg-green-100 text-green-700 border border-green-200';
      case 'Absent': return 'bg-red-100 text-red-700 border border-red-200';
      case 'Late': return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
      default: return 'bg-gray-100 text-gray-600 border border-gray-200';
    }
  };

  const getAttendanceForDate = (patientId: number, targetDate: string): AttendanceRecord | null => {
    return attendanceRecords.find(record => {
      // Handle both numeric and P-format patient IDs
      const recordPatientId = record.patient_id;
      const normalizedRecordId = recordPatientId?.startsWith('P') 
        ? parseInt(recordPatientId.slice(1)) 
        : parseInt(recordPatientId);
      
      // Compare dates properly (handle both date formats)
      let recordDate = record.date;
      if (recordDate && recordDate.includes('T')) {
        recordDate = recordDate.split('T')[0]; // Extract YYYY-MM-DD from ISO date
      }
      
      return normalizedRecordId === patientId && recordDate === targetDate;
    }) || null;
  };

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading patient attendance data...');
      
      const [patientsData, attendanceData] = await Promise.all([
        PatientAttendanceAPI.getAllPatients(),
        PatientAttendanceAPI.getAllAttendance()
      ]);

      console.log('✅ Loaded patients:', patientsData.length);
      console.log('✅ Loaded attendance records:', attendanceData.length);

      setPatients(patientsData);
      setAttendanceRecords(attendanceData);

      // Calculate stats
      const todayRecords = attendanceData.filter(record => {
        let recordDate = record.date;
        if (recordDate && recordDate.includes('T')) {
          recordDate = recordDate.split('T')[0];
        }
        return recordDate === dateFilter;
      });
      
      setStats({
        totalPatients: patientsData.length,
        todayTotal: todayRecords.length,
        todayPresent: todayRecords.filter(r => r.status === 'Present').length,
        todayAbsent: todayRecords.filter(r => r.status === 'Absent').length,
        todayLate: todayRecords.filter(r => r.status === 'Late').length,
        todayNotMarked: patientsData.length - todayRecords.length
      });

    } catch (error) {
      console.error('❌ Error loading data:', error);
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
        description: "✅ Data refreshed successfully",
      });
    } finally {
      setRefreshing(false);
    }
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

    filtered.sort((a, b) => a.patient_id.localeCompare(b.patient_id, undefined, { numeric: true }));
    setFilteredPatients(filtered);
  };

  // CRUD operations
  const handleMarkAttendance = async (patient: Patient, status: 'Present' | 'Absent' | 'Late') => {
    try {
      const existingAttendance = getAttendanceForDate(patient.id, dateFilter);
      
      if (existingAttendance) {
        await PatientAttendanceAPI.updateAttendance(existingAttendance.id, {
          status,
          checkInTime: status === 'Present' ? format(new Date(), 'HH:mm') : undefined
        });
      } else {
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
        description: `✅ Attendance marked as ${status} for ${patient.name}`,
      });

      await refreshData();
    } catch (error) {
      console.error('❌ Error marking attendance:', error);
      toast({
        title: "Error",
        description: "❌ Failed to mark attendance",
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
        description: "✅ Attendance record deleted successfully",
      });

      setShowDeleteModal(false);
      setSelectedRecord(null);
      await refreshData();
    } catch (error) {
      console.error('❌ Error deleting attendance:', error);
      toast({
        title: "Error",
        description: "❌ Failed to delete attendance record",
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

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="crm-page-bg">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="crm-header-container">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="crm-header-icon">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Patient Attendance</h1>
                <p className="text-sm sm:text-base text-gray-600">Manage daily patient attendance records</p>
              </div>
            </div>
            <div className="flex gap-2">
              <ActionButtons.Refresh 
                onClick={refreshData} 
                loading={refreshing} 
                disabled={refreshing} 
              />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="crm-stats-grid">
          <Card className="crm-stat-card crm-stat-card-blue">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-blue-700 mb-1 truncate">Total Patients</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-900 mb-1">{stats.totalPatients}</p>
                  <div className="flex items-center text-xs text-blue-600">
                    <Users className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">All Patients</span>
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
                  <p className="text-xs sm:text-sm font-medium text-green-700 mb-1 truncate">Present</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-900 mb-1">{stats.todayPresent}</p>
                  <div className="flex items-center text-xs text-green-600">
                    <CheckCircle className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Today</span>
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
                  <p className="text-xs sm:text-sm font-medium text-red-700 mb-1 truncate">Absent</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-900 mb-1">{stats.todayAbsent}</p>
                  <div className="flex items-center text-xs text-red-600">
                    <XCircle className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Today</span>
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
                  <p className="text-xs sm:text-sm font-medium text-orange-700 mb-1 truncate">Not Marked</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-900 mb-1">{stats.todayNotMarked}</p>
                  <div className="flex items-center text-xs text-orange-600">
                    <AlertCircle className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Pending</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-orange">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="crm-controls-container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
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
                className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

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
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((patient) => {
                  const attendance = getAttendanceForDate(patient.id, dateFilter);
                  
                  return (
                    <TableRow key={patient.id}>
                      <TableCell className="font-medium">{patient.patient_id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {patient.photo && (
                            <img
                              src={`http://localhost:4000/${patient.photo}`}
                              alt={patient.name}
                              className="h-8 w-8 rounded-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
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
                        <div className="action-buttons-container">
                          {!attendance ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleMarkAttendance(patient, 'Present')}
                                className="action-btn-lead"
                                title="Mark Present"
                              >
                                ✓
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarkAttendance(patient, 'Absent')}
                                className="action-btn-delete"
                                title="Mark Absent"
                              >
                                ✗
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarkAttendance(patient, 'Late')}
                                className="action-btn-edit"
                                title="Mark Late"
                              >
                                ⏰
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleMarkAttendance(patient, 'Present')}
                                className="action-btn-lead"
                                title="Mark Present"
                              >
                                ✓
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarkAttendance(patient, 'Absent')}
                                className="action-btn-delete"
                                title="Mark Absent"
                              >
                                ✗
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarkAttendance(patient, 'Late')}
                                className="action-btn-edit"
                                title="Mark Late"
                              >
                                ⏰
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedRecord(attendance);
                                  setShowDeleteModal(true);
                                }}
                                className="action-btn-delete"
                                title="Delete Record"
                              >
                                🗑️
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>🗑️ Delete Attendance Record</DialogTitle>
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
            <Button variant="outline" onClick={() => setShowDeleteModal(false)} className="global-btn">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAttendance} className="global-btn bg-red-600 hover:bg-red-700 text-white">
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
