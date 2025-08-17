import React, { useState, useMemo, useEffect } from 'react';
import { Eye, Edit, Plus, Search, Download, Printer, User, CreditCard, CheckCircle, RefreshCw, Receipt, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { usePatientPayments } from '@/hooks/usePatientPayments';
import { useNavigate } from 'react-router-dom';
import { DatabaseService } from '@/services/databaseService';
import { patientsAPI } from '@/utils/api';

interface Patient {
  id: string;
  name: string;
  phone: string;
  email: string;
  fees?: number;
  monthlyFees?: number;
  totalFees?: number;
  pickupCharge?: number;
  pickup_charge?: number;
  pickup?: number;
  bloodTest?: number;
  blood_test?: number;
  blood?: number;
  otherFees?: number; // New field for auto-calculated other fees
  totalAmount?: number; // Database total amount field
  admissionDate?: string;
  admission_date?: string;
  created_at?: string;
  payAmount?: number;
  pay_amount?: number;
  balance?: number;
  registrationId?: string;
  registration_id?: string;
  photo?: string;
  photoUrl?: string;
}

export default function PatientPaymentFees() {
  // Update payment logic (stub)
  const handleUpdatePayment = async () => {
    toast({
      title: "Success",
      description: "Payment updated successfully (not implemented)",
    });
    setIsEditPaymentOpen(false);
  };
  // All state and handlers must be defined before the return statement
  const [searchTerm, setSearchTerm] = useState('');
  const monthNames = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];
  const today = new Date();
  const currentMonthValue = monthNames[today.getMonth()];
  const [selectedMonth, setSelectedMonth] = useState(currentMonthValue);
  
  // Month and year state for filtering
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentYear = new Date().getFullYear();
  const [dialogSelectedMonth, setDialogSelectedMonth] = useState(new Date().getMonth());
  const [dialogSelectedYear, setDialogSelectedYear] = useState(currentYear);
  const [showMonthYearDialog, setShowMonthYearDialog] = useState(false);
  const [filterMonth, setFilterMonth] = useState<number | null>(null);
  const [filterYear, setFilterYear] = useState<number | null>(null);
  
  const [viewingPatient, setViewingPatient] = useState<any>(null);
  const [editingPatient, setEditingPatient] = useState<any>(null);
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditPaymentOpen, setIsEditPaymentOpen] = useState(false);
  const [isAddFeesOpen, setIsAddFeesOpen] = useState(false);
  const [selectedPatientForFees, setSelectedPatientForFees] = useState<any>(null);
  const [fees, setFees] = useState([]);
  const [newFee, setNewFee] = useState({
    fee: '',
    date: '',
    amount: ''
  });
  const [editingFee, setEditingFee] = useState<any>(null);
  const [isEditFeeOpen, setIsEditFeeOpen] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [localStorageVersion, setLocalStorageVersion] = useState(0);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const [newPayment, setNewPayment] = useState({
    patientId: '',
    patientName: '',
    amount: '',
    comment: '',
    paymentMode: ''
  });
  const [editPayment, setEditPayment] = useState({
    amount: '',
    comment: '',
    paymentMode: ''
  });
  const { toast } = useToast();
  const { 
    patientPayments, 
    loading,
    error,
    addPayment, 
    updatePatientPaymentConfig,
    getPatientPaymentSummary, 
    getOverallTotals,
    refreshData 
  } = usePatientPayments();
  const navigate = useNavigate();

  // Function to format patient ID as P0001
  const formatPatientId = (id: string | number): string => {
    // Convert to number, removing any existing P prefix and leading zeros
    const numericId = typeof id === 'string' ? parseInt(id.replace(/^P0*/, '')) : id;
    return `P${numericId.toString().padStart(4, '0')}`;
  };

  // Helper function to calculate exact balance for any month
  const calculateMonthBalance = (patientData: any, patient: any, admission: Date, monthIndex: number, yearValue: number) => {
    if (!patientData || !patient.payments || !admission) return 0;

    // Safety check: Don't go back more than 24 months or before admission date
    const admissionMonth = admission.getMonth();
    const admissionYear = admission.getFullYear();
    
    // If requested month is before admission, return 0
    if (yearValue < admissionYear || (yearValue === admissionYear && monthIndex < admissionMonth)) {
      return 0;
    }

    // Monthly Fees (constant every month)
    const monthlyFees = Number(patientData?.fees || 0);
    
    // Other Fees (only in joining month)
    let otherFees = 0;
    if (admission.getMonth() === monthIndex && admission.getFullYear() === yearValue) {
      // Use the database otherFees column if available, otherwise calculate manually
      otherFees = Number(patientData?.otherFees || 0);
      if (otherFees === 0) {
        // Fallback to manual calculation for existing data
        const pickup = Number(patientData?.pickupCharge || 0);
        const blood = Number(patientData?.bloodTest || 0);
        otherFees = pickup + blood;
      }
    }

    // Carry Forward (previous month's balance, 0 for joining month)
    let carryForward = 0;
    if (!(admission.getFullYear() === yearValue && admission.getMonth() === monthIndex)) {
      // Calculate previous month
      let prevMonth = monthIndex - 1;
      let prevYear = yearValue;
      if (prevMonth < 0) {
        prevMonth = 11;
        prevYear -= 1;
      }
      
      // Only recurse if the previous month is not before admission
      if (prevYear > admissionYear || (prevYear === admissionYear && prevMonth >= admissionMonth)) {
        carryForward = calculateMonthBalance(patientData, patient, admission, prevMonth, prevYear);
      }
    }

    // Paid Amount: Only for joining month
    let paidAmount = 0;
    
    // Only use paid amount for joining month
    if (admission.getMonth() === monthIndex && admission.getFullYear() === yearValue) {
      paidAmount = Number(patientData?.payAmount || 0);
    }
    // For subsequent months, no current paid amount (paidAmount remains 0)

    // Calculate total balance based on month type
    let totalBalance = 0;
    if (admission.getMonth() === monthIndex && admission.getFullYear() === yearValue) {
      // JOINING MONTH: Monthly Fees + Other Fees - Paid Amount (no carry forward)
      totalBalance = Math.max(0, monthlyFees + otherFees - paidAmount);
    } else {
      // SUBSEQUENT MONTHS: Monthly Fees + Carry Forward (no other fees, no paid amount)
      totalBalance = Math.max(0, monthlyFees + carryForward);
    }
    
    return totalBalance;
  };

  // Select patient from dropdown
  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setNewPayment(prev => ({
      ...prev,
      patientId: patient.id,
      patientName: patient.name
    }));
    setIsPatientDropdownOpen(false);
  };

  // Add payment logicg
  const handleAddPayment = async () => {
    // Always get patientId and patientName from selectedPatient if present
    let patientId = newPayment.patientId;
    let patientName = newPayment.patientName;
    if (selectedPatient) {
      patientId = selectedPatient.id;
      patientName = selectedPatient.name;
    }
    // If still not set, error
    if (!patientId || !newPayment.amount || !newPayment.comment || !newPayment.paymentMode) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    try {
      const amount = parseFloat(newPayment.amount);
      await addPayment(patientId, {
        date: format(new Date(), 'yyyy-MM-dd'),
        amount: amount,
        comment: newPayment.comment,
        paymentMode: newPayment.paymentMode,
        balanceRemaining: 0 // Will be calculated in the hook
      });
      setIsAddPaymentOpen(false);
      setNewPayment({
        patientId: '',
        patientName: '',
        amount: '',
        comment: '',
        paymentMode: ''
      });
      toast({
        title: "Success",
        description: "Payment added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add payment",
        variant: "destructive",
      });
    }
  };

  // Load patients using the same logic as PatientList for consistency
  const loadPatients = async () => {
    try {
      console.log('🔗 Loading patients via unified API...');
      // Try unified API first, fall back to DatabaseService if needed
      let data;
      try {
        data = await patientsAPI.getAll();
        console.log('✅ Patients loaded via unified API:', data.length, 'patients');
      } catch (apiError) {
        console.warn('⚠️ Unified API failed, falling back to DatabaseService:', apiError.message);
        data = await DatabaseService.getAllPatients();
        console.log('✅ Patients loaded via DatabaseService:', data.length, 'patients');
      }
      
      if (!data || !Array.isArray(data)) {
        console.warn('⚠️ Invalid patient data received:', data);
        setPatients([]);
        toast({
          title: "Warning",
          description: "No patient data received from server",
          variant: "destructive"
        });
        return;
      }

      // Parse dates using the same logic as PatientList
      const parseDateFromDDMMYYYY = (dateStr: any): Date | null => {
        if (!dateStr) return null;
        
        if (dateStr instanceof Date) {
          if (isNaN(dateStr.getTime())) return null;
          const year = dateStr.getFullYear();
          if (year < 1900 || year > 2100) return null;
          return dateStr;
        }
        
        if (typeof dateStr === 'string' && dateStr.match(/^\d{2}-\d{2}-\d{4}$/)) {
          const [day, month, year] = dateStr.split('-');
          const parsedYear = parseInt(year);
          if (parsedYear < 1900 || parsedYear > 2100) return null;
          return new Date(parsedYear, parseInt(month) - 1, parseInt(day));
        }
        
        if (typeof dateStr === 'string' && dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
          const [year, month, day] = dateStr.split('-');
          const parsedYear = parseInt(year);
          if (parsedYear < 1900 || parsedYear > 2100) return null;
          return new Date(parsedYear, parseInt(month) - 1, parseInt(day));
        }
        
        try {
          const parsed = new Date(dateStr);
          if (isNaN(parsed.getTime())) return null;
          const year = parsed.getFullYear();
          if (year < 1900 || year > 2100) return null;
          return parsed;
        } catch {
          return null;
        }
      };

      const parsedPatients = data.map((p: any) => {
        const patientId = p.id && String(p.id).startsWith('P') 
          ? p.id 
          : `P${(p.originalId || p.id || 1).toString().padStart(4, '0')}`;
        
        const fees = parseFloat(p.fees) || 0;
        const bloodTest = parseFloat(p.bloodTest) || 0;
        const pickupCharge = parseFloat(p.pickupCharge) || 0;
        const otherFees = parseFloat(p.otherFees) || (bloodTest + pickupCharge); // Use DB value or fallback to calculation
        const payAmount = parseFloat(p.payAmount) || 0;
        const totalAmount = parseFloat(p.totalAmount) || (fees + otherFees);
        const balance = parseFloat(p.balance) || (totalAmount - payAmount);
        
        return {
          id: patientId,
          name: p.name,
          phone: p.phone || '',
          email: p.email || '',
          fees: fees,
          monthlyFees: fees,
          totalFees: totalAmount,
          pickupCharge: pickupCharge,
          pickup_charge: pickupCharge,
          pickup: pickupCharge,
          bloodTest: bloodTest,
          blood_test: bloodTest,
          blood: bloodTest,
          otherFees: otherFees, // Add the otherFees field from database
          admissionDate: formatDateForBackend(parseDateFromDDMMYYYY(p.admissionDate)),
          admission_date: formatDateForBackend(parseDateFromDDMMYYYY(p.admissionDate)),
          created_at: p.created_at,
          payAmount: payAmount,
          pay_amount: payAmount,
          balance: balance, // Use database balance value
          totalAmount: totalAmount, // Use database totalAmount
          registrationId: p.originalId || parseInt(String(p.id || patientId).replace(/\D/g, '')) || 1,
          registration_id: p.originalId || parseInt(String(p.id || patientId).replace(/\D/g, '')) || 1,
          photo: p.photo || '',
          photoUrl: p.photo || '',
          status: p.status || 'Active'
        };
      });

      // Filter to only show active patients
      const activePatients = parsedPatients.filter(patient => 
        patient.status === 'Active' || !patient.status || patient.status === ''
      );
      
      setPatients(activePatients);
      setCurrentPage(1);
      console.log(`✅ Loaded ${activePatients.length} active patients out of ${parsedPatients.length} total patients`);
      
    } catch (error) {
      console.error('❌ Error loading patients:', error);
      setPatients([]);
      toast({
        title: "Error",
        description: `Failed to load patients: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  // Utility function to format date for backend (DD-MM-YYYY)
  const formatDateForBackend = (date: Date | null): string => {
    if (!date) return '';
    if (date instanceof Date && !isNaN(date.getTime())) {
      const year = date.getFullYear();
      if (year < 1900 || year > 2100) return '';
      return format(date, 'dd-MM-yyyy');
    }
    return '';
  };

  useEffect(() => {
    loadPatients();
  }, []);

  // Refresh data when window gains focus (user returns from another tab/page)
  useEffect(() => {
    const handleFocus = () => {
      console.log('🔄 PatientPaymentFees: Window focused, refreshing patient data...');
      loadPatients();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Auto-refresh every 30 seconds to stay synchronized with PatientList
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 PatientPaymentFees: Auto-refreshing patient data...');
      loadPatients();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Add effect to refresh data when component becomes visible or localStorage changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('PatientPaymentFees: Page became visible, refreshing data...');
        setLocalStorageVersion(prev => prev + 1); // Force useMemo recalculation
        refreshData();
        loadPatients(); // Also refresh patients list
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'patients' || e.key === 'patientPaymentRecords') {
        console.log('PatientPaymentFees: localStorage changed, refreshing data...');
        setLocalStorageVersion(prev => prev + 1); // Trigger useMemo recalculation
        refreshData();
        // Also reload patients list using the same logic
        loadPatients();
      }
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [refreshData]);

  // Enhanced patient summary with month/carry forward logic
  const enhancedPatientSummary = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Use the patients state instead of getPatientPaymentSummary to include all active patients
    return patients.map(patientData => {
      // Parse admission date with multiple format support
      const parseDateFromMultipleFormats = (dateStr: any): Date | null => {
        if (!dateStr) return null;
        
        if (dateStr instanceof Date) {
          if (isNaN(dateStr.getTime())) return null;
          const year = dateStr.getFullYear();
          if (year < 1900 || year > 2100) return null;
          return dateStr;
        }
        
        // Handle DD-MM-YYYY format
        if (typeof dateStr === 'string' && dateStr.match(/^\d{2}-\d{2}-\d{4}$/)) {
          const [day, month, year] = dateStr.split('-');
          const parsedYear = parseInt(year);
          if (parsedYear < 1900 || parsedYear > 2100) return null;
          return new Date(parsedYear, parseInt(month) - 1, parseInt(day));
        }
        
        // Handle DD/MM/YYYY format
        if (typeof dateStr === 'string' && dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
          const [day, month, year] = dateStr.split('/');
          const parsedYear = parseInt(year);
          if (parsedYear < 1900 || parsedYear > 2100) return null;
          return new Date(parsedYear, parseInt(month) - 1, parseInt(day));
        }
        
        // Handle YYYY-MM-DD format
        if (typeof dateStr === 'string' && dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
          const [year, month, day] = dateStr.split('-');
          const parsedYear = parseInt(year);
          if (parsedYear < 1900 || parsedYear > 2100) return null;
          return new Date(parsedYear, parseInt(month) - 1, parseInt(day));
        }
        
        try {
          const parsed = new Date(dateStr);
          if (isNaN(parsed.getTime())) return null;
          const year = parsed.getFullYear();
          if (year < 1900 || year > 2100) return null;
          return parsed;
        } catch {
          return null;
        }
      };

      const admissionDate = patientData.admissionDate || patientData.created_at || patientData.admission_date;
      const admission = parseDateFromMultipleFormats(admissionDate);
      const admissionMonth = admission ? admission.getMonth() : null;
      const admissionYear = admission ? admission.getFullYear() : null;
      
      // Find any existing payment summary for this patient
      const existingPaymentSummary = getPatientPaymentSummary().find(p => 
        p.patientId === patientData.id || 
        p.patientId === patientData.registrationId ||
        p.name === patientData.name
      );

      // Get fees and costs from database values
      const monthlyFees = Number(patientData.fees || 0);
      const bloodTest = Number(patientData.bloodTest || 0);
      const pickupCharge = Number(patientData.pickupCharge || 0);
      const otherFees = Number(patientData.otherFees || 0) || (bloodTest + pickupCharge); // Use DB value or fallback
      const totalFees = Number(patientData.totalAmount || 0) || (monthlyFees + otherFees); // Use DB value or fallback
      const balance = Number(patientData.balance || 0);
      const payAmount = Number(patientData.payAmount || 0); // Use database payAmount directly

      return {
        patientId: patientData.id,
        registrationId: patientData.registrationId || patientData.id,
        name: patientData.name,
        phone: patientData.phone,
        admissionDate: admission ? admission.toISOString().split('T')[0] : '',
        admissionMonth,
        admissionYear,
        monthlyFees,
        bloodTest,
        pickupCharge,
        otherFees,
        totalFees,
        balance,
        paidAmount: payAmount, // Use database payAmount directly
        payments: existingPaymentSummary?.payments || [],
        status: 'Active'
      };
    });
  }, [patients, getPatientPaymentSummary, monthNames, patientPayments, localStorageVersion]);

  // Filter and search logic for enhanced summary
  const filteredPatients = useMemo(() => {
    // Determine selected month index and year
    let selectedMonthIndex = null;
    let selectedYear = today.getFullYear();
    
    // Use filter dialog selections if set
    if (filterMonth !== null && filterYear !== null) {
      selectedMonthIndex = filterMonth;
      selectedYear = filterYear;
    } else if (selectedMonth && selectedMonth !== 'all') {
      selectedMonthIndex = monthNames.indexOf(selectedMonth.toLowerCase());
    }

    return enhancedPatientSummary.filter(patient => {
      // Search filter
      const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (patient.registrationId && patient.registrationId.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // If no month/year filter is selected, show all patients that match search
      if (selectedMonthIndex === null) {
        return matchesSearch;
      }
      
      console.log(`🔍 Filtering by month ${selectedMonthIndex} (${months[selectedMonthIndex]}) and year ${selectedYear}`);
      console.log(`📅 Will show all patients from beginning up to ${months[selectedMonthIndex]} ${selectedYear}`);
      
      // If month/year filter is selected, show patients who were admitted from beginning up to the selected month/year
      let includePatient = true;
      let admissionDate = patient.admissionDate;
      if (admissionDate) {
        const admission = new Date(admissionDate);
        console.log(`👤 ${patient.name}: Admitted ${admission.getMonth()}/${admission.getFullYear()} vs Filter up to ${selectedMonthIndex}/${selectedYear}`);
        
        // Include if admission is on or before the selected month/year
        if (
          admission.getFullYear() > selectedYear ||
          (admission.getFullYear() === selectedYear && admission.getMonth() > selectedMonthIndex)
        ) {
          includePatient = false;
          console.log(`❌ ${patient.name}: Excluded - admitted after ${months[selectedMonthIndex]} ${selectedYear}`);
        } else {
          console.log(`✅ ${patient.name}: Included - admitted on or before ${months[selectedMonthIndex]} ${selectedYear}`);
        }
      } else {
        // If no admission date, exclude from filtered results when month filter is active
        includePatient = false;
        console.log(`❌ ${patient.name}: Excluded - no admission date`);
      }
      
      return includePatient && matchesSearch;
    }).sort((a, b) => {
      // Sort by Patient ID in ascending order (handle P0001, P001, or numeric format)
      const patientIdA = String(a.patientId || '').trim();
      const patientIdB = String(b.patientId || '').trim();
      
      // Extract numeric part from Patient ID and compare
      const getNumericPart = (id: string): number => {
        // Handle P0001, P001, or plain numeric format
        if (id.toUpperCase().startsWith('P')) {
          const numericPart = id.substring(1);
          return parseInt(numericPart) || 0;
        }
        // Handle plain numeric IDs
        return parseInt(id) || 0;
      };
      
      const numA = getNumericPart(patientIdA);
      const numB = getNumericPart(patientIdB);
      
      // Primary sort: by numeric value
      if (numA !== numB) {
        return numA - numB;
      }
      
      // Secondary sort: by original string (in case of ties)
      return patientIdA.localeCompare(patientIdB);
    });
  }, [enhancedPatientSummary, searchTerm, selectedMonth, monthNames, today, filterMonth, filterYear]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedMonth, filterMonth, filterYear]);

  // Calculate total pages for pagination
  const totalPages = Math.ceil(filteredPatients.length / rowsPerPage);

  // Totals for new table - calculated based on selected month/year
  const totals = useMemo(() => {
    // Get the selected month/year for calculations
    let selectedMonthIndex = filterMonth;
    let selectedYear = filterYear;
    
    if (selectedMonthIndex === null || selectedYear === null) {
      // If no filter selected, use current month/year
      selectedMonthIndex = today.getMonth();
      selectedYear = today.getFullYear();
    }
    
    return filteredPatients.reduce((acc, patient) => {
      // Get patient data from loaded patients state
      const patientData = patients.find((p) =>
        (p.id && p.id === patient.patientId) ||
        (p.registrationId && p.registrationId === patient.patientId) ||
        (p.name && p.name === patient.name)
      );

      if (!patientData || !patient.payments) {
        return acc;
      }

      // Admission date
      const admissionDateRaw = patientData?.admissionDate || patientData?.created_at || patientData?.admission_date;
      const admission = admissionDateRaw ? new Date(admissionDateRaw) : null;

      if (!admission) {
        return acc;
      }

      // Monthly Fees
      const monthlyFees = Number(patientData?.fees || patientData?.monthlyFees || patientData?.totalFees || 0);

      // Other Fees (only for joining month)
      let otherFeesValue = 0;
      if (
        admission.getMonth() === selectedMonthIndex &&
        admission.getFullYear() === selectedYear
      ) {
        // Use the database otherFees column if available, otherwise calculate manually
        otherFeesValue = Number(patientData?.otherFees || 0);
        if (otherFeesValue === 0) {
          // Fallback to manual calculation for existing data
          const pickup = Number(patientData?.pickupCharge || 0);
          const blood = Number(patientData?.bloodTest || 0);
          otherFeesValue = pickup + blood;
        }
      }

      // Carry Forward (previous month's balance)
      let carryForward = 0;
      if (!(admission.getFullYear() === selectedYear && admission.getMonth() === selectedMonthIndex)) {
        // Calculate previous month
        let prevMonth = selectedMonthIndex - 1;
        let prevYear = selectedYear;
        if (prevMonth < 0) {
          prevMonth = 11;
          prevYear -= 1;
        }
        
        // Use the calculateMonthBalance function
        carryForward = calculateMonthBalance(patientData, patient, admission, prevMonth, prevYear);
      }

      // Paid Amount for selected month
      let paidAmount = 0;
      if (
        admission.getMonth() === selectedMonthIndex &&
        admission.getFullYear() === selectedYear
      ) {
        // Joining month: include all payments + PatientList Pay Amount
        const joinMonthPayments = patient.payments.filter((p) => {
          const d = new Date(p.date);
          return d.getFullYear() === selectedYear && d.getMonth() === selectedMonthIndex;
        });
        paidAmount = joinMonthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        
        const payAmount = Number(patientData?.payAmount || 0);
        if (payAmount > 0) {
          const alreadyIncluded = joinMonthPayments.some((p) => Number(p.amount) === payAmount);
          if (!alreadyIncluded) {
            paidAmount += payAmount;
          }
        }
      } else {
        // Other months: only payments in selected month
        const currPayments = patient.payments.filter((p) => {
          const d = new Date(p.date);
          return d.getFullYear() === selectedYear && d.getMonth() === selectedMonthIndex;
        });
        paidAmount = currPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      }

      // Balance calculation
      const balance = Math.max(0, monthlyFees + otherFeesValue + carryForward - paidAmount);
      
      return {
        totalFees: acc.totalFees + monthlyFees + otherFeesValue,
        totalBalance: acc.totalBalance + balance,
        total: acc.total + monthlyFees + otherFeesValue + carryForward
      };
    }, { totalFees: 0, totalBalance: 0, total: 0 });
  }, [filteredPatients, filterMonth, filterYear, today, patients, calculateMonthBalance]);

  const handleViewPayments = (patient: any) => {
    setViewingPatient(patient);
    setIsViewDialogOpen(true);
  };

  const handleAddFees = async (patient: any) => {
    setSelectedPatientForFees(patient);
    setIsAddFeesOpen(true);
    // Fetch existing fees for this patient
    await fetchFees(patient.patientId);
  };

  const fetchFees = async (patientId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/fees?patientId=${patientId}`);
      if (response.ok) {
        const feesData = await response.json();
        setFees(feesData);
      } else {
        console.error('Failed to fetch fees');
        setFees([]);
      }
    } catch (error) {
      console.error('Error fetching fees:', error);
      setFees([]);
    }
  };

  const handleAddFee = async () => {
    if (!newFee.fee.trim() || !newFee.date || !newFee.amount) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/fees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newFee,
          patientId: selectedPatientForFees?.patientId,
          amount: parseFloat(newFee.amount)
        }),
      });

      if (response.ok) {
        const newFeeEntry = await response.json();
        setFees(prev => [...prev, newFeeEntry]);
        setNewFee({ fee: '', date: '', amount: '' });
        toast({
          title: "Success",
          description: "Fee added successfully",
        });
      } else {
        throw new Error('Failed to add fee');
      }
    } catch (error) {
      console.error('Error adding fee:', error);
      toast({
        title: "Error",
        description: "Failed to add fee",
        variant: "destructive",
      });
    }
  };

  const handleEditFee = (fee: any) => {
    setEditingFee(fee);
    setIsEditFeeOpen(true);
  };

  const handleUpdateFee = async (updatedFee: any) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/fees/${updatedFee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...updatedFee,
          amount: parseFloat(updatedFee.amount)
        }),
      });

      if (response.ok) {
        setFees(prev => prev.map(fee => fee.id === updatedFee.id ? updatedFee : fee));
        setIsEditFeeOpen(false);
        setEditingFee(null);
        toast({
          title: "Success",
          description: "Fee updated successfully",
        });
      } else {
        throw new Error('Failed to update fee');
      }
    } catch (error) {
      console.error('Error updating fee:', error);
      toast({
        title: "Error",
        description: "Failed to update fee",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFee = async (feeId: number) => {
    if (!confirm('Are you sure you want to delete this fee?')) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/fees/${feeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setFees(prev => prev.filter(fee => fee.id !== feeId));
        toast({
          title: "Success",
          description: "Fee deleted successfully",
        });
      } else {
        throw new Error('Failed to delete fee');
      }
    } catch (error) {
      console.error('Error deleting fee:', error);
      toast({
        title: "Error",
        description: "Failed to delete fee",
        variant: "destructive",
      });
    }
  };

  const handleEditPayments = (patient: any, payment: any) => {

    setEditingPatient(patient);
    setEditPayment({
      amount: payment.amount.toString(),
      comment: payment.comment,
      paymentMode: payment.paymentMode || 'Cash'
    });
    setIsEditPaymentOpen(true);
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Professional Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 hover:shadow-md hover:scale-[1.01] transition-all duration-300 cursor-pointer">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center transition-all duration-300 hover:bg-green-700 hover:scale-110">
                <CreditCard className="w-6 h-6 text-white transition-transform duration-300 hover:rotate-3" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 transition-colors duration-300 hover:text-green-600">Patient Payment Fees - Active Patients</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Showing {patients.length} active patients with payment records
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button 
                onClick={printReport}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:shadow-lg hover:scale-105"
              >
                <Printer className="h-4 w-4" />
                <span className="font-medium">Print Report</span>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Professional Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-green-500"></div>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors duration-300">
                  <Receipt className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Total Fees</p>
                  <p className="text-2xl font-bold text-gray-900 group-hover:text-green-600 transition-colors duration-300">₹{totals.totalFees.toLocaleString()}</p>
                </div>
              </div>
              <div className="mt-4 h-1 bg-green-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-orange-500"></div>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors duration-300">
                  <CreditCard className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Total Balance</p>
                  <p className="text-2xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors duration-300">₹{totals.totalBalance.toLocaleString()}</p>
                </div>
              </div>
              <div className="mt-4 h-1 bg-orange-200 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500"></div>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors duration-300">
                  <CheckCircle className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">₹{totals.total.toLocaleString()}</p>
                </div>
              </div>
              <div className="mt-4 h-1 bg-blue-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Month Filter Summary Card - Show when filter is active */}
        {(filterMonth !== null && filterYear !== null) && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg shadow-sm border border-green-200 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <User className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Patients up to {months[filterMonth]} {filterYear}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''} admitted from start to {months[filterMonth]} {filterYear}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Cumulative Monthly Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  ₹{filteredPatients.reduce((sum, p) => sum + (p.monthlyFees || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name or registration ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 border-gray-200 hover:border-gray-300 transition-colors duration-300"
              />
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={() => setShowMonthYearDialog(true)}
                variant="outline"
                className="flex-1 h-12 border-gray-200 hover:border-green-300 hover:bg-green-50 hover:text-green-600 transition-all duration-300"
              >
                {filterMonth !== null && filterYear !== null 
                  ? `${months[filterMonth]} ${filterYear}`
                  : 'Filter by Month'
                }
              </Button>
            </div>
            
            <div className="flex space-x-2">
              {(filterMonth !== null || filterYear !== null) && (
                <Button
                  onClick={() => {
                    setFilterMonth(null);
                    setFilterYear(null);
                  }}
                  variant="outline"
                  className="flex-1 h-12 border-gray-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition-all duration-300"
                >
                  Clear Filter
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Carry Forward Information Card */}
        {filterMonth !== null && filterYear !== null && (
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-orange-600 text-sm font-semibold">💰</span>
              </div>
              <div>
                <h3 className="text-orange-800 font-semibold text-sm mb-1">Carry Forward Balance System</h3>
                <p className="text-orange-700 text-sm leading-relaxed">
                  Unpaid amounts from previous months are automatically carried forward. 
                  For example: If a patient joined in March and didn't pay the March fees, 
                  that amount will be added to April's balance, and so on until payment is made.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Patient Payment Table */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Patient Payment Summary
                  {(filterMonth !== null && filterYear !== null) && (
                    <span className="text-green-600 ml-2">
                      - Up to {months[filterMonth]} {filterYear}
                    </span>
                  )}
                </h2>
                {(filterMonth !== null && filterYear !== null) && (
                  <p className="text-sm text-gray-600 mt-1">
                    Showing all patients admitted from beginning up to {months[filterMonth]} {filterYear} ({filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''})
                  </p>
                )}
                {(filterMonth === null || filterYear === null) && (
                  <p className="text-sm text-gray-600 mt-1">
                    Showing all active patients ({filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''})
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-200">
                    <TableHead className="text-gray-700 font-semibold text-center">S NO</TableHead>
                    <TableHead className="text-gray-700 font-semibold text-center">Photo</TableHead>
                    <TableHead className="text-gray-700 font-semibold text-center">Patient ID</TableHead>
                    <TableHead className="text-gray-700 font-semibold text-center">Patient Name</TableHead>
                    <TableHead className="text-gray-700 font-semibold text-center">Admission Date</TableHead>
                    <TableHead className="text-gray-700 font-semibold text-center">Monthly Fees</TableHead>
                    <TableHead className="text-gray-700 font-semibold text-center">Other Fees</TableHead>
                    <TableHead className="text-gray-700 font-semibold text-center" title="Unpaid amounts carried forward from previous months">
                      Carry Forward 💰
                    </TableHead>
                    <TableHead className="text-gray-700 font-semibold text-center">Paid Amount</TableHead>
                    <TableHead className="text-gray-700 font-semibold text-center">Total Balance</TableHead>
                    <TableHead className="text-gray-700 font-semibold text-center">Status</TableHead>
                    <TableHead className="text-gray-700 font-semibold text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients
                    .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
                    .map((patient, idx) => {
                      // Use patient data directly from enhancedPatientSummary (it already has all the database values)
                      const patientData = patient; // This already contains all the fields we need
                      
                      // Get original patient data for photo and other properties not in enhancedPatientSummary
                      const originalPatientData = patients.find((p) =>
                        (p.id && p.id === patient.patientId) ||
                        (p.name && p.name === patient.name)
                      );

                      // --- Use selected month/year for all calculations ---
                      // Get selected month/year from filter or current month/year
                      let selectedMonthIndex = filterMonth;
                      let selectedYear = filterYear;
                      
                      if (selectedMonthIndex === null || selectedYear === null) {
                        // If no filter selected, use current month/year
                        selectedMonthIndex = today.getMonth();
                        selectedYear = today.getFullYear();
                      }

                      // Admission date - use the parsed date from enhancedPatientSummary
                      let admission = null;
                      try {
                        if (patient.admissionDate) {
                          admission = new Date(patient.admissionDate);
                          if (isNaN(admission.getTime())) {
                            admission = null;
                          }
                        }
                      } catch (error) {
                        console.error(`Admission date error for ${patient.name}:`, error);
                        admission = null;
                      }

                      // Debug for Sabarish
                      if (patient.name.includes('Sabarish')) {
                        console.log(`🔍 Debug for ${patient.name} (using enhancedPatientSummary):`, {
                          patientId: patient.patientId,
                          name: patient.name,
                          admissionDate: patient.admissionDate,
                          monthlyFees: patient.monthlyFees,
                          otherFees: patient.otherFees,
                          pickupCharge: patient.pickupCharge,
                          bloodTest: patient.bloodTest,
                          paidAmount: patient.paidAmount,
                          balance: patient.balance,
                          filterMonth,
                          filterYear,
                          selectedMonthIndex,
                          selectedYear,
                          isJoiningMonth: admission ? (admission.getFullYear() === selectedYear && admission.getMonth() === selectedMonthIndex) : false
                        });
                      }
                      if (patient.name.includes('Sabarish')) {
                        console.log(`🔍 Debug for ${patient.name}:`, {
                          filterMonth,
                          filterYear,
                          selectedMonthIndex,
                          selectedYear,
                          admissionRaw: patient.admissionDate,
                          admission: admission ? `${admission.getMonth()}/${admission.getFullYear()}` : 'null',
                          isJoiningMonth: admission ? (admission.getFullYear() === selectedYear && admission.getMonth() === selectedMonthIndex) : false,
                          patientData: {
                            otherFees: patientData?.otherFees,
                            paidAmount: patientData?.paidAmount,
                            pickupCharge: patientData?.pickupCharge,
                            bloodTest: patientData?.bloodTest
                          }
                        });
                      }

                      // Monthly Fees: Use value from enhancedPatientSummary 
                      const monthlyFees = patient.monthlyFees || 0;

                      // Other Fees: Only show for joining month
                      let otherFeesValue = 0;
                      let otherFees = '₹0';
                      
                      // Only show Other Fees if this is the joining month
                      if (admission && admission.getFullYear() === selectedYear && admission.getMonth() === selectedMonthIndex) {
                        otherFeesValue = patient.otherFees || 0;
                        otherFees = `₹${otherFeesValue.toLocaleString()}`;
                        
                        // Debug for Sabarish
                        if (patient.name.includes('Sabarish')) {
                          console.log(`💰 Other Fees calculation for ${patient.name}:`, {
                            isJoiningMonth: true,
                            otherFeesFromSummary: patient.otherFees,
                            calculated: otherFeesValue,
                            final: otherFees
                          });
                        }
                      }

                      // Carry Forward: previous month's total balance (0 for joining month)
                      let carryForward = 0;
                      if (patient && admission) {
                        // If joining month, carry forward is 0
                        if (admission.getFullYear() === selectedYear && admission.getMonth() === selectedMonthIndex) {
                          carryForward = 0;
                        } else {
                          // Calculate continuous carry forward from joining month to current viewing month
                          let totalCarryForward = 0;
                          
                          // Start from joining month and accumulate balance month by month
                          let currentMonth = admission.getMonth();
                          let currentYear = admission.getFullYear();
                          
                          // Loop through months from joining month to the month before selected month
                          while (currentYear < selectedYear || (currentYear === selectedYear && currentMonth < selectedMonthIndex)) {
                            let monthBalance = 0;
                            
                            if (currentMonth === admission.getMonth() && currentYear === admission.getFullYear()) {
                              // Joining month: Monthly Fees + Other Fees - Paid Amount
                              const joiningMonthOtherFees = patient.otherFees || 0;
                              const joiningMonthPaidAmount = patient.paidAmount || 0;
                              monthBalance = monthlyFees + joiningMonthOtherFees - joiningMonthPaidAmount;
                            } else {
                              // Subsequent months: Monthly Fees (no payments in subsequent months yet)
                              monthBalance = monthlyFees;
                            }
                            
                            totalCarryForward += Math.max(0, monthBalance);
                            
                            // Move to next month
                            currentMonth++;
                            if (currentMonth > 11) {
                              currentMonth = 0;
                              currentYear++;
                            }
                          }
                          
                          carryForward = totalCarryForward;
                          
                          // Debug for Sabarish
                          if (patient.name.includes('Sabarish')) {
                            console.log(`📊 Continuous Carry Forward for ${patient.name}:`, {
                              joiningMonth: `${admission.getMonth() + 1}/${admission.getFullYear()}`,
                              viewingMonth: `${selectedMonthIndex + 1}/${selectedYear}`,
                              monthlyFees,
                              otherFees: patient.otherFees,
                              paidAmount: patient.paidAmount,
                              totalCarryForward,
                              finalCarryForward: carryForward
                            });
                          }
                        }
                      }

                      // Paid Amount: Only show for current viewing month (joining month)
                      let paidAmount = 0;
                      if (patient && admission) {
                        // Only show paid amount if this is the joining month (current input month)
                        if (admission.getFullYear() === selectedYear && admission.getMonth() === selectedMonthIndex) {
                          paidAmount = patient.paidAmount || 0;
                          
                          // Debug for Sabarish
                          if (patient.name.includes('Sabarish')) {
                            console.log(`💳 Paid Amount for ${patient.name}:`, {
                              isJoiningMonth: true,
                              paidAmountFromSummary: patient.paidAmount,
                              calculated: paidAmount
                            });
                          }
                        }
                        // For subsequent months, paid amount remains 0 (no current month input)
                      }

                      // Balance: Calculate based on month type
                      let balance = 0;
                      if (patient && admission) {
                        if (admission.getFullYear() === selectedYear && admission.getMonth() === selectedMonthIndex) {
                          // JOINING MONTH: Monthly Fees + Other Fees - Paid Amount (no carry forward)
                          balance = Math.max(0, monthlyFees + otherFeesValue - paidAmount);
                        } else {
                          // SUBSEQUENT MONTHS: Monthly Fees + Carry Forward - Paid Amount (no other fees, no current paid amount)
                          balance = Math.max(0, monthlyFees + carryForward);
                        }
                      } else {
                        balance = patient.balance || 0;
                      }

                      return (
                        <TableRow key={patient.patientId} className="hover:bg-gray-50 border-b border-gray-100">
                          <TableCell className="font-medium text-gray-900 text-center">{(currentPage - 1) * rowsPerPage + idx + 1}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center items-center">
                              {(() => {
                                // Construct proper photo URL
                                let imageUrl = '';
                              
                              // Use originalPatientData for photo
                              if (originalPatientData?.photo) {
                                // If photo starts with http, use as-is, otherwise build the URL based on AddPatient storage format
                                if (originalPatientData.photo.startsWith('http')) {
                                  imageUrl = originalPatientData.photo;
                                } else {
                                  // Photos are stored in: server/Photos/patient Admission/{formattedPatientId}/
                                  // Database stores: Photos/patient Admission/{formattedPatientId}/{filename}
                                  // Static serving at: /Photos/patient%20Admission/{formattedPatientId}/{filename}
                                  if (originalPatientData.photo.includes('Photos/patient Admission/')) {
                                    // Photo path is already in correct format from database
                                    imageUrl = `/${originalPatientData.photo.replace(/\s/g, '%20')}`;
                                  } else {
                                    // Assume it's just filename and build full path using formatted Patient ID
                                    const formattedId = formatPatientId(patient.patientId);
                                    imageUrl = `/Photos/patient%20Admission/${formattedId}/${originalPatientData.photo}`;
                                  }
                                }
                              } else if (originalPatientData?.photoUrl) {
                                if (originalPatientData.photoUrl.startsWith('http')) {
                                  imageUrl = originalPatientData.photoUrl;
                                } else if (originalPatientData.photoUrl.includes('Photos/patient Admission/')) {
                                  imageUrl = `/${originalPatientData.photoUrl.replace(/\s/g, '%20')}`;
                                } else {
                                  // Use formatted Patient ID for photo URL construction
                                  const formattedId = formatPatientId(patient.patientId);
                                  imageUrl = `/Photos/patient%20Admission/${formattedId}/${originalPatientData.photoUrl}`;
                                }
                              }

                              return imageUrl ? (
                                <>
                                  <img
                                    src={imageUrl}
                                    alt={`${patient.name}'s photo`}
                                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                                    onError={(e) => {
                                      console.log('❌ Image failed for:', patient.name);
                                      console.log('   Failed URL:', imageUrl);
                                      
                                      // Show fallback avatar
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      const avatarDiv = target.nextElementSibling as HTMLElement;
                                      if (avatarDiv) avatarDiv.style.display = 'flex';
                                    }}
                                    onLoad={() => {
                                      console.log('✅ Image loaded successfully for patient:', patient.name, 'URL:', imageUrl);
                                    }}
                                  />
                                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-2 border-gray-200" style={{display: 'none'}}>
                                    <span className="text-sm font-semibold text-white">
                                      {(patient.name || 'P').charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                </>
                              ) : (
                                <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center border-2 border-gray-200">
                                  <span className="text-sm font-semibold text-white">
                                    {(patient.name || 'P').charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              );
                            })()}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-medium text-blue-600">{formatPatientId(patient.patientId)}</span>
                        </TableCell>
                        <TableCell className="text-gray-900 text-center">{patient.name}</TableCell>
                        <TableCell className="text-center">
                          {(() => {
                            if (patient.admissionDate) {
                              try {
                                const admissionDate = new Date(patient.admissionDate);
                                // Check if date is valid
                                if (isNaN(admissionDate.getTime())) {
                                  return <span className="text-gray-400 text-sm">Invalid Date</span>;
                                }
                                
                                const isWithinFilter = filterMonth !== null && filterYear !== null && (
                                  admissionDate.getFullYear() < filterYear || 
                                  (admissionDate.getFullYear() === filterYear && admissionDate.getMonth() <= filterMonth)
                                );
                                
                                return (
                                  <span className={`text-sm font-medium ${isWithinFilter ? 'text-green-600 bg-green-50 px-2 py-1 rounded' : 'text-gray-600'}`}>
                                    {format(admissionDate, 'dd/MM/yyyy')}
                                  </span>
                                );
                              } catch (error) {
                                return <span className="text-gray-400 text-sm">Invalid Date</span>;
                              }
                            }
                            return <span className="text-gray-400 text-sm">-</span>;
                          })()}
                        </TableCell>
                        <TableCell className="text-gray-900 text-center">₹{monthlyFees.toLocaleString()}</TableCell>
                        <TableCell className="text-gray-900 text-center">{otherFees}</TableCell>
                        <TableCell className="text-center">
                          {carryForward > 0 ? (
                            <div className="flex items-center justify-center gap-1">
                              <span className="text-orange-600 font-medium">₹{carryForward.toLocaleString()}</span>
                              <span className="text-xs text-orange-500" title="Amount carried forward from previous month(s)">⬆️</span>
                            </div>
                          ) : (
                            <span className="text-gray-500">₹0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-gray-900 text-center">₹{paidAmount.toLocaleString()}</TableCell>
                        <TableCell className="text-gray-900 text-center">₹{balance.toLocaleString()}</TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant={balance <= 0 ? 'default' : balance > 0 && paidAmount > 0 ? 'secondary' : 'destructive'}
                            className={`$
                              ${balance <= 0 ? 'bg-green-100 text-green-800' : 
                              balance > 0 && paidAmount > 0 ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-red-100 text-red-800'}
                            }`}
                          >
                            {balance <= 0 ? 'Paid' : paidAmount > 0 ? 'Partial' : 'Unpaid'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex gap-2 justify-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewPayments(patient)}
                              className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 hover:border-blue-400 action-btn-view rounded-lg transition-all duration-300"
                              title="View Payments"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAddFees(patient)}
                              className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 hover:border-green-400 action-btn-add rounded-lg transition-all duration-300"
                              title="Add Fees"
                            >
                              <Receipt className="h-4 w-4" />
                            </Button>
                            {/* Only enable Edit (Add Payment) for current month */}
                            {(() => {
                              let selectedMonthIndex = null;
                              let selectedYear = today.getFullYear();
                              if (selectedMonth && selectedMonth !== 'all') {
                                selectedMonthIndex = monthNames.indexOf(selectedMonth.toLowerCase());
                              }
                              const isCurrentMonth = selectedMonthIndex === today.getMonth() && selectedYear === today.getFullYear();
                              return (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    if (!isCurrentMonth) return;
                                    setSelectedPatient({ id: patient.patientId, name: patient.name, phone: '', email: '' });
                                    setNewPayment({
                                      patientId: patient.patientId,
                                      patientName: patient.name,
                                      amount: '',
                                      comment: '',
                                      paymentMode: ''
                                    });
                                    setIsAddPaymentOpen(true);
                                  }}
                                  className={`h-8 w-8 sm:h-9 sm:w-9 p-0 rounded-lg transition-all duration-300 ${
                                    !isCurrentMonth 
                                      ? 'opacity-50 cursor-not-allowed border-gray-200 text-gray-400' 
                                      : 'text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200 hover:border-orange-400 action-btn-edit'
                                  }`}
                                  disabled={!isCurrentMonth}
                                  title="Add Payment"
                                >
                                  <Edit className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                                </Button>
                              );
                            })()}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {filteredPatients.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No patients found. <Button variant="link" onClick={() => navigate('/patients/add')}>Add a patient</Button> to get started.
                </div>
              )}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 mt-4 px-6 pb-4">
                  <div className="text-sm text-gray-700">
                    {(() => {
                      const start = (currentPage - 1) * rowsPerPage + 1;
                      const end = Math.min(currentPage * rowsPerPage, filteredPatients.length);
                      return `Showing ${start} to ${end} of ${filteredPatients.length} patients`;
                    })()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded px-4 py-2 font-medium text-gray-500 border-gray-300 disabled:opacity-60"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <Button
                        key={i + 1}
                        size="sm"
                        variant={currentPage === i + 1 ? undefined : "outline"}
                        className={
                          (currentPage === i + 1 ? "bg-green-600 text-white border-green-600 hover:bg-green-700" : "text-gray-700 border-gray-300") +
                          " rounded px-4 py-2 font-medium"
                        }
                        onClick={() => setCurrentPage(i + 1)}
                      >
                        {i + 1}
                      </Button>
                    ))}
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded px-4 py-2 font-medium text-gray-500 border-gray-300 disabled:opacity-60"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      {/* Add Payment Modal */}
      <Dialog open={isAddPaymentOpen} onOpenChange={setIsAddPaymentOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl text-gray-900">Add New Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedPatient && (
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="flex items-center space-x-4 mb-3">
                  {(() => {
                    // Find patient data for photo
                    const patientData = patients.find((p) =>
                      (p.id && p.id === selectedPatient.id) ||
                      (p.registrationId && p.registrationId === selectedPatient.id) ||
                      (p.name && p.name === selectedPatient.name)
                    );
                    
                    // Construct proper photo URL
                    let imageUrl = '';
                    
                    if (patientData?.photo) {
                      // If photo starts with http, use as-is, otherwise build the URL based on AddPatient storage format
                      if (patientData.photo.startsWith('http')) {
                        imageUrl = patientData.photo;
                      } else {
                        // Photos are stored in: server/Photos/patient Admission/{formattedPatientId}/
                        // Database stores: Photos/patient Admission/{formattedPatientId}/{filename}
                        // Static serving at: /Photos/patient%20Admission/{formattedPatientId}/{filename}
                        if (patientData.photo.includes('Photos/patient Admission/')) {
                          // Photo path is already in correct format from database
                          imageUrl = `/${patientData.photo.replace(/\s/g, '%20')}`;
                        } else {
                          // Assume it's just filename and build full path using formatted Patient ID
                          const formattedId = formatPatientId(selectedPatient.id);
                          imageUrl = `/Photos/patient%20Admission/${formattedId}/${patientData.photo}`;
                        }
                      }
                    } else if (patientData?.photoUrl) {
                      if (patientData.photoUrl.startsWith('http')) {
                        imageUrl = patientData.photoUrl;
                      } else if (patientData.photoUrl.includes('Photos/patient Admission/')) {
                        imageUrl = `/${patientData.photoUrl.replace(/\s/g, '%20')}`;
                      } else {
                        // Use formatted Patient ID for photo URL construction
                        const formattedId = formatPatientId(selectedPatient.id);
                        imageUrl = `/Photos/patient%20Admission/${formattedId}/${patientData.photoUrl}`;
                      }
                    }

                    return imageUrl ? (
                      <>
                        <img
                          src={imageUrl}
                          alt={`${selectedPatient.name}'s photo`}
                          className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                          onError={(e) => {
                            console.log('❌ Image failed for:', selectedPatient.name);
                            console.log('   Failed URL:', imageUrl);
                            
                            // Show fallback avatar
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const avatarDiv = target.nextElementSibling as HTMLElement;
                            if (avatarDiv) avatarDiv.style.display = 'flex';
                          }}
                          onLoad={() => {
                            console.log('✅ Image loaded successfully for patient:', selectedPatient.name, 'URL:', imageUrl);
                          }}
                        />
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-2 border-gray-200" style={{display: 'none'}}>
                          <span className="text-sm font-semibold text-white">
                            {(selectedPatient.name || 'P').charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center border-2 border-gray-200">
                        <span className="text-sm font-semibold text-white">
                          {(selectedPatient.name || 'P').charAt(0).toUpperCase()}
                        </span>
                      </div>
                    );
                  })()}
                  <div>
                    <p className="font-semibold text-gray-900">{selectedPatient.name}</p>
                    <p className="text-sm text-gray-600">Patient ID: {formatPatientId(selectedPatient.id)}</p>
                  </div>
                </div>
              </div>
            )}
            {/* Total Balance Field */}
            {selectedPatient && (
              <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                <Label className="text-green-800 font-semibold">Total Balancess</Label>
                <Input
                  type="text"
                  value={(() => {
                    console.log('🔍 Selected Patient for balance calculation:', selectedPatient);
                    console.log('🔍 Enhanced Patient Summary:', enhancedPatientSummary);
                    
                    // Find the patient's current balance from enhancedPatientSummary
                    const patientSummaryData = enhancedPatientSummary.find((p) =>
                      (p.patientId && p.patientId === selectedPatient.id) ||
                      (p.registrationId && p.registrationId === selectedPatient.id) ||
                      (p.name && p.name === selectedPatient.name) ||
                      String(p.patientId) === String(selectedPatient.id)
                    );
                    
                    console.log('🔍 Found patient summary data:', patientSummaryData);
                    
                    if (patientSummaryData) {
                      const balance = patientSummaryData.balance || 0;
                      console.log('✅ Using balance from summary:', balance);
                      return `₹${balance.toLocaleString()}`;
                    }
                    
                    // Fallback calculation if not found in summary
                    const patientData = patients.find((p) =>
                      (p.id && p.id === selectedPatient.id) ||
                      (p.registrationId && p.registrationId === selectedPatient.id) ||
                      (p.name && p.name === selectedPatient.name) ||
                      String(p.id) === String(selectedPatient.id)
                    );
                    
                    console.log('🔍 Found patient data:', patientData);
                    
                    if (patientData) {
                      const balance = patientData.balance || 0;
                      console.log('✅ Using balance from patient data:', balance);
                      return `₹${balance.toLocaleString()}`;
                    }
                    
                    console.log('⚠️ No balance found, defaulting to ₹0');
                    return '₹0';
                  })()}
                  readOnly
                  className="bg-white font-bold text-lg text-green-700 border-green-300 mt-2"
                />
              </div>
            )}
            <div>
              <Label htmlFor="amount" className="text-gray-700">Amount *</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={newPayment.amount}
                onChange={(e) => setNewPayment(prev => ({ ...prev, amount: e.target.value }))}
                className="bg-white"
              />
            </div>
            <div>
              <Label htmlFor="comment" className="text-gray-700">Command/Note *</Label>
              <Textarea
                id="comment"
                placeholder="e.g., July 2025 Fees, Consultation fee"
                value={newPayment.comment}
                onChange={(e) => setNewPayment(prev => ({ ...prev, comment: e.target.value }))}
                className="bg-white"
              />
            </div>
            <div>
              <Label htmlFor="paymentMode" className="text-gray-700">Payment Mode *</Label>
              <Select value={newPayment.paymentMode} onValueChange={(value) => setNewPayment(prev => ({ ...prev, paymentMode: value }))}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select payment mode" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200">
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsAddPaymentOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddPayment} className="bg-green-600 hover:bg-green-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Payment History Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl text-gray-900">Payment History - {viewingPatient?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <Label className="text-gray-600">Registration ID</Label>
                <p className="font-medium text-gray-900">{viewingPatient?.registrationId}</p>
              </div>
              <div>
                <Label className="text-gray-600">Total Fees</Label>
                <p className="font-medium text-gray-900">₹{viewingPatient?.totalFees.toLocaleString()}</p>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
                <Button 
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    setSelectedPatient({ 
                      id: viewingPatient?.patientId, 
                      name: viewingPatient?.name, 
                      phone: '', 
                      email: '' 
                    });
                    setNewPayment(prev => ({
                      ...prev,
                      patientId: viewingPatient?.patientId,
                      patientName: viewingPatient?.name
                    }));
                    setIsAddPaymentOpen(true);
                  }}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Add Payment
                </Button>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Mode</TableHead>
                    <TableHead>Command/Note</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewingPatient?.payments.map((payment: any) => (
                    <TableRow key={payment.id}>
                      <TableCell>{payment.date ? format(new Date(payment.date), 'dd/MM/yyyy') : 'Invalid Date'}</TableCell>
                      <TableCell>₹{payment.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {payment.paymentMode || 'Cash'}
                        </Badge>
                      </TableCell>
                      <TableCell>{payment.comment}</TableCell>
                      <TableCell>₹{payment.balanceRemaining.toLocaleString()}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditPayments(viewingPatient, payment)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Payment Dialog */}
      <Dialog open={isEditPaymentOpen} onOpenChange={setIsEditPaymentOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl text-gray-900">Edit Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editAmount" className="text-gray-700">Balance Amount *</Label>
              <Input
                id="editAmount"
                type="number"
                placeholder="Enter balance amount"
                value={editPayment.amount}
                onChange={(e) => setEditPayment(prev => ({ ...prev, amount: e.target.value }))}
                className="bg-white"
              />
            </div>
            
            <div>
              <Label htmlFor="editComment" className="text-gray-700">Update Command/Note *</Label>
              <Textarea
                id="editComment"
                placeholder="Update payment note"
                value={editPayment.comment}
                onChange={(e) => setEditPayment(prev => ({ ...prev, comment: e.target.value }))}
                className="bg-white"
              />
            </div>

            <div>
              <Label htmlFor="editPaymentMode" className="text-gray-700">Payment Mode *</Label>
              <Select value={editPayment.paymentMode} onValueChange={(value) => setEditPayment(prev => ({ ...prev, paymentMode: value }))}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select payment mode" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200">
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsEditPaymentOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdatePayment} className="bg-green-600 hover:bg-green-700 text-white">
                <Edit className="h-4 w-4 mr-2" />
                Update Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Month/Year Filter Dialog */}
      <Dialog open={showMonthYearDialog} onOpenChange={setShowMonthYearDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Filter by Month & Year</DialogTitle>
            <DialogDescription>
              Select month and year to show all patients admitted from the beginning up to that month
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Month</Label>
              <select
                value={dialogSelectedMonth}
                onChange={(e) => setDialogSelectedMonth(Number(e.target.value))}
                className="w-full p-2 border rounded-md"
              >
                {months.map((month, index) => (
                  <option key={index} value={index}>{month}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Year</Label>
              <select
                value={dialogSelectedYear}
                onChange={(e) => setDialogSelectedYear(Number(e.target.value))}
                className="w-full p-2 border rounded-md"
              >
                {Array.from({ length: 10 }, (_, i) => currentYear - i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMonthYearDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              setFilterMonth(dialogSelectedMonth);
              setFilterYear(dialogSelectedYear);
              setShowMonthYearDialog(false);
            }}>
              Apply Filter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Fees Modal */}
      <Dialog open={isAddFeesOpen} onOpenChange={setIsAddFeesOpen}>
        <DialogContent className="max-w-4xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl text-gray-900">Add New Fees</DialogTitle>
          </DialogHeader>
          
          {selectedPatientForFees && (
            <div className="space-y-6">
              {/* Patient Info */}
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="flex items-center space-x-4 mb-3">
                  {(() => {
                    // Find patient data for photo
                    const patientData = patients.find((p) =>
                      (p.id && p.id === selectedPatientForFees.patientId) ||
                      (p.registrationId && p.registrationId === selectedPatientForFees.patientId) ||
                      (p.name && p.name === selectedPatientForFees.name)
                    );
                    
                    // Construct proper photo URL
                    let imageUrl = '';
                    
                    if (patientData?.photo) {
                      // If photo starts with http, use as-is, otherwise build the URL based on AddPatient storage format
                      if (patientData.photo.startsWith('http')) {
                        imageUrl = patientData.photo;
                      } else {
                        // Photos are stored in: server/Photos/patient Admission/{formattedPatientId}/
                        // Database stores: Photos/patient Admission/{formattedPatientId}/{filename}
                        // Static serving at: /Photos/patient%20Admission/{formattedPatientId}/{filename}
                        if (patientData.photo.includes('Photos/patient Admission/')) {
                          // Photo path is already in correct format from database
                          imageUrl = `/${patientData.photo.replace(/\s/g, '%20')}`;
                        } else {
                          // Assume it's just filename and build full path using formatted Patient ID
                          const formattedId = formatPatientId(selectedPatientForFees.patientId);
                          imageUrl = `/Photos/patient%20Admission/${formattedId}/${patientData.photo}`;
                        }
                      }
                    } else if (patientData?.photoUrl) {
                      if (patientData.photoUrl.startsWith('http')) {
                        imageUrl = patientData.photoUrl;
                      } else if (patientData.photoUrl.includes('Photos/patient Admission/')) {
                        imageUrl = `/${patientData.photoUrl.replace(/\s/g, '%20')}`;
                      } else {
                        // Use formatted Patient ID for photo URL construction
                        const formattedId = formatPatientId(selectedPatientForFees.patientId);
                        imageUrl = `/Photos/patient%20Admission/${formattedId}/${patientData.photoUrl}`;
                      }
                    }

                    return imageUrl ? (
                      <>
                        <img
                          src={imageUrl}
                          alt={`${selectedPatientForFees.name}'s photo`}
                          className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                          onError={(e) => {
                            console.log('❌ Image failed for:', selectedPatientForFees.name);
                            console.log('   Failed URL:', imageUrl);
                            
                            // Show fallback avatar
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const avatarDiv = target.nextElementSibling as HTMLElement;
                            if (avatarDiv) avatarDiv.style.display = 'flex';
                          }}
                          onLoad={() => {
                            console.log('✅ Image loaded successfully for patient:', selectedPatientForFees.name, 'URL:', imageUrl);
                          }}
                        />
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-2 border-gray-200" style={{display: 'none'}}>
                          <span className="text-sm font-semibold text-white">
                            {(selectedPatientForFees.name || 'P').charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center border-2 border-gray-200">
                        <span className="text-sm font-semibold text-white">
                          {(selectedPatientForFees.name || 'P').charAt(0).toUpperCase()}
                        </span>
                      </div>
                    );
                  })()}
                  <div>
                    <p className="font-semibold text-gray-900">{selectedPatientForFees.name}</p>
                    <p className="text-sm text-gray-600">Patient ID: {formatPatientId(selectedPatientForFees.patientId)}</p>
                  </div>
                </div>
              </div>

              {/* Add Fee Form */}
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900">Add New Fee</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                      <Label htmlFor="fee" className="text-gray-700">Fees *</Label>
                      <Input
                        id="fee"
                        type="text"
                        placeholder="Enter fee description"
                        value={newFee.fee}
                        onChange={(e) => setNewFee(prev => ({ ...prev, fee: e.target.value }))}
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="date" className="text-gray-700">Date *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={newFee.date}
                        onChange={(e) => setNewFee(prev => ({ ...prev, date: e.target.value }))}
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="amount" className="text-gray-700">Amount *</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="Enter amount"
                        value={newFee.amount}
                        onChange={(e) => setNewFee(prev => ({ ...prev, amount: e.target.value }))}
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <Button 
                        onClick={handleAddFee}
                        className="bg-green-600 hover:bg-green-700 text-white w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Fee
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Fees Table */}
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900">Fee Entries</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-gray-200">
                          <TableHead className="text-gray-700 font-semibold">S.No</TableHead>
                          <TableHead className="text-gray-700 font-semibold">Fee</TableHead>
                          <TableHead className="text-gray-700 font-semibold">Date</TableHead>
                          <TableHead className="text-gray-700 font-semibold">Amount</TableHead>
                          <TableHead className="text-gray-700 font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fees.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                              No fees found for this patient
                            </TableCell>
                          </TableRow>
                        ) : (
                          fees.map((fee, index) => (
                            <TableRow key={fee.id} className="hover:bg-gray-50 border-b border-gray-100">
                              <TableCell className="font-medium text-gray-900">{index + 1}</TableCell>
                              <TableCell className="text-gray-900">{fee.fee}</TableCell>
                              <TableCell className="text-gray-900">{new Date(fee.date).toLocaleDateString()}</TableCell>
                              <TableCell className="text-gray-900">₹{Number(fee.amount).toLocaleString()}</TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleEditFee(fee)}
                                    className="h-8 w-8 p-0 hover:bg-gray-100"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDeleteFee(fee.id)}
                                    className="h-8 w-8 p-0 hover:bg-gray-100 text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Total */}
                  {fees.length > 0 && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-md">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-700">Total Fees:</span>
                        <span className="font-bold text-lg text-green-600">
                          ₹{fees.reduce((sum, fee) => sum + Number(fee.amount), 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Fee Modal */}
      <Dialog open={isEditFeeOpen} onOpenChange={setIsEditFeeOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl text-gray-900">Edit Fee</DialogTitle>
          </DialogHeader>
          {editingFee && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="editFee" className="text-gray-700">Fees *</Label>
                <Input
                  id="editFee"
                  type="text"
                  value={editingFee.fee}
                  onChange={(e) => setEditingFee(prev => ({ ...prev, fee: e.target.value }))}
                  className="bg-white"
                />
              </div>
              <div>
                <Label htmlFor="editDate" className="text-gray-700">Date *</Label>
                <Input
                  id="editDate"
                  type="date"
                  value={editingFee.date}
                  onChange={(e) => setEditingFee(prev => ({ ...prev, date: e.target.value }))}
                  className="bg-white"
                />
              </div>
              <div>
                <Label htmlFor="editAmount" className="text-gray-700">Amount *</Label>
                <Input
                  id="editAmount"
                  type="number"
                  value={editingFee.amount}
                  onChange={(e) => setEditingFee(prev => ({ ...prev, amount: e.target.value }))}
                  className="bg-white"
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsEditFeeOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => handleUpdateFee(editingFee)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Update Fee
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}