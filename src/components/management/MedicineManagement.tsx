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
import { Plus, Search, Edit2, Trash2, Pill, RefreshCw, Activity, TrendingUp, AlertTriangle, Calendar, Download, Eye, Package, BarChart3, History, X, Tag, DollarSign, Clock, Building, Warehouse, Package2, TrendingDown, UserCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import usePageTitle from '@/hooks/usePageTitle';

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
  // Set custom page title
  usePageTitle('Medicine Management');

const [medicines, setMedicines] = useState<Medicine[]>([]);
const [doctors, setDoctors] = useState<any[]>([]);
const [loading, setLoading] = useState(true);
const [refreshKey, setRefreshKey] = useState(0);
const [categories, setCategories] = useState<Array<{id: number, name: string, status: string}>>([]);
const [suppliers, setSuppliers] = useState<Array<{id: number, name: string, status: string}>>([]);

React.useEffect(() => {
  (async () => {
    if (refreshKey > 0) console.log('Refreshing data...');
    try {
      const db = (await import('@/services/databaseService')).DatabaseService;
      
      // Fetch medicines, categories, suppliers, and doctors in parallel
      const [medicinesData, categoriesData, suppliersData, doctorsData] = await Promise.all([
        db.getAllMedicineProducts(),
        db.getAllMedicineCategories(),
        db.getAllMedicineSuppliers(),
        db.getAllDoctors()
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
      
      // Set active categories, suppliers, and doctors
      setCategories(categoriesData.filter((cat: any) => cat.status === 'active'));
      setSuppliers(suppliersData.filter((sup: any) => sup.status === 'active'));
      setDoctors(doctorsData || []);
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
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // Fix: 1-based like General Categories
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [showMonthYearDialog, setShowMonthYearDialog] = useState(false);
  const [filterMonth, setFilterMonth] = useState<number | null>(new Date().getMonth() + 1); // Fix: Also 1-based
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
        d.getMonth() === (filterMonth - 1) && // Convert 1-based filterMonth to 0-based for comparison
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
    <div className="crm-page-bg">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header Section */}
        <div className="crm-header-container">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
            <div className="flex items-center gap-3">
              <div className="crm-header-icon">
                <Pill className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Medicine Management</h1>
              </div>
            </div>
          
            <div className="flex items-center gap-2 sm:gap-3">
              <ActionButtons.Refresh onClick={() => {
                console.log('🔄 Manual refresh triggered - refreshing entire page');
                window.location.reload();
              }} />
              
              <ActionButtons.MonthYear
                text={`${months[(filterMonth || 1) - 1]} ${filterYear}`}
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
                className="global-btn flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Add Medicine</span>
                <span className="sm:hidden">+</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="crm-stats-grid">
          {/* Total Medicines Card */}
          <Card className="crm-stat-card crm-stat-card-blue">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-blue-700 mb-1 truncate">Total Medicines</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-900 mb-1">{totalMedicines}</p>
                  <div className="flex items-center text-xs text-blue-600">
                    <Package className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">All medicines</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-blue">
                  <Pill className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Active Medicines Card */}
          <Card className="crm-stat-card crm-stat-card-green">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-green-700 mb-1 truncate">Active Medicines</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-900 mb-1">{activeMedicines}</p>
                  <div className="flex items-center text-xs text-green-600">
                    <Activity className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Available</span>
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
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-900 mb-1">{lowStockMedicines}</p>
                  <div className="flex items-center text-xs text-orange-600">
                    <AlertTriangle className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Need restock</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-orange">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Inactive Medicines Card */}
          <Card className="crm-stat-card crm-stat-card-red">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-red-700 mb-1 truncate">Inactive</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-900 mb-1">{inactiveMedicines}</p>
                  <div className="flex items-center text-xs text-red-600">
                    <TrendingDown className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Disabled</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-red">
                  <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
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
                <input
                  type="text"
                  placeholder="Search medicines by name, category, manufacturer, or supplier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="w-full sm:w-auto min-w-[160px]">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full">
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
              
              <div className="w-full sm:w-auto min-w-[140px]">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('all');
                  setStatusFilter('all');
                }}
                className="global-btn global-btn-secondary flex-shrink-0 text-xs sm:text-sm px-3 sm:px-4 py-2"
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Clear Filters</span>
                <span className="sm:hidden">Clear</span>
              </button>
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
        <Card className="crm-table-container">
          <CardHeader className="crm-table-header">
            <div className="crm-table-title">
              <Pill className="crm-table-title-icon" />
              <span className="crm-table-title-text">Medicines List ({filteredMedicines.length})</span>
              <span className="crm-table-title-text-mobile">Medicines ({filteredMedicines.length})</span>
            </div>
          </CardHeader>
        
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table className="crm-table">
                <TableHeader>
                  <TableRow className="crm-table-header-row">
                    <TableHead className="crm-table-header-cell text-center">S No</TableHead>
                    <TableHead className="crm-table-header-cell text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>
                          <span className="hidden sm:inline">Purchase Date</span>
                          <span className="sm:hidden">Date</span>
                        </span>
                      </div>
                    </TableHead>
                    <TableHead className="crm-table-header-cell text-center">Medicine Name</TableHead>
                    <TableHead className="crm-table-header-cell text-center">
                      <span>
                        <span className="hidden sm:inline">Category</span>
                        <span className="sm:hidden">Cat</span>
                      </span>
                    </TableHead>
                    <TableHead className="crm-table-header-cell text-center">Manufacturer</TableHead>
                    <TableHead className="crm-table-header-cell text-center">
                      <span>
                        <span className="hidden sm:inline">Supplier</span>
                        <span className="sm:hidden">Sup</span>
                      </span>
                    </TableHead>
                    <TableHead className="crm-table-header-cell text-center">Quantity</TableHead>
                    <TableHead className="crm-table-header-cell text-center">Price</TableHead>
                    <TableHead className="crm-table-header-cell text-center">Status</TableHead>
                    <TableHead className="crm-table-header-cell text-center">Actions</TableHead>
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
                        className="action-btn-lead action-btn-view h-8 w-8 sm:h-9 sm:w-9 p-0"
                        title="View Details"
                      >
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleEditMedicine(medicine)}
                        className="action-btn-lead action-btn-edit h-8 w-8 sm:h-9 sm:w-9 p-0"
                        title="Edit Medicine"
                      >
                        <Edit2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDeleteMedicine(medicine)}
                        className="action-btn-lead action-btn-delete h-8 w-8 sm:h-9 sm:w-9 p-0"
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
          <div className="crm-pagination-container">
            <div className="crm-pagination-info">
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, filteredMedicines.length)} of {filteredMedicines.length} medicines
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
                      className={cn(
                        "crm-pagination-btn",
                        page === pageNum && "crm-pagination-btn-active"
                      )}
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
        </CardContent>
        </Card>

        {/* Add/Edit Medicine Dialog */}
        <Dialog open={isAddingMedicine} onOpenChange={setIsAddingMedicine}>
          <DialogContent className="editpopup form crm-modal-container sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader className="editpopup form crm-modal-header">
              <div className="editpopup form crm-modal-header-content">
                <div className="editpopup form crm-modal-icon">
                  {editingMedicine ? <Edit2 className="h-5 w-5 text-blue-600" /> : <Plus className="h-5 w-5 text-blue-600" />}
                </div>
                <div className="editpopup form crm-modal-title-section">
                  <DialogTitle className="editpopup form crm-modal-title">
                    {editingMedicine ? 'Edit Medicine' : 'Add New Medicine'}
                  </DialogTitle>
                  <DialogDescription className="editpopup form crm-modal-description">
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
              className="editpopup form crm-edit-form-content"
            >
              <div className="editpopup form crm-edit-form-grid grid-cols-1 md:grid-cols-2">
                <div className="editpopup form crm-edit-form-group">
                  <Label htmlFor="name" className="editpopup form crm-edit-form-label flex items-center gap-2">
                    <Pill className="h-4 w-4" />
                    Medicine Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    key={`name-${editingMedicine?.id || 'new'}-${formData.name}`}
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter medicine name"
                    required
                    className="editpopup form crm-edit-form-input"
                  />
                </div>
                <div className="editpopup form crm-edit-form-group">
                  <Label htmlFor="category" className="editpopup form crm-edit-form-label flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Category
                  </Label>
                  <Select 
                    key={`category-${editingMedicine?.id || 'new'}-${formData.category}`} 
                    value={formData.category} 
                    onValueChange={(value) => setFormData({...formData, category: value})}
                  >
                    <SelectTrigger className="editpopup form crm-edit-form-select">
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
                <div className="editpopup form crm-edit-form-group">
                  <Label htmlFor="manufacturer" className="editpopup form crm-edit-form-label flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Manufacturer
                  </Label>
                  <Input
                    key={`manufacturer-${editingMedicine?.id || 'new'}-${formData.manufacturer}`}
                    id="manufacturer"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
                    placeholder="Enter manufacturer"
                    className="editpopup form crm-edit-form-input"
                  />
                </div>
                <div className="editpopup form crm-edit-form-group">
                  <Label htmlFor="supplier" className="editpopup form crm-edit-form-label flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    Supplier <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    key={`supplier-${editingMedicine?.id || 'new'}-${formData.supplier}`} 
                    value={formData.supplier} 
                    onValueChange={(value) => setFormData({...formData, supplier: value})}
                  >
                    <SelectTrigger className="editpopup form crm-edit-form-select">
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
                <div className="editpopup form crm-edit-form-group">
                  <Label htmlFor="batch_number" className="editpopup form crm-edit-form-label flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Batch Number
                  </Label>
                  <Input
                    key={`batch-number-${editingMedicine?.id || 'new'}-${formData.batch_number}`}
                    id="batch_number"
                    value={formData.batch_number}
                    onChange={(e) => setFormData({...formData, batch_number: e.target.value})}
                    placeholder="Enter batch number"
                    className="editpopup form crm-edit-form-input"
                  />
                </div>
                <div className="editpopup form crm-edit-form-group">
                  <Label htmlFor="expiry_date" className="editpopup form crm-edit-form-label flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Expiry Date
                  </Label>
                  <Input
                    key={`expiry-date-${editingMedicine?.id || 'new'}-${formData.expiry_date}`}
                    id="expiry_date"
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                    className="editpopup form crm-edit-form-input"
                  />
                </div>
                <div className="editpopup form crm-edit-form-group">
                  <Label htmlFor="quantity" className="editpopup form crm-edit-form-label flex items-center gap-2">
                    <Package2 className="h-4 w-4" />
                    Quantity <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    key={`quantity-${editingMedicine?.id || 'new'}-${formData.quantity}`}
                    id="quantity"
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
                    placeholder="Enter quantity"
                    required
                    className="editpopup form crm-edit-form-input"
                  />
                </div>
                <div className="editpopup form crm-edit-form-group">
                  <Label htmlFor="price" className="editpopup form crm-edit-form-label flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Price <span className="text-red-500">*</span>
                  </Label>
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
                    className="editpopup form crm-edit-form-input"
                  />
                </div>
                <div className="editpopup form crm-edit-form-group">
                  <Label htmlFor="status" className="editpopup form crm-edit-form-label flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Status
                  </Label>
                  <Select 
                    key={`status-${editingMedicine?.id || 'new'}-${formData.status}`} 
                    value={formData.status} 
                    onValueChange={(value) => setFormData({...formData, status: value})}
                  >
                    <SelectTrigger className="editpopup form crm-edit-form-select">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="editpopup form crm-edit-form-group md:col-span-2">
                  <Label htmlFor="description" className="editpopup form crm-edit-form-label flex items-center gap-2">
                    <Edit2 className="h-4 w-4" />
                    Description
                  </Label>
                  <Textarea
                    key={`description-${editingMedicine?.id || 'new'}-${formData.description.slice(0, 10)}`}
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Enter description (optional)"
                    rows={3}
                    className="editpopup form crm-edit-form-textarea"
                  />
                </div>
              </div>
              
              <DialogFooter className="editpopup form dialog-footer flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
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
                  className="editpopup form footer-button-cancel w-full sm:w-auto modern-btn modern-btn-secondary"
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="editpopup form footer-button-save w-full sm:w-auto global-btn"
                >
                  <Pill className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  {editingMedicine ? 'Update Medicine' : 'Add Medicine'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Medicine Dialog - Medicine Stock Modal Style */}
        {viewingMedicine && showViewDialog && (
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
                    <div className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full object-cover border-2 sm:border-4 border-white shadow-lg overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                      <Pill className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1">
                      <div className={`border-2 border-white shadow-sm text-xs px-2 py-1 rounded-full ${
                        viewingMedicine.status === 'active' && (viewingMedicine.quantity || 0) > 10 ? 'bg-green-100 text-green-800' :
                        (viewingMedicine.quantity || 0) <= 10 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {viewingMedicine.status === 'active' && (viewingMedicine.quantity || 0) > 10 ? 'In Stock' :
                         (viewingMedicine.quantity || 0) <= 10 ? 'Low Stock' :
                         'Out of Stock'}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-1 sm:gap-2 truncate">
                      <Package className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-blue-600 flex-shrink-0" />
                      <span className="truncate">{viewingMedicine.name}</span>
                    </h2>
                    <div className="text-xs sm:text-sm md:text-lg lg:text-xl mt-1 flex items-center gap-2">
                      <span className="text-gray-600">Medicine ID:</span>
                      <span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg border border-green-200">
                        {typeof viewingMedicine.id === 'number' ? `MD${String(viewingMedicine.id).padStart(4, '0')}` : 
                         (typeof viewingMedicine.id === 'string' && /^\d+$/.test(viewingMedicine.id) ? `MD${viewingMedicine.id.padStart(4, '0')}` : 
                          viewingMedicine.id)}
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
                  
                  {/* Medicine Information Section */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-blue-100 shadow-sm">
                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 flex items-center gap-2">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Pill className="h-3 w-3 sm:h-3 sm:w-3 md:h-4 md:w-4 text-blue-600" />
                      </div>
                      Medicine Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                      
                      <div className="bg-gradient-to-br from-blue-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-blue-100">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Pill className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-blue-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">Medicine Name</div>
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 truncate">{viewingMedicine.name}</p>
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
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 truncate">{getDisplayCategoryName(viewingMedicine.category)}</p>
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
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">{getDisplaySupplierName(viewingMedicine.supplier)}</p>
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
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">₹{viewingMedicine.price || 0}</p>
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
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">{viewingMedicine.purchase_date || 'Not specified'}</p>
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
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">
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
                        </div>
                      </div>
                      
                      {viewingMedicine.manufacturer && (
                        <div className="bg-gradient-to-br from-teal-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-teal-100">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <Building className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-teal-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-medium text-teal-600 uppercase tracking-wide">Manufacturer</div>
                              <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">{viewingMedicine.manufacturer}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {viewingMedicine.batch_number && (
                        <div className="bg-gradient-to-br from-pink-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-pink-100">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <Package className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-pink-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-medium text-pink-600 uppercase tracking-wide">Batch Number</div>
                              <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">{viewingMedicine.batch_number}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                    </div>
                    
                    {viewingMedicine.description && (
                      <div className="mt-4 p-3 sm:p-4 bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-100">
                        <div className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">Description</div>
                        <p className="text-sm sm:text-base text-gray-900">{viewingMedicine.description}</p>
                      </div>
                    )}
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
                        <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-blue-600">{viewingMedicine.quantity || 0}</div>
                        <div className="text-xs sm:text-sm font-medium text-blue-600 uppercase tracking-wide">Total Stock</div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-red-50 to-white p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl border border-red-100 text-center">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                          <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-red-600" />
                        </div>
                        <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-red-600">0</div>
                        <div className="text-xs sm:text-sm font-medium text-red-600 uppercase tracking-wide">Used Stock</div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-green-50 to-white p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl border border-green-100 text-center">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Package2 className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-green-600" />
                        </div>
                        <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-green-600">{viewingMedicine.quantity || 0}</div>
                        <div className="text-xs sm:text-sm font-medium text-green-600 uppercase tracking-wide">Available</div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-purple-50 to-white p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl border border-purple-100 text-center">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Activity className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-purple-600" />
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full font-medium ${
                          viewingMedicine.status === 'active' && (viewingMedicine.quantity || 0) > 10 ? 'bg-green-100 text-green-800' :
                          (viewingMedicine.quantity || 0) <= 10 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {viewingMedicine.status === 'active' && (viewingMedicine.quantity || 0) > 10 ? 'In Stock' :
                           (viewingMedicine.quantity || 0) <= 10 ? 'Low Stock' :
                           'Out of Stock'}
                        </div>
                        <div className="text-xs sm:text-sm font-medium text-purple-600 uppercase tracking-wide mt-2">Status</div>
                      </div>
                      
                    </div>
                  </div>

                  {/* Stock Movement History - Empty State */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-blue-100 shadow-sm text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <History className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Stock History</h3>
                    <p className="text-gray-500">No stock movement history recorded yet for this medicine</p>
                    <p className="text-gray-400 text-sm mt-2">Stock movement tracking will appear here</p>
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
                    Delete Medicine
                  </DialogTitle>
                  <DialogDescription className="editpopup form dialog-description">
                    Are you sure you want to delete this medicine? This action cannot be undone.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            {medicineToDelete && (
              <div className="mx-4 my-4 p-4 bg-gray-50 rounded-lg border">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Pill className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-900">{medicineToDelete.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">{medicineToDelete.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Stock: {medicineToDelete.quantity} units</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">{medicineToDelete.supplier}</span>
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
                  setMedicineToDelete(null);
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
