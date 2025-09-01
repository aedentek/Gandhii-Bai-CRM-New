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
import { ActionButtons } from '@/components/ui/HeaderActionButtons';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Package, Search, Edit2, Eye, RefreshCw, Activity, TrendingUp, AlertCircle, Calendar, Download, TrendingDown, IndianRupee, BarChart3, History, X, User, Pill, Building, ShoppingCart, Clock, Tag, Warehouse, Package2, UserCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DatabaseService } from '@/services/databaseService';
import usePageTitle from '@/hooks/usePageTitle';
import '@/styles/global-crm-design.css';

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

interface MedicineStockItem {
  id: string | number;
  name: string;
  category: string;
  supplier: string;
  quantity: number;
  minStock: number;
  expiry_date?: string;
  purchase_date?: string;
  price: string | number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'expired';
  current_stock?: number;
  used_stock?: number;
  balance_stock?: number;
  stock_status?: 'in_stock' | 'low_stock' | 'out_of_stock';
}

const MedicineStock: React.FC = () => {
  // Set custom page title
  usePageTitle('Medicine Stock Management');

  const [medicines, setMedicines] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  React.useEffect(() => {
    (async () => {
      if (refreshKey > 0) console.log('Refreshing data...');
      try {
        console.log('Making API call to get medicine products...');
        const data = await DatabaseService.getAllMedicineProducts();
        console.log('Medicine products received:', data);
        setMedicines(data);
        
        // Load doctors data for Active Doctors stats
        try {
          const doctorsData = await DatabaseService.getAllDoctors();
          setDoctors(doctorsData);
        } catch (doctorError) {
          console.error('Error loading doctors:', doctorError);
        } finally {
          setLoadingDoctors(false);
        }
      } catch (e) {
        console.error('Error loading medicine products:', e);
        toast({
          title: "Error",
          description: "Failed to load medicine products",
          variant: "destructive"
        });
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

  const [editItem, setEditItem] = useState<MedicineStockItem | null>(null);
  const [viewItem, setViewItem] = useState<MedicineStockItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editQuantity, setEditQuantity] = useState(0);
  const [editMinStock, setEditMinStock] = useState(10);
  const [editStatus, setEditStatus] = useState<MedicineStockItem['status']>('in_stock');
  
  // General Stock Management type edit state variables
  const [editUsedStock, setEditUsedStock] = useState(0);
  const [editBalance, setEditBalance] = useState(0);

  // Month and year state for filtering
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-based like Grocery Management
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [showMonthYearDialog, setShowMonthYearDialog] = useState(false);
  const [filterMonth, setFilterMonth] = useState<number | null>(null); // Change to null to show all items by default
  const [filterYear, setFilterYear] = useState<number | null>(null); // Change to null to show all items by default

  const { toast } = useToast();

  // Helper function to get available balance (like General Stock Management)
  const getAvailableBalance = (item: MedicineStockItem): number => {
    const currentStock = item.current_stock || item.quantity || 0;
    const usedStock = item.used_stock || 0;
    return currentStock - usedStock;
  };

  // Update edit balance when used stock changes (like General Stock Management)
  React.useEffect(() => {
    if (editItem) {
      // Show the remaining balance after deducting the new used stock
      const availableBalance = getAvailableBalance(editItem);
      setEditBalance(availableBalance - editUsedStock);
    }
  }, [editUsedStock, editItem]);

  // Map medicines to stock items
  const stockItems: MedicineStockItem[] = medicines.map((med: any) => {
    const minStock = med.minStock || 10;
    let status: MedicineStockItem['status'] = 'in_stock';
    
    // Check expiry date
    if (med.expiry_date && new Date(med.expiry_date) < new Date()) {
      status = 'expired';
    } else if (med.quantity === 0 || med.current_stock === 0) {
      status = 'out_of_stock';
    } else if (med.quantity <= minStock || (med.current_stock && med.current_stock <= minStock)) {
      status = 'low_stock';
    }
    
    return {
      id: med.id,
      name: med.name,
      category: med.category,
      supplier: med.supplier,
      quantity: med.quantity || med.current_stock || 0,
      minStock,
      expiry_date: med.expiry_date,
      purchase_date: med.purchase_date,
      price: med.price,
      status,
      current_stock: med.current_stock,
      used_stock: med.used_stock,
      balance_stock: med.balance_stock,
      stock_status: med.stock_status
    };
  });

  console.log('Raw medicines data:', medicines);
  console.log('Processed stockItems:', stockItems);
  console.log('Filter settings:', { filterMonth, filterYear, searchTerm, statusFilter, categoryFilter });

  // Enhanced global refresh function
  const handleGlobalRefresh = React.useCallback(async () => {
    try {
      setLoading(true);
      
      const currentFilterMonth = filterMonth;
      const currentFilterYear = filterYear;
      const currentSearchTerm = searchTerm;
      const currentStatusFilter = statusFilter;
      const currentCategoryFilter = categoryFilter;
      
      const freshMedicines = await DatabaseService.getAllMedicineProducts();
      
      setMedicines(freshMedicines);
      
      setFilterMonth(currentFilterMonth);
      setFilterYear(currentFilterYear);
      setSearchTerm(currentSearchTerm);
      setStatusFilter(currentStatusFilter);
      setCategoryFilter(currentCategoryFilter);
      
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
  }, [filterMonth, filterYear, searchTerm, statusFilter, categoryFilter, toast]);

  const handleEditStock = (item: MedicineStockItem) => {
    setEditItem(item);
    setEditQuantity(item.quantity);
    setEditMinStock(item.minStock);
    setEditStatus(item.status);
    setEditUsedStock(0); // Always reset to 0 for new entry (like General Stock Management)
    setEditBalance(getAvailableBalance(item));
  };

  const handleViewStock = (item: MedicineStockItem) => {
    setViewItem(item);
  };

  const saveEdit = async () => {
    // General Stock Management edit logic - EXACT IMPLEMENTATION
    if (!editItem) return;
    
    console.log('Edit item:', editItem);
    console.log('Edit used stock:', editUsedStock);
    console.log('Edit status:', editStatus);
    
    // Additional validation before saving (like General Stock Management)
    const availableBalance = getAvailableBalance(editItem);
    console.log('Available balance:', availableBalance);
    
    if (editUsedStock > availableBalance) {
      console.log('Validation failed: Used stock exceeds available balance');
      toast({
        title: "Error",
        description: `Cannot use more than available balance stock (${availableBalance})`,
        variant: "destructive"
      });
      return;
    }
    
    if (editUsedStock < 0) {
      console.log('Validation failed: Used stock is negative');
      toast({
        title: "Error", 
        description: "Used stock cannot be negative",
        variant: "destructive"
      });
      return;
    }
    
    console.log('Starting save operation...');
    setSubmitting(true);
    try {
      // Calculate the new total used stock (current used stock + new usage) - LIKE GENERAL STOCK
      const currentUsedStock = editItem.used_stock || 0;
      const newTotalUsedStock = currentUsedStock + editUsedStock;
      
      console.log('Current used stock:', currentUsedStock);
      console.log('New total used stock:', newTotalUsedStock);
      
      // Record the stock change in history before updating (ONLY if editUsedStock > 0)
      if (editUsedStock > 0) {
        console.log('Adding stock history record...');
        try {
          await DatabaseService.addMedicineStockHistoryRecord({
            product_id: editItem.id,
            stock_change: editUsedStock,
            stock_type: 'used',
            current_stock_before: (editItem.current_stock || editItem.quantity || 0) - currentUsedStock,
            current_stock_after: (editItem.current_stock || editItem.quantity || 0) - newTotalUsedStock,
            update_date: new Date().toISOString().split('T')[0],
            description: `Stock usage: ${editUsedStock} units used`
          });
          console.log('Stock history record added successfully');
        } catch (historyError) {
          console.warn('History record creation failed, but continuing with stock update:', historyError);
          // Continue with stock update even if history fails
        }
      }
      
      // Update product stock fields in backend
      console.log('Updating medicine stock...');
      const updateData = {
        used_stock: newTotalUsedStock,
        stock_status: editStatus,
        last_update: new Date().toISOString().slice(0, 19).replace('T', ' ')
      };
      console.log('Update data:', updateData);
      
      await DatabaseService.updateMedicineProduct(editItem.id, updateData);
      console.log('Medicine stock updated successfully');
      
      toast({
        title: "Success",
        description: "Stock updated successfully",
        variant: "default"
      });
      
      // Close popup
      console.log('Closing edit popup...');
      setEditItem(null);
      
      // Refresh data
      console.log('Refreshing data...');
      handleRefresh();
      console.log('Data refresh completed');
      
    } catch (error) {
      console.error('Error saving stock:', error);
      toast({
        title: "Error",
        description: `Failed to save stock changes: ${error.message || error}`,
        variant: "destructive"
      });
    } finally {
      console.log('Save operation finished, setting submitting to false');
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'default';
      case 'low_stock':
        return 'secondary';
      case 'out_of_stock':
        return 'destructive';
      case 'expired':
        return 'secondary';
      default:
        return 'default';
    }
  };

  // Export CSV function
  const handleExportCSV = () => {
    try {
      const headers = ['S No', 'ID No', 'Product Name', 'Category', 'Current Stock', 'Used Stock', 'Balance Stock', 'Status', 'Last Update'];
      
      const csvData = filteredItems.map((item, index) => {
        const idFormatted = typeof item.id === 'number' ? `MD${item.id.toString().padStart(4, '0')}` : (typeof item.id === 'string' && /^\d+$/.test(item.id) ? `MD${item.id.padStart(4, '0')}` : item.id);
        const lastUpdate = formatDateDDMMYYYY(item.purchase_date);
        
        return [
          index + 1,
          idFormatted,
          `"${item.name}"`,
          `"${item.category}"`,
          item.quantity,
          item.used_stock || 0,
          item.balance_stock || item.quantity,
          item.status.replace(/[-_]/g, ' ').charAt(0).toUpperCase() + item.status.replace(/[-_]/g, ' ').slice(1),
          lastUpdate,
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
        let filename = `medicine-stock-${dateStr}`;
        
        if (filterMonth !== null && filterYear !== null) {
          filename += `-${months[filterMonth - 1]}-${filterYear}`; // Convert 1-based to 0-based for array access
        }
        
        if (statusFilter !== 'all') {
          filename += `-${statusFilter}`;
        }
        
        if (categoryFilter !== 'all') {
          filename += `-${categoryFilter}`;
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
          description: `CSV exported successfully! ${filteredItems.length} items exported.`
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

  // Get unique categories for filter dropdown
  const categories = Array.from(new Set(stockItems.map(item => item.category))).filter(Boolean);

  // Filter items
  const filteredItems = stockItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    
    if (filterMonth !== null && filterYear !== null) {
      const dateStr = item.purchase_date;
      console.log(`Item ${item.name}: purchase_date = ${dateStr}, filterMonth = ${filterMonth}, filterYear = ${filterYear}`);
      if (!dateStr) {
        console.log(`Item ${item.name}: No purchase date, filtered out`);
        return false;
      }
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) {
        console.log(`Item ${item.name}: Invalid purchase date, filtered out`);
        return false;
      }
      const itemMonth = d.getMonth() + 1; // Convert to 1-based
      const itemYear = d.getFullYear();
      console.log(`Item ${item.name}: parsed date month=${itemMonth}, year=${itemYear}`);
      const dateMatches = itemMonth === filterMonth && itemYear === filterYear;
      console.log(`Item ${item.name}: date matches filter = ${dateMatches}`);
      return (
        matchesSearch &&
        matchesStatus &&
        matchesCategory &&
        dateMatches
      );
    }
    return matchesSearch && matchesStatus && matchesCategory;
  }).sort((a, b) => {
    const getNum = (id: string | number) => {
      if (typeof id === 'number') return id;
      if (typeof id === 'string') {
        const match = id.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      }
      return 0;
    };
    return getNum(a.id) - getNum(b.id);
  });

  // Pagination logic
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.ceil(filteredItems.length / pageSize);
  const paginatedItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);

  const handlePrevPage = () => setPage((p) => Math.max(1, p - 1));
  const handleNextPage = () => setPage((p) => Math.min(totalPages, p + 1));
  React.useEffect(() => { setPage(1); }, [searchTerm, medicines.length, statusFilter, categoryFilter]);

  // Calculate stats
  const totalValue = stockItems.reduce((sum, item) => sum + (item.quantity * parseFloat(item.price.toString())), 0);
  const inStockCount = stockItems.filter(item => item.status === 'in_stock').length;
  const lowStockCount = stockItems.filter(item => item.status === 'low_stock').length;
  const outOfStockCount = stockItems.filter(item => item.status === 'out_of_stock').length;
  const expiredCount = stockItems.filter(item => item.status === 'expired').length;

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
    <div className="crm-page-bg">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* CRM Header */}
        <div className="crm-header-container">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
            <div className="flex items-center gap-3">
              <div className="crm-header-icon">
                <Package className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Medicine Stock Management</h1>
              </div>
            </div>
          
            <div className="flex items-center gap-2 sm:gap-3">
              <ActionButtons.Refresh onClick={() => {
                console.log('🔄 Manual refresh triggered - refreshing entire page');
                window.location.reload();
              }} />
              
              <ActionButtons.MonthYear
                text={filterMonth && filterYear ? `${months[(filterMonth || 1) - 1]} ${filterYear}` : "All Months"}
                onClick={() => setShowMonthYearDialog(true)}
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
          {/* In Stock Card */}
          <Card className="crm-stat-card crm-stat-card-green">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-green-700 mb-1 truncate">In Stock</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-900 mb-1">{inStockCount}</p>
                  <div className="flex items-center text-xs text-green-600">
                    <Package className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Available</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-green">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Low Stock Card */}
          <Card className="crm-stat-card crm-stat-card-orange">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-orange-700 mb-1 truncate">Low Stock</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-900 mb-1">{lowStockCount}</p>
                  <div className="flex items-center text-xs text-orange-600">
                    <TrendingDown className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Warning</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-orange">
                  <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Out of Stock Card */}
          <Card className="crm-stat-card crm-stat-card-red">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-red-700 mb-1 truncate">Out of Stock</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-900 mb-1">{outOfStockCount}</p>
                  <div className="flex items-center text-xs text-red-600">
                    <AlertCircle className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Critical</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-red">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Total Products Card */}
          <Card className="crm-stat-card crm-stat-card-blue">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-blue-700 mb-1 truncate">Total Products</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-900 mb-1">{stockItems.length}</p>
                  <div className="flex items-center text-xs text-blue-600">
                    <Activity className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Catalog</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-blue">
                  <Activity className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>


        </div>

        {/* Search and Filter Section */}
        <div className="crm-controls-container">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search medicines by name, category, or supplier..."
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
                  <SelectItem value="in_stock">In Stock</SelectItem>
                  <SelectItem value="low_stock">Low Stock</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-40">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
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
          description="Filter stock items by specific month and year"
          previewText="stock items"
        />

        {/* Stock Table */}
        <Card className="crm-table-card">
          <CardContent className="p-0">
            <div className="crm-table-header">
              <div className="flex items-center text-base sm:text-lg font-semibold text-gray-900">
                <Package className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                <span className="crm-table-title-text">Stock Inventory ({filteredItems.length})</span>
                <span className="crm-table-title-text-mobile">Stock ({filteredItems.length})</span>
              </div>
            </div>
        
            <div className="crm-table-container">
              <Table className="crm-table">
                <TableHeader>
                  <TableRow className="crm-table-header-row">
                    <TableHead className="crm-table-head">S No</TableHead>
                    <TableHead className="crm-table-head">ID No</TableHead>
                    <TableHead className="crm-table-head">Product</TableHead>
                    <TableHead className="crm-table-head">Category</TableHead>
                    <TableHead className="crm-table-head">Stock Value</TableHead>
                    <TableHead className="crm-table-head">Used Stock</TableHead>
                    <TableHead className="crm-table-head">Balance Stock</TableHead>
                    <TableHead className="crm-table-head">
                      <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                        <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>Status</span>
                      </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">Last Update</TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map((item, idx) => (
                <TableRow key={item.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{(page - 1) * pageSize + idx + 1}</TableCell>
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">
                    {typeof item.id === 'number' ? `MD${item.id.toString().padStart(4, '0')}` : (typeof item.id === 'string' && /^\d+$/.test(item.id) ? `MD${item.id.padStart(4, '0')}` : item.id)}
                  </TableCell>
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 font-medium text-center text-xs sm:text-sm whitespace-nowrap">{item.name}</TableCell>
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{item.category}</TableCell>
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{item.quantity}</TableCell>
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{item.used_stock ?? '-'}</TableCell>
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{item.balance_stock ?? '-'}</TableCell>
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">
                    <Badge variant={getStatusColor(item.status)}>
                      {item.status.replace(/[-_]/g, ' ').charAt(0).toUpperCase() + item.status.replace(/[-_]/g, ' ').slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{formatDateDDMMYYYY(item.purchase_date)}</TableCell>
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1 sm:gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleViewStock(item)}
                        className="action-btn-lead action-btn-view h-8 w-8 sm:h-9 sm:w-9 p-0"
                        title="View Stock Details"
                      >
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleEditStock(item)}
                        className="action-btn-lead action-btn-edit h-8 w-8 sm:h-9 sm:w-9 p-0"
                        title="Edit Stock"
                      >
                        <Edit2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    No stock items found
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
          <div className="crm-pagination-container">
            <div className="crm-pagination-info">
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, filteredItems.length)} of {filteredItems.length} medicines
            </div>
            
            <div className="crm-pagination-controls">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={page === 1}
                className="crm-pagination-btn"
              >
                Previous
              </Button>
              
              <div className="crm-pagination-pages">
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
                      className="crm-pagination-page-btn"
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
                className="crm-pagination-btn"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

        {/* Edit Stock Dialog */}
        <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
          <DialogContent className="editpopup form crm-modal-container sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader className="editpopup form crm-modal-header">
              <div className="editpopup form crm-modal-header-content">
                <div className="editpopup form crm-modal-icon">
                  <Edit2 className="h-5 w-5 text-blue-600" />
                </div>
                <div className="editpopup form crm-modal-title-section">
                  <DialogTitle className="editpopup form crm-modal-title">
                    Edit Medicine Stock
                  </DialogTitle>
                  <DialogDescription className="editpopup form crm-modal-description">
                    Update stock quantities and settings
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            {editItem && (
              <div className="editpopup form crm-edit-form-content">
                {/* Product Info */}
                <div className="editpopup form crm-edit-form-group">
                  <Label className="editpopup form crm-edit-form-label flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Product
                  </Label>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="text-sm font-medium text-blue-900">{editItem.name}</div>
                  </div>
                </div>
                
                <div className="editpopup form crm-edit-form-grid grid-cols-2">
                  {/* Current Stock */}
                  <div className="editpopup form crm-edit-form-group">
                    <Label className="editpopup form crm-edit-form-label flex items-center gap-2">
                      <Warehouse className="h-4 w-4" />
                      Current Stock
                    </Label>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <div className="text-lg font-bold text-blue-600">{editItem.current_stock || editItem.quantity || 0}</div>
                    </div>
                  </div>
                  
                  {/* Available Balance */}
                  <div className="editpopup form crm-edit-form-group">
                    <Label className="editpopup form crm-edit-form-label flex items-center gap-2">
                      <Package2 className="h-4 w-4" />
                      Available Balance
                    </Label>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="text-lg font-bold text-green-600">{getAvailableBalance(editItem)}</div>
                    </div>
                  </div>
                </div>
                
                {/* Additional Used Stock Input */}
                <div className="editpopup form crm-edit-form-group">
                  <Label className="editpopup form crm-edit-form-label flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Additional Used Stock
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={getAvailableBalance(editItem)}
                    value={editUsedStock}
                    onChange={e => {
                      let val = Number(e.target.value);
                      const availableBalance = getAvailableBalance(editItem);
                      
                      // Validation: Don't allow negative values
                      if (val < 0) val = 0;
                      
                      // Validation: Don't allow more than available balance stock
                      if (val > availableBalance) {
                        val = availableBalance;
                        console.warn(`Cannot use more than available balance stock (${availableBalance})`);
                      }
                      
                      setEditUsedStock(val);
                    }}
                    className="editpopup form crm-edit-form-input text-center"
                  />
                  <div className="text-xs text-gray-500">
                    Maximum available: {getAvailableBalance(editItem)} units
                  </div>
                  <div className="text-xs text-blue-600">
                    Enter additional stock to mark as used (will be added to current used stock: {editItem.used_stock || 0})
                  </div>
                  {editUsedStock > getAvailableBalance(editItem) && (
                    <div className="text-xs text-red-500">
                      Cannot exceed available balance stock
                    </div>
                  )}
                </div>
                
                {/* Balance After Edit */}
                <div className="editpopup form crm-edit-form-group">
                  <Label className="editpopup form crm-edit-form-label flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Balance After Edit
                  </Label>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="text-lg font-bold text-yellow-700">{editBalance} units</div>
                  </div>
                </div>
                
                {/* Status Selection */}
                <div className="editpopup form crm-edit-form-group">
                  <Label className="editpopup form crm-edit-form-label flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Stock Status
                  </Label>
                  <Select value={editStatus} onValueChange={v => setEditStatus(v as any)}>
                    <SelectTrigger className="editpopup form crm-edit-form-select">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in_stock">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          In Stock
                        </div>
                      </SelectItem>
                      <SelectItem value="low_stock">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          Low Stock
                        </div>
                      </SelectItem>
                      <SelectItem value="out_of_stock">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          Out of Stock
                        </div>
                      </SelectItem>
                      <SelectItem value="expired">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                          Expired
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <DialogFooter className="editpopup form dialog-footer flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setEditItem(null)}
                    disabled={submitting}
                    className="editpopup form footer-button-cancel w-full sm:w-auto modern-btn modern-btn-secondary"
                  >
                    <X className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button 
                    onClick={saveEdit}
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
                        <Package className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* View Stock Modal - Glass Morphism Design */}
        {viewItem && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setViewItem(null)}
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
                      <Pill className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1">
                      <div className={`border-2 border-white shadow-sm text-xs px-2 py-1 rounded-full ${
                        viewItem.status === 'in_stock' ? 'bg-green-100 text-green-800' :
                        viewItem.status === 'low_stock' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {viewItem.status.replace(/[-_]/g, ' ').charAt(0).toUpperCase() + viewItem.status.replace(/[-_]/g, ' ').slice(1)}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-1 sm:gap-2 truncate">
                      <Package className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-blue-600 flex-shrink-0" />
                      <span className="truncate">{viewItem.name}</span>
                    </h2>
                    <div className="text-xs sm:text-sm md:text-lg lg:text-xl mt-1 flex items-center gap-2">
                      <span className="text-gray-600">Medicine ID:</span>
                      <span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg border border-green-200">
                        {typeof viewItem.id === 'number' ? `MD${viewItem.id.toString().padStart(4, '0')}` : (typeof viewItem.id === 'string' && /^\d+$/.test(viewItem.id) ? `MD${viewItem.id.padStart(4, '0')}` : viewItem.id)}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewItem(null)}
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
                        <Pill className="h-3 w-3 sm:h-3 sm:w-3 md:h-4 md:w-4 text-blue-600" />
                      </div>
                      Product Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                      
                      <div className="bg-gradient-to-br from-blue-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-blue-100">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Pill className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-blue-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">Medicine Name</div>
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 truncate">{viewItem.name}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-green-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-green-100">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Tag className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-green-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-green-600 uppercase tracking-wide">Category</div>
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 truncate">{viewItem.category}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-purple-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-purple-100">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Building className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-purple-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-purple-600 uppercase tracking-wide">Supplier</div>
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">{viewItem.supplier || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-orange-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-orange-100">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <IndianRupee className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-orange-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-orange-600 uppercase tracking-wide">Price</div>
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">₹{viewItem.price || 0}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-indigo-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-indigo-100">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-indigo-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-indigo-600 uppercase tracking-wide">Purchase Date</div>
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">{formatDateDDMMYYYY(viewItem.purchase_date)}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-red-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-red-100">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Clock className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-red-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-red-600 uppercase tracking-wide">Expiry Date</div>
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">{formatDateDDMMYYYY(viewItem.expiry_date)}</p>
                          </div>
                        </div>
                      </div>
                      
                    </div>
                  </div>

                  {/* Stock Summary Section */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-blue-100 shadow-sm">
                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 flex items-center gap-2">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <BarChart3 className="h-3 w-3 sm:h-3 sm:w-3 md:h-4 md:w-4 text-green-600" />
                      </div>
                      Stock Summary
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                      
                      <div className="bg-gradient-to-br from-blue-50 to-white p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl border border-blue-100 text-center">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Warehouse className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-blue-600" />
                        </div>
                        <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-blue-600">{viewItem.quantity || 0}</div>
                        <div className="text-xs sm:text-sm font-medium text-blue-600 uppercase tracking-wide">Total Stock</div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-red-50 to-white p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl border border-red-100 text-center">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                          <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-red-600" />
                        </div>
                        <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-red-600">{viewItem.used_stock || 0}</div>
                        <div className="text-xs sm:text-sm font-medium text-red-600 uppercase tracking-wide">Used Stock</div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-green-50 to-white p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl border border-green-100 text-center">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Package2 className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-green-600" />
                        </div>
                        <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-green-600">{viewItem.balance_stock ?? ((viewItem.quantity || 0) - (viewItem.used_stock || 0))}</div>
                        <div className="text-xs sm:text-sm font-medium text-green-600 uppercase tracking-wide">Available</div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-purple-50 to-white p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl border border-purple-100 text-center">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Activity className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-purple-600" />
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full font-medium ${
                          viewItem.status === 'in_stock' ? 'bg-green-100 text-green-800' :
                          viewItem.status === 'low_stock' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {viewItem.status.replace(/[-_]/g, ' ').charAt(0).toUpperCase() + viewItem.status.replace(/[-_]/g, ' ').slice(1)}
                        </div>
                        <div className="text-xs sm:text-sm font-medium text-purple-600 uppercase tracking-wide mt-1">Status</div>
                      </div>
                      
                    </div>
                  </div>

                  {/* Stock Movement History Section */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-blue-100 shadow-sm">
                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 flex items-center gap-2">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <History className="h-3 w-3 sm:h-3 sm:w-3 md:h-4 md:w-4 text-purple-600" />
                      </div>
                      Stock Movement History
                    </h3>
                    
                    <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100">
                            <TableHead className="text-center font-semibold text-gray-700">S NO</TableHead>
                            <TableHead className="text-center font-semibold text-gray-700">Date</TableHead>
                            <TableHead className="text-center font-semibold text-gray-700">Stock Change</TableHead>
                            <TableHead className="text-center font-semibold text-gray-700">Type</TableHead>
                            <TableHead className="text-center font-semibold text-gray-700">Stock After</TableHead>
                            <TableHead className="text-center font-semibold text-gray-700">Description</TableHead>
                            <TableHead className="text-center font-semibold text-gray-700">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                              <div className="flex flex-col items-center gap-3">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                  <History className="h-8 w-8 text-gray-400" />
                                </div>
                                <div className="text-center">
                                  <p className="text-lg font-medium text-gray-500">No stock history recorded yet</p>
                                  <p className="text-sm text-gray-400 mt-1">Stock movement tracking will appear here</p>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        )}
      </div>
  );
};

export default MedicineStock;
