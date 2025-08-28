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
import { ActionButtons } from '@/components/ui/HeaderActionButtons';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit2, Trash2, Package, ShoppingCart, RefreshCw, Activity, TrendingUp, AlertCircle, Calendar, Download, X, IndianRupee, Package2, Tag, Building2, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import usePageTitle from '@/hooks/usePageTitle';

interface GroceryProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  supplier: string;
  price: number;
  quantity: number;
  status: 'active' | 'inactive';
  createdAt: string;
  purchaseDate: string;
}

const GroceryManagement: React.FC = () => {
  // Set custom page title
  usePageTitle('Grocery Management');

const [products, setProducts] = useState<GroceryProduct[]>([]);
const [loading, setLoading] = useState(true);
const [refreshKey, setRefreshKey] = useState(0);

React.useEffect(() => {
  (async () => {
    if (refreshKey > 0) console.log('Refreshing data...');
    try {
      const db = (await import('@/services/databaseService')).DatabaseService;
      const data = await db.getAllGroceryProducts();
      setProducts(data.map((prod: any) => ({
        ...prod,
        id: prod.id.toString(),
        createdAt: prod.created_at || prod.createdAt || '',
        purchaseDate: prod.purchase_date || prod.purchaseDate || '',
      })));
    } catch (e) {
      // Optionally show error
    } finally {
      setLoading(false);
    }
  })();
}, [refreshKey]);

const [categories, setCategories] = useState<any[]>([]);
const [suppliers, setSuppliers] = useState<any[]>([]);

// Fetch categories and suppliers from backend (MySQL) with refresh dependency
React.useEffect(() => {
  (async () => {
    try {
      const db = (await import('@/services/databaseService')).DatabaseService;
      const [cats, sups] = await Promise.all([
        db.getAllGroceryCategories(),
        db.getAllGrocerySuppliers()
      ]);
      setCategories(cats);
      setSuppliers(sups);
    } catch (e) {
      // Optionally show error
    }
  })();
}, [refreshKey]);

// Auto-fix mismatched category/supplier names when categories or suppliers change
React.useEffect(() => {
  const autoFixNames = async () => {
    if (categories.length === 0 || suppliers.length === 0 || products.length === 0) return;
    
    try {
      const db = (await import('@/services/databaseService')).DatabaseService;
      let hasUpdates = false;
      
      for (const product of products) {
        let needsUpdate = false;
        let updatedData: any = {};
        
        // Check if category needs updating
        const categoryMatch = categories.find((cat: any) => 
          cat.status === 'active' && (
            cat.name.toLowerCase().includes(product.category.toLowerCase()) ||
            product.category.toLowerCase().includes(cat.name.toLowerCase())
          )
        );
        
        if (categoryMatch && categoryMatch.name !== product.category) {
          updatedData.category = categoryMatch.name;
          needsUpdate = true;
        }
        
        // Check if supplier needs updating
        const supplierMatch = suppliers.find((sup: any) => 
          sup.status === 'active' && (
            sup.name.toLowerCase().includes(product.supplier.toLowerCase()) ||
            product.supplier.toLowerCase().includes(sup.name.toLowerCase())
          )
        );
        
        if (supplierMatch && supplierMatch.name !== product.supplier) {
          updatedData.supplier = supplierMatch.name;
          needsUpdate = true;
        }
        
        // Update the product if needed
        if (needsUpdate) {
          await db.updateGroceryProduct(product.id, updatedData);
          hasUpdates = true;
        }
      }
      
        // Refresh data if any updates were made
        if (hasUpdates) {
          setTimeout(() => {
            handleRefresh();
          }, 500);
        }    } catch (error) {
      console.error('Auto-fix names error:', error);
    }
  };

  // Run auto-fix after a short delay to ensure data is loaded
  const timeoutId = setTimeout(autoFixNames, 1000);
  return () => clearTimeout(timeoutId);
}, [categories, suppliers, products]);

// Auto-refresh data periodically to catch external changes
React.useEffect(() => {
  const interval = setInterval(() => {
    setRefreshKey(prev => prev + 1);
  }, 30000); // Refresh every 30 seconds

  return () => clearInterval(interval);
}, []);

// Global refresh function that can be called from anywhere
const handleRefresh = React.useCallback(() => {
  setLoading(true);
  setRefreshKey(prev => prev + 1);
}, []);




  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<GroceryProduct | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [productToDelete, setProductToDelete] = useState<GroceryProduct | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    supplier: '',
    price: '', // always string
    quantity: '', // always string
    purchaseDate: new Date().toISOString().split('T')[0],
  });

  // Month and year state for filtering
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-based like General Categories
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [showMonthYearDialog, setShowMonthYearDialog] = useState(false);
  const [filterMonth, setFilterMonth] = useState<number | null>(new Date().getMonth() + 1); // Also 1-based
  const [filterYear, setFilterYear] = useState<number | null>(currentYear);

  // Open edit dialog and populate form
  const handleEditProduct = (product: GroceryProduct) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      category: product.category,
      supplier: product.supplier,
      price: product.price.toString(),
      quantity: product.quantity.toString(),
      purchaseDate: product.purchaseDate || product.createdAt || new Date().toISOString().split('T')[0],
    });
    setIsAddingProduct(true);
  };

  // Update product logic
  const handleUpdateProduct = async () => {
    if (!formData.name || !formData.category || !formData.supplier || !formData.price || !formData.quantity || !formData.purchaseDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    try {
      const db = (await import('@/services/databaseService')).DatabaseService;
      const qty = parseInt(formData.quantity);
      const updated = await db.updateGroceryProduct(editingProduct!.id, {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        supplier: formData.supplier,
        price: parseFloat(formData.price),
        quantity: qty,
        current_stock: qty,
        status: 'active',
        purchaseDate: formData.purchaseDate
      });
      
      // Refresh all data to ensure categories and suppliers are current
      handleRefresh();
      
      setIsAddingProduct(false);
      setEditingProduct(null);
      setFormData({ name: '', description: '', category: '', supplier: '', price: '', quantity: '', purchaseDate: new Date().toISOString().split('T')[0] });
      toast({ title: "Success", description: "Product updated successfully" });
    } catch (e) {
      toast({ title: "Error", description: "Failed to update product", variant: "destructive" });
    }
  };

  const { toast } = useToast();

  // Enhanced global refresh function that preserves current filter state
  const handleGlobalRefresh = React.useCallback(async () => {
    try {
      setLoading(true);
      
      // Store current filter state
      const currentFilterMonth = filterMonth;
      const currentFilterYear = filterYear;
      const currentSearchTerm = searchTerm;
      const currentStatusFilter = statusFilter;
      
      // Force refresh all data
      const db = (await import('@/services/databaseService')).DatabaseService;
      
      // Fetch fresh data
      const [freshProducts, freshCategories, freshSuppliers] = await Promise.all([
        db.getAllGroceryProducts(),
        db.getAllGroceryCategories(),
        db.getAllGrocerySuppliers()
      ]);
      
      // Update products with proper mapping
      setProducts(freshProducts.map((prod: any) => ({
        ...prod,
        id: prod.id.toString(),
        createdAt: prod.created_at || prod.createdAt || '',
        purchaseDate: prod.purchase_date || prod.purchaseDate || '',
      })));
      
      // Update categories and suppliers
      setCategories(freshCategories);
      setSuppliers(freshSuppliers);
      
      // Restore filter state after refresh
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

  const handleSubmit = async () => {
    if (!formData.name || !formData.category || !formData.supplier || !formData.price || !formData.quantity || !formData.purchaseDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const db = (await import('@/services/databaseService')).DatabaseService;
      const qty = parseInt(formData.quantity);
      
      if (editingProduct) {
        // Update existing product
        await db.updateGroceryProduct(editingProduct.id, {
          name: formData.name,
          description: formData.description,
          category: formData.category,
          supplier: formData.supplier,
          price: parseFloat(formData.price),
          quantity: qty,
          current_stock: qty,
          status: 'active',
          purchaseDate: formData.purchaseDate
        });
        toast({ title: "Success", description: "Product updated successfully" });
      } else {
        // Add new product
        await db.addGroceryProduct({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          supplier: formData.supplier,
          price: parseFloat(formData.price),
          quantity: qty,
          current_stock: qty,
          status: 'active',
          purchaseDate: formData.purchaseDate
        });
        toast({ title: "Success", description: "Product added successfully" });
      }
      
      // Refresh all data to ensure categories and suppliers are current
      handleRefresh();
      
      setFormData({ name: '', description: '', category: '', supplier: '', price: '', quantity: '', purchaseDate: new Date().toISOString().split('T')[0] });
      setIsAddingProduct(false);
      setEditingProduct(null);
    } catch (e) {
      toast({ title: "Error", description: `Failed to ${editingProduct ? 'update' : 'add'} product`, variant: "destructive" });
    }
  };

  const handleAddProduct = async () => {
    await handleSubmit();
  };

  const handleDeleteProduct = async (product: GroceryProduct) => {
    setProductToDelete(product);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    
    try {
      setSubmitting(true);
      const db = (await import('@/services/databaseService')).DatabaseService;
      await db.deleteGroceryProduct(productToDelete.id);
      
      // Refresh all data to ensure table is current
      handleRefresh();
      
      setShowDeleteDialog(false);
      setProductToDelete(null);
      toast({ 
        title: "Success", 
        description: "Product deleted successfully" 
      });
    } catch (e) {
      toast({ 
        title: "Error", 
        description: "Failed to delete product", 
        variant: "destructive" 
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Export CSV function
  const handleExportCSV = () => {
    try {
      // Prepare CSV headers
      const headers = ['S No', 'Date', 'Name', 'Category', 'Supplier', 'Price', 'Quantity', 'Status', 'Description'];
      
      // Prepare CSV data
      const csvData = filteredProducts.map((product, index) => {
        const dateStr = product.purchaseDate || product.createdAt;
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
        
        return [
          index + 1,
          formattedDate,
          `"${product.name}"`,
          `"${product.category}"`,
          `"${product.supplier}"`,
          `₹${product.price.toLocaleString('en-IN')}`,
          product.quantity,
          product.status.charAt(0).toUpperCase() + product.status.slice(1),
          `"${product.description || ''}"`
        ];
      });
      
      // Combine headers and data
      const csvContent = [headers, ...csvData]
        .map(row => row.join(','))
        .join('\n');
      
      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        
        // Generate filename with current date and filter info
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        let filename = `grocery-products-${dateStr}`;
        
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

  // Filter products by search, status, and by selected month/year if filter is active
  const filteredProducts = products.filter(product => {
    const matchesSearch =
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.supplier?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter logic
    let matchesStatus = true;
    if (statusFilter !== 'all') {
      if (statusFilter === 'low-stock') {
        matchesStatus = product.quantity < 10;
      } else {
        matchesStatus = product.status === statusFilter;
      }
    }
    
    if (filterMonth !== null && filterYear !== null) {
      const dateStr = product.purchaseDate || product.createdAt;
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
        matchesStatus &&
        d.getMonth() === (filterMonth - 1) && // Convert 1-based filterMonth to 0-based for comparison
        d.getFullYear() === filterYear
      );
    }
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    // Sort by ID in ascending order (convert to number for proper numeric sorting)
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

  if (loading) {
    return (
      <div className="crm-page-bg">
        <div className="max-w-7xl mx-auto">
          <div className="crm-header-container">
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
              <div className="crm-header-icon">
                <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Grocery Management</h1>
                {/* <p className="text-sm text-gray-600 mt-1">Manage and organize your grocery products inventory</p> */}
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
              
              {/* Month & Year Filter Button */}
              <ActionButtons.MonthYear
                onClick={() => setShowMonthYearDialog(true)}
                text={months[selectedMonth - 1]} // Mirror General Categories: 1-based month to 0-based array
              />
              
              {/* Export CSV Button */}
              <Button 
                onClick={handleExportCSV}
                className="global-btn flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
                title="Export filtered products to CSV"
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">CSV</span>
              </Button>
              
              <Button 
                onClick={() => {
                  setFormData({
                    name: '',
                    description: '',
                    category: '',
                    supplier: '',
                    price: '',
                    quantity: '',
                    purchaseDate: new Date().toISOString().split('T')[0],
                  });
                  setIsAddingProduct(true);
                }}
                className="global-btn flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Add Product</span>
                <span className="sm:hidden">+</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="crm-stats-grid">
          {/* Total Products Card */}
          <Card className="crm-stat-card crm-stat-card-blue">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-blue-700 mb-1 truncate">Total Products</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-900 mb-1">{filteredProducts.length}</p>
                  <div className="flex items-center text-xs text-blue-600">
                    <TrendingUp className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Registered</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-blue">
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Active Products Card */}
          <Card className="crm-stat-card crm-stat-card-green">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-green-700 mb-1 truncate">Active Products</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-900 mb-1">
                    {filteredProducts.filter(p => p.status === 'active').length}
                  </p>
                  <div className="flex items-center text-xs text-green-600">
                    <Activity className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">In stock</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-green">
                  <Activity className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
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
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-900 mb-1">
                    {filteredProducts.filter(p => p.quantity < 10).length}
                  </p>
                  <div className="flex items-center text-xs text-orange-600">
                    <TrendingUp className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Urgent</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-orange">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Inactive Products Card */}
          <Card className="crm-stat-card crm-stat-card-red">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-red-700 mb-1 truncate">Inactive</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-900 mb-1">
                    {filteredProducts.filter(p => p.status === 'inactive').length}
                  </p>
                  <div className="flex items-center text-xs text-red-600">
                    <AlertCircle className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Discontinued</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-red">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
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
                <Input
                  placeholder="Search products by name, category, or supplier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="low-stock">Low Stock</SelectItem>
                  <div className="px-2 py-1 border-t border-gray-200">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      onClick={() => {
                        setStatusFilter('all');
                        setSearchTerm('');
                        setFilterMonth(new Date().getMonth() + 1);
                        setFilterYear(new Date().getFullYear());
                        setSelectedMonth(new Date().getMonth() + 1);
                        setSelectedYear(new Date().getFullYear());
                      }}
                    >
                      <RefreshCw className="h-3 w-3 mr-2" />
                      Reset All Filters
                    </Button>
                  </div>
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
          description="Filter products by specific month and year"
          previewText="products"
        />

        {/* Products Table */}
        <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-xl shadow-sm overflow-hidden">
          <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gray-50/50">
            <div className="flex items-center text-base sm:text-lg font-semibold text-gray-900">
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              <span className="hidden sm:inline">Products List ({filteredProducts.length})</span>
              <span className="sm:hidden">Products ({filteredProducts.length})</span>
            </div>
          </div>
        
        {/* Scrollable Table View for All Screen Sizes */}
        <div className="overflow-x-auto">
          <Table className="w-full min-w-[1200px]">
            <TableHeader>
              <TableRow className="bg-gray-50 border-b">
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center">
                    <span>S No</span>
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Date</span>
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center">
                    <span>Name</span>
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center">
                    <span>Category</span>
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center">
                    <span>Supplier</span>
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center">
                    <span>Price</span>
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center">
                    <span>Quantity</span>
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                    <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Status</span>
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center">
                    <span>Actions</span>
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProducts.map((product, idx) => (
                <TableRow key={product.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{(page - 1) * pageSize + idx + 1}</TableCell>
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{
                    (() => {
                      const dateStr = product.purchaseDate || product.createdAt;
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
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 font-medium text-center text-xs sm:text-sm whitespace-nowrap">{product.name}</TableCell>
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{product.category}</TableCell>
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{product.supplier}</TableCell>
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">₹{product.price.toLocaleString('en-IN')}</TableCell>
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{product.quantity}</TableCell>
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">
                    <Badge 
                      variant={product.status === 'active' ? 'default' : 'secondary'}
                      className={`
                        ${product.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}
                      `}
                    >
                      {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">
                    <div className="action-buttons-container">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleEditProduct(product)}
                        className="action-btn-lead action-btn-edit h-8 w-8 sm:h-9 sm:w-9 p-0"
                        title="Edit Product"
                      >
                        <Edit2 className="h-4 w-4 sm:h-4 sm:w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDeleteProduct(product)}
                        className="action-btn-lead action-btn-delete h-8 w-8 sm:h-9 sm:w-9 p-0"
                        title="Delete Product"
                      >
                        <Trash2 className="h-4 w-4 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No products found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination - Only show if more than one page */}
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

        {/* Add/Edit Product Dialog */}
        <Dialog open={isAddingProduct} onOpenChange={setIsAddingProduct}>
          <DialogContent className="editpopup form crm-modal-container sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader className="editpopup form crm-modal-header">
              <div className="editpopup form crm-modal-header-content">
                <div className="editpopup form crm-modal-icon">
                  {editingProduct ? <Edit2 className="h-5 w-5 text-blue-600" /> : <Plus className="h-5 w-5 text-blue-600" />}
                </div>
                <div className="editpopup form crm-modal-title-section">
                  <DialogTitle className="editpopup form crm-modal-title">
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </DialogTitle>
                  <DialogDescription className="editpopup form crm-modal-description">
                    {editingProduct ? 'Update product information' : 'Enter the details for the new grocery product'}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSubmit();
              }}
              className="editpopup form crm-edit-form-content"
            >
              <div className="editpopup form crm-edit-form-grid grid-cols-1 md:grid-cols-2">
                <div className="editpopup form crm-edit-form-group">
                  <Label htmlFor="name" className="editpopup form crm-edit-form-label flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Product Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter product name"
                    className="editpopup form crm-edit-form-input"
                    required
                  />
                </div>
                <div className="editpopup form crm-edit-form-group">
                  <Label htmlFor="category" className="editpopup form crm-edit-form-label flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Category <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                    <SelectTrigger className="editpopup form crm-edit-form-select">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {(() => {
                        const activeCategories = categories.filter((cat: any) => cat.status === 'active');
                        if (activeCategories.length === 0) {
                          return <SelectItem value="__no_category__" disabled>No Categories Found</SelectItem>;
                        }
                        return activeCategories
                          .filter((cat: any) => cat.name && cat.name !== "")
                          .map((cat: any) => (
                            <SelectItem key={cat.id || cat.name} value={cat.name}>{cat.name}</SelectItem>
                          ));
                      })()}
                    </SelectContent>
                  </Select>
                </div>
                <div className="editpopup form crm-edit-form-group">
                  <Label htmlFor="supplier" className="editpopup form crm-edit-form-label flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Supplier <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.supplier} onValueChange={(value) => setFormData({...formData, supplier: value})}>
                    <SelectTrigger className="editpopup form crm-edit-form-select">
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {(() => {
                        const activeSuppliers = suppliers.filter((sup: any) => sup.status === 'active');
                        if (activeSuppliers.length === 0) {
                          return <SelectItem value="__no_supplier__" disabled>No Suppliers Found</SelectItem>;
                        }
                        return activeSuppliers
                          .filter((sup: any) => sup.name && sup.name !== "")
                          .map((sup: any) => (
                            <SelectItem key={sup.id || sup.name} value={sup.name}>{sup.name}</SelectItem>
                          ));
                      })()}
                    </SelectContent>
                  </Select>
                </div>
                <div className="editpopup form crm-edit-form-group">
                  <Label htmlFor="price" className="editpopup form crm-edit-form-label flex items-center gap-2">
                    <IndianRupee className="h-4 w-4" />
                    Price <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    placeholder="Enter price"
                    className="editpopup form crm-edit-form-input"
                    required
                  />
                </div>
                <div className="editpopup form crm-edit-form-group">
                  <Label htmlFor="quantity" className="editpopup form crm-edit-form-label flex items-center gap-2">
                    <Package2 className="h-4 w-4" />
                    Quantity <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    placeholder="Enter quantity"
                    className="editpopup form crm-edit-form-input"
                    required
                  />
                </div>
                <div className="editpopup form crm-edit-form-group">
                  <Label htmlFor="purchaseDate" className="editpopup form crm-edit-form-label flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Purchase Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="purchaseDate"
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                    placeholder="Select purchase date"
                    className="editpopup form crm-edit-form-input"
                    required
                  />
                </div>
              </div>
              <div className="editpopup form crm-edit-form-group">
                <Label htmlFor="description" className="editpopup form crm-edit-form-label flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Enter product description (optional)"
                  className="editpopup form crm-edit-form-textarea"
                  rows={3}
                />
              </div>
              
              <DialogFooter className="editpopup form dialog-footer flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsAddingProduct(false);
                    setEditingProduct(null);
                    setFormData({
                      name: '',
                      description: '',
                      category: '',
                      supplier: '',
                      price: '',
                      quantity: '',
                      purchaseDate: new Date().toISOString().split('T')[0],
                    });
                  }}
                  className="editpopup form footer-button-cancel w-full sm:w-auto modern-btn modern-btn-secondary"
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="editpopup form footer-button-save w-full sm:w-auto global-btn"
                >
                  <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="crm-modal-container">
            <DialogHeader className="editpopup form dialog-header">
              <div className="editpopup form icon-title-container">
                <div className="editpopup form dialog-icon">
                  <Trash2 className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                </div>
                <div className="editpopup form title-description">
                  <DialogTitle className="editpopup form dialog-title text-red-700">
                    Delete Product
                  </DialogTitle>
                  <DialogDescription className="editpopup form dialog-description">
                    Are you sure you want to delete this product? This action cannot be undone.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            {productToDelete && (
              <div className="mx-4 my-4 p-4 bg-gray-50 rounded-lg border">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-900">{productToDelete.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">{productToDelete.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">{productToDelete.supplier}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <IndianRupee className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">₹{productToDelete.price?.toLocaleString('en-IN')}</span>
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
                  setProductToDelete(null);
                }}
                disabled={submitting}
                className="editpopup form footer-button-cancel w-full sm:w-auto modern-btn modern-btn-secondary"
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={confirmDelete}
                disabled={submitting}
                className="editpopup form footer-button-delete w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    Delete Product
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

export default GroceryManagement;
