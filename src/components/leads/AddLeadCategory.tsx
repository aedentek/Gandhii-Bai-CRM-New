import React from 'react';
import { DatabaseService } from '@/services/databaseService';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit2, Trash2, FolderOpen, ChevronLeft, ChevronRight, RefreshCw, Download, Users, Activity, Calendar } from 'lucide-react';
import '../../styles/modern-forms.css';
import '../../styles/modern-tables.css';
import '../../styles/modern-settings.css';

interface LeadCategory {
  id: string;
  name: string;
  description: string;
  status?: 'active' | 'inactive';
  createdAt?: string;
}

const AddLeadCategory: React.FC = () => {
  const [categories, setCategories] = React.useState<LeadCategory[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isAddingCategory, setIsAddingCategory] = React.useState(false);
  const [isEditingCategory, setIsEditingCategory] = React.useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [editingCategoryId, setEditingCategoryId] = React.useState<string | null>(null);
  const [categoryToDelete, setCategoryToDelete] = React.useState<LeadCategory | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [formData, setFormData] = React.useState({
    name: '',
    description: '',
    status: 'active' as 'active' | 'inactive',
  });

  const { toast } = useToast();
  const itemsPerPage = 10;

  React.useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await DatabaseService.getAllLeadCategories();
      // Ensure data is an array and has valid status
      const processedData = Array.isArray(data) ? data.map(category => ({
        ...category,
        status: category?.status || 'inactive'
      })) : [];
      setCategories(processedData);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to connect to the server. Please ensure the backend server is running on port 4000.');
      setCategories([]);
      toast({
        title: "Connection Error",
        description: "Failed to connect to the server. Please check if the backend is running.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
      setSubmitting(true);
      await DatabaseService.addLeadCategory({
        name: formData.name,
        description: formData.description,
        status: formData.status,
      });
      fetchCategories();
      setFormData({ name: '', description: '', status: 'active' });
      setIsAddingCategory(false);
      toast({
        title: "Success",
        description: "Category added successfully",
      });
    } catch (err) {
      toast({ title: "Error", description: "Failed to add category", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditCategory = (category: LeadCategory) => {
    setEditingCategoryId(category.id);
    setFormData({
      name: category.name,
      description: category.description,
      status: category.status,
    });
    setIsEditingCategory(true);
  };

  const handleUpdateCategory = async () => {
    if (!formData.name || !editingCategoryId) {
      toast({
        title: "Error",
        description: "Please enter a category name",
        variant: "destructive",
      });
      return;
    }
    try {
      setSubmitting(true);
      const oldCategory = categories.find(cat => cat.id === editingCategoryId);
      if (!oldCategory) {
        toast({
          title: "Error",
          description: "Category not found",
          variant: "destructive",
        });
        return;
      }
      const oldCategoryName = oldCategory.name;
      
      const updatedCategory = await DatabaseService.updateLeadCategory(editingCategoryId, {
        name: formData.name,
        description: formData.description,
        status: formData.status,
      });
      
      try {
        // Only update references if the name has changed
        if (oldCategoryName && oldCategoryName !== formData.name) {
          await DatabaseService.updateLeadCategoryReferences(oldCategoryName, formData.name);
        }

        // Update the categories state with the new data
        setCategories(prevCategories => 
          prevCategories.map(cat => 
            cat.id === editingCategoryId ? updatedCategory : cat
          )
        );

        setIsEditingCategory(false);
        setEditingCategoryId(null);
        setFormData({ name: '', description: '', status: 'active' });
        
        // Notify other components about the update
        window.dispatchEvent(new CustomEvent('leadCategoryUpdated', {
          detail: { oldName: oldCategoryName, newName: formData.name }
        }));
        
        toast({
          title: "Success",
          description: "Category updated successfully and all related leads have been updated",
        });
      } catch (refError) {
        console.error('Error updating category references:', refError);
        toast({
          title: "Warning",
          description: "Category updated but some references may not have been updated",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to update category", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      setSubmitting(true);
      await DatabaseService.deleteLeadCategory(id);
      fetchCategories();
      setShowDeleteDialog(false);
      setCategoryToDelete(null);
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete category", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCategories = filteredCategories.slice(startIndex, endIndex);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  React.useEffect(() => {
    console.log('Categories Data:', {
      totalCategories: categories.length,
      categories: categories,
      timestamp: new Date().toISOString()
    });
  }, [categories]);

  // Log filtered and paginated data whenever they change
  React.useEffect(() => {
    console.log('Categories State:', {
      filtered: {
        total: filteredCategories.length,
        data: filteredCategories
      },
      paginated: {
        currentPage,
        itemsPerPage,
        total: paginatedCategories.length,
        data: paginatedCategories
      },
      timestamp: new Date().toISOString()
    });
  }, [filteredCategories, paginatedCategories, currentPage]);

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-6 max-w-full">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Lead Categories</h1>
        <Card className="p-8 text-center">
          <div className="text-lg">Loading categories...</div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 space-y-6 max-w-full">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Lead Categories</h1>
        <Card className="p-8 text-center border-red-200 bg-red-50">
          <div className="text-red-700 text-lg font-medium mb-2">Connection Error</div>
          <div className="text-red-600 mb-4">{error}</div>
          <Button onClick={fetchCategories} variant="outline">
            Try Again
          </Button>
        </Card>
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
                <FolderOpen className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Lead Categories</h1>
                {/* <p className="text-sm text-gray-600 mt-1">Manage and organize your lead categories</p> */}
              </div>
            </div>
          
            <div className="flex flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              <Button 
                onClick={() => {
                  setLoading(true);
                  fetchCategories();
                }}
                disabled={loading}
                className="global-btn flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
              >
                <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
                <span className="sm:hidden">↻</span>
              </Button>
              
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6">
          <div className="modern-stat-card stat-card-blue">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FolderOpen className="h-3 w-3 sm:h-5 sm:w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-lg sm:text-2xl font-bold text-gray-900">{categories.length}</div>
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
                  {categories.filter(c => c.status === 'active').length}
                </div>
                <div className="text-xs text-gray-600">Active</div>
              </div>
            </div>
          </div>
          
          <div className="modern-stat-card stat-card-orange">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Users className="h-3 w-3 sm:h-5 sm:w-5 text-orange-600" />
              </div>
              <div>
                <div className="text-lg sm:text-2xl font-bold text-gray-900">
                  {categories.filter(c => c.status === 'inactive').length}
                </div>
                <div className="text-xs text-gray-600">Inactive</div>
              </div>
            </div>
          </div>
          
          <div className="modern-stat-card stat-card-purple">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-3 w-3 sm:h-5 sm:w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-lg sm:text-2xl font-bold text-gray-900">
                  {filteredCategories.length}
                </div>
                <div className="text-xs text-gray-600">Filtered</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search Controls */}
        <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-xl p-4 shadow-sm">
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
          </div>
        </div>

        {/* Categories Table */}
        <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-xl shadow-sm overflow-hidden">
          <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gray-50/50">
            <div className="flex items-center text-base sm:text-lg font-semibold text-gray-900">
              <FolderOpen className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              <span className="hidden sm:inline">Categories List ({filteredCategories.length})</span>
              <span className="sm:hidden">Categories ({filteredCategories.length})</span>
            </div>
          </div>

        {/* Add Category Dialog */}
        <Dialog open={isAddingCategory} onOpenChange={setIsAddingCategory}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader className="relative pb-3 sm:pb-4 md:pb-6 border-b border-blue-100 px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Plus className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-gray-900">
                    Add New Category
                  </DialogTitle>
                  <DialogDescription className="text-gray-600 mt-1">
                    Create a new lead category to organize your leads
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <form
              onSubmit={e => {
                e.preventDefault();
                handleAddCategory();
              }}
              className="space-y-4 p-3 sm:p-4 md:p-6"
            >
              <div className="grid grid-cols-1 gap-4">
                <div>
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
                <div>
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
                <div>
                  <Label htmlFor="status" className="text-sm font-medium text-gray-700">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as 'active' | 'inactive' })}>
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
                    setFormData({ name: '', description: '', status: 'active' });
                  }}
                  disabled={submitting}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full sm:w-auto global-btn"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Category
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Category Dialog */}
        <Dialog open={isEditingCategory} onOpenChange={setIsEditingCategory}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader className="relative pb-3 sm:pb-4 md:pb-6 border-b border-blue-100 px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Edit2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-gray-900">
                    Edit Category
                  </DialogTitle>
                  <DialogDescription className="text-gray-600 mt-1">
                    Update the details for this category
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <form
              onSubmit={e => {
                e.preventDefault();
                handleUpdateCategory();
              }}
              className="space-y-4 p-3 sm:p-4 md:p-6"
            >
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="edit-name" className="text-sm font-medium text-gray-700">Category Name *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter category name"
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description" className="text-sm font-medium text-gray-700">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Enter category description (optional)"
                    className="mt-1"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-status" className="text-sm font-medium text-gray-700">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as 'active' | 'inactive' })}>
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
                    setIsEditingCategory(false);
                    setEditingCategoryId(null);
                    setFormData({ name: '', description: '', status: 'active' });
                  }}
                  disabled={submitting}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full sm:w-auto global-btn"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Update Category
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        
        {/* Scrollable Table View for All Screen Sizes */}
        <div className="overflow-x-auto">
          <Table className="w-full min-w-[800px]">
            <TableHeader>
              <TableRow className="bg-gray-50 border-b">
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  S No
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  Category Name
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  Description
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                    <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Status</span>
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Created Date</span>
                    <span className="sm:hidden">Date</span>
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCategories.map((category, idx) => (
                <TableRow key={category.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">
                    {startIndex + idx + 1}
                  </TableCell>
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 font-medium text-center text-xs sm:text-sm whitespace-nowrap">
                    {category.name}
                  </TableCell>
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm">
                    <div className="max-w-[120px] sm:max-w-[200px] truncate" title={category.description}>
                      {category.description || '-'}
                    </div>
                  </TableCell>
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">
                    <Badge 
                      variant={category?.status === 'active' ? 'default' : 'secondary'}
                      className={`
                        ${category?.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}
                      `}
                    >
                      {(category?.status || 'inactive').charAt(0).toUpperCase() + (category?.status || 'inactive').slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">
                    {(() => {
                      const dateStr = category.createdAt;
                      if (!dateStr) return '-';
                      
                      const date = new Date(dateStr);
                      if (!isNaN(date.getTime())) {
                        const day = String(date.getDate()).padStart(2, '0');
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const year = date.getFullYear();
                        return `${day}/${month}/${year}`;
                      }
                      
                      if (dateStr.includes('-')) {
                        const [y, m, d] = dateStr.split('-');
                        if (y && m && d && y.length === 4) {
                          return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
                        }
                      }
                      
                      return dateStr;
                    })()}
                  </TableCell>
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">
                    <div className="flex items-center justify-center gap-2 sm:gap-3">
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
                        onClick={() => {
                          setCategoryToDelete(category);
                          setShowDeleteDialog(true);
                        }}
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
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-white/90 backdrop-blur-sm rounded-lg">
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredCategories.length)} of {filteredCategories.length} categories
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="h-8 px-3"
              >
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let page;
                  if (totalPages <= 5) {
                    page = i + 1;
                  } else if (currentPage <= 3) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i;
                  } else {
                    page = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="h-8 w-8 p-0"
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="h-8 px-3"
              >
                Next
              </Button>
            </div>
          </div>
        )}
        </div>

        
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
                  <div className="text-gray-600">Status: {categoryToDelete.status || 'inactive'}</div>
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
                className="modern-btn modern-btn-secondary w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={() => categoryToDelete && handleDeleteCategory(categoryToDelete.id)}
                disabled={submitting}
                className="modern-btn modern-btn-danger w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
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

export default AddLeadCategory;
