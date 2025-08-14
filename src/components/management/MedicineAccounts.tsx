import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import MonthYearPickerDialog from '@/components/shared/MonthYearPickerDialog';
import '../../styles/modern-forms.css';
import '../../styles/modern-tables.css';
import '../../styles/modern-settings.css';

// Simple error boundary for dialog content
function DialogErrorBoundary({ children }: { children: React.ReactNode }) {
  const [error, setError] = useState<Error | null>(null);
  if (error) {
    return <div className="p-4 text-red-600">Error: {error.message}</div>;
  }
  return (
    <React.Suspense fallback={<div className="p-4">Loading...</div>}>
      <ErrorCatcher onError={setError}>{children}</ErrorCatcher>
    </React.Suspense>
  );
}

class ErrorCatcher extends React.Component<{ onError: (e: Error) => void, children: React.ReactNode }> {
  componentDidCatch(error: Error) { this.props.onError(error); }
  render() { return this.props.children; }
}

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, FileText, Pencil, Eye, CreditCard, Search, Trash2, RefreshCw, Activity, Calendar, Download, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DatabaseService } from '@/services/databaseService';

// Helper to format any date string as DD/MM/YYYY
function formatDateDDMMYYYY(dateStr?: string): string {
  if (!dateStr) return '-';
  const dateObj = new Date(dateStr);
  if (!isNaN(dateObj.getTime())) {
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split('-');
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }
  return dateStr;
}

const paymentTypeOptions = [
  { value: 'upi', label: 'UPI' },
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'neft', label: 'NEFT' },
];

