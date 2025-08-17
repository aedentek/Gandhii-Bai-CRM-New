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
  Search, UserCheck, Filter, RefreshCw, Download, 
  Plus, Eye, Edit2, Trash2, CheckCircle, XCircle, Calendar as CalendarIcon,
  Users, Activity, TrendingUp, CalendarDays, MapPin, Phone, Clock3
} from 'lucide-react';
import { format, parseISO, isSameDay, startOfMonth, endOfMonth } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { PatientService } from '@/services/patientService';
import { DatabaseService } from '@/services/databaseService';
import { patientsAPI } from '@/utils/api';
import LoadingScreen from '@/components/shared/LoadingScreen';
import MonthYearPickerDialog from '@/components/shared/MonthYearPickerDialog';
import * as XLSX from 'xlsx';

interface AttendanceRecord {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_phone: string;
  patient_image?: string;
  attendance_date: string;
  date?: string; // Alternative field name from database
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

  // Helper function to normalize patient IDs consistently
  const normalizePatientId = (id: string | number) => {
    if (!id) return '';
    const idStr = id.toString();
    // If it's already in P format (P0001), use as is
    if (idStr.startsWith('P')) return idStr;
    // If it's numeric, convert to P format
    return `P${idStr.padStart(4, '0')}`;
  };

  // Helper function to get status badge styling (similar to DoctorAttendance)
  const getStatusBadge = (status: string) => {
    const variants: any = {
      Present: 'bg-green-100 text-green-700 border border-green-200',
      Absent: 'bg-red-100 text-red-700 border border-red-200',
      Late: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    };
    return variants[status] || 'bg-gray-100 text-gray-600 border border-gray-200';
  };

  // Get attendance status for a specific date
  const getAttendanceForDate = (patientId: string, targetDate: string) => {
    console.log('🔍 getAttendanceForDate called with:', {
      patientId: patientId,
      targetDate: targetDate,
      attendanceRecordsLength: attendanceRecords?.length || 0
    });
    
    if (!patientId || !attendanceRecords || attendanceRecords.length === 0) {
      console.log('❌ Early return: missing data');
      return null;
    }
    
    const normalizedSearchId = normalizePatientId(patientId);
    console.log('🔍 Normalized search ID:', normalizedSearchId);
    
    const record = attendanceRecords.find(record => {
      if (!record || !record.patient_id) return false;
      
      // Normalize the record's patient_id for comparison
      const normalizedRecordId = normalizePatientId(record.patient_id);
      
      // Strict exact match only
      const patientIdMatch = normalizedRecordId === normalizedSearchId;
      
      if (!patientIdMatch) return false;
      
      // Check date match
      const recordDate = record.date || record.attendance_date;
      if (!recordDate) return false;
      
      let formattedRecordDate;
      try {
        if (typeof recordDate === 'string' && recordDate.includes('T')) {
          formattedRecordDate = recordDate.split('T')[0];
        } else {
          formattedRecordDate = format(new Date(recordDate), 'yyyy-MM-dd');
        }
      } catch (e) {
        return false;
      }
      
      const dateMatch = formattedRecordDate === targetDate;
      console.log('🔍 Date check:', {
        recordDate: formattedRecordDate,
        targetDate: targetDate,
        dateMatch: dateMatch
      });
      
      return dateMatch;
    });
    
    console.log('🔍 Final result:', record);
    return record || null;
  };

