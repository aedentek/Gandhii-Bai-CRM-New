
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Search, Users, Plus, Eye, Edit2, Trash2, RefreshCw, Activity, UserCheck, UserX, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { parseISO, format as formatDate } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { DatabaseService } from '@/services/databaseService';
import { getStaffFileUrl } from '@/services/staffFileUpload';
import '@/styles/global-crm-design.css';
import '../../styles/modern-forms.css';
import '../../styles/modern-tables.css';

const StaffManagement: React.FC = () => {
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
      // Create a clean update object with all fields
      const updateData = {
        ...editStaff,
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
              <Button 
                onClick={() => window.location.reload()}
                disabled={false}
                className="global-btn flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
              >
                <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Refresh</span>
                <span className="sm:hidden">↻</span>
              </Button>
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
                    <span>Email</span>
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center">
                    <span>Phone</span>
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center">
                    <span>Role</span>
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
                  <div className="flex items-center justify-center">
                    <span>Salary</span>
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
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{(currentPage - 1) * rowsPerPage + idx + 1}</TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center">
                      {s.photo ? (
                        <img
                          src={getImageUrl(s.photo)}
                          alt={s.name || 'Profile'}
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover mx-auto border bg-muted"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : (
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-muted flex items-center justify-center mx-auto text-xs text-muted-foreground border">
                          N/A
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 font-medium text-center text-xs sm:text-sm whitespace-nowrap">
                      <span className="text-primary font-medium hover:underline hover:text-blue-700 hover:bg-blue-50 transition-all duration-200 p-1 h-auto text-xs sm:text-sm cursor-pointer rounded-md inline-flex items-center gap-1">
                        {s.id}
                      </span>
                    </TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm max-w-[100px] sm:max-w-[120px] truncate">{s.name}</TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{s.email}</TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{s.phone}</TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{s.role}</TableCell>
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
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{s.salary}</TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center whitespace-nowrap">
                      <Badge className={`${getStatusBadge(s.status)} text-xs`}>
                        {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                      </Badge>
                    </TableCell>
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

        {/* View Staff Dialog */}
        {viewStaff && (
          <Dialog open={!!viewStaff} onOpenChange={() => setViewStaff(null)}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Staff Details - {viewStaff.id}</DialogTitle>
                <DialogDescription>Complete information for {viewStaff.name}</DialogDescription>
              </DialogHeader>
            <div className="flex flex-col items-center py-2">
              {viewStaff.photo ? (
                <img
                  src={getImageUrl(viewStaff.photo)}
                  alt={viewStaff.name || 'Profile'}
                  className="w-24 h-24 rounded-full object-cover border mb-4"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              {!viewStaff.photo && (
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4 text-lg text-muted-foreground border">
                  N/A
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label className="font-medium text-foreground">Name</Label>
                <div className="p-3 bg-muted rounded-md border">
                  <p className="text-sm">{viewStaff.name}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-medium text-foreground">Email</Label>
                <div className="p-3 bg-muted rounded-md border">
                  <p className="text-sm">{viewStaff.email}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-medium text-foreground">Phone</Label>
                <div className="p-3 bg-muted rounded-md border">
                  <p className="text-sm">{viewStaff.phone}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-medium text-foreground">Role</Label>
                <div className="p-3 bg-muted rounded-md border">
                  <p className="text-sm">{viewStaff.role}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-medium text-foreground">Join Date</Label>
                <div className="p-3 bg-muted rounded-md border">
                  <p className="text-sm">{viewStaff.joinDate}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-medium text-foreground">Salary</Label>
                <div className="p-3 bg-muted rounded-md border">
                  <p className="text-sm">{viewStaff.salary}</p>
                </div>
              </div>
              <div className="space-y-2 col-span-2">
                <Label className="font-medium text-foreground">Address</Label>
                <div className="p-3 bg-muted rounded-md border">
                  <p className="text-sm">{viewStaff.address}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-medium text-foreground">Status</Label>
                <div className="p-3 bg-muted rounded-md border">
                  <Badge className={getStatusBadge(viewStaff.status)}>
                    {viewStaff.status.charAt(0).toUpperCase() + viewStaff.status.slice(1)}
                  </Badge>
                </div>
              </div>
            </div>
            {/* Document Details Section */}
            <div className="mt-6">
              <Label className="font-medium text-foreground text-lg mb-2 block">Document Details</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Aadhar Card Front */}
                <div className="space-y-1">
                  <Label>Aadhar Card Front</Label>
                  {(viewStaff.aadharFront || viewStaff.documents?.aadharFront) ? (
                    <img 
                      src={getImageUrl(viewStaff.aadharFront || viewStaff.documents?.aadharFront)} 
                      alt="Aadhar Front" 
                      className="w-full h-24 object-cover rounded border mb-1" 
                    />
                  ) : (
                    <div className="p-2 text-muted-foreground">No file chosen</div>
                  )}
                </div>
                {/* Aadhar Card Back */}
                <div className="space-y-1">
                  <Label>Aadhar Card Back</Label>
                  {(viewStaff.aadharBack || viewStaff.documents?.aadharBack) ? (
                    <img 
                      src={getImageUrl(viewStaff.aadharBack || viewStaff.documents?.aadharBack)} 
                      alt="Aadhar Back" 
                      className="w-full h-24 object-cover rounded border mb-1" 
                    />
                  ) : (
                    <div className="p-2 text-muted-foreground">No file chosen</div>
                  )}
                </div>
                {/* Aadhar Card Number */}
                <div className="space-y-1 col-span-2">
                  <Label>Aadhar Card Number</Label>
                  <div className="p-2 bg-muted rounded-md border">{viewStaff.aadharNumber || viewStaff.documents?.aadharNumber || <span className="text-muted-foreground">N/A</span>}</div>
                </div>
                {/* PAN Card Front */}
                <div className="space-y-1">
                  <Label>PAN Card Front</Label>
                  {(viewStaff.panFront || viewStaff.documents?.panFront) ? (
                    <img 
                      src={getImageUrl(viewStaff.panFront || viewStaff.documents?.panFront)} 
                      alt="PAN Front" 
                      className="w-full h-24 object-cover rounded border mb-1" 
                    />
                  ) : (
                    <div className="p-2 text-muted-foreground">No file chosen</div>
                  )}
                </div>
                {/* PAN Card Back */}
                <div className="space-y-1">
                  <Label>PAN Card Back</Label>
                  {(viewStaff.panBack || viewStaff.documents?.panBack) ? (
                    <img 
                      src={getImageUrl(viewStaff.panBack || viewStaff.documents?.panBack)} 
                      alt="PAN Back" 
                      className="w-full h-24 object-cover rounded border mb-1" 
                    />
                  ) : (
                    <div className="p-2 text-muted-foreground">No file chosen</div>
                  )}
                </div>
                {/* PAN Card Number */}
                <div className="space-y-1 col-span-2">
                  <Label>PAN Card Number</Label>
                  <div className="p-2 bg-muted rounded-md border">{viewStaff.panNumber || viewStaff.documents?.panNumber || <span className="text-muted-foreground">N/A</span>}</div>
                </div>
              </div>
            </div>
            {/* Document Details Section */}
            {viewStaff.documents && Array.isArray(viewStaff.documents) && viewStaff.documents.length > 0 && (
              <div className="mt-6">
                <Label className="font-medium text-foreground text-lg mb-2 block">Document Details</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {viewStaff.documents.map((doc: any, idx: number) => (
                    <div key={idx} className="p-3 bg-muted rounded-md border flex flex-col">
                      <span className="font-medium">{doc.type || 'Document'}:</span>
                      {doc.url ? (
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-primary underline break-all">{doc.name || doc.url}</a>
                      ) : (
                        <span>{doc.name || 'N/A'}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Staff Dialog */}
      {editStaff && (
        <Dialog open={!!editStaff} onOpenChange={() => setEditStaff(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Staff - {editStaff.id}</DialogTitle>
              <DialogDescription>Update staff information</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center py-2">
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
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={editStaff.name} onChange={e => handleEditChange('name', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={editStaff.email} onChange={e => handleEditChange('email', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={editStaff.phone} onChange={e => handleEditChange('phone', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm"
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
              <div className="space-y-2">
                <Label>Department</Label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm"
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
              <div className="space-y-2">
                <Label>Join Date</Label>
                <Input value={editStaff.joinDate} onChange={e => handleEditChange('joinDate', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Salary</Label>
                <Input value={editStaff.salary} onChange={e => handleEditChange('salary', e.target.value)} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Address</Label>
                <Textarea value={editStaff.address} onChange={e => handleEditChange('address', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm"
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
            <DialogFooter>
              <Button 
                onClick={() => setEditStaff(null)}
                className="global-btn"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveEdit} 
                className="global-btn"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <DialogTitle className="text-destructive">Delete Staff</DialogTitle>
            <DialogDescription className="text-center">
              Are you sure you want to delete staff <strong>{deleteStaff?.name}</strong> (ID: {deleteStaff?.id})?
              <br />
              <span className="text-destructive font-medium">This action cannot be undone.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="justify-center space-x-4">
            <Button 
              onClick={() => setShowDeleteConfirm(false)}
              className="global-btn"
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmDelete}
              className="global-btn"
            >
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