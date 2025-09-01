import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ActionButtons } from '@/components/ui/HeaderActionButtons';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  RefreshCw, 
  Calendar, 
  Download, 
  Plus, 
  Search, 
  Users, 
  IndianRupee,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Eye,
  Edit,
  Save,
  X,
  Trash2,
  Stethoscope,
  CalendarDays,
  UserCheck,
  Activity
} from 'lucide-react';
import { DatabaseService } from '@/services/databaseService';
import { DoctorSalaryAPI } from '@/services/doctorSalaryAPI';
import { toast } from 'sonner';
import { format } from 'date-fns';
import MonthYearPickerDialog from '@/components/shared/MonthYearPickerDialog';
import usePageTitle from '@/hooks/usePageTitle';
import '@/styles/global-crm-design.css';

interface Doctor {
  id: string;
  name: string;
  photo?: string;
  salary: string | number;
  total_paid: string | number;
  payment_mode?: string;
  status?: string;
  specialization?: string;
  join_date?: string;
  advance_amount?: string | number;
  carry_forward?: string | number;
}

const DoctorSalary: React.FC = () => {
  // Set page title
  usePageTitle();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  
  // Payment modal states
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentFormData, setPaymentFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    type: 'salary'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Delete confirmation dialog states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<any>(null);
  const [deletingPayment, setDeletingPayment] = useState(false);

  // Payment filtering now uses main page month/year filter
  const [filteredPaymentHistory, setFilteredPaymentHistory] = useState<any[]>([]);
  const [monthlyAdvanceAmount, setMonthlyAdvanceAmount] = useState<number>(0);

  // Month and year state for filtering - same as GroceryManagement
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentMonth = new Date().getMonth() + 1; // 1-based
  const currentYear = new Date().getFullYear();
  const [showMonthYearDialog, setShowMonthYearDialog] = useState(false);
  const [filterMonth, setFilterMonth] = useState<number | null>(currentMonth); // Also 1-based
  const [filterYear, setFilterYear] = useState<number | null>(currentYear);

  const rowsPerPage = 10;
  const monthNames = ['all', 'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

  // Helper function to get doctor photo URL
  const getDoctorPhotoUrl = (photoPath: string) => {
    if (!photoPath) return '/api/placeholder/40/40';
    
    // Handle both old and new path formats
    if (photoPath.startsWith('Photos/') || photoPath.startsWith('Photos\\')) {
      return `${import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:4000'}/${photoPath.replace(/\\/g, '/')}`;
    }
    
    return `${import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:4000'}/${photoPath}`;
  };

  // Helper function to format date - matching DoctorManagement format
  const formatDate = (dateValue: string | Date | null | undefined) => {
    if (!dateValue) return 'N/A';
    
    try {
      let date: Date;
      
      // Handle different input types
      if (dateValue instanceof Date) {
        date = dateValue;
      } else if (typeof dateValue === 'string') {
        date = new Date(dateValue);
      } else {
        return 'N/A';
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'N/A';
      }
      
      // Use the same format as DoctorManagement: MM/dd/yyyy
      return format(date, 'MM/dd/yyyy');
    } catch (error) {
      console.warn('Error formatting date:', dateValue, error);
      return 'N/A';
    }
  };

  // Helper function to safely parse numeric values
  const parseNumeric = (value: string | number): number => {
    if (typeof value === 'number') return value;
    return parseFloat(String(value)) || 0;
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  // Refetch doctors when filter month/year changes
  useEffect(() => {
    if (filterMonth !== null && filterYear !== null) {
      fetchDoctors();
    }
  }, [filterMonth, filterYear]);

  // Filter payment history by main page month/year filter
  useEffect(() => {
    if (paymentHistory.length > 0) {
      let filtered = paymentHistory;
      
      // Apply main page month/year filtering if set
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
  }, [paymentHistory, filterMonth, filterYear]);

  // Debug logging for filter changes
  useEffect(() => {
    console.log('📅 Filter changed:', {
      filterMonth,
      filterYear,
      monthName: filterMonth !== null ? months[filterMonth] : 'All',
      totalDoctors: doctors.length,
      filteredCount: doctors.filter(doctor => {
        let matchesJoinDate = true;
        if (filterMonth !== null && filterYear !== null && doctor.join_date) {
          const joinDate = new Date(doctor.join_date);
          const selectedDate = new Date(filterYear, filterMonth - 1, 31); // Convert 1-based month to 0-based for Date constructor
          matchesJoinDate = joinDate <= selectedDate;
          console.log(`Doctor ${doctor.name}: join_date=${doctor.join_date}, joinDate=${joinDate.toDateString()}, selectedDate=${selectedDate.toDateString()}, matches=${matchesJoinDate}`);
        }
        return matchesJoinDate;
      }).length
    });
  }, [filterMonth, filterYear, doctors]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      console.log('🩺 Fetching doctors with salary information...');
      console.log('📅 Filter Month/Year:', filterMonth, filterYear);
      
      // Pass the selected month and year to the API
      // filterMonth is 1-based (1-12), same as API expects
      const apiMonth = filterMonth;
      const apiYear = filterYear;
      
      console.log('📅 API Month/Year:', apiMonth, apiYear);
      const response = await DoctorSalaryAPI.getAllDoctorsWithSalary(apiMonth, apiYear);
      console.log('🩺 Doctors fetched:', response);
      
      // Debug join_date values
      if (response && response.length > 0) {
        response.forEach(doctor => {
          console.log(`👨‍⚕️ Doctor ${doctor.name}:`, {
            id: doctor.id,
            join_date: doctor.join_date,
            join_date_type: typeof doctor.join_date,
            formatted_date: formatDate(doctor.join_date),
            advance_amount: doctor.advance_amount || 0
          });
        });
      }
      
      setDoctors(response || []);
      setLoading(false); // Set loading to false immediately after setting doctors
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error('Failed to fetch doctor data');
      setDoctors([]);
      setLoading(false);
    }
  };

  // Filter doctors based on search and join date relative to selected month/year
  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doctor.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Join date filtering - only show doctors who joined before or during the selected month/year
    let matchesJoinDate = true;
    if (filterMonth !== null && filterYear !== null && doctor.join_date) {
      const joinDate = new Date(doctor.join_date);
      const selectedDate = new Date(filterYear, filterMonth - 1, 31); // Convert 1-based month to 0-based for Date constructor
      matchesJoinDate = joinDate <= selectedDate;
    }
    
    return matchesSearch && matchesJoinDate;
  }).sort((a, b) => {
    // Sort by Doctor ID in ascending order (DOC001, DOC002, etc.)
    const extractNumber = (id: string) => {
      const match = id.match(/DOC(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    };
    
    const numA = extractNumber(a.id);
    const numB = extractNumber(b.id);
    
    return numA - numB;
  });

  // Calculate statistics
  const totalDoctors = filteredDoctors.length;
  const totalSalary = filteredDoctors.reduce((sum, d) => sum + parseNumeric(d.salary) + parseNumeric(d.carry_forward || 0), 0);
  const totalPaid = filteredDoctors.reduce((sum, d) => sum + parseNumeric(d.total_paid) + parseNumeric(d.advance_amount || 0), 0);
  const totalPending = totalSalary - totalPaid;
  const activeDoctors = filteredDoctors.filter(d => d.status === 'Active').length;

  // Pagination
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentDoctors = filteredDoctors.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredDoctors.length / rowsPerPage);

  const exportToCSV = () => {
    const headers = ['S.No', 'Doctor ID', 'Doctor Name', 'Joining Date', 'Salary', 'Advance', 'Carry Forward', 'Total Paid', 'Balance', 'Status'];
    const csvData = [
      headers.join(','),
      ...filteredDoctors.map((doctor, index) => {
        const totalPaidWithAdvance = parseNumeric(doctor.total_paid) + parseNumeric(doctor.advance_amount || 0);
        const balance = parseNumeric(doctor.salary) + parseNumeric(doctor.carry_forward || 0) - totalPaidWithAdvance;
        return [
          index + 1,
          doctor.id,
          doctor.name,
          formatDate(doctor.join_date),
          doctor.salary || '0',
          parseNumeric(doctor.advance_amount || 0).toString(),
          parseNumeric(doctor.carry_forward || 0).toString(),
          totalPaidWithAdvance.toString(),
          balance.toString(),
          balance > 0 ? 'Pending' : 'Paid'
        ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(',');
      })
    ].join('\n');
    
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Generate filename with month/year filter if applied
    let filename = 'doctor-salary';
    if (filterMonth !== null && filterYear !== null) {
      filename += `-${months[filterMonth - 1]}-${filterYear}`;
    }
    filename += `-${new Date().toISOString().split('T')[0]}.csv`;
    
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Save monthly records handler
  const handleSaveMonthlyRecords = async () => {
    try {
      setLoading(true);
      
      // Get current month and year from the filter or use current date
      const month = filterMonth !== null ? filterMonth : new Date().getMonth() + 1;
      const year = filterYear !== null ? filterYear : new Date().getFullYear();
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/doctor-salaries/save-monthly-records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          month,
          year
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Monthly records saved successfully for ${months[month-1]} ${year}!`, {
          description: `${data.recordsProcessed || 0} doctor records processed${data.carryForwardUpdates ? `, ${data.carryForwardUpdates} with carry-forward` : ''}`
        });
        
        // Check if there are carry forward amounts and ask user about automatic processing
        if (data.carryForwardUpdates > 0) {
          setTimeout(() => {
            toast.info(`${data.carryForwardUpdates} doctors have balance amounts`, {
              description: 'These will automatically carry forward to the next month when you save records',
              duration: 5000
            });
          }, 1000);
        }
        
        // Refresh the data to show updated information
        fetchDoctors();
      } else {
        toast.error('Failed to save monthly records', {
          description: data.message || 'Please try again'
        });
      }
    } catch (error) {
      console.error('Error saving monthly records:', error);
      toast.error('Failed to save monthly records', {
        description: 'Please check your connection and try again'
      });
    } finally {
      setLoading(false);
    }
  };

  // Action handlers
  const handleRecordPayment = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setPaymentModalOpen(true);
    setPaymentFormData({
      date: new Date().toISOString().split('T')[0],
      amount: '',
      type: 'salary'
    });
    
    fetchPaymentHistory(doctor.id);
  };

  // Fetch monthly advance amount for selected doctor and month/year
  const fetchMonthlyAdvanceAmount = async (doctorId: string, month: number, year: number) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/doctor-advance/monthly-total?doctorId=${doctorId}&month=${month}&year=${year}`);
      const data = await response.json();
      
      if (data.success) {
        setMonthlyAdvanceAmount(parseFloat(data.totalAmount || 0));
      } else {
        setMonthlyAdvanceAmount(0);
      }
    } catch (error) {
      console.error('Error fetching monthly advance amount:', error);
      setMonthlyAdvanceAmount(0);
    }
  };

  // Calculate monthly total for selected month/year
  const calculateMonthlyTotal = () => {
    const total = filteredPaymentHistory.reduce((sum, payment) => {
      return sum + (parseFloat(payment.payment_amount) || 0);
    }, 0);
    console.log('Monthly total calculation:', { filteredPayments: filteredPaymentHistory.length, total });
    return total;
  };

  // Get advance amount for selected doctor and month/year
  const getAdvanceAmount = () => {
    if (!selectedDoctor) return 0;
    
    // For now, use the advance amount from the doctor's data (already calculated for current month in backend)
    // This is the advance amount displayed in the table
    const advanceAmount = parseNumeric(selectedDoctor.advance_amount || 0);
    console.log('Advance amount calculation:', { doctorId: selectedDoctor.id, advanceAmount, rawValue: selectedDoctor.advance_amount });
    return advanceAmount;
  };

  // Calculate total paid (Monthly Total + Advance)
  const calculateTotalPaid = () => {
    const monthlyTotal = calculateMonthlyTotal();
    const advanceAmount = getAdvanceAmount();
    const totalPaid = monthlyTotal + advanceAmount;
    console.log('Total paid calculation:', { monthlyTotal, advanceAmount, totalPaid });
    return totalPaid;
  };

  const fetchPaymentHistory = async (doctorId: string) => {
    setHistoryLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/doctor-salaries/${doctorId}/history`);
      const data = await response.json();
      if (data.success) {
        setPaymentHistory(data.data || []);
      } else {
        setPaymentHistory([]);
      }
    } catch (error) {
      console.error('Error fetching payment history:', error);
      setPaymentHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleDeletePayment = (payment: any) => {
    setPaymentToDelete(payment);
    setShowDeleteDialog(true);
  };

  const confirmDeletePayment = async () => {
    if (!paymentToDelete) return;

    try {
      setDeletingPayment(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/doctor-salaries/payment/${paymentToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Payment record deleted successfully');
        // Refresh payment history
        if (selectedDoctor) {
          fetchPaymentHistory(selectedDoctor.id);
        }
        fetchDoctors(); // Refresh main doctor data
        setShowDeleteDialog(false);
        setPaymentToDelete(null);
      } else {
        toast.error(data.message || 'Failed to delete payment record');
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast.error('Failed to delete payment record');
    } finally {
      setDeletingPayment(false);
    }
  };

  const handleSubmitPayment = async () => {
    if (!selectedDoctor || !paymentFormData.amount) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      // Call API to record payment
      await DoctorSalaryAPI.recordPayment({
        doctorId: selectedDoctor.id,
        amount: parseFloat(paymentFormData.amount),
        date: paymentFormData.date,
        type: paymentFormData.type,
        payment_mode: 'Bank Transfer'
      });

      toast.success('Payment recorded successfully');
      setPaymentFormData({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        type: 'salary'
      });
      fetchDoctors(); // Refresh data
      if (selectedDoctor) {
        fetchPaymentHistory(selectedDoctor.id); // Refresh payment history
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check carry forward amounts for current month
  const checkCarryForward = async () => {
    try {
      const month = filterMonth !== null ? filterMonth : new Date().getMonth() + 1;
      const year = filterYear !== null ? filterYear : new Date().getFullYear();
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/doctor-salaries/carry-forward/${month}/${year}`);
      const data = await response.json();
      
      if (data.success && data.data.length > 0) {
        const totalCarryForward = data.totalCarryForward.toFixed(2);
        toast.info(`Carry Forward Available for ${months[month-1]} ${year}`, {
          description: `${data.data.length} doctors have ₹${parseFloat(totalCarryForward).toLocaleString()} total carry forward amount`,
          duration: 4000
        });
      }
    } catch (error) {
      console.error('Error checking carry forward:', error);
    }
  };

  // Effect to check carry forward when month/year changes
  useEffect(() => {
    if (doctors.length > 0) {
      checkCarryForward();
    }
  }, [filterMonth, filterYear]);

  return (
    <>
    <div className="crm-page-bg">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* CRM Header */}
        <div className="crm-header-container">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
            {/* Title Section */}
            <div className="flex items-center gap-3">
              <div className="crm-header-icon">
                <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Doctor Salary Management</h1>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              <Button
                onClick={handleSaveMonthlyRecords}
                disabled={loading}
                className="global-btn flex-1 sm:flex-none text-xs sm:text-sm px-3 sm:px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
              >
                <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Save Monthly</span>
                <span className="sm:hidden">Save</span>
              </Button>
              
              <ActionButtons.MonthYear
                text={`Doctor Salary (${months[(filterMonth || 1) - 1]} ${filterYear})`}
                onClick={() => setShowMonthYearDialog(true)}
              />
              
              <Button
                onClick={exportToCSV}
                className="global-btn flex-1 sm:flex-none text-xs sm:text-sm px-3 sm:px-4 py-2"
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">Export</span>
              </Button>
              
              <ActionButtons.Refresh
                onClick={() => {
                  console.log('🔄 Manual refresh triggered - refreshing entire page');
                  window.location.reload();
                }}
                loading={loading}
              />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="crm-stats-grid">
          {/* Active Doctors Card */}
          <Card className="crm-stat-card crm-stat-card-blue">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-blue-700 mb-1 truncate">Active Doctors</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-900 mb-1">{activeDoctors}</p>
                  <div className="flex items-center text-xs text-blue-600">
                    <UserCheck className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">On duty</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-blue">
                  <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Total Salary Card */}
          <Card className="crm-stat-card crm-stat-card-green">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-green-700 mb-1 truncate">Total Salary</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-900 mb-1">₹{totalSalary.toLocaleString()}</p>
                  <div className="flex items-center text-xs text-green-600">
                    <IndianRupee className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Monthly</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-green">
                  <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Total Paid Card */}
          <Card className="crm-stat-card crm-stat-card-orange">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-orange-700 mb-1 truncate">Total Paid</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-900 mb-1">₹{totalPaid.toLocaleString()}</p>
                  <div className="flex items-center text-xs text-orange-600">
                    <CheckCircle className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Completed</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-orange">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Pending Card */}
          <Card className="crm-stat-card crm-stat-card-red">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-red-700 mb-1 truncate">Pending</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-900 mb-1">₹{totalPending.toLocaleString()}</p>
                  <div className="flex items-center text-xs text-red-600">
                    <AlertCircle className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Due</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-red">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="crm-controls-container">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search doctors by name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/80 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                />
              </div>
            </div>
            
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-full sm:w-48 bg-white/80 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {monthNames.slice(1).map(month => (
                  <SelectItem key={month} value={month}>
                    {month.charAt(0).toUpperCase() + month.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Salary Table */}
        <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">
              Salary Management ({filteredDoctors.length})
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">S.No</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Profile</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Joining Date</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Doctor ID</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Doctor Name</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Salary</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Advance</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Carry Forward</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Total Paid</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Balance</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Status</th>
                  <th className="text-center py-4 px-6 text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
              {loading ? (
                <tr>
                  <td colSpan={12} className="text-center p-8">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      <span className="ml-2 text-gray-600">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : currentDoctors.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center p-8 text-gray-500">
                    No doctors found
                  </td>
                </tr>
              ) : (
                currentDoctors.map((doctor, index) => {
                  const totalPaidWithAdvance = parseNumeric(doctor.total_paid) + parseNumeric(doctor.advance_amount || 0);
                  const balance = parseNumeric(doctor.salary) + parseNumeric(doctor.carry_forward || 0) - totalPaidWithAdvance;
                  const serialNumber = startIndex + index + 1;
                  
                  return (
                    <tr key={doctor.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                      <td className="py-4 px-6 text-sm font-medium text-gray-900">{serialNumber}</td>
                      <td className="py-4 px-6">
                        <div className="flex justify-center">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 ring-2 ring-blue-100">
                            <img
                              src={getDoctorPhotoUrl(doctor.photo)}
                              alt={doctor.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/api/placeholder/40/40';
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm font-medium text-gray-600">
                        {formatDate(doctor.join_date)}
                      </td>
                      <td className="py-4 px-6 text-sm font-medium text-blue-600">
                        {doctor.id}
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm font-medium text-gray-900">{doctor.name}</div>
                      </td>
                      <td className="py-4 px-6 text-sm font-medium text-green-600">
                        ₹{parseNumeric(doctor.salary).toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-sm font-medium text-orange-600">
                        ₹{parseNumeric(doctor.advance_amount || 0).toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-sm font-medium text-purple-600">
                        ₹{parseNumeric(doctor.carry_forward || 0).toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-sm font-medium text-blue-600">
                        ₹{(parseNumeric(doctor.total_paid) + parseNumeric(doctor.advance_amount || 0)).toLocaleString()}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`text-sm font-medium ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          ₹{balance.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <Badge 
                          className={`text-xs ${balance > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}
                        >
                          {balance > 0 ? 'Pending' : 'Paid'}
                        </Badge>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleRecordPayment(doctor)}
                            className="action-btn-lead action-btn-add h-8 w-8 sm:h-9 sm:w-9 p-0"
                            title="Record Payment"
                          >
                            <CreditCard className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredDoctors.length > rowsPerPage && (
          <div className="px-4 sm:px-6 py-4 border-t border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="text-sm text-gray-700">
                Showing {Math.min(startIndex + 1, filteredDoctors.length)} to {Math.min(endIndex, filteredDoctors.length)} of {filteredDoctors.length} doctors
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="modern-btn modern-btn-secondary text-xs px-2 py-1 disabled:opacity-50"
                >
                  Previous
                </button>
                
                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="modern-btn modern-btn-secondary text-xs px-2 py-1 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
    
    {/* Month/Year Picker Dialog */}
    <MonthYearPickerDialog
      open={showMonthYearDialog}
      onOpenChange={setShowMonthYearDialog}
      selectedMonth={filterMonth || currentMonth}
      selectedYear={filterYear || currentYear}
      onMonthChange={setFilterMonth}
      onYearChange={setFilterYear}
      onApply={() => {
        setShowMonthYearDialog(false);
      }}
      title="Select Month & Year"
      description="Filter doctors by join date"
      previewText="doctors"
    />
    
    {/* Portal for Modal - Rendered outside component tree */}
    {paymentModalOpen && selectedDoctor && createPortal(
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
        onClick={() => setPaymentModalOpen(false)}
      >
        <div 
          className="max-w-[95vw] max-h-[95vh] w-full sm:max-w-6xl overflow-hidden bg-gradient-to-br from-white to-blue-50/30 border-0 shadow-2xl p-0 m-4 rounded-xl" 
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header - Beautiful Design */}
          <div className="relative pb-3 sm:pb-4 md:pb-6 border-b border-blue-100 px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-6">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500"></div>
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mt-2 sm:mt-4">
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full border-2 sm:border-4 border-white shadow-lg overflow-hidden">
                  {selectedDoctor.photo ? (
                    <img
                      src={getDoctorPhotoUrl(selectedDoctor.photo)}
                      alt={selectedDoctor.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/api/placeholder/40/40';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-blue-100 flex items-center justify-center">
                      <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1">
                  <Badge className="bg-green-100 text-green-800 border-2 border-white shadow-sm text-xs">
                    Active
                  </Badge>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-1 sm:gap-2 truncate">
                  <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-blue-600 flex-shrink-0" />
                  <span className="truncate">Dr. {selectedDoctor.name}</span>
                </h2>
                <div className="text-xs sm:text-sm md:text-lg lg:text-xl mt-1 flex items-center gap-2">
                  <span className="text-gray-600">
                    Record Payment Session
                  </span>
                  <span className="font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-200">
                    New Transaction
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPaymentModalOpen(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Modal Body - Beautiful Design */}
          <div className="overflow-y-auto max-h-[calc(95vh-100px)] sm:max-h-[calc(95vh-120px)] md:max-h-[calc(95vh-140px)] lg:max-h-[calc(95vh-200px)] custom-scrollbar">
            <div className="p-2 sm:p-3 md:p-4 lg:p-6 space-y-3 sm:space-y-4 md:space-y-6 lg:space-y-8">
              
              {/* Doctor Information Section - Beautiful Card Layout */}
              <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-blue-100 shadow-sm">
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 flex items-center gap-2">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="h-3 w-3 sm:h-3 sm:w-3 md:h-4 md:w-4 text-blue-600" />
                  </div>
                  Doctor Information
                </h3>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-6">
                  
                  {/* Full Name Card */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 sm:p-4 rounded-xl border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 sm:w-8 sm:h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-sm">
                        <Users className="h-5 w-5 sm:h-4 sm:w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm sm:text-xs font-semibold text-blue-700 uppercase tracking-wide">Full Name</p>
                      </div>
                    </div>
                    <p className="text-xl sm:text-lg font-bold text-blue-900 ml-0">{selectedDoctor.name}</p>
                  </div>

                  {/* Doctor ID Card */}
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 sm:p-4 rounded-xl border border-green-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 sm:w-8 sm:h-8 bg-green-500 rounded-lg flex items-center justify-center shadow-sm">
                        <span className="text-white font-bold text-base sm:text-sm">ID</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm sm:text-xs font-semibold text-green-700 uppercase tracking-wide">Doctor ID</p>
                      </div>
                    </div>
                    <p className="text-xl sm:text-lg font-bold text-green-900 ml-0">{selectedDoctor.id}</p>
                  </div>

                  {/* Specialization Card */}
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 sm:p-4 rounded-xl border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 sm:w-8 sm:h-8 bg-purple-500 rounded-lg flex items-center justify-center shadow-sm">
                        <Stethoscope className="h-5 w-5 sm:h-4 sm:w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm sm:text-xs font-semibold text-purple-700 uppercase tracking-wide">Specialization</p>
                      </div>
                    </div>
                    <p className="text-xl sm:text-lg font-bold text-purple-900 ml-0">{selectedDoctor.specialization || 'Neurology'}</p>
                  </div>

                  {/* Monthly Salary Card */}
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 sm:p-4 rounded-xl border border-orange-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 sm:w-8 sm:h-8 bg-orange-500 rounded-lg flex items-center justify-center shadow-sm">
                        <IndianRupee className="h-5 w-5 sm:h-4 sm:w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm sm:text-xs font-semibold text-orange-700 uppercase tracking-wide">Salary</p>
                      </div>
                    </div>
                    <p className="text-xl sm:text-lg font-bold text-orange-900 ml-0">₹{parseNumeric(selectedDoctor.salary).toLocaleString('en-IN')}</p>
                  </div>

                  {/* Advance Available Card */}
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 sm:p-4 rounded-xl border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 sm:w-8 sm:h-8 bg-purple-500 rounded-lg flex items-center justify-center shadow-sm">
                        <span className="text-white font-bold text-base sm:text-sm">₹</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm sm:text-xs font-semibold text-purple-700 uppercase tracking-wide">Advance Available</p>
                      </div>
                    </div>
                    <p className="text-xl sm:text-lg font-bold text-purple-900 ml-0">₹{parseNumeric(selectedDoctor.advance_amount || 0).toLocaleString('en-IN')}</p>
                  </div>

                  {/* Total Paid Card */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 sm:p-4 rounded-xl border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 sm:w-8 sm:h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-sm">
                        <CheckCircle className="h-5 w-5 sm:h-4 sm:w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm sm:text-xs font-semibold text-blue-700 uppercase tracking-wide">Total Paid</p>
                      </div>
                    </div>
                    <p className="text-xl sm:text-lg font-bold text-blue-900 ml-0">₹{parseNumeric(selectedDoctor.total_paid).toLocaleString('en-IN')}</p>
                  </div>

                  {/* Balance Due Card */}
                  <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 sm:p-4 rounded-xl border border-red-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 sm:w-8 sm:h-8 bg-red-500 rounded-lg flex items-center justify-center shadow-sm">
                        <AlertCircle className="h-5 w-5 sm:h-4 sm:w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm sm:text-xs font-semibold text-red-700 uppercase tracking-wide">Balance Due</p>
                      </div>
                    </div>
                    <p className="text-xl sm:text-lg font-bold text-red-900 ml-0">₹{(parseNumeric(selectedDoctor.salary) - parseNumeric(selectedDoctor.total_paid)).toLocaleString('en-IN')}</p>
                  </div>
                  
                </div>
              </div>

              {/* Payment Form Section - Beautiful Design */}
              <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-blue-100 shadow-sm">
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 flex items-center gap-2">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Plus className="h-3 w-3 sm:h-3 sm:w-3 md:h-4 md:w-4 text-green-600" />
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
                      <SelectContent>
                        <SelectItem value="salary">Salary</SelectItem>
                        <SelectItem value="advance">Advance</SelectItem>
                        <SelectItem value="bonus">Bonus</SelectItem>
                        <SelectItem value="incentive">Incentive</SelectItem>
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

              {/* Payment History Section - Beautiful Design */}
              <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-blue-100 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3 sm:mb-4 md:mb-6">
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <CreditCard className="h-3 w-3 sm:h-3 sm:w-3 md:h-4 md:w-4 text-purple-600" />
                    </div>
                    Payment History ({filteredPaymentHistory.length})
                  </h3>
                  
                  {/* Display Main Page Month/Year Filter */}
                  <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">
                      {filterMonth !== null && filterYear !== null 
                        ? `${months[filterMonth - 1]} ${filterYear}`
                        : 'All Months'
                      }
                    </span>
                  </div>
                </div>
                
                {historyLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2">Loading payment history...</span>
                  </div>
                ) : filteredPaymentHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-center py-8 text-slate-500">
                      <CreditCard className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                      <p>No payment records found{filterMonth !== null && filterYear !== null ? ` for ${months[filterMonth - 1]} ${filterYear}` : ''}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Calculation Display Section - Mobile Optimized */}
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 p-3 sm:p-4 rounded-xl border border-green-100 mb-4">
                      <h4 className="font-bold text-gray-900 mb-4 text-center text-sm sm:text-base">
                        Payment Calculation{filterMonth !== null && filterYear !== null ? ` for ${months[filterMonth - 1]} ${filterYear}` : ''}
                      </h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
                        {/* Monthly Payment Total */}
                        <div className="bg-white p-4 sm:p-3 rounded-lg border border-blue-200 text-center">
                          <p className="text-sm sm:text-sm text-gray-600 mb-2 sm:mb-1 font-medium">Monthly Payment</p>
                          <p className="text-xl sm:text-lg font-bold text-blue-600">
                            ₹{calculateMonthlyTotal().toLocaleString('en-IN')}
                          </p>
                        </div>
                        
                        {/* Advance Amount */}
                        <div className="bg-white p-4 sm:p-3 rounded-lg border border-orange-200 text-center">
                          <p className="text-sm sm:text-sm text-gray-600 mb-2 sm:mb-1 font-medium">Advance Amount</p>
                          <p className="text-xl sm:text-lg font-bold text-orange-600">
                            ₹{getAdvanceAmount().toLocaleString('en-IN')}
                          </p>
                        </div>
                        
                        {/* Total Paid */}
                        <div className="bg-white p-4 sm:p-3 rounded-lg border border-green-200 text-center">
                          <p className="text-sm sm:text-sm text-gray-600 mb-2 sm:mb-1 font-medium">Total Paid</p>
                          <p className="text-xl sm:text-lg font-bold text-green-600">
                            ₹{calculateTotalPaid().toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                      
                      {/* Calculation Formula - Mobile Responsive */}
                      <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300">
                        {/* Mobile Vertical Layout */}
                        <div className="flex flex-col sm:hidden gap-3 items-center text-base">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Monthly Payment:</span>
                            <span className="font-semibold text-blue-600">
                              ₹{calculateMonthlyTotal().toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="text-2xl text-gray-400">+</div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Advance Amount:</span>
                            <span className="font-semibold text-orange-600">
                              ₹{getAdvanceAmount().toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="text-2xl text-gray-400">=</div>
                          <Badge className="bg-green-100 text-green-800 text-lg px-4 py-2 font-bold">
                            ₹{calculateTotalPaid().toLocaleString('en-IN')}
                          </Badge>
                        </div>
                        
                        {/* Desktop Horizontal Layout */}
                        <div className="hidden sm:flex items-center justify-center gap-2 text-sm">
                          <span className="font-semibold text-blue-600">
                            ₹{calculateMonthlyTotal().toLocaleString('en-IN')}
                          </span>
                          <span className="text-gray-500">+</span>
                          <span className="font-semibold text-orange-600">
                            ₹{getAdvanceAmount().toLocaleString('en-IN')}
                          </span>
                          <span className="text-gray-500">=</span>
                          <Badge className="bg-green-100 text-green-800 text-lg px-3 py-1 font-bold">
                            ₹{calculateTotalPaid().toLocaleString('en-IN')}
                          </Badge>
                        </div>
                        
                        <p className="text-center text-xs text-gray-500 mt-3 sm:mt-2">
                          Monthly Payment + Advance = Total Paid
                        </p>
                      </div>
                    </div>
                    
                    {/* Payment History Table */}
                    <div className="overflow-x-auto">
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
                          {filteredPaymentHistory.map((payment, index) => (
                            <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 text-sm text-gray-900 text-center">{index + 1}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-center">
                              {new Date(payment.payment_date).toLocaleDateString('en-IN')}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 font-medium text-center">
                              ₹{parseFloat(payment.payment_amount || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Badge 
                                variant="outline" 
                                className={`
                                  ${payment.type === 'salary' ? 'border-blue-200 text-blue-700 bg-blue-50' : ''}
                                  ${payment.type === 'advance' ? 'border-orange-200 text-orange-700 bg-orange-50' : ''}
                                  ${payment.type === 'bonus' ? 'border-green-200 text-green-700 bg-green-50' : ''}
                                  ${payment.type === 'incentive' ? 'border-purple-200 text-purple-700 bg-purple-50' : ''}
                                `}
                              >
                                {payment.type || 'salary'}
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
                                onClick={() => handleDeletePayment(payment)}
                                className="action-btn-lead action-btn-delete h-8 w-8 sm:h-9 sm:w-9 p-0"
                                title="Delete payment record"
                              >
                                <Trash2 className="h-4 w-4 sm:h-4 sm:w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </div>
                  </>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>,
      document.body
    )}

    {/* Delete Confirmation Dialog - Rendered outside component tree */}
    {createPortal(
      <div style={{ zIndex: 10001 }}>
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent 
            className="crm-modal-container" 
            style={{ 
              zIndex: 10001
            }}
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
          <DialogHeader className="editpopup form dialog-header">
            <div className="editpopup form icon-title-container">
              <div className="editpopup form dialog-icon">
                <Trash2 className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
              </div>
              <div className="editpopup form title-description">
                <DialogTitle className="editpopup form dialog-title text-red-700">
                  Delete Payment Record
                </DialogTitle>
                <DialogDescription className="editpopup form dialog-description">
                  Are you sure you want to delete this payment record? This action cannot be undone.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        
        {paymentToDelete && (
          <div className="mx-4 my-4 p-4 bg-gray-50 rounded-lg border">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="font-medium text-gray-900">Payment Details</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Date: {new Date(paymentToDelete.payment_date).toLocaleDateString('en-IN')}</span>
              </div>
              <div className="flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Amount: ₹{parseFloat(paymentToDelete.payment_amount || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Type: {paymentToDelete.type || 'salary'}</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Mode: {paymentToDelete.payment_mode || 'Bank Transfer'}</span>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="editpopup form dialog-footer flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              setShowDeleteDialog(false);
              setPaymentToDelete(null);
            }}
            disabled={deletingPayment}
            className="editpopup form footer-button-cancel w-full sm:w-auto modern-btn modern-btn-secondary"
          >
            <X className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={confirmDeletePayment}
            disabled={deletingPayment}
            className="editpopup form footer-button-delete w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
          >
            {deletingPayment ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                Delete Payment
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
        </Dialog>
      </div>, 
    document.body
    )}

    </>
  );
};

export default DoctorSalary;