  // Get attendance status for the selected date (or today)
  const getTodayAttendance = (patientId: string) => {
    console.log('🔍 getTodayAttendance called with:', {
      patientId: patientId,
      attendanceRecordsLength: attendanceRecords?.length || 0,
      filterMonth: filterMonth,
      filterYear: filterYear,
      dateFilter: dateFilter
    });
    
    if (!patientId || !attendanceRecords || attendanceRecords.length === 0) {
      console.log('❌ Early return: missing data');
      return null;
    }
    
    const normalizedSearchId = normalizePatientId(patientId);
    console.log('🔍 Normalized search ID:', normalizedSearchId);
    
    // If month/year filter is active, find the most recent record in that month
    if (filterMonth !== null && filterYear !== null) {
      console.log('🔍 Using month/year filter');
      const monthRecords = attendanceRecords.filter(record => {
        if (!record || !record.patient_id) return false;
        
        // Check patient ID match
        const normalizedRecordId = normalizePatientId(record.patient_id);
        if (normalizedRecordId !== normalizedSearchId) return false;
        
        // Check if record is in selected month/year
        const recordDate = record.date || record.attendance_date;
        if (!recordDate) return false;
        
        let dateObj;
        try {
          if (typeof recordDate === 'string' && recordDate.includes('T')) {
            dateObj = new Date(recordDate.split('T')[0]);
          } else {
            dateObj = new Date(recordDate);
          }
          
          if (isNaN(dateObj.getTime())) return false;
          
          return dateObj.getMonth() === filterMonth && dateObj.getFullYear() === filterYear;
        } catch (e) {
          return false;
        }
      });
      
      console.log('🔍 Month records found:', monthRecords.length);
      
      // Return the most recent record in the month
      if (monthRecords.length > 0) {
        const result = monthRecords.sort((a, b) => {
          const dateA = new Date(a.date || a.attendance_date);
          const dateB = new Date(b.date || b.attendance_date);
          return dateB.getTime() - dateA.getTime(); // Most recent first
        })[0];
        console.log('✅ Returning month record:', result);
        return result;
      }
      
      console.log('❌ No month records found');
      return null;
    }
    
    // Default behavior: look for specific date
    const targetDate = dateFilter || format(new Date(), 'yyyy-MM-dd');
    console.log('🔍 Using default behavior with targetDate:', targetDate);
    
    const record = attendanceRecords.find(record => {
      if (!record || !record.patient_id) return false;
      
      // Normalize the record's patient_id for comparison
      const normalizedRecordId = normalizePatientId(record.patient_id);
      
      // Strict exact match only
      const patientIdMatch = normalizedRecordId === normalizedSearchId;
      console.log('🔍 Checking record:', {
        recordId: normalizedRecordId,
        searchId: normalizedSearchId,
        match: patientIdMatch
      });
      
      // Check date match
      const recordDate = record.date || record.attendance_date;
      if (!recordDate) return false;
      
      let formattedRecordDate;
      try {
        if (typeof recordDate === 'string' && recordDate.includes('T')) {
          formattedRecordDate = recordDate.split('T')[0];
        } else {
          formattedRecordDate = format(new Date(recordDate), 'yyyy-MM-dd');
        }
      } catch (e) {
        return false;
      }
      
      const dateMatch = formattedRecordDate === targetDate;
      console.log('🔍 Date check:', {
        recordDate: formattedRecordDate,
        targetDate: targetDate,
        dateMatch: dateMatch
      });
      
      return patientIdMatch && dateMatch;
    });
    
    console.log('🔍 Final result:', record);
    return record || null;
  };
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState(format(new Date(), 'yyyy-MM-dd'));  // Default to today's date
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<AttendanceRecord | null>(null);

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
    totalActivePatients: 0,
    totalToday: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterPatients();
  }, [attendanceRecords, patients, searchTerm, statusFilter, dateFilter, filterMonth, filterYear]);

  // Auto-update date filter to always show current date
  useEffect(() => {
    const updateToCurrentDate = () => {
      const currentDate = format(new Date(), 'yyyy-MM-dd');
      setDateFilter(currentDate);
    };

    // Update immediately on component mount
    updateToCurrentDate();

    // Set up interval to update at midnight every day
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    // Set initial timeout for first midnight
    const timeoutId = setTimeout(() => {
      updateToCurrentDate();
      
      // Then set up daily interval
      const intervalId = setInterval(updateToCurrentDate, 24 * 60 * 60 * 1000); // 24 hours
      
      return () => clearInterval(intervalId);
    }, msUntilMidnight);

    return () => clearTimeout(timeoutId);
  }, []);

  // Recalculate stats when date filter changes or month/year filter changes
  useEffect(() => {
    if (attendanceRecords.length > 0) {
      let targetDateRecords = [];
      
      if (filterMonth !== null && filterYear !== null) {
        // Filter by month and year
        targetDateRecords = attendanceRecords.filter((record: AttendanceRecord) => {
          if (!record) return false;
          const recordDate = record.date || record.attendance_date;
          if (!recordDate) return false;
          
          let dateObj;
          if (typeof recordDate === 'string' && recordDate.includes('T')) {
            dateObj = new Date(recordDate.split('T')[0]);
          } else {
            dateObj = new Date(recordDate);
          }
          
          if (isNaN(dateObj.getTime())) return false;
          
          return dateObj.getMonth() === filterMonth && dateObj.getFullYear() === filterYear;
        });
      } else {
        // Filter by specific date
        const targetDate = dateFilter || format(new Date(), 'yyyy-MM-dd');
        targetDateRecords = attendanceRecords.filter((record: AttendanceRecord) => {
          if (!record) return false;
          const recordDate = record.date || record.attendance_date;
          if (!recordDate) return false;
          
          // Handle both string dates and ISO date objects
          let formattedRecordDate;
          if (typeof recordDate === 'string' && recordDate.includes('T')) {
            // It's an ISO date string, extract just the date part
            formattedRecordDate = recordDate.split('T')[0];
          } else {
            // It's already a YYYY-MM-DD format or a Date object
            formattedRecordDate = format(new Date(recordDate), 'yyyy-MM-dd');
          }
          
          return formattedRecordDate === targetDate;
        });
      }
      
      setStats({
        totalActivePatients: patients.length,
        totalToday: targetDateRecords.length,
        presentToday: targetDateRecords.filter((r: AttendanceRecord) => r && r.status === 'Present').length,
        absentToday: targetDateRecords.filter((r: AttendanceRecord) => r && r.status === 'Absent').length,
        lateToday: targetDateRecords.filter((r: AttendanceRecord) => r && r.status === 'Late').length
      });
    }
  }, [dateFilter, attendanceRecords, filterMonth, filterYear, patients]);

  const filterPatients = () => {
    // If a specific date is selected (and not using month/year mode), only show patients
    // who have attendance records for that date (or show Not Marked when requested).
    const targetDate = (filterMonth === null && filterYear === null && dateFilter) ? dateFilter : null;

    let filtered = patients.filter(patient => {
      if (!patient) return false;

      const matchesSearch =
        (patient.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (patient.patient_id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (patient.id?.toString().toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (patient.phone || '').includes(searchTerm);

      const isActive = patient.status === 'Active';

      // If a date filter (exact date) is active, only include patients with attendance for that date
      if (targetDate) {
        const pid = normalizePatientId(patient.patient_id || patient.id);

        // Helper: check if patient has attendance for targetDate and return that record
        const attendanceForDate = attendanceRecords.find(r => {
          if (!r || !r.patient_id) return false;
          const recId = normalizePatientId(r.patient_id);
          if (recId !== pid) return false;

          const recordDate = r.date || r.attendance_date;
          if (!recordDate) return false;

          let formattedRecordDate;
          try {
            if (typeof recordDate === 'string' && recordDate.includes('T')) {
              formattedRecordDate = recordDate.split('T')[0];
            } else {
              formattedRecordDate = format(new Date(recordDate), 'yyyy-MM-dd');
            }
          } catch (e) {
            return false;
          }

          return formattedRecordDate === targetDate;
        }) || null;

        const hasAttendance = !!attendanceForDate;

        // If user explicitly filtered by status
        if (statusFilter !== 'All') {
          if (statusFilter === 'Not Marked') {
            return matchesSearch && isActive && !hasAttendance;
          }

          // For Present/Absent/Late ensure the attendance record for that date matches
          return matchesSearch && isActive && attendanceForDate && attendanceForDate.status === statusFilter;
        }

        // Default when date is selected and no status filter: only show patients who have attendance for that date
        return matchesSearch && isActive && hasAttendance;
      }

      // Existing behavior when not using exact date mode (month/year or no date)
      // Filter by attendance status if not "All"
      if (statusFilter !== 'All') {
        const patientAttendance = getTodayAttendance(normalizePatientId(patient.patient_id || patient.id));

        if (statusFilter === 'Present') {
          const hasPresent = patientAttendance && patientAttendance.status === 'Present';
          return matchesSearch && isActive && hasPresent;
        } else if (statusFilter === 'Absent') {
          const hasAbsent = patientAttendance && patientAttendance.status === 'Absent';
          return matchesSearch && isActive && hasAbsent;
        } else if (statusFilter === 'Late') {
          const hasLate = patientAttendance && patientAttendance.status === 'Late';
          return matchesSearch && isActive && hasLate;
        } else if (statusFilter === 'Not Marked') {
          const notMarked = !patientAttendance;
          return matchesSearch && isActive && notMarked;
        }
      }

      // For "All" status or when no specific filter, show all active patients
      return matchesSearch && isActive;
    });

    // Sort by patient_id in ascending order (P0100, P0101, P0102, P0103, etc.)
    filtered.sort((a, b) => {
      const idA = a.patient_id || '';
      const idB = b.patient_id || '';
      return idA.localeCompare(idB, undefined, { numeric: true });
    });

    setFilteredPatients(filtered);
    setCurrentPage(1);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Loading patient attendance data...');
      
      const [recordsData, patientsRawData] = await Promise.all([
        DatabaseService.getAllPatientAttendance(),
        patientsAPI.getAll() // Use same API as PatientList
      ]);

      console.log('📊 Raw patient data loaded:', patientsRawData.length, 'patients');
      console.log('📊 Attendance records loaded:', recordsData.length, 'records');
      console.log('📊 Sample raw attendance record:', recordsData[0]);
      console.log('📊 Sample raw patient data:', JSON.stringify(patientsRawData[0], null, 2));

      // Ensure recordsData is an array and normalize the data
      const safeRecordsData = Array.isArray(recordsData) ? recordsData : [];
      const safePatientsRawData = Array.isArray(patientsRawData) ? patientsRawData : [];

      // Process patients similar to PatientList - Parse and format patient data
      const parsedPatients = safePatientsRawData.map((p: any) => {
        // Function to parse DD-MM-YYYY format from backend to Date object
        const parseDateFromDDMMYYYY = (dateStr: any): Date => {
          if (!dateStr) return new Date();
          
          // If it's already a Date object, return it
          if (dateStr instanceof Date) return dateStr;
          
          // If it's in DD-MM-YYYY format
          if (typeof dateStr === 'string' && dateStr.match(/^\d{2}-\d{2}-\d{4}$/)) {
            const [day, month, year] = dateStr.split('-');
            return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          }
          
          // If it's in YYYY-MM-DD format, convert normally
          if (typeof dateStr === 'string' && dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
            return new Date(dateStr);
          }
          
          // Try to parse as regular date
          const parsed = new Date(dateStr);
          return isNaN(parsed.getTime()) ? new Date() : parsed;
        };
        
        // Handle mixed database structure - same as PatientList
        const patientId = p.patient_id && String(p.patient_id).trim() 
          ? String(p.patient_id).trim()  // Use existing patient_id if available (P0067)
          : `P${String(p.id).padStart(4, '0')}`; // Generate P-format from numeric id (P0067)
        const numericId = p.id || parseInt(String(patientId).replace(/\D/g, '')) || 1;
        
        // Calculate payment data - same as PatientList
        const fees = parseFloat(p.fees) || 0;
        const bloodTest = parseFloat(p.bloodTest) || 0;
        const pickupCharge = parseFloat(p.pickupCharge) || 0;
        const payAmount = parseFloat(p.payAmount) || 0;
        const totalAmount = fees + bloodTest + pickupCharge;
        const balance = totalAmount - payAmount;
        
        return {
          id: numericId,                    // Keep numeric ID for internal use
          patient_id: patientId,            // P-formatted ID
          originalId: numericId,            // Numeric ID for database operations
          name: p.name,
          age: parseInt(p.age) || 0,
          gender: p.gender,
          phone: p.phone,
          email: p.email || '',
          address: p.address,
          emergencyContact: p.emergencyContact || '',
          medicalHistory: p.medicalHistory || '',
          admissionDate: parseDateFromDDMMYYYY(p.admissionDate),
          status: p.status || 'Active',    // Default to Active
          attenderName: p.attenderName || '',
          attenderPhone: p.attenderPhone || '',
          photo: p.photo || '',
          photoUrl: p.photo ? `http://localhost:4000/${p.photo}` : null, // Add photoUrl for consistency
          fees: fees,
          bloodTest: bloodTest,
          pickupCharge: pickupCharge,
          totalAmount: totalAmount,
          payAmount: payAmount,
          balance: balance,
          paymentType: p.paymentType || '',
          fatherName: p.fatherName || '',
          motherName: p.motherName || '',
          attenderRelationship: p.attenderRelationship || '',
          dateOfBirth: parseDateFromDDMMYYYY(p.dateOfBirth),
          marriageStatus: p.marriageStatus || '',
          employeeStatus: p.employeeStatus || '',
          // Document fields
          patientAadhar: p.patientAadhar || '',
          patientPan: p.patientPan || '',
          attenderAadhar: p.attenderAadhar || '',
          attenderPan: p.attenderPan || ''
        };
      });

      // Filter for ACTIVE patients only - same as PatientList logic
      const activePatientsData = parsedPatients.filter((patient: any) => 
        patient.status === 'Active'
      );

      console.log('📊 Total patients loaded:', parsedPatients.length);
      console.log('📊 Active patients filtered:', activePatientsData.length);
      console.log('📊 Sample active patient:', JSON.stringify(activePatientsData[0], null, 2));
      console.log('📊 All patients status check:', parsedPatients.map(p => ({ id: p.patient_id, name: p.name, status: p.status })));
      console.log('📊 Active patients list:', activePatientsData.map(p => ({ id: p.patient_id, name: p.name, status: p.status })));

      // Normalize attendance records - convert 'date' to 'attendance_date' for consistency  
      // CRITICAL: Map all possible patient_id field names!
      const normalizedRecords = safeRecordsData.map((record: any) => ({
        ...record,
        id: record.id?.toString(), // Ensure ID is string
        patient_id: record.patient_id || record.patientId, // Only use actual patient ID fields
        patient_name: record.patient_name || record.patientName,
        attendance_date: record.attendance_date || record.date
      })).filter(record => record.patient_id); // Filter out records without patient_id

      console.log('📊 Sample normalized record:', normalizedRecords[0]);
      console.log('📊 Normalized records with IDs:', normalizedRecords.map(r => ({ id: r.id, patient_id: r.patient_id, date: r.date || r.attendance_date })));

      setAttendanceRecords(normalizedRecords);
      setPatients(activePatientsData); // Set only ACTIVE patients
      
      // Calculate stats for selected date (or today)
      const targetDate = dateFilter || format(new Date(), 'yyyy-MM-dd');
      const targetDateRecords = normalizedRecords.filter((record: AttendanceRecord) => {
        if (!record) return false;
        const recordDate = record.date || record.attendance_date;
        if (!recordDate) return false;
        const formattedRecordDate = format(new Date(recordDate), 'yyyy-MM-dd');
        return formattedRecordDate === targetDate;
      });
      
      setStats({
        totalActivePatients: activePatientsData.length, // Use ACTIVE patients count
        totalToday: targetDateRecords.length,
        presentToday: targetDateRecords.filter((r: AttendanceRecord) => r && r.status === 'Present').length,
        absentToday: targetDateRecords.filter((r: AttendanceRecord) => r && r.status === 'Absent').length,
        lateToday: targetDateRecords.filter((r: AttendanceRecord) => r && r.status === 'Late').length
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
      
      // Fix date filtering to work with both database field names and proper date formatting
      const matchesDate = !dateFilter || (() => {
        const recordDate = record.date || record.attendance_date;
        if (!recordDate) return false;
        
        // Handle both string dates and ISO date objects  
        let formattedRecordDate;
        if (typeof recordDate === 'string' && recordDate.includes('T')) {
          // It's an ISO date string, extract just the date part
          formattedRecordDate = recordDate.split('T')[0];
        } else {
          // It's already a YYYY-MM-DD format or a Date object
          formattedRecordDate = format(new Date(recordDate), 'yyyy-MM-dd');
        }
        
        return formattedRecordDate === dateFilter;
      })();

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
    // Get the records to export based on current filter
    let recordsToExport = [];
    
    if (filterMonth !== null && filterYear !== null) {
      // Filter attendance records by selected month/year
      recordsToExport = attendanceRecords.filter((record: AttendanceRecord) => {
        if (!record) return false;
        const recordDate = record.date || record.attendance_date;
        if (!recordDate) return false;
        
        let dateObj;
        if (typeof recordDate === 'string' && recordDate.includes('T')) {
          dateObj = new Date(recordDate.split('T')[0]);
        } else {
          dateObj = new Date(recordDate);
        }
        
        if (isNaN(dateObj.getTime())) return false;
        
        return dateObj.getMonth() === filterMonth && dateObj.getFullYear() === filterYear;
      });
    } else {
      // Filter by specific date if date filter is active
      const targetDate = dateFilter || format(new Date(), 'yyyy-MM-dd');
      recordsToExport = attendanceRecords.filter((record: AttendanceRecord) => {
        if (!record) return false;
        const recordDate = record.date || record.attendance_date;
        if (!recordDate) return false;
        
        let formattedRecordDate;
        if (typeof recordDate === 'string' && recordDate.includes('T')) {
          formattedRecordDate = recordDate.split('T')[0];
        } else {
          formattedRecordDate = format(new Date(recordDate), 'yyyy-MM-dd');
        }
        
        return formattedRecordDate === targetDate;
      });
    }

    // Apply search and status filters
    if (searchTerm || statusFilter !== 'All') {
      recordsToExport = recordsToExport.filter(record => {
        if (!record) return false;
        
        const matchesSearch = !searchTerm || 
          (record.patient_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (record.patient_id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (record.patient_phone || '').includes(searchTerm);

        const matchesStatus = statusFilter === 'All' || record.status === statusFilter;
        
        return matchesSearch && matchesStatus;
      });
    }

    // Sort by patient ID and date
    recordsToExport.sort((a, b) => {
      const idA = a.patient_id || '';
      const idB = b.patient_id || '';
      const idComparison = idA.localeCompare(idB, undefined, { numeric: true });
      
      if (idComparison !== 0) return idComparison;
      
      // If same patient, sort by date (most recent first)
      const dateA = new Date(a.date || a.attendance_date);
      const dateB = new Date(b.date || b.attendance_date);
      return dateB.getTime() - dateA.getTime();
    });

    const exportData = recordsToExport.map((record, index) => ({
      'S.No': index + 1,
      'Patient ID': record.patient_id,
      'Patient Name': record.patient_name,
      'Phone': record.patient_phone,
      'Date': format(new Date(record.date || record.attendance_date), 'dd/MM/yyyy'),
      'Check In': record.check_in_time,
      'Check Out': record.check_out_time || 'N/A',
      'Status': record.status,
      'Notes': record.notes || 'N/A',
      'Created': format(parseISO(record.created_at), 'dd/MM/yyyy HH:mm')
    }));

    // Add header information with date range
    let headerInfo = [];
    if (filterMonth !== null && filterYear !== null) {
      const startDate = new Date(filterYear, filterMonth, 1);
      const endDate = new Date(filterYear, filterMonth + 1, 0); // Last day of the month
      headerInfo = [
        { 'S.No': 'Patient Attendance Report' },
        { 'S.No': `Period: ${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}` },
        { 'S.No': `Month: ${months[filterMonth]} ${filterYear}` },
        { 'S.No': `Total Records: ${recordsToExport.length}` },
        { 'S.No': '' }, // Empty row for spacing
      ];
    } else if (dateFilter) {
      const selectedDate = new Date(dateFilter);
      headerInfo = [
        { 'S.No': 'Patient Attendance Report' },
        { 'S.No': `Date: ${format(selectedDate, 'dd/MM/yyyy')}` },
        { 'S.No': `Total Records: ${recordsToExport.length}` },
        { 'S.No': '' }, // Empty row for spacing
      ];
    } else {
      const todayDate = new Date();
      headerInfo = [
        { 'S.No': 'Patient Attendance Report' },
        { 'S.No': `Date: ${format(todayDate, 'dd/MM/yyyy')} (Today)` },
        { 'S.No': `Total Records: ${recordsToExport.length}` },
        { 'S.No': '' }, // Empty row for spacing
      ];
    }

    // Combine header info with export data
    const finalExportData = [...headerInfo, ...exportData];

    // Generate appropriate filename based on filter
    let fileName = 'patient-attendance';
    if (filterMonth !== null && filterYear !== null) {
      const monthName = months[filterMonth].toLowerCase();
      const startDate = new Date(filterYear, filterMonth, 1);
      const endDate = new Date(filterYear, filterMonth + 1, 0);
      fileName += `-${monthName}-${filterYear}-(${format(startDate, 'dd-MM')}-to-${format(endDate, 'dd-MM')})`;
    } else if (dateFilter) {
      fileName += `-${dateFilter}`;
    } else {
      fileName += `-${format(new Date(), 'yyyy-MM-dd')}`;
    }

    const ws = XLSX.utils.json_to_sheet(finalExportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
    XLSX.writeFile(wb, `${fileName}.xlsx`);

    toast({
      title: "Success",
      description: filterMonth !== null && filterYear !== null 
        ? `${recordsToExport.length} attendance records exported for ${months[filterMonth]} ${filterYear} (${format(new Date(filterYear, filterMonth, 1), 'dd/MM')} - ${format(new Date(filterYear, filterMonth + 1, 0), 'dd/MM')})`
        : `${recordsToExport.length} attendance records exported successfully`,
    });
  };

  const markQuickAttendance = async (patientId: string, status: 'Present' | 'Absent' | 'Late') => {
    try {
      console.log('🚀🚀🚀 UPDATED CODE RUNNING - markQuickAttendance called with:', { patientId, status });
      
      // STEP 1: Find the patient
      const selectedPatient = patients.find(p => 
        p.patient_id === patientId || p.id.toString() === patientId
      );
      console.log('🔍 Step 1 - Found patient:', selectedPatient);
      
      if (!selectedPatient) {
        console.error('❌ Patient not found with ID:', patientId);
        return;
      }

      // STEP 2: Check for existing attendance
      const targetDate = dateFilter || format(new Date(), 'yyyy-MM-dd');
      console.log('🔍 Step 2 - Checking for existing attendance on date:', targetDate);
      console.log('🔍 All attendance records count:', attendanceRecords.length);
      console.log('🔍 All attendance records:', attendanceRecords);
      console.log('🔍 Selected patient details:', {
        id: selectedPatient.id,
        patient_id: selectedPatient.patient_id,
        name: selectedPatient.name
      });
      
      // Find existing record for this patient and date
      const normalizedSearchId = normalizePatientId(selectedPatient.patient_id || selectedPatient.id);
      console.log('🔍 Normalized search ID:', normalizedSearchId);
      
      let existingAttendance = null;
      for (let i = 0; i < attendanceRecords.length; i++) {
        const record = attendanceRecords[i];
        const normalizedRecordId = normalizePatientId(record?.patient_id || '');
        
        console.log(`🔍 Checking record ${i}:`, {
          record_id: record?.id,
          record_patient_id: record?.patient_id,
          normalized_record_id: normalizedRecordId,
          normalized_search_id: normalizedSearchId,
          patient_id_match: normalizedRecordId === normalizedSearchId,
          date: record?.date,
          attendance_date: record?.attendance_date,
          status: record?.status
        });
        
        // Use STRICT matching - only normalized patient ID comparison
        if (record && normalizedRecordId === normalizedSearchId) {
          console.log(`✅ PATIENT ID MATCHES for record ${i}!`);
          const recordDate = record.date || record.attendance_date;
          if (recordDate) {
            let formattedRecordDate;
            if (typeof recordDate === 'string' && recordDate.includes('T')) {
              formattedRecordDate = recordDate.split('T')[0];
            } else {
              formattedRecordDate = format(new Date(recordDate), 'yyyy-MM-dd');
            }
            
            console.log(`🔍 Date comparison for record ${i}:`, {
              targetDate,
              recordDate,
              formattedRecordDate,
              matches: formattedRecordDate === targetDate
            });
            
            if (formattedRecordDate === targetDate) {
              existingAttendance = record;
              console.log(`🎉 FOUND EXISTING ATTENDANCE RECORD:`, existingAttendance);
              break;
            } else {
              console.log(`❌ Date mismatch for record ${i}: ${formattedRecordDate} !== ${targetDate}`);
            }
          } else {
            console.log(`❌ No date found in record ${i}`);
          }
        } else {
          console.log(`❌ Patient ID mismatch for record ${i}: "${normalizedRecordId}" !== "${normalizedSearchId}"`);
        }
      }
      
      console.log('� Step 3 - Found existing attendance:', existingAttendance);

      // STEP 4: Update or Create
      if (existingAttendance && existingAttendance.id) {
        console.log('🔄 Step 4a - UPDATING existing record with ID:', existingAttendance.id);
        console.log('🔄 Full existing record:', existingAttendance);
        
        const updateData = {
          status,
          checkInTime: format(new Date(), 'HH:mm'),
          notes: `Updated to ${status} mark`
        };
        console.log('📤 Update data:', updateData);
        
        try {
          const result = await DatabaseService.updatePatientAttendance(existingAttendance.id, updateData);
          console.log('✅ UPDATE SUCCESSFUL:', result);
          
          // Immediately update the local state for instant UI feedback
          const updatedRecords = attendanceRecords.map(record => {
            if (record.id === existingAttendance.id) {
              return {
                ...record,
                status: status,
                check_in_time: updateData.checkInTime,
                notes: updateData.notes
              };
            }
            return record;
          });
          setAttendanceRecords(updatedRecords);
          
          // Silent success - no popup notification
        } catch (updateError) {
          console.error('❌ UPDATE FAILED with error:', updateError);
          console.error('❌ Update details:', {
            id: existingAttendance.id,
            updateData,
            error: updateError.message || updateError
          });
        }
        
      } else {
        console.log('➕ Step 4b - CREATING new record');
        
        // Use the normalized patient ID for consistency
        const normalizedPatientId = normalizePatientId(selectedPatient.patient_id || selectedPatient.id);
        
        const attendanceData = {
          patientId: normalizedPatientId, // Use normalized patient_id (P0001, P0002, etc.)
          patientName: selectedPatient.name,
          date: targetDate,
          checkInTime: format(new Date(), 'HH:mm'),
          status,
          notes: `Quick ${status} mark`
        };
        console.log('📤 Create data:', attendanceData);
        
        const result = await DatabaseService.addPatientAttendance(attendanceData);
        console.log('✅ CREATE SUCCESSFUL:', result);
        
        // Immediately add to local state for instant UI feedback
        const newRecord: AttendanceRecord = {
          id: result.id?.toString() || Date.now().toString(),
          patient_id: normalizedPatientId,
          patient_name: selectedPatient.name,
          patient_phone: selectedPatient.phone || '',
          patient_image: selectedPatient.image || '',
          attendance_date: targetDate,
          date: targetDate,
          status: status,
          check_in_time: attendanceData.checkInTime,
          check_out_time: '',
          notes: attendanceData.notes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setAttendanceRecords([...attendanceRecords, newRecord]);
        
        // Silent success - no popup notification
      }

      // Reload data
      console.log('🔄 Reloading data...');
      loadData();
      
    } catch (error) {
      console.error('❌ CRITICAL ERROR in markQuickAttendance:', error);
      // Silent error - no popup notification
    }
  };

  // Quick delete attendance function
  const handleQuickDeleteAttendance = async (patientId: string) => {
    try {
      console.log('🗑️ QUICK DELETE - handleQuickDeleteAttendance called with:', { patientId });
      
      // STEP 1: Find the patient
      const selectedPatient = patients.find(p => 
        p.patient_id === patientId || p.id.toString() === patientId
      );
      console.log('🔍 Step 1 - Found patient:', selectedPatient);
      
      if (!selectedPatient) {
        console.error('❌ Patient not found with ID:', patientId);
        toast({
          title: "Error",
          description: "Patient not found",
          variant: "destructive",
        });
        return;
      }

      // STEP 2: Find existing attendance record to delete
      const targetDate = dateFilter || format(new Date(), 'yyyy-MM-dd');
      const normalizedSearchId = normalizePatientId(selectedPatient.patient_id || selectedPatient.id);
      console.log('🔍 Step 2 - Searching for attendance record:', {
        normalizedSearchId,
        targetDate
      });
      
      let existingAttendance = null;
      for (let i = 0; i < attendanceRecords.length; i++) {
        const record = attendanceRecords[i];
        const normalizedRecordId = normalizePatientId(record?.patient_id || '');
        
        if (record && normalizedRecordId === normalizedSearchId) {
          const recordDate = record.date || record.attendance_date;
          if (recordDate) {
            let formattedRecordDate;
            if (typeof recordDate === 'string' && recordDate.includes('T')) {
              formattedRecordDate = recordDate.split('T')[0];
            } else {
              formattedRecordDate = format(new Date(recordDate), 'yyyy-MM-dd');
            }
            
            if (formattedRecordDate === targetDate) {
              existingAttendance = record;
              console.log(`🎯 FOUND ATTENDANCE RECORD TO DELETE:`, existingAttendance);
              break;
            }
          }
        }
      }

      // STEP 3: Check if record exists
      if (!existingAttendance) {
        toast({
          title: "Info",
          description: `No attendance record found for ${selectedPatient.name} on ${format(new Date(targetDate), 'dd/MM/yyyy')}`,
          variant: "default",
        });
        return;
      }

      // STEP 4: Show confirmation and delete
      const confirmed = window.confirm(
        `Are you sure you want to delete the attendance record for ${selectedPatient.name} on ${format(new Date(targetDate), 'dd/MM/yyyy')}?\n\nStatus: ${existingAttendance.status}\nTime: ${existingAttendance.check_in_time || 'N/A'}`
      );

      if (!confirmed) {
        console.log('🚫 User cancelled delete operation');
        return;
      }

      console.log('🗑️ Step 4 - DELETING record with ID:', existingAttendance.id);
      
      try {
        await DatabaseService.deletePatientAttendance(existingAttendance.patient_id, existingAttendance.attendance_date || existingAttendance.date);
        console.log('✅ DELETE SUCCESSFUL');
        
        // Immediately remove from local state for instant UI feedback
        const updatedRecords = attendanceRecords.filter(record => record.id !== existingAttendance.id);
        setAttendanceRecords(updatedRecords);
        
        toast({
          title: "Success",
          description: `Attendance record deleted for ${selectedPatient.name}`,
        });
        
      } catch (deleteError) {
        console.error('❌ DELETE FAILED with error:', deleteError);
        toast({
          title: "Error",
          description: "Failed to delete attendance record",
          variant: "destructive",
        });
      }

      // Reload data to ensure consistency
      console.log('🔄 Reloading data...');
      loadData();
      
    } catch (error) {
      console.error('❌ CRITICAL ERROR in handleQuickDeleteAttendance:', error);
      toast({
        title: "Error",
        description: "An error occurred while deleting the attendance record",
        variant: "destructive",
      });
    }
  };

  // Pagination
  const currentData = filteredPatients;
  const totalPages = Math.ceil(currentData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRecords = filteredPatients.slice(startIndex, endIndex);

  if (loading) {
    return <LoadingScreen message="Loading attendance records..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Professional Header */}
        <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-2xl p-4 sm:p-6 shadow-lg mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 bg-blue-100 rounded-xl">
                <UserCheck className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Patient Attendance</h1>
                {/* Current Date Indicator */}
                {filterMonth === null && filterYear === null && (
                  <div className="flex items-center mt-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    <p className="text-sm text-gray-600">
                      Showing current date: <span className="font-semibold text-green-700">{format(new Date(dateFilter), 'dd MMM yyyy')}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:flex-shrink-0">
              <div className="flex gap-2">
                <Button 
                  type="button"
                  onClick={() => window.location.reload()}
                  disabled={loading}
                  className="modern-btn modern-btn-primary flex-1 sm:flex-none text-xs sm:text-sm px-3 sm:px-4 py-2 lg:min-w-[100px]"
                >
                  {loading ? (
                    <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  )}
                  <span className="hidden sm:inline">Refresh</span>
                  <span className="sm:hidden">↻</span>
                </Button>
                
                {/* Month & Year Filter Button */}
                <Button 
                  type="button"
                  onClick={() => setShowMonthYearDialog(true)}
                  variant="outline"
                  className="modern-btn modern-btn-secondary flex-1 sm:flex-none text-xs sm:text-sm px-3 sm:px-4 py-2 lg:min-w-[120px]"
                >
                  <CalendarDays className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">
                    {filterMonth !== null && filterYear !== null 
                      ? `${months[filterMonth]} ${filterYear}`
                      : `${months[selectedMonth]} ${selectedYear}`
                    }
                  </span>
                  <span className="sm:hidden">
                    {filterMonth !== null && filterYear !== null 
                      ? `${months[filterMonth].slice(0, 3)} ${filterYear}`
                      : `${months[selectedMonth].slice(0, 3)} ${selectedYear}`
                    }
                  </span>
                </Button>
                

                
                <Button 
                  type="button"
                  onClick={exportToExcel}
                  // variant="outline"
                  className="modern-btn modern-btn-primary flex-1 sm:flex-none text-xs sm:text-sm px-3 sm:px-4 py-2 lg:min-w-[100px]"
                >
                  <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Export</span>
                  <span className="sm:hidden">⬇</span>
                </Button>
              </div>
              
            

            </div>
          </div>
        </div>

        {/* Professional Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-purple-500"></div>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors duration-300">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Total Patients</p>
                  <p className="text-2xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors duration-300">{stats.totalActivePatients}</p>
                </div>
              </div>
              <div className="mt-4 h-1 bg-purple-200 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500"></div>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors duration-300">
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors duration-300">
                    {filterMonth !== null && filterYear !== null ? 'Total Records' : 'Total Today'}
                  </p>
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
                  <p className="text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors duration-300">
                    {filterMonth !== null && filterYear !== null ? 'Present Records' : 'Present Today'}
                  </p>
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
                  <p className="text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors duration-300">
                    {filterMonth !== null && filterYear !== null ? 'Absent Records' : 'Absent Today'}
                  </p>
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
                  <Clock3 className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors duration-300">
                    {filterMonth !== null && filterYear !== null ? 'Late Records' : 'Late Today'}
                  </p>
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
                  placeholder="Search by patient name, ID, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-green-500 focus:ring-green-500"
                />
              </div>
            </div>
            {/* Date filter - Always visible */}
            <div className="w-full lg:w-48">
              <div className="relative">
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="border-gray-300 focus:border-green-500 focus:ring-green-500 pr-10"
                  title={`Current date: ${format(new Date(), 'dd/MM/yyyy')}`}
                />
                <button
                  type="button"
                  onClick={() => setDateFilter(format(new Date(), 'yyyy-MM-dd'))}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-green-600 transition-colors duration-200"
                  title="Reset to today's date"
                >
                  <CalendarIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
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
                  <option value="Not Marked">Not Marked</option>
                </select>
              </div>
          </div>
        </div>

        {/* Attendance Table */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-gray-900">
                Active Patients Attendance
                {statusFilter !== 'All' && (
                  <span className="text-sm font-normal text-blue-600 ml-2">
                    (Showing: {statusFilter})
                  </span>
                )}
                {filterMonth !== null && filterYear !== null && (
                  <span className="text-sm font-normal text-gray-600 ml-2">
                    {statusFilter !== 'All' ? ' • ' : '('}Stats filtered by {months[filterMonth]} {filterYear}{statusFilter === 'All' ? ')' : ')'}
                  </span>
                )}
              </CardTitle>
              {/* Current Date Indicator */}
              {filterMonth === null && filterYear === null && (
                <div className="flex items-center bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                  <CalendarIcon className="h-4 w-4 text-green-600 mr-2" />
                  <span className="text-sm font-medium text-green-700">
                    Today: {format(new Date(dateFilter), 'dd MMM yyyy')}
                  </span>
                </div>
              )}
            </div>
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
                    <TableHead className="text-center font-semibold text-gray-900 py-4 px-6">Age</TableHead>
                    <TableHead className="text-center font-semibold text-gray-900 py-4 px-6">Gender</TableHead>
                    <TableHead className="text-center font-semibold text-gray-900 py-4 px-6">
                      <div className="flex items-center justify-center">
                        <Activity className="w-4 h-4 text-gray-600 mr-2" />
                        {filterMonth !== null && filterYear !== null ? 'Latest Status' : 'Today\'s Status'}
                      </div>
                    </TableHead>
                    <TableHead className="text-center font-semibold text-gray-900 py-4 px-6">
                      <div className="flex items-center justify-center">
                        <Clock3 className="w-4 h-4 text-gray-600 mr-2" />
                        {filterMonth !== null && filterYear !== null ? 'Latest Time' : 'Check-in Time'}
                      </div>
                    </TableHead>
                    <TableHead className="text-center font-semibold text-gray-900 py-4 px-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentRecords.length > 0 ? (
                    currentRecords.map((record, index) => {
                      // Add safety checks for all record properties
                      if (!record) return null;
                      
                      // Always render patient row
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
                                          // console.log('❌ Image failed to load for patient:', record.name);
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
                              <span className="font-medium text-blue-600">{record.patient_id || record.id || 'N/A'}</span>
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
                              <div className="flex items-center justify-center">
                                {(() => {
                                  const patientId = normalizePatientId(record.patient_id || record.id);
                                  
                                  // Use selected date or today's date
                                  const targetDate = dateFilter || format(new Date(), 'yyyy-MM-dd');
                                  const attendanceForDate = getAttendanceForDate(patientId, targetDate);
                                  
                                  // Debug logging
                                  console.log('🔍 Status Debug for patient:', record.name, {
                                    patientId: patientId,
                                    targetDate: targetDate,
                                    attendanceForDate: attendanceForDate,
                                    attendanceRecordsCount: attendanceRecords.length,
                                    dateFilter: dateFilter
                                  });
                                  
                                  if (attendanceForDate) {
                                    const statusIcons = {
                                      Present: <CheckCircle className="w-4 h-4 text-green-600 mr-2" />,
                                      Absent: <XCircle className="w-4 h-4 text-red-600 mr-2" />,
                                      Late: <Clock3 className="w-4 h-4 text-yellow-600 mr-2" />
                                    };
                                    
                                    return (
                                      <div className="flex items-center">
                                        {statusIcons[attendanceForDate.status]}
                                        <Badge className={getStatusBadge(attendanceForDate.status)}>
                                          {attendanceForDate.status}
                                        </Badge>
                                      </div>
                                    );
                                  } else {
                                    return (
                                      <div className="flex items-center">
                                        <CalendarIcon className="w-4 h-4 text-gray-400 mr-2" />
                                        <Badge variant="secondary" className="bg-gray-100 text-gray-600 border border-gray-300">
                                          Not Marked
                                        </Badge>
                                      </div>
                                    );
                                  }
                                })()}
                              </div>
                            </TableCell>
                            <TableCell className="text-center py-4 px-6">
                              <div className="flex items-center justify-center">
                                {(() => {
                                  const patientId = normalizePatientId(record.patient_id || record.id);
                                  
                                  // Use selected date or today's date
                                  const targetDate = dateFilter || format(new Date(), 'yyyy-MM-dd');
                                  const attendanceForDate = getAttendanceForDate(patientId, targetDate);
                                  
                                  // Debug logging
                                  console.log('🕐 Time Debug for patient:', record.name, {
                                    patientId: patientId,
                                    targetDate: targetDate,
                                    attendanceForDate: attendanceForDate,
                                    checkInTime: attendanceForDate?.check_in_time
                                  });
                                  
                                  if (attendanceForDate && attendanceForDate.check_in_time) {
                                    // Get the time value
                                    const timeValue = attendanceForDate.check_in_time;
                                    
                                    let formattedTime = '--:-- --';
                                    let isLate = false;
                                    
                                    // Handle different time formats
                                    if (timeValue.includes(':')) {
                                      // Format: HH:mm or HH:mm:ss
                                      const [hours, minutes] = timeValue.split(':');
                                      const hour24 = parseInt(hours);
                                      const hour12 = hour24 % 12 || 12;
                                      const ampm = hour24 >= 12 ? 'PM' : 'AM';
                                      formattedTime = `${hour12}:${minutes} ${ampm}`;
                                      
                                      // Determine if late (after 9 AM)
                                      isLate = attendanceForDate.status === 'Late' || (hour24 >= 9);
                                    } else {
                                      formattedTime = timeValue; // Return as-is if not in expected format
                                    }
                                    
                                    return (
                                      <div className="flex items-center">
                                        <Clock3 className={`w-4 h-4 mr-2 ${isLate ? 'text-yellow-600' : 'text-green-600'}`} />
                                        <span className={`text-sm font-medium ${isLate ? 'text-yellow-700' : 'text-green-700'}`}>
                                          {formattedTime}
                                        </span>
                                      </div>
                                    );
                                  } else {
                                    return (
                                      <div className="flex items-center">
                                        <Clock3 className="w-4 h-4 text-gray-400 mr-2" />
                                        <span className="text-sm text-gray-500">
                                          --:-- --
                                        </span>
                                      </div>
                                    );
                                  }
                                })()}
                              </div>
                            </TableCell>
                            <TableCell className="text-center py-4 px-6">
                              <div className="flex items-center justify-center space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => markQuickAttendance(normalizePatientId(record.patient_id || record.id), 'Present')}
                                  className="h-8 w-8 p-0 border-green-300 hover:border-green-500 hover:bg-green-50 hover:scale-105 transition-all duration-300"
                                >
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => markQuickAttendance(normalizePatientId(record.patient_id || record.id), 'Late')}
                                  className="h-8 w-8 p-0 border-yellow-300 hover:border-yellow-500 hover:bg-yellow-50 hover:scale-105 transition-all duration-300"
                                >
                                  <Clock3 className="h-4 w-4 text-yellow-600" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => markQuickAttendance(normalizePatientId(record.patient_id || record.id), 'Absent')}
                                  className="h-8 w-8 p-0 border-red-300 hover:border-red-500 hover:bg-red-50 hover:scale-105 transition-all duration-300"
                                >
                                  <XCircle className="h-4 w-4 text-red-600" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleQuickDeleteAttendance(normalizePatientId(record.patient_id || record.id))}
                                  className="h-8 w-8 p-0 border-gray-300 hover:border-red-500 hover:bg-red-50 hover:scale-105 transition-all duration-300"
                                  title="Delete attendance record"
                                >
                                  <Trash2 className="h-4 w-4 text-gray-600 hover:text-red-600 transition-colors duration-300" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <div className="flex flex-col items-center justify-center space-y-4">
                          <div className="p-4 bg-gray-100 rounded-full">
                            <UserCheck className="h-8 w-8 text-gray-400" />
                          </div>
                          <div className="text-center">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                              No active patients found
                            </h3>
                            <p className="text-gray-500">
                              No active patients match your search criteria.
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
                  className="modern-btn modern-btn-secondary flex-1 sm:flex-none text-xs sm:text-sm px-3 sm:px-4 py-2 lg:min-w-[120px]"
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
          }}
          title="Select Month & Year"
          description="Filter attendance records by specific month and year"
          previewText="attendance records"
        />
      </div>
    </div>
  );
};

export default PatientAttendance;
