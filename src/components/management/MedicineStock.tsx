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
import { Package, Search, Edit2, Eye, RefreshCw, Activity, TrendingUp, AlertCircle, Calendar, Download, TrendingDown, DollarSign, BarChart3, History } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DatabaseService } from '@/services/databaseService';
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
  const [medicines, setMedicines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  React.useEffect(() => {
    (async () => {
      if (refreshKey > 0) console.log('Refreshing data...');
      try {
        const data = await DatabaseService.getAllMedicineProducts();
        setMedicines(data);
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

  const [editItem, setEditItem] = useState<MedicineStockItem | null>(null);
  const [viewItem, setViewItem] = useState<MedicineStockItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editQuantity, setEditQuantity] = useState(0);
  const [editMinStock, setEditMinStock] = useState(10);
  const [editStatus, setEditStatus] = useState<MedicineStockItem['status']>('in_stock');

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
  };

  const handleViewStock = (item: MedicineStockItem) => {
    setViewItem(item);
  };

  const saveEdit = async () => {
    if (!editItem) return;
    
    try {
      setSubmitting(true);
      
      const updateData = {
        quantity: editQuantity,
        current_stock: editQuantity,
        balance_stock: editQuantity,
        stock_status: editQuantity === 0 ? 'out_of_stock' : editQuantity <= editMinStock ? 'low_stock' : 'in_stock'
      };
      
      await DatabaseService.updateMedicineProduct(editItem.id, updateData);
      
      toast({
        title: "Success",
        description: "Stock updated successfully"
      });
      
      setEditItem(null);
      handleRefresh();
    } catch (error) {
      console.error('Error updating stock:', error);
      toast({
        title: "Error",
        description: "Failed to update stock",
        variant: "destructive"
      });
    } finally {
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
          filename += `-${months[filterMonth]}-${filterYear}`;
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
      if (!dateStr) return false;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return false;
      return (
        matchesSearch &&
        matchesStatus &&
        matchesCategory &&
        d.getMonth() === filterMonth &&
        d.getFullYear() === filterYear
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
                <p className="text-sm sm:text-base text-gray-600">Monitor inventory levels and stock availability</p>
              </div>
            </div>
          
            <div className="flex flex-row sm:flex-row gap-1 sm:gap-3 w-full sm:w-auto">
              <Button 
                onClick={() => {
                  const currentMonth = new Date().getMonth();
                  const currentYear = new Date().getFullYear();
                  
                  setStatusFilter('all');
                  setCategoryFilter('all');
                  setSearchTerm('');
                  setFilterMonth(currentMonth);
                  setFilterYear(currentYear);
                  setSelectedMonth(currentMonth);
                  setSelectedYear(currentYear);
                  setPage(1);
                  
                  handleGlobalRefresh();
                }}
                disabled={loading}
                className="global-btn flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
              >
                <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
                <span className="sm:hidden">↻</span>
              </Button>
              
              <Button 
                onClick={() => setShowMonthYearDialog(true)}
                variant="outline"
                className="action-btn-lead flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 min-w-[120px] sm:min-w-[140px]"
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
        <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-xl shadow-sm overflow-hidden">
          <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gray-50/50">
            <div className="flex items-center text-base sm:text-lg font-semibold text-gray-900">
              <Package className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              <span className="hidden sm:inline">Stock Inventory ({filteredItems.length})</span>
              <span className="sm:hidden">Stock ({filteredItems.length})</span>
            </div>
          </div>
        
        <div className="overflow-x-auto">
          <Table className="w-full min-w-[1200px]">
            <TableHeader>
              <TableRow className="bg-gray-50 border-b">
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">S No</TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">ID No</TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">Product</TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">Category</TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">Stock Value</TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">Used Stock</TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">Balance Stock</TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
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
                        className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 hover:border-green-400 rounded-lg"
                        title="View Stock Details"
                      >
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleEditStock(item)}
                        className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 hover:border-blue-400 rounded-lg"
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
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-gray-50/50 border-t">
            <div className="text-sm text-gray-600">
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, filteredItems.length)} of {filteredItems.length} medicines
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

        {/* Edit Stock Dialog */}
        <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader className="relative pb-3 sm:pb-4 md:pb-6 border-b border-blue-100 px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Edit2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-gray-900">
                    Edit Medicine Stock
                  </DialogTitle>
                  <DialogDescription className="text-gray-600 mt-1">
                    Update stock quantities and settings
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            {editItem && (
              <form
                onSubmit={e => {
                  e.preventDefault();
                  saveEdit();
                }}
                className="space-y-4 p-3 sm:p-4 md:p-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Product Name</Label>
                    <div className="p-3 bg-gray-50 rounded border text-sm">{editItem.name}</div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Category</Label>
                    <div className="p-3 bg-gray-50 rounded border text-sm">{editItem.category}</div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editQuantity" className="text-sm font-medium text-gray-700">Current Stock *</Label>
                    <Input
                      id="editQuantity"
                      type="number"
                      min={0}
                      value={editQuantity}
                      onChange={(e) => {
                        let val = Number(e.target.value);
                        if (val < 0) val = 0;
                        setEditQuantity(val);
                      }}
                      className="text-center"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editMinStock" className="text-sm font-medium text-gray-700">Min Stock Level</Label>
                    <Input
                      id="editMinStock"
                      type="number"
                      min={0}
                      value={editMinStock}
                      onChange={(e) => {
                        let val = Number(e.target.value);
                        if (val < 0) val = 0;
                        setEditMinStock(val);
                      }}
                      className="text-center"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="editStatus" className="text-sm font-medium text-gray-700">Status</Label>
                    <Select value={editStatus} onValueChange={(value) => setEditStatus(value as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in_stock">In Stock</SelectItem>
                        <SelectItem value="low_stock">Low Stock</SelectItem>
                        <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setEditItem(null)}
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
            )}
          </DialogContent>
        </Dialog>

        {/* View Stock Dialog - Enhanced to match GeneralStock design with Mobile Responsive */}
        <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
          <DialogContent className="max-w-[95vw] sm:max-w-4xl lg:max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="px-2 sm:px-6">
              <DialogTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Package className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                <span className="truncate">Stock Information History</span>
              </DialogTitle>
            </DialogHeader>
            
            {viewItem && (
              <div className="space-y-4 sm:space-y-6 px-2 sm:px-6 pb-6">
                {/* Product Details Card */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-3 sm:px-6 py-3 sm:py-4 border-b">
                    <h3 className="font-bold text-base sm:text-lg text-gray-900 flex items-center gap-2">
                      <Package className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      Product Details
                    </h3>
                  </div>
                  
                  <div className="p-3 sm:p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      <div className="space-y-2">
                        <label className="text-xs sm:text-sm font-medium text-gray-600">Medicine ID</label>
                        <p className="font-semibold text-sm sm:text-base text-gray-900 bg-gray-50 px-3 py-2 rounded-lg break-all">
                          {typeof viewItem.id === 'number' ? `MD${viewItem.id.toString().padStart(4, '0')}` : (typeof viewItem.id === 'string' && /^\d+$/.test(viewItem.id) ? `MD${viewItem.id.padStart(4, '0')}` : viewItem.id)}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs sm:text-sm font-medium text-gray-600">Product Name</label>
                        <p className="font-semibold text-sm sm:text-base text-gray-900 bg-gray-50 px-3 py-2 rounded-lg break-words">
                          {viewItem.name}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs sm:text-sm font-medium text-gray-600">Category</label>
                        <p className="font-semibold text-sm sm:text-base text-gray-900 bg-gray-50 px-3 py-2 rounded-lg break-words">
                          {viewItem.category}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-600">Supplier</label>
                        <p className="font-semibold text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                          {viewItem.supplier ?? '-'}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-600">Unit</label>
                        <p className="font-semibold text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                          Units
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-600">Price</label>
                        <p className="font-semibold text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                          ₹{viewItem.price ?? 0}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-600">Purchase Date</label>
                        <p className="font-semibold text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                          {formatDateDDMMYYYY(viewItem.purchase_date)}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-600">Expiry Date</label>
                        <p className="font-semibold text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                          {formatDateDDMMYYYY(viewItem.expiry_date)}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-600">Batch Number</label>
                        <p className="font-semibold text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                          -
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Stock Summary Card */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b">
                    <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-green-600" />
                      Stock Summary
                    </h3>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">{viewItem.quantity || 0}</div>
                        <div className="text-sm text-gray-600">Total Stock</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-red-600">{viewItem.used_stock || 0}</div>
                        <div className="text-sm text-gray-600">Used Stock</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">{viewItem.balance_stock ?? ((viewItem.quantity || 0) - (viewItem.used_stock || 0))}</div>
                        <div className="text-sm text-gray-600">Available</div>
                      </div>
                      <div className="text-center space-y-2">
                        <Badge 
                          variant={getStatusColor(viewItem.status)}
                          className={`text-sm font-medium ${
                            viewItem.status === 'in_stock' ? 'bg-green-100 text-green-800' :
                            viewItem.status === 'low_stock' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}
                        >
                          {viewItem.status.replace(/[-_]/g, ' ').charAt(0).toUpperCase() + viewItem.status.replace(/[-_]/g, ' ').slice(1)}
                        </Badge>
                        <div className="text-sm text-gray-600">Status</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Stock Movement History */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b">
                    <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                      <History className="h-5 w-5 text-gray-600" />
                      Stock Movement History
                    </h3>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50/50">
                          <TableHead className="text-center font-medium">S NO</TableHead>
                          <TableHead className="text-center font-medium">Date</TableHead>
                          <TableHead className="text-center font-medium">Stock Change</TableHead>
                          <TableHead className="text-center font-medium">Type</TableHead>
                          <TableHead className="text-center font-medium">Stock After</TableHead>
                          <TableHead className="text-center font-medium">Description</TableHead>
                          <TableHead className="text-center font-medium">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            <div className="flex flex-col items-center gap-2">
                              <Package className="h-12 w-12 text-gray-300" />
                              <span>No stock history recorded yet</span>
                              <span className="text-xs text-gray-500">Stock movement tracking will appear here</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="flex justify-center pt-4">
              <Button 
                variant="outline" 
                onClick={() => setViewItem(null)}
                className="w-full sm:w-auto"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default MedicineStock;
