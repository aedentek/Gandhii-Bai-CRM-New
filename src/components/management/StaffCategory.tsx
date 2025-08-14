import React from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, FolderOpen, RefreshCw } from 'lucide-react';
import { DatabaseService } from '@/services/databaseService';

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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Professional Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 hover:shadow-md hover:scale-[1.01] transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center transition-all duration-300 hover:bg-purple-700 hover:scale-110">
                <FolderOpen className="w-6 h-6 text-white transition-transform duration-300 hover:rotate-3" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 transition-colors duration-300 hover:text-purple-600">Staff Categories</h1>
                <p className="text-sm text-gray-600 mt-1">Manage staff categories and their details</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button 
                onClick={() => loadCategories()}
                disabled={loading}
                variant="outline"
                className="modern-btn modern-btn-primary flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''} transition-transform duration-300 hover:rotate-180`} />
                <span className="font-medium">Refresh</span>
              </Button>

              <Button 
                onClick={() => setIsAddingCategory(true)}
                className="flex items-center space-x-2 hover:scale-105 transition-all duration-300 hover:shadow-md bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="h-4 w-4 transition-transform duration-300 hover:scale-110" />
                <span className="font-medium">Add Category</span>
              </Button>
            </div>
          </div>
        </div>
        {/* Professional Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500"></div>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors duration-300">
                  <FolderOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Total Categories</p>
                  <p className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">{filteredCategories.length}</p>
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
                  <Plus className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Active Categories</p>
                  <p className="text-2xl font-bold text-gray-900 group-hover:text-green-600 transition-colors duration-300">{filteredCategories.filter(c => c.status === 'active').length}</p>
                </div>
              </div>
              <div className="mt-4 h-1 bg-green-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-purple-500"></div>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors duration-300">
                  <Trash2 className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Inactive Categories</p>
                  <p className="text-2xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors duration-300">{filteredCategories.filter(c => c.status === 'inactive').length}</p>
                </div>
              </div>
              <div className="mt-4 h-1 bg-purple-200 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              </div>
            </CardContent>
          </Card>
        </div>

      {/* Search and Filter Section */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            
            <button
              type="button"
              className="modern-btn modern-btn-outline"
              onClick={() => setShowMonthYearDialog(true)}
            >
              {months[filterMonth !== null ? filterMonth : selectedMonth]} {filterYear !== null ? filterYear : selectedYear}
            </button>
            
            <button
              onClick={() => {
                setFilterMonth(null);
                setFilterYear(null);
              }}
              className="modern-btn modern-btn-outline"
            >
              Show All
            </button>
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
              <Button onClick={handleAddCategory}>Add Category</Button>
              <Button variant="outline" onClick={() => setIsAddingCategory(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Categories Table */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-800">Categories List ({filteredCategories.length})</h2>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">S NO</TableHead>
                <TableHead className="text-center">Category Name</TableHead>
                <TableHead className="text-center">Description</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Created Date</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Loading categories...
                  </TableCell>
                </TableRow>
              ) : filteredCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No categories found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCategories.map((category, idx) => (
                <TableRow key={category.id} className="text-center">
                  <TableCell className="align-middle">{(currentPage - 1) * rowsPerPage + idx + 1}</TableCell>
                  <TableCell className="font-medium align-middle">{category.name}</TableCell>
                  <TableCell className="align-middle">{category.description}</TableCell>
                  <TableCell className="align-middle">
                    <Badge variant={category.status === 'active' ? 'default' : 'secondary'}>
                      {category.status.charAt(0).toUpperCase() + category.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="align-middle">{
                    (() => {
                      const dateStr = category.created_at;
                      if (!dateStr) return '';
                      // Handle both full timestamp and date-only formats
                      const date = new Date(dateStr);
                      if (isNaN(date.getTime())) return dateStr;
                      const [y, m, d] = date.toISOString().split('T')[0].split('-');
                      return `${d}-${m}-${y}`;
                    })()
                  }</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleEditCategory(category)}
                        className="h-8 px-3 text-xs font-medium transition-all duration-200 shadow-sm hover:scale-105 bg-orange-50 border border-orange-200 text-orange-700 hover:bg-orange-600 hover:text-white hover:border-orange-600"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleDeleteCategory(category.id)}
                        className="h-8 px-3 text-xs font-medium transition-all duration-200 shadow-sm hover:scale-105 bg-red-50 border border-red-200 text-red-700 hover:bg-red-600 hover:text-white hover:border-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )))}
            </TableBody>
          </Table>
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 mt-4 px-6 pb-4">
              <div className="text-sm text-gray-700">
                {(() => {
                  const start = (currentPage - 1) * rowsPerPage + 1;
                  const end = Math.min(currentPage * rowsPerPage, filteredCategories.length);
                  return `Showing ${start} to ${end} of ${filteredCategories.length} categories`;
                })()}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded px-4 py-2 font-medium text-gray-500 border-gray-300 disabled:opacity-60"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <Button
                    key={i + 1}
                    size="sm"
                    variant={currentPage === i + 1 ? undefined : "outline"}
                    className={
                      (currentPage === i + 1 ? "bg-green-600 text-white border-green-600 hover:bg-green-700" : "text-gray-700 border-gray-300") +
                      " rounded px-4 py-2 font-medium"
                    }
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </Button>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded px-4 py-2 font-medium text-gray-500 border-gray-300 disabled:opacity-60"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>

      </div>

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
              <Button type="button" onClick={() => setShowMonthYearDialog(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={() => {
                setFilterMonth(selectedMonth);
                setFilterYear(selectedYear);
                setShowMonthYearDialog(false);
              }}>
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
              <Button onClick={handleUpdateCategory}>Update Category</Button>
              <Button variant="outline" onClick={() => setIsEditingCategory(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffCategoryManagement;
