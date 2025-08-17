
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Search, Users, Plus, Eye, Edit2, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { parseISO, format as formatDate } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { DatabaseService } from '@/services/databaseService';
import { getStaffFileUrl } from '@/services/staffFileUpload';

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
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary rounded-lg">
              <Users className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Staff Management</h1>
            </div>
          </div>
          <Button onClick={() => window.location.href = '/management/add-staff'} 
            className="bg-emerald-100 hover:bg-emerald-200 text-emerald-600 border-emerald-200">
            <Plus className="w-4 h-4 mr-2" />
            Add Staff
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6 shadow-card">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, ID, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <select
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <Button
              onClick={exportToCSV}
              className="bg-purple-100 hover:bg-purple-200 text-purple-600 border-purple-200 flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Staff Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Staff List ({filteredStaff.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">S No</TableHead>
                  <TableHead className="text-center">Profile Photo</TableHead>
                  <TableHead className="text-center">Staff ID</TableHead>
                  <TableHead className="text-center">Name</TableHead>
                  <TableHead className="text-center">Email</TableHead>
                  <TableHead className="text-center">Phone</TableHead>
                  <TableHead className="text-center">Role</TableHead>
                  <TableHead className="text-center">Join Date</TableHead>
                  <TableHead className="text-center">Salary</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.length > 0 ? (
                  filteredStaff
                    .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
                    .map((s, idx) => (
                      <TableRow key={s.id} className="hover:bg-muted/50">
                        <TableCell className="text-center">{(currentPage - 1) * rowsPerPage + idx + 1}</TableCell>
                        <TableCell className="text-center">
                          {s.photo ? (
                            <img
                              src={getImageUrl(s.photo)}
                              alt={s.name || 'Profile'}
                              className="w-8 h-8 rounded-full object-cover mx-auto"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          {!s.photo && (
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mx-auto text-xs text-muted-foreground">
                              N/A
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center">{s.id}</TableCell>
                        <TableCell className="text-center">{s.name}</TableCell>
                        <TableCell className="text-center">{s.email}</TableCell>
                        <TableCell className="text-center">{s.phone}</TableCell>
                        <TableCell className="text-center">{s.role}</TableCell>
                        <TableCell className="text-center">{
                          s.joinDate ? (() => {
                            // Try to parse as ISO, fallback to original if fails
                            try {
                              const d = parseISO(s.joinDate);
                              if (!isNaN(d.getTime())) {
                                return formatDate(d, 'dd-MM-yyyy');
                              }
                            } catch {}
                            // fallback: try to split yyyy-mm-dd
                            if (/^\d{4}-\d{2}-\d{2}$/.test(s.joinDate)) {
                              const [y, m, d] = s.joinDate.split('-');
                              return `${d}-${m}-${y}`;
                            }
                            return s.joinDate;
                          })() : ''
                        }</TableCell>
                        <TableCell className="text-center">{s.salary}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={getStatusBadge(s.status)}>
                            {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex space-x-2 justify-center">
                            <Button 
                              size="sm" 
                              onClick={() => setViewStaff(s)}
                              className="bg-green-100 hover:bg-green-200 text-green-600 border-green-200"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={() => {
                                // Initialize edit staff with all fields properly
                                const staffToEdit = {
                                  ...s,
                                  // Handle photo initialization
                                  photo: s.photo || '',
                                  // Handle document fields
                                  aadharFront: s.aadharFront || s.documents?.aadharFront || '',
                                  aadharBack: s.aadharBack || s.documents?.aadharBack || '',
                                  aadharNumber: s.aadharNumber || s.documents?.aadharNumber || '',
                                  panFront: s.panFront || s.documents?.panFront || '',
                                  panBack: s.panBack || s.documents?.panBack || '',
                                  panNumber: s.panNumber || s.documents?.panNumber || '',
                                  // Ensure other fields are initialized
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
                                
                                console.log('Initializing edit staff:', staffToEdit.id);
                                console.log('Initial photo present:', !!staffToEdit.photo);
                                setEditStaff(staffToEdit);
                              }}
                              className="bg-blue-100 hover:bg-blue-200 text-blue-600 border-blue-200"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={() => handleDelete(s)}
                              className="bg-red-100 hover:bg-red-200 text-red-600 border-red-200"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                      No staff found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {filteredStaff.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No staff found matching your criteria.
              </div>
            )}
            {/* Pagination Controls */}
            {filteredStaff.length > 0 && (
              <div className="flex justify-between items-center px-6 py-4 border-t">
                <div className="text-sm text-gray-600">
                  Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, filteredStaff.length)} of {filteredStaff.length} staff
                </div>
                <div className="flex items-center gap-1">
                  <Button 
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    variant="outline"
                    className="px-3 py-1 text-sm"
                  >
                    Previous
                  </Button>
                  {[...Array(Math.ceil(filteredStaff.length / rowsPerPage))].map((_, idx) => {
                    const pageNum = idx + 1;
                    return (
                      <Button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        className={`px-3 py-1 text-sm min-w-[32px] ${
                          currentPage === pageNum 
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                            : "hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  <Button 
                    onClick={() => setCurrentPage((p) => Math.min(Math.ceil(filteredStaff.length / rowsPerPage), p + 1))}
                    disabled={currentPage === Math.ceil(filteredStaff.length / rowsPerPage)}
                    variant="outline"
                    className="px-3 py-1 text-sm"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
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
                className="bg-gray-100 hover:bg-gray-200 text-gray-600 border-gray-200"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveEdit} 
                className="bg-blue-100 hover:bg-blue-200 text-blue-600 border-blue-200"
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
              className="bg-gray-100 hover:bg-gray-200 text-gray-600 border-gray-200"
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmDelete}
              className="bg-red-100 hover:bg-red-200 text-red-600 border-red-200"
            >
              Delete Staff
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffManagement;