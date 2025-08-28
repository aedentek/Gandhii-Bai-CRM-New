import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ActionButtons } from '@/components/ui/HeaderActionButtons';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit2, Trash2, Package, RefreshCw, AlertTriangle, TrendingUp, TrendingDown, Calendar, Download, Eye, BarChart3, History, X, User, Building, ShoppingCart, Clock, Tag, Warehouse, Package2, IndianRupee, ShoppingBasket, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import MonthYearPickerDialog from '@/components/shared/MonthYearPickerDialog';
import usePageTitle from '@/hooks/usePageTitle';
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
  // Set custom page title
  usePageTitle('Grocery Stock Management');

const [products, setProducts] = useState<GroceryStockItem[]>([]);
const [groceryCategories, setGroceryCategories] = useState<any[]>([]);
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
        status: (() => {
          const currentStock = prod.current_stock || prod.quantity || 0;
          const usedStock = prod.used_stock || 0;
          const available = currentStock - usedStock;
          if (available <= 0) return 'out-of-stock';
          if (available <= 10) return 'low-stock';
          return 'in-stock';
        })() as 'in-stock' | 'low-stock' | 'out-of-stock'
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
  
  // Edit state variables (like General Stock Management)
  const [editUsedStock, setEditUsedStock] = useState(0);
  const [editStatus, setEditStatus] = useState<'in-stock' | 'low-stock' | 'out-of-stock'>('in-stock');
  const [editBalance, setEditBalance] = useState(0);
  
  // New glass morphism view modal states (from General Stock Management)
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewProduct, setViewProduct] = useState<GroceryStockItem | null>(null);
  const [viewStockHistory, setViewStockHistory] = useState<any[]>([]);
  const [showDeleteHistoryConfirm, setShowDeleteHistoryConfirm] = useState(false);
  const [historyToDelete, setHistoryToDelete] = useState<any>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
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
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-based like General Categories
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [showMonthYearDialog, setShowMonthYearDialog] = useState(false);
  const [filterMonth, setFilterMonth] = useState<number | null>(new Date().getMonth() + 1); // Also 1-based
  const [filterYear, setFilterYear] = useState<number | null>(currentYear);

  const { toast } = useToast();
  
  // Helper function to format date as DD/MM/YYYY (from General Stock Management)
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
        status: (() => {
          const currentStock = prod.current_stock || prod.quantity || 0;
          const usedStock = prod.used_stock || 0;
          const available = currentStock - usedStock;
          if (available <= 0) return 'out-of-stock';
          if (available <= 10) return 'low-stock';
          return 'in-stock';
        })() as 'in-stock' | 'low-stock' | 'out-of-stock'
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
    setEditUsedStock(0); // Always reset to 0 for new entry (like General Stock Management)
    setEditStatus(stock.status);
    setEditBalance(stock.currentStock - stock.usedStock);
    setIsAddingStock(true);
  };

  // Helper function to get available balance (like General Stock Management)
  const getAvailableBalance = (item: GroceryStockItem): number => {
    return item.currentStock - item.usedStock;
  };

  // Update edit balance when used stock changes (like General Stock Management)
  React.useEffect(() => {
    if (editingStock) {
      // Show the remaining balance after deducting the new used stock
      const availableBalance = editingStock.currentStock - editingStock.usedStock;
      setEditBalance(availableBalance - editUsedStock);
    }
  }, [editUsedStock, editingStock]);

  // Close edit popup function
  const closeEditPopup = () => {
    setIsAddingStock(false);
    setEditingStock(null);
    setEditUsedStock(0);
    setEditStatus('in-stock');
    setEditBalance(0);
    setFormData({
      productName: '',
      category: '',
      currentStock: 0,
      usedStock: 0,
      unit: 'pcs',
      supplier: '',
      price: 0,
    });
  };

  const handleViewStock = (stock: GroceryStockItem) => {
    setViewingStock(stock);
    setShowViewDialog(true);
  };

  // New glass morphism view function (mirroring General Stock Management)
  const handleViewClick = async (product: GroceryStockItem) => {
    try {
      console.log('Opening view modal for product:', product);
      console.log('Product properties:', {
        id: product.id,
        productName: product.productName,
        category: product.category,
        currentStock: product.currentStock,
        usedStock: product.usedStock,
        unit: product.unit,
        supplier: product.supplier,
        price: product.price,
        grId: product.grId
      });
      
      // Set the product first
      setViewProduct(product);
      setViewModalOpen(true);
      setLoadingHistory(true);
      
      // Then load history
      const history = await getStockHistory(product.id);
      console.log('Loaded stock history:', history);
      setViewStockHistory(history);
      setLoadingHistory(false);
      
    } catch (error) {
      console.error('Error loading stock history:', error);
      setLoadingHistory(false);
      toast({
        title: "Error",
        description: "Failed to load product details",
        variant: "destructive"
      });
    }
  };

  // Calculate total used stock from history - SUM ALL STOCK AFTER VALUES
  const calculateTotalUsedStock = (history: any[], currentUsedStock: number) => {
    console.log('🔍 DEBUGGING USED STOCK CALCULATION');
    console.log('History received:', history);
    console.log('Current used stock:', currentUsedStock);
    
    if (!history || history.length === 0) {
      console.log('❌ No history found, returning current used stock:', currentUsedStock);
      return currentUsedStock;
    }
    
    // Get all Stock After values and sum them up
    const stockAfterValues = history
      .filter(entry => entry.stock_after !== undefined && entry.stock_after !== null)
      .map(entry => Number(entry.stock_after));
    
    console.log('📊 Stock After values extracted:', stockAfterValues);
    
    if (stockAfterValues.length === 0) {
      console.log('❌ No valid stock_after values found, returning current used stock:', currentUsedStock);
      return currentUsedStock;
    }
    
    // Sum all Stock After values to get total used stock
    const totalUsedStock = stockAfterValues.reduce((sum, value) => {
      console.log(`➕ Adding ${value} to sum (current sum: ${sum})`);
      return sum + value;
    }, 0);
    
    console.log('✅ Final calculated total used stock:', totalUsedStock);
    console.log('🔍 END DEBUGGING');
    
    // Return the sum of all Stock After values
    return totalUsedStock;
  };

  // Handle delete stock history record (from General Stock Management)
  const handleDeleteStockHistory = (historyRecord: any) => {
    setHistoryToDelete(historyRecord);
    setShowDeleteHistoryConfirm(true);
  };

  // Confirm delete stock history record (from General Stock Management)
  const confirmDeleteStockHistory = async () => {
    if (!historyToDelete || !viewProduct) return;
    
    try {
      const db = (await import('@/services/databaseService')).DatabaseService;
      
      // First, calculate the stock adjustment needed
      const stockChange = historyToDelete.stock_change || 0;
      const stockType = historyToDelete.stock_type;
      
      // Delete the history record from database
      await db.deleteGroceryStockHistoryRecord(historyToDelete.id);
      
      // Adjust the product's stock values based on the deleted record
      if (stockType === 'used' && stockChange > 0) {
        // If we're deleting a "used" record, we need to reduce the used_stock
        // This effectively adds back the stock to available
        const allProducts = await db.getAllGroceryProducts();
        const currentProduct = allProducts.find((p: any) => p.id.toString() === viewProduct.id.toString());
        
        if (currentProduct) {
          const currentUsedStock = currentProduct.used_stock || 0;
          const newUsedStock = Math.max(0, currentUsedStock - stockChange);
          
          await db.updateGroceryStock(viewProduct.id, {
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
        const allProducts = await db.getAllGroceryProducts();
        const currentProduct = allProducts.find((p: any) => p.id.toString() === viewProduct.id.toString());
        
        if (currentProduct) {
          const currentStock = currentProduct.current_stock || 0;
          const newCurrentStock = Math.max(0, currentStock - stockChange);
          
          await db.updateGroceryStock(viewProduct.id, {
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
      
    } catch (error) {
      console.error('Error deleting stock history:', error);
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

  // Function to get stock history for a product (from General Stock Management)
  const getStockHistory = async (productId: string) => {
    try {
      console.log('Fetching stock history for product ID:', productId);
      const db = (await import('@/services/databaseService')).DatabaseService;
      const history = await db.getGroceryStockHistory(productId);
      console.log('Received history data:', history);
      return history || [];
    } catch (error) {
      console.error('Error fetching stock history:', error);
      toast({
        title: "Warning",
        description: "Could not load stock history",
        variant: "destructive"
      });
      return [];
    }
  };

  // Function to get stock status (from General Stock Management)
  const getStockStatus = (product: GroceryStockItem): string => {
    const available = (product.currentStock || 0) - (product.usedStock || 0);
    if (available <= 0) return 'out-of-stock';
    if (available <= 10) return 'low-stock';
    return 'in-stock';
  };

  // Close view modal and reset states
  const closeViewModal = () => {
    setViewModalOpen(false);
    setViewProduct(null);
    setViewStockHistory([]);
    setLoadingHistory(false);
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
      setSubmitting(true);
      const db = (await import('@/services/databaseService')).DatabaseService;
      
      if (editingStock) {
        // Get the original stock values before update
        const originalStock = editingStock.currentStock;
        const originalUsedStock = editingStock.usedStock;
        
        // Use updateGroceryStock for better consistency with General Stock Management
        await db.updateGroceryStock(editingStock.id, {
          name: formData.productName,
          category: formData.category,
          current_stock: formData.currentStock,
          used_stock: formData.usedStock,
          unit: formData.unit,
          supplier: formData.supplier,
          price: formData.price,
          last_update: new Date().toISOString().slice(0, 19).replace('T', ' ')
        });
        
        // Create stock history records for the changes
        const currentStockChange = formData.currentStock - originalStock;
        const usedStockChange = formData.usedStock - originalUsedStock;
        
        if (currentStockChange !== 0) {
          await db.addGroceryStockHistoryRecord({
            product_id: editingStock.id,
            stock_change: Math.abs(currentStockChange),
            stock_type: currentStockChange > 0 ? 'added' : 'adjusted',
            current_stock_before: originalStock,
            current_stock_after: formData.currentStock,
            update_date: new Date().toISOString().slice(0, 19).replace('T', ' '),
            description: `Stock ${currentStockChange > 0 ? 'added' : 'reduced'} - Manual Update`
          });
        }
        
        if (usedStockChange !== 0) {
          await db.addGroceryStockHistoryRecord({
            product_id: editingStock.id,
            stock_change: Math.abs(usedStockChange),
            stock_type: 'used',
            current_stock_before: originalUsedStock,
            current_stock_after: formData.usedStock,
            update_date: new Date().toISOString().slice(0, 19).replace('T', ' '),
            description: `Used stock ${usedStockChange > 0 ? 'increased' : 'decreased'} - Manual Update`
          });
        }
        
        toast({ 
          title: "Success", 
          description: "Stock updated successfully with history record",
          variant: "default"
        });
      } else {
        // Add new product
        const newProduct = await db.addGroceryProduct({
          name: formData.productName,
          category: formData.category,
          current_stock: formData.currentStock,
          used_stock: formData.usedStock,
          unit: formData.unit,
          supplier: formData.supplier,
          price: formData.price,
          purchase_date: new Date().toISOString().slice(0, 10),
          created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
        });
        
        // Create initial stock history record for new product
        if (formData.currentStock > 0) {
          await db.addGroceryStockHistoryRecord({
            product_id: newProduct.id || newProduct.insertId,
            stock_change: formData.currentStock,
            stock_type: 'added',
            current_stock_before: 0,
            current_stock_after: formData.currentStock,
            update_date: new Date().toISOString().slice(0, 19).replace('T', ' '),
            description: 'Initial stock - Product Created'
          });
        }
        
        if (formData.usedStock > 0) {
          await db.addGroceryStockHistoryRecord({
            product_id: newProduct.id || newProduct.insertId,
            stock_change: formData.usedStock,
            stock_type: 'used',
            current_stock_before: 0,
            current_stock_after: formData.usedStock,
            update_date: new Date().toISOString().slice(0, 19).replace('T', ' '),
            description: 'Initial used stock - Product Created'
          });
        }
        
        toast({ 
          title: "Success", 
          description: "Stock added successfully with history record",
          variant: "default"
        });
      }
      
      // Refresh the data
      await handleGlobalRefresh();
      
      // Reset form
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
    } catch (error) {
      console.error(`Error ${editingStock ? 'updating' : 'adding'} stock:`, error);
      toast({ 
        title: "Error", 
        description: `Failed to ${editingStock ? 'update' : 'add'} stock. Please try again.`, 
        variant: "destructive" 
      });
    } finally {
      setSubmitting(false);
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
        d.getMonth() === (filterMonth - 1) && // Convert 1-based filterMonth to 0-based for comparison
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
                <Package className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Grocery Stock</h1>
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
                text={months[selectedMonth - 1]} // Mirror General Categories: 1-based month to 0-based array
              />
              
              <Button 
                onClick={handleExportCSV}
                className="global-btn flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
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
                className="global-btn flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Add Stock</span>
                <span className="sm:hidden">+</span>
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
                    <TrendingUp className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Available</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-green">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
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
                    <span className="truncate">Running Low</span>
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
                    <AlertTriangle className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Not Available</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-red">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
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
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-900 mb-1">{totalProducts}</p>
                  <div className="flex items-center text-xs text-blue-600">
                    <Package className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">All Products</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-blue">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
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
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{formatDateDDMMYYYY(product.lastUpdate)}</TableCell>
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
                      <div className="action-buttons-container">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleViewClick(product)}
                          className="action-btn-lead action-btn-view h-8 w-8 sm:h-9 sm:w-9 p-0"
                          title="View Details with Glass Morphism"
                        >
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleEditStock(product)}
                          className="action-btn-lead action-btn-edit h-8 w-8 sm:h-9 sm:w-9 p-0"
                          title="Edit Stock"
                        >
                          <Edit2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleDeleteStock(product)}
                          className="action-btn-lead action-btn-delete h-8 w-8 sm:h-9 sm:w-9 p-0"
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

        {/* Add/Edit Stock Dialog - Exact General Stock Management Design */}
        <Dialog open={isAddingStock} onOpenChange={setIsAddingStock}>
          <DialogContent className="crm-modal-container">
            <DialogHeader className="editpopup form dialog-header">
              <div className="editpopup form icon-title-container">
                <div className="editpopup form dialog-icon">
                  <Package className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
                <div className="editpopup form title-description">
                  <DialogTitle className="editpopup form dialog-title">
                    {editingStock ? 'Edit Stock' : 'Add New Stock'}
                  </DialogTitle>
                  <DialogDescription className="editpopup form dialog-description">
                    {editingStock ? 'Update stock information and status' : 'Enter the details for the new stock item'}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            {editingStock ? (
              // Edit Mode - Exact General Stock Management Design
              <div className="editpopup form crm-edit-form-content">
                {/* Product Info */}
                <div className="editpopup form crm-edit-form-group">
                  <Label className="editpopup form crm-edit-form-label flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Product
                  </Label>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="text-sm font-medium text-blue-900">{editingStock.productName}</div>
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
                      <div className="text-lg font-bold text-blue-600">{editingStock.currentStock}</div>
                    </div>
                  </div>
                  
                  {/* Available Balance */}
                  <div className="editpopup form crm-edit-form-group">
                    <Label className="editpopup form crm-edit-form-label flex items-center gap-2">
                      <Package2 className="h-4 w-4" />
                      Available Balance
                    </Label>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="text-lg font-bold text-green-600">{getAvailableBalance(editingStock)}</div>
                    </div>
                  </div>
                </div>
                
                {/* Used Stock Input */}
                <div className="editpopup form crm-edit-form-group">
                  <Label className="editpopup form crm-edit-form-label flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Additional Used Stock
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={getAvailableBalance(editingStock)}
                    value={editUsedStock}
                    onChange={e => {
                      let val = Number(e.target.value);
                      const availableBalance = getAvailableBalance(editingStock);
                      
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
                    Maximum available: {getAvailableBalance(editingStock)} units
                  </div>
                  <div className="text-xs text-blue-600">
                    Enter additional stock to mark as used (will be added to current used stock: {editingStock.usedStock})
                  </div>
                  {editUsedStock > getAvailableBalance(editingStock) && (
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
                    <div className="text-lg font-bold text-yellow-700">{editBalance} {editingStock?.unit || 'units'}</div>
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
                    onClick={async () => {
                      // General Stock Management edit logic - EXACT IMPLEMENTATION
                      if (!editingStock) return closeEditPopup();
                      
                      console.log('Edit item:', editingStock);
                      console.log('Edit used stock:', editUsedStock);
                      console.log('Edit status:', editStatus);
                      
                      // Additional validation before saving (like General Stock Management)
                      const availableBalance = getAvailableBalance(editingStock);
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
                        
                        // Calculate the new total used stock (current used stock + new usage) - LIKE GENERAL STOCK
                        const currentUsedStock = editingStock.usedStock || 0;
                        const newTotalUsedStock = currentUsedStock + editUsedStock;
                        
                        console.log('Current used stock:', currentUsedStock);
                        console.log('New total used stock:', newTotalUsedStock);
                        
                        // Record the stock change in history before updating (ONLY if editUsedStock > 0)
                        if (editUsedStock > 0) {
                          console.log('Adding stock history record...');
                          await db.addGroceryStockHistoryRecord({
                            product_id: editingStock.id,
                            stock_change: editUsedStock,
                            stock_type: 'used',
                            current_stock_before: editingStock.currentStock - currentUsedStock,
                            current_stock_after: editingStock.currentStock - newTotalUsedStock,
                            update_date: new Date().toISOString().split('T')[0],
                            description: `Stock usage: ${editUsedStock} units used`
                          });
                          console.log('Stock history record added successfully');
                        }
                        
                        // Update product stock fields in backend (use updateGroceryStock)
                        console.log('Updating grocery stock...');
                        const updateData = {
                          used_stock: newTotalUsedStock,
                          stock_status: editStatus,
                          last_update: new Date().toISOString().slice(0, 19).replace('T', ' ')
                        };
                        console.log('Update data:', updateData);
                        
                        await db.updateGroceryStock(editingStock.id, updateData);
                        console.log('Grocery stock updated successfully');
                        
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
                    }}
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
            ) : (
              // Add Mode - Keep original form for adding new items
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleSubmit();
                }}
                className="editpopup form crm-edit-form-content"
              >
                <div className="editpopup form crm-edit-form-group">
                  <Label htmlFor="productName" className="editpopup form crm-edit-form-label flex items-center gap-2">
                    <ShoppingBasket className="h-4 w-4" />
                    Product Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="productName"
                    value={formData.productName}
                    onChange={(e) => setFormData({...formData, productName: e.target.value})}
                    placeholder="Enter product name"
                    className="editpopup form crm-edit-form-input"
                    required
                  />
                </div>
                
                <div className="editpopup form crm-edit-form-grid grid-cols-1 md:grid-cols-2">
                  <div className="editpopup form crm-edit-form-group">
                    <Label htmlFor="category" className="editpopup form crm-edit-form-label flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Category
                    </Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                      <SelectTrigger className="editpopup form crm-edit-form-select">
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
                  <div className="editpopup form crm-edit-form-group">
                    <Label htmlFor="unit" className="editpopup form crm-edit-form-label flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Unit
                    </Label>
                    <Select value={formData.unit} onValueChange={(value) => setFormData({...formData, unit: value})}>
                      <SelectTrigger className="editpopup form crm-edit-form-select">
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
                </div>
                
                <div className="editpopup form crm-edit-form-grid grid-cols-2">
                  <div className="editpopup form crm-edit-form-group">
                    <Label htmlFor="currentStock" className="editpopup form crm-edit-form-label flex items-center gap-2">
                      <Warehouse className="h-4 w-4" />
                      Current Stock
                    </Label>
                    <Input
                      id="currentStock"
                      type="number"
                      min="0"
                      value={formData.currentStock}
                      onChange={(e) => setFormData({...formData, currentStock: parseInt(e.target.value) || 0})}
                      placeholder="Enter current stock"
                      className="editpopup form crm-edit-form-input text-center"
                      required
                    />
                  </div>
                  
                  <div className="editpopup form crm-edit-form-group">
                    <Label htmlFor="usedStock" className="editpopup form crm-edit-form-label flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Used Stock
                    </Label>
                    <Input
                      id="usedStock"
                      type="number"
                      min="0"
                      max={formData.currentStock}
                      value={formData.usedStock}
                      onChange={(e) => {
                        let val = parseInt(e.target.value) || 0;
                        if (val < 0) val = 0;
                        if (val > formData.currentStock) val = formData.currentStock;
                        setFormData({...formData, usedStock: val});
                      }}
                      placeholder="Enter used stock"
                      className="editpopup form crm-edit-form-input text-center"
                    />
                  </div>
                </div>
                
                <div className="editpopup form crm-edit-form-grid grid-cols-1 md:grid-cols-2">
                  <div className="editpopup form crm-edit-form-group">
                    <Label htmlFor="price" className="editpopup form crm-edit-form-label flex items-center gap-2">
                      <IndianRupee className="h-4 w-4" />
                      Price
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                      placeholder="Enter price"
                      className="editpopup form crm-edit-form-input text-center"
                    />
                  </div>
                  <div className="editpopup form crm-edit-form-group">
                    <Label htmlFor="supplier" className="editpopup form crm-edit-form-label flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Supplier
                    </Label>
                    <Input
                      id="supplier"
                      value={formData.supplier}
                      onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                      placeholder="Enter supplier name"
                      className="editpopup form crm-edit-form-input"
                    />
                  </div>
                </div>
                
                <DialogFooter className="editpopup form dialog-footer flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={closeEditPopup}
                    className="editpopup form footer-button-cancel w-full sm:w-auto modern-btn modern-btn-secondary"
                  >
                    <X className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="editpopup form footer-button-save w-full sm:w-auto global-btn"
                  >
                    <Package className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    Add Stock
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* View Stock Modal - Glass Morphism Design */}
        {showViewDialog && viewingStock && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowViewDialog(false)}
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
                    <div className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full object-cover border-2 sm:border-4 border-white shadow-lg overflow-hidden bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
                      <ShoppingBasket className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1">
                      <div className={`border-2 border-white shadow-sm text-xs px-2 py-1 rounded-full ${
                        viewingStock.status === 'in-stock' ? 'bg-green-100 text-green-800' :
                        viewingStock.status === 'low-stock' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {viewingStock.status === 'in-stock' ? 'In Stock' :
                         viewingStock.status === 'low-stock' ? 'Low Stock' :
                         'Out of Stock'}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-1 sm:gap-2 truncate">
                      <Package className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-blue-600 flex-shrink-0" />
                      <span className="truncate">{viewingStock.productName}</span>
                    </h2>
                    <div className="text-xs sm:text-sm md:text-lg lg:text-xl mt-1 flex items-center gap-2">
                      <span className="text-gray-600">Grocery ID:</span>
                      <span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg border border-green-200">
                        {viewingStock.grId}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowViewDialog(false)}
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
                        <ShoppingBasket className="h-3 w-3 sm:h-3 sm:w-3 md:h-4 md:w-4 text-blue-600" />
                      </div>
                      Product Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                      
                      <div className="bg-gradient-to-br from-blue-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-blue-100">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <ShoppingBasket className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-blue-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">Product Name</div>
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 truncate">{viewingStock.productName}</p>
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
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 truncate">{viewingStock.category}</p>
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
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">{viewingStock.supplier}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-orange-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-orange-100">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <IndianRupee className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-orange-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-orange-600 uppercase tracking-wide">Price per Unit</div>
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">₹{viewingStock.price}</p>
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
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">{viewingStock.unit}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-red-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-red-100">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-red-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-red-600 uppercase tracking-wide">Purchase Date</div>
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">
                              {formatDateDDMMYYYY(viewingStock.purchaseDate)}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-teal-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-teal-100 sm:col-span-2 lg:col-span-1">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Clock className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-teal-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-teal-600 uppercase tracking-wide">Last Update</div>
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">
                              {formatDateDDMMYYYY(viewingStock.lastUpdate)}
                            </p>
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
                        <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-blue-600">{viewingStock.currentStock || 0}</div>
                        <div className="text-xs sm:text-sm font-medium text-blue-600 uppercase tracking-wide">Current Stock</div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-red-50 to-white p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl border border-red-100 text-center">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                          <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-red-600" />
                        </div>
                        <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-red-600">{viewingStock.usedStock || 0}</div>
                        <div className="text-xs sm:text-sm font-medium text-red-600 uppercase tracking-wide">Used Stock</div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-green-50 to-white p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl border border-green-100 text-center">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Package2 className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-green-600" />
                        </div>
                        <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-green-600">{(viewingStock.currentStock || 0) - (viewingStock.usedStock || 0)}</div>
                        <div className="text-xs sm:text-sm font-medium text-green-600 uppercase tracking-wide">Available</div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-purple-50 to-white p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl border border-purple-100 text-center">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                          <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-purple-600" />
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full font-medium ${
                          viewingStock.status === 'in-stock' ? 'bg-green-100 text-green-800' :
                          viewingStock.status === 'low-stock' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {viewingStock.status === 'in-stock' ? 'In Stock' :
                           viewingStock.status === 'low-stock' ? 'Low Stock' :
                           'Out of Stock'}
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
                            <TableHead className="text-center font-semibold text-gray-700 min-w-[50px]">S NO</TableHead>
                            <TableHead className="text-center font-semibold text-gray-700 min-w-[80px]">Date</TableHead>
                            <TableHead className="text-center font-semibold text-gray-700 min-w-[90px]">Stock Change</TableHead>
                            <TableHead className="text-center font-semibold text-gray-700 min-w-[70px]">Type</TableHead>
                            <TableHead className="text-center font-semibold text-gray-700 min-w-[80px]">Stock After</TableHead>
                            <TableHead className="text-center font-semibold text-gray-700 min-w-[100px]">Description</TableHead>
                            <TableHead className="text-center font-semibold text-gray-700 min-w-[70px]">Action</TableHead>
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
                    Delete Stock
                  </DialogTitle>
                  <DialogDescription className="editpopup form dialog-description">
                    Are you sure you want to delete this stock? This action cannot be undone.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            {stockToDelete && (
              <div className="mx-4 my-4 p-4 bg-gray-50 rounded-lg border">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <ShoppingBasket className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-900">{stockToDelete.productName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">{stockToDelete.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">GR ID: {stockToDelete.grId}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">{stockToDelete.supplier}</span>
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
                  setStockToDelete(null);
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
                    Delete Stock
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* New Glass Morphism View Modal - Mirrored from General Stock Management */}
      {viewModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={closeViewModal}
        >
          {!viewProduct ? (
            <div className="bg-white rounded-xl p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Loading product details...</p>
            </div>
          ) : (
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
                    <ShoppingBasket className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 text-white" />
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
                    <ShoppingBasket className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-blue-600 flex-shrink-0" />
                    <span className="truncate">{viewProduct?.productName || 'Product Name'}</span>
                  </h2>
                  <div className="text-xs sm:text-sm md:text-lg lg:text-xl mt-1 flex items-center gap-2">
                    <span className="text-gray-600">Product ID:</span>
                    <span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg border border-green-200">
                      {viewProduct?.grId || viewProduct?.id || 'N/A'}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeViewModal}
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
                      <ShoppingBasket className="h-3 w-3 sm:h-3 sm:w-3 md:h-4 md:w-4 text-blue-600" />
                    </div>
                    Product Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                    
                    <div className="bg-gradient-to-br from-blue-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-blue-100">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <ShoppingBasket className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">Product Name</div>
                          <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 truncate">
                            {viewProduct?.productName || 'N/A'}
                          </p>
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
                          <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 truncate">
                            {viewProduct?.category || 'N/A'}
                          </p>
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
                          <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">
                            {viewProduct?.supplier || 'N/A'}
                          </p>
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
                          <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">
                            ₹{viewProduct?.price || 0}
                          </p>
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
                          <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">
                            {viewProduct?.unit || 'N/A'}
                          </p>
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
                          <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">
                            {formatDateDDMMYYYY(viewProduct?.purchaseDate)}
                          </p>
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
                        {viewProduct?.currentStock || 0}
                      </div>
                      <div className="text-xs sm:text-sm font-medium text-blue-600 uppercase tracking-wide">Total Stock</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-red-50 to-white p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl border border-red-100 text-center">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-red-600" />
                      </div>
                      <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-red-600">
                        {calculateTotalUsedStock(viewStockHistory, viewProduct?.usedStock || 0)}
                      </div>
                      <div className="text-xs sm:text-sm font-medium text-red-600 uppercase tracking-wide">Used Stock</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-50 to-white p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl border border-green-100 text-center col-span-2 md:col-span-1">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-green-600" />
                      </div>
                      <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-green-600">
                        {(viewProduct?.currentStock || 0) - (viewProduct?.usedStock || 0)}
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
                        {loadingHistory ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                              <div className="flex flex-col items-center gap-3">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                <p className="text-lg font-medium text-gray-500">Loading stock history...</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : viewStockHistory.length === 0 ? (
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
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    title="Delete this history record"
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
          )}
        </div>
      )}

      {/* Delete Stock History Confirmation Dialog */}
      <Dialog open={showDeleteHistoryConfirm} onOpenChange={setShowDeleteHistoryConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Stock History Record
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this stock history record? This action will also adjust the product's current stock values and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowDeleteHistoryConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteStockHistory}
            >
              Delete Record
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroceryStock;
