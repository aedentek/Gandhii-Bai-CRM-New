import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import MonthYearPickerDialog from '@/components/shared/MonthYearPickerDialog';
import '@/styles/global-crm-design.css';
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
import { Plus, Search, Edit2, Trash2, Package, RefreshCw, AlertTriangle, TrendingUp, TrendingDown, Calendar, Download, Eye, BarChart3, History } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Helper function to format grocery ID
const formatGroceryId = (num: number): string => {
  return `GR${num.toString().padStart(4, '0')}`;
};

interface GroceryStockItem {
  id: string;
  grId: string;
  productName: string;
  category: string;
  currentStock: number;
  usedStock: number;
  unit: string;
  lastUpdate: string;
  purchaseDate: string;
  supplier: string;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
  price: number;
}

const GroceryStock: React.FC = () => {
const [products, setProducts] = useState<GroceryStockItem[]>([]);
const [groceryCategories, setGroceryCategories] = useState<any[]>([]);
const [loading, setLoading] = useState(true);
const [refreshKey, setRefreshKey] = useState(0);

// Stock status calculation
const getStockStatus = (item: { currentStock: number; usedStock: number }): 'in-stock' | 'low-stock' | 'out-of-stock' => {
  const balance = item.currentStock - item.usedStock;
  if (balance === 0) return 'out-of-stock';
  if (balance <= 5) return 'low-stock';
  return 'in-stock';
};

React.useEffect(() => {
  (async () => {
    if (refreshKey > 0) console.log('Refreshing data...');
    try {
      const db = (await import('@/services/databaseService')).DatabaseService;
      const data = await db.getAllGroceryProducts();
      setProducts(data.map((prod: any) => ({
        ...prod,
        id: prod.id.toString(),
        productName: prod.name,
        currentStock: prod.current_stock || prod.quantity || 0,
        usedStock: prod.used_stock || 0,
        lastUpdate: prod.created_at || prod.last_update || '',
        purchaseDate: prod.purchase_date || prod.created_at || '',
        grId: `GR${prod.id.toString().padStart(4, '0')}`,
        category: prod.category || 'N/A',
        supplier: prod.supplier || 'N/A',
        price: prod.price || 0,
        unit: prod.unit || 'pcs',
        status: getStockStatus({
          currentStock: prod.current_stock || prod.quantity || 0,
          usedStock: prod.used_stock || 0
        })
      })));
      
      const categories = await db.getAllGroceryCategories();
      setGroceryCategories(categories.filter((cat: any) => cat.status === 'active'));
    } catch (e) {
      console.error('Error loading grocery stock:', e);
      setProducts([]);
      setGroceryCategories([]);
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

  const [isAddingStock, setIsAddingStock] = useState(false);
  const [editingStock, setEditingStock] = useState<GroceryStockItem | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [stockToDelete, setStockToDelete] = useState<GroceryStockItem | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [viewingStock, setViewingStock] = useState<GroceryStockItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [formData, setFormData] = useState({
    productName: '',
    category: '',
    currentStock: 0,
    usedStock: 0,
    unit: 'pcs',
    supplier: '',
    price: 0,
  });

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
      const currentCategoryFilter = categoryFilter;
      const currentStatusFilter = statusFilter;
      
      const db = (await import('@/services/databaseService')).DatabaseService;
      const freshData = await db.getAllGroceryProducts();
      
      setProducts(freshData.map((prod: any) => ({
        ...prod,
        id: prod.id.toString(),
        productName: prod.name,
        currentStock: prod.current_stock || prod.quantity || 0,
        usedStock: prod.used_stock || 0,
        lastUpdate: prod.created_at || prod.last_update || '',
        purchaseDate: prod.purchase_date || prod.created_at || '',
        grId: `GR${prod.id.toString().padStart(4, '0')}`,
        category: prod.category || 'N/A',
        supplier: prod.supplier || 'N/A',
        price: prod.price || 0,
        unit: prod.unit || 'pcs',
        status: getStockStatus({
          currentStock: prod.current_stock || prod.quantity || 0,
          usedStock: prod.used_stock || 0
        })
      })));
      
      const categories = await db.getAllGroceryCategories();
      setGroceryCategories(categories.filter((cat: any) => cat.status === 'active'));
      
      setFilterMonth(currentFilterMonth);
      setFilterYear(currentFilterYear);
      setSearchTerm(currentSearchTerm);
      setCategoryFilter(currentCategoryFilter);
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
  }, [filterMonth, filterYear, searchTerm, categoryFilter, statusFilter, toast]);

  const handleEditStock = (stock: GroceryStockItem) => {
    setEditingStock(stock);
    setFormData({
      productName: stock.productName,
      category: stock.category,
      currentStock: stock.currentStock,
      usedStock: stock.usedStock,
      unit: stock.unit,
      supplier: stock.supplier,
      price: stock.price,
    });
    setIsAddingStock(true);
  };

  const handleViewStock = (stock: GroceryStockItem) => {
    setViewingStock(stock);
    setShowViewDialog(true);
  };

  const handleDeleteStock = (stock: GroceryStockItem) => {
    setStockToDelete(stock);
    setShowDeleteDialog(true);
  };

  const handleSubmit = async () => {
    if (!formData.productName) {
      toast({
        title: "Error",
        description: "Please enter a product name",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const db = (await import('@/services/databaseService')).DatabaseService;
      
      if (editingStock) {
        await db.updateGroceryProduct(editingStock.id, {
          name: formData.productName,
          category: formData.category,
          current_stock: formData.currentStock,
          used_stock: formData.usedStock,
          unit: formData.unit,
          supplier: formData.supplier,
          price: formData.price,
        });
        toast({ title: "Success", description: "Stock updated successfully" });
      } else {
        await db.addGroceryProduct({
          name: formData.productName,
          category: formData.category,
          current_stock: formData.currentStock,
          used_stock: formData.usedStock,
          unit: formData.unit,
          supplier: formData.supplier,
          price: formData.price,
        });
        toast({ title: "Success", description: "Stock added successfully" });
      }
      
      handleRefresh();
      
      setFormData({
        productName: '',
        category: '',
        currentStock: 0,
        usedStock: 0,
        unit: 'pcs',
        supplier: '',
        price: 0,
      });
      setIsAddingStock(false);
      setEditingStock(null);
    } catch (e) {
      toast({ title: "Error", description: `Failed to ${editingStock ? 'update' : 'add'} stock`, variant: "destructive" });
    }
  };

  const confirmDelete = async () => {
    if (!stockToDelete) return;
    
    try {
      setSubmitting(true);
      const db = (await import('@/services/databaseService')).DatabaseService;
      await db.deleteGroceryProduct(stockToDelete.id);
      
      handleRefresh();
      
      setShowDeleteDialog(false);
      setStockToDelete(null);
      toast({ 
        title: "Success", 
        description: "Stock deleted successfully" 
      });
    } catch (e) {
      toast({ 
        title: "Error", 
        description: "Failed to delete stock", 
        variant: "destructive" 
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Export CSV function
  const handleExportCSV = () => {
    try {
      const headers = ['S No', 'Date', 'GR ID', 'Product Name', 'Category', 'Current Stock', 'Used Stock', 'Balance', 'Unit', 'Supplier', 'Price', 'Status'];
      
      const csvData = filteredProducts.map((product, index) => {
        const dateStr = product.lastUpdate;
        let formattedDate = '';
        
        if (dateStr) {
          let dateObj;
          if (dateStr.includes('T')) {
            dateObj = new Date(dateStr);
          } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            dateObj = new Date(dateStr + 'T00:00:00');
          }
          
          if (dateObj && !isNaN(dateObj.getTime())) {
            const day = String(dateObj.getDate()).padStart(2, '0');
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const year = dateObj.getFullYear();
            formattedDate = `${day}/${month}/${year}`;
          } else {
            formattedDate = dateStr;
          }
        }
        
        const balance = product.currentStock - product.usedStock;
        
        return [
          index + 1,
          formattedDate,
          product.grId,
          `"${product.productName}"`,
          `"${product.category}"`,
          product.currentStock,
          product.usedStock,
          balance,
          product.unit,
          `"${product.supplier}"`,
          product.price,
          product.status.charAt(0).toUpperCase() + product.status.slice(1).replace('-', ' '),
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
        let filename = `grocery-stock-${dateStr}`;
        
        if (filterMonth !== null && filterYear !== null) {
          filename += `-${months[filterMonth]}-${filterYear}`;
        }
        
        if (categoryFilter !== 'all') {
          filename += `-${categoryFilter}`;
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
          description: `CSV exported successfully! ${filteredProducts.length} products exported.`
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

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch =
      product.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.grId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.supplier?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesCategory = true;
    if (categoryFilter !== 'all') {
      matchesCategory = product.category === categoryFilter;
    }
    
    let matchesStatus = true;
    if (statusFilter !== 'all') {
      matchesStatus = product.status === statusFilter;
    }
    
    if (filterMonth !== null && filterYear !== null) {
      const dateStr = product.lastUpdate;
      if (!dateStr) return false;
      let d;
      if (dateStr.includes('T')) {
        d = new Date(dateStr);
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        d = new Date(dateStr + 'T00:00:00');
      } else {
        return false;
      }
      if (isNaN(d.getTime())) return false;
      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus &&
        d.getMonth() === filterMonth &&
        d.getFullYear() === filterYear
      );
    }
    return matchesSearch && matchesCategory && matchesStatus;
  }).sort((a, b) => {
    const idA = parseInt(a.id) || 0;
    const idB = parseInt(b.id) || 0;
    return idA - idB;
  });

  // Pagination logic
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.ceil(filteredProducts.length / pageSize);
  const paginatedProducts = filteredProducts.slice((page - 1) * pageSize, page * pageSize);

  const handlePrevPage = () => setPage((p) => Math.max(1, p - 1));
  const handleNextPage = () => setPage((p) => Math.min(totalPages, p + 1));
  React.useEffect(() => { setPage(1); }, [searchTerm, products.length]);

  // Calculate stats
  const totalProducts = filteredProducts.length;
  const inStockCount = filteredProducts.filter(p => p.status === 'in-stock').length;
  const lowStockCount = filteredProducts.filter(p => p.status === 'low-stock').length;
  const outOfStockCount = filteredProducts.filter(p => p.status === 'out-of-stock').length;

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
        {/* Header Section */}
        <div className="crm-header-container">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 bg-blue-100 rounded-xl">
                <Package className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Grocery Stock Management</h1>
              </div>
            </div>
          
            <div className="flex flex-row sm:flex-row gap-1 sm:gap-3 w-full sm:w-auto">
              <Button 
                onClick={() => {
                  const currentMonth = new Date().getMonth();
                  const currentYear = new Date().getFullYear();
                  
                  setCategoryFilter('all');
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
              
              <Button 
                onClick={() => {
                  setFormData({
                    productName: '',
                    category: '',
                    currentStock: 0,
                    usedStock: 0,
                    unit: 'pcs',
                    supplier: '',
                    price: 0,
                  });
                  setIsAddingStock(true);
                }}
                className="modern-btn modern-btn-primary flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Add Stock</span>
                <span className="sm:hidden">+</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {/* In Stock Card */}
          <div className="bg-green-50 rounded-lg p-4 lg:p-6 border border-green-100">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-green-600 flex items-center gap-2">
                  <span className="h-2 w-2 bg-green-500 rounded-full"></span>
                  Available
                </p>
                <p className="text-2xl lg:text-3xl font-bold text-green-800">{inStockCount}</p>
                <p className="text-base lg:text-lg font-semibold text-green-700">In Stock</p>
              </div>
              <div className="bg-green-500 rounded-lg p-3 lg:p-4">
                <TrendingUp className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
              </div>
            </div>
          </div>
          
          {/* Low Stock Card */}
          <div className="bg-orange-50 rounded-lg p-4 lg:p-6 border border-orange-100">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-orange-600 flex items-center gap-2">
                  <span className="h-2 w-2 bg-orange-500 rounded-full"></span>
                  Running low
                </p>
                <p className="text-2xl lg:text-3xl font-bold text-orange-800">{lowStockCount}</p>
                <p className="text-base lg:text-lg font-semibold text-orange-700">Low Stock</p>
              </div>
              <div className="bg-orange-500 rounded-lg p-3 lg:p-4">
                <TrendingDown className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
              </div>
            </div>
          </div>
          
          {/* Out of Stock Card */}
          <div className="bg-red-50 rounded-lg p-4 lg:p-6 border border-red-100">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-red-600 flex items-center gap-2">
                  <span className="h-2 w-2 bg-red-500 rounded-full"></span>
                  Not available
                </p>
                <p className="text-2xl lg:text-3xl font-bold text-red-800">{outOfStockCount}</p>
                <p className="text-base lg:text-lg font-semibold text-red-700">Out of Stock</p>
              </div>
              <div className="bg-red-500 rounded-lg p-3 lg:p-4">
                <AlertTriangle className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
              </div>
            </div>
          </div>
          
          {/* Total Products Card */}
          <div className="bg-blue-50 rounded-lg p-4 lg:p-6 border border-blue-100">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-600 flex items-center gap-2">
                  <span className="h-2 w-2 bg-blue-500 rounded-full"></span>
                  All products
                </p>
                <p className="text-2xl lg:text-3xl font-bold text-blue-800">{totalProducts}</p>
                <p className="text-base lg:text-lg font-semibold text-blue-700">Total Products</p>
              </div>
              <div className="bg-blue-500 rounded-lg p-3 lg:p-4">
                <Package className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="crm-controls-container">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by product name, GR ID, category, or supplier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-full sm:w-48">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {groceryCategories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="in-stock">In Stock</SelectItem>
                    <SelectItem value="low-stock">Low Stock</SelectItem>
                    <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
          description="Filter stock by specific month and year"
          previewText="products"
        />

        {/* Stock Table */}
        <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-xl shadow-sm overflow-hidden">
          <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gray-50/50">
            <div className="flex items-center text-base sm:text-lg font-semibold text-gray-900">
              <Package className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              <span className="hidden sm:inline">Stock List ({filteredProducts.length})</span>
              <span className="sm:hidden">Stock ({filteredProducts.length})</span>
            </div>
          </div>
        
        <div className="overflow-x-auto">
          <Table className="w-full min-w-[1200px]">
            <TableHeader>
              <TableRow className="bg-gray-50 border-b">
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">S No</TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Date</span>
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">GR ID</TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">Product Name</TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">Category</TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">Current Stock</TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">Used Stock</TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">Balance</TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">Status</TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProducts.map((product, idx) => {
                const balance = product.currentStock - product.usedStock;
                return (
                  <TableRow key={product.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{(page - 1) * pageSize + idx + 1}</TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{
                      (() => {
                        const dateStr = product.lastUpdate;
                        if (!dateStr) return '';
                        let dateObj;
                        if (dateStr.includes('T')) {
                          dateObj = new Date(dateStr);
                        } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                          dateObj = new Date(dateStr + 'T00:00:00');
                        } else {
                          return dateStr;
                        }
                        if (isNaN(dateObj.getTime())) return dateStr;
                        const day = String(dateObj.getDate()).padStart(2, '0');
                        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                        const year = dateObj.getFullYear();
                        return `${day}/${month}/${year}`;
                      })()
                    }</TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 font-medium text-center text-xs sm:text-sm whitespace-nowrap">{product.grId}</TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 font-medium text-center text-xs sm:text-sm max-w-[200px] truncate">{product.productName}</TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{product.category}</TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{product.currentStock} {product.unit}</TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{product.usedStock} {product.unit}</TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">
                      <span className={balance === 0 ? 'text-red-600 font-medium' : balance <= 5 ? 'text-orange-600 font-medium' : 'text-green-600 font-medium'}>
                        {balance} {product.unit}
                      </span>
                    </TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">
                      <Badge 
                        variant={product.status === 'in-stock' ? 'default' : product.status === 'low-stock' ? 'secondary' : 'destructive'}
                        className={`
                          ${product.status === 'in-stock' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 
                            product.status === 'low-stock' ? 'bg-orange-100 text-orange-800 hover:bg-orange-200' : 
                            'bg-red-100 text-red-800 hover:bg-red-200'}
                        `}
                      >
                        {product.status === 'in-stock' ? 'In Stock' : product.status === 'low-stock' ? 'Low Stock' : 'Out of Stock'}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1 sm:gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleViewStock(product)}
                          className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 hover:border-blue-400 rounded-lg"
                          title="View Details"
                        >
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleEditStock(product)}
                          className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 hover:border-blue-400 rounded-lg"
                          title="Edit Stock"
                        >
                          <Edit2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleDeleteStock(product)}
                          className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-400 rounded-lg"
                          title="Delete Stock"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {paginatedProducts.length === 0 && (
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
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, filteredProducts.length)} of {filteredProducts.length} products
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

        {/* Add/Edit Stock Dialog */}
        <Dialog open={isAddingStock} onOpenChange={setIsAddingStock}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader className="relative pb-3 sm:pb-4 md:pb-6 border-b border-blue-100 px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  {editingStock ? <Edit2 className="h-5 w-5 text-blue-600" /> : <Plus className="h-5 w-5 text-blue-600" />}
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-gray-900">
                    {editingStock ? 'Edit Stock' : 'Add New Stock'}
                  </DialogTitle>
                  <DialogDescription className="text-gray-600 mt-1">
                    {editingStock ? 'Update stock information' : 'Enter the details for the new stock item'}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSubmit();
              }}
              className="space-y-4 p-3 sm:p-4 md:p-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="productName" className="text-sm font-medium text-gray-700">Product Name *</Label>
                  <Input
                    id="productName"
                    value={formData.productName}
                    onChange={(e) => setFormData({...formData, productName: e.target.value})}
                    placeholder="Enter product name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-medium text-gray-700">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {groceryCategories.map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentStock" className="text-sm font-medium text-gray-700">Current Stock *</Label>
                  <Input
                    id="currentStock"
                    type="number"
                    min="0"
                    value={formData.currentStock}
                    onChange={(e) => setFormData({...formData, currentStock: parseInt(e.target.value) || 0})}
                    placeholder="Enter current stock"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="usedStock" className="text-sm font-medium text-gray-700">Used Stock</Label>
                  <Input
                    id="usedStock"
                    type="number"
                    min="0"
                    value={formData.usedStock}
                    onChange={(e) => setFormData({...formData, usedStock: parseInt(e.target.value) || 0})}
                    placeholder="Enter used stock"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit" className="text-sm font-medium text-gray-700">Unit</Label>
                  <Select value={formData.unit} onValueChange={(value) => setFormData({...formData, unit: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pcs">Pieces</SelectItem>
                      <SelectItem value="kg">Kilograms</SelectItem>
                      <SelectItem value="g">Grams</SelectItem>
                      <SelectItem value="l">Liters</SelectItem>
                      <SelectItem value="ml">Milliliters</SelectItem>
                      <SelectItem value="box">Box</SelectItem>
                      <SelectItem value="pack">Pack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-sm font-medium text-gray-700">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                    placeholder="Enter price"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="supplier" className="text-sm font-medium text-gray-700">Supplier</Label>
                  <Input
                    id="supplier"
                    value={formData.supplier}
                    onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                    placeholder="Enter supplier name"
                  />
                </div>
              </div>
              
              <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsAddingStock(false);
                    setEditingStock(null);
                    setFormData({
                      productName: '',
                      category: '',
                      currentStock: 0,
                      usedStock: 0,
                      unit: 'pcs',
                      supplier: '',
                      price: 0,
                    });
                  }}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="w-full sm:w-auto modern-btn modern-btn-primary"
                >
                  {editingStock ? 'Update Stock' : 'Add Stock'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Stock Dialog - Enhanced to match GeneralStock design with Mobile Responsive */}
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="max-w-[95vw] sm:max-w-4xl lg:max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="px-2 sm:px-6">
              <DialogTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Package className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                <span className="truncate">Stock Information History</span>
              </DialogTitle>
            </DialogHeader>
            
            {viewingStock && (
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
                        <label className="text-xs sm:text-sm font-medium text-gray-600">GR ID</label>
                        <p className="font-semibold text-sm sm:text-base text-gray-900 bg-gray-50 px-3 py-2 rounded-lg break-all">
                          {viewingStock.grId}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs sm:text-sm font-medium text-gray-600">Product Name</label>
                        <p className="font-semibold text-sm sm:text-base text-gray-900 bg-gray-50 px-3 py-2 rounded-lg break-words">
                          {viewingStock.productName}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs sm:text-sm font-medium text-gray-600">Category</label>
                        <p className="font-semibold text-sm sm:text-base text-gray-900 bg-gray-50 px-3 py-2 rounded-lg break-words">
                          {viewingStock.category}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs sm:text-sm font-medium text-gray-600">Supplier</label>
                        <p className="font-semibold text-sm sm:text-base text-gray-900 bg-gray-50 px-3 py-2 rounded-lg break-words">
                          {viewingStock.supplier}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs sm:text-sm font-medium text-gray-600">Unit</label>
                        <p className="font-semibold text-sm sm:text-base text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                          {viewingStock.unit}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs sm:text-sm font-medium text-gray-600">Price per Unit</label>
                        <p className="font-semibold text-sm sm:text-base text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                          ₹{viewingStock.price}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs sm:text-sm font-medium text-gray-600">Purchase Date</label>
                        <p className="font-semibold text-sm sm:text-base text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                          {viewingStock.purchaseDate ? (() => {
                            try {
                              const date = new Date(viewingStock.purchaseDate);
                              if (!isNaN(date.getTime())) {
                                return date.toLocaleDateString('en-GB');
                              }
                              return viewingStock.purchaseDate;
                            } catch {
                              return viewingStock.purchaseDate || 'Not specified';
                            }
                          })() : 'Not specified'}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs sm:text-sm font-medium text-gray-600">Last Update</label>
                        <p className="font-semibold text-sm sm:text-base text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                          {viewingStock.lastUpdate ? (() => {
                            try {
                              const date = new Date(viewingStock.lastUpdate);
                              if (!isNaN(date.getTime())) {
                                return date.toLocaleDateString('en-GB');
                              }
                              return viewingStock.lastUpdate;
                            } catch {
                              return viewingStock.lastUpdate || 'Not specified';
                            }
                          })() : 'Not specified'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Stock Summary Card */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-3 sm:px-6 py-3 sm:py-4 border-b">
                    <h3 className="font-bold text-base sm:text-lg text-gray-900 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                      Stock Summary
                    </h3>
                  </div>
                  
                  <div className="p-3 sm:p-6">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      <div className="text-center">
                        <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600">{viewingStock.currentStock || 0}</div>
                        <div className="text-xs sm:text-sm text-gray-600 mt-1">Current Stock</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-600">{viewingStock.usedStock || 0}</div>
                        <div className="text-xs sm:text-sm text-gray-600 mt-1">Used Stock</div>
                      </div>
                      <div className="text-center lg:col-start-3">
                        <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600">{(viewingStock.currentStock || 0) - (viewingStock.usedStock || 0)}</div>
                        <div className="text-xs sm:text-sm text-gray-600 mt-1">Available</div>
                      </div>
                      <div className="text-center lg:col-start-4">
                        <div className="mb-2">
                          <Badge 
                            variant={
                              viewingStock.status === 'in-stock' ? 'default' : 
                              viewingStock.status === 'low-stock' ? 'secondary' : 'destructive'
                            }
                            className={`text-xs sm:text-sm font-medium px-2 py-1 ${
                              viewingStock.status === 'in-stock' ? 'bg-green-100 text-green-800' :
                              viewingStock.status === 'low-stock' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}
                          >
                            {viewingStock.status === 'in-stock' ? 'In Stock' :
                             viewingStock.status === 'low-stock' ? 'Low Stock' :
                             'Out of Stock'}
                          </Badge>
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600">Status</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Stock Movement History */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-3 sm:px-6 py-3 sm:py-4 border-b">
                    <h3 className="font-bold text-base sm:text-lg text-gray-900 flex items-center gap-2">
                      <History className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                      Stock Movement History
                    </h3>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50/50">
                          <TableHead className="text-center font-medium text-xs sm:text-sm min-w-[50px]">S NO</TableHead>
                          <TableHead className="text-center font-medium text-xs sm:text-sm min-w-[80px]">Date</TableHead>
                          <TableHead className="text-center font-medium text-xs sm:text-sm min-w-[90px]">Stock Change</TableHead>
                          <TableHead className="text-center font-medium text-xs sm:text-sm min-w-[70px]">Type</TableHead>
                          <TableHead className="text-center font-medium text-xs sm:text-sm min-w-[80px]">Stock After</TableHead>
                          <TableHead className="text-center font-medium text-xs sm:text-sm min-w-[100px]">Description</TableHead>
                          <TableHead className="text-center font-medium text-xs sm:text-sm min-w-[70px]">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-6 sm:py-8 text-muted-foreground">
                            <div className="flex flex-col items-center gap-2">
                              <Package className="h-8 w-8 sm:h-12 sm:w-12 text-gray-300" />
                              <span className="text-sm sm:text-base">No stock history recorded yet</span>
                              <span className="text-xs text-gray-500 hidden sm:block">Stock movement tracking will appear here</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t border-gray-100 px-3 sm:px-6 pb-3 sm:pb-4 md:pb-6">
              <Button 
                variant="outline"
                onClick={() => setShowViewDialog(false)}
                className="w-full sm:w-auto modern-btn modern-btn-secondary text-sm sm:text-base"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader className="text-center pb-2">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <DialogTitle className="text-lg font-semibold text-gray-900">
                Delete Stock
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600 mt-2">
                Are you sure you want to delete this stock item? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            {stockToDelete && (
              <div className="bg-gray-50 rounded-lg p-4 my-4">
                <div className="text-sm">
                  <div className="font-medium text-gray-900">{stockToDelete.grId} - {stockToDelete.productName}</div>
                  <div className="text-gray-600">{stockToDelete.category}</div>
                  <div className="text-gray-600">Stock: {stockToDelete.currentStock - stockToDelete.usedStock} {stockToDelete.unit}</div>
                </div>
              </div>
            )}

            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowDeleteDialog(false);
                  setStockToDelete(null);
                }}
                disabled={submitting}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={confirmDelete}
                disabled={submitting}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Stock
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

export default GroceryStock;
