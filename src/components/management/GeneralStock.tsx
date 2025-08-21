import React, { useState } from 'react';
import '@/styles/global-crm-design.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Search, Package, AlertTriangle, TrendingUp, TrendingDown, Download, RefreshCw, Calendar, Edit2, Eye, Trash2, Activity, AlertCircle, Pencil, Info, History, X, Tag, DollarSign, Clock, BarChart3, Warehouse, Package2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import MonthYearPickerDialog from '@/components/shared/MonthYearPickerDialog';
import LoadingScreen from '@/components/shared/LoadingScreen';
import HeaderActionButtons from '@/components/ui/HeaderActionButtons';

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
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [showMonthYearDialog, setShowMonthYearDialog] = useState(false);
  const [filterMonth, setFilterMonth] = useState<number | null>(new Date().getMonth());
  const [filterYear, setFilterYear] = useState<number | null>(currentYear);
  
  // Additional state for modern design
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
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

  // Close view popup
  function closeViewPopup() {
    setViewItem(null);
    setStockHistory([]);
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

  // Enhanced filtering with month/year, search, status, and category
  const filteredStockItems = stockItems.filter(item => {
    const matchesSearch = item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || getStockStatus(item) === statusFilter;
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    
    // If no month/year filter is active, show all items
    if (filterMonth === null || filterYear === null) {
      return matchesSearch && matchesStatus && matchesCategory;
    }
    
    // Get the balance stock (current stock - used stock)
    const balanceStock = item.currentStock - item.usedStock;
    
    // If viewing current month, show items that:
    // 1. Were purchased in the current month, OR
    // 2. Have balance stock from any previous month
    if (filterMonth === new Date().getMonth() && filterYear === new Date().getFullYear()) {
      const dateStr = item.purchaseDate;
      let itemDate = null;
      
      if (dateStr) {
        if (dateStr.includes('T')) {
          itemDate = new Date(dateStr);
        } else if (dateStr.includes('-') && dateStr.split('-').length === 3) {
          const [y, m, d] = dateStr.split('-');
          if (y && m && d) {
            itemDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
          }
        }
      }
      
      if (itemDate && !isNaN(itemDate.getTime())) {
        const currentDate = new Date();
        const isPurchasedInCurrentMonth = itemDate.getMonth() === filterMonth && itemDate.getFullYear() === filterYear;
        const isPurchasedBeforeCurrentMonth = itemDate < new Date(filterYear, filterMonth, 1);
        
        // Show if purchased in current month OR has balance stock from previous months
        const shouldShow = isPurchasedInCurrentMonth || (isPurchasedBeforeCurrentMonth && balanceStock > 0);
        
        return matchesSearch && matchesStatus && matchesCategory && shouldShow;
      }
      
      // If no valid purchase date, show only if has balance stock
      return matchesSearch && matchesStatus && matchesCategory && balanceStock > 0;
    }
    
    // For other months, show items purchased in that specific month
    const dateStr = item.purchaseDate;
    if (!dateStr) return false;
    
    let itemDate;
    if (dateStr.includes('T')) {
      itemDate = new Date(dateStr);
    } else if (dateStr.includes('-') && dateStr.split('-').length === 3) {
      const [y, m, d] = dateStr.split('-');
      if (y && m && d) {
        itemDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
      }
    }
    
    if (!itemDate || isNaN(itemDate.getTime())) return false;
    
    const matchesMonthYear = itemDate.getMonth() === filterMonth && itemDate.getFullYear() === filterYear;
    
    return matchesSearch && matchesStatus && matchesCategory && matchesMonthYear;
  });

  
  // Update the variable name to match what we use in export function
  const filteredItems = filteredStockItems;

  // Sort filtered items by GP ID in ascending order
  const sortedItems = filteredItems.sort((a, b) => {
    const gpIdA = a.gpId || '';
    const gpIdB = b.gpId || '';
    
    // Extract numeric part from GP ID (e.g., "GP0001" -> 1, "GP0010" -> 10)
    const numA = parseInt(gpIdA.replace(/[^0-9]/g, '')) || 0;
    const numB = parseInt(gpIdB.replace(/[^0-9]/g, '')) || 0;
    
    return numA - numB;
  });  // Pagination logic
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.ceil(sortedItems.length / pageSize);
  const paginatedItems = sortedItems.slice((page - 1) * pageSize, page * pageSize);

  const handlePrevPage = () => setPage((p) => Math.max(1, p - 1));
  const handleNextPage = () => setPage((p) => Math.min(totalPages, p + 1));
  React.useEffect(() => { setPage(1); }, [searchTerm, stockItems.length]);

  // Calculate statistics based on filtered items (current month/year selection)
  const totalValue = filteredItems.reduce((sum, item) => sum + (item.currentStock * item.price), 0);
  const lowStockCount = filteredItems.filter(item => getStockStatus(item) === 'low-stock').length;
  const outOfStockCount = filteredItems.filter(item => getStockStatus(item) === 'out-of-stock').length;
  const inStockCount = filteredItems.filter(item => getStockStatus(item) === 'in-stock').length;
  const totalProducts = filteredItems.length;
  const totalBalanceStock = filteredItems.reduce((sum, item) => sum + (item.currentStock - item.usedStock), 0);

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
      const excelData = filteredItems.map((item, index) => ({
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
          
            <HeaderActionButtons
              onRefresh={() => {
                // Reset all filters to current month/year and refresh
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
                
                // Refresh the data
                handleGlobalRefresh();
              }}
              refreshLoading={loading}
              
              onExport={handleExportCSV}
              exportText="Export CSV"
              
              onMonthYearClick={() => setShowMonthYearDialog(true)}
              monthYearText={
                filterMonth !== null && filterYear !== null 
                  ? `${months[filterMonth]} ${filterYear}`
                  : `${months[selectedMonth]} ${selectedYear}`
              }
            />
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
              <span className="crm-table-title-text">Stock Inventory ({filteredItems.length})</span>
              <span className="crm-table-title-text-mobile">Stock ({filteredItems.length})</span>
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
              {paginatedItems.map((item, idx) => (
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
                        onClick={() => openEditPopup(item)}
                        className="action-btn-lead action-btn-edit h-8 w-8 sm:h-9 sm:w-9 p-0"
                        title="Edit Stock"
                      >
                        <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedItems.length === 0 && (
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
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, filteredItems.length)} of {filteredItems.length} items
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

      {/* View/Stock History Dialog - Medicine Stock Modal Style */}
      {viewItem && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => closeViewPopup()}
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
                    <Package className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1">
                    <div className={`border-2 border-white shadow-sm text-xs px-2 py-1 rounded-full ${
                      getStockStatus(viewItem) === 'in-stock' ? 'bg-green-100 text-green-800' :
                      getStockStatus(viewItem) === 'low-stock' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {getStockStatus(viewItem).replace(/[-_]/g, ' ').charAt(0).toUpperCase() + getStockStatus(viewItem).replace(/[-_]/g, ' ').slice(1)}
                    </div>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-1 sm:gap-2 truncate">
                    <Package className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-blue-600 flex-shrink-0" />
                    <span className="truncate">{viewItem.productName}</span>
                  </h2>
                  <div className="text-xs sm:text-sm md:text-lg lg:text-xl mt-1 flex items-center gap-2">
                    <span className="text-gray-600">GP ID:</span>
                    <span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg border border-green-200">
                      {viewItem.gpId || 'N/A'}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => closeViewPopup()}
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
                          <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 truncate">{viewItem.productName}</p>
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
                          <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-purple-600" />
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
                          <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-orange-600" />
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
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-indigo-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium text-indigo-600 uppercase tracking-wide">Purchase Date</div>
                          <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">{viewItem.purchaseDate}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-teal-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-teal-100">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Clock className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-teal-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium text-teal-600 uppercase tracking-wide">Unit</div>
                          <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">{viewItem.unit}</p>
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
                      <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-blue-600">{viewItem.currentStock || 0}</div>
                      <div className="text-xs sm:text-sm font-medium text-blue-600 uppercase tracking-wide">Total Stock</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-red-50 to-white p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl border border-red-100 text-center">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-red-600" />
                      </div>
                      <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-red-600">{viewItem.usedStock || 0}</div>
                      <div className="text-xs sm:text-sm font-medium text-red-600 uppercase tracking-wide">Used Stock</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-50 to-white p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl border border-green-100 text-center">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Package2 className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-green-600" />
                      </div>
                      <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-green-600">{(viewItem.currentStock || 0) - (viewItem.usedStock || 0)}</div>
                      <div className="text-xs sm:text-sm font-medium text-green-600 uppercase tracking-wide">Available</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-50 to-white p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl border border-purple-100 text-center">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Activity className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-purple-600" />
                      </div>
                      <div className={`text-xs px-2 py-1 rounded-full font-medium ${
                        getStockStatus(viewItem) === 'in-stock' ? 'bg-green-100 text-green-800' :
                        getStockStatus(viewItem) === 'low-stock' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {getStockStatus(viewItem).replace(/[-_]/g, ' ').charAt(0).toUpperCase() + getStockStatus(viewItem).replace(/[-_]/g, ' ').slice(1)}
                      </div>
                      <div className="text-xs sm:text-sm font-medium text-purple-600 uppercase tracking-wide mt-2">Status</div>
                    </div>
                    
                  </div>
                </div>

                {/* Stock Movement History */}
                {stockHistory.length > 0 && (
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-blue-100 shadow-sm">
                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 flex items-center gap-2">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <History className="h-3 w-3 sm:h-3 sm:w-3 md:h-4 md:w-4 text-purple-600" />
                      </div>
                      Stock Movement History ({stockHistory.length})
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">S.No</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Stock Change</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Stock After</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Description</th>
                            <th className="text-center py-3 px-4 font-semibold text-gray-700">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stockHistory.map((entry, idx) => {
                            // Format date as DD-MM-YYYY
                            let formattedDate = entry.update_date;
                            if (formattedDate) {
                              const date = new Date(formattedDate);
                              if (!isNaN(date.getTime())) {
                                const day = String(date.getDate()).padStart(2, '0');
                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                const year = date.getFullYear();
                                formattedDate = `${day}-${month}-${year}`;
                              }
                            }
                            return (
                              <tr key={entry.id || idx} className="border-b border-gray-100 hover:bg-white/50 transition-colors">
                                <td className="py-3 px-4 text-gray-900 font-medium">{idx + 1}</td>
                                <td className="py-3 px-4 text-gray-900">{formattedDate}</td>
                                <td className="py-3 px-4 font-bold">
                                  <span className={entry.stock_type === 'used' ? 'text-red-600' : 'text-green-600'}>
                                    {entry.stock_type === 'used' ? '-' : '+'}{entry.stock_change}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <Badge variant={entry.stock_type === 'used' ? 'destructive' : entry.stock_type === 'added' ? 'default' : 'secondary'}>
                                    {entry.stock_type}
                                  </Badge>
                                </td>
                                <td className="py-3 px-4 text-gray-900 font-medium">{entry.current_stock_after}</td>
                                <td className="py-3 px-4 text-gray-900">{entry.description || '-'}</td>
                                <td className="py-3 px-4 text-center">
                                  <button
                                    type="button"
                                    className="inline-flex items-center justify-center w-8 h-8 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors shadow-sm"
                                    title="Delete Stock History Entry"
                                    onClick={async () => {
                                      if (window.confirm(`Are you sure you want to delete this stock history entry?`)) {
                                        try {
                                          const db = (await import('@/services/databaseService')).DatabaseService;
                                          
                                          // Delete the specific history entry
                                          await db.deleteStockHistoryRecord(entry.id);
                                          
                                          // Get updated stock history after deletion
                                          const updatedHistory = await getStockHistory(viewItem.id);
                                          setStockHistory(updatedHistory);
                                          
                                          // Recalculate total used stock from remaining history entries
                                          const totalUsedStock = updatedHistory
                                            .filter((h: any) => h.stock_type === 'used')
                                            .reduce((sum: number, h: any) => sum + h.stock_change, 0);
                                          
                                          // Update the product's used stock in the database
                                          await db.updateGeneralStock(viewItem.id, {
                                            used_stock: totalUsedStock,
                                            stock_status: totalUsedStock === 0 ? 'in-stock' : 
                                                         (viewItem.currentStock - totalUsedStock) <= 5 ? 'low-stock' : 'in-stock',
                                            last_update: new Date().toISOString().slice(0, 19).replace('T', ' ')
                                          });
                                          
                                          // Update the viewItem to reflect new stock levels
                                          const newStatus: 'in-stock' | 'low-stock' | 'out-of-stock' = 
                                            totalUsedStock === 0 ? 'in-stock' : 
                                            (viewItem.currentStock - totalUsedStock) <= 5 ? 'low-stock' : 'in-stock';
                                          
                                          setViewItem({
                                            ...viewItem,
                                            usedStock: totalUsedStock,
                                            status: newStatus
                                          });
                                          
                                          // Refresh the main products list to reflect changes
                                          setRefreshKey(prev => prev + 1);
                                          
                                          console.log('Stock history entry deleted and stock recalculated');
                                        } catch (error) {
                                          console.error('Error deleting stock history entry:', error);
                                          alert('Error deleting stock history entry');
                                        }
                                      }
                                    }}
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

                {/* No Stock History State */}
                {stockHistory.length === 0 && (
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-blue-100 shadow-sm text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Package className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Stock History</h3>
                    <p className="text-gray-500">No stock movement history recorded yet for this product</p>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      )}

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
                  variant="outline" 
                  onClick={closeEditPopup}
                  className="action-btn action-btn-outline"
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
      </div>
    </div>
  );
};

export default GeneralStock;
