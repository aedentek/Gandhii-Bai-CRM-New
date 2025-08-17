import React, { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit2, Trash2, Pill, RefreshCw, Activity, TrendingUp, AlertTriangle, Calendar, Download, Eye, Package, BarChart3, History } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Medicine {
  id: string;
  name: string;
  category: string;
  manufacturer?: string;
  supplier: string;
  batch_number?: string;
  expiry_date?: string;
  purchase_date?: string;
  quantity: number;
  price: number;
  status: 'active' | 'inactive';
  description?: string;
  current_stock?: number;
  used_stock?: number;
  createdAt: string;
  created_at: string;
}

const MedicineManagement: React.FC = () => {
const [medicines, setMedicines] = useState<Medicine[]>([]);
const [loading, setLoading] = useState(true);
const [refreshKey, setRefreshKey] = useState(0);
const [categories, setCategories] = useState<Array<{id: number, name: string, status: string}>>([]);
const [suppliers, setSuppliers] = useState<Array<{id: number, name: string, status: string}>>([]);

React.useEffect(() => {
  (async () => {
    if (refreshKey > 0) console.log('Refreshing data...');
    try {
      const db = (await import('@/services/databaseService')).DatabaseService;
      
      // Fetch medicines, categories, and suppliers in parallel
      const [medicinesData, categoriesData, suppliersData] = await Promise.all([
        db.getAllMedicineProducts(),
        db.getAllMedicineCategories(),
        db.getAllMedicineSuppliers()
      ]);
      
      // Set medicines
      setMedicines(medicinesData.map((medicine: any) => ({
        ...medicine,
        id: medicine.id.toString(),
        createdAt: medicine.created_at || medicine.createdAt || '',
        price: medicine.price || 0,
        quantity: medicine.quantity || 0,
        current_stock: medicine.current_stock || medicine.quantity || 0,
        used_stock: medicine.used_stock || 0,
      })));
      
      // Set active categories and suppliers only
      setCategories(categoriesData.filter((cat: any) => cat.status === 'active'));
      setSuppliers(suppliersData.filter((sup: any) => sup.status === 'active'));
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

  const [isAddingMedicine, setIsAddingMedicine] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [medicineToDelete, setMedicineToDelete] = useState<Medicine | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [viewingMedicine, setViewingMedicine] = useState<Medicine | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    manufacturer: '',
    supplier: '',
    batch_number: '',
    expiry_date: '',
    quantity: 0,
    price: 0,
    status: 'active',
    description: '',
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
      const currentStatusFilter = statusFilter;
      const currentCategoryFilter = categoryFilter;
      
      const db = (await import('@/services/databaseService')).DatabaseService;
      const freshData = await db.getAllMedicineProducts();
      
      setMedicines(freshData.map((medicine: any) => ({
        ...medicine,
        id: medicine.id.toString(),
        createdAt: medicine.created_at || medicine.createdAt || '',
        price: medicine.price || 0,
        quantity: medicine.quantity || 0,
        current_stock: medicine.current_stock || medicine.quantity || 0,
        used_stock: medicine.used_stock || 0,
      })));
      
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

  // Helper functions for display consistency
  const getDisplayCategoryName = (category: string): string => {
    if (!category) return 'No Category';
    
    // Use dynamic categories from database instead of static ones
    const categoryNames = categories.map(c => c.name);
    
    // Try exact match first
    const exactMatch = categoryNames.find(c => c === category);
    if (exactMatch) return exactMatch;
    
    // Try case-insensitive match
    const caseMatch = categoryNames.find(c => 
      c.toLowerCase() === category.toLowerCase()
    );
    if (caseMatch) return caseMatch;
    
    // Try partial match
    const partialMatch = categoryNames.find(c => 
      c.toLowerCase().includes(category.toLowerCase()) || 
      category.toLowerCase().includes(c.toLowerCase())
    );
    if (partialMatch) return partialMatch;
    
    // Return original if no match found
    return category;
  };

  const getDisplaySupplierName = (supplier: string): string => {
    if (!supplier || supplier.trim() === '') return 'No Supplier';
    
    // Use dynamic suppliers from database instead of just returning the value
    const supplierNames = suppliers.map(s => s.name);
    
    // Try exact match first
    const exactMatch = supplierNames.find(s => s === supplier);
    if (exactMatch) return exactMatch;
    
    // Try case-insensitive match
    const caseMatch = supplierNames.find(s => 
      s.toLowerCase() === supplier.toLowerCase()
    );
    if (caseMatch) return caseMatch;
    
    // Try partial match
    const partialMatch = supplierNames.find(s => 
      s.toLowerCase().includes(supplier.toLowerCase()) || 
      supplier.toLowerCase().includes(s.toLowerCase())
    );
    if (partialMatch) return partialMatch;
    
    // Return original if no match found
    return supplier;
  };

  const handleEditMedicine = async (medicine: Medicine) => {
    try {
      // Ensure data is loaded before proceeding
      if (categories.length === 0 || suppliers.length === 0) {
        toast({
          title: "Loading...",
          description: "Please wait for categories and suppliers to load",
          variant: "default",
        });
        return;
      }

      console.log('Editing medicine:', medicine);
      console.log('Available categories:', categories.map(c => c.name));
      console.log('Available suppliers:', suppliers.map(s => s.name));

      // Enhanced category matching for edit dialog using dynamic categories
      const availableCategories = categories.map(c => c.name);
      let selectedCategory = medicine.category || '';
      
      if (selectedCategory) {
        console.log('Original category:', selectedCategory);
        
        // Try to find exact match first
        const exactMatch = availableCategories.find(cat => cat === selectedCategory);
        
        if (!exactMatch) {
          // Try case-insensitive match
          const caseMatch = availableCategories.find(cat => 
            cat.toLowerCase() === selectedCategory.toLowerCase()
          );
          
          if (caseMatch) {
            selectedCategory = caseMatch;
          } else {
            // Try partial match
            const partialMatch = availableCategories.find(cat => 
              cat.toLowerCase().includes(selectedCategory.toLowerCase()) || 
              selectedCategory.toLowerCase().includes(cat.toLowerCase())
            );
            
            if (partialMatch) {
              selectedCategory = partialMatch;
            }
            // If no match found, keep original value
          }
        }
        console.log('Selected category:', selectedCategory);
      }

      // Enhanced supplier matching for edit dialog using dynamic suppliers
      const availableSuppliers = suppliers.map(s => s.name);
      let selectedSupplier = medicine.supplier || '';
      
      if (selectedSupplier) {
        console.log('Original supplier:', selectedSupplier);
        
        // Try to find exact match first
        const exactMatch = availableSuppliers.find(sup => sup === selectedSupplier);
        
        if (!exactMatch) {
          // Try case-insensitive match
          const caseMatch = availableSuppliers.find(sup => 
            sup.toLowerCase() === selectedSupplier.toLowerCase()
          );
          
          if (caseMatch) {
            selectedSupplier = caseMatch;
          } else {
            // Try partial match
            const partialMatch = availableSuppliers.find(sup => 
              sup.toLowerCase().includes(selectedSupplier.toLowerCase()) || 
              selectedSupplier.toLowerCase().includes(sup.toLowerCase())
            );
            
            if (partialMatch) {
              selectedSupplier = partialMatch;
            }
            // If no match found, keep original value
          }
        }
        console.log('Selected supplier:', selectedSupplier);
      }

      // Handle date field mapping and formatting
      const purchaseDate = medicine.purchase_date || medicine.createdAt || '';
      let expiryDate = medicine.expiry_date || '';
      
      // Format expiry date for HTML date input (YYYY-MM-DD)
      if (expiryDate) {
        try {
          // If it's already in YYYY-MM-DD format, keep it
          if (/^\d{4}-\d{2}-\d{2}$/.test(expiryDate)) {
            // Already in correct format
            console.log('Expiry date already in correct format:', expiryDate);
          } else {
            // Try to parse different date formats
            let dateObj = null;
            
            // Try DD/MM/YYYY format
            if (/^\d{2}\/\d{2}\/\d{4}$/.test(expiryDate)) {
              const parts = expiryDate.split('/');
              dateObj = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
            }
            // Try MM/DD/YYYY format
            else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(expiryDate)) {
              dateObj = new Date(expiryDate);
            }
            // Try other date formats
            else {
              dateObj = new Date(expiryDate);
            }
            
            if (dateObj && !isNaN(dateObj.getTime())) {
              // Convert to YYYY-MM-DD format for HTML date input
              expiryDate = dateObj.toISOString().split('T')[0];
              console.log('Converted expiry date to:', expiryDate);
            } else {
              console.log('Could not parse expiry date:', medicine.expiry_date);
              expiryDate = ''; // Reset if can't parse
            }
          }
        } catch (error) {
          console.error('Error parsing expiry date:', error);
          expiryDate = ''; // Reset on error
        }
      }
      
      console.log('Original expiry_date:', medicine.expiry_date);
      console.log('Formatted expiry_date:', expiryDate);

      const newFormData = {
        name: medicine.name || '',
        category: selectedCategory,
        manufacturer: medicine.manufacturer || '',
        supplier: selectedSupplier,
        batch_number: medicine.batch_number || '',
        expiry_date: expiryDate,
        quantity: medicine.quantity || 0,
        price: medicine.price || 0,
        status: medicine.status || 'active',
        description: medicine.description || '',
      };
      
      console.log('Setting form data:', newFormData);
      
      setEditingMedicine(medicine);
      setFormData(newFormData);
      setIsAddingMedicine(true);
      
    } catch (error) {
      console.error('Error preparing edit form:', error);
      toast({
        title: "Error",
        description: "Failed to load medicine data for editing",
        variant: "destructive",
      });
    }
  };

  const handleViewMedicine = (medicine: Medicine) => {
    setViewingMedicine(medicine);
    setShowViewDialog(true);
  };

  const handleDeleteMedicine = (medicine: Medicine) => {
    setMedicineToDelete(medicine);
    setShowDeleteDialog(true);
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      toast({
        title: "Error",
        description: "Please enter a medicine name",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const db = (await import('@/services/databaseService')).DatabaseService;
      
      if (editingMedicine) {
        await db.updateMedicineProduct(editingMedicine.id, {
          name: formData.name,
          category: formData.category,
          manufacturer: formData.manufacturer,
          supplier: formData.supplier,
          batch_number: formData.batch_number,
          expiry_date: formData.expiry_date,
          quantity: formData.quantity,
          price: formData.price,
          status: formData.status,
          description: formData.description,
        });
        toast({ title: "Success", description: "Medicine updated successfully" });
      } else {
        await db.addMedicineProduct({
          name: formData.name,
          category: formData.category,
          manufacturer: formData.manufacturer,
          supplier: formData.supplier,
          batch_number: formData.batch_number,
          expiry_date: formData.expiry_date,
          quantity: formData.quantity,
          price: formData.price,
          status: formData.status,
          description: formData.description,
        });
        toast({ title: "Success", description: "Medicine added successfully" });
      }
      
      handleRefresh();
      
      setFormData({
        name: '',
        category: '',
        manufacturer: '',
        supplier: '',
        batch_number: '',
        expiry_date: '',
        quantity: 0,
        price: 0,
        status: 'active',
        description: '',
      });
      setIsAddingMedicine(false);
      setEditingMedicine(null);
    } catch (e) {
      toast({ title: "Error", description: `Failed to ${editingMedicine ? 'update' : 'add'} medicine`, variant: "destructive" });
    }
  };

  const confirmDelete = async () => {
    if (!medicineToDelete) return;
    
    try {
      setSubmitting(true);
      const db = (await import('@/services/databaseService')).DatabaseService;
      await db.deleteMedicineProduct(medicineToDelete.id);
      
      handleRefresh();
      
      setShowDeleteDialog(false);
      setMedicineToDelete(null);
      toast({ 
        title: "Success", 
        description: "Medicine deleted successfully" 
      });
    } catch (e) {
      toast({ 
        title: "Error", 
        description: "Failed to delete medicine", 
        variant: "destructive" 
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Export CSV function
  const handleExportCSV = () => {
    try {
      const headers = ['S No', 'Date', 'Medicine Name', 'Category', 'Manufacturer', 'Supplier', 'Batch Number', 'Expiry Date', 'Quantity', 'Price', 'Status'];
      
      const csvData = filteredMedicines.map((medicine, index) => {
        const dateStr = medicine.createdAt;
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
          `"${medicine.name}"`,
          `"${getDisplayCategoryName(medicine.category)}"`,
          `"${medicine.manufacturer || ''}"`,
          `"${getDisplaySupplierName(medicine.supplier)}"`,
          `"${medicine.batch_number || ''}"`,
          medicine.expiry_date || '',
          medicine.quantity,
          `₹${medicine.price}`,
          medicine.status.charAt(0).toUpperCase() + medicine.status.slice(1),
        ];
      });

      // Calculate totals
      const totalQuantity = filteredMedicines.reduce((sum, medicine) => sum + (medicine.quantity || 0), 0);
      const totalValue = filteredMedicines.reduce((sum, medicine) => sum + (medicine.price || 0) * (medicine.quantity || 0), 0);
      
      // Add totals row
      const totalsRow = [
        '',
        '',
        'TOTALS',
        '',
        '',
        '',
        '',
        '',
        totalQuantity,
        `₹${totalValue.toFixed(2)}`,
        `${filteredMedicines.length} medicines`
      ];
      
      const csvContent = [headers, ...csvData, [], totalsRow]
        .map(row => Array.isArray(row) ? row.join(',') : row)
        .join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        let filename = `medicines-${dateStr}`;
        
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
          description: `CSV exported successfully! ${filteredMedicines.length} medicines exported.`
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

  // Filter medicines
  const filteredMedicines = medicines.filter(medicine => {
    const matchesSearch =
      medicine.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medicine.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medicine.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medicine.supplier?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter !== 'all') {
      matchesStatus = medicine.status === statusFilter;
    }
    
    let matchesCategory = true;
    if (categoryFilter !== 'all') {
      matchesCategory = medicine.category === categoryFilter;
    }
    
    if (filterMonth !== null && filterYear !== null) {
      const dateStr = medicine.createdAt;
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
        d.getMonth() === filterMonth &&
        d.getFullYear() === filterYear
      );
    }
    return matchesSearch && matchesStatus && matchesCategory;
  }).sort((a, b) => {
    const idA = parseInt(a.id) || 0;
    const idB = parseInt(b.id) || 0;
    return idA - idB;
  });

  // Pagination logic
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.ceil(filteredMedicines.length / pageSize);
  const paginatedMedicines = filteredMedicines.slice((page - 1) * pageSize, page * pageSize);

  const handlePrevPage = () => setPage((p) => Math.max(1, p - 1));
  const handleNextPage = () => setPage((p) => Math.min(totalPages, p + 1));
  React.useEffect(() => { setPage(1); }, [searchTerm, medicines.length]);

  // Calculate stats
  const totalMedicines = filteredMedicines.length;
  const activeMedicines = filteredMedicines.filter(m => m.status === 'active').length;
  const inactiveMedicines = filteredMedicines.filter(m => m.status === 'inactive').length;
  const lowStockMedicines = filteredMedicines.filter(m => m.quantity <= 10).length;

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 px-2 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header Section */}
        <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-2xl p-4 sm:p-6 shadow-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 bg-blue-100 rounded-xl">
                <Pill className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Medicine Management</h1>
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
                    name: '',
                    category: '',
                    manufacturer: '',
                    supplier: '',
                    batch_number: '',
                    expiry_date: '',
                    quantity: 0,
                    price: 0,
                    status: 'active',
                    description: '',
                  });
                  setIsAddingMedicine(true);
                }}
                className="modern-btn modern-btn-primary flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Add Medicine</span>
                <span className="sm:hidden">+</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6">
          <div className="modern-stat-card stat-card-blue">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Pill className="h-3 w-3 sm:h-5 sm:w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-lg sm:text-2xl font-bold text-gray-900">{totalMedicines}</div>
                <div className="text-xs text-gray-600">Total Medicines</div>
              </div>
            </div>
          </div>
          
          <div className="modern-stat-card stat-card-green">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Activity className="h-3 w-3 sm:h-5 sm:w-5 text-green-600" />
              </div>
              <div>
                <div className="text-lg sm:text-2xl font-bold text-gray-900">{activeMedicines}</div>
                <div className="text-xs text-gray-600">Active</div>
              </div>
            </div>
          </div>
          
          <div className="modern-stat-card stat-card-orange">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="h-3 w-3 sm:h-5 sm:w-5 text-orange-600" />
              </div>
              <div>
                <div className="text-lg sm:text-2xl font-bold text-gray-900">{lowStockMedicines}</div>
                <div className="text-xs text-gray-600">Low Stock</div>
              </div>
            </div>
          </div>
          
          <div className="modern-stat-card stat-card-red">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <TrendingUp className="h-3 w-3 sm:h-5 sm:w-5 text-gray-600" />
              </div>
              <div>
                <div className="text-lg sm:text-2xl font-bold text-gray-900">{inactiveMedicines}</div>
                <div className="text-xs text-gray-600">Inactive</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-xl p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by medicine name, category, manufacturer, or supplier..."
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
                    {categories.map(category => (
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
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
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
          description="Filter medicines by specific month and year"
          previewText="medicines"
        />

        {/* Medicines Table */}
        <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-xl shadow-sm overflow-hidden">
          <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gray-50/50">
            <div className="flex items-center text-base sm:text-lg font-semibold text-gray-900">
              <Pill className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              <span className="hidden sm:inline">Medicines List ({filteredMedicines.length})</span>
              <span className="sm:hidden">Medicines ({filteredMedicines.length})</span>
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
                    <span>
                      <span className="hidden sm:inline">Purchase Date *</span>
                      <span className="sm:hidden">Date *</span>
                    </span>
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">Medicine Name</TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <span>
                    <span className="hidden sm:inline">Category *</span>
                    <span className="sm:hidden">Cat *</span>
                  </span>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">Manufacturer</TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <span>
                    <span className="hidden sm:inline">Supplier *</span>
                    <span className="sm:hidden">Sup *</span>
                  </span>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">Quantity</TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">Price</TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">Status</TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedMedicines.map((medicine, idx) => (
                <TableRow key={medicine.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{(page - 1) * pageSize + idx + 1}</TableCell>
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{
                    (() => {
                      const dateStr = medicine.createdAt;
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
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 font-medium text-center text-xs sm:text-sm max-w-[200px] truncate">{medicine.name}</TableCell>
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{getDisplayCategoryName(medicine.category)}</TableCell>
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{medicine.manufacturer || '-'}</TableCell>
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{getDisplaySupplierName(medicine.supplier)}</TableCell>
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">
                    <span className={medicine.quantity <= 10 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                      {medicine.quantity}
                    </span>
                  </TableCell>
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">₹{medicine.price}</TableCell>
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">
                    <Badge 
                      variant={medicine.status === 'active' ? 'default' : 'secondary'}
                      className={`
                        ${medicine.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}
                      `}
                    >
                      {medicine.status.charAt(0).toUpperCase() + medicine.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1 sm:gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleViewMedicine(medicine)}
                        className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 hover:border-blue-400 rounded-lg"
                        title="View Details"
                      >
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleEditMedicine(medicine)}
                        className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 hover:border-blue-400 rounded-lg"
                        title="Edit Medicine"
                      >
                        <Edit2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDeleteMedicine(medicine)}
                        className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-400 rounded-lg"
                        title="Delete Medicine"
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedMedicines.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    No medicines found
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
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, filteredMedicines.length)} of {filteredMedicines.length} medicines
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

        {/* Add/Edit Medicine Dialog */}
        <Dialog open={isAddingMedicine} onOpenChange={setIsAddingMedicine}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader className="relative pb-3 sm:pb-4 md:pb-6 border-b border-blue-100 px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  {editingMedicine ? <Edit2 className="h-5 w-5 text-blue-600" /> : <Plus className="h-5 w-5 text-blue-600" />}
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-gray-900">
                    {editingMedicine ? 'Edit Medicine' : 'Add New Medicine'}
                  </DialogTitle>
                  <DialogDescription className="text-gray-600 mt-1">
                    {editingMedicine ? 'Update medicine information' : 'Enter the details for the new medicine'}
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
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">Medicine Name *</Label>
                  <Input
                    key={`name-${editingMedicine?.id || 'new'}-${formData.name}`}
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter medicine name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-medium text-gray-700">Category</Label>
                  <Select 
                    key={`category-${editingMedicine?.id || 'new'}-${formData.category}`} 
                    value={formData.category} 
                    onValueChange={(value) => setFormData({...formData, category: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manufacturer" className="text-sm font-medium text-gray-700">Manufacturer</Label>
                  <Input
                    key={`manufacturer-${editingMedicine?.id || 'new'}-${formData.manufacturer}`}
                    id="manufacturer"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
                    placeholder="Enter manufacturer"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier" className="text-sm font-medium text-gray-700">Supplier *</Label>
                  <Select 
                    key={`supplier-${editingMedicine?.id || 'new'}-${formData.supplier}`} 
                    value={formData.supplier} 
                    onValueChange={(value) => setFormData({...formData, supplier: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map(supplier => (
                        <SelectItem key={supplier.id} value={supplier.name}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batch_number" className="text-sm font-medium text-gray-700">Batch Number</Label>
                  <Input
                    key={`batch-number-${editingMedicine?.id || 'new'}-${formData.batch_number}`}
                    id="batch_number"
                    value={formData.batch_number}
                    onChange={(e) => setFormData({...formData, batch_number: e.target.value})}
                    placeholder="Enter batch number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiry_date" className="text-sm font-medium text-gray-700">Expiry Date</Label>
                  <Input
                    key={`expiry-date-${editingMedicine?.id || 'new'}-${formData.expiry_date}`}
                    id="expiry_date"
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity" className="text-sm font-medium text-gray-700">Quantity *</Label>
                  <Input
                    key={`quantity-${editingMedicine?.id || 'new'}-${formData.quantity}`}
                    id="quantity"
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
                    placeholder="Enter quantity"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-sm font-medium text-gray-700">Price *</Label>
                  <Input
                    key={`price-${editingMedicine?.id || 'new'}-${formData.price}`}
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                    placeholder="Enter price"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium text-gray-700">Status</Label>
                  <Select 
                    key={`status-${editingMedicine?.id || 'new'}-${formData.status}`} 
                    value={formData.status} 
                    onValueChange={(value) => setFormData({...formData, status: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description</Label>
                  <Textarea
                    key={`description-${editingMedicine?.id || 'new'}-${formData.description.slice(0, 10)}`}
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Enter description (optional)"
                    rows={3}
                  />
                </div>
              </div>
              
              <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsAddingMedicine(false);
                    setEditingMedicine(null);
                    setFormData({
                      name: '',
                      category: '',
                      manufacturer: '',
                      supplier: '',
                      batch_number: '',
                      expiry_date: '',
                      quantity: 0,
                      price: 0,
                      status: 'active',
                      description: '',
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
                  {editingMedicine ? 'Update Medicine' : 'Add Medicine'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Medicine Dialog - Enhanced to match GeneralStock design with Mobile Responsive */}
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="max-w-[95vw] sm:max-w-4xl lg:max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="px-2 sm:px-6">
              <DialogTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Package className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                <span className="truncate">Medicine Information History</span>
              </DialogTitle>
            </DialogHeader>
            
            {viewingMedicine && (
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
                          {viewingMedicine.id}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs sm:text-sm font-medium text-gray-600">Medicine Name</label>
                        <p className="font-semibold text-sm sm:text-base text-gray-900 bg-gray-50 px-3 py-2 rounded-lg break-words">
                          {viewingMedicine.name}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs sm:text-sm font-medium text-gray-600">Category</label>
                        <p className="font-semibold text-sm sm:text-base text-gray-900 bg-gray-50 px-3 py-2 rounded-lg break-words">
                          {getDisplayCategoryName(viewingMedicine.category)}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs sm:text-sm font-medium text-gray-600">Supplier</label>
                        <p className="font-semibold text-sm sm:text-base text-gray-900 bg-gray-50 px-3 py-2 rounded-lg break-words">
                          {getDisplaySupplierName(viewingMedicine.supplier)}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs sm:text-sm font-medium text-gray-600">Manufacturer</label>
                        <p className="font-semibold text-sm sm:text-base text-gray-900 bg-gray-50 px-3 py-2 rounded-lg break-words">
                          {viewingMedicine.manufacturer || 'Not specified'}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs sm:text-sm font-medium text-gray-600">Price per Unit</label>
                        <p className="font-semibold text-sm sm:text-base text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                          ₹{viewingMedicine.price}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs sm:text-sm font-medium text-gray-600">Expiry Date</label>
                        <p className="font-semibold text-sm sm:text-base text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                          {viewingMedicine.expiry_date ? (() => {
                            try {
                              const date = new Date(viewingMedicine.expiry_date);
                              if (!isNaN(date.getTime())) {
                                return date.toLocaleDateString('en-GB');
                              }
                              return viewingMedicine.expiry_date;
                            } catch {
                              return viewingMedicine.expiry_date || 'Not specified';
                            }
                          })() : 'Not specified'}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs sm:text-sm font-medium text-gray-600">Batch Number</label>
                        <p className="font-semibold text-sm sm:text-base text-gray-900 bg-gray-50 px-3 py-2 rounded-lg break-all">
                          {viewingMedicine.batch_number || 'Not specified'}
                        </p>
                      </div>
                      {viewingMedicine.description && (
                        <div className="space-y-2 sm:col-span-2 lg:col-span-3">
                          <label className="text-xs sm:text-sm font-medium text-gray-600">Description</label>
                          <p className="font-semibold text-sm sm:text-base text-gray-900 bg-gray-50 px-3 py-2 rounded-lg break-words">
                            {viewingMedicine.description}
                          </p>
                        </div>
                      )}
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
                        <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600">{viewingMedicine.quantity || 0}</div>
                        <div className="text-xs sm:text-sm text-gray-600 mt-1">Total Stock</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-600">0</div>
                        <div className="text-xs sm:text-sm text-gray-600 mt-1">Used Stock</div>
                      </div>
                      <div className="text-center lg:col-start-3">
                        <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600">{viewingMedicine.quantity || 0}</div>
                        <div className="text-xs sm:text-sm text-gray-600 mt-1">Available</div>
                      </div>
                      <div className="text-center lg:col-start-4">
                        <div className="mb-2">
                          <Badge 
                            variant={
                              viewingMedicine.status === 'active' && (viewingMedicine.quantity || 0) > 10 ? 'default' : 
                              (viewingMedicine.quantity || 0) <= 10 ? 'secondary' : 'destructive'
                            }
                            className={`text-xs sm:text-sm font-medium px-2 py-1 ${
                              viewingMedicine.status === 'active' && (viewingMedicine.quantity || 0) > 10 ? 'bg-green-100 text-green-800' :
                              (viewingMedicine.quantity || 0) <= 10 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}
                          >
                            {viewingMedicine.status === 'active' && (viewingMedicine.quantity || 0) > 10 ? 'In Stock' :
                             (viewingMedicine.quantity || 0) <= 10 ? 'Low Stock' :
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
                Delete Medicine
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600 mt-2">
                Are you sure you want to delete this medicine? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            {medicineToDelete && (
              <div className="bg-gray-50 rounded-lg p-4 my-4">
                <div className="text-sm">
                  <div className="font-medium text-gray-900">{medicineToDelete.name}</div>
                  <div className="text-gray-600">{medicineToDelete.category}</div>
                  <div className="text-gray-600">Quantity: {medicineToDelete.quantity}</div>
                </div>
              </div>
            )}

            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowDeleteDialog(false);
                  setMedicineToDelete(null);
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
                    Delete Medicine
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

export default MedicineManagement;
