
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ActionButtons } from '@/components/ui/HeaderActionButtons';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Download, Search, Users, Plus, Eye, Edit2, Trash2, RefreshCw, Activity, UserCheck, UserX, Clock, User, Mail, Phone, MapPin, Calendar, DollarSign, X, IdCard, FileText, Briefcase } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { parseISO, format as formatDate } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { DatabaseService } from '@/services/databaseService';
import { getStaffFileUrl } from '@/services/staffFileUpload';
import usePageTitle from '@/hooks/usePageTitle';
import '@/styles/global-crm-design.css';
import '../../styles/modern-forms.css';
import '../../styles/modern-tables.css';

const StaffManagement: React.FC = () => {
  // Set page title
  usePageTitle();

  const [staff, setStaff] = useState<any[]>([]);
  const [staffCategories, setStaffCategories] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewStaff, setViewStaff] = useState<any | null>(null);
  const [editStaff, setEditStaff] = useState<any | null>(null);
  
  // Helper function to get image URL (handles both base64 and file paths)
  const getImageUrl = (imageData: string | undefined | null): string => {
    if (!imageData) return '';
    
    // If it's base64 data, return as is
    if (imageData.startsWith('data:image/')) {
      return imageData;
    }
    
    // If it's a file path, use the file URL helper
    return getStaffFileUrl(imageData);
  };
  
  // Handle photo file selection and conversion to base64
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Size validation - 5MB limit
    if (file.size > 5 * 1024 * 1024) {
      alert('File size should be less than 5MB');
      return;
    }

    // Validate file type and extension
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, or GIF)');
      return;
    }

    // Read file and convert to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        if (typeof e.target?.result === 'string') {
          const base64String = e.target.result;
          // Validate base64 string
          if (!base64String.startsWith('data:image/')) {
            throw new Error('Invalid image format');
          }
          
          console.log('Processing image, size:', Math.round(base64String.length / 1024), 'KB');
          
          // Update staff state with new photo
          setEditStaff((prev: any) => {
            if (!prev) return prev;
            console.log('Updating staff with new photo');
            return {
              ...prev,
              photo: base64String
            };
          });
        }
      } catch (error) {
        console.error('Error processing image:', error);
        alert('Error processing image. Please try again.');
      }
    };

    reader.onerror = () => {
      console.error('Error reading file');
      alert('Error reading file. Please try again.');
    };

    console.log('Starting to read file:', file.name);
    reader.readAsDataURL(file);
  };
  const [deleteStaff, setDeleteStaff] = useState<any | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const rowsPerPage = 10;

  // Status badge styling
  const getStatusBadge = (status: string) => {
    const variants: any = {
      Active: 'bg-success text-success-foreground',
      Inactive: 'bg-muted text-muted-foreground',
    };
    return variants[status] || 'bg-muted text-muted-foreground';
  };

  // Fetch staff from MySQL database
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch staff data
        const staffData = await DatabaseService.getAllStaff();
        console.log('Fetched staff from MySQL:', staffData);
        console.log('First staff documents:', staffData[0]?.documents);
        setStaff(staffData);

        // Fetch staff categories
        const categories = await DatabaseService.getAllStaffCategories();
        console.log('Fetched staff categories:', categories);
        setStaffCategories(categories);
      } catch (error) {
        console.error('Error fetching data:', error);
        // Fallback to localStorage if MySQL fails
        const localStaff = JSON.parse(localStorage.getItem('staff') || '[]');
        setStaff(localStaff);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  let filteredStaff = staff.filter((s) =>
    (s?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s?.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s?.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s?.address && s.address.toLowerCase().includes(searchTerm.toLowerCase()))) &&
    (statusFilter === 'All' || s?.status === statusFilter)
  );

  // Sort staff by staff ID (e.g., STF001, STF002, ...)
  filteredStaff.sort((a, b) => {
    const getNum = (id) => {
      if (!id || typeof id !== 'string') return 0;
      const match = id.match(/STF(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    };
    return getNum(a?.id) - getNum(b?.id);
  });

  const exportToCSV = () => {
    const headers = [
      'S No',
      'Staff ID',
      'Name',
      'Email',
      'Phone',
      'Role',
      'Department',
      'Address',
      'Join Date',
      'Salary',
      'Status',
    ];
    const csvData = [
      headers.join(','),
      ...filteredStaff.map((s, idx) =>
        [
          idx + 1,
          s.id,
          s.name,
          s.email,
          s.phone,
          s.role,
          s.department,
          s.address,
          s.joinDate,
          s.salary,
          s.status,
        ]
          .map((val) => (typeof val === 'string' ? '"' + val.replace(/"/g, '""') + '"' : val))
          .join(',')
      ),
    ].join('\n');
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'staff-list.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Edit logic
  const handleEditChange = (field: string, value: any) => {
    console.log(`Updating ${field} in state...`);
    
    setEditStaff((prev: any) => {
      if (!prev) {
        console.log('Previous state is null');
        return prev;
      }

      const updated = { ...prev, [field]: value };
      
      if (field === 'photo') {
        console.log('Updated photo in state, length:', updated.photo?.length || 0);
      }
      
      return updated;
    });
  };

  const handleSaveEdit = async () => {
    if (!editStaff) return;
    
    try {
      // Get category ID from the selected role name
      let categoryId = null;
      if (editStaff.role) {
        try {
          const categoriesResponse = await fetch('/api/staff-categories');
          if (categoriesResponse.ok) {
            const categories = await categoriesResponse.json();
            const selectedCategory = categories.find((cat: any) => cat.name === editStaff.role);
            categoryId = selectedCategory ? selectedCategory.id : null;
          }
        } catch (error) {
          console.warn('Could not fetch category ID:', error);
        }
      }

      // Format join date as YYYY-MM-DD for MySQL DATE format
      let formattedJoinDate = editStaff.joinDate;
      if (editStaff.joinDate && !editStaff.joinDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // If not already in YYYY-MM-DD format, try to parse and format it
        try {
          const date = new Date(editStaff.joinDate);
          if (!isNaN(date.getTime())) {
            formattedJoinDate = date.toISOString().split('T')[0];
          }
        } catch (error) {
          console.warn('Could not format join date:', error);
        }
      }

      // Create a clean update object with all fields
      const updateData = {
        ...editStaff,
        category_id: categoryId,
        join_date: formattedJoinDate,
        photo: editStaff.photo && editStaff.photo.startsWith('data:image/') ? editStaff.photo : '', // Only send if it's a valid base64 image
        documents: {
          aadharFront: editStaff.aadharFront || '',
          aadharBack: editStaff.aadharBack || '',
          aadharNumber: editStaff.aadharNumber || '',
          panFront: editStaff.panFront || '',
          panBack: editStaff.panBack || '',
          panNumber: editStaff.panNumber || ''
        }
      };

      // Log update data for debugging
      console.log('Updating staff:', editStaff.id);
      console.log('Category ID:', categoryId);
      console.log('Formatted join date:', formattedJoinDate);
      console.log('Photo included:', !!updateData.photo);
      console.log('Photo data length:', updateData.photo?.length || 0);

      // Update in MySQL
      await DatabaseService.updateStaff(editStaff.id, updateData);
      
      // Reload staff data to get fresh data from database
      const staffData = await DatabaseService.getAllStaff();
      setStaff(staffData);
      
      console.log('Staff updated successfully with documents');
    } catch (error) {
      console.error('Error updating staff:', error);
      // Fallback to localStorage if MySQL fails
      const updatedStaff = staff.map((s) => (s.id === editStaff.id ? editStaff : s));
      setStaff(updatedStaff);
      localStorage.setItem('staff', JSON.stringify(updatedStaff));
    }
    
    setEditStaff(null);
  };

  // Delete logic
  const handleDelete = (staffObj: any) => {
    setDeleteStaff(staffObj);
    setShowDeleteConfirm(true);
  };
  const confirmDelete = async () => {
    if (!deleteStaff) return;
    
    try {
      const currentUser = JSON.parse(localStorage.getItem('healthcare_user') || '{}');
      const deletedBy = currentUser.name || 'System';
      
      // Soft delete in MySQL
      await DatabaseService.deleteStaff(deleteStaff.id, deletedBy);
      
      // Remove from local state
      const updatedStaff = staff.filter((s) => s.id !== deleteStaff.id);
      setStaff(updatedStaff);
      
      console.log('Staff soft deleted successfully');
    } catch (error) {
      console.error('Error deleting staff:', error);
      // Fallback to localStorage if MySQL fails
      const updatedStaff = staff.filter((s) => s.id !== deleteStaff.id);
      setStaff(updatedStaff);
      localStorage.setItem('staff', JSON.stringify(updatedStaff));

      // Add to deletedStaff in localStorage
      const deletedStaffList = JSON.parse(localStorage.getItem('deletedStaff') || '[]');
      const deletedAt = new Date().toISOString();
      const deletedBy = (JSON.parse(localStorage.getItem('healthcare_user') || '{}').name) || 'System';
      const deletedStaffObj = { ...deleteStaff, deletedAt, deletedBy };
      deletedStaffList.push(deletedStaffObj);
      localStorage.setItem('deletedStaff', JSON.stringify(deletedStaffList));
    }

    setShowDeleteConfirm(false);
    setDeleteStaff(null);
  };

  return (
    <div className="crm-page-bg">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header Section */}
        <div className="crm-header-container">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
            <div className="flex items-center gap-3">
              <div className="crm-header-icon">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Staff Management</h1>
                <p className="text-sm sm:text-base text-gray-600">Manage staff members and their information</p>
              </div>
            </div>
          
            <div className="flex items-center gap-2 sm:gap-3">
              <ActionButtons.Refresh 
                onClick={() => {
                  console.log('🔄 Manual refresh triggered - refreshing entire page');
                  window.location.reload();
                }}
                loading={false}
                disabled={false}
              />
              <Button 
                onClick={exportToCSV}
                className="global-btn flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">CSV</span>
              </Button>
              <Button 
                onClick={() => window.location.href = '/management/add-staff'}
                className="global-btn flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Add Staff</span>
                <span className="sm:hidden">+</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="crm-stats-grid">
          {/* Total Staff Card */}
          <Card className="crm-stat-card crm-stat-card-blue">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-blue-700 mb-1 truncate">Total Staff</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-900 mb-1">{filteredStaff.length}</p>
                  <div className="flex items-center text-xs text-blue-600">
                    <Activity className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Registered</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-blue">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Active Staff Card */}
          <Card className="crm-stat-card crm-stat-card-green">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-green-700 mb-1 truncate">Active Staff</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-900 mb-1">
                    {filteredStaff.filter(s => s.status === 'Active').length}
                  </p>
                  <div className="flex items-center text-xs text-green-600">
                    <Activity className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Working</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-green">
                  <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inactive Staff Card */}
          <Card className="crm-stat-card crm-stat-card-red">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-red-700 mb-1 truncate">Inactive Staff</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-900 mb-1">
                    {filteredStaff.filter(s => s.status === 'Inactive').length}
                  </p>
                  <div className="flex items-center text-xs text-red-600">
                    <Activity className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Not active</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-red">
                  <UserX className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Categories Card */}
          <Card className="crm-stat-card crm-stat-card-orange">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-orange-700 mb-1 truncate">Categories</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-900 mb-1">{staffCategories.length}</p>
                  <div className="flex items-center text-xs text-orange-600">
                    <Activity className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Available</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-orange">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
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
                placeholder="Search staff by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="w-full sm:w-auto min-w-[200px]">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
        {/* Staff Table */}
        <Card className="crm-table-container">
          <CardHeader className="crm-table-header">
            <div className="crm-table-title">
              <Users className="crm-table-title-icon" />
              <span className="crm-table-title-text">Staff List ({filteredStaff.length})</span>
              <span className="crm-table-title-text-mobile">Staff ({filteredStaff.length})</span>
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
                    <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Photo</span>
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center">
                    <span>Staff ID</span>
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center">
                    <span>Name</span>
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center">
                    <span>Specialization</span>
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center">
                    <span>Department</span>
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center">
                    <span>Phone</span>
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Join Date</span>
                    <span className="sm:hidden">Date</span>
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
              {filteredStaff
                .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
                .map((s, idx) => (
                  <TableRow key={s.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                    {/* S No */}
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{(currentPage - 1) * rowsPerPage + idx + 1}</TableCell>
                    
                    {/* Photo */}
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center">
                      <div className="flex justify-center">
                        <Avatar className="h-10 w-10">
                          <AvatarImage 
                            src={getImageUrl(s.photo)}
                            alt={s.name || 'Profile'}
                          />
                          <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                            {s.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'N/A'}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </TableCell>
                    
                    {/* Staff ID */}
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 font-medium text-center text-xs sm:text-sm whitespace-nowrap">
                      <span className="text-primary font-medium hover:underline hover:text-blue-700 hover:bg-blue-50 transition-all duration-200 p-1 h-auto text-xs sm:text-sm cursor-pointer rounded-md inline-flex items-center gap-1">
                        {s.id}
                      </span>
                    </TableCell>
                    
                    {/* Name */}
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm max-w-[100px] sm:max-w-[120px] truncate">{s.name}</TableCell>
                    
                    {/* Specialization (Role) */}
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{s.role}</TableCell>
                    
                    {/* Department */}
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{s.department || '-'}</TableCell>
                    
                    {/* Phone */}
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{s.phone}</TableCell>
                    
                    {/* Join Date */}
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">
                      {s.joinDate ? (() => {
                        try {
                          const d = parseISO(s.joinDate);
                          if (!isNaN(d.getTime())) {
                            return formatDate(d, 'dd/MM/yyyy');
                          }
                        } catch {}
                        if (/^\d{4}-\d{2}-\d{2}$/.test(s.joinDate)) {
                          const [y, m, d] = s.joinDate.split('-');
                          return `${d}/${m}/${y}`;
                        }
                        return s.joinDate;
                      })() : <span className="text-gray-400 text-xs">Not Set</span>}
                    </TableCell>
                    
                    {/* Status */}
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center whitespace-nowrap">
                      <Badge className={`${getStatusBadge(s.status)} text-xs`}>
                        {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                      </Badge>
                    </TableCell>
                    
                    {/* Actions */}
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center whitespace-nowrap">
                      <div className="action-buttons-container">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewStaff(s)}
                          className="action-btn-lead action-btn-view h-8 w-8 sm:h-9 sm:w-9 p-0"
                          title="View Staff"
                        >
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const staffToEdit = {
                              ...s,
                              photo: s.photo || '',
                              aadharFront: s.aadharFront || s.documents?.aadharFront || '',
                              aadharBack: s.aadharBack || s.documents?.aadharBack || '',
                              aadharNumber: s.aadharNumber || s.documents?.aadharNumber || '',
                              panFront: s.panFront || s.documents?.panFront || '',
                              panBack: s.panBack || s.documents?.panBack || '',
                              panNumber: s.panNumber || s.documents?.panNumber || '',
                              name: s.name || '',
                              email: s.email || '',
                              phone: s.phone || '',
                              role: s.role || '',
                              department: s.department || '',
                              address: s.address || '',
                              status: s.status || 'Active',
                              salary: s.salary || '',
                              joinDate: s.joinDate || ''
                            };
                            setEditStaff(staffToEdit);
                          }}
                          className="action-btn-lead action-btn-edit h-8 w-8 sm:h-9 sm:w-9 p-0"
                          title="Edit Staff"
                        >
                          <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(s)}
                          className="action-btn-lead action-btn-delete h-8 w-8 sm:h-9 sm:w-9 p-0"
                          title="Delete Staff"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          
          {filteredStaff.length === 0 && (
            <div className="text-center py-12 bg-white">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No staff found</h3>
              <p className="text-sm text-gray-500">
                No staff match your search criteria. Try adjusting your filters.
              </p>
            </div>
          )}
        </div>

        {/* Mobile Responsive Pagination */}
        {filteredStaff.length > rowsPerPage && (
          <div className="crm-pagination-container">
            {/* Pagination Info */}
            <div className="text-xs sm:text-sm text-gray-600 order-2 sm:order-1">
              <span className="hidden sm:inline">
                Page {currentPage} of {Math.ceil(filteredStaff.length / rowsPerPage)} 
                ({filteredStaff.length} total staff)
              </span>
              <span className="sm:hidden">
                {currentPage} / {Math.ceil(filteredStaff.length / rowsPerPage)}
              </span>
            </div>
            
            {/* Pagination Controls */}
            <div className="flex items-center gap-2 order-1 sm:order-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="bg-white hover:bg-gray-50 text-gray-600 border-gray-300 text-xs sm:text-sm px-2 sm:px-3"
              >
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">Prev</span>
              </Button>
              
              {/* Page Numbers for Desktop */}
              <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: Math.min(5, Math.ceil(filteredStaff.length / rowsPerPage)) }, (_, i) => {
                  const totalPages = Math.ceil(filteredStaff.length / rowsPerPage);
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
                onClick={() => setCurrentPage((p) => Math.min(Math.ceil(filteredStaff.length / rowsPerPage), p + 1))}
                disabled={currentPage === Math.ceil(filteredStaff.length / rowsPerPage)}
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

        {/* View Staff Modal - Glass Morphism Design */}
        {viewStaff && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setViewStaff(null)}
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
                    <div className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full object-cover border-2 sm:border-4 border-white shadow-lg overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600">
                      {viewStaff.photo ? (
                        <img
                          src={getImageUrl(viewStaff.photo)}
                          alt={viewStaff.name || 'Profile'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            const parent = target.parentElement as HTMLElement;
                            if (parent) {
                              parent.innerHTML = `<div class="w-full h-full flex items-center justify-center"><span class="text-lg font-semibold text-white">${(viewStaff.name || 'S').charAt(0).toUpperCase()}</span></div>`;
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-lg font-semibold text-white">
                            {(viewStaff.name || 'S').charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1">
                      <div className={`border-2 border-white shadow-sm text-xs px-2 py-1 rounded-full ${getStatusBadge(viewStaff.status)}`}>
                        {viewStaff.status}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-1 sm:gap-2 truncate">
                      <Users className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-blue-600 flex-shrink-0" />
                      <span className="truncate">{viewStaff.name}</span>
                    </h2>
                    <div className="text-xs sm:text-sm md:text-lg lg:text-xl mt-1 flex items-center gap-2">
                      <span className="text-gray-600">Staff ID:</span>
                      <span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg border border-green-200">
                        {viewStaff.id}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewStaff(null)}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Modal Body - Glass Morphism Style */}
              <div className="overflow-y-auto max-h-[calc(95vh-100px)] sm:max-h-[calc(95vh-120px)] md:max-h-[calc(95vh-140px)] lg:max-h-[calc(95vh-200px)] custom-scrollbar">
                <div className="p-2 sm:p-3 md:p-4 lg:p-6 space-y-3 sm:space-y-4 md:space-y-6 lg:space-y-8">
                  
                  {/* Personal Information Section */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-blue-100 shadow-sm">
                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 flex items-center gap-2">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <User className="h-3 w-3 sm:h-3 sm:w-3 md:h-4 md:w-4 text-blue-600" />
                      </div>
                      Personal Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                      
                      <div className="bg-gradient-to-br from-blue-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-blue-100">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-blue-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">Full Name</div>
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 truncate">{viewStaff.name}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-green-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-green-100">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Mail className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-green-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-green-600 uppercase tracking-wide">Email Address</div>
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 truncate">{viewStaff.email}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-purple-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-purple-100">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Phone className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-purple-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-purple-600 uppercase tracking-wide">Phone Number</div>
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">{viewStaff.phone}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-orange-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-orange-100 sm:col-span-2 lg:col-span-3">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <MapPin className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-orange-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-orange-600 uppercase tracking-wide">Address</div>
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">{viewStaff.address}</p>
                          </div>
                        </div>
                      </div>
                      
                    </div>
                  </div>

                  {/* Professional Information Section */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-blue-100 shadow-sm">
                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 flex items-center gap-2">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <Briefcase className="h-3 w-3 sm:h-3 sm:w-3 md:h-4 md:w-4 text-green-600" />
                      </div>
                      Professional Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                      
                      <div className="bg-gradient-to-br from-blue-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-blue-100">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Briefcase className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-blue-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">Role</div>
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">{viewStaff.role}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-green-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-green-100">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Users className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-green-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-green-600 uppercase tracking-wide">Department</div>
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">{viewStaff.department || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-purple-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-purple-100">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-purple-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-purple-600 uppercase tracking-wide">Join Date</div>
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">{viewStaff.joinDate || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-orange-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-orange-100">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-orange-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-orange-600 uppercase tracking-wide">Salary</div>
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">₹{viewStaff.salary || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                      
                    </div>
                  </div>

                  {/* Document Details Section */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-blue-100 shadow-sm">
                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 flex items-center gap-2">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <IdCard className="h-3 w-3 sm:h-3 sm:w-3 md:h-4 md:w-4 text-purple-600" />
                      </div>
                      Document Details
                    </h3>
                    
                    {/* Aadhar Section */}
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <IdCard className="h-4 w-4 text-blue-600" />
                        Aadhar Card Details
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-blue-50 to-white p-3 rounded-lg border border-blue-100">
                          <div className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-2">Aadhar Front</div>
                          {(viewStaff.aadharFront || viewStaff.documents?.aadharFront) ? (
                            <img 
                              src={getImageUrl(viewStaff.aadharFront || viewStaff.documents?.aadharFront)} 
                              alt="Aadhar Front" 
                              className="w-full h-24 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity" 
                              onClick={() => window.open(getImageUrl(viewStaff.aadharFront || viewStaff.documents?.aadharFront), '_blank')}
                            />
                          ) : (
                            <div className="w-full h-24 bg-gray-100 rounded border flex items-center justify-center text-gray-400">
                              <FileText className="h-8 w-8" />
                            </div>
                          )}
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-white p-3 rounded-lg border border-blue-100">
                          <div className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-2">Aadhar Back</div>
                          {(viewStaff.aadharBack || viewStaff.documents?.aadharBack) ? (
                            <img 
                              src={getImageUrl(viewStaff.aadharBack || viewStaff.documents?.aadharBack)} 
                              alt="Aadhar Back" 
                              className="w-full h-24 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity" 
                              onClick={() => window.open(getImageUrl(viewStaff.aadharBack || viewStaff.documents?.aadharBack), '_blank')}
                            />
                          ) : (
                            <div className="w-full h-24 bg-gray-100 rounded border flex items-center justify-center text-gray-400">
                              <FileText className="h-8 w-8" />
                            </div>
                          )}
                        </div>
                        <div className="sm:col-span-2 bg-gradient-to-br from-green-50 to-white p-3 rounded-lg border border-green-100">
                          <div className="text-xs font-medium text-green-600 uppercase tracking-wide mb-2">Aadhar Number</div>
                          <p className="text-lg font-semibold text-gray-900">{viewStaff.aadharNumber || viewStaff.documents?.aadharNumber || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>

                    {/* PAN Section */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-purple-600" />
                        PAN Card Details
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-purple-50 to-white p-3 rounded-lg border border-purple-100">
                          <div className="text-xs font-medium text-purple-600 uppercase tracking-wide mb-2">PAN Front</div>
                          {(viewStaff.panFront || viewStaff.documents?.panFront) ? (
                            <img 
                              src={getImageUrl(viewStaff.panFront || viewStaff.documents?.panFront)} 
                              alt="PAN Front" 
                              className="w-full h-24 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity" 
                              onClick={() => window.open(getImageUrl(viewStaff.panFront || viewStaff.documents?.panFront), '_blank')}
                            />
                          ) : (
                            <div className="w-full h-24 bg-gray-100 rounded border flex items-center justify-center text-gray-400">
                              <FileText className="h-8 w-8" />
                            </div>
                          )}
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-white p-3 rounded-lg border border-purple-100">
                          <div className="text-xs font-medium text-purple-600 uppercase tracking-wide mb-2">PAN Back</div>
                          {(viewStaff.panBack || viewStaff.documents?.panBack) ? (
                            <img 
                              src={getImageUrl(viewStaff.panBack || viewStaff.documents?.panBack)} 
                              alt="PAN Back" 
                              className="w-full h-24 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity" 
                              onClick={() => window.open(getImageUrl(viewStaff.panBack || viewStaff.documents?.panBack), '_blank')}
                            />
                          ) : (
                            <div className="w-full h-24 bg-gray-100 rounded border flex items-center justify-center text-gray-400">
                              <FileText className="h-8 w-8" />
                            </div>
                          )}
                        </div>
                        <div className="sm:col-span-2 bg-gradient-to-br from-orange-50 to-white p-3 rounded-lg border border-orange-100">
                          <div className="text-xs font-medium text-orange-600 uppercase tracking-wide mb-2">PAN Number</div>
                          <p className="text-lg font-semibold text-gray-900">{viewStaff.panNumber || viewStaff.documents?.panNumber || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Additional Documents */}
                    {viewStaff.documents && Array.isArray(viewStaff.documents) && viewStaff.documents.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <FileText className="h-4 w-4 text-green-600" />
                          Additional Documents
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {viewStaff.documents.map((doc: any, idx: number) => (
                            <div key={idx} className="bg-gradient-to-br from-gray-50 to-white p-3 rounded-lg border border-gray-100">
                              <div className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">{doc.type || 'Document'}</div>
                              {doc.url ? (
                                <a 
                                  href={doc.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-blue-600 hover:text-blue-800 underline break-all text-sm"
                                >
                                  {doc.name || doc.url}
                                </a>
                              ) : (
                                <span className="text-gray-500 text-sm">{doc.name || 'N/A'}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </div>
          </div>
        )}

      {/* Edit Staff Dialog */}
      {editStaff && (
        <Dialog open={!!editStaff} onOpenChange={() => setEditStaff(null)}>
          <DialogContent className="editpopup form crm-modal-container max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader className="editpopup form crm-modal-header">
              <DialogTitle className="editpopup form crm-modal-title">
                <Edit2 className="h-4 w-4 sm:h-5 sm:w-5 inline mr-2" />
                Edit Staff - {editStaff.id}
              </DialogTitle>
              <DialogDescription className="editpopup form text-sm sm:text-base text-gray-600">
                Update staff information
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              handleSaveEdit();
            }} className="editpopup form crm-edit-form">
              <div className="flex flex-col items-center py-2 mb-4">
                {editStaff.photo ? (
                  <img
                    src={getImageUrl(editStaff.photo)}
                    alt={editStaff.name || 'Profile'}
                    className="w-24 h-24 rounded-full object-cover border mb-2"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-2 text-lg text-muted-foreground border">
                    N/A
                  </div>
                )}
                <div className="flex flex-col items-center gap-2">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="mb-2"
                    onChange={handlePhotoChange}
                  />
                  <p className="text-sm text-gray-500">Maximum file size: 5MB</p>
                  {editStaff.photo && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditChange('photo', '')}
                      className="text-red-600"
                    >
                      Remove Photo
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="editpopup form crm-edit-form-grid grid-cols-2 gap-4">
                <div className="editpopup form crm-edit-form-group">
                  <Label className="editpopup form crm-edit-form-label">Name</Label>
                  <Input 
                    value={editStaff.name} 
                    onChange={e => handleEditChange('name', e.target.value)} 
                    className="editpopup form crm-edit-form-input"
                  />
                </div>
                <div className="editpopup form crm-edit-form-group">
                  <Label className="editpopup form crm-edit-form-label">Email</Label>
                  <Input 
                    value={editStaff.email} 
                    onChange={e => handleEditChange('email', e.target.value)} 
                    className="editpopup form crm-edit-form-input"
                  />
                </div>
                <div className="editpopup form crm-edit-form-group">
                  <Label className="editpopup form crm-edit-form-label">Phone</Label>
                  <Input 
                    value={editStaff.phone} 
                    onChange={e => handleEditChange('phone', e.target.value)} 
                    className="editpopup form crm-edit-form-input"
                  />
                </div>
                <div className="editpopup form crm-edit-form-group">
                  <Label className="editpopup form crm-edit-form-label">Role</Label>
                  <select
                    className="editpopup form crm-edit-form-select"
                    value={editStaff.role}
                    onChange={e => handleEditChange('role', e.target.value)}
                  >
                    <option value="">Select Role</option>
                    {staffCategories.map((category) => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                    {staffCategories.length === 0 && (
                      <>
                        <option value="Admin">Admin</option>
                        <option value="Nurse">Nurse</option>
                        <option value="Receptionist">Receptionist</option>
                        <option value="Pharmacist">Pharmacist</option>
                        <option value="Lab Technician">Lab Technician</option>
                        <option value="Other">Other</option>
                      </>
                    )}
                  </select>
                </div>
                <div className="editpopup form crm-edit-form-group">
                  <Label className="editpopup form crm-edit-form-label">Department</Label>
                  <select
                    className="editpopup form crm-edit-form-select"
                    value={editStaff.department}
                    onChange={e => handleEditChange('department', e.target.value)}
                  >
                    <option value="">Select Department</option>
                    <option value="Administration">Administration</option>
                    <option value="Nursing">Nursing</option>
                    <option value="Reception">Reception</option>
                    <option value="Pharmacy">Pharmacy</option>
                    <option value="Laboratory">Laboratory</option>
                    <option value="Finance">Finance</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="IT">IT</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Security">Security</option>
                  <option value="Housekeeping">Housekeeping</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="editpopup form crm-edit-form-group">
                <Label className="editpopup form crm-edit-form-label">Join Date</Label>
                <Input 
                  type="date" 
                  value={editStaff.joinDate ? 
                    (editStaff.joinDate.match(/^\d{4}-\d{2}-\d{2}$/) ? 
                      editStaff.joinDate : 
                      new Date(editStaff.joinDate).toISOString().split('T')[0]
                    ) : ''
                  } 
                  onChange={e => handleEditChange('joinDate', e.target.value)} 
                  className="editpopup form crm-edit-form-input"
                />
              </div>
              <div className="editpopup form crm-edit-form-group">
                <Label className="editpopup form crm-edit-form-label">Salary</Label>
                <Input 
                  value={editStaff.salary} 
                  onChange={e => handleEditChange('salary', e.target.value)} 
                  className="editpopup form crm-edit-form-input"
                />
              </div>
              <div className="editpopup form crm-edit-form-group col-span-2">
                <Label className="editpopup form crm-edit-form-label">Address</Label>
                <Textarea 
                  value={editStaff.address} 
                  onChange={e => handleEditChange('address', e.target.value)} 
                  className="editpopup form crm-edit-form-textarea"
                />
              </div>
              <div className="editpopup form crm-edit-form-group">
                <Label className="editpopup form crm-edit-form-label">Status</Label>
                <select
                  className="editpopup form crm-edit-form-select"
                  value={editStaff.status}
                  onChange={e => handleEditChange('status', e.target.value)}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              {/* Document Upload Section */}
              <div className="col-span-2 mt-4">
                <Label className="font-medium text-foreground text-lg mb-2 block">Document Details</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Aadhar Card Front */}
                  <div className="space-y-1">
                    <Label>Aadhar Card Front</Label>
                    {(editStaff.aadharFront || editStaff.documents?.aadharFront) ? (
                      <img 
                        src={getImageUrl(editStaff.aadharFront || editStaff.documents?.aadharFront)} 
                        alt="Aadhar Front" 
                        className="w-full h-24 object-cover rounded border mb-1" 
                      />
                    ) : null}
                    <input type="file" accept="image/*" onChange={e => {
                      const file = e.target.files && e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = ev => {
                          const result = ev.target?.result;
                          if (typeof result === 'string') handleEditChange('aadharFront', result);
                        };
                        reader.readAsDataURL(file);
                      }
                    }} />
                  </div>
                  {/* Aadhar Card Back */}
                  <div className="space-y-1">
                    <Label>Aadhar Card Back</Label>
                    {(editStaff.aadharBack || editStaff.documents?.aadharBack) ? (
                      <img 
                        src={getImageUrl(editStaff.aadharBack || editStaff.documents?.aadharBack)} 
                        alt="Aadhar Back" 
                        className="w-full h-24 object-cover rounded border mb-1" 
                      />
                    ) : null}
                    <input type="file" accept="image/*" onChange={e => {
                      const file = e.target.files && e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = ev => {
                          const result = ev.target?.result;
                          if (typeof result === 'string') handleEditChange('aadharBack', result);
                        };
                        reader.readAsDataURL(file);
                      }
                    }} />
                  </div>
                  {/* Aadhar Card Number */}
                  <div className="space-y-1 col-span-2">
                    <Label>Aadhar Card Number</Label>
                    <Input value={editStaff.aadharNumber || editStaff.documents?.aadharNumber || ''} onChange={e => handleEditChange('aadharNumber', e.target.value)} maxLength={12} />
                  </div>
                  {/* PAN Card Front */}
                  <div className="space-y-1">
                    <Label>PAN Card Front</Label>
                    {(editStaff.panFront || editStaff.documents?.panFront) ? (
                      <img src={editStaff.panFront || editStaff.documents?.panFront} alt="PAN Front" className="w-full h-24 object-cover rounded border mb-1" />
                    ) : null}
                    <input type="file" accept="image/*" onChange={e => {
                      const file = e.target.files && e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = ev => {
                          const result = ev.target?.result;
                          if (typeof result === 'string') handleEditChange('panFront', result);
                        };
                        reader.readAsDataURL(file);
                      }
                    }} />
                  </div>
                  {/* PAN Card Back */}
                  <div className="space-y-1">
                    <Label>PAN Card Back</Label>
                    {(editStaff.panBack || editStaff.documents?.panBack) ? (
                      <img src={editStaff.panBack || editStaff.documents?.panBack} alt="PAN Back" className="w-full h-24 object-cover rounded border mb-1" />
                    ) : null}
                    <input type="file" accept="image/*" onChange={e => {
                      const file = e.target.files && e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = ev => {
                          const result = ev.target?.result;
                          if (typeof result === 'string') handleEditChange('panBack', result);
                        };
                        reader.readAsDataURL(file);
                      }
                    }} />
                  </div>
                  {/* PAN Card Number */}
                  <div className="space-y-1 col-span-2">
                    <Label>PAN Card Number</Label>
                    <Input value={editStaff.panNumber || editStaff.documents?.panNumber || ''} onChange={e => handleEditChange('panNumber', e.target.value)} maxLength={10} />
                  </div>
                </div>
              </div>
            </div>
            </form>
            
            <DialogFooter className="editpopup form dialog-footer flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => setEditStaff(null)}
                className="editpopup form footer-button-cancel w-full sm:w-auto modern-btn modern-btn-secondary"
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                type="button"
                onClick={handleSaveEdit} 
                className="editpopup form footer-button-save w-full sm:w-auto global-btn"
              >
                <UserCheck className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

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
                  Delete Staff Member
                </DialogTitle>
                <DialogDescription className="editpopup form dialog-description">
                  Are you sure you want to delete this staff member? This action cannot be undone.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          {deleteStaff && (
            <div className="mx-4 my-4 p-4 bg-gray-50 rounded-lg border">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="font-medium text-gray-900">{deleteStaff.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <IdCard className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">ID: {deleteStaff.id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Role: {deleteStaff.role}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">{deleteStaff.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Status: {deleteStaff.status}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="editpopup form dialog-footer flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setShowDeleteConfirm(false);
                setDeleteStaff(null);
              }}
              className="editpopup form footer-button-cancel w-full sm:w-auto modern-btn modern-btn-secondary"
            >
              <X className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={confirmDelete}
              className="editpopup form footer-button-delete w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Delete Staff
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
};

export default StaffManagement;