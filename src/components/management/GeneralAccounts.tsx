import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import MonthYearPickerDialog from '@/components/shared/MonthYearPickerDialog';
import LoadingScreen from '@/components/shared/LoadingScreen';
import '../../styles/modern-forms.css';
import '../../styles/modern-tables.css';
import '../../styles/modern-settings.css';
import '@/styles/global-crm-design.css';

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
import { ActionButtons } from '@/components/ui/HeaderActionButtons';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, CreditCard, TrendingUp, TrendingDown, FileText, Pencil, Eye, Trash2, RefreshCw, Activity, Calendar, Download, Package, Plus, IndianRupee, X, Receipt, History, Banknote } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DatabaseService } from '@/services/databaseService';
import usePageTitle from '@/hooks/usePageTitle';

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

const GeneralAccounts: React.FC = () => {
  // Set page title
  usePageTitle();

  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  React.useEffect(() => {
    (async () => {
      if (refreshKey > 0) console.log('Refreshing data...');
      try {
        const data = await DatabaseService.getAllGeneralProducts();
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [settlementToDelete, setSettlementToDelete] = useState<any>(null);
  const [deleteIndex, setDeleteIndex] = useState<number>(-1);
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
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-based
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [showMonthYearDialog, setShowMonthYearDialog] = useState(false);
  const [filterMonth, setFilterMonth] = useState<number | null>(new Date().getMonth() + 1); // 1-based
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
      
      const freshAccounts = await DatabaseService.getAllGeneralProducts();
      
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
      const settlements = await DatabaseService.getSettlementHistory(product.id);
      
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
      
      await DatabaseService.updateGeneralProduct(editTransaction.id, updateData);

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
        
        await DatabaseService.addSettlementRecord(settlementData);
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

  const handleDeleteSettlement = (idx: number) => {
    const settlement = viewSettlements[idx];
    setSettlementToDelete(settlement);
    setDeleteIndex(idx);
    setShowDeleteDialog(true);
  };

  const confirmDeleteSettlement = async () => {
    if (!settlementToDelete || deleteIndex === -1) return;
    
    try {
      setSubmitting(true);
      
      if (settlementToDelete.id) {
        await DatabaseService.deleteSettlementRecord(settlementToDelete.id);
        
        toast({
          title: "Success",
          description: "Settlement record deleted successfully",
        });
        
        setViewSettlements(prev => {
          const updated = [...prev];
          updated.splice(deleteIndex, 1);
          return updated;
        });
        
        handleRefresh();
        setShowDeleteDialog(false);
        setSettlementToDelete(null);
        setDeleteIndex(-1);
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
        const gnId = typeof item.id === 'number' ? `GN${item.id.toString().padStart(4, '0')}` : (item.id?.toString().startsWith('GN') ? item.id : `GN${item.id}`);
        const purchaseAmount = Number(item.purchase_amount || 0);
        const settlementAmount = Number(item.settlement_amount || 0);
        const balanceAmount = Number(item.balance_amount || 0);
        const status = item.payment_status || 'pending';
        
        return [
          index + 1,
          gnId,
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
        let filename = `general-accounts-${dateStr}`;
        
        if (filterMonth !== null && filterYear !== null) {
          filename += `-${months[filterMonth - 1]}-${filterYear}`; // Convert 1-based to 0-based
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
        d.getMonth() === (filterMonth - 1) && // Convert 1-based to 0-based
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
    return <LoadingScreen message="Loading general accounts data..." />;
  }

  return (
    <div className="crm-page-bg">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header Section */}
        <div className="crm-header-container">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
            <div className="flex items-center gap-3">
              <div className="crm-header-icon">
                <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">General Accounts</h1>
                {/* <p className="modern-page-subtitle">
                  Manage and track all financial transactions and account records
                </p> */}
              </div>
            </div>

            <div className="flex flex-row sm:flex-row gap-1 sm:gap-3 w-full sm:w-auto">
              <ActionButtons.Refresh
                onClick={() => {
                  console.log('🔄 Manual refresh triggered - refreshing entire page');
                  window.location.reload();
                }}
                loading={loading}
              />
              
              <ActionButtons.MonthYear
                onClick={() => setShowMonthYearDialog(true)}
                text={filterMonth !== null && filterYear !== null 
                  ? `${months[filterMonth - 1].slice(0, 3)} ${String(filterYear).slice(-2)}` // Convert 1-based to 0-based
                  : `${months[selectedMonth - 1].slice(0, 3)} ${String(selectedYear).slice(-2)}` // Convert 1-based to 0-based
                }
              />
              
              <Button 
                onClick={handleExportCSV}
                className="global-btn flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">CSV</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="crm-stats-grid">
          {/* Total Purchase Amount Card */}
          <Card className="crm-stat-card crm-stat-card-blue">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-blue-700 mb-1 truncate">Total Purchase</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-900 mb-1">
                    ₹{totalPurchaseAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                  <div className="flex items-center text-xs text-blue-600">
                    <TrendingUp className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Purchase Amount</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-blue">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Total Settlement Amount Card */}
          <Card className="crm-stat-card crm-stat-card-green">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-green-700 mb-1 truncate">Total Settlement</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-900 mb-1">
                    ₹{totalSettlementAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                  <div className="flex items-center text-xs text-green-600">
                    <IndianRupee className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Settlement Amount</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-green">
                  <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Total Balance Amount Card */}
          <Card className="crm-stat-card crm-stat-card-red">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-red-700 mb-1 truncate">Balance Due</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-900 mb-1">
                    ₹{totalBalanceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                  <div className="flex items-center text-xs text-red-600">
                    <TrendingDown className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Balance Amount</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-red">
                  <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Total Transactions Card */}
          <Card className="crm-stat-card crm-stat-card-orange">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-orange-700 mb-1 truncate">Total Transactions</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-900 mb-1">
                    {filteredAccounts.length}
                  </p>
                  <div className="flex items-center text-xs text-orange-600">
                    <FileText className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Records</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-orange">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Controls */}
        <div className="crm-controls-container">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search transactions by name, category, or supplier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>
            </div>
            
            <div className="w-full sm:w-auto min-w-[200px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by status" />
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
        <Card className="crm-table-container">
          <CardHeader className="crm-table-header">
            <div className="crm-table-title">
              <CreditCard className="crm-table-title-icon" />
              <span className="crm-table-title-text">Transaction History ({filteredAccounts.length})</span>
              <span className="crm-table-title-text-mobile">Transactions ({filteredAccounts.length})</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
        
        <div className="overflow-x-auto">
          <Table className="w-full min-w-[1600px]">
            <TableHeader>
              <TableRow className="bg-gray-50 border-b">
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center">
                    <span>S No</span>
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                    <Package className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>ID No</span>
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                    <Package className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Product Name</span>
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">Category</TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">Supplier</TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">Quantity</TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">Rate</TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Purchase Amount</span>
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                    <IndianRupee className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Settlement Amount</span>
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                    <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Balance Amount</span>
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                    <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Status</span>
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                    <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Payment Type</span>
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <span>Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedAccounts.map((item, idx) => {
                const status = item.payment_status || 'pending';
                const purchaseAmount = Number(item.purchase_amount || 0);
                const settlementAmount = Number(item.settlement_amount || 0);
                const balanceAmount = Number(item.balance_amount || 0);
                const sno = (page - 1) * pageSize + idx + 1;
                const gnId = typeof item.id === 'number'
                  ? `GN${item.id.toString().padStart(4, '0')}`
                  : (item.id?.toString().startsWith('GN') ? item.id : `GN${item.id}`);
                return (
                  <TableRow key={item.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{sno}</TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{gnId}</TableCell>
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
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center whitespace-nowrap">
                      <div className="action-buttons-container">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleViewClick(item)}
                          className="action-btn-lead action-btn-view h-8 w-8 sm:h-9 sm:w-9 p-0"
                          title="View Settlement History"
                        >
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleEditClick(item)}
                          className="action-btn-lead action-btn-edit h-8 w-8 sm:h-9 sm:w-9 p-0"
                          title="Edit Transaction"
                        >
                          <Pencil className="w-3 h-3 sm:w-4 sm:h-4" />
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
          </CardContent>
        </Card>

        {/* View Settlement History Dialog - Medicine Stock Modal Style */}
        {viewProduct && viewModalOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setViewModalOpen(false)}
          >
            <div 
              className="max-w-[95vw] max-h-[95vh] w-full sm:max-w-6xl overflow-hidden bg-gradient-to-br from-white to-blue-50/30 border-0 shadow-2xl p-0 m-4 rounded-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header - Glass Morphism Style */}
              <div className="relative pb-3 sm:pb-4 md:pb-6 border-b border-blue-100 px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-6">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500"></div>
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mt-2 sm:mt-4">
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full object-cover border-2 sm:border-4 border-white shadow-lg overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                      <Receipt className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1">
                      <div className="border-2 border-white shadow-sm text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                        Active
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-1 sm:gap-2 truncate">
                      <Package className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-blue-600 flex-shrink-0" />
                      <span className="truncate">{viewProduct.name}</span>
                    </h2>
                    <div className="text-xs sm:text-sm md:text-lg lg:text-xl mt-1 flex items-center gap-2">
                      <span className="text-gray-600">Product ID:</span>
                      <span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg border border-green-200">
                        {typeof viewProduct.id === 'number' ? `PR${viewProduct.id.toString().padStart(4, '0')}` : (typeof viewProduct.id === 'string' && /^\d+$/.test(viewProduct.id) ? `PR${viewProduct.id.padStart(4, '0')}` : viewProduct.id)}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewModalOpen(false)}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Modal Body - Glass Morphism Style */}
              <div className="overflow-y-auto max-h-[calc(95vh-100px)] sm:max-h-[calc(95vh-120px)] md:max-h-[calc(95vh-140px)] lg:max-h-[calc(95vh-200px)] custom-scrollbar">
                <div className="p-2 sm:p-3 md:p-4 lg:p-6 space-y-3 sm:space-y-4 md:space-y-6 lg:space-y-8">
                  
                  {/* Product Information Section */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-blue-100 shadow-sm">
                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 flex items-center gap-2">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Package className="h-3 w-3 sm:h-3 sm:w-3 md:h-4 md:w-4 text-blue-600" />
                      </div>
                      Product Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                      
                      <div className="bg-gradient-to-br from-blue-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-blue-100">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Package className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-blue-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">Product Name</div>
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 truncate">{viewProduct.name}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-green-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-green-100">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-green-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-green-600 uppercase tracking-wide">Category</div>
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 truncate">{viewProduct.category}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-purple-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-purple-100">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <FileText className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-purple-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-purple-600 uppercase tracking-wide">Supplier</div>
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">{viewProduct.supplier || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-indigo-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-indigo-100">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-indigo-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-indigo-600 uppercase tracking-wide">Purchase Date</div>
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">{formatDateDDMMYYYY(viewProduct.purchase_date)}</p>
                          </div>
                        </div>
                      </div>
                      
                    </div>
                  </div>

                  {/* Settlement Summary Section */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-blue-100 shadow-sm">
                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 flex items-center gap-2">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <Banknote className="h-3 w-3 sm:h-3 sm:w-3 md:h-4 md:w-4 text-green-600" />
                      </div>
                      Settlement Summary
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                      
                      <div className="bg-gradient-to-br from-blue-50 to-white p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl border border-blue-100 text-center">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                          <History className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-blue-600" />
                        </div>
                        <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-blue-600">{viewSettlements.length}</div>
                        <div className="text-xs sm:text-sm font-medium text-blue-600 uppercase tracking-wide">Total Payments</div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-green-50 to-white p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl border border-green-100 text-center">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                          <IndianRupee className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-green-600" />
                        </div>
                        <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-green-600">
                          ₹{viewSettlements.reduce((sum, s) => sum + Number(s.amount || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-xs sm:text-sm font-medium text-green-600 uppercase tracking-wide">Total Amount</div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-purple-50 to-white p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl border border-purple-100 text-center">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Activity className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-purple-600" />
                        </div>
                        <div className="text-xs px-2 py-1 rounded-full font-medium bg-green-100 text-green-800">
                          Active Account
                        </div>
                        <div className="text-xs sm:text-sm font-medium text-purple-600 uppercase tracking-wide mt-2">Status</div>
                      </div>
                      
                    </div>
                  </div>

                  {/* Settlement History Table */}
                  {viewSettlements.length > 0 && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-blue-100 shadow-sm">
                      <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 flex items-center gap-2">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Receipt className="h-3 w-3 sm:h-3 sm:w-3 md:h-4 md:w-4 text-purple-600" />
                        </div>
                        Payment History ({viewSettlements.length})
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-3 px-4 font-semibold text-gray-700">S.No</th>
                              <th className="text-left py-3 px-4 font-semibold text-gray-700">Payment Date</th>
                              <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount Paid</th>
                              <th className="text-left py-3 px-4 font-semibold text-gray-700">Payment Type</th>
                              <th className="text-center py-3 px-4 font-semibold text-gray-700">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {viewSettlements.map((s, idx) => {
                              const formattedDate = formatDateDDMMYYYY(s.payment_date);
                              return (
                                <tr key={idx} className="border-b border-gray-100 hover:bg-white/50 transition-colors">
                                  <td className="py-3 px-4 text-gray-900 font-medium">{idx + 1}</td>
                                  <td className="py-3 px-4 text-gray-900">{formattedDate}</td>
                                  <td className="py-3 px-4">
                                    <span className="text-green-600 font-semibold">
                                      ₹{Number(s.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <Badge variant="outline" className="text-xs">
                                      {s.payment_type || 'Not specified'}
                                    </Badge>
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <button
                                      type="button"
                                      className="inline-flex items-center justify-center w-8 h-8 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors shadow-sm"
                                      title="Delete Payment"
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
                  )}

                  {/* No Payments State */}
                  {viewSettlements.length === 0 && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-blue-100 shadow-sm text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Banknote className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Payment Records</h3>
                      <p className="text-gray-500">No settlement history available for this product</p>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Transaction Dialog */}
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent className="crm-modal-container">
            <DialogHeader className="editpopup form dialog-header">
              <div className="editpopup form icon-title-container">
                <div className="editpopup form dialog-icon">
                  <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
                <div className="editpopup form title-description">
                  <DialogTitle className="editpopup form dialog-title">
                    Edit Transaction
                  </DialogTitle>
                  <DialogDescription className="editpopup form dialog-description">
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
              className="editpopup form crm-edit-form-content"
            >
              {/* Transaction Info */}
              <div className="editpopup form crm-edit-form-group">
                <Label className="editpopup form crm-edit-form-label flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Product
                </Label>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="text-sm font-medium text-blue-900">{editTransaction?.name || 'Product'}</div>
                </div>
              </div>
              
              <div className="editpopup form crm-edit-form-grid grid-cols-1 md:grid-cols-2">
                <div className="editpopup form crm-edit-form-group">
                  <Label htmlFor="editDate" className="editpopup form crm-edit-form-label flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date
                  </Label>
                  <Input
                    id="editDate"
                    type="date"
                    value={editDate}
                    onChange={e => setEditDate(e.target.value)}
                    className="editpopup form crm-edit-form-input"
                  />
                </div>
                <div className="editpopup form crm-edit-form-group">
                  <Label htmlFor="editPaymentType" className="editpopup form crm-edit-form-label flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Payment Type
                  </Label>
                  <Select value={editPaymentType} onValueChange={setEditPaymentType}>
                    <SelectTrigger className="editpopup form crm-edit-form-select">
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
              
              <div className="editpopup form crm-edit-form-grid grid-cols-2">
                {/* Purchase Amount */}
                <div className="editpopup form crm-edit-form-group">
                  <Label className="editpopup form crm-edit-form-label flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Purchase Amount
                  </Label>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="text-lg font-bold text-blue-600">{editPurchaseAmount}</div>
                  </div>
                </div>
                
                {/* Settlement Amount */}
                <div className="editpopup form crm-edit-form-group">
                  <Label className="editpopup form crm-edit-form-label flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    Settlement Amount
                  </Label>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="text-lg font-bold text-green-600">{editSettlementAmount}</div>
                  </div>
                </div>
              </div>
              
              {/* Amount Payment Input */}
              <div className="editpopup form crm-edit-form-group">
                <Label htmlFor="editAmountPayment" className="editpopup form crm-edit-form-label flex items-center gap-2">
                  <Banknote className="h-4 w-4" />
                  Amount Payment
                </Label>
                <Input
                  id="editAmountPayment"
                  type="number"
                  min={0}
                  max={editTransaction ? Number(editTransaction.price || 0) * Number(editTransaction.quantity || 0) : undefined}
                  value={editAmountPayment}
                  onChange={handleAmountPaymentChange}
                  placeholder="Enter new payment amount"
                  className="editpopup form crm-edit-form-input text-center"
                />
                <div className="text-xs text-gray-500">
                  Enter the amount you want to pay now.
                </div>
              </div>
              
              {/* Balance Amount */}
              <div className="editpopup form crm-edit-form-group">
                <Label className="editpopup form crm-edit-form-label flex items-center gap-2">
                  <IndianRupee className="h-4 w-4" />
                  Balance Amount
                </Label>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="text-lg font-bold text-yellow-700">{editBalanceAmount}</div>
                </div>
              </div>
              
              {/* Status Selection */}
              <div className="editpopup form crm-edit-form-group">
                <Label className="editpopup form crm-edit-form-label flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Transaction Status
                </Label>
                <Select value={editStatus} onValueChange={value => setEditStatus(value as 'pending' | 'completed' | 'cancelled')}>
                  <SelectTrigger className="editpopup form crm-edit-form-select">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        Pending
                      </div>
                    </SelectItem>
                    <SelectItem value="completed">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Completed
                      </div>
                    </SelectItem>
                    <SelectItem value="cancelled">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        Cancelled
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <DialogFooter className="editpopup form dialog-footer flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditModalOpen(false)}
                  disabled={submitting}
                  className="editpopup form footer-button-cancel w-full sm:w-auto modern-btn modern-btn-secondary"
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitting}
                  className="editpopup form footer-button-save w-full sm:w-auto global-btn"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="icon-title-container">
                <Trash2 className="w-6 h-6 text-red-600" />
                <DialogTitle className="text-red-700">Delete Settlement Record</DialogTitle>
              </div>
              <DialogDescription className="text-center text-gray-600">
                This action will permanently remove the settlement record from accounts.
              </DialogDescription>
            </DialogHeader>
            
            <div className="staff-details-section">
              <div className="space-y-3">
                <div className="detail-row">
                  <Receipt className="w-4 h-4 text-blue-600" />
                  <span className="detail-label">Transaction ID:</span>
                  <span className="detail-value">{settlementToDelete?.id}</span>
                </div>
                <div className="detail-row">
                  <Package className="w-4 h-4 text-green-600" />
                  <span className="detail-label">Product:</span>
                  <span className="detail-value">{settlementToDelete?.product_name}</span>
                </div>
                <div className="detail-row">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  <span className="detail-label">Date:</span>
                  <span className="detail-value">{settlementToDelete?.purchase_date}</span>
                </div>
                <div className="detail-row">
                  <IndianRupee className="w-4 h-4 text-orange-600" />
                  <span className="detail-label">Settlement Amount:</span>
                  <span className="detail-value">₹{settlementToDelete?.settlement_amount}</span>
                </div>
                <div className="detail-row">
                  <CreditCard className="w-4 h-4 text-indigo-600" />
                  <span className="detail-label">Payment Type:</span>
                  <span className="detail-value">{settlementToDelete?.payment_type}</span>
                </div>
                <div className="detail-row">
                  <Activity className="w-4 h-4 text-teal-600" />
                  <span className="detail-label">Status:</span>
                  <span className="detail-value">{settlementToDelete?.status}</span>
                </div>
              </div>
            </div>
            
            <DialogFooter className="gap-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowDeleteDialog(false);
                  setSettlementToDelete(null);
                  setDeleteIndex(-1);
                }}
                disabled={submitting}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={confirmDeleteSettlement}
                disabled={submitting}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Record
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default GeneralAccounts;
