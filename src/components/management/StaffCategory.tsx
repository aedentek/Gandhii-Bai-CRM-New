import React from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ActionButtons } from '@/components/ui/HeaderActionButtons';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, FolderOpen, RefreshCw, Activity, Clock, Eye } from 'lucide-react';
import { DatabaseService } from '@/services/databaseService';
import '@/styles/global-crm-design.css';

interface StaffCategory {
  id: number;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  quantity?: number;
  created_at: string;
  updated_at: string;
}

const StaffCategoryManagement: React.FC = () => {
  const [categories, setCategories] = React.useState<StaffCategory[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  // Load categories from MySQL on component mount
  React.useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await DatabaseService.getAllStaffCategories();
      console.log('Fetched staff categories from MySQL:', data);
      // Sort categories by ID before setting state
      const sortedData = [...data].sort((a, b) => a.id - b.id);
      setCategories(sortedData);
    } catch (error) {
      console.error('Error fetching staff categories:', error);
      // Fallback to localStorage if MySQL fails
      const stored = localStorage.getItem('staffCategories');
      if (stored) {
        const localCategories = JSON.parse(stored).map((cat: any) => ({
          ...cat,
          id: parseInt(cat.id) || cat.id,
          created_at: cat.createdAt || cat.created_at || new Date().toISOString(),
          updated_at: cat.updatedAt || cat.updated_at || new Date().toISOString()
        }));
        setCategories(localCategories);
      }
      toast({
        title: "Warning",
        description: "Could not connect to database. Using local data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const [isAddingCategory, setIsAddingCategory] = React.useState(false);
  const [isEditingCategory, setIsEditingCategory] = React.useState(false);
  const [editingCategoryId, setEditingCategoryId] = React.useState<number | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [formData, setFormData] = React.useState({
    name: '',
    description: '',
    status: 'active' as 'active' | 'inactive',
    quantity: 0,
  });

  // Month and year state for filtering
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = React.useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = React.useState(currentYear);
  const [showMonthYearDialog, setShowMonthYearDialog] = React.useState(false);
  const [filterMonth, setFilterMonth] = React.useState<number | null>(new Date().getMonth());
  const [filterYear, setFilterYear] = React.useState<number | null>(currentYear);

  // Pagination logic
  const [currentPage, setCurrentPage] = React.useState(1);
  const rowsPerPage = 10;
  React.useEffect(() => { setCurrentPage(1); }, [searchTerm, categories.length]);
  const { toast } = useToast();

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
      const newCategory = await DatabaseService.addStaffCategory({
        name: formData.name,
        description: formData.description,
        status: formData.status,
        // quantity: formData.quantity
      });
      
      // Reload categories from database to get the latest data
      await loadCategories();
      
      setFormData({ name: '', description: '', status: 'active', quantity: 0 });
      setIsAddingCategory(false);
      toast({
        title: "Success",
        description: "Category added successfully",
      });
    } catch (error) {
      console.error('Error adding category:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add category",
        variant: "destructive",
      });
    }
  };

  const handleEditCategory = (category: StaffCategory) => {
    setEditingCategoryId(category.id);
    setFormData({
      name: category.name,
      description: category.description,
      status: category.status,
      quantity: category.quantity || 0,
    });
    setIsEditingCategory(true);
  };

  const handleUpdateCategory = async () => {
    if (!formData.name || editingCategoryId === null) {
      toast({
        title: "Error",
        description: "Please enter a category name",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await DatabaseService.updateStaffCategory(editingCategoryId, {
        name: formData.name,
        description: formData.description,
        status: formData.status,
        // quantity: formData.quantity
      });
      
      // Reload categories from database to get the latest data
      await loadCategories();
      
      setIsEditingCategory(false);
      setEditingCategoryId(null);
      setFormData({ name: '', description: '', status: 'active', quantity: 0 });
      toast({
        title: "Success",
        description: "Category updated successfully",
      });
    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update category",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      await DatabaseService.deleteStaffCategory(id);
      
      // Reload categories from database to get the latest data
      await loadCategories();
      
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete category",
        variant: "destructive",
      });
    }
  };

  const filteredCategories = categories
    .filter(category => {
      const matchesSearch =
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description.toLowerCase().includes(searchTerm.toLowerCase());
      
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
          d.getMonth() === filterMonth &&
          d.getFullYear() === filterYear
        );
      }
      return matchesSearch;
    })
    .sort((a, b) => a.id - b.id); // Sort by ID in ascending order
  
  const totalPages = Math.ceil(filteredCategories.length / rowsPerPage);
  const paginatedCategories = filteredCategories.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading staff categories...</div>
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
                <FolderOpen className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Staff Categories</h1>
                <p className="text-sm sm:text-base text-gray-600">Manage staff categories and their details</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <ActionButtons.Refresh 
                onClick={() => {
                  console.log('🔄 Manual refresh triggered - refreshing entire page');
                  window.location.reload();
                }}
                loading={loading}
                disabled={loading}
              />

              <Button 
                onClick={() => setIsAddingCategory(true)}
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
                    <Activity className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Registered</span>
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
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
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
                    <Activity className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Archived</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-red">
                  <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="crm-controls-container">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="w-full sm:w-auto min-w-[150px]">
              <ActionButtons.MonthYear
                onClick={() => setShowMonthYearDialog(true)}
                text={filterMonth !== null && filterYear !== null ? 
                  `${months[filterMonth]} ${filterYear}` : 
                  'Show All'
                }
              />
            </div>
          </div>
        </div>

      <Dialog open={isAddingCategory} onOpenChange={setIsAddingCategory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>Create a new category for staff</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter category name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Enter category description"
                rows={3}
              />
            </div>
            {/* <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
                placeholder="Enter quantity"
              />
            </div> */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="w-full border rounded px-3 py-2"
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button 
                className="global-btn"
                onClick={handleAddCategory}
              >
                Add Category
              </Button>
              <Button 
                className="global-btn"
                onClick={() => setIsAddingCategory(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
                    <FolderOpen className="h-3 w-3 sm:h-4 sm:w-4" />
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
                  <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Created Date</span>
                    <span className="sm:hidden">Date</span>
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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="px-2 sm:px-3 lg:px-4 py-8 text-center text-gray-500">
                    Loading categories...
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCategories.map((category, idx) => (
                  <TableRow key={category.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{(currentPage - 1) * rowsPerPage + idx + 1}</TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 font-medium text-center text-xs sm:text-sm max-w-[100px] sm:max-w-[120px] truncate">{category.name}</TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm max-w-[150px] sm:max-w-[200px] truncate">{category.description}</TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center whitespace-nowrap">
                      <Badge className={`${category.status === 'active' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'} text-xs`}>
                        {category.status.charAt(0).toUpperCase() + category.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">
                      {(() => {
                        const dateStr = category.created_at;
                        if (!dateStr) return <span className="text-gray-400 text-xs">Not Set</span>;
                        const date = new Date(dateStr);
                        if (isNaN(date.getTime())) return dateStr;
                        const [y, m, d] = date.toISOString().split('T')[0].split('-');
                        return `${d}/${m}/${y}`;
                      })()}
                    </TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center whitespace-nowrap">
                      <div className="action-buttons-container">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditCategory(category)}
                          className="action-btn-lead action-btn-edit h-8 w-8 sm:h-9 sm:w-9 p-0"
                          title="Edit Category"
                        >
                          <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCategory(category.id)}
                          className="action-btn-lead action-btn-delete h-8 w-8 sm:h-9 sm:w-9 p-0"
                          title="Delete Category"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {!loading && filteredCategories.length === 0 && (
            <div className="text-center py-12 bg-white">
              <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No categories found</h3>
              <p className="text-sm text-gray-500">
                No categories match your search criteria. Try adjusting your filters.
              </p>
            </div>
          )}
        </div>

        {/* Mobile Responsive Pagination */}
        {totalPages > 1 && (
          <div className="crm-pagination-container">
            {/* Pagination Info */}
            <div className="text-xs sm:text-sm text-gray-600 order-2 sm:order-1">
              <span className="hidden sm:inline">
                Page {currentPage} of {totalPages} 
                ({filteredCategories.length} total categories)
              </span>
              <span className="sm:hidden">
                {currentPage} / {totalPages}
              </span>
            </div>
            
            {/* Pagination Controls */}
            <div className="flex items-center gap-2 order-1 sm:order-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="bg-white hover:bg-gray-50 text-gray-600 border-gray-300 text-xs sm:text-sm px-2 sm:px-3"
              >
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">Prev</span>
              </Button>
              
              {/* Page Numbers for Desktop */}
              <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNumber;
                  
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNumber}
                      variant={currentPage === pageNumber ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`w-8 h-8 p-0 text-xs ${
                        currentPage === pageNumber 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600' 
                          : 'bg-white hover:bg-gray-50 text-gray-600 border-gray-300'
                      }`}
                    >
                      {pageNumber}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="bg-white hover:bg-gray-50 text-gray-600 border-gray-300 text-xs sm:text-sm px-2 sm:px-3"
              >
                <span className="hidden sm:inline">Next</span>
                <span className="sm:hidden">Next</span>
              </Button>
            </div>
          </div>
        )}
        </CardContent>
      </Card>

      {/* Month/Year Picker Dialog */}
      <Dialog open={showMonthYearDialog} onOpenChange={setShowMonthYearDialog}>
        <DialogContent className="sm:max-w-[350px]">
          <DialogHeader>
            <DialogTitle>Select Month & Year</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex gap-2">
              <select
                className="border rounded px-3 py-2 flex-1"
                value={selectedMonth}
                onChange={e => setSelectedMonth(Number(e.target.value))}
              >
                {months.map((month, idx) => (
                  <option key={month} value={idx}>{month}</option>
                ))}
              </select>
              <select
                className="border rounded px-3 py-2 flex-1"
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
              >
                {[...Array(10)].map((_, i) => (
                  <option key={currentYear - 5 + i} value={currentYear - 5 + i}>{currentYear - 5 + i}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button 
                type="button" 
                className="global-btn"
                onClick={() => setShowMonthYearDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                className="global-btn"
                onClick={() => {
                  setFilterMonth(selectedMonth);
                  setFilterYear(selectedYear);
                  setShowMonthYearDialog(false);
                }}
              >
                Submit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={isEditingCategory} onOpenChange={setIsEditingCategory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Update the details for this category</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Category Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter category name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Enter category description"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-quantity">Quantity</Label>
              <Input
                id="edit-quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
                placeholder="Enter quantity"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <select
                id="edit-status"
                className="w-full border rounded px-3 py-2"
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button 
                className="global-btn"
                onClick={handleUpdateCategory}
              >
                Update Category
              </Button>
              <Button 
                className="global-btn"
                onClick={() => setIsEditingCategory(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
};

export default StaffCategoryManagement;