const MedicineAccounts: React.FC = () => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  React.useEffect(() => {
    (async () => {
      if (refreshKey > 0) console.log('Refreshing data...');
      try {
        const data = await DatabaseService.getAllMedicineProducts();
        setAccounts(data);
      } catch (e) {
        // Optionally show error
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshKey]);

  // Auto-refresh data periodically
  React.useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = React.useCallback(() => {
    setLoading(true);
    setRefreshKey(prev => prev + 1);
  }, []);

  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewProduct, setViewProduct] = useState<any>(null);
  const [viewSettlements, setViewSettlements] = useState<any[]>([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTransaction, setEditTransaction] = useState<any>(null);
  const [editDate, setEditDate] = useState('');
  const [editPaymentType, setEditPaymentType] = useState('');
  const [editSettlementAmount, setEditSettlementAmount] = useState('');
  const [editPurchaseAmount, setEditPurchaseAmount] = useState('');
  const [editBalanceAmount, setEditBalanceAmount] = useState('');
  const [editAmountPayment, setEditAmountPayment] = useState('');
  const [editStatus, setEditStatus] = useState<'pending' | 'completed' | 'cancelled'>('pending');

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

  const { toast } = useToast();

  // Enhanced global refresh function
  const handleGlobalRefresh = React.useCallback(async () => {
    try {
      setLoading(true);
      
      const currentFilterMonth = filterMonth;
      const currentFilterYear = filterYear;
      const currentSearchTerm = searchTerm;
      const currentStatusFilter = statusFilter;
      
      const freshAccounts = await DatabaseService.getAllMedicineProducts();
      
      setAccounts(freshAccounts);
      
      setFilterMonth(currentFilterMonth);
      setFilterYear(currentFilterYear);
      setSearchTerm(currentSearchTerm);
      setStatusFilter(currentStatusFilter);
      
      toast({
        title: "Success",
        description: "Data refreshed successfully"
      });
      
    } catch (error) {
      console.error('Refresh error:', error);
      toast({
        title: "Error",
        description: "Failed to refresh data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [filterMonth, filterYear, searchTerm, statusFilter, toast]);

  const handleViewClick = async (product: any) => {
    try {
      setViewProduct(product);
      const settlements = await DatabaseService.getMedicineSettlementHistory(product.id);
      
      settlements.sort((a: any, b: any) => {
        if (!a.payment_date) return -1;
        if (!b.payment_date) return 1;
        return new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime();
      });
      
      setViewSettlements(settlements);
      setViewModalOpen(true);
    } catch (error) {
      console.error('Error loading settlement history:', error);
      toast({
        title: "Error",
        description: "Failed to load settlement history",
        variant: "destructive"
      });
    }
  };

  const handleEditClick = (product: any) => {
    setEditTransaction(product);
    setEditDate(product.purchase_date || '');
    setEditPaymentType(product.payment_type || '');
    setEditStatus(product.payment_status || 'pending');
    
    const purchaseAmount = Number(product.purchase_amount || 0);
    const settlementAmount = Number(product.settlement_amount || 0);
    const balanceAmount = Number(product.balance_amount || 0);
    
    setEditSettlementAmount(settlementAmount.toString());
    setEditPurchaseAmount(purchaseAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }));
    setEditBalanceAmount(balanceAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }));
    setEditAmountPayment('');
    setEditModalOpen(true);
  };

  const handleEditSave = async () => {
    if (!editTransaction) {
      setEditModalOpen(false);
      return;
    }

    try {
      setSubmitting(true);

      const updateData = {
        purchase_date: editDate,
        payment_type: editPaymentType,
        payment_status: editStatus
      };
      
      await DatabaseService.updateMedicineProduct(editTransaction.id, updateData);

      const amountPayment = Number(editAmountPayment);
      if (amountPayment > 0) {
        const settlementData = {
          product_id: editTransaction.id,
          product_name: editTransaction.name,
          category: editTransaction.category,
          supplier: editTransaction.supplier,
          amount: amountPayment,
          payment_date: editDate,
          payment_type: editPaymentType,
          description: `Payment for ${editTransaction.name}`
        };
        
        await DatabaseService.addMedicineSettlementRecord(settlementData);
      }

      toast({
        title: "Success",
        description: "Transaction updated successfully",
      });

      setEditModalOpen(false);
      handleRefresh();
    } catch (error) {
      console.error('Error saving transaction:', error);
      toast({
        title: "Error",
        description: "Failed to save transaction",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAmountPaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^\d.]/g, '');
    let num = Number(value);
    if (isNaN(num) || num < 0) num = 0;
    
    if (editTransaction) {
      const purchaseAmountRaw = Number(editTransaction.purchase_amount || 0);
      const currentSettlement = Number(editTransaction.settlement_amount || 0);
      const maxPayment = purchaseAmountRaw - currentSettlement;
      
      if (num > maxPayment) {
        toast({
          title: 'Error',
          description: 'Amount Payment cannot exceed the Balance Amount.',
          variant: 'destructive',
        });
        num = maxPayment;
      }
      
      setEditAmountPayment(num.toString());
      
      const newSettlement = currentSettlement + num;
      const newBalance = purchaseAmountRaw - newSettlement;
      
      setEditSettlementAmount(newSettlement.toString());
      setEditBalanceAmount(newBalance.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }));
    } else {
      setEditAmountPayment(num.toString());
    }
  };

  const handleDeleteSettlement = async (idx: number) => {
    if (!window.confirm('Are you sure you want to delete this settlement record?')) return;
    
    try {
      setSubmitting(true);
      const settlementToDelete = viewSettlements[idx];
      
      if (settlementToDelete && settlementToDelete.id) {
        await DatabaseService.deleteMedicineSettlementRecord(settlementToDelete.id);
        
        toast({
          title: "Success",
          description: "Settlement record deleted successfully",
        });
        
        setViewSettlements(prev => {
          const updated = [...prev];
          updated.splice(idx, 1);
          return updated;
        });
        
        handleRefresh();
      }
    } catch (error) {
      console.error('Error deleting settlement:', error);
      toast({
        title: "Error",
        description: "Failed to delete settlement record",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'pending':
        return 'destructive';
      case 'cancelled':
        return 'secondary';
      default:
        return 'default';
    }
  };

  // Export CSV function
  const handleExportCSV = () => {
    try {
      const headers = ['S No', 'ID No', 'Product Name', 'Category', 'Supplier', 'Quantity', 'Rate', 'Purchase Amount', 'Settlement Amount', 'Balance Amount', 'Status', 'Payment Type'];
      
      const csvData = filteredAccounts.map((item, index) => {
        const meId = typeof item.id === 'number' ? `MD${item.id.toString().padStart(4, '0')}` : (item.id?.toString().startsWith('MD') ? item.id : `MD${item.id}`);
        const purchaseAmount = Number(item.purchase_amount || 0);
        const settlementAmount = Number(item.settlement_amount || 0);
        const balanceAmount = Number(item.balance_amount || 0);
        const status = item.payment_status || 'pending';
        
        return [
          index + 1,
          meId,
          `"${item.name}"`,
          `"${item.category}"`,
          `"${item.supplier || '-'}"`,
          item.quantity,
          `₹${Number(item.price).toFixed(2)}`,
          `₹${purchaseAmount.toFixed(2)}`,
          `₹${settlementAmount.toFixed(2)}`,
          `₹${balanceAmount.toFixed(2)}`,
          status.charAt(0).toUpperCase() + status.slice(1),
          item.payment_type || '-',
        ];
      });
      
      const csvContent = [headers, ...csvData]
        .map(row => row.join(','))
        .join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        let filename = `medicine-accounts-${dateStr}`;
        
        if (filterMonth !== null && filterYear !== null) {
          filename += `-${months[filterMonth]}-${filterYear}`;
        }
        
        if (statusFilter !== 'all') {
          filename += `-${statusFilter}`;
        }
        
        if (searchTerm) {
          filename += `-filtered`;
        }
        
        link.setAttribute('download', `${filename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "Success",
          description: `CSV exported successfully! ${filteredAccounts.length} transactions exported.`
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Error",
        description: "Failed to export CSV file",
        variant: "destructive"
      });
    }
  };

  // Filter accounts
  const filteredAccounts = accounts.filter(item => {
    const status = item.payment_status || 'pending';
    const matchesSearch = (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.supplier || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || status === statusFilter;
    
    if (filterMonth !== null && filterYear !== null) {
      const dateStr = item.purchase_date;
      if (!dateStr) return false;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return false;
      return (
        matchesSearch &&
        matchesStatus &&
        d.getMonth() === filterMonth &&
        d.getFullYear() === filterYear
      );
    }
    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.ceil(filteredAccounts.length / pageSize);
  const paginatedAccounts = filteredAccounts.slice((page - 1) * pageSize, page * pageSize);

  const handlePrevPage = () => setPage((p) => Math.max(1, p - 1));
  const handleNextPage = () => setPage((p) => Math.min(totalPages, p + 1));
  React.useEffect(() => { setPage(1); }, [searchTerm, accounts.length, statusFilter]);

  // Calculate summary totals
  let totalPurchaseAmount = 0;
  let totalSettlementAmount = 0;
  let totalBalanceAmount = 0;
  
  accounts.forEach((item: any) => {
    const purchaseAmount = Number(item.purchase_amount || 0);
    const settlementAmount = Number(item.settlement_amount || 0);
    const balanceAmount = Number(item.balance_amount || 0);
    
    totalPurchaseAmount += purchaseAmount;
    totalSettlementAmount += settlementAmount;
    totalBalanceAmount += balanceAmount;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 px-2 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-2xl p-4 sm:p-6 shadow-lg">
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-3 text-lg">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 px-2 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header Section */}
        <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-2xl p-4 sm:p-6 shadow-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 bg-blue-100 rounded-xl">
                <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Medicine Accounts</h1>
              </div>
            </div>
          
            <div className="flex flex-row sm:flex-row gap-1 sm:gap-3 w-full sm:w-auto">
              <Button 
                onClick={() => {
                  const currentMonth = new Date().getMonth();
                  const currentYear = new Date().getFullYear();
                  
                  setStatusFilter('all');
                  setSearchTerm('');
                  setFilterMonth(currentMonth);
                  setFilterYear(currentYear);
                  setSelectedMonth(currentMonth);
                  setSelectedYear(currentYear);
                  setPage(1);
                  
                  handleGlobalRefresh();
                }}
                disabled={loading}
                className="modern-btn modern-btn-primary flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
              >
                <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
                <span className="sm:hidden">↻</span>
              </Button>
              
              <Button 
                onClick={() => setShowMonthYearDialog(true)}
                variant="outline"
                className="modern-btn modern-btn-secondary flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 min-w-[120px] sm:min-w-[140px]"
              >
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
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
                onClick={handleExportCSV}
                className="modern-btn modern-btn-primary flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">CSV</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-4 lg:gap-6">
          <div className="modern-stat-card stat-card-blue">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-3 w-3 sm:h-5 sm:w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-lg sm:text-2xl font-bold text-gray-900">
                  ₹{totalPurchaseAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-gray-600">Purchase Amount</div>
              </div>
            </div>
          </div>
          
          <div className="modern-stat-card stat-card-red">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="h-3 w-3 sm:h-5 sm:w-5 text-red-600" />
              </div>
              <div>
                <div className="text-lg sm:text-2xl font-bold text-gray-900">
                  ₹{totalSettlementAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-gray-600">Settlement Amount</div>
              </div>
            </div>
          </div>
          
          <div className="modern-stat-card stat-card-orange">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FileText className="h-3 w-3 sm:h-5 sm:w-5 text-orange-600" />
              </div>
              <div>
                <div className="text-lg sm:text-2xl font-bold text-gray-900">
                  ₹{totalBalanceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-gray-600">Balance Amount</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-xl p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search transactions by name, category, or supplier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="w-full sm:w-40">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

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
          description="Filter accounts by specific month and year"
          previewText="transactions"
        />

        {/* Accounts Table */}
        <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-xl shadow-sm overflow-hidden">
          <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gray-50/50">
            <div className="flex items-center text-base sm:text-lg font-semibold text-gray-900">
              <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              <span className="hidden sm:inline">Transaction History ({filteredAccounts.length})</span>
              <span className="sm:hidden">Transactions ({filteredAccounts.length})</span>
            </div>
          </div>
        
        <div className="overflow-x-auto">
          <Table className="w-full min-w-[1600px]">
            <TableHeader>
              <TableRow className="bg-gray-50 border-b">
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">S No</TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">ID No</TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">Product Name</TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">Category</TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">Supplier</TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">Quantity</TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">Rate</TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">Purchase Amount</TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">Settlement Amount</TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">Balance Amount</TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                    <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Status</span>
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">Payment Type</TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedAccounts.map((item, idx) => {
                const status = item.payment_status || 'pending';
                const purchaseAmount = Number(item.purchase_amount || 0);
                const settlementAmount = Number(item.settlement_amount || 0);
                const balanceAmount = Number(item.balance_amount || 0);
                const sno = (page - 1) * pageSize + idx + 1;
                const meId = typeof item.id === 'number'
                  ? `MD${item.id.toString().padStart(4, '0')}`
                  : (item.id?.toString().startsWith('MD') ? item.id : `MD${item.id}`);
                return (
                  <TableRow key={item.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{sno}</TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{meId}</TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 font-medium text-center text-xs sm:text-sm whitespace-nowrap">{item.name}</TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{item.category}</TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{item.supplier}</TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{item.quantity}</TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">₹{Number(item.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 font-medium text-center text-xs sm:text-sm whitespace-nowrap">₹{purchaseAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">₹{settlementAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">₹{balanceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">
                      <Badge variant={getStatusColor(status)}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{item.payment_type || '-'}</TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1 sm:gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleViewClick(item)}
                          className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 hover:border-green-400 rounded-lg"
                          title="View Settlement History"
                        >
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleEditClick(item)}
                          className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 hover:border-blue-400 rounded-lg"
                          title="Edit Transaction"
                        >
                          <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {paginatedAccounts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={13} className="text-center py-8 text-muted-foreground">
                    No transactions found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-gray-50/50 border-t">
            <div className="text-sm text-gray-600">
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, filteredAccounts.length)} of {filteredAccounts.length} transactions
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={page === 1}
                className="h-8 px-3"
              >
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPage(pageNum)}
                      className="h-8 w-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={page === totalPages}
                className="h-8 px-3"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

        {/* View Settlement History Dialog */}
        <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
          <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
            <DialogHeader className="text-center pb-2">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Eye className="h-6 w-6 text-blue-600" />
              </div>
              <DialogTitle className="text-lg font-semibold text-gray-900">
                Settlement History
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600 mt-2">
                Complete payment details and settlement records
              </DialogDescription>
            </DialogHeader>
            
            {viewProduct && (
              <div className="space-y-6 p-4">
                {/* Product Details Section */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Product Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                    <div>
                      <span className="font-semibold">Product Name:</span> {viewProduct.name}
                    </div>
                    <div>
                      <span className="font-semibold">Category:</span> {viewProduct.category}
                    </div>
                    <div>
                      <span className="font-semibold">Supplier:</span> {viewProduct.supplier}
                    </div>
                    <div>
                      <span className="font-semibold">Purchase Date:</span> {formatDateDDMMYYYY(viewProduct.purchase_date)}
                    </div>
                  </div>
                </div>

                {/* Settlement History Table */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Settlement History</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-200 rounded-lg">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-3 py-2 text-center font-semibold">S NO</th>
                          <th className="px-3 py-2 text-center font-semibold">Payment Date</th>
                          <th className="px-3 py-2 text-center font-semibold">Amount Paid</th>
                          <th className="px-3 py-2 text-center font-semibold">Payment Type</th>
                          <th className="px-3 py-2 text-center font-semibold">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewSettlements.length === 0 && (
                          <tr><td colSpan={5} className="text-center p-2">No payments found</td></tr>
                        )}
                        {viewSettlements.map((s, idx) => {
                          const formattedDate = formatDateDDMMYYYY(s.payment_date);
                          return (
                            <tr key={idx}>
                              <td className="px-3 py-2 text-center">{idx + 1}</td>
                              <td className="px-3 py-2 text-center">{formattedDate}</td>
                              <td className="px-3 py-2 text-center">₹{Number(s.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                              <td className="px-3 py-2 text-center">{s.payment_type || '-'}</td>
                              <td className="px-3 py-2 text-center">
                                <button
                                  type="button"
                                  className="inline-flex items-center justify-center w-8 h-8 bg-red-50 hover:bg-red-100 text-red-600 rounded transition-colors"
                                  title="Delete"
                                  onClick={() => handleDeleteSettlement(idx)}
                                  disabled={submitting}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="flex justify-center pt-4">
              <Button 
                variant="outline" 
                onClick={() => setViewModalOpen(false)}
                className="w-full sm:w-auto"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Transaction Dialog */}
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader className="relative pb-3 sm:pb-4 md:pb-6 border-b border-blue-100 px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Pencil className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-gray-900">
                    Edit Transaction
                  </DialogTitle>
                  <DialogDescription className="text-gray-600 mt-1">
                    Update payment details and settlement information
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <form
              onSubmit={e => {
                e.preventDefault();
                handleEditSave();
              }}
              className="space-y-4 p-3 sm:p-4 md:p-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editDate" className="text-sm font-medium text-gray-700">Date</Label>
                  <Input
                    id="editDate"
                    type="date"
                    value={editDate}
                    onChange={e => setEditDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editPaymentType" className="text-sm font-medium text-gray-700">Payment Type</Label>
                  <Select value={editPaymentType} onValueChange={setEditPaymentType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment type" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentTypeOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editStatus" className="text-sm font-medium text-gray-700">Status</Label>
                  <Select value={editStatus} onValueChange={value => setEditStatus(value as 'pending' | 'completed' | 'cancelled')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editPurchaseAmount" className="text-sm font-medium text-gray-700">Purchase Amount</Label>
                  <Input 
                    id="editPurchaseAmount"
                    type="text" 
                    value={editPurchaseAmount} 
                    readOnly 
                    className="bg-gray-50"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editAmountPayment" className="text-sm font-medium text-gray-700">Amount Payment</Label>
                  <Input
                    id="editAmountPayment"
                    type="number"
                    min={0}
                    max={editTransaction ? Number(editTransaction.price || 0) * Number(editTransaction.quantity || 0) : undefined}
                    value={editAmountPayment}
                    onChange={handleAmountPaymentChange}
                    placeholder="Enter new payment amount"
                  />
                  <span className="text-xs text-muted-foreground">Enter the amount you want to pay now.</span>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editSettlementAmount" className="text-sm font-medium text-gray-700">Settlement Amount</Label>
                  <Input
                    id="editSettlementAmount"
                    type="text"
                    value={editSettlementAmount}
                    readOnly
                    className="bg-gray-50"
                  />
                  <span className="text-xs text-muted-foreground">Total paid so far (including this payment).</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="editBalanceAmount" className="text-sm font-medium text-gray-700">Balance Amount</Label>
                <Input 
                  id="editBalanceAmount"
                  type="text" 
                  value={editBalanceAmount} 
                  readOnly 
                  className="bg-gray-50"
                />
              </div>
              
              <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditModalOpen(false)}
                  disabled={submitting}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full sm:w-auto modern-btn modern-btn-primary"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default MedicineAccounts;
