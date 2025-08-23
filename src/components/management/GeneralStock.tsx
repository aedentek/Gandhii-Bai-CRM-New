import React, { useState } from 'react';
import '@/styles/global-crm-design.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ActionButtons } from '@/components/ui/HeaderActionButtons';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Edit, Trash2, Package, Phone, Mail, MapPin, RefreshCcw, Calendar, Download, Edit2, Activity, TrendingUp, AlertCircle, Eye, X, Users, FileText, AlertTriangle, TrendingDown, Tag, DollarSign, Clock, BarChart3, Warehouse, Package2, Layers, Info, History, PencilIcon as Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import MonthYearPickerDialog from '@/components/shared/MonthYearPickerDialog';
import LoadingScreen from '@/components/shared/LoadingScreen';

interface GeneralStockItem {
  id: string;
  gpId: string;
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

const GeneralStock: React.FC = () => {
  const { toast } = useToast();
  
  // Month and year state for filtering
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-based for UI
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [showMonthYearDialog, setShowMonthYearDialog] = useState(false);
  const [filterMonth, setFilterMonth] = useState<number | null>(new Date().getMonth() + 1); // Also 1-based
  const [filterYear, setFilterYear] = useState<number | null>(currentYear);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<GeneralStockItem | null>(null);
  const [formData, setFormData] = useState({
    gpId: '',
    productName: '',
    category: '',
    currentStock: 0,
    usedStock: 0,
    unit: '',
    supplier: '',
    price: 0,
    status: 'in-stock' as 'in-stock' | 'low-stock' | 'out-of-stock',
  });
  
  // Fetch products and categories from backend
  const [products, setProducts] = useState<any[]>([]);
  const [generalCategories, setGeneralCategories] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0); // Force refresh trigger

