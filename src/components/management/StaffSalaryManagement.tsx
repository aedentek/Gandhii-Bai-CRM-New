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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import MonthYearPickerDialog from '@/components/shared/MonthYearPickerDialog';
import { CalendarIcon, Search, Users, Download, CheckCircle, XCircle, Clock, RotateCcw, Trash2, UserCheck, UserX, Timer, ClockIcon, RefreshCw, Plus, ChevronLeft, ChevronRight, CreditCard, Edit2, User, Activity, Eye, Save, DollarSign, History, X, AlertCircle, Stethoscope } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import LoadingScreen from '@/components/shared/LoadingScreen';
import { StaffSalaryAPI } from '@/services/staffSalaryAPI';
import usePageTitle from '@/hooks/usePageTitle';
import '@/styles/global-crm-design.css';

interface StaffSalary {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  salary: string;
  monthly_paid: string;
  total_paid: string;
  advance_amount: string;
  carry_forward: string;
  balance: string;
  payment_mode: string;
  status: string;
  photo?: string;
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

const SalaryPayment: React.FC = () => {
  // Set page title
  usePageTitle();

  // Helper function to get staff image URL with proxy
  const getStaffImageUrl = (photo: string | undefined | null): string => {
    if (!photo) return '';
    
    // If it's base64 data, return as is
    if (photo.startsWith('data:image/')) {
      return photo;
    }
    
    // If it's a file path, use proxy for image processing
    if (photo.startsWith('/') || photo.startsWith('http')) {
      return `${import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:4000'}${photo.startsWith('/') ? '' : '/'}${photo}`;
    }
    
    // Default proxy path
    return `${import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:4000'}/${photo}`;
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [staff, setStaff] = useState<StaffSalary[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredStaff, setFilteredStaff] = useState<StaffSalary[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New states for enhanced functionality (mirroring Doctor Salary)
  const [selectedStaff, setSelectedStaff] = useState<StaffSalary | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentFormData, setPaymentFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    type: 'salary'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showMonthYearDialog, setShowMonthYearDialog] = useState(false);
  const [paymentModalSelectedMonth, setPaymentModalSelectedMonth] = useState(new Date().getMonth() + 1);
  const [paymentModalSelectedYear, setPaymentModalSelectedYear] = useState(new Date().getFullYear());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<any>(null);
  const [deletingPayment, setDeletingPayment] = useState(false);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    loadStaff();
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    filterStaff();
  }, [staff, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, staff]);

