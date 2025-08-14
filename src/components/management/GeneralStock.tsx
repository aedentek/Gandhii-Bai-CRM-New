import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Search, Package, AlertTriangle, TrendingUp, TrendingDown, Download, RefreshCw, Calendar, Edit2, Eye, Trash2, Activity, AlertCircle, Pencil, Info, History } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import MonthYearPickerDialog from '@/components/shared/MonthYearPickerDialog';

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

  if (loading) return <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center"><div className="text-lg">Loading...</div></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 px-2 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header Section */}
        <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-2xl p-4 sm:p-6 shadow-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 bg-blue-100 rounded-xl">
                <Package className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">General Stock Management</h1>
              </div>
            </div>
          
            <div className="flex flex-row sm:flex-row gap-1 sm:gap-3 w-full sm:w-auto">
              <Button 
                onClick={() => {
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
                disabled={loading}
                className="modern-btn modern-btn-primary flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
                title="Reset to current month and refresh data"
              >
                <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
                <span className="sm:hidden">↻</span>
              </Button>
              
              {/* Month & Year Filter Button */}
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
              
              {/* Export CSV Button */}
              <Button 
                onClick={handleExportCSV}
                className="modern-btn modern-btn-primary flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
                title="Export filtered stock to CSV"
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">CSV</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6">
          <div className="modern-stat-card stat-card-green">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Package className="h-3 w-3 sm:h-5 sm:w-5 text-green-600" />
              </div>
              <div>
                <div className="text-lg sm:text-2xl font-bold text-gray-900">{inStockCount}</div>
                <div className="text-xs text-gray-600">In Stock</div>
              </div>
            </div>
          </div>
          
          <div className="modern-stat-card stat-card-orange">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="h-3 w-3 sm:h-5 sm:w-5 text-orange-600" />
              </div>
              <div>
                <div className="text-lg sm:text-2xl font-bold text-gray-900">{lowStockCount}</div>
                <div className="text-xs text-gray-600">Low Stock</div>
              </div>
            </div>
          </div>
          
          <div className="modern-stat-card stat-card-red">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="h-3 w-3 sm:h-5 sm:w-5 text-red-600" />
              </div>
              <div>
                <div className="text-lg sm:text-2xl font-bold text-gray-900">{outOfStockCount}</div>
                <div className="text-xs text-gray-600">Out of Stock</div>
              </div>
            </div>
          </div>
          
          <div className="modern-stat-card stat-card-blue">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-3 w-3 sm:h-5 sm:w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-lg sm:text-2xl font-bold text-gray-900">₹{totalValue.toFixed(2)}</div>
                <div className="text-xs text-gray-600">Total Value</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-xl p-4 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-3">
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
            <div className="flex flex-col sm:flex-row gap-3">
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
                    <div className="px-2 py-1 border-t border-gray-200">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => {
                          setStatusFilter('all');
                          setCategoryFilter('all');
                          setSearchTerm('');
                          setFilterMonth(new Date().getMonth());
                          setFilterYear(new Date().getFullYear());
                          setSelectedMonth(new Date().getMonth());
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
              <div className="w-full sm:w-48">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
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
                    <div className="flex items-center justify-center gap-2 sm:gap-3">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => openViewPopup(item)}
                        className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 hover:border-blue-400 rounded-lg"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4 sm:h-4 sm:w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => openEditPopup(item)}
                        className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 hover:border-green-400 rounded-lg"
                        title="Edit Stock"
                      >
                        <Pencil className="h-4 w-4 sm:h-4 sm:w-4" />
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
      </div>

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

      {/* View/Stock History Dialog */}
      <Dialog open={viewItem !== null} onOpenChange={() => closeViewPopup()}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              Stock Information History
            </DialogTitle>
          </DialogHeader>
          
          {viewItem && (
            <div className="space-y-6">
              {/* Product Details Card */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 sm:p-6">
                <h3 className="font-bold text-lg text-blue-900 mb-4 flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Product Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between p-3 bg-white/70 rounded-lg">
                    <span className="font-medium text-gray-700">GP ID:</span>
                    <span className="font-mono text-blue-600 font-bold">{viewItem.gpId || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-white/70 rounded-lg">
                    <span className="font-medium text-gray-700">Product Name:</span>
                    <span className="font-medium">{viewItem.productName}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-white/70 rounded-lg">
                    <span className="font-medium text-gray-700">Category:</span>
                    <span>{viewItem.category}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-white/70 rounded-lg">
                    <span className="font-medium text-gray-700">Supplier:</span>
                    <span>{viewItem.supplier}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-white/70 rounded-lg">
                    <span className="font-medium text-gray-700">Unit:</span>
                    <span>{viewItem.unit}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-white/70 rounded-lg">
                    <span className="font-medium text-gray-700">Price:</span>
                    <span className="font-bold text-green-600">₹{viewItem.price}</span>
                  </div>
                </div>
              </div>

              {/* Stock Summary Card */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 sm:p-6">
                <h3 className="font-bold text-lg text-green-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Stock Summary
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-white/70 rounded-lg">
                    <span className="font-medium block text-gray-700 mb-1">Total Stock</span>
                    <span className="text-blue-600 text-2xl font-bold">{viewItem.currentStock}</span>
                  </div>
                  <div className="text-center p-4 bg-white/70 rounded-lg">
                    <span className="font-medium block text-gray-700 mb-1">Used Stock</span>
                    <span className="text-red-600 text-2xl font-bold">{viewItem.usedStock}</span>
                  </div>
                  <div className="text-center p-4 bg-white/70 rounded-lg">
                    <span className="font-medium block text-gray-700 mb-1">Available</span>
                    <span className="text-green-600 text-2xl font-bold">{viewItem.currentStock - viewItem.usedStock}</span>
                  </div>
                  <div className="text-center p-4 bg-white/70 rounded-lg">
                    <span className="font-medium block text-gray-700 mb-1">Status</span>
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
                      {stockHistory.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            <div className="flex flex-col items-center gap-2">
                              <Package className="h-12 w-12 text-gray-300" />
                              <span>No stock history recorded yet</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        stockHistory.map((entry, idx) => {
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
                            <TableRow key={entry.id || idx} className="hover:bg-gray-50">
                              <TableCell className="text-center font-medium">{idx + 1}</TableCell>
                              <TableCell className="text-center">{formattedDate}</TableCell>
                              <TableCell className="text-center font-bold">
                                <span className={entry.stock_type === 'used' ? 'text-red-600' : 'text-green-600'}>
                                  {entry.stock_type === 'used' ? '-' : '+'}{entry.stock_change}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant={entry.stock_type === 'used' ? 'destructive' : entry.stock_type === 'added' ? 'default' : 'secondary'}>
                                  {entry.stock_type}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center font-medium">{entry.current_stock_after}</TableCell>
                              <TableCell className="text-center">{entry.description || '-'}</TableCell>
                              <TableCell className="text-center">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
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
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
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
                <Button variant="outline" onClick={closeEditPopup}>
                  Cancel
                </Button>
                <Button 
                  onClick={saveEdit}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
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
