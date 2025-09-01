import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ActionButtons } from '@/components/ui/HeaderActionButtons';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import MonthYearPickerDialog from '@/components/shared/MonthYearPickerDialog';
import { CalendarIcon, Search, Users, Download, CheckCircle, XCircle, Clock, RotateCcw, Trash2, UserCheck, UserX, Timer, ClockIcon, RefreshCw, Plus, ChevronLeft, ChevronRight, CreditCard, Edit2, User, Activity, Eye, Save, IndianRupee, History, X, AlertCircle, Stethoscope, Database } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import LoadingScreen from '@/components/shared/LoadingScreen';
import { PatientPaymentAPI } from '@/services/patientPaymentAPI';
import usePageTitle from '@/hooks/usePageTitle';
import { getPatientPhotoUrl, PatientPhoto } from '@/utils/photoUtils';
import '@/styles/global-crm-design.css';

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
  otherFees?: number;
  totalAmount?: number;
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
  total_paid?: string;
  advance_amount?: string;
  carry_forward?: string;
  payment_mode?: string;
  status?: string;
  join_date?: string;
}

interface PaymentHistory {
  id: string;
  payment_date: string;
  payment_amount: string;
  payment_mode: string;
  type: string;
  notes: string;
  created_at: string;
}

const PatientPaymentFees: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  
  // New states for enhanced functionality (mirroring Staff Salary)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentFormData, setPaymentFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    type: 'fee_payment'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showMonthYearDialog, setShowMonthYearDialog] = useState(false);
  const [paymentModalSelectedMonth, setPaymentModalSelectedMonth] = useState(new Date().getMonth() + 1);
  const [paymentModalSelectedYear, setPaymentModalSelectedYear] = useState(new Date().getFullYear());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<any>(null);
  const [deletingPayment, setDeletingPayment] = useState(false);

  // Payment History month filtering - defaults to main page selected month/year
  const [historyFilterMonth, setHistoryFilterMonth] = useState<number | null>(null);
  const [historyFilterYear, setHistoryFilterYear] = useState<number | null>(null);
  const [filteredPaymentHistory, setFilteredPaymentHistory] = useState<PaymentHistory[]>([]);
  const [showHistoryMonthYearDialog, setShowHistoryMonthYearDialog] = useState(false);

  const itemsPerPage = 10;

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // State management (replacing hook)
  const [patientPayments, setPatientPayments] = useState<Patient[]>([]);
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalTestReportAmount: 0,
    totalPaid: 0,
    totalPending: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const recordsPerPage = 10;

  // Direct API functions (replacing hook methods)
  const loadPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await PatientPaymentAPI.getAll(selectedMonth, selectedYear, currentPage, recordsPerPage);
      
      // Transform the API response data to match the UI expectations
      const transformedPatients = (response.payments || []).map((payment: any) => {
        return {
          id: payment.patient_id,
          name: payment.patient_name,
          phone: payment.phone || '',
          email: payment.email || '',
          photo: payment.photo || '',
          admissionDate: payment.admissionDate || payment.admission_date || '',
          monthlyFees: payment.fees || 0,  // Monthly consultation fees
          otherFees: payment.month_specific_other_fees || 0, // Month-specific other fees from test reports
          totalAmount: payment.total_amount || 0,
          balance: payment.amount_pending || 0,
          advance_amount: (payment.amount_paid || 0).toString(),
          carry_forward: (payment.carry_forward || 0).toString(),
          total_paid: (payment.amount_paid || 0).toString(),
          payment_mode: payment.payment_method || '',
          status: payment.payment_status === 'completed' ? 'Paid' : 'Pending'
        };
      });

      setPatientPayments(transformedPatients);
      setStats(response.stats || {
        totalPatients: 0,
        totalTestReportAmount: 0,
        totalPaid: 0,
        totalPending: 0,
      });
      setTotalPages(Math.ceil((response.totalCount || 0) / recordsPerPage));
    } catch (error) {
      console.error('Error loading patients:', error);
      setError('Failed to load patient data');
      toast({
        title: "Error",
        description: "Failed to load patient payment data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    await loadPatients();
  };

  const applyFilter = async () => {
    setCurrentPage(1);
    await loadPatients();
    
    // Check carry forward after applying filter
    if (patientPayments.length > 0) {
      console.log('🔄 Checking carry forward after applying filter:', selectedMonth, selectedYear);
      checkCarryForward();
    }
  };

  const recordPayment = async (patientId: string, amount: number, method: string, notes?: string) => {
    try {
      await PatientPaymentAPI.recordPayment({ patientId, amount, method, notes });
      toast({
        title: "Success",
        description: "Payment recorded successfully",
      });
      await refreshData();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast({
        title: "Error",
        description: "Failed to record payment",
        variant: "destructive",
      });
    }
  };

  const getPaymentHistory = async (patientId: string) => {
    try {
      const response = await PatientPaymentAPI.getPaymentHistory(patientId);
      return response.history || [];
    } catch (error) {
      console.error('Error fetching payment history:', error);
      return [];
    }
  };

  // Handle page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle month/year changes
  const handleMonthChange = (month: number) => {
    setSelectedMonth(month);
    setCurrentPage(1); // Reset to first page when changing month
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    setCurrentPage(1); // Reset to first page when changing year
  };

  // Set custom page title
  usePageTitle('Patient Payment Management');

  // Load data on component mount
  useEffect(() => {
    loadPatients();
  }, []);

  // Load data when page changes or month/year changes
  useEffect(() => {
    if (currentPage > 1) { // Only reload when page changes, not on initial load
      loadPatients();
    }
  }, [currentPage]);

  // REMOVED: Auto-refresh on month/year change - now only refreshes when Apply button is clicked
  // useEffect(() => {
  //   console.log('🔄 Month/Year changed, reloading data:', selectedMonth, selectedYear);
  //   loadPatients();
  // }, [selectedMonth, selectedYear]);

  // REMOVED: Auto-trigger carry forward on month/year change - now only happens when Apply is clicked
  // useEffect(() => {
  //   if (patientPayments.length > 0) {
  //     console.log('🔄 Auto-triggering carry forward for month/year change:', selectedMonth, selectedYear);
  //     checkCarryForward();
  //   }
  // }, [selectedMonth, selectedYear]);

  useEffect(() => {
    filterPatients();
  }, [patientPayments, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, patientPayments]);

  const filterPatients = () => {
    let filtered = patientPayments;

    if (searchTerm) {
      filtered = filtered.filter(patient =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sort patients by ID in ascending order
    filtered.sort((a, b) => {
      const getNum = (id: string) => {
        if (!id) return 0;
        const match = id.match(/P(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      };
      return getNum(a.id) - getNum(b.id);
    });
    
    setFilteredPatients(filtered);
  };

  const refreshDataHandler = async () => {
    await refreshData();
    toast({
      title: "Data Refreshed",
      description: "Patient payment data updated successfully",
    });
  };

  // Check carry forward amounts for current month (mirroring doctor salary exactly)
  const checkCarryForward = async () => {
    try {
      const month = selectedMonth;
      const year = selectedYear;
      
      const response = await PatientPaymentAPI.checkCarryForward(month, year);
      
      if (response.success && response.data.length > 0) {
        const totalCarryForward = response.totalCarryForward.toFixed(2);
        toast({
          title: `Carry Forward Available for ${months[month-1]} ${year}`,
          description: `${response.data.length} patients have ₹${parseFloat(totalCarryForward).toLocaleString()} total carry forward amount`,
        });
      }
    } catch (error) {
      console.error('Error checking carry forward:', error);
      // Don't show error toast for carry forward check as it's automatic
    }
  };

  // Handle record payment modal
  const handleRecordPayment = (patient: Patient) => {
    console.log('🔍 Patient selected for payment:', patient);
    setSelectedPatient(patient);
    setPaymentModalSelectedMonth(selectedMonth);
    setPaymentModalSelectedYear(selectedYear);
    
    // Set Payment History filter to match main page selection
    setHistoryFilterMonth(selectedMonth);
    setHistoryFilterYear(selectedYear);
    
    setPaymentFormData({
      date: new Date().toISOString().split('T')[0],
      amount: '',
      type: 'fee_payment'
    });
    setShowPaymentModal(true);
    
    // Load payment history for selected patient
    fetchPaymentHistory(patient.id);
  };

  // Fetch payment history
  const fetchPaymentHistory = async (patientId: string) => {
    try {
      setHistoryLoading(true);
      console.log('🔍 Fetching payment history for patient:', patientId);
      const response = await PatientPaymentAPI.getPaymentHistory(patientId);
      console.log('💳 Payment history API response:', response);
      console.log('💳 Payment history data:', response.history);
      setPaymentHistory(response.history || []);
    } catch (error) {
      console.error('Error fetching payment history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Filter payment history by selected month/year
  useEffect(() => {
    if (paymentHistory.length > 0) {
      let filtered = paymentHistory;
      
      // Use Payment History filter if set, otherwise use main page filter
      const filterMonth = historyFilterMonth || selectedMonth;
      const filterYear = historyFilterYear || selectedYear;
      
      // Apply month/year filtering if set
      if (filterMonth !== null && filterYear !== null) {
        filtered = paymentHistory.filter(payment => {
          const paymentDate = new Date(payment.payment_date);
          const paymentMonth = paymentDate.getMonth() + 1; // 1-12
          const paymentYear = paymentDate.getFullYear();
          
          return paymentMonth === filterMonth && paymentYear === filterYear;
        });
      }
      
      setFilteredPaymentHistory(filtered);
    } else {
      setFilteredPaymentHistory([]);
    }
  }, [paymentHistory, historyFilterMonth, historyFilterYear, selectedMonth, selectedYear]);

  // Numeric parsing helper
  const parseNumeric = (value: string | number | undefined): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const cleaned = value.replace(/[^\d.-]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  // Submit payment
  const handleSubmitPayment = async () => {
    if (!selectedPatient || !paymentFormData.amount || !paymentFormData.date) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await recordPayment(
        selectedPatient.id,
        parseFloat(paymentFormData.amount),
        'bank_transfer',
        `Payment for ${paymentFormData.type}`
      );

      toast({
        title: "Success",
        description: "Payment recorded successfully",
      });
      setPaymentFormData({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        type: 'fee_payment'
      });
      setShowPaymentModal(false);
      
      loadPatients();
      if (selectedPatient) {
        fetchPaymentHistory(selectedPatient.id);
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      toast({
        title: "Error",
        description: "Failed to record payment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete payment
  const handleDeletePayment = async () => {
    if (!paymentToDelete) return;
    
    setDeletingPayment(true);
    try {
      await PatientPaymentAPI.deletePayment(paymentToDelete.id);

      toast({
        title: "Success",
        description: "Payment deleted successfully",
      });
      
      loadPatients();
      if (selectedPatient) {
        fetchPaymentHistory(selectedPatient.id);
      }
      
      setShowDeleteDialog(false);
      setPaymentToDelete(null);
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast({
        title: "Error",
        description: "Failed to delete payment",
        variant: "destructive",
      });
    } finally {
      setDeletingPayment(false);
    }
  };

  // Save monthly records handler (mirroring Doctor Salary functionality)
  const handleSaveMonthlyRecords = async () => {
    try {
      setLoading(true);
      
      // Get current month and year from the filter or use current date
      const month = selectedMonth !== null ? selectedMonth : new Date().getMonth() + 1;
      const year = selectedYear !== null ? selectedYear : new Date().getFullYear();
      
      const data = await PatientPaymentAPI.saveMonthlyRecords(month, year);
      
      if (data.success) {
        const monthName = months[month-1];
        const recordsText = `${data.recordsProcessed || 0} patient records processed`;
        const carryForwardText = data.carryForwardUpdates ? `, ${data.carryForwardUpdates} with carry-forward` : '';
        
        toast({
          title: "Success",
          description: `Monthly records saved successfully for ${monthName} ${year}! ${recordsText}${carryForwardText}`
        });
        
        // Check if there are carry forward amounts and provide additional info
        if (data.carryForwardUpdates > 0) {
          setTimeout(() => {
            toast({
              title: "Carry Forward Info",
              description: `${data.carryForwardUpdates} patients have balance amounts that will carry forward to the next month`,
            });
          }, 1000);
        }
        
        // Refresh the data after a small delay to ensure database transaction is committed
        setTimeout(async () => {
          // Force refresh by clearing any cached state
          setPatients([]);
          await loadPatients();
        }, 500);
      } else {
        toast({
          title: "Error",
          description: data.message || 'Failed to save monthly records. Please try again.',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error saving monthly records:', error);
      toast({
        title: "Error",
        description: 'Failed to save monthly records. Please check your connection and try again.',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    const exportData = filteredPatients.map((patient, index) => {
      const monthlyFees = parseNumeric(patient.monthlyFees);
      const otherFees = parseNumeric(patient.otherFees);
      const carryForward = parseNumeric(patient.carry_forward);
      const totalPaid = parseNumeric(patient.total_paid);
      const totalAmount = monthlyFees + otherFees + carryForward;
      const remainingBalance = totalAmount - totalPaid;
      
      return {
        'S.No': index + 1,
        'Patient ID': patient.id,
        'Name': patient.name,
        'Phone': patient.phone,
        'Email': patient.email,
        'Monthly Fees': `₹${monthlyFees.toLocaleString()}`,
        'Other Fees': `₹${otherFees.toLocaleString()}`,
        'Carry Forward': `₹${carryForward.toLocaleString()}`,
        'Total Amount': `₹${totalAmount.toLocaleString()}`,
        'Total Paid': `₹${totalPaid.toLocaleString()}`,
        'Advance Amount': `₹${parseNumeric(patient.advance_amount).toLocaleString()}`,
        'Remaining Balance': `₹${remainingBalance.toLocaleString()}`,
        'Status': remainingBalance > 0 ? 'Pending' : 'Paid',
        'Admission Date': patient.admissionDate,
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Patient Payment Report");
    
    const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    XLSX.writeFile(wb, `Patient_Payment_Report_${monthName.replace(' ', '_')}.xlsx`);
  };

  // Use stats from hook instead of calculating locally

  if (loading) {
    return <LoadingScreen message="Loading patient payment data..." />;
  }

  return (
    <div className="crm-page-bg">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* CRM Header */}
        <div className="crm-header-container">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
            <div className="flex items-center gap-3">
              <div className="crm-header-icon">
                <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Patient Payment Management</h1>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              <Button
                onClick={handleSaveMonthlyRecords}
                disabled={loading}
                className="global-btn flex-1 sm:flex-none text-xs sm:text-sm px-3 sm:px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                title={`Save monthly records for ${months[selectedMonth - 1]} ${selectedYear}`}
              >
                <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden lg:inline">Save Monthly - {months[selectedMonth - 1]} {selectedYear}</span>
                <span className="hidden sm:inline lg:hidden">Save {months[selectedMonth - 1]}</span>
                <span className="sm:hidden">Save</span>
              </Button>
              
              <ActionButtons.MonthYear
                onClick={() => setShowMonthYearDialog(true)}
                text={`${months[selectedMonth - 1]} ${selectedYear}`}
              />
              
              <Button 
                onClick={exportToExcel}
                className="global-btn flex-1 sm:flex-none text-xs sm:text-sm px-3 sm:px-4 py-2"
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">Export</span>
              </Button>
              
              <ActionButtons.Refresh onClick={() => {
                console.log('🔄 Manual refresh triggered - refreshing data');
                refreshDataHandler();
              }} />
              
       
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
                    <Activity className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">{months[selectedMonth - 1]} {selectedYear}</span>
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
                  <p className="text-xs sm:text-sm font-medium text-green-700 mb-1 truncate">Total Fees</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-900 mb-1">₹{stats.totalTestReportAmount.toLocaleString()}</p>
                  <div className="flex items-center text-xs text-green-600">
                    <IndianRupee className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">{months[selectedMonth - 1]} {selectedYear}</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-green">
                  <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="crm-stat-card crm-stat-card-purple">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-purple-700 mb-1 truncate">Total Paid</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-900 mb-1">₹{stats.totalPaid.toLocaleString()}</p>
                  <div className="flex items-center text-xs text-purple-600">
                    <CheckCircle className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">{months[selectedMonth - 1]} {selectedYear}</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-purple">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="crm-stat-card crm-stat-card-orange">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-orange-700 mb-1 truncate">Total Pending</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-900 mb-1">₹{stats.totalPending.toLocaleString()}</p>
                  <div className="flex items-center text-xs text-orange-600">
                    <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">{months[selectedMonth - 1]} {selectedYear}</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-orange">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Controls */}
        <div className="crm-controls-container">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search patients by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          </div>
        </div>

        {/* Patient Payment Table */}
        <Card className="crm-table-container">
          <CardHeader className="crm-table-header">
            <div className="crm-table-title">
              <CreditCard className="crm-table-title-icon" />
              <span className="crm-table-title-text">Patient Payment Management - {months[selectedMonth - 1]} {selectedYear} ({filteredPatients.length})</span>
              <span className="crm-table-title-text-mobile">{months[selectedMonth - 1]} {selectedYear} ({filteredPatients.length})</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80 hover:bg-gray-50">
                    <TableHead className="text-center font-semibold text-gray-700">S.No</TableHead>
                    <TableHead className="text-center font-semibold text-gray-700">Profile</TableHead>
                    <TableHead className="text-center font-semibold text-gray-700">Admission Date</TableHead>
                    <TableHead className="text-center font-semibold text-gray-700">Patient ID</TableHead>
                    <TableHead className="text-center font-semibold text-gray-700">Patient Name</TableHead>
                    <TableHead className="text-center font-semibold text-gray-700">Monthly Fees</TableHead>
                    <TableHead className="text-center font-semibold text-gray-700">Other Fees</TableHead>
                    <TableHead className="text-center font-semibold text-gray-700">Carry Forward</TableHead>
                    <TableHead className="text-center font-semibold text-gray-700">Total Paid</TableHead>
                    <TableHead className="text-center font-semibold text-gray-700">Remaining Balance</TableHead>
                    <TableHead className="text-center font-semibold text-gray-700">Status</TableHead>
                    <TableHead className="text-center font-semibold text-gray-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients.length > 0 ? (
                    filteredPatients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((patient, index) => {
                      const advance = parseNumeric(patient.advance_amount);
                      const carryForward = parseNumeric(patient.carry_forward);
                      const totalPaid = parseNumeric(patient.total_paid);
                      const monthlyFees = parseNumeric(patient.monthlyFees);
                      const otherFees = parseNumeric(patient.otherFees);
                      const totalAmount = monthlyFees + otherFees + carryForward; // Include carry forward in total
                      const remainingBalance = totalAmount - totalPaid; // Calculate proper remaining balance
                      const globalIndex = (currentPage - 1) * itemsPerPage + index + 1;
                      
                      return (
                        <TableRow 
                          key={patient.id} 
                          className="hover:bg-gray-50/80 transition-colors duration-200 group"
                        >
                          {/* S.No */}
                          <TableCell className="py-4 px-6 text-center font-medium text-gray-900">
                            {globalIndex}
                          </TableCell>
                          
                          {/* Profile */}
                          <TableCell className="py-4 px-6 text-center">
                            <div className="flex justify-center">
                              <PatientPhoto
                                photoPath={patient.photo}
                                alt={patient.name}
                                className="w-10 h-10 border-2 border-green-200 shadow-sm rounded-full object-cover"
                                showPlaceholder={true}
                              />
                            </div>
                          </TableCell>
                          
                          {/* Admission Date */}
                          <TableCell className="py-4 px-6 text-center">
                            <span className="text-sm text-gray-600">
                              {patient.admissionDate ? format(new Date(patient.admissionDate), 'dd/MM/yyyy') : '-'}
                            </span>
                          </TableCell>
                          
                          {/* Patient ID */}
                          <TableCell className="py-4 px-6 text-center">
                            <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                              {patient.id}
                            </Badge>
                          </TableCell>
                          
                          {/* Patient Name */}
                          <TableCell className="py-4 px-6 text-center font-medium text-gray-900">
                            {patient.name}
                          </TableCell>
                          
                          {/* Monthly Fees */}
                          <TableCell className="py-4 px-6 text-center">
                            <span className="text-sm font-medium text-green-600">
                              ₹{monthlyFees.toLocaleString()}
                            </span>
                          </TableCell>
                          
                          {/* Other Fees */}
                          <TableCell className="py-4 px-6 text-center">
                            <span className="text-sm font-medium text-orange-600">
                              ₹{otherFees.toLocaleString()}
                            </span>
                          </TableCell>
                          
                          {/* Carry Forward */}
                          <TableCell className="py-4 px-6 text-center">
                            <span className="text-sm font-medium text-purple-600">
                              ₹{carryForward.toLocaleString()}
                            </span>
                          </TableCell>
                          
                          {/* Total Paid */}
                          <TableCell className="py-4 px-6 text-center">
                            <span className="text-sm font-medium text-blue-600">
                              ₹{totalPaid.toLocaleString()}
                            </span>
                          </TableCell>
                          
                          {/* Balance */}
                          <TableCell className="py-4 px-6 text-center">
                            <span className={`text-sm font-medium ${remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              ₹{remainingBalance.toLocaleString()}
                            </span>
                          </TableCell>
                          
                          {/* Status */}
                          <TableCell className="py-4 px-6 text-center">
                            <Badge 
                              className={`text-xs ${remainingBalance > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}
                            >
                              {remainingBalance > 0 ? 'Pending' : 'Paid'}
                            </Badge>
                          </TableCell>
                          
                          {/* Actions */}
                          <TableCell className="py-4 px-6 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleRecordPayment(patient)}
                                className="action-btn-lead action-btn-add h-8 w-8 sm:h-9 sm:w-9 p-0"
                                title="Record Payment"
                              >
                                <CreditCard className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center py-12">
                        <div className="flex flex-col items-center justify-center space-y-4">
                          <div className="p-4 bg-gray-100 rounded-full">
                            <Users className="h-8 w-8 text-gray-400" />
                          </div>
                          <div className="text-center">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
                            <p className="text-gray-500">No patients match your search criteria.</p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {Math.ceil(filteredPatients.length / itemsPerPage) > 1 && (
              <div className="crm-pagination-container">
                <div className="text-xs sm:text-sm text-gray-600 order-2 sm:order-1">
                  <span className="hidden sm:inline">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredPatients.length)} of {filteredPatients.length} patients
                  </span>
                  <span className="sm:hidden">
                    {currentPage} / {Math.ceil(filteredPatients.length / itemsPerPage)}
                  </span>
                </div>
                <div className="flex items-center gap-2 order-1 sm:order-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="bg-white hover:bg-gray-50 text-gray-600 border-gray-300 text-xs sm:text-sm px-2 sm:px-3"
                  >
                    <span className="hidden sm:inline">Previous</span>
                    <span className="sm:hidden">Prev</span>
                  </Button>
                  
                  <div className="hidden sm:flex items-center gap-1">
                    {Array.from({ length: Math.min(5, Math.ceil(filteredPatients.length / itemsPerPage)) }, (_, i) => {
                      const pageNumber = i + Math.max(1, currentPage - 2);
                      if (pageNumber > Math.ceil(filteredPatients.length / itemsPerPage)) return null;
                      return (
                        <Button
                          key={pageNumber}
                          variant={currentPage === pageNumber ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNumber)}
                          className={`w-8 h-8 p-0 text-xs ${
                            currentPage === pageNumber 
                              ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600' 
                              : 'bg-white hover:bg-gray-50 text-gray-600 border-gray-300'
                          }`}
                        >
                          {pageNumber}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(Math.min(Math.ceil(filteredPatients.length / itemsPerPage), currentPage + 1))}
                    disabled={currentPage === Math.ceil(filteredPatients.length / itemsPerPage)}
                    className="bg-white hover:bg-gray-50 text-gray-600 border-gray-300 text-xs sm:text-sm px-2 sm:px-3"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <span className="sm:hidden">Next</span>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Month Year Dialog */}
        <MonthYearPickerDialog
          open={showMonthYearDialog}
          onOpenChange={setShowMonthYearDialog}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={handleMonthChange}
          onYearChange={handleYearChange}
          onApply={async () => {
            setShowMonthYearDialog(false);
            await applyFilter(); // Apply filter manually only when button is clicked
          }}
          title="Select Month & Year"
          description="Select month and year for patient payment data"
          previewText="patient records"
        />

        {/* Payment History Month/Year Dialog */}
        <MonthYearPickerDialog
          open={showHistoryMonthYearDialog}
          onOpenChange={setShowHistoryMonthYearDialog}
          selectedMonth={historyFilterMonth || selectedMonth}
          selectedYear={historyFilterYear || selectedYear}
          onMonthChange={setHistoryFilterMonth}
          onYearChange={setHistoryFilterYear}
          onApply={() => {
            setShowHistoryMonthYearDialog(false);
          }}
          title="Select Month & Year for Payment History"
          description="Filter payment history by month and year"
          previewText="payment records"
        />

        {/* Payment Modal - Beautiful Design with Portal (mirroring Staff Salary) */}
        {showPaymentModal && selectedPatient && createPortal(
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" 
            style={{ 
              zIndex: 9999,
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0
            }}
            onClick={() => setShowPaymentModal(false)}
          >
            <div 
              className="max-w-[95vw] max-h-[95vh] w-full sm:max-w-6xl overflow-hidden bg-gradient-to-br from-white to-blue-50/30 border-0 shadow-2xl p-0 m-4 rounded-xl" 
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header - Beautiful Design */}
              <div className="relative pb-3 sm:pb-4 md:pb-6 border-b border-blue-100 px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-6">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500"></div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                      <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-1">
                        Payment Management
                      </h2>
                      <p className="text-sm sm:text-base text-gray-600">
                        Patient: <span className="font-semibold text-blue-600">{selectedPatient.name}</span> • ID: {selectedPatient.id}
                      </p>
                      <span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg border border-green-200">
                        New Transaction
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPaymentModal(false)}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Modal Body - Beautiful Design */}
              <div className="overflow-y-auto max-h-[calc(95vh-120px)] custom-scrollbar">
                <div className="p-4 lg:p-6 space-y-6">
                  
                  {/* Patient Information Section - Beautiful Card Layout */}
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 lg:p-6 border border-blue-200 shadow-lg">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-4 border-white shadow-lg flex-shrink-0">
                        <PatientPhoto 
                          photoPath={selectedPatient.photo || ''}
                          alt={selectedPatient.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">{selectedPatient.name}</h3>
                        <p className="text-base text-gray-600 mb-3">Patient ID: {selectedPatient.id}</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge className="bg-blue-100 text-blue-800 text-sm">
                            📞 {selectedPatient.phone || 'N/A'}
                          </Badge>
                          {selectedPatient.email && (
                            <Badge className="bg-green-100 text-green-800 text-sm">
                              📧 {selectedPatient.email}
                            </Badge>
                          )}
                          {selectedPatient.admissionDate && (
                            <Badge className="bg-purple-100 text-purple-800 text-sm">
                              📅 {new Date(selectedPatient.admissionDate).toLocaleDateString('en-IN')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Financial Summary Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Monthly Fees Card */}
                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center shadow-sm">
                            <IndianRupee className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Monthly Fees</p>
                          </div>
                        </div>
                        <p className="text-lg font-bold text-green-900">₹{parseNumeric(selectedPatient.monthlyFees || 0).toLocaleString('en-IN')}</p>
                      </div>

                      {/* Other Fees Card */}
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center shadow-sm">
                            <Activity className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide">Other Fees</p>
                          </div>
                        </div>
                        <p className="text-lg font-bold text-orange-900">₹{parseNumeric(selectedPatient.otherFees || 0).toLocaleString('en-IN')}</p>
                      </div>

                      {/* Total Paid Card */}
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center shadow-sm">
                            <CheckCircle className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Total Paid</p>
                          </div>
                        </div>
                        <p className="text-lg font-bold text-blue-900">₹{parseNumeric(selectedPatient.total_paid || 0).toLocaleString('en-IN')}</p>
                      </div>

                      {/* Balance Card */}
                      <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border border-red-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center shadow-sm">
                            <XCircle className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">Balance</p>
                          </div>
                        </div>
                        <p className="text-lg font-bold text-red-900">₹{parseNumeric(selectedPatient.balance || 0).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Form Section - Beautiful Design */}
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 lg:p-6 border border-blue-200 shadow-lg">
                    <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <div className="w-6 h-6 md:w-8 md:h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <Plus className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
                      </div>
                      Record New Payment
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-xl border border-blue-100">
                        <Label className="block text-sm font-medium text-blue-600 mb-2 uppercase tracking-wide">
                          Payment Date *
                        </Label>
                        <Input
                          type="date"
                          value={paymentFormData.date}
                          onChange={(e) => setPaymentFormData(prev => ({ ...prev, date: e.target.value }))}
                          className="w-full border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                        />
                      </div>
                      
                      <div className="bg-gradient-to-br from-green-50 to-white p-4 rounded-xl border border-green-100">
                        <Label className="block text-sm font-medium text-green-600 mb-2 uppercase tracking-wide">
                          Amount (₹) *
                        </Label>
                        <Input
                          type="number"
                          placeholder="Enter payment amount"
                          value={paymentFormData.amount}
                          onChange={(e) => setPaymentFormData(prev => ({ ...prev, amount: e.target.value }))}
                          className="w-full border-green-200 focus:border-green-400 focus:ring-green-400"
                        />
                      </div>
                      
                      <div className="bg-gradient-to-br from-purple-50 to-white p-4 rounded-xl border border-purple-100">
                        <Label className="block text-sm font-medium text-purple-600 mb-2 uppercase tracking-wide">
                          Payment Type *
                        </Label>
                        <Select
                          value={paymentFormData.type}
                          onValueChange={(value) => setPaymentFormData(prev => ({ ...prev, type: value }))}
                        >
                          <SelectTrigger className="w-full border-purple-200 focus:border-purple-400">
                            <SelectValue placeholder="Select payment type" />
                          </SelectTrigger>
                          <SelectContent 
                            className="z-[99999]" 
                            style={{ 
                              zIndex: 2147483647,
                              position: 'relative'
                            }}
                          >
                            <SelectItem value="fee_payment">Fee Payment</SelectItem>
                            <SelectItem value="advance_payment">Advance Payment</SelectItem>
                            <SelectItem value="partial_payment">Partial Payment</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <Button 
                        onClick={handleSubmitPayment}
                        disabled={isSubmitting || !paymentFormData.amount || !paymentFormData.date}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 text-lg font-semibold shadow-lg"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Recording Payment...
                          </>
                        ) : (
                          <>
                            <Save className="h-5 w-5 mr-2" />
                            Record Payment
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Payment Calculation Display */}
                  {paymentModalSelectedMonth !== null && paymentModalSelectedYear !== null && (
                    <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 lg:p-6 border border-blue-200 shadow-lg">
                      <h4 className="font-bold text-gray-900 mb-4 text-center text-lg">
                        Payment Calculation for {months[paymentModalSelectedMonth - 1]} {paymentModalSelectedYear}
                      </h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                        {/* Monthly Fees Total */}
                        <div className="bg-white p-4 rounded-lg border border-blue-200 text-center">
                          <p className="text-sm text-gray-600 mb-2 font-medium">Monthly Fees</p>
                          <p className="text-xl font-bold text-blue-600">
                            ₹{parseNumeric(selectedPatient.monthlyFees || 0).toLocaleString('en-IN')}
                          </p>
                        </div>
                        
                        {/* Other Fees */}
                        <div className="bg-white p-4 rounded-lg border border-orange-200 text-center">
                          <p className="text-sm text-gray-600 mb-2 font-medium">Other Fees</p>
                          <p className="text-xl font-bold text-orange-600">
                            ₹{parseNumeric(selectedPatient.otherFees || 0).toLocaleString('en-IN')}
                          </p>
                        </div>

                        {/* Carry Forward */}
                        <div className="bg-white p-4 rounded-lg border border-yellow-200 text-center">
                          <p className="text-sm text-gray-600 mb-2 font-medium">Carry Forward</p>
                          <p className="text-xl font-bold text-yellow-600">
                            ₹{parseNumeric(selectedPatient.carry_forward || 0).toLocaleString('en-IN')}
                          </p>
                          <div className="text-xs text-gray-500 mt-1">
                            Previous Month
                          </div>
                        </div>
                        
                        {/* Total Amount */}
                        <div className="bg-white p-4 rounded-lg border border-green-200 text-center">
                          <p className="text-sm text-gray-600 mb-2 font-medium">Total Amount</p>
                          <p className="text-xl font-bold text-green-600">
                            ₹{(parseNumeric(selectedPatient.monthlyFees || 0) + parseNumeric(selectedPatient.otherFees || 0) + parseNumeric(selectedPatient.carry_forward || 0)).toLocaleString('en-IN')}
                          </p>
                          <div className="text-xs text-gray-500 mt-1">
                            Including Carry Forward
                          </div>
                        </div>

                        {/* Total Paid Amount */}
                        <div className="bg-white p-4 rounded-lg border border-purple-200 text-center">
                          <p className="text-sm text-gray-600 mb-2 font-medium">Total Paid Amount</p>
                          <p className="text-xl font-bold text-purple-600">
                            ₹{parseNumeric(selectedPatient.total_paid || 0).toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                      
                      {/* Remaining Balance Row */}
                      <div className="grid grid-cols-1 gap-4 mb-4">
                        {/* Remaining Balance */}
                        <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200 text-center shadow-sm">
                          <p className="text-sm text-gray-600 mb-2 font-medium">Remaining Balance</p>
                          <p className="text-2xl font-bold text-red-600">
                            ₹{((parseNumeric(selectedPatient.monthlyFees || 0) + parseNumeric(selectedPatient.otherFees || 0) + parseNumeric(selectedPatient.carry_forward || 0)) - parseNumeric(selectedPatient.total_paid || 0)).toLocaleString('en-IN')}
                          </p>
                          <div className="text-xs text-gray-500 mt-2">
                            Total Amount - Total Paid Amount
                          </div>
                        </div>
                      </div>
                      
                      {/* Calculation Formula - Mobile Responsive */}
                      <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300">
                        <div className="flex flex-col lg:flex-row items-center justify-center gap-3 text-lg">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-blue-600">
                              ₹{parseNumeric(selectedPatient.monthlyFees || 0).toLocaleString('en-IN')}
                            </span>
                            <span className="text-gray-500">+</span>
                            <span className="font-semibold text-orange-600">
                              ₹{parseNumeric(selectedPatient.otherFees || 0).toLocaleString('en-IN')}
                            </span>
                            <span className="text-gray-500">+</span>
                            <span className="font-semibold text-yellow-600">
                              ₹{parseNumeric(selectedPatient.carry_forward || 0).toLocaleString('en-IN')}
                            </span>
                            <span className="text-gray-500">=</span>
                            <Badge className="bg-green-100 text-green-800 text-lg px-3 py-1 font-bold">
                              ₹{(parseNumeric(selectedPatient.monthlyFees || 0) + parseNumeric(selectedPatient.otherFees || 0) + parseNumeric(selectedPatient.carry_forward || 0)).toLocaleString('en-IN')}
                            </Badge>
                          </div>
                          
                          <div className="hidden lg:block w-px h-8 bg-gray-300"></div>
                          <div className="block lg:hidden w-full h-px bg-gray-300"></div>
                          
                          <div className="flex items-center gap-3">
                            <span className="text-gray-600 font-medium">Total Paid:</span>
                            <Badge className="bg-purple-100 text-purple-800 text-lg px-3 py-1 font-bold">
                              ₹{parseNumeric(selectedPatient.total_paid || 0).toLocaleString('en-IN')}
                            </Badge>
                          </div>
                        </div>
                        
                        {/* Remaining Balance Calculation */}
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex flex-col lg:flex-row items-center justify-center gap-3 text-lg">
                            <div className="flex items-center gap-3">
                              <span className="font-semibold text-green-600">
                                ₹{(parseNumeric(selectedPatient.monthlyFees || 0) + parseNumeric(selectedPatient.otherFees || 0) + parseNumeric(selectedPatient.carry_forward || 0)).toLocaleString('en-IN')}
                              </span>
                              <span className="text-gray-500">-</span>
                              <span className="font-semibold text-purple-600">
                                ₹{parseNumeric(selectedPatient.total_paid || 0).toLocaleString('en-IN')}
                              </span>
                              <span className="text-gray-500">=</span>
                              <Badge className="bg-red-100 text-red-800 text-lg px-3 py-1 font-bold">
                                ₹{((parseNumeric(selectedPatient.monthlyFees || 0) + parseNumeric(selectedPatient.otherFees || 0) + parseNumeric(selectedPatient.carry_forward || 0)) - parseNumeric(selectedPatient.total_paid || 0)).toLocaleString('en-IN')}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-center text-xs text-gray-500 mt-3 space-y-1">
                          <p>Monthly Fees + Other Fees + Carry Forward = Total Amount</p>
                          <p className="text-purple-600 font-medium">Total Paid Amount = Sum of All Payments Made</p>
                          <p className="text-red-600 font-medium">Remaining Balance = Total Amount - Total Paid Amount</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Payment History Section */}
                  {paymentHistory.length > 0 && (
                    <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 lg:p-6 border border-blue-200 shadow-lg">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                        <h3 className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
                          <div className="w-6 h-6 md:w-8 md:h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                            <History className="h-3 w-3 md:h-4 md:w-4 text-purple-600" />
                          </div>
                          Payment History ({filteredPaymentHistory.length})
                        </h3>
                        
                        {/* Month/Year Selector for Payment History */}
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => setShowHistoryMonthYearDialog(true)}
                            className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-3 py-2 rounded-lg text-sm font-medium"
                          >
                            <CalendarIcon className="h-4 w-4" />
                            <span>
                              {(historyFilterMonth || selectedMonth) !== null && (historyFilterYear || selectedYear) !== null 
                                ? `${months[(historyFilterMonth || selectedMonth) - 1]} ${historyFilterYear || selectedYear}`
                                : 'All Months'
                              }
                            </span>
                          </Button>
                        </div>
                      </div>
                      
                      {/* Payment History Table */}
                      <div className="w-full overflow-x-auto">
                        <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-sm">
                          <thead>
                            <tr className="bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 text-white">
                              <th className="px-4 py-3 text-center text-sm font-semibold">S.No</th>
                              <th className="px-4 py-3 text-center text-sm font-semibold">Date</th>
                              <th className="px-4 py-3 text-center text-sm font-semibold">Amount (₹)</th>
                              <th className="px-4 py-3 text-center text-sm font-semibold">Type</th>
                              <th className="px-4 py-3 text-center text-sm font-semibold">Payment Mode</th>
                              <th className="px-4 py-3 text-center text-sm font-semibold">Notes</th>
                              <th className="px-4 py-3 text-center text-sm font-semibold">Created At</th>
                              <th className="px-4 py-3 text-center text-sm font-semibold">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {filteredPaymentHistory.length === 0 ? (
                              <tr>
                                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                                  {(historyFilterMonth || selectedMonth) !== null && (historyFilterYear || selectedYear) !== null 
                                    ? `No payment records found for ${months[(historyFilterMonth || selectedMonth) - 1]} ${historyFilterYear || selectedYear}`
                                    : 'No payment history found'
                                  }
                                </td>
                              </tr>
                            ) : (
                              filteredPaymentHistory.map((payment, index) => (
                              <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 text-sm text-gray-900 text-center font-medium">{index + 1}</td>
                                <td className="px-4 py-3 text-sm text-gray-900 text-center">
                                  {new Date(payment.payment_date).toLocaleDateString('en-IN')}
                                </td>
                                <td className="px-4 py-3 text-sm font-bold text-green-600 text-center">
                                  ₹{parseNumeric(payment.payment_amount).toLocaleString('en-IN')}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <Badge 
                                    className={`text-xs font-medium px-2 py-1 rounded-full border
                                      ${payment.type === 'fee_payment' ? 'border-blue-200 text-blue-700 bg-blue-50' : ''}
                                      ${payment.type === 'advance_payment' ? 'border-orange-200 text-orange-700 bg-orange-50' : ''}
                                      ${payment.type === 'partial_payment' ? 'border-purple-200 text-purple-700 bg-purple-50' : ''}
                                    `}
                                  >
                                    {payment.type?.replace('_', ' ') || 'fee payment'}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 text-center">{payment.payment_mode || 'Bank Transfer'}</td>
                                <td className="px-4 py-3 text-sm text-gray-900 text-center">{payment.notes || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-600 text-center">
                                  {new Date(payment.created_at).toLocaleDateString('en-IN')} {new Date(payment.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setPaymentToDelete(payment);
                                      setShowDeleteDialog(true);
                                    }}
                                    className="action-btn-lead action-btn-delete h-8 w-8 sm:h-9 sm:w-9 p-0"
                                    title="Delete payment record"
                                  >
                                    <Trash2 className="h-4 w-4 sm:h-4 sm:w-4" />
                                  </Button>
                                </td>
                              </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Delete Payment Confirmation Dialog */}
        {showDeleteDialog && createPortal(
          <div 
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black bg-opacity-50"
            style={{ 
              zIndex: 2147483647,
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0
            }}
            onClick={() => {
              setShowDeleteDialog(false);
              setPaymentToDelete(null);
            }}
          >
            <div 
              className="relative z-[100000] w-full max-w-md mx-auto"
              style={{ zIndex: 2147483647 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white rounded-lg shadow-2xl border-0 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <Trash2 className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-red-700">
                        Delete Payment Record
                      </h3>
                      <p className="text-sm text-gray-600">
                        Are you sure you want to delete this payment record? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                  
                  {paymentToDelete && (
                    <div className="my-4 p-4 bg-gray-50 rounded-lg border">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Amount:</span>
                          <p className="font-bold text-green-600">₹{parseNumeric(paymentToDelete.payment_amount).toLocaleString('en-IN')}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Date:</span>
                          <p className="text-gray-900">{new Date(paymentToDelete.payment_date).toLocaleDateString('en-IN')}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Type:</span>
                          <p className="text-gray-900">{paymentToDelete.type?.replace('_', ' ') || 'fee payment'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Mode:</span>
                          <p className="text-gray-900">{paymentToDelete.payment_mode || 'Bank Transfer'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowDeleteDialog(false);
                        setPaymentToDelete(null);
                      }}
                      disabled={deletingPayment}
                      className="px-4 py-2"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeletePayment}
                      disabled={deletingPayment}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700"
                    >
                      {deletingPayment ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Payment
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
};

export default PatientPaymentFees;
