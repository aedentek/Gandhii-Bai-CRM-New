import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ActionButtons } from '@/components/ui/HeaderActionButtons';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, FolderOpen, CheckCircle, XCircle, Stethoscope, Activity, Users, TrendingUp, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { DatabaseService } from '@/services/databaseService';
import LoadingScreen from '@/components/shared/LoadingScreen';
import usePageTitle from '@/hooks/usePageTitle';
import '@/styles/global-crm-design.css';

interface DoctorCategoryType {
  id: number;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at?: string;
}

const DoctorCategory: React.FC = () => {
  // Set page title
  usePageTitle();

  const [categories, setCategories] = React.useState<DoctorCategoryType[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isAddingCategory, setIsAddingCategory] = React.useState(false);
  const [isEditingCategory, setIsEditingCategory] = React.useState(false);
  const [editingCategoryId, setEditingCategoryId] = React.useState<number | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [deleteCategory, setDeleteCategory] = React.useState<DoctorCategoryType | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: '',
    description: '',
    status: 'active' as 'active' | 'inactive',
  });

  React.useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await DatabaseService.getAllDoctorCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading doctor categories:', error);
      toast({
        title: "Error",
        description: "Failed to load doctor categories",
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
    if (categories.some(cat => cat.name.toLowerCase() === formData.name.toLowerCase())) {
      toast({
        title: "Duplicate",
        description: "Category already exists",
        variant: "destructive",
      });
      return;
    }
    try {
      await DatabaseService.addDoctorCategory({
        name: formData.name,
        description: formData.description,
        status: formData.status,
      });
      await loadCategories(); // Reload the data
      setFormData({ name: '', description: '', status: 'active' });
      setIsAddingCategory(false);
      toast({
        title: "Success",
        description: "Category added successfully",
      });
    } catch (error) {
      console.error('Error adding category:', error);
      toast({
        title: "Error",
        description: "Failed to add category",
        variant: "destructive",
      });
    }
  };

  const handleEditCategory = (category: DoctorCategoryType) => {
    setEditingCategoryId(category.id);
    setFormData({
      name: category.name,
      description: category.description,
      status: category.status,
    });
    setIsEditingCategory(true);
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
      await DatabaseService.updateDoctorCategory(editingCategoryId!, {
        name: formData.name,
        description: formData.description,
        status: formData.status,
      });
      await loadCategories(); // Reload the data
      setIsEditingCategory(false);
      setEditingCategoryId(null);
      setFormData({ name: '', description: '', status: 'active' });
      toast({
        title: "Success",
        description: "Category updated successfully",
      });
    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (category: DoctorCategoryType) => {
    setDeleteCategory(category);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteCategory = async () => {
    if (!deleteCategory) return;
    
    try {
      await DatabaseService.deleteDoctorCategory(deleteCategory.id);
      await loadCategories(); // Reload the data
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
      setShowDeleteConfirm(false);
      setDeleteCategory(null);
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      await DatabaseService.deleteDoctorCategory(id);
      await loadCategories(); // Reload the data
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
    }
  };


  // Pagination state
  const [currentPage, setCurrentPage] = React.useState(1);
  const rowsPerPage = 10;

  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || category.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleEdit = (category: DoctorCategoryType) => {
    setEditingCategoryId(category.id);
    setFormData({
      name: category.name,
      description: category.description,
      status: category.status,
    });
    setIsEditingCategory(true);
  };

  const handleDelete = (category: DoctorCategoryType) => {
    setDeleteCategory(category);
    setShowDeleteConfirm(true);
  };

  const totalPages = Math.ceil(filteredCategories.length / rowsPerPage);
  const paginatedCategories = filteredCategories.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  if (loading) {
    return <LoadingScreen message="Loading doctor categories..." />;
  }

  return (
    <div className="crm-page-bg">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* CRM Header */}
        <div className="crm-header-container">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
            <div className="flex items-center gap-3">
              <div className="crm-header-icon">
                <FolderOpen className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Doctor Categories</h1>
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

        {/* Professional Stats Cards */}
        <div className="crm-stats-grid">
          {/* Total Categories Card */}
          <Card className="crm-stat-card crm-stat-card-blue">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-blue-700 mb-1 truncate">Total Categories</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-900 mb-1">{categories.length}</p>
                  <div className="flex items-center text-xs text-blue-600">
                    <FolderOpen className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">All types</span>
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
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-900 mb-1">{categories.filter(c => c.status === 'active').length}</p>
                  <div className="flex items-center text-xs text-green-600">
                    <CheckCircle className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">In use</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-green">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
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
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-900 mb-1">{categories.filter(c => c.status === 'inactive').length}</p>
                  <div className="flex items-center text-xs text-red-600">
                    <XCircle className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Disabled</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-red">
                  <XCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Specializations Card */}
          <Card className="crm-stat-card crm-stat-card-orange">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-orange-700 mb-1 truncate">Specializations</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-900 mb-1">{categories.filter(c => c.status === 'active').length}</p>
                  <div className="flex items-center text-xs text-orange-600">
                    <Stethoscope className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Available</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-orange">
                  <Stethoscope className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
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
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>



      {/* Add Category Dialog */}
      <Dialog open={isAddingCategory} onOpenChange={setIsAddingCategory}>
        <DialogContent className="crm-modal-container">
          <DialogHeader className="editpopup form dialog-header">
            <div className="editpopup form icon-title-container">
              <div className="editpopup form dialog-icon">
                <Plus className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div className="editpopup form title-description">
                <DialogTitle className="editpopup form dialog-title">
                  Add New Category
                </DialogTitle>
                <DialogDescription className="editpopup form dialog-description">
                  Create a new category for doctors
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="editpopup form crm-edit-form-content">
            <div className="editpopup form crm-edit-form-group">
              <Label htmlFor="name" className="editpopup form crm-edit-form-label flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                Category Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter category name"
                className="editpopup form crm-edit-form-input"
              />
            </div>
            
            <div className="editpopup form crm-edit-form-group">
              <Label htmlFor="description" className="editpopup form crm-edit-form-label flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Enter category description"
                rows={3}
                className="editpopup form crm-edit-form-input"
              />
            </div>
            
            <div className="editpopup form crm-edit-form-group">
              <Label htmlFor="status" className="editpopup form crm-edit-form-label flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Status
              </Label>
              <select
                id="status"
                className="editpopup form crm-edit-form-select"
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          
          <DialogFooter className="editpopup form dialog-footer flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
            <Button 
              variant="outline" 
              onClick={() => setIsAddingCategory(false)}
              className="editpopup form footer-button-cancel w-full sm:w-auto modern-btn modern-btn-secondary"
            >
              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleAddCategory}
              className="editpopup form footer-button-save w-full sm:w-auto global-btn"
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Add Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

        {/* Categories Table */}
        <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-xl shadow-sm overflow-hidden">
          <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gray-50/50">
            <div className="flex items-center text-base sm:text-lg font-semibold text-gray-900">
              <FolderOpen className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              <span className="hidden sm:inline">Categories List ({filteredCategories.length})</span>
              <span className="sm:hidden">Categories ({filteredCategories.length})</span>
            </div>
          </div>
        
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="bg-gray-50 border-b">
                  <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">S No</TableHead>
                  <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">Category Name</TableHead>
                  <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">Description</TableHead>
                  <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">Status</TableHead>
                  <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">Created Date</TableHead>
                  <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.length > 0 ? (
                paginatedCategories.map((category, idx) => (
                  <TableRow key={category.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{(currentPage - 1) * rowsPerPage + idx + 1}</TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 font-medium text-center text-xs sm:text-sm whitespace-nowrap">{category.name}</TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm max-w-xs truncate">{category.description}</TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">
                      <Badge variant={category.status === 'active' ? 'default' : 'secondary'} className={category.status === 'active' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}>
                        {category.status.charAt(0).toUpperCase() + category.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{
                      (() => {
                        const dateStr = category.created_at;
                        if (!dateStr) return '';
                        const date = new Date(dateStr);
                        if (!isNaN(date.getTime())) {
                          return date.toLocaleDateString('en-GB');
                        }
                        return dateStr;
                      })()
                    }</TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1 sm:gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleEditCategory(category)}
                          className="action-btn-lead action-btn-edit h-8 w-8 sm:h-9 sm:w-9 p-0"
                          title="Edit Category"
                        >
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleDeleteClick(category)}
                          className="action-btn-lead action-btn-delete h-8 w-8 sm:h-9 sm:w-9 p-0"
                          title="Delete Category"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No categories found.
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
              {(() => {
                const start = (currentPage - 1) * rowsPerPage + 1;
                const end = Math.min(currentPage * rowsPerPage, filteredCategories.length);
                return `Showing ${start} to ${end} of ${filteredCategories.length} categories`;
              })()}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 px-3"
              >
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
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
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 px-3"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Category Dialog */}
      <Dialog open={isEditingCategory} onOpenChange={setIsEditingCategory}>
        <DialogContent className="crm-modal-container">
          <DialogHeader className="editpopup form dialog-header">
            <div className="editpopup form icon-title-container">
              <div className="editpopup form dialog-icon">
                <Edit className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div className="editpopup form title-description">
                <DialogTitle className="editpopup form dialog-title">
                  Edit Category
                </DialogTitle>
                <DialogDescription className="editpopup form dialog-description">
                  Update the details for this category
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="editpopup form crm-edit-form-content">
            <div className="editpopup form crm-edit-form-group">
              <Label htmlFor="edit-name" className="editpopup form crm-edit-form-label flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                Category Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter category name"
                className="editpopup form crm-edit-form-input"
              />
            </div>
            
            <div className="editpopup form crm-edit-form-group">
              <Label htmlFor="edit-description" className="editpopup form crm-edit-form-label flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Description
              </Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Enter category description"
                rows={3}
                className="editpopup form crm-edit-form-input"
              />
            </div>
            
            <div className="editpopup form crm-edit-form-group">
              <Label htmlFor="edit-status" className="editpopup form crm-edit-form-label flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Status
              </Label>
              <select
                id="edit-status"
                className="editpopup form crm-edit-form-select"
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          
          <DialogFooter className="editpopup form dialog-footer flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
            <Button 
              variant="outline" 
              onClick={() => setIsEditingCategory(false)}
              className="editpopup form footer-button-cancel w-full sm:w-auto modern-btn modern-btn-secondary"
            >
              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateCategory}
              className="editpopup form footer-button-save w-full sm:w-auto global-btn"
            >
              <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Update Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
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
          
          {deleteCategory && (
            <div className="mx-4 my-4 p-4 bg-gray-50 rounded-lg border">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4 text-gray-500" />
                  <span className="font-medium text-gray-900">{deleteCategory.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">{deleteCategory.description || 'No description'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Status: {deleteCategory.status}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="editpopup form dialog-footer flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteConfirm(false)}
              className="editpopup form footer-button-cancel w-full sm:w-auto modern-btn modern-btn-secondary"
            >
              <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteCategory}
              className="editpopup form footer-button-delete w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Delete Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
};

export default DoctorCategory;