  const filterStaff = () => {
    let filtered = staff;
    if (searchTerm) {
      filtered = staff.filter(member =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sort staff by ID in ascending order
    filtered.sort((a, b) => {
      const getNum = (id: string) => {
        if (!id) return 0;
        const match = id.match(/STF(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      };
      return getNum(a.id) - getNum(b.id);
    });
    
    setFilteredStaff(filtered);
  };

  const loadStaff = async () => {
    try {
      setLoading(true);
      const response = await StaffSalaryAPI.getAll(selectedMonth, selectedYear);
      setStaff(response.data || []);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error loading staff salaries:', error);
      toast({
        title: "Error",
        description: "Failed to load staff salary data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    await loadStaff();
    toast({
      title: "Data Refreshed",
      description: "Staff salary data updated successfully",
    });
  };

  // Handle record payment modal
  const handleRecordPayment = (staffMember: StaffSalary) => {
    setSelectedStaff(staffMember);
    setPaymentModalSelectedMonth(selectedMonth);
    setPaymentModalSelectedYear(selectedYear);
    setPaymentFormData({
      date: new Date().toISOString().split('T')[0],
      amount: '',
      type: 'salary'
    });
    setShowPaymentModal(true);
    
    // Load payment history for selected staff
    fetchPaymentHistory(staffMember.id);
  };

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
    if (!selectedStaff || !paymentFormData.amount || !paymentFormData.date) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await StaffSalaryAPI.recordPayment({
        staffId: selectedStaff.id,
        amount: parseFloat(paymentFormData.amount),
        date: paymentFormData.date,
        type: paymentFormData.type,
        payment_mode: 'Bank Transfer'
      });

      toast({
        title: "Success",
        description: "Payment recorded successfully",
      });
      setPaymentFormData({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        type: 'salary'
      });
      loadStaff();
      if (selectedStaff) {
        fetchPaymentHistory(selectedStaff.id);
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

  // Check carry forward amounts for current month
  const checkCarryForward = async () => {
    try {
      await StaffSalaryAPI.checkCarryForward(selectedMonth, selectedYear);
      toast({
        title: "Success",
        description: "Carry forward balances updated successfully",
      });
      loadStaff();
    } catch (error) {
      console.error('Error checking carry forward:', error);
      toast({
        title: "Error",
        description: "Failed to update carry forward balances",
        variant: "destructive",
      });
    }
  };

  // Get filtered payment history for selected month/year in modal
  const filteredPaymentHistory = useMemo(() => {
    return paymentHistory.filter(payment => {
      const paymentDate = new Date(payment.payment_date);
      const paymentMonth = paymentDate.getMonth() + 1;
      const paymentYear = paymentDate.getFullYear();
      return paymentMonth === paymentModalSelectedMonth && paymentYear === paymentModalSelectedYear;
    });
  }, [paymentHistory, paymentModalSelectedMonth, paymentModalSelectedYear]);

  // Calculate monthly total from payment history
  const calculateMonthlyTotal = () => {
    const total = filteredPaymentHistory.reduce((sum, payment) => {
      return sum + (parseFloat(payment.payment_amount) || 0);
    }, 0);
    return total;
  };

  // Get advance amount for selected staff and month/year
  const getAdvanceAmount = () => {
    if (!selectedStaff) return 0;
    const advanceAmount = parseNumeric(selectedStaff.advance_amount || 0);
    return advanceAmount;
  };

  // Calculate total paid (Monthly Total + Advance)
  const calculateTotalPaid = () => {
    const monthlyTotal = calculateMonthlyTotal();
    const advanceAmount = getAdvanceAmount();
    const totalPaid = monthlyTotal + advanceAmount;
    return totalPaid;
  };

  const fetchPaymentHistory = async (staffId: string) => {
    setHistoryLoading(true);
    try {
      const response = await StaffSalaryAPI.getPaymentHistory(staffId);
      setPaymentHistory(response.data || []);
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
      await StaffSalaryAPI.deletePayment(paymentToDelete.id);
      
      toast({
        title: "Success",
        description: "Payment deleted successfully",
      });
      
      loadStaff();
      if (selectedStaff) {
        fetchPaymentHistory(selectedStaff.id);
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
      const month = selectedMonth;
      const year = selectedYear;
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/staff-salaries/save-monthly-records`, {
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
        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        toast({
          title: "Success",
          description: `Monthly records saved successfully for ${monthNames[month-1]} ${year}! ${data.recordsProcessed || 0} staff records processed${data.carryForwardUpdates ? `, ${data.carryForwardUpdates} with carry-forward` : ''}`,
        });
        
        // Check if there are carry forward amounts and notify user
        if (data.carryForwardUpdates > 0) {
          setTimeout(() => {
            toast({
              title: "Carry Forward Notice",
              description: `${data.carryForwardUpdates} staff members have balance amounts that will automatically carry forward to the next month`,
            });
          }, 1000);
        }
        
        // Refresh the data to show updated information
        loadStaff();
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
    const exportData = filteredStaff.map((staff, index) => {
      const monthlyPaid = parseNumeric(staff.monthly_paid || 0);
      const advance = parseNumeric(staff.advance_amount);
      const totalPaid = monthlyPaid + advance;
      const salary = parseNumeric(staff.salary);
      const balance = salary - totalPaid;
      
      return {
        'S.No': index + 1,
        'Staff ID': staff.id,
        'Name': staff.name,
        'Role': staff.role,
        'Department': staff.department,
        'Monthly Salary': `₹${salary.toLocaleString()}`,
        'Total Paid': `₹${totalPaid.toLocaleString()}`,
        'Advance Amount': `₹${advance.toLocaleString()}`,
        'Balance': `₹${balance.toLocaleString()}`,
        'Status': staff.status,
        'Join Date': staff.join_date,
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Staff Salary Report");
    
    const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    XLSX.writeFile(wb, `Staff_Salary_Report_${monthName.replace(' ', '_')}.xlsx`);
  };

  // Calculate stats dynamically
  const stats = useMemo(() => {
    const totalSalary = filteredStaff.reduce((sum, s) => sum + parseNumeric(s.salary), 0);
    const totalPaid = filteredStaff.reduce((sum, s) => sum + parseNumeric(s.total_paid), 0);
    const totalPending = filteredStaff.reduce((sum, s) => sum + parseNumeric(s.balance), 0);
    
    return {
      total: filteredStaff.length,
      totalSalary,
      totalPaid,
      totalPending
    };
  }, [filteredStaff]);

  if (loading) {
    return <LoadingScreen message="Loading staff salary data..." />;
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
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Staff Salary Management</h1>
              </div>
            </div>
            
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
                onClick={() => setShowMonthYearDialog(true)}
                text={`${months[selectedMonth - 1]} ${selectedYear}`} // Convert 1-based to 0-based
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
                console.log('🔄 Manual refresh triggered - refreshing entire page');
                window.location.reload();
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
                  <p className="text-xs sm:text-sm font-medium text-blue-700 mb-1 truncate">Total Staff</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-900 mb-1">{stats.total}</p>
                  <div className="flex items-center text-xs text-blue-600">
                    <Activity className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Active</span>
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
                  <p className="text-xs sm:text-sm font-medium text-green-700 mb-1 truncate">Total Salary</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-900 mb-1">₹{stats.totalSalary.toLocaleString()}</p>
                  <div className="flex items-center text-xs text-green-600">
                    <DollarSign className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Monthly</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-green">
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
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
                    <span className="truncate">Completed</span>
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
                    <span className="truncate">Outstanding</span>
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
                placeholder="Search staff by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          </div>
        </div>



        {/* Staff Salary Table */}
        <Card className="crm-table-container">
          <CardHeader className="crm-table-header">
            <div className="crm-table-title">
              <CreditCard className="crm-table-title-icon" />
              <span className="crm-table-title-text">Staff Salary Management ({filteredStaff.length})</span>
              <span className="crm-table-title-text-mobile">Salary ({filteredStaff.length})</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80 hover:bg-gray-50">
                    <TableHead className="text-center font-semibold text-gray-700">S.No</TableHead>
                    <TableHead className="text-center font-semibold text-gray-700">Profile</TableHead>
                    <TableHead className="text-center font-semibold text-gray-700">Joining Date</TableHead>
                    <TableHead className="text-center font-semibold text-gray-700">Staff ID</TableHead>
                    <TableHead className="text-center font-semibold text-gray-700">Staff Name</TableHead>
                    <TableHead className="text-center font-semibold text-gray-700">Salary</TableHead>
                    <TableHead className="text-center font-semibold text-gray-700">Advance</TableHead>
                    <TableHead className="text-center font-semibold text-gray-700">Carry Forward</TableHead>
                    <TableHead className="text-center font-semibold text-gray-700">Total Paid</TableHead>
                    <TableHead className="text-center font-semibold text-gray-700">Balance</TableHead>
                    <TableHead className="text-center font-semibold text-gray-700">Status</TableHead>
                    <TableHead className="text-center font-semibold text-gray-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaff.length > 0 ? (
                    filteredStaff.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((staffMember, index) => {
                      const advance = parseNumeric(staffMember.advance_amount);
                      const carryForward = parseNumeric(staffMember.carry_forward);
                      const monthlyPaid = parseNumeric(staffMember.monthly_paid || 0);
                      const totalPaid = monthlyPaid + advance; // Calculate total paid as monthly + advance
                      const salary = parseNumeric(staffMember.salary);
                      const balance = salary - totalPaid; // Calculate balance based on calculated total paid
                      const globalIndex = (currentPage - 1) * itemsPerPage + index + 1;
                      
                      return (
                        <TableRow 
                          key={staffMember.id} 
                          className="hover:bg-gray-50/80 transition-colors duration-200 group"
                        >
                          {/* S.No */}
                          <TableCell className="py-4 px-6 text-center font-medium text-gray-900">
                            {globalIndex}
                          </TableCell>
                          
                          {/* Profile */}
                          <TableCell className="py-4 px-6 text-center">
                            <div className="flex justify-center">
                              <Avatar className="h-10 w-10">
                                <AvatarImage 
                                  src={getStaffImageUrl(staffMember.photo)}
                                  alt={staffMember.name}
                                />
                                <AvatarFallback className="bg-green-100 text-green-600 text-xs">
                                  {staffMember.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'S'}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                          </TableCell>
                          
                          {/* Joining Date */}
                          <TableCell className="py-4 px-6 text-center">
                            <span className="text-sm text-gray-600">
                              {staffMember.join_date ? format(new Date(staffMember.join_date), 'dd/MM/yyyy') : '-'}
                            </span>
                          </TableCell>
                          
                          {/* Staff ID */}
                          <TableCell className="py-4 px-6 text-center">
                            <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                              {staffMember.id}
                            </Badge>
                          </TableCell>
                          
                          {/* Staff Name */}
                          <TableCell className="py-4 px-6 text-center font-medium text-gray-900">
                            {staffMember.name}
                          </TableCell>
                          
                          {/* Salary */}
                          <TableCell className="py-4 px-6 text-center">
                            <span className="text-sm font-medium text-green-600">
                              ₹{salary.toLocaleString()}
                            </span>
                          </TableCell>
                          
                          {/* Advance */}
                          <TableCell className="py-4 px-6 text-center">
                            <span className="text-sm font-medium text-orange-600">
                              ₹{advance.toLocaleString()}
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
                            <span className={`text-sm font-medium ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              ₹{balance.toLocaleString()}
                            </span>
                          </TableCell>
                          
                          {/* Status */}
                          <TableCell className="py-4 px-6 text-center">
                            <Badge 
                              className={`text-xs ${balance > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}
                            >
                              {balance > 0 ? 'Pending' : 'Paid'}
                            </Badge>
                          </TableCell>
                          
                          {/* Actions */}
                          <TableCell className="py-4 px-6 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleRecordPayment(staffMember)}
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
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No staff found</h3>
                            <p className="text-gray-500">No staff match your search criteria.</p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {Math.ceil(filteredStaff.length / itemsPerPage) > 1 && (
              <div className="crm-pagination-container">
                <div className="text-xs sm:text-sm text-gray-600 order-2 sm:order-1">
                  <span className="hidden sm:inline">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredStaff.length)} of {filteredStaff.length} staff
                  </span>
                  <span className="sm:hidden">
                    {currentPage} / {Math.ceil(filteredStaff.length / itemsPerPage)}
                  </span>
                </div>
                <div className="flex items-center gap-2 order-1 sm:order-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="bg-white hover:bg-gray-50 text-gray-600 border-gray-300 text-xs sm:text-sm px-2 sm:px-3"
                  >
                    <span className="hidden sm:inline">Previous</span>
                    <span className="sm:hidden">Prev</span>
                  </Button>
                  
                  <div className="hidden sm:flex items-center gap-1">
                    {Array.from({ length: Math.min(5, Math.ceil(filteredStaff.length / itemsPerPage)) }, (_, i) => {
                      const pageNumber = i + Math.max(1, currentPage - 2);
                      if (pageNumber > Math.ceil(filteredStaff.length / itemsPerPage)) return null;
                      return (
                        <Button
                          key={pageNumber}
                          variant={currentPage === pageNumber ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNumber)}
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
                    onClick={() => setCurrentPage(Math.min(Math.ceil(filteredStaff.length / itemsPerPage), currentPage + 1))}
                    disabled={currentPage === Math.ceil(filteredStaff.length / itemsPerPage)}
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

        {/* Payment Modal - Mirroring Doctor Salary Design */}
        {showPaymentModal && selectedStaff && createPortal(
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
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mt-2 sm:mt-4">
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full border-2 sm:border-4 border-white shadow-lg overflow-hidden">
                      {selectedStaff.photo ? (
                        <img
                          src={selectedStaff.photo}
                          alt={selectedStaff.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/api/placeholder/40/40';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-green-100 flex items-center justify-center">
                          <Users className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
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
                      <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-green-600 flex-shrink-0" />
                      <span className="truncate">{selectedStaff.name}</span>
                    </h2>
                    <div className="text-xs sm:text-sm md:text-lg lg:text-xl mt-1 flex items-center gap-2">
                      <span className="text-gray-600">
                        Record Payment Session
                      </span>
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
              <div className="overflow-y-auto max-h-[calc(95vh-100px)] sm:max-h-[calc(95vh-120px)] md:max-h-[calc(95vh-140px)] lg:max-h-[calc(95vh-200px)] custom-scrollbar">
                <div className="p-2 sm:p-3 md:p-4 lg:p-6 space-y-3 sm:space-y-4 md:space-y-6 lg:space-y-8">
                  
                  {/* Staff Information Section - Beautiful Card Layout */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-blue-100 shadow-sm">
                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 flex items-center gap-2">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <Users className="h-3 w-3 sm:h-3 sm:w-3 md:h-4 md:w-4 text-green-600" />
                      </div>
                      Staff Information
                    </h3>
                    
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-6">
                      
                      {/* Full Name Card */}
                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 sm:p-4 rounded-xl border border-green-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 sm:w-8 sm:h-8 bg-green-500 rounded-lg flex items-center justify-center shadow-sm">
                            <Users className="h-5 w-5 sm:h-4 sm:w-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm sm:text-xs font-semibold text-green-700 uppercase tracking-wide">Full Name</p>
                          </div>
                        </div>
                        <p className="text-xl sm:text-lg font-bold text-green-900 ml-0">{selectedStaff.name}</p>
                      </div>

                      {/* Staff ID Card */}
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 sm:p-4 rounded-xl border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 sm:w-8 sm:h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-sm">
                            <span className="text-white font-bold text-base sm:text-sm">ID</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm sm:text-xs font-semibold text-blue-700 uppercase tracking-wide">Staff ID</p>
                          </div>
                        </div>
                        <p className="text-xl sm:text-lg font-bold text-blue-900 ml-0">{selectedStaff.id}</p>
                      </div>

                      {/* Role Card */}
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 sm:p-4 rounded-xl border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 sm:w-8 sm:h-8 bg-purple-500 rounded-lg flex items-center justify-center shadow-sm">
                            <User className="h-5 w-5 sm:h-4 sm:w-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm sm:text-xs font-semibold text-purple-700 uppercase tracking-wide">Role</p>
                          </div>
                        </div>
                        <p className="text-xl sm:text-lg font-bold text-purple-900 ml-0">{selectedStaff.role || 'Staff Member'}</p>
                      </div>

                      {/* Department Card */}
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 sm:p-4 rounded-xl border border-orange-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 sm:w-8 sm:h-8 bg-orange-500 rounded-lg flex items-center justify-center shadow-sm">
                            <Activity className="h-5 w-5 sm:h-4 sm:w-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm sm:text-xs font-semibold text-orange-700 uppercase tracking-wide">Department</p>
                          </div>
                        </div>
                        <p className="text-xl sm:text-lg font-bold text-orange-900 ml-0">{selectedStaff.department || 'Administration'}</p>
                      </div>

                      {/* Monthly Salary Card */}
                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 sm:p-4 rounded-xl border border-green-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 sm:w-8 sm:h-8 bg-green-500 rounded-lg flex items-center justify-center shadow-sm">
                            <DollarSign className="h-5 w-5 sm:h-4 sm:w-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm sm:text-xs font-semibold text-green-700 uppercase tracking-wide">Salary</p>
                          </div>
                        </div>
                        <p className="text-xl sm:text-lg font-bold text-green-900 ml-0">₹{parseNumeric(selectedStaff.salary).toLocaleString('en-IN')}</p>
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
                        <p className="text-xl sm:text-lg font-bold text-purple-900 ml-0">₹{parseNumeric(selectedStaff.advance_amount || 0).toLocaleString('en-IN')}</p>
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
                        <p className="text-xl sm:text-lg font-bold text-blue-900 ml-0">₹{calculateTotalPaid().toLocaleString('en-IN')}</p>
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
                        <p className="text-xl sm:text-lg font-bold text-red-900 ml-0">₹{(parseNumeric(selectedStaff.salary) - calculateTotalPaid()).toLocaleString('en-IN')}</p>
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
                          <SelectContent 
                            className="z-[99999]" 
                            style={{ 
                              zIndex: 2147483647,
                              position: 'relative'
                            }}
                          >
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
                          <p>No payment records found{paymentModalSelectedMonth !== null && paymentModalSelectedYear !== null ? ` for ${months[paymentModalSelectedMonth - 1]} ${paymentModalSelectedYear}` : ''}</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Calculation Display Section - Mobile Optimized */}
                        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-3 sm:p-4 rounded-xl border border-green-100 mb-4">
                          <h4 className="font-bold text-gray-900 mb-4 text-center text-sm sm:text-base">
                            Payment Calculation{paymentModalSelectedMonth !== null && paymentModalSelectedYear !== null ? ` for ${months[paymentModalSelectedMonth - 1]} ${paymentModalSelectedYear}` : ''}
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
                        <div className="w-full">
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
                                  ₹{parseFloat(payment.payment_amount || '0').toLocaleString('en-IN')}
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
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">Payment Details</span>
                          <Badge variant="outline" className="text-xs">
                            {paymentToDelete.type || 'salary'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 text-xs font-medium">Date:</span>
                            <span className="text-gray-600">
                              {new Date(paymentToDelete.payment_date).toLocaleDateString('en-IN')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-600 font-medium">
                              ₹{parseFloat(paymentToDelete.payment_amount || '0').toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 col-span-2">
                            <CreditCard className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-600">
                              {paymentToDelete.payment_mode || 'Bank Transfer'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setShowDeleteDialog(false);
                        setPaymentToDelete(null);
                      }}
                      disabled={deletingPayment}
                      className="w-full sm:w-auto"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button 
                      type="button" 
                      onClick={confirmDeletePayment}
                      disabled={deletingPayment}
                      className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
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

        {/* Month/Year Picker Dialog */}
        <MonthYearPickerDialog
          open={showMonthYearDialog}
          onOpenChange={setShowMonthYearDialog}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
          onApply={() => {
            setShowMonthYearDialog(false);
          }}
          title="Select Month & Year"
          description="Select month and year for staff salary data"
          previewText="staff records"
        />
      </div>
    </div>
  );
};

export default SalaryPayment;
