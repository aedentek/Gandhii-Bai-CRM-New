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
import { Plus, Search, Edit, Trash2, Package, Phone, Mail, MapPin, RefreshCcw, Calendar, Download, Edit2, Activity, TrendingUp, AlertCircle, Eye, X, Users, FileText, AlertTriangle, TrendingDown, Tag, IndianRupee, Clock, BarChart3, Warehouse, Package2, Layers, Info, History, PencilIcon as Pencil, Receipt, Building, ShoppingCart, Banknote, ShoppingBasket, User, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import MonthYearPickerDialog from '@/components/shared/MonthYearPickerDialog';
import LoadingScreen from '@/components/shared/LoadingScreen';
import usePageTitle from '@/hooks/usePageTitle';

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
  // Set page title
  usePageTitle();

  const { toast } = useToast();
  
  // Helper function to format date as DD/MM/YYYY
  const formatDateDDMMYYYY = (dateStr?: string): string => {
    if (!dateStr) return 'N/A';
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
  };
  
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
  
  // New glass morphism view modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewProduct, setViewProduct] = useState<GeneralStockItem | null>(null);
  const [viewStockHistory, setViewStockHistory] = useState<any[]>([]);
  const [showDeleteHistoryConfirm, setShowDeleteHistoryConfirm] = useState(false);
  const [historyToDelete, setHistoryToDelete] = useState<any>(null);
  
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
      const formattedDate = formatDateDDMMYYYY(item.purchaseDate);
      
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

  // New glass morphism view function (mirroring Grocery Accounts)
  const handleViewClick = async (product: GeneralStockItem) => {
    try {
      setViewProduct(product);
      const history = await getStockHistory(product.id);
      setViewStockHistory(history);
      setViewModalOpen(true);
    } catch (error) {
      console.error('Error loading stock history:', error);
      toast({
        title: "Error",
        description: "Failed to load stock history",
        variant: "destructive"
      });
    }
  };

  // Handle delete stock history record
  const handleDeleteStockHistory = (historyRecord: any) => {
    setHistoryToDelete(historyRecord);
    setShowDeleteHistoryConfirm(true);
  };

  // Confirm delete stock history record
  const confirmDeleteStockHistory = async () => {
    if (!historyToDelete || !viewProduct) return;
    
    try {
      const db = (await import('@/services/databaseService')).DatabaseService;
      
      // First, calculate the stock adjustment needed
      const stockChange = historyToDelete.stock_change || 0;
      const stockType = historyToDelete.stock_type;
      
      // Delete the history record from database
      await db.deleteStockHistoryRecord(historyToDelete.id);
      
      // Adjust the product's stock values based on the deleted record
      if (stockType === 'used' && stockChange > 0) {
        // If we're deleting a "used" record, we need to reduce the used_stock
        // This effectively adds back the stock to available
        const allProducts = await db.getAllGeneralProducts();
        const currentProduct = allProducts.find((p: any) => p.id.toString() === viewProduct.id.toString());
        
        if (currentProduct) {
          const currentUsedStock = currentProduct.used_stock || 0;
          const newUsedStock = Math.max(0, currentUsedStock - stockChange);
          
          await db.updateGeneralStock(viewProduct.id, {
            used_stock: newUsedStock,
            stock_status: newUsedStock === 0 ? 'in-stock' : 
                         (currentProduct.current_stock - newUsedStock) <= 10 ? 'low-stock' : 'in-stock',
            last_update: new Date().toISOString().slice(0, 19).replace('T', ' ')
          });
          
          console.log(`Deleted stock history: Reduced used_stock by ${stockChange} units`);
          console.log(`New used_stock: ${newUsedStock}`);
        }
      } else if (stockType === 'added' && stockChange > 0) {
        // If we're deleting an "added" record, we need to reduce the current_stock
        const allProducts = await db.getAllGeneralProducts();
        const currentProduct = allProducts.find((p: any) => p.id.toString() === viewProduct.id.toString());
        
        if (currentProduct) {
          const currentStock = currentProduct.current_stock || 0;
          const newCurrentStock = Math.max(0, currentStock - stockChange);
          
          await db.updateGeneralStock(viewProduct.id, {
            current_stock: newCurrentStock,
            stock_status: newCurrentStock === 0 ? 'out-of-stock' : 
                         newCurrentStock <= 10 ? 'low-stock' : 'in-stock',
            last_update: new Date().toISOString().slice(0, 19).replace('T', ' ')
          });
          
          console.log(`Deleted stock history: Reduced current_stock by ${stockChange} units`);
          console.log(`New current_stock: ${newCurrentStock}`);
        }
      }
      
      toast({
        title: "Success",
        description: "Stock history record deleted and stock adjusted successfully",
        variant: "default"
      });
      
      // Refresh the stock history
      const updatedHistory = await getStockHistory(viewProduct.id);
      setViewStockHistory(updatedHistory);
      
      // Refresh the main products list
      await handleGlobalRefresh();
      
      // Update the view modal with fresh product data
      const allProducts = await db.getAllGeneralProducts();
      const updatedProduct = allProducts.find((p: any) => p.id.toString() === viewProduct.id.toString());
      if (updatedProduct) {
        setViewProduct({
          ...viewProduct,
          currentStock: updatedProduct.current_stock || 0,
          usedStock: updatedProduct.used_stock || 0,
          status: updatedProduct.stock_status || 'in-stock'
        });
      }
      
    } catch (error) {
      console.error('Error deleting stock history record:', error);
      toast({
        title: "Error",
        description: "Failed to delete stock history record",
        variant: "destructive"
      });
    } finally {
      setShowDeleteHistoryConfirm(false);
      setHistoryToDelete(null);
    }
  };

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
    console.log('saveEdit function called');
    if (!editItem) {
      console.log('No edit item found, closing popup');
      return closeEditPopup();
    }
    
    console.log('Edit item:', editItem);
    console.log('Edit used stock:', editUsedStock);
    console.log('Edit status:', editStatus);
    
    // Additional validation before saving
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
      const db = (await import('@/services/databaseService')).DatabaseService;
      
      // Calculate the new total used stock (current used stock + new usage)
      const currentUsedStock = editItem.usedStock || 0;
      const newTotalUsedStock = currentUsedStock + editUsedStock;
      
      console.log('Current used stock:', currentUsedStock);
      console.log('New total used stock:', newTotalUsedStock);
      
      // Record the stock change in history before updating
      if (editUsedStock > 0) {
        console.log('Adding stock history record...');
        await db.addStockHistoryRecord({
          product_id: editItem.id,
          stock_change: editUsedStock,
          stock_type: 'used',
          current_stock_before: editItem.currentStock - currentUsedStock,
          current_stock_after: editItem.currentStock - newTotalUsedStock,
          update_date: new Date().toISOString().split('T')[0],
          description: `Stock usage: ${editUsedStock} units used`
        });
        console.log('Stock history record added successfully');
      }
      
      // Update product stock fields in backend (use updateGeneralStock)
      console.log('Updating general stock...');
      const updateData = {
        used_stock: newTotalUsedStock,
        stock_status: editStatus,
        last_update: new Date().toISOString().slice(0, 19).replace('T', ' ')
      };
      console.log('Update data:', updateData);
      
      await db.updateGeneralStock(editItem.id, updateData);
      console.log('General stock updated successfully');
      
      toast({
        title: "Success",
        description: "Stock updated successfully",
        variant: "default"
      });
      
      // Close popup
      console.log('Closing edit popup...');
      closeEditPopup();
      
      // Refresh data
      console.log('Refreshing data...');
      await handleGlobalRefresh();
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
        'Purchase Date': formatDateDDMMYYYY(item.purchaseDate).replace('/', '-').replace('/', '-'),
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
                        onClick={() => handleViewClick(item)}
                        className="action-btn-lead action-btn-view h-8 w-8 sm:h-9 sm:w-9 p-0"
                        title="View Stock History"
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

      {/* New Glass Morphism View Modal - Mirrored from Grocery Accounts */}
      {viewModalOpen && viewProduct && (
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
                  <div className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full object-cover border-2 sm:border-4 border-white shadow-lg overflow-hidden bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                    <Package className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1">
                    <div className={`border-2 border-white shadow-sm text-xs px-2 py-1 rounded-full ${
                      getStockStatus(viewProduct) === 'in-stock' ? 'bg-green-100 text-green-800' :
                      getStockStatus(viewProduct) === 'low-stock' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {getStockStatus(viewProduct).replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-1 sm:gap-2 truncate">
                    <Package className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-blue-600 flex-shrink-0" />
                    <span className="truncate">{viewProduct.productName}</span>
                  </h2>
                  <div className="text-xs sm:text-sm md:text-lg lg:text-xl mt-1 flex items-center gap-2">
                    <span className="text-gray-600">Product ID:</span>
                    <span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg border border-green-200">
                      {viewProduct.gpId || viewProduct.id}
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
                          <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 truncate">{viewProduct.productName}</p>
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
                          <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 truncate">{viewProduct.category}</p>
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
                          <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">{viewProduct.supplier || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-orange-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-orange-100">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <IndianRupee className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-orange-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium text-orange-600 uppercase tracking-wide">Unit Price</div>
                          <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">₹{viewProduct.price || 0}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-indigo-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-indigo-100">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Package2 className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-indigo-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium text-indigo-600 uppercase tracking-wide">Unit</div>
                          <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">{viewProduct.unit}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-red-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-red-100">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-red-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium text-red-600 uppercase tracking-wide">Purchase Date</div>
                          <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">{formatDateDDMMYYYY(viewProduct.purchaseDate)}</p>
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
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                    
                    <div className="bg-gradient-to-br from-blue-50 to-white p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl border border-blue-100 text-center">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Warehouse className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-blue-600" />
                      </div>
                      <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-blue-600">
                        {viewProduct.currentStock || 0}
                      </div>
                      <div className="text-xs sm:text-sm font-medium text-blue-600 uppercase tracking-wide">Total Stock</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-red-50 to-white p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl border border-red-100 text-center">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-red-600" />
                      </div>
                      <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-red-600">
                        {viewProduct.usedStock || 0}
                      </div>
                      <div className="text-xs sm:text-sm font-medium text-red-600 uppercase tracking-wide">Used Stock</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-50 to-white p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl border border-green-100 text-center col-span-2 md:col-span-1">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-green-600" />
                      </div>
                      <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-green-600">
                        {(viewProduct.currentStock || 0) - (viewProduct.usedStock || 0)}
                      </div>
                      <div className="text-xs sm:text-sm font-medium text-green-600 uppercase tracking-wide">Available Stock</div>
                    </div>
                    
                  </div>
                </div>

                {/* Stock History Section */}
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
                          <TableHead className="text-center font-semibold text-gray-700">Change</TableHead>
                          <TableHead className="text-center font-semibold text-gray-700">Type</TableHead>
                          <TableHead className="text-center font-semibold text-gray-700">Stock After</TableHead>
                          <TableHead className="text-center font-semibold text-gray-700">Description</TableHead>
                          <TableHead className="text-center font-semibold text-gray-700">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {viewStockHistory.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                              <div className="flex flex-col items-center gap-3">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                  <History className="h-8 w-8 text-gray-400" />
                                </div>
                                <div className="text-center">
                                  <p className="text-lg font-medium text-gray-500">No stock movement records found</p>
                                  <p className="text-sm text-gray-400 mt-1">Stock history will appear here</p>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          viewStockHistory.map((entry, idx) => {
                            const formattedDate = (() => {
                              const date = new Date(entry.update_date);
                              if (isNaN(date.getTime())) return entry.update_date;
                              const day = String(date.getDate()).padStart(2, '0');
                              const month = String(date.getMonth() + 1).padStart(2, '0');
                              const year = date.getFullYear();
                              return `${day}/${month}/${year}`;
                            })();
                            
                            return (
                              <TableRow key={entry.id || idx} className="hover:bg-gray-50/50 transition-colors">
                                <TableCell className="text-center font-medium">{idx + 1}</TableCell>
                                <TableCell className="text-center">{formattedDate}</TableCell>
                                <TableCell className="text-center">
                                  <span className={entry.stock_type === 'used' ? 'text-red-600' : 'text-green-600'}>
                                    {entry.stock_type === 'used' ? '-' : '+'}{entry.stock_change}
                                  </span>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge variant={entry.stock_type === 'used' ? 'destructive' : 'default'} className="capitalize">
                                    {entry.stock_type}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center font-bold text-blue-600">
                                  {entry.current_stock_after}
                                </TableCell>
                                <TableCell className="text-center">{entry.description || '-'}</TableCell>
                                <TableCell className="text-center">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteStockHistory(entry)}
                                    className="action-btn-lead action-btn-delete h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
                                    title="Delete Stock History Record"
                                    disabled={submitting}
                                  >
                                    <Trash2 className="h-3 w-3" />
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
            </div>
          </div>
        </div>
      )}

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
                    <p className="font-semibold text-gray-900">{formatDateDDMMYYYY(viewItem.purchaseDate)}</p>
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
        <DialogContent className="crm-modal-container">
          <DialogHeader className="editpopup form dialog-header">
            <div className="editpopup form icon-title-container">
              <div className="editpopup form dialog-icon">
                <Package className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div className="editpopup form title-description">
                <DialogTitle className="editpopup form dialog-title">
                  Edit Stock
                </DialogTitle>
                <DialogDescription className="editpopup form dialog-description">
                  Update stock information and status
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
                  <div className="text-sm font-medium text-blue-900">{editItem.productName}</div>
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
                    <div className="text-lg font-bold text-blue-600">{editItem.currentStock}</div>
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
              
              {/* Used Stock Input */}
              <div className="editpopup form crm-edit-form-group">
                <Label className="editpopup form crm-edit-form-label flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Used Stock
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
                  <div className="text-lg font-bold text-yellow-700">{editBalance} {editItem?.unit || 'units'}</div>
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
              <DialogFooter className="editpopup form dialog-footer flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={closeEditPopup}
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
                      <div className="animate-spin h-3 w-3 sm:h-4 sm:w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
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
                  Delete Stock Item
                </DialogTitle>
                <DialogDescription className="editpopup form dialog-description">
                  Are you sure you want to delete this stock item? This action cannot be undone.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          {itemToDelete && (
            <div className="mx-4 my-4 p-4 bg-gray-50 rounded-lg border">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-500" />
                  <span className="font-medium text-gray-900">{itemToDelete.productName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">{itemToDelete.category}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">{itemToDelete.gpId}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Warehouse className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">{itemToDelete.currentStock} {itemToDelete.unit}</span>
                </div>
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">₹{itemToDelete.price}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600 capitalize">{itemToDelete.status}</span>
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
                setItemToDelete(null);
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
                  <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Delete Item
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Stock History Confirmation Dialog */}
      <Dialog open={showDeleteHistoryConfirm} onOpenChange={setShowDeleteHistoryConfirm}>
        <DialogContent className="crm-modal-container">
          <DialogHeader className="editpopup form dialog-header">
            <div className="editpopup form icon-title-container">
              <div className="editpopup form dialog-icon">
                <Trash2 className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
              </div>
              <div className="editpopup form title-description">
                <DialogTitle className="editpopup form dialog-title text-red-700">
                  Delete Stock History Record
                </DialogTitle>
                <DialogDescription className="editpopup form dialog-description">
                  Are you sure you want to delete this stock movement record? This action cannot be undone.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          {historyToDelete && (
            <div className="mx-4 my-4 p-4 bg-gray-50 rounded-lg border">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="font-medium text-gray-900">
                    {(() => {
                      const date = new Date(historyToDelete.update_date);
                      if (isNaN(date.getTime())) return historyToDelete.update_date;
                      const day = String(date.getDate()).padStart(2, '0');
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const year = date.getFullYear();
                      return `${day}/${month}/${year}`;
                    })()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600 capitalize">{historyToDelete.stock_type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">
                    {historyToDelete.stock_type === 'used' ? '-' : '+'}{historyToDelete.stock_change} units
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">{historyToDelete.description || 'No description'}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="editpopup form dialog-footer flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setShowDeleteHistoryConfirm(false);
                setHistoryToDelete(null);
              }}
              disabled={submitting}
              className="editpopup form footer-button-cancel w-full sm:w-auto modern-btn modern-btn-secondary"
            >
              <X className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={confirmDeleteStockHistory}
              disabled={submitting}
              className="editpopup form footer-button-delete w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
            >
              {submitting ? (
                <>
                  <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
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

export default GeneralStock;
