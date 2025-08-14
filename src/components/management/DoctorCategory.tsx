import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, FolderOpen, CheckCircle, XCircle, Stethoscope } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { DatabaseService } from '@/services/databaseService';
import LoadingScreen from '@/components/shared/LoadingScreen';

interface DoctorCategoryType {
  id: number;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at?: string;
}

const DoctorCategory: React.FC = () => {
  const [categories, setCategories] = React.useState<DoctorCategoryType[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isAddingCategory, setIsAddingCategory] = React.useState(false);
  const [isEditingCategory, setIsEditingCategory] = React.useState(false);
  const [editingCategoryId, setEditingCategoryId] = React.useState<number | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
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

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCategories.length / rowsPerPage);
  const paginatedCategories = filteredCategories.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  if (loading) {
    return <LoadingScreen message="Loading doctor categories..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Professional Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 hover:shadow-md hover:scale-[1.01] transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center transition-all duration-300 hover:bg-blue-700 hover:scale-110">
                <FolderOpen className="w-6 h-6 text-white transition-transform duration-300 hover:rotate-3" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 transition-colors duration-300 hover:text-blue-600">Doctor Categories</h1>
                <p className="text-sm text-gray-600 mt-1">Manage doctor specializations and categories</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => setIsAddingCategory(true)}
                className="flex items-center space-x-2 hover:scale-105 transition-all duration-300 hover:shadow-md bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 transition-transform duration-300 hover:scale-110" />
                <span className="font-medium">Add Category</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Professional Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500"></div>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors duration-300">
                  <FolderOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Total Categories</p>
                  <p className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">{categories.length}</p>
                </div>
              </div>
              <div className="mt-4 h-1 bg-blue-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-green-500"></div>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors duration-300">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Active Categories</p>
                  <p className="text-2xl font-bold text-gray-900 group-hover:text-green-600 transition-colors duration-300">{categories.filter(c => c.status === 'active').length}</p>
                </div>
              </div>
              <div className="mt-4 h-1 bg-green-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-orange-500"></div>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors duration-300">
                  <XCircle className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Inactive Categories</p>
                  <p className="text-2xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors duration-300">{categories.filter(c => c.status === 'inactive').length}</p>
                </div>
              </div>
              <div className="mt-4 h-1 bg-orange-200 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-purple-500"></div>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors duration-300">
                  <Stethoscope className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Specializations</p>
                  <p className="text-2xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors duration-300">{categories.filter(c => c.status === 'active').length}</p>
                </div>
              </div>
              <div className="mt-4 h-1 bg-purple-200 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              </div>
            </CardContent>
          </Card>
        </div>

      <Dialog open={isAddingCategory} onOpenChange={setIsAddingCategory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>Create a new category for doctors</DialogDescription>
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
              <Button onClick={handleAddCategory}>Add Category</Button>
              <Button variant="outline" onClick={() => setIsAddingCategory(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>


        {/* Search Section */}
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
                          className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 hover:border-blue-400 rounded-lg"
                          title="Edit Category"
                        >
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleDeleteClick(category)}
                          className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-400 rounded-lg"
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
              <Button onClick={handleUpdateCategory}>Update Category</Button>
              <Button variant="outline" onClick={() => setIsEditingCategory(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-sm border-blue-200 shadow-xl">
          <DialogHeader className="text-center border-b border-blue-200/30 pb-4">
            <DialogTitle className="text-red-600 font-semibold">Delete Category</DialogTitle>
            <DialogDescription className="text-center text-blue-700">
              Are you sure you want to delete the category <strong className="text-blue-800">"{deleteCategory?.name}"</strong>?
              <br />
              <span className="text-red-600 font-medium">This action cannot be undone.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="justify-center space-x-4 pt-4">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="border-blue-200 text-blue-600 hover:bg-blue-50">
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteCategory} className="bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-300">
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
