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
  admissionDate?: string;
  admission_date?: string;
  created_at?: string;
  payAmount?: number;
  pay_amount?: number;
  balance?: number;
  registrationId?: string;
  registration_id?: string;
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
      const pickup = Number(patientData?.pickupCharge || 0);
      const blood = Number(patientData?.bloodTest || 0);
      otherFees = pickup + blood;
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

    // Paid Amount for this month
    let paidAmount = 0;
    if (patient.payments) {
      const monthPayments = patient.payments.filter((p) => {
        const d = new Date(p.date);
        return d.getFullYear() === yearValue && d.getMonth() === monthIndex;
      });
      paidAmount = monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      
      // Add PatientList pay amount if this is the joining month
      if (admission.getMonth() === monthIndex && admission.getFullYear() === yearValue) {
        const payAmount = Number(patientData?.payAmount || 0);
        if (payAmount > 0) {
          const alreadyIncluded = monthPayments.some((p) => Number(p.amount) === payAmount);
          if (!alreadyIncluded) {
            paidAmount += payAmount;
          }
        }
      }
    }

    // Calculate total balance: Monthly Fees + Other Fees + Carry Forward - Paid Amount
    return Math.max(0, monthlyFees + otherFees + carryForward - paidAmount);
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

  // Load patients from database with localStorage fallback
  useEffect(() => {
    const loadPatients = async () => {
      try {
        // Try to load from database first
        const dbPatients = await DatabaseService.getAllPatients();
        setPatients(dbPatients.map((p: any) => ({
          id: p.id.toString(),
          name: p.name,
          phone: p.phone || '',
          email: p.email || '',
          fees: p.fees || p.monthlyFees || p.totalFees || 0,
          pickupCharge: p.pickup_charge || p.pickupCharge || 0,
          bloodTest: p.blood_test || p.bloodTest || 0,
          admissionDate: p.admission_date || p.admissionDate || p.created_at,
          payAmount: p.pay_amount || p.payAmount || 0,
          balance: p.balance || 0,
          registrationId: p.registration_id || p.registrationId || p.id
        })));
      } catch (dbError) {
        console.warn('Database error, falling back to localStorage:', dbError);
        // Fallback to localStorage
        const storedPatients = localStorage.getItem('patients');
        if (storedPatients) {
          try {
            const parsedPatients = JSON.parse(storedPatients);
            setPatients(parsedPatients.map((p: any) => ({
              id: p.id.toString(),
              name: p.name,
              phone: p.phone || '',
              email: p.email || '',
              fees: p.fees || p.monthlyFees || p.totalFees || 0,
              pickupCharge: p.pickup_charge || p.pickupCharge || 0,
              bloodTest: p.blood_test || p.bloodTest || 0,
              admissionDate: p.admission_date || p.admissionDate || p.created_at,
              payAmount: p.pay_amount || p.payAmount || 0,
              balance: p.balance || 0,
              registrationId: p.registration_id || p.registrationId || p.id
            })));
          } catch (error) {
            console.error('Error loading patients from localStorage:', error);
          }
        }
      }
      setCurrentPage(1); // Always reset to first page when loading patients
    };
    
    loadPatients();
  }, []);

  // Add effect to refresh data when component becomes visible or localStorage changes
  useEffect(() => {
    const handleFocus = () => {
      console.log('PatientPaymentFees: Window focused, refreshing data...');
      setLocalStorageVersion(prev => prev + 1); // Force useMemo recalculation
      refreshData();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('PatientPaymentFees: Page became visible, refreshing data...');
        setLocalStorageVersion(prev => prev + 1); // Force useMemo recalculation
        refreshData();
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'patients' || e.key === 'patientPaymentRecords') {
        console.log('PatientPaymentFees: localStorage changed, refreshing data...');
        setLocalStorageVersion(prev => prev + 1); // Trigger useMemo recalculation
        refreshData();
        // Also reload patients list
        const storedPatients = localStorage.getItem('patients');
        if (storedPatients) {
          try {
            const parsedPatients = JSON.parse(storedPatients);
            setPatients(parsedPatients.map((p: any) => ({
              id: p.id.toString(),
              name: p.name,
              phone: p.phone || '',
              email: p.email || '',
              fees: p.fees || p.monthlyFees || p.totalFees || 0,
              pickupCharge: p.pickup_charge || p.pickupCharge || 0,
              bloodTest: p.blood_test || p.bloodTest || 0,
              admissionDate: p.admission_date || p.admissionDate || p.created_at,
              payAmount: p.pay_amount || p.payAmount || 0,
              balance: p.balance || 0,
              registrationId: p.registration_id || p.registrationId || p.id
            })));
          } catch (error) {
            console.error('Error reloading patients from localStorage:', error);
          }
        }
      }
    };

    // Add event listeners
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [refreshData]);

  // Enhanced patient summary with month/carry forward logic
  const enhancedPatientSummary = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    return getPatientPaymentSummary().map(patient => {
      // Find patient admission date and monthly fees from localStorage PatientList
      const patientsData = JSON.parse(localStorage.getItem('patients') || '[]');
      const patientData = patientsData.find((p: any) => p.id === patient.patientId);
      const admissionDate = patientData?.admissionDate || patientData?.created_at || patientData?.admission_date;
      const admission = admissionDate ? new Date(admissionDate) : null;
      const admissionMonth = admission ? admission.getMonth() : null;
      const admissionYear = admission ? admission.getFullYear() : null;
      // Get monthly fees from PatientList (localStorage)
      const monthlyFeesFromList = Number(patientData?.fees || patientData?.monthlyFees || patientData?.totalFees || 0);
      const bloodTestFromList = Number(patientData?.bloodTest || patientData?.blood_test || 0);
      const pickupChargeFromList = Number(patientData?.pickupCharge || patientData?.pickup_charge || 0);
      const totalFeesFromList = monthlyFeesFromList + bloodTestFromList + pickupChargeFromList;

      // Calculate unpaid from previous months
      let carryForward = 0;
      let currentMonthPaid = 0;
      let currentMonthFees = totalFeesFromList || patient.totalFees;
      let status = patient.status;
      let balance = patient.balancePending;
      let totalFees = totalFeesFromList || patient.totalFees;
      let showFees = 0;
      let showBalance = 0;
      let showTotal = 0;
      let monthLabel = `${monthNames[currentMonth]} ${currentYear}`;

      // If patient added this month, show only balance
      if (admission && admissionMonth === currentMonth && admissionYear === currentYear) {
        showFees = 0;
        showBalance = balance;
        showTotal = balance;
      } else {
        // Patient from previous month: show only fees
        // Carry forward unpaid from previous months
        // Find all payments before this month
        const prevPayments = patient.payments.filter((p: any) => {
          const d = new Date(p.date);
          return d.getFullYear() < currentYear || (d.getFullYear() === currentYear && d.getMonth() < currentMonth);
        });
        const paidPrev = prevPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
        const prevMonthFees = totalFeesFromList || patient.totalFees;
        carryForward = Math.max(0, prevMonthFees - paidPrev);
        // Current month fees
        currentMonthFees = totalFeesFromList || patient.totalFees;
        // Current month payments
        const currPayments = patient.payments.filter((p: any) => {
          const d = new Date(p.date);
          return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
        });
        currentMonthPaid = currPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
        showFees = currentMonthFees;
        showBalance = carryForward;
        showTotal = currentMonthFees + carryForward;
        balance = Math.max(0, showTotal - (currentMonthPaid + paidPrev));
        status = balance <= 0 ? 'Paid' : (currentMonthPaid > 0 ? 'Partial' : 'Pending');
      }

      return {
        ...patient,
        admissionDate: admission ? admission.toISOString().split('T')[0] : '',
        currentMonth: monthLabel,
        fees: currentMonthFees, // Use calculated total fees
        monthlyFees: monthlyFeesFromList, // Monthly fees only
        bloodTest: bloodTestFromList, // Blood test fees
        pickupCharge: pickupChargeFromList, // Pickup charge fees
        totalFees: totalFeesFromList || patient.totalFees, // Total of all fees
        balance: showBalance,
        total: showTotal,
        status,
        displayBalance: balance
      };
    });
  }, [getPatientPaymentSummary, monthNames, patientPayments, localStorageVersion]);

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
      
      // If month/year filter is selected, only show patients who were admitted on or before the selected month/year
      let includePatient = true;
      let admissionDate = patient.admissionDate;
      if (admissionDate) {
        const admission = new Date(admissionDate);
        // Only include if admission is in or before selected month/year
        if (
          admission.getFullYear() > selectedYear ||
          (admission.getFullYear() === selectedYear && admission.getMonth() > selectedMonthIndex)
        ) {
          includePatient = false;
        }
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
        const pickup = Number(patientData?.pickupCharge || 0);
        const blood = Number(patientData?.bloodTest || 0);
        otherFeesValue = pickup + blood;
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
                <h1 className="text-2xl font-semibold text-gray-900 transition-colors duration-300 hover:text-green-600">Patient Payment Fees</h1>
                <p className="text-sm text-gray-600 mt-1">
                  
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

        {/* Main Patient Payment Table */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Patient Payment Summary</h2>
          </div>
          
          <div className="p-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-200">
                    <TableHead className="text-gray-700 font-semibold text-center">S NO</TableHead>
                    <TableHead className="text-gray-700 font-semibold text-center">Patient ID</TableHead>
                    <TableHead className="text-gray-700 font-semibold text-center">Patient Name</TableHead>
                    <TableHead className="text-gray-700 font-semibold text-center">Monthly Fees</TableHead>
                    <TableHead className="text-gray-700 font-semibold text-center">Other Fees</TableHead>
                    <TableHead className="text-gray-700 font-semibold text-center">Carry Forward</TableHead>
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
                    // Get patient data from loaded patients state (from database)
                    const patientData = patients.find((p) =>
                      (p.id && p.id === patient.patientId) ||
                      (p.registrationId && p.registrationId === patient.patientId) ||
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

                    // Admission date
                    const admissionDateRaw = patientData?.admissionDate || patientData?.created_at || patientData?.admission_date;
                    const admission = admissionDateRaw ? new Date(admissionDateRaw) : null;

                    // Monthly Fees: Always show the correct per-month fee from PatientList
                    const monthlyFees = Number(patientData?.fees || patientData?.monthlyFees || patientData?.totalFees || 0);

                    // Other Fees: Show sum only if this row is for the joining month
                    let otherFeesValue = 0;
                    let otherFees = '₹0';
                    if (
                      admission &&
                      admission.getMonth() === selectedMonthIndex &&
                      admission.getFullYear() === selectedYear
                    ) {
                      const pickup = Number(
                        patientData?.pickupCharge ??
                        patientData?.pickup_charge ??
                        patientData?.pickup ??
                        0
                      );
                      const blood = Number(
                        patientData?.bloodTest ??
                        patientData?.blood_test ??
                        patientData?.blood ??
                        0
                      );
                      otherFeesValue = pickup + blood;
                      otherFees = `₹${otherFeesValue.toLocaleString()}`;
                    }

                    // Carry Forward: previous month's total balance (0 for joining month)
                    let carryForward = 0;
                    if (patientData && patient.payments && admission) {
                      // If joining month, carry forward is 0
                      if (admission.getFullYear() === selectedYear && admission.getMonth() === selectedMonthIndex) {
                        carryForward = 0;
                      } else {
                        // Calculate previous month
                        let prevMonth = selectedMonthIndex - 1;
                        let prevYear = selectedYear;
                        if (prevMonth < 0) {
                          prevMonth = 11;
                          prevYear -= 1;
                        }
                        
                        // Carry Forward = Previous Month's Total Balance (exact same amount)
                        carryForward = calculateMonthBalance(patientData, patient, admission, prevMonth, prevYear);
                      }
                    }

                    // Paid Amount: sum of payments in selected month
                    let paidAmount = 0;
                    if (patientData && patient.payments && admission) {
                      // If selected month is joining month, show all payments in that month (including PatientList Pay Amount)
                      if (
                        admission.getMonth() === selectedMonthIndex &&
                        admission.getFullYear() === selectedYear
                      ) {
                        const joinMonthPayments = patient.payments.filter((p) => {
                          const d = new Date(p.date);
                          return d.getFullYear() === selectedYear && d.getMonth() === selectedMonthIndex;
                        });
                        paidAmount = joinMonthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
                        // Add PatientList Pay Amount if present and not already in payments
                        const payAmount = Number(patientData?.payAmount || 0);
                        // Only add if not already included in payments (avoid double count)
                        if (payAmount > 0) {
                          // Check if any payment in joinMonthPayments matches payAmount
                          const alreadyIncluded = joinMonthPayments.some((p) => Number(p.amount) === payAmount);
                          if (!alreadyIncluded) {
                            paidAmount += payAmount;
                          }
                        }
                      } else {
                        // For other months, show payments in selected month as before
                        const currPayments = patient.payments.filter((p) => {
                          const d = new Date(p.date);
                          return d.getFullYear() === selectedYear && d.getMonth() === selectedMonthIndex;
                        });
                        paidAmount = currPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
                      }
                    }

                    // Balance: (monthlyFees * months up to selected) + otherFees (if joining month) + carryForward - totalPaid
                    let balance = 0;
                    if (patientData && patient.payments && admission) {
                      // Always calculate: (Monthly Fees + Other Fees + Carry Forward) - Paid Amount
                      let thisOtherFees = 0;
                      if (
                        admission.getMonth() === selectedMonthIndex &&
                        admission.getFullYear() === selectedYear
                      ) {
                        const pickup = Number(patientData?.pickupCharge || 0);
                        const blood = Number(patientData?.bloodTest || 0);
                        thisOtherFees = pickup + blood;
                      }
                      balance = Math.max(0, monthlyFees + thisOtherFees + carryForward - paidAmount);
                    } else {
                      balance = Number(patientData?.balance || 0);
                    }

                    return (
                      <TableRow key={patient.patientId} className="hover:bg-gray-50 border-b border-gray-100">
                        <TableCell className="font-medium text-gray-900 text-center">{(currentPage - 1) * rowsPerPage + idx + 1}</TableCell>
                        <TableCell className="font-medium text-gray-900 text-center">{patient.patientId}</TableCell>
                        <TableCell className="text-gray-900 text-center">{patient.name}</TableCell>
                        <TableCell className="text-gray-900 text-center">₹{monthlyFees.toLocaleString()}</TableCell>
                        <TableCell className="text-gray-900 text-center">{otherFees}</TableCell>
                        <TableCell className="text-gray-900 text-center">₹{carryForward.toLocaleString()}</TableCell>
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
              <div className="bg-gray-50 p-3 rounded-md">
                <div className="text-sm text-gray-600">
                  <div><strong>Patient ID:</strong> {selectedPatient.id}</div>
                  <div><strong>Name:</strong> {selectedPatient.name}</div>
                </div>
              </div>
            )}
            {/* Total Balance Field */}
            {selectedPatient && (
              <div>
                <Label className="text-gray-700">Total Balance</Label>
                <Input
                  type="text"
                  value={(() => {
                    // Use selected month/year or current month/year for balance calculation
                    const selectedMonthIndex = filterMonth !== null ? filterMonth : today.getMonth();
                    const selectedYear = filterYear !== null ? filterYear : today.getFullYear();
                    
                    const patientsData = JSON.parse(localStorage.getItem('patients') || '[]');
                    const patientData = patientsData.find((p) =>
                      (p.id && p.id === selectedPatient.id) ||
                      (p.registrationId && p.registrationId === selectedPatient.id) ||
                      (p.name && p.name === selectedPatient.name)
                    );
                    const monthlyFees = Number(patientData?.fees || patientData?.monthlyFees || patientData?.totalFees || 0);
                    const patientSummary = patientPayments.find((p) =>
                      (p.patientId && p.patientId === selectedPatient.id) ||
                      (p.registrationId && p.registrationId === selectedPatient.id) ||
                      (p.name && p.name === selectedPatient.name)
                    );
                    // Admission date
                    const admissionDateRaw = patientData?.admissionDate || patientData?.created_at || patientData?.admission_date;
                    const admission = admissionDateRaw ? new Date(admissionDateRaw) : null;
                    // Other Fees (joining month only)
                    let otherFeesValue = 0;
                    if (
                      admission &&
                      admission.getMonth() === selectedMonthIndex &&
                      admission.getFullYear() === selectedYear
                    ) {
                      const pickup = Number(
                        patientData?.pickupCharge ??
                        patientData?.pickup_charge ??
                        patientData?.pickup ??
                        0
                      );
                      const blood = Number(
                        patientData?.bloodTest ??
                        patientData?.blood_test ??
                        patientData?.blood ??
                        0
                      );
                      otherFeesValue = pickup + blood;
                    }
                    // Carry Forward (use same logic as table, but for selected month)
                    let carryForward = 0;
                    if (patientData && patientSummary && admission) {
                      if (admission.getFullYear() === selectedYear && admission.getMonth() === selectedMonthIndex) {
                        carryForward = 0;
                      } else {
                        let prevMonth = selectedMonthIndex - 1;
                        let prevYear = selectedYear;
                        if (prevMonth < 0) {
                          prevMonth = 11;
                          prevYear -= 1;
                        }
                        // Monthly Fees for prev month
                        const prevMonthlyFees = Number(patientData?.fees || patientData?.monthlyFees || patientData?.totalFees || 0);
                        let prevOtherFees = 0;
                        if (
                          admission.getMonth() === prevMonth &&
                          admission.getFullYear() === prevYear
                        ) {
                          const pickup = Number(
                            patientData?.pickupCharge ??
                            patientData?.pickup_charge ??
                            patientData?.pickup ??
                            0
                          );
                          const blood = Number(
                            patientData?.bloodTest ??
                            patientData?.blood_test ??
                            patientData?.blood ??
                            0
                          );
                          prevOtherFees = pickup + blood;
                        }
                        // Carry Forward for prev month (recursive, but only one level for popup)
                        let prevCarryForward = 0;
                        if (!(admission.getFullYear() === prevYear && admission.getMonth() === prevMonth)) {
                          let prevPrevMonth = prevMonth - 1;
                          let prevPrevYear = prevYear;
                          if (prevPrevMonth < 0) {
                            prevPrevMonth = 11;
                            prevPrevYear -= 1;
                          }
                          let monthsSinceAdmissionPrev = (prevPrevYear - admission.getFullYear()) * 12 + (prevPrevMonth - admission.getMonth()) + 1;
                          if (monthsSinceAdmissionPrev >= 1) {
                            let prevPrevOtherFees = 0;
                            if (
                              admission.getMonth() === prevPrevMonth &&
                              admission.getFullYear() === prevPrevYear
                            ) {
                              const pickup = Number(
                                patientData?.pickupCharge ??
                                patientData?.pickup_charge ??
                                patientData?.pickup ??
                                0
                              );
                              const blood = Number(
                                patientData?.bloodTest ??
                                patientData?.blood_test ??
                                patientData?.blood ??
                                0
                              );
                              prevPrevOtherFees = pickup + blood;
                            }
                            let prevPrevPaidAmount = 0;
                            if (patientSummary.payments) {
                              const prevPrevPayments = patientSummary.payments.filter((p) => {
                                const d = new Date(p.date);
                                return d.getFullYear() === prevPrevYear && d.getMonth() === prevPrevMonth;
                              });
                              prevPrevPaidAmount = prevPrevPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
                              if (
                                admission.getMonth() === prevPrevMonth &&
                                admission.getFullYear() === prevPrevYear
                              ) {
                                const payAmount = Number(patientData?.payAmount || patientData?.pay_amount || 0);
                                if (payAmount > 0) {
                                  const alreadyIncluded = prevPrevPayments.some((p) => Number(p.amount) === payAmount);
                                  if (!alreadyIncluded) {
                                    prevPrevPaidAmount += payAmount;
                                  }
                                }
                              }
                            }
                            prevCarryForward = Math.max(0, prevMonthlyFees + prevPrevOtherFees + 0 - prevPrevPaidAmount);
                          }
                        }
                        // Paid Amount for prev month
                        let prevPaidAmount = 0;
                        if (patientSummary.payments) {
                          const prevPayments = patientSummary.payments.filter((p) => {
                            const d = new Date(p.date);
                            return d.getFullYear() === prevYear && d.getMonth() === prevMonth;
                          });
                          prevPaidAmount = prevPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
                          if (
                            admission.getMonth() === prevMonth &&
                            admission.getFullYear() === prevYear
                          ) {
                            const payAmount = Number(patientData?.payAmount || patientData?.pay_amount || 0);
                            if (payAmount > 0) {
                              const alreadyIncluded = prevPayments.some((p) => Number(p.amount) === payAmount);
                              if (!alreadyIncluded) {
                                prevPaidAmount += payAmount;
                              }
                            }
                          }
                        }
                        // Final Carry Forward for this month is exactly previous month's Total Balance
                        carryForward = Math.max(0, prevMonthlyFees + prevOtherFees + prevCarryForward - prevPaidAmount);
                      }
                    }
                    // Paid Amount for selected month
                    let paidAmount = 0;
                    if (patientData && patientSummary && admission) {
                      if (
                        admission.getMonth() === selectedMonthIndex &&
                        admission.getFullYear() === selectedYear
                      ) {
                        const joinMonthPayments = patientSummary.payments.filter((p) => {
                          const d = new Date(p.date);
                          return d.getFullYear() === selectedYear && d.getMonth() === selectedMonthIndex;
                        });
                        paidAmount = joinMonthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
                        const payAmount = Number(patientData?.payAmount || patientData?.pay_amount || 0);
                        if (payAmount > 0) {
                          const alreadyIncluded = joinMonthPayments.some((p) => Number(p.amount) === payAmount);
                          if (!alreadyIncluded) {
                            paidAmount += payAmount;
                          }
                        }
                      } else {
                        const currPayments = patientSummary.payments.filter((p) => {
                          const d = new Date(p.date);
                          return d.getFullYear() === selectedYear && d.getMonth() === selectedMonthIndex;
                        });
                        paidAmount = currPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
                      }
                    }
                    // Total Balance calculation for selected month
                    const totalBalance = Math.max(0, monthlyFees + otherFeesValue + carryForward - paidAmount);
                    return `₹${totalBalance.toLocaleString()}`;
                  })()}
                  readOnly
                  className="bg-gray-100 font-semibold"
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
                      <TableCell>{format(new Date(payment.date), 'dd/MM/yyyy')}</TableCell>
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
              Select month and year to filter payment records
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
              <div className="bg-gray-50 p-3 rounded-md">
                <div className="text-sm text-gray-600">
                  <div><strong>Patient ID:</strong> {selectedPatientForFees.patientId}</div>
                  <div><strong>Name:</strong> {selectedPatientForFees.name}</div>
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