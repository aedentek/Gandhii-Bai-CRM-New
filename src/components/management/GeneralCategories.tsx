import React, { useState } from 'react';
import '@/styles/global-crm-design.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import MonthYearPickerDialog from '@/components/shared/MonthYearPickerDialog';
import LoadingScreen from '@/components/shared/LoadingScreen';

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
import { Plus, Search, Edit2, Trash2, FolderOpen, RefreshCcw, Activity, TrendingUp, AlertCircle, Calendar, Download, Eye, UserCheck, Clock, X, Users, FileText, Tag, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import usePageTitle from '@/hooks/usePageTitle';

interface GeneralCategory {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  productCount: number;
  createdAt: string;
}

const GeneralCategories: React.FC = () => {
  // Set page title
  usePageTitle();

  const [categories, setCategories] = useState<GeneralCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  React.useEffect(() => {
    (async () => {
      if (refreshKey > 0) console.log('Refreshing data...');
      try {
        const db = (await import('@/services/databaseService')).DatabaseService;
        const data = await db.getAllGeneralCategories();
        setCategories(data.map((cat: any) => ({
          ...cat,
          id: cat.id.toString(),
          createdAt: cat.created_at || cat.createdAt || '',
          productCount: cat.productCount || 0
        })));
      } catch (e) {
        console.error('Error loading categories:', e);
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

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<GeneralCategory | null>(null);
  const [viewingCategory, setViewingCategory] = useState<GeneralCategory | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<GeneralCategory | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active' as 'active' | 'inactive',
  });

  // Month and year state for filtering
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-based like Patient Attendance
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [showMonthYearDialog, setShowMonthYearDialog] = useState(false);
  const [filterMonth, setFilterMonth] = useState<number | null>(null); // Show all months by default
  const [filterYear, setFilterYear] = useState<number | null>(null); // Show all years by default

  const { toast } = useToast();

  // Enhanced global refresh function
  const handleGlobalRefresh = React.useCallback(async () => {
    try {
      setLoading(true);
      
      const currentFilterMonth = filterMonth;
      const currentFilterYear = filterYear;
      const currentSearchTerm = searchTerm;
      const currentStatusFilter = statusFilter;
      
      const db = (await import('@/services/databaseService')).DatabaseService;
      const freshCategories = await db.getAllGeneralCategories();
      
      setCategories(freshCategories.map((cat: any) => ({
        ...cat,
        id: cat.id.toString(),
        createdAt: cat.created_at || cat.createdAt || '',
        productCount: cat.productCount || 0
      })));
      
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

  const handleEditCategory = (category: GeneralCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      status: category.status,
    });
    setIsAddingCategory(true);
  };

  const handleViewCategory = (category: GeneralCategory) => {
    setViewingCategory(category);
  };

  const handleDeleteCategory = (category: GeneralCategory) => {
    setCategoryToDelete(category);
    setShowDeleteDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({ 
        title: "Validation Error", 
        description: "Category name is required", 
        variant: "destructive" 
      });
      return;
    }

    try {
      setSubmitting(true);
      const db = (await import('@/services/databaseService')).DatabaseService;
      
      if (editingCategory) {
        await db.updateGeneralCategory(editingCategory.id, {
          name: formData.name.trim(),
          description: formData.description.trim(),
          status: formData.status,
        });
        
        setCategories(categories.map(category => 
          category.id === editingCategory.id 
            ? { ...category, ...formData, status: formData.status }
            : category
        ));
        
        toast({ 
          title: "Success", 
          description: "Category updated successfully" 
        });
      } else {
        const newCategory = await db.addGeneralCategory({
          name: formData.name.trim(),
          description: formData.description.trim(),
          status: formData.status,
        });
        
        setCategories([...categories, {
          ...newCategory,
          id: newCategory.id.toString(),
          createdAt: newCategory.created_at || new Date().toISOString(),
          productCount: 0
        }]);
        
        toast({ 
          title: "Success", 
          description: "Category added successfully" 
        });
      }
      
      setFormData({ name: '', description: '', status: 'active' });
      setIsAddingCategory(false);
      setEditingCategory(null);
    } catch (error) {
      console.error('Submit error:', error);
      toast({ 
        title: "Error", 
        description: `Failed to ${editingCategory ? 'update' : 'add'} category`, 
        variant: "destructive" 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    
    try {
      setSubmitting(true);
      const db = (await import('@/services/databaseService')).DatabaseService;
      await db.deleteGeneralCategory(categoryToDelete.id);
      
      setCategories(categories.filter(c => c.id !== categoryToDelete.id));
      setShowDeleteDialog(false);
      setCategoryToDelete(null);
      
      toast({ 
        title: "Success", 
        description: "Category deleted successfully" 
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({ 
        title: "Error", 
        description: "Failed to delete category", 
        variant: "destructive" 
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Export CSV function
  const handleExportCSV = () => {
    try {
      const headers = ['S No', 'Date', 'Name', 'Description', 'Status', 'Product Count'];
      
      const csvData = filteredCategories.map((category, index) => {
        const dateStr = category.createdAt;
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
          `"${category.name}"`,
          `"${category.description || ''}"`,
          category.status.charAt(0).toUpperCase() + category.status.slice(1),
          category.productCount || 0
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
        let filename = `general-categories-${dateStr}`;
        
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
          description: `CSV exported successfully! ${filteredCategories.length} categories exported.`
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

  // Filter categories
  const filteredCategories = categories.filter(category => {
    const matchesSearch =
      category.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter !== 'all') {
      matchesStatus = category.status === statusFilter;
    }
    
    if (filterMonth !== null && filterYear !== null) {
      const dateStr = category.createdAt;
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
        d.getMonth() === (filterMonth - 1) &&
        d.getFullYear() === filterYear
      );
    }
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    const idA = parseInt(a.id) || 0;
    const idB = parseInt(b.id) || 0;
    return idA - idB;
  });

  // Pagination logic
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.ceil(filteredCategories.length / pageSize);
  const paginatedCategories = filteredCategories.slice((page - 1) * pageSize, page * pageSize);

  const handlePrevPage = () => setPage((p) => Math.max(1, p - 1));
  const handleNextPage = () => setPage((p) => Math.min(totalPages, p + 1));
  React.useEffect(() => { setPage(1); }, [searchTerm, categories.length]);

  if (loading) {
    return <LoadingScreen message="Loading general categories data..." />;
  }

  return (
    <div className="crm-page-bg">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header Section */}
        <div className="crm-header-container">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
            <div className="flex items-center gap-3">
              <div className="crm-header-icon">
                <FolderOpen className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">General Categories</h1>
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
                title="Export filtered categories to CSV"
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">CSV</span>
              </Button>
              
              <ActionButtons.MonthYear
                onClick={() => setShowMonthYearDialog(true)}
                text={months[selectedMonth - 1]} // Mirror Patient Attendance: 1-based month to 0-based array
              />
              
              <Button 
                onClick={() => {
                  setFormData({
                    name: '',
                    description: '',
                    status: 'active',
                  });
                  setIsAddingCategory(true);
                }}
                className="global-btn flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Add Category</span>
                <span className="sm:hidden">+</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="crm-stats-grid">
          {/* Total Categories Card */}
          <Card className="crm-stat-card crm-stat-card-blue">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-blue-700 mb-1 truncate">Total Categories</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-900 mb-1">{filteredCategories.length}</p>
                  <div className="flex items-center text-xs text-blue-600">
                    <TrendingUp className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Available</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-blue">
                  <FolderOpen className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Active Categories Card */}
          <Card className="crm-stat-card crm-stat-card-green">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-green-700 mb-1 truncate">Active Categories</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-900 mb-1">
                    {filteredCategories.filter(c => c.status === 'active').length}
                  </p>
                  <div className="flex items-center text-xs text-green-600">
                    <Activity className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">In use</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-green">
                  <Activity className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Total Products Card */}
          <Card className="crm-stat-card crm-stat-card-orange">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-orange-700 mb-1 truncate">Total Products</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-900 mb-1">
                    {filteredCategories.reduce((total, cat) => total + (cat.productCount || 0), 0)}
                  </p>
                  <div className="flex items-center text-xs text-orange-600">
                    <TrendingUp className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Categorized</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-orange">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Inactive Categories Card */}
          <Card className="crm-stat-card crm-stat-card-red">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-red-700 mb-1 truncate">Inactive Categories</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-900 mb-1">
                    {filteredCategories.filter(c => c.status === 'inactive').length}
                  </p>
                  <div className="flex items-center text-xs text-red-600">
                    <AlertCircle className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Disabled</span>
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
                <input
                  type="text"
                  placeholder="Search categories by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>
            </div>
            
            <div className="w-full sm:w-auto min-w-[200px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by status" />
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
          onShowAll={() => {
            setFilterMonth(null);
            setFilterYear(null);
            setShowMonthYearDialog(false);
          }}
          title="Select Month & Year"
          description="Filter categories by specific month and year"
          previewText="categories"
        />

        {/* Categories Table */}
        <Card className="crm-table-container">
          <CardHeader className="crm-table-header">
            <div className="crm-table-title">
              <FolderOpen className="crm-table-title-icon" />
              <span className="crm-table-title-text">Categories List ({filteredCategories.length})</span>
              <span className="crm-table-title-text-mobile">Categories ({filteredCategories.length})</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
        
        {/* Scrollable Table View for All Screen Sizes */}
        <div className="overflow-x-auto">
          <Table className="w-full min-w-[800px]">
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
                    <span>Category Name</span>
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center">
                    <span>Description</span>
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
                    <span>Product Count</span>
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
              {paginatedCategories.map((category, idx) => (
                <TableRow key={category.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{(page - 1) * pageSize + idx + 1}</TableCell>
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{
                    (() => {
                      const dateStr = category.createdAt;
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
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 font-medium text-center text-xs sm:text-sm whitespace-nowrap">{category.name}</TableCell>
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm">
                    <div className="max-w-xs truncate" title={category.description}>
                      {category.description || 'No description'}
                    </div>
                  </TableCell>
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">
                    <Badge 
                      variant={category.status === 'active' ? 'default' : 'secondary'}
                      className={`
                        ${category.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}
                      `}
                    >
                      {category.status.charAt(0).toUpperCase() + category.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">
                    {category.productCount || 0}
                  </TableCell>
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1 sm:gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleViewCategory(category)}
                        className="action-btn-lead action-btn-view h-8 w-8 sm:h-9 sm:w-9 p-0"
                        title="View Category"
                      >
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleEditCategory(category)}
                        className="action-btn-lead action-btn-edit h-8 w-8 sm:h-9 sm:w-9 p-0"
                        title="Edit Category"
                      >
                        <Edit2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDeleteCategory(category)}
                        className="action-btn-lead action-btn-delete h-8 w-8 sm:h-9 sm:w-9 p-0"
                        title="Delete Category"
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedCategories.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No categories found
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
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, filteredCategories.length)} of {filteredCategories.length} categories
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

        {/* Add/Edit Category Dialog */}
        <Dialog open={isAddingCategory} onOpenChange={setIsAddingCategory}>
          <DialogContent className="crm-modal-container">
            <DialogHeader className="editpopup form dialog-header">
              <div className="editpopup form icon-title-container">
                <div className="editpopup form dialog-icon">
                  <FolderOpen className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
                <div className="editpopup form title-description">
                  <DialogTitle className="editpopup form dialog-title">
                    {editingCategory ? 'Edit Category' : 'Add New Category'}
                  </DialogTitle>
                  <DialogDescription className="editpopup form dialog-description">
                    {editingCategory ? 'Update category information' : 'Enter the details for the new category'}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="editpopup form crm-edit-form-content">
              <div className="editpopup form crm-edit-form-grid grid-cols-1">
                <div className="editpopup form crm-edit-form-group">
                  <Label htmlFor="name" className="editpopup form crm-edit-form-label flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Category Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter category name"
                    className="editpopup form crm-edit-form-input"
                    required
                  />
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
                    placeholder="Enter category description (optional)"
                    className="editpopup form crm-edit-form-textarea"
                    rows={3}
                  />
                </div>
                
                <div className="editpopup form crm-edit-form-group">
                  <Label htmlFor="status" className="editpopup form crm-edit-form-label flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Status
                  </Label>
                  <Select value={formData.status} onValueChange={(value: 'active' | 'inactive') => setFormData({...formData, status: value})}>
                    <SelectTrigger className="editpopup form crm-edit-form-select">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DialogFooter className="editpopup form dialog-footer flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsAddingCategory(false);
                    setEditingCategory(null);
                    setFormData({ name: '', description: '', status: 'active' });
                  }}
                  className="editpopup form footer-button-cancel w-full sm:w-auto modern-btn modern-btn-secondary"
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitting}
                  className="editpopup form footer-button-save w-full sm:w-auto global-btn"
                >
                  {submitting ? (
                    <>
                      <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                      {editingCategory ? 'Updating...' : 'Adding...'}
                    </>
                  ) : (
                    <>
                      <FolderOpen className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      {editingCategory ? 'Update Category' : 'Add Category'}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Category Dialog - Glass Morphism Design */}
        {viewingCategory && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setViewingCategory(null)}
          >
            <div 
              className="max-w-[95vw] max-h-[95vh] w-full sm:max-w-4xl bg-gradient-to-br from-white to-blue-50/30 border-0 shadow-2xl p-0 m-4 rounded-xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header - Glass Morphism Style */}
              <div className="relative pb-3 sm:pb-4 md:pb-6 border-b border-blue-100 px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-6 flex-shrink-0">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500"></div>
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mt-2 sm:mt-4">
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full border-2 sm:border-4 border-white shadow-lg overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600">
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm sm:text-base md:text-lg lg:text-xl">
                          {(viewingCategory.name || 'C').charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-1 sm:gap-2 truncate">
                      <Activity className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-blue-600 flex-shrink-0" />
                      <span className="truncate">Category Details</span>
                    </h2>
                    <div className="text-xs sm:text-sm md:text-lg lg:text-xl mt-1 flex items-center gap-2">
                      <span className="text-gray-600">
                        Complete category information and details
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewingCategory(null)}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              
              {/* Main content with scrolling enabled */}
              <div className="flex-1 overflow-y-auto min-h-0 p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6" style={{scrollbarWidth: 'thin', scrollbarColor: '#60a5fa #dbeafe'}}>
                {/* Category Information Cards */}
                <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-blue-100 shadow-sm">
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 flex items-center gap-2">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    Category Information
                  </h3>

                  {/* Category Details Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-white p-3 sm:p-4 rounded-lg border border-blue-200 hover:shadow-md transition-all duration-200">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <label className="text-xs sm:text-sm font-medium text-blue-700 block">Category Name</label>
                          <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">{viewingCategory.name}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-50 to-white p-3 sm:p-4 rounded-lg border border-purple-200 hover:shadow-md transition-all duration-200">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <label className="text-xs sm:text-sm font-medium text-purple-700 block">Status</label>
                          <p className="text-sm sm:text-base font-semibold">
                            <Badge 
                              variant={viewingCategory.status === 'active' ? 'default' : 'secondary'}
                              className={`
                                ${viewingCategory.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                              `}
                            >
                              {viewingCategory.status.charAt(0).toUpperCase() + viewingCategory.status.slice(1)}
                            </Badge>
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-50 to-white p-3 sm:p-4 rounded-lg border border-green-200 hover:shadow-md transition-all duration-200">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <label className="text-xs sm:text-sm font-medium text-green-700 block">Created Date</label>
                          <p className="text-sm sm:text-base font-semibold text-gray-900">
                            {viewingCategory.createdAt ? (() => {
                              const dateStr = viewingCategory.createdAt;
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
                                return `${day}/${month}/${year}`;
                              }
                              return dateStr;
                            })() : 'Unknown'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description Section */}
                <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-green-100 shadow-sm">
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 flex items-center gap-2">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                    Description & Details
                  </h3>

                  <div className="space-y-4 sm:space-y-6">
                    <div className="bg-gradient-to-br from-gray-50 to-white p-3 sm:p-4 rounded-lg border border-gray-200">
                      <label className="text-xs sm:text-sm font-medium text-gray-700 block mb-2">Category Description</label>
                      <p className="text-sm sm:text-base text-gray-900 leading-relaxed">
                        {viewingCategory.description || 'No description provided for this category.'}
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50 to-white p-3 sm:p-4 rounded-lg border border-orange-200">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <label className="text-xs sm:text-sm font-medium text-orange-700 block">Product Count</label>
                          <p className="text-sm sm:text-base font-semibold text-gray-900">
                            {viewingCategory.productCount || 0} products associated
                          </p>
                        </div>
                      </div>
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
                    Delete Category
                  </DialogTitle>
                  <DialogDescription className="editpopup form dialog-description">
                    Are you sure you want to delete this category? This action cannot be undone.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            {categoryToDelete && (
              <div className="mx-4 my-4 p-4 bg-gray-50 rounded-lg border">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-900">{categoryToDelete.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">{categoryToDelete.description || 'No description'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Status: {categoryToDelete.status}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">{categoryToDelete.productCount || 0} products</span>
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
                  setCategoryToDelete(null);
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
                    Delete Category
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

export default GeneralCategories;