  // Global refresh function
  const handleGlobalRefresh = async () => {
    setLoading(true);
    try {
      const db = (await import('@/services/databaseService')).DatabaseService;
      const data = await db.getAllGeneralProducts();
      setProducts(data.map((prod: any) => ({
        ...prod,
        id: prod.id.toString(),
        createdAt: prod.created_at || prod.createdAt || '',
        purchaseDate: prod.purchase_date || prod.purchaseDate || '',
      })));
      // Fetch categories from backend
      const categories = await db.getAllGeneralCategories();
      setGeneralCategories(categories.filter((cat: any) => cat.status === 'active'));
    } catch (e) {
      setProducts([]);
      setGeneralCategories([]);
      toast({ title: "Error", description: "Failed to refresh data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };
  
  React.useEffect(() => {
    handleGlobalRefresh();
  }, [refreshKey]); // Add refreshKey as dependency

  // Export CSV function
  const handleExportCSV = () => {
    const headers = ['S No', 'Date', 'Product Name', 'Category', 'Current Stock', 'Used Stock', 'Available', 'Unit', 'Price', 'Supplier', 'Status'];
    const csvData = filteredStockItems.map((item, idx) => {
      const dateStr = item.purchaseDate;
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
        }
      }
      
      return [
        idx + 1,
        formattedDate,
        item.productName,
        item.category,
        item.currentStock,
        item.usedStock,
        item.currentStock - item.usedStock,
        item.unit,
        `₹${item.price}`,
        item.supplier,
        item.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
      ];
    });
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      const monthName = filterMonth !== null && filterYear !== null 
        ? `${months[filterMonth]}_${filterYear}` 
        : `${months[selectedMonth]}_${selectedYear}`;
      link.setAttribute('download', `general_stock_${monthName}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // View popup state for stock history
  const [viewItem, setViewItem] = useState<GeneralStockItem | null>(null);
  const [stockHistory, setStockHistory] = useState<any[]>([]);
  
  // Fetch stock history from backend
  async function getStockHistory(productId: string) {
    try {
      const db = (await import('@/services/databaseService')).DatabaseService;
      const history = await db.getStockHistory(productId);
      return history || [];
    } catch (error) {
      console.error('Error fetching stock history:', error);
      return [];
    }
  }

  // Open view popup and load stock history
  async function openViewPopup(item: GeneralStockItem) {
    setViewItem(item);
    const history = await getStockHistory(item.id);
    setStockHistory(history);
  }

  // Delete/Reset used stock for a product
  async function resetUsedStock(productId: string) {
    try {
      const db = (await import('@/services/databaseService')).DatabaseService;
      
      // Reset used stock to 0 in the database
      await db.updateGeneralStock(productId, {
        used_stock: 0,
        stock_status: 'in-stock',
        last_update: new Date().toISOString().slice(0, 19).replace('T', ' ')
      });
      
      // Refresh products to show updated data
      const data = await db.getAllGeneralProducts();
      setProducts(data.map((prod: any) => ({
        ...prod,
        id: prod.id.toString(),
        createdAt: prod.created_at || prod.createdAt || '',
        purchaseDate: prod.purchase_date || prod.purchaseDate || '',
      })));
      
      // Update the view item with new values
      const updatedItem = data.find((prod: any) => prod.id.toString() === productId);
      if (updatedItem) {
        setViewItem({
          ...viewItem!,
          usedStock: 0,
          status: 'in-stock'
        });
      }
      
      // Refresh stock history
      const history = await getStockHistory(productId);
      setStockHistory(history);
      
    } catch (error) {
      console.error('Error resetting stock:', error);
    }
  }

  // Stock items are now backend-driven
  const stockItems = products.map((product: any) => ({
    id: product.id,
    gpId: product.gp_id || '',
    productName: product.name,
    category: product.category,
    currentStock: product.current_stock ?? product.quantity,
    usedStock: product.used_stock ?? 0,
    unit: product.unit ?? '',
    lastUpdate: product.last_update || product.createdAt,
    purchaseDate: product.purchase_date || product.purchaseDate || '',
    supplier: product.supplier,
    status: product.stock_status || (product.status === 'active' ? 'in-stock' : 'inactive'),
    price: product.price
  }));

  const [categoryFilter, setCategoryFilter] = useState('all');

  const getStockStatus = (item: GeneralStockItem): 'in-stock' | 'low-stock' | 'out-of-stock' => {
    if (item.currentStock - item.usedStock === 0) return 'out-of-stock';
    if (item.currentStock - item.usedStock <= 5) return 'low-stock'; // threshold for demo
    return 'in-stock';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-stock':
        return 'default';
      case 'low-stock':
        return 'destructive';
      case 'out-of-stock':
        return 'secondary';
      default:
        return 'default';
    }
  };

  // Filter stock items by search, status, category, and by selected month/year if filter is active
  const filteredStockItems = stockItems.filter(item => {
    const matchesSearch =
      item.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || getStockStatus(item) === statusFilter;
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    
    if (filterMonth !== null && filterYear !== null) {
      const dateStr = item.purchaseDate;
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
        matchesCategory &&
        d.getMonth() === (filterMonth - 1) &&
        d.getFullYear() === filterYear
      );
    }
    return matchesSearch && matchesStatus && matchesCategory;
  }).sort((a, b) => parseInt(a.id) - parseInt(b.id)); // Ascending order by ID

  // CRUD operations like GeneralSuppliers
  const handleSubmit = async () => {
    if (!formData.productName || !formData.category || !formData.currentStock || !formData.supplier) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const db = (await import('@/services/databaseService')).DatabaseService;
      
      // This function is only for adding new items
      const newItem = await db.addGeneralProduct({
        gp_id: formData.gpId,
        name: formData.productName,
        category: formData.category,
        current_stock: formData.currentStock,
        used_stock: formData.usedStock,
        unit: formData.unit,
        supplier: formData.supplier,
        price: formData.price,
        stock_status: formData.status
      });
      toast({ title: "Success", description: "Stock item added successfully" });
      
      setFormData({ 
        gpId: '', productName: '', category: '', currentStock: 0, usedStock: 0, 
        unit: '', supplier: '', price: 0, status: 'in-stock' 
      });
      setIsAddingItem(false);
      handleGlobalRefresh();
    } catch (e) {
      toast({ 
        title: "Error", 
        description: "Failed to add stock item", 
        variant: "destructive" 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditItem = (item: GeneralStockItem) => {
    openEditPopup(item);
  };

  const handleDeleteItem = (item: GeneralStockItem) => {
    setItemToDelete(item);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    setSubmitting(true);
    try {
      const db = (await import('@/services/databaseService')).DatabaseService;
      await db.deleteGeneralProduct(itemToDelete.id);
      toast({ title: "Success", description: "Stock item deleted successfully" });
      setShowDeleteDialog(false);
      setItemToDelete(null);
      handleGlobalRefresh();
    } catch (e) {
      toast({ title: "Error", description: "Failed to delete stock item", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // Pagination logic
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.ceil(filteredStockItems.length / pageSize);
  const paginatedStockItems = filteredStockItems.slice((page - 1) * pageSize, page * pageSize);

  const handlePrevPage = () => setPage((p) => Math.max(1, p - 1));
  const handleNextPage = () => setPage((p) => Math.min(totalPages, p + 1));
  React.useEffect(() => { setPage(1); }, [searchTerm, statusFilter, stockItems.length]);

  // Calculate statistics based on filtered items
  const totalValue = filteredStockItems.reduce((sum, item) => sum + (item.currentStock * item.price), 0);
  const lowStockCount = filteredStockItems.filter(item => getStockStatus(item) === 'low-stock').length;
  const outOfStockCount = filteredStockItems.filter(item => getStockStatus(item) === 'out-of-stock').length;
  const inStockCount = filteredStockItems.filter(item => getStockStatus(item) === 'in-stock').length;
  const totalProducts = filteredStockItems.length;

  // Edit popup state
  const [editItem, setEditItem] = useState<GeneralStockItem | null>(null);
  const [editUsedStock, setEditUsedStock] = useState(0);
  const [editStatus, setEditStatus] = useState<'in-stock' | 'low-stock' | 'out-of-stock'>('in-stock');
  const [editBalance, setEditBalance] = useState<number | string>('');

  React.useEffect(() => {
    if (editItem) {
      (async () => {
        const bal = await getRemainingBalance(editItem);
        // Show the remaining balance after deducting the new used stock
        setEditBalance(bal - editUsedStock);
      })();
    } else {
      setEditBalance('');
    }
  }, [editItem, editUsedStock]);

  function openEditPopup(item: GeneralStockItem) {
    setEditItem(item);
    setEditUsedStock(0); // Always reset to 0 for new entry
    setEditStatus(item.status);
  }

  // Helper to get remaining balance for a product (currentStock - already used stock)
  async function getRemainingBalance(item: GeneralStockItem) {
    // Current stock minus already used stock gives us the available balance
    return item.currentStock - item.usedStock;
  }

  // Helper to get available balance stock for validation
  function getAvailableBalance(item: GeneralStockItem) {
    return item.currentStock - item.usedStock;
  }

  function closeEditPopup() {
    setEditItem(null);
  }

  async function saveEdit() {
    if (!editItem) return closeEditPopup();
    
    // Additional validation before saving
    const availableBalance = getAvailableBalance(editItem);
    if (editUsedStock > availableBalance) {
      alert(`Cannot use more than available balance stock (${availableBalance})`);
      return;
    }
    
    if (editUsedStock < 0) {
      alert('Used stock cannot be negative');
      return;
    }
    
    try {
      const db = (await import('@/services/databaseService')).DatabaseService;
      
      // Calculate the new total used stock (current used stock + new usage)
      const currentUsedStock = editItem.usedStock || 0;
      const newTotalUsedStock = currentUsedStock + editUsedStock;
      
      // Record the stock change in history before updating
      if (editUsedStock > 0) {
        await db.addStockHistoryRecord({
          product_id: editItem.id,
          stock_change: editUsedStock,
          stock_type: 'used',
          current_stock_before: editItem.currentStock - currentUsedStock,
          current_stock_after: editItem.currentStock - newTotalUsedStock,
          update_date: new Date().toISOString().split('T')[0],
          description: `Stock usage: ${editUsedStock} units used`
        });
      }
      
      // Update product stock fields in backend (use updateGeneralStock)
      await db.updateGeneralStock(editItem.id, {
        used_stock: newTotalUsedStock,
        stock_status: editStatus,
        last_update: new Date().toISOString().slice(0, 19).replace('T', ' ')
      });
      
      // Close popup and force refresh
      closeEditPopup();
      
      // Force refresh by updating the refresh key AND reload page
      setRefreshKey(prev => prev + 1);
      
      // Multiple reload methods to ensure it works
      setTimeout(() => {
        window.location.reload();
      }, 100);
      
    } catch (error) {
      console.error('Error saving stock:', error);
      closeEditPopup();
    }
  }

  // Download Excel function
  const downloadExcel = () => {
    try {
      // Prepare data for Excel export
      const excelData = filteredStockItems.map((item, index) => ({
        'S NO': index + 1,
        'GP ID': item.gpId || 'N/A',
        'Product Name': item.productName,
        'Category': item.category,
        'Supplier': item.supplier,
        'Current Stock': item.currentStock,
        'Used Stock': item.usedStock,
        'Balance Stock': item.currentStock - item.usedStock,
        'Status': getStockStatus(item).replace('-', ' ').charAt(0).toUpperCase() + getStockStatus(item).replace('-', ' ').slice(1),
        'Purchase Date': (() => {
          const dateStr = item.purchaseDate;
          if (!dateStr) return '';
          
          let date;
          if (dateStr.includes('T')) {
            date = new Date(dateStr);
          } else if (dateStr.includes('-') && dateStr.split('-').length === 3) {
            const [y, m, d] = dateStr.split('-');
            if (y && m && d) {
              date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
            }
          } else {
            date = new Date(dateStr);
          }
          
          if (date && !isNaN(date.getTime())) {
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}-${month}-${year}`;
          }
          return '';
        })(),
        'Last Update': (() => {
          const dateStr = item.lastUpdate;
          if (!dateStr) return '';
          
          let date;
          if (dateStr.includes('T')) {
            date = new Date(dateStr);
          } else if (dateStr.includes('-') && dateStr.split('-').length === 3) {
            const [y, m, d] = dateStr.split('-');
            if (y && m && d) {
              date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
            }
          } else {
            date = new Date(dateStr);
          }
          
          if (date && !isNaN(date.getTime())) {
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}-${month}-${year}`;
          }
          return '';
        })(),
        'Price (₹)': item.price,
        'Total Value (₹)': (item.currentStock * item.price).toFixed(2)
      }));

      // Create CSV content
      const headers = Object.keys(excelData[0] || {});
      const csvContent = [
        headers.join(','),
        ...excelData.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row];
            // Escape commas and quotes in values
            return typeof value === 'string' && value.includes(',') 
              ? `"${value.replace(/"/g, '""')}"` 
              : value;
          }).join(',')
        )
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        
        // Generate filename with current month/year or "All" if no filter
        const monthName = filterMonth !== null ? months[filterMonth] : 'All';
        const yearName = filterYear !== null ? filterYear : 'Data';
        const filename = `General_Stock_${monthName}_${yearName}.csv`;
        
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error downloading Excel:', error);
      alert('Error downloading file. Please try again.');
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading general stock data..." />;
  }

  return (
    <div className="crm-page-bg">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header Section */}
        <div className="crm-header-container">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
            <div className="flex items-center gap-3">
              <div className="crm-header-icon">
                <Package className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">General Stock Management</h1>
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
              
              <Button 
                onClick={handleExportCSV}
                className="global-btn flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
                title="Export filtered stock items to CSV"
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">CSV</span>
              </Button>
              
              <ActionButtons.MonthYear
                onClick={() => setShowMonthYearDialog(true)}
                text={filterMonth !== null && filterYear !== null 
                  ? `${months[filterMonth - 1]} ${filterYear}`
                  : `${months[selectedMonth - 1]} ${selectedYear}`
                }
              />
              
              {/* <Button 
                onClick={() => {
                  setFormData({
                    gpId: '',
                    productName: '',
                    category: '',
                    currentStock: 0,
                    usedStock: 0,
                    unit: '',
                    supplier: '',
                    price: 0,
                    status: 'in-stock',
                  });
                  setIsAddingItem(true);
                }}
                className="global-btn flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Add Stock</span>
                <span className="sm:hidden">+</span>
              </Button> */}
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
                    <AlertTriangle className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Warning</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-orange">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
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
                    <TrendingDown className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Critical</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-red">
                  <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Total Value Card */}
          <Card className="crm-stat-card crm-stat-card-blue">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-blue-700 mb-1 truncate">Total Value</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-900 mb-1">₹{totalValue.toFixed(2)}</p>
                  <div className="flex items-center text-xs text-blue-600">
                    <TrendingUp className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Inventory</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-blue">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Controls */}
        <div className="crm-controls-container">
          <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products by name, category, or supplier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="w-full sm:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full">
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
              <div className="w-full sm:w-48">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {generalCategories.map((cat: any) => (
                      <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Stock Table */}
        <Card className="crm-table-container">
          <CardHeader className="crm-table-header">
            <div className="crm-table-title">
              <Package className="crm-table-title-icon" />
              <span className="crm-table-title-text">Stock Inventory ({filteredStockItems.length})</span>
              <span className="crm-table-title-text-mobile">Stock ({filteredStockItems.length})</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
        
        {/* Scrollable Table View for All Screen Sizes */}
        <div className="overflow-x-auto">
          <Table className="w-full min-w-[1400px]">
            <TableHeader>
              <TableRow className="bg-gray-50 border-b">
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center">
                    <span>S No</span>
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center">
                    <span>GP ID</span>
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center">
                    <span>Product Name</span>
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center">
                    <span>Category</span>
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center">
                    <span>Current Stock</span>
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center">
                    <span>Used Stock</span>
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center">
                    <span>Available</span>
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center">
                    <span>Unit</span>
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center">
                    <span>Price</span>
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
              {paginatedStockItems.map((item, idx) => (
                <TableRow key={item.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{(page - 1) * pageSize + idx + 1}</TableCell>
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap font-medium">{item.gpId}</TableCell>
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 font-medium text-center text-xs sm:text-sm whitespace-nowrap">{item.productName}</TableCell>
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{item.category}</TableCell>
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{item.currentStock}</TableCell>
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{item.usedStock}</TableCell>
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap font-medium">{item.currentStock - item.usedStock}</TableCell>
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{item.unit}</TableCell>
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">₹{item.price}</TableCell>
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">
                    <Badge 
                      variant={getStatusColor(getStockStatus(item))}
                      className={`
                        ${getStockStatus(item) === 'in-stock' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 
                          getStockStatus(item) === 'low-stock' ? 'bg-orange-100 text-orange-800 hover:bg-orange-200' : 
                          'bg-red-100 text-red-800 hover:bg-red-200'}
                      `}
                    >
                      {getStockStatus(item).replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1 sm:gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => openViewPopup(item)}
                        className="action-btn-lead action-btn-view h-8 w-8 sm:h-9 sm:w-9 p-0"
                        title="View Details"
                      >
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleEditItem(item)}
                        className="action-btn-lead action-btn-edit h-8 w-8 sm:h-9 sm:w-9 p-0"
                        title="Edit Stock"
                      >
                        <Edit2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDeleteItem(item)}
                        className="action-btn-lead action-btn-delete h-8 w-8 sm:h-9 sm:w-9 p-0"
                        title="Delete Stock"
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedStockItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                    No stock items found
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
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, filteredStockItems.length)} of {filteredStockItems.length} items
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

      {/* MonthYearPickerDialog */}
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
        description="Filter stock data by month and year"
        previewText="stock data"
      />

      {/* View Stock Item Dialog */}
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="relative pb-3 sm:pb-4 md:pb-6 border-b border-blue-100 px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Eye className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900">
                  Stock Item Details
                </DialogTitle>
                <DialogDescription className="text-gray-600 mt-1">
                  View detailed information about this stock item
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          {viewItem && (
            <div className="space-y-6 p-3 sm:p-4 md:p-6">
              {/* Product Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Product Name</Label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <p className="font-semibold text-gray-900">{viewItem.productName}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">GP ID</Label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <p className="font-semibold text-gray-900">{viewItem.gpId || 'N/A'}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Category</Label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <p className="font-semibold text-gray-900">{viewItem.category}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Supplier</Label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <p className="font-semibold text-gray-900">{viewItem.supplier || 'N/A'}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Price</Label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <p className="font-semibold text-gray-900">₹{viewItem.price || 0}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Unit</Label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <p className="font-semibold text-gray-900">{viewItem.unit}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Purchase Date</Label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <p className="font-semibold text-gray-900">{viewItem.purchaseDate}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Status</Label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <Badge 
                      variant={getStatusColor(getStockStatus(viewItem))}
                      className={`
                        ${getStockStatus(viewItem) === 'in-stock' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 
                          getStockStatus(viewItem) === 'low-stock' ? 'bg-orange-100 text-orange-800 hover:bg-orange-200' : 
                          'bg-red-100 text-red-800 hover:bg-red-200'}
                      `}
                    >
                      {getStockStatus(viewItem).replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Stock Summary */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Summary</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 text-center">
                    <div className="text-2xl font-bold text-blue-600">{viewItem.currentStock || 0}</div>
                    <div className="text-sm font-medium text-blue-600">Total Stock</div>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200 text-center">
                    <div className="text-2xl font-bold text-red-600">{viewItem.usedStock || 0}</div>
                    <div className="text-sm font-medium text-red-600">Used Stock</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-center">
                    <div className="text-2xl font-bold text-green-600">{(viewItem.currentStock || 0) - (viewItem.usedStock || 0)}</div>
                    <div className="text-sm font-medium text-green-600">Available</div>
                  </div>
                </div>
              </div>

              {/* Stock History */}
              {stockHistory.length > 0 && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Movement History</h3>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="text-center">Date</TableHead>
                          <TableHead className="text-center">Change</TableHead>
                          <TableHead className="text-center">Type</TableHead>
                          <TableHead className="text-center">Stock After</TableHead>
                          <TableHead className="text-center">Description</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stockHistory.slice(0, 5).map((entry, idx) => {
                          const formattedDate = (() => {
                            const date = new Date(entry.update_date);
                            if (isNaN(date.getTime())) return entry.update_date;
                            const day = String(date.getDate()).padStart(2, '0');
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const year = date.getFullYear();
                            return `${day}-${month}-${year}`;
                          })();
                          
                          return (
                            <TableRow key={entry.id || idx}>
                              <TableCell className="text-center">{formattedDate}</TableCell>
                              <TableCell className="text-center">
                                <span className={entry.stock_type === 'used' ? 'text-red-600' : 'text-green-600'}>
                                  {entry.stock_type === 'used' ? '-' : '+'}{entry.stock_change}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant={entry.stock_type === 'used' ? 'destructive' : 'default'}>
                                  {entry.stock_type}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">{entry.current_stock_after}</TableCell>
                              <TableCell className="text-center">{entry.description || '-'}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                    {stockHistory.length > 5 && (
                      <p className="text-sm text-gray-500 text-center mt-2">
                        Showing recent 5 entries of {stockHistory.length} total
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {/* No Stock History State */}
              {stockHistory.length === 0 && (
                <div className="border-t pt-6">
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Package className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Stock History</h3>
                    <p className="text-gray-500">No stock movement history recorded yet for this product</p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter className="px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
            <Button 
              type="button"
              variant="outline" 
              onClick={() => setViewItem(null)}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Stock Dialog */}
      <Dialog open={editItem !== null} onOpenChange={closeEditPopup}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
              <Pencil className="h-5 w-5 text-blue-600" />
              Edit Stock
            </DialogTitle>
          </DialogHeader>
          
          {editItem && (
            <div className="space-y-4">
              {/* Product Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                <div className="text-sm font-medium text-blue-900">{editItem.productName}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Current Stock */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock</label>
                  <div className="text-lg font-bold text-blue-600">{editItem.currentStock}</div>
                </div>
                
                {/* Available Balance */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Available Balance</label>
                  <div className="text-lg font-bold text-green-600">{getAvailableBalance(editItem)}</div>
                </div>
              </div>
              
              {/* Used Stock Input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Used Stock</label>
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
                  className="text-center"
                />
                <div className="text-xs text-gray-500">
                  Maximum available: {getAvailableBalance(editItem)} units
                </div>
                {editUsedStock > getAvailableBalance(editItem) && (
                  <div className="text-xs text-red-500">
                    Cannot exceed available balance stock
                  </div>
                )}
              </div>
              
              {/* Balance After Edit */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Balance After Edit</label>
                <div className="text-lg font-bold text-yellow-700">{editBalance}</div>
              </div>
              
              {/* Status Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Stock Status</label>
                <Select value={editStatus} onValueChange={v => setEditStatus(v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in-stock">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        In Stock
                      </div>
                    </SelectItem>
                    <SelectItem value="low-stock">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        Low Stock
                      </div>
                    </SelectItem>
                    <SelectItem value="out-of-stock">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        Out of Stock
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={closeEditPopup}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={saveEdit}
                  className="global-btn"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md w-[95vw] sm:w-full">
          <DialogHeader className="text-center">
            <DialogTitle className="text-destructive text-lg sm:text-xl">Delete Stock Item</DialogTitle>
            <DialogDescription className="text-center text-sm sm:text-base">
              Are you sure you want to delete stock item <strong>{itemToDelete?.productName}</strong>?
              <br />
              <br />
              <span className="text-destructive font-medium">This action cannot be undone.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
            <Button 
              type="button"
              variant="outline" 
              onClick={() => {
                setShowDeleteDialog(false);
                setItemToDelete(null);
              }}
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              {submitting ? (
                <>
                  <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Item'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
};

export default GeneralStock;
