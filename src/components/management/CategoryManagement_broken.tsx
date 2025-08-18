import React, { useState } from 'react';
import '@/styles/global-crm-design.css';
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
import { Plus, Search, Edit2, Trash2, FolderOpen, RefreshCw, Activity, TrendingUp, AlertCircle, Calendar, Download, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DatabaseService } from '@/services/databaseService';

interface MedicineCategory {
  id: number;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

const CategoryManagement: React.FC = () => {
  const [categories, setCategories] = useState<MedicineCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  React.useEffect(() => {
    (async () => {
      if (refreshKey > 0) console.log('Refreshing data...');
      try {
        const data = await DatabaseService.getAllMedicineCategories();
        setCategories(data);
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

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MedicineCategory | null>(null);
  const [viewingCategory, setViewingCategory] = useState<MedicineCategory | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<MedicineCategory | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active',
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
      
      const freshCategories = await DatabaseService.getAllMedicineCategories();
      
      setCategories(freshCategories);
      
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

  const handleEditCategory = (category: MedicineCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      status: category.status,
    });
    setIsAddingCategory(true);
  };

  const handleViewCategory = (category: MedicineCategory) => {
    setViewingCategory(category);
  };

  const handleDeleteCategory = (category: MedicineCategory) => {
    setCategoryToDelete(category);
    setShowDeleteDialog(true);
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      toast({
        title: "Error",
        description: "Please enter a category name",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setSubmitting(true);
      
      if (editingCategory) {
        const updatedCategory = await DatabaseService.updateMedicineCategory(editingCategory.id, formData);
        setCategories(categories.map(cat => (cat.id === editingCategory.id ? updatedCategory : cat)));
        toast({ title: "Success", description: "Category updated successfully" });
      } else {
        const newCategory = await DatabaseService.addMedicineCategory(formData);
        setCategories([...categories, newCategory]);
        toast({ title: "Success", description: "Category added successfully" });
      }
      
      handleRefresh();
      
      setFormData({ name: '', description: '', status: 'active' });
      setIsAddingCategory(false);
      setEditingCategory(null);
    } catch (e) {
      toast({ title: "Error", description: `Failed to ${editingCategory ? 'update' : 'add'} category`, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    
    try {
      setSubmitting(true);
      await DatabaseService.deleteMedicineCategory(categoryToDelete.id);
      
      setCategories(categories.filter(category => category.id !== categoryToDelete.id));
      
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
      const headers = ['S No', 'Date', 'Category Name', 'Description', 'Status'];
      
      const csvData = filteredCategories.map((category, index) => {
        const dateStr = category.created_at;
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
        let filename = `medicine-categories-${dateStr}`;
        
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
      const dateStr = category.created_at;
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
    const idA = a.id || 0;
    const idB = b.id || 0;
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
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="crm-header-icon crm-header-icon-blue">
                <FolderOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Medicine Categories</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Manage and organize medicine categories
                </p>
              </div>
            </div>
          
            <div className="action-buttons-container">
              <button 
                onClick={() => {
                  const currentMonth = new Date().getMonth();
                  const currentYear = new Date().getFullYear();
                  
                  setStatusFilter('all');
                  setSearchTerm('');
                  setFilterMonth(currentMonth);
                  setFilterYear(currentYear);
                  setSelectedMonth(currentMonth);
                  setSelectedYear(currentYear);
                  setPage(1);
                  
                  handleGlobalRefresh();
                }}
                disabled={loading}
                className="action-btn-secondary"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              
              <button 
                onClick={() => setShowMonthYearDialog(true)}
                className="action-btn-secondary"
              >
                <Calendar className="h-4 w-4 mr-2" />
                {filterMonth !== null && filterYear !== null 
                  ? `${months[filterMonth]} ${filterYear}`
                  : `${months[selectedMonth]} ${selectedYear}`
                }
              </button>
              
              <button 
                onClick={handleExportCSV}
                className="action-btn-lead"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </button>
              
              <button 
                onClick={() => {
                  setFormData({
                    name: '',
                    description: '',
                    status: 'active',
                  });
                  setIsAddingCategory(true);
                }}
                className="action-btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="crm-stats-grid">
          <Card className="crm-stat-card crm-stat-card-blue">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Categories</p>
                  <p className="text-2xl font-bold text-gray-900">{filteredCategories.length}</p>
                </div>
                <div className="crm-stat-icon crm-stat-icon-blue">
                  <FolderOpen className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="crm-stat-card crm-stat-card-green">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Active</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {filteredCategories.filter(c => c.status === 'active').length}
                  </p>
                </div>
                <div className="crm-stat-icon crm-stat-icon-green">
                  <Activity className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="crm-stat-card crm-stat-card-orange">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">With Description</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {filteredCategories.filter(c => c.description && c.description.length > 0).length}
                  </p>
                </div>
                <div className="crm-stat-icon crm-stat-icon-orange">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="crm-stat-card crm-stat-card-red">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">Inactive</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {filteredCategories.filter(c => c.status === 'inactive').length}
                  </p>
                </div>
                <div className="crm-stat-icon crm-stat-icon-red">
                  <AlertCircle className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
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
        <div className="crm-controls-container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search categories by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 border-gray-200 hover:border-gray-300 transition-colors duration-300"
                />
              </div>
            </div>
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-12 border-gray-200 hover:border-gray-300 transition-colors duration-300">
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
        <Card className="crm-table-card">
          <CardHeader className="crm-table-header">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-gray-900">
                Categories List ({filteredCategories.length})
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  Page {page} of {totalPages}
                </Badge>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table className="w-full min-w-[1000px]">
                <TableHeader>
                  <TableRow className="bg-gray-50 border-b">
                    <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">S No</TableHead>
                    <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>Date</span>
                      </div>
                    </TableHead>
                    <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">Category Name</TableHead>
                    <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">Description</TableHead>
                    <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                        <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>Status</span>
                      </div>
                    </TableHead>
                    <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCategories.map((category, idx) => (
                    <TableRow key={category.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                      <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{(page - 1) * pageSize + idx + 1}</TableCell>
                      <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{
                        (() => {
                          const dateStr = category.created_at;
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
                      <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm max-w-[300px] truncate">{category.description || '-'}</TableCell>
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
                        <div className="flex items-center justify-center gap-1 sm:gap-2">
                          <button 
                            onClick={() => handleViewCategory(category)}
                            className="action-btn-view"
                            title="View Category"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleEditCategory(category)}
                            className="action-btn-edit"
                            title="Edit Category"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteCategory(category)}
                            className="action-btn-delete"
                            title="Delete Category"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
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
              
              {/* Pagination */}
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
          </CardContent>
        </Card>

        {/* Add/Edit Category Dialog */}
        <Dialog open={isAddingCategory} onOpenChange={setIsAddingCategory}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
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
                    {editingCategory ? 'Update category information' : 'Enter the details for the new medicine category'}
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
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">Category Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter category name"
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
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium text-gray-700">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                    <SelectTrigger>
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
                <button 
                  type="button" 
                  onClick={() => {
                    setIsAddingCategory(false);
                    setEditingCategory(null);
                    setFormData({
                      name: '',
                      description: '',
                      status: 'active',
                    });
                  }}
                  className="global-btn global-btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="global-btn global-btn-primary"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      {editingCategory ? 'Updating...' : 'Adding...'}
                    </>
                  ) : (
                    editingCategory ? 'Update Category' : 'Add Category'
                  )}
                </button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Category Dialog */}
        <Dialog open={!!viewingCategory} onOpenChange={() => setViewingCategory(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader className="text-center pb-2">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Eye className="h-6 w-6 text-blue-600" />
              </div>
              <DialogTitle className="text-lg font-semibold text-gray-900">
                Category Details
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600 mt-2">
                View complete category information
              </DialogDescription>
            </DialogHeader>
            
            {viewingCategory && (
              <div className="space-y-4 p-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Category Name</Label>
                  <div className="p-3 bg-gray-50 rounded border text-sm">{viewingCategory.name}</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Description</Label>
                  <div className="p-3 bg-gray-50 rounded border text-sm">{viewingCategory.description || 'No description provided'}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Status</Label>
                    <div className="p-3 bg-gray-50 rounded border">
                      <Badge variant={viewingCategory.status === 'active' ? 'default' : 'secondary'}>
                        {viewingCategory.status.charAt(0).toUpperCase() + viewingCategory.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Created Date</Label>
                    <div className="p-3 bg-gray-50 rounded border text-sm">
                      {(() => {
                        const dateStr = viewingCategory.created_at;
                        if (!dateStr) return 'Unknown';
                        const dateObj = new Date(dateStr);
                        if (isNaN(dateObj.getTime())) return dateStr;
                        return dateObj.toLocaleDateString();
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="flex justify-center pt-4">
              <button 
                onClick={() => setViewingCategory(null)}
                className="global-btn global-btn-secondary"
              >
                Close
              </button>
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
                  <div className="text-gray-600">{categoryToDelete.description || 'No description'}</div>
                  <div className="text-gray-600 capitalize">{categoryToDelete.status}</div>
                </div>
              </div>
            )}

            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
              <button 
                type="button" 
                onClick={() => {
                  setShowDeleteDialog(false);
                  setCategoryToDelete(null);
                }}
                disabled={submitting}
                className="global-btn global-btn-secondary"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={confirmDelete}
                disabled={submitting}
                className="global-btn global-btn-danger"
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
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default CategoryManagement;
