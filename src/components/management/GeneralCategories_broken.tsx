import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import MonthYearPickerDialog from '@/components/shared/MonthYearPickerDialog';
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

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit2, Trash2, FolderOpen, RefreshCw, Activity, TrendingUp, AlertCircle, Calendar, Download, Eye, UserCheck, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GeneralCategory {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  productCount: number;
  createdAt: string;
}

const GeneralCategories: React.FC = () => {
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
        // Optionally show error
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshKey]);

  // Auto-refresh data periodically to catch external changes
  React.useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Global refresh function
  const handleRefresh = React.useCallback(() => {
    setLoading(true);
    setRefreshKey(prev => prev + 1);
  }, []);

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<GeneralCategory | null>(null);
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
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [showMonthYearDialog, setShowMonthYearDialog] = useState(false);
  const [filterMonth, setFilterMonth] = useState<number | null>(new Date().getMonth());
  const [filterYear, setFilterYear] = useState<number | null>(currentYear);

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
      const freshCategories = await db.getAllGeneralCategories();
      
      // Update categories with proper mapping
      setCategories(freshCategories.map((cat: any) => ({
        ...cat,
        id: cat.id.toString(),
        createdAt: cat.created_at || cat.createdAt || '',
        productCount: cat.productCount || 0
      })));
      
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

  const handleAddCategory = async () => {
    if (!formData.name) {
      toast({
        title: "Error",
        description: "Please enter a category name",
        variant: "destructive",
      });
      return;
    }
    try {
      const db = (await import('@/services/databaseService')).DatabaseService;
      await db.addGeneralCategory({
        name: formData.name,
        description: formData.description,
        status: formData.status
      });
      
      // Refresh all data
      handleRefresh();
      
      setFormData({ name: '', description: '', status: 'active' });
      setIsAddingCategory(false);
      toast({ title: "Success", description: "Category added successfully" });
    } catch (e) {
      toast({ title: "Error", description: "Failed to add category", variant: "destructive" });
    }
  };

  const handleEditCategory = (category: GeneralCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      status: category.status,
    });
    setIsAddingCategory(true);
  };

  const handleUpdateCategory = async () => {
    if (!formData.name) {
      toast({
        title: "Error",
        description: "Please enter a category name",
        variant: "destructive",
      });
      return;
    }
    try {
      const db = (await import('@/services/databaseService')).DatabaseService;
      await db.updateGeneralCategory(editingCategory!.id, {
        name: formData.name,
        description: formData.description,
        status: formData.status
      });
      
      // Refresh all data
      handleRefresh();
      
      setIsAddingCategory(false);
      setEditingCategory(null);
      setFormData({ name: '', description: '', status: 'active' });
      toast({ title: "Success", description: "Category updated successfully" });
    } catch (e) {
      toast({ title: "Error", description: "Failed to update category", variant: "destructive" });
    }
  };

  const handleSubmit = async () => {
    if (editingCategory) {
      await handleUpdateCategory();
    } else {
      await handleAddCategory();
    }
  };

  const handleDeleteCategory = (category: GeneralCategory) => {
    setCategoryToDelete(category);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    
    try {
      setSubmitting(true);
      const db = (await import('@/services/databaseService')).DatabaseService;
      await db.deleteGeneralCategory(categoryToDelete.id);
      
      // Refresh all data
      handleRefresh();
      
      setShowDeleteDialog(false);
      setCategoryToDelete(null);
      toast({ 
        title: "Success", 
        description: "Category deleted successfully" 
      });
    } catch (e) {
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
      // Prepare CSV headers
      const headers = ['S No', 'Date', 'Name', 'Description', 'Status', 'Product Count'];
      
      // Prepare CSV data
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

  // Filter categories by search, status, and by selected month/year if filter is active
  const filteredCategories = categories.filter(category => {
    const matchesSearch =
      category.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter logic
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
        d.getMonth() === filterMonth &&
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
  const totalPages = Math.ceil(filteredCategories.length / pageSize);
  const paginatedCategories = filteredCategories.slice((page - 1) * pageSize, page * pageSize);

  const handlePrevPage = () => setPage((p) => Math.max(1, p - 1));
  const handleNextPage = () => setPage((p) => Math.min(totalPages, p + 1));
  React.useEffect(() => { setPage(1); }, [searchTerm, categories.length]);

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
                <FolderOpen className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">General Categories</h1>
                <p className="text-sm text-gray-600 mt-1">Manage and organize your general product categories</p>
              </div>
            </div>
          
            <div className="flex flex-row sm:flex-row gap-1 sm:gap-3 w-full sm:w-auto">
              <Button 
                onClick={() => {
                  // Reset all filters to current month/year and refresh
                  const currentMonth = new Date().getMonth();
                  const currentYear = new Date().getFullYear();
                  
                  setStatusFilter('all');
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
                className="global-btn flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
                title="Reset to current month and refresh data"
              >
                <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
                <span className="sm:hidden">↻</span>
              </Button>
              
              <Button 
                onClick={handleExportCSV}
                className="global-btn flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
                title="Export filtered categories to CSV"
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">CSV</span>
              </Button>
              
              <Button 
                onClick={() => setShowMonthYearDialog(true)}
                variant="outline"
                className="action-btn action-btn-outline flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
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
                  <Calendar className="h-4 w-4 mr-2" />
                  <span className="hidden lg:inline">
                    {filterMonth !== null && filterYear !== null 
                      ? `${months[filterMonth]} ${filterYear}`
                      : `${months[selectedMonth]} ${selectedYear}`
                    }
                  </span>
                  <span className="lg:hidden">
                    {filterMonth !== null && filterYear !== null 
                      ? `${months[filterMonth].slice(0, 3)} ${String(filterYear).slice(-2)}`
                      : `${months[selectedMonth].slice(0, 3)} ${String(selectedYear).slice(-2)}`
                    }
                  </span>
                </Button>
              </div>
              
              <div className="flex flex-row gap-2">
                {/* Export CSV Button */}
                <Button 
                  onClick={handleExportCSV}
                  className="global-btn flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm lg:min-w-[120px]"
                  title="Export filtered categories to CSV"
                >
                  <Download className="h-4 w-4 mr-2" />
                  <span className="hidden lg:inline">Export CSV</span>
                  <span className="lg:hidden">CSV</span>
                </Button>
                
                <Button 
                  onClick={() => {
                    setFormData({
                      name: '',
                      description: '',
                      status: 'active',
                    });
                    setIsAddingCategory(true);
                  }}
                  className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm lg:min-w-[120px]"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden lg:inline">Add Category</span>
                  <span className="lg:hidden">+</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6">
          <div className="modern-stat-card stat-card-blue">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FolderOpen className="h-3 w-3 sm:h-5 sm:w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-lg sm:text-2xl font-bold text-gray-900">{filteredCategories.length}</div>
                <div className="text-xs text-gray-600">Total Categories</div>
              </div>
            </div>
          </div>
          
          <div className="modern-stat-card stat-card-green">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Activity className="h-3 w-3 sm:h-5 sm:w-5 text-green-600" />
              </div>
              <div>
                <div className="text-lg sm:text-2xl font-bold text-gray-900">
                  {filteredCategories.filter(c => c.status === 'active').length}
                </div>
                <div className="text-xs text-gray-600">Active</div>
              </div>
            </div>
          </div>
          
          <div className="modern-stat-card stat-card-orange">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="h-3 w-3 sm:h-5 sm:w-5 text-orange-600" />
              </div>
              <div>
                <div className="text-lg sm:text-2xl font-bold text-gray-900">
                  {filteredCategories.reduce((total, cat) => total + (cat.productCount || 0), 0)}
                </div>
                <div className="text-xs text-gray-600">Total Products</div>
              </div>
            </div>
          </div>
          
          <div className="modern-stat-card stat-card-purple">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <AlertCircle className="h-3 w-3 sm:h-5 sm:w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-lg sm:text-2xl font-bold text-gray-900">
                  {filteredCategories.filter(c => c.status === 'inactive').length}
                </div>
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
                  placeholder="Search categories by name or description..."
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
                  <div className="px-2 py-1 border-t border-gray-200">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      onClick={() => {
                        setStatusFilter('all');
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
          description="Filter categories by specific month and year"
          previewText="categories"
        />

        {/* Categories Table */}
        <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-xl shadow-sm overflow-hidden">
          <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gray-50/50">
            <div className="flex items-center text-base sm:text-lg font-semibold text-gray-900">
              <FolderOpen className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              <span className="hidden sm:inline">Categories List ({filteredCategories.length})</span>
              <span className="sm:hidden">Categories ({filteredCategories.length})</span>
            </div>
          </div>
        
        {/* Scrollable Table View for All Screen Sizes */}
        <div className="overflow-x-auto">
          <Table className="w-full min-w-[1000px]">
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
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap max-w-[200px] truncate">{category.description}</TableCell>
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
                    <div className="flex items-center justify-center gap-2 sm:gap-3">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => {
                          // View category details - you can implement this
                          console.log('View category:', category);
                        }}
                        className="action-btn-lead action-btn-view h-8 w-8 sm:h-9 sm:w-9 p-0"
                        title="View Category Details"
                      >
                        <Eye className="h-4 w-4 sm:h-4 sm:w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleEditCategory(category)}
                        className="action-btn-lead action-btn-edit h-8 w-8 sm:h-9 sm:w-9 p-0"
                        title="Edit Category"
                      >
                        <Edit2 className="h-4 w-4 sm:h-4 sm:w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDeleteCategory(category)}
                        className="action-btn-lead action-btn-delete h-8 w-8 sm:h-9 sm:w-9 p-0"
                        title="Delete Category"
                      >
                        <Trash2 className="h-4 w-4 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedCategories.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
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
      </div>

        {/* Add/Edit Category Dialog */}
        <Dialog open={isAddingCategory} onOpenChange={setIsAddingCategory}>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader className="relative pb-3 sm:pb-4 md:pb-6 border-b border-blue-100 px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  {editingCategory ? <Edit2 className="h-5 w-5 text-blue-600" /> : <Plus className="h-5 w-5 text-blue-600" />}
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-gray-900">
                    {editingCategory ? 'Edit Category' : 'Add New Category'}
                  </DialogTitle>
                  <DialogDescription className="text-gray-600 mt-1">
                    {editingCategory ? 'Update category information' : 'Enter the details for the new category'}
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
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">Category Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter category name"
                    className="mt-1"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Enter category description (optional)"
                    className="mt-1"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium text-gray-700">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value as 'active' | 'inactive'})}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsAddingCategory(false);
                    setEditingCategory(null);
                    setFormData({
                      name: '',
                      description: '',
                      status: 'active',
                    });
                  }}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {editingCategory ? 'Update Category' : 'Add Category'}
                </Button>
              </DialogFooter>
            </form>
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
                Delete Category
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600 mt-2">
                Are you sure you want to delete this category? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            {categoryToDelete && (
              <div className="bg-gray-50 rounded-lg p-4 my-4">
                <div className="text-sm">
                  <div className="font-medium text-gray-900">{categoryToDelete.name}</div>
                  <div className="text-gray-600">{categoryToDelete.description}</div>
                  <div className="text-gray-600">Status: {categoryToDelete.status}</div>
                </div>
              </div>
            )}

            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowDeleteDialog(false);
                  setCategoryToDelete(null);
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