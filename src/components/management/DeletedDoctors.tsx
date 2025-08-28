import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ActionButtons } from '@/components/ui/HeaderActionButtons';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Trash2, RotateCcw, Search, Eye, Users, Calendar, Filter, Activity, Download, RefreshCw, Clock, UserCheck, Stethoscope, Phone, Mail, Building, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { DatabaseService } from '@/services/databaseService';
import usePageTitle from '@/hooks/usePageTitle';
import '@/styles/global-crm-design.css';

interface Doctor {
  id: string;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  specialization?: string;
  department?: string;
  join_date?: string;
  joinDate?: string;
  photo?: string;
  deletedAt: string;
  deletedBy: string;
}

const DeletedDoctors: React.FC = () => {
  // Set page title
  usePageTitle();

  const [deletedDoctors, setDeletedDoctors] = useState<Doctor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [deletedByFilter, setDeletedByFilter] = useState('');
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeletedDoctors();
  }, []);

  useEffect(() => {
    filterDoctors();
  }, [deletedDoctors, searchTerm, dateFilter, deletedByFilter]);

  const loadDeletedDoctors = async () => {
    try {
      setLoading(true);
      const doctors = await DatabaseService.getDeletedDoctors();
      console.log('Loaded deleted doctors:', doctors);
      setDeletedDoctors(doctors);
    } catch (error) {
      console.error('Error loading deleted doctors:', error);
      toast({
        title: "Error",
        description: "Failed to load deleted doctors. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterDoctors = () => {
    let filtered = deletedDoctors;
    if (searchTerm) {
      filtered = filtered.filter(doctor =>
        doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doctor.phone && doctor.phone.includes(searchTerm))
      );
    }
    if (dateFilter) {
      filtered = filtered.filter(doctor => {
        const deletedDate = format(new Date(doctor.deletedAt), 'yyyy-MM-dd');
        return deletedDate === dateFilter;
      });
    }
    if (deletedByFilter && deletedByFilter !== 'all') {
      filtered = filtered.filter(doctor => 
        doctor.deletedBy.toLowerCase().includes(deletedByFilter.toLowerCase())
      );
    }
    setFilteredDoctors(filtered);
    setCurrentPage(1);
  };

  const restoreDoctor = async (doctorId: string) => {
    try {
      await DatabaseService.restoreDoctor(doctorId);
      await loadDeletedDoctors(); // Refresh the list
      toast({
        title: "Doctor Restored",
        description: `Doctor has been restored successfully.`,
      });
    } catch (error) {
      console.error('Error restoring doctor:', error);
      toast({
        title: "Error",
        description: "Failed to restore doctor. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (date: string) => {
    return format(new Date(date), 'dd/MM/yyyy');
  };

  const getDeletedByOptions = () => {
    const uniqueDeletedBy = [...new Set(deletedDoctors.map(d => d.deletedBy))];
    return uniqueDeletedBy.sort();
  };

  const totalPages = Math.ceil(filteredDoctors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDoctors = filteredDoctors.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-lg">Loading deleted doctors...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="crm-page-bg">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* CRM Header */}
        <div className="crm-header-container">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
            <div className="flex items-center gap-3">
              <div className="crm-header-icon">
                <Trash2 className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Deleted Doctors</h1>
              </div>
            </div>

            <div className="flex flex-row sm:flex-row gap-1 sm:gap-3 w-full sm:w-auto">
              <ActionButtons.Refresh 
                onClick={() => {
                  console.log('🔄 Manual refresh triggered - refreshing entire page');
                  window.location.reload();
                }}
                loading={loading}
                disabled={loading}
              />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="crm-stats-grid">
          {/* Total Deleted Card */}
          <Card className="crm-stat-card crm-stat-card-red">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-red-700 mb-1 truncate">Total Deleted</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-900 mb-1">{deletedDoctors.length}</p>
                  <div className="flex items-center text-xs text-red-600">
                    <Trash2 className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Removed</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-red">
                  <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Deleted Today Card */}
          <Card className="crm-stat-card crm-stat-card-blue">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-blue-700 mb-1 truncate">Deleted Today</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-900 mb-1">
                    {deletedDoctors.filter(doctor => {
                      const deletedDate = new Date(doctor.deletedAt);
                      const today = new Date();
                      return deletedDate.toDateString() === today.toDateString();
                    }).length}
                  </p>
                  <div className="flex items-center text-xs text-blue-600">
                    <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Today</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-blue">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Recent (7 days) Card */}
          <Card className="crm-stat-card crm-stat-card-orange">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-orange-700 mb-1 truncate">Recent (7 days)</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-900 mb-1">
                    {deletedDoctors.filter(doctor => {
                      const deletedDate = new Date(doctor.deletedAt);
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return deletedDate >= weekAgo;
                    }).length}
                  </p>
                  <div className="flex items-center text-xs text-orange-600">
                    <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">This week</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-orange">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Can Restore Card */}
          <Card className="crm-stat-card crm-stat-card-green">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-green-700 mb-1 truncate">Can Restore</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-900 mb-1">{deletedDoctors.length}</p>
                  <div className="flex items-center text-xs text-green-600">
                    <Activity className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Available</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-green">
                  <Activity className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="crm-controls-container">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <Label htmlFor="search" className="text-sm font-medium text-gray-700 mb-2 block">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name, ID, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/80 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="date-filter" className="text-sm font-medium text-gray-700 mb-2 block">Date Deleted</Label>
              <Input
                id="date-filter"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-white/80 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
              />
            </div>
            <div>
              <Label htmlFor="deleted-by" className="text-sm font-medium text-gray-700 mb-2 block">Deleted By</Label>
              <select
                id="deleted-by"
                value={deletedByFilter}
                onChange={e => setDeletedByFilter(e.target.value)}
                className="w-full bg-white/80 border border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg px-3 py-2"
              >
                <option value="all">All users</option>
                {getDeletedByOptions().map((deletedBy) => (
                  <option key={deletedBy} value={deletedBy}>{deletedBy}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Clear Filters</Label>
              <Button 
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setDateFilter('');
                  setDeletedByFilter('');
                }}
                className="modern-btn modern-btn-secondary w-full text-xs sm:text-sm px-2 py-1"
              >
                Clear All
              </Button>
            </div>
          </div>
        </div>
        {/* Deleted Doctors Table */}
        <div className="crm-table-container">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Deleted Doctors ({filteredDoctors.length})
              </h2>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>Page {currentPage} of {totalPages}</span>
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-6">{filteredDoctors.length === 0 ? (
            <div className="text-center py-12">
              <Trash2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No deleted doctors found</h3>
              <p className="text-muted-foreground">
                {searchTerm || dateFilter || deletedByFilter 
                  ? 'Try adjusting your search criteria'
                  : 'No doctors have been deleted yet'
                }
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center">S No</TableHead>
                      <TableHead className="text-center">Doctor ID</TableHead>
                      <TableHead className="text-center">Name</TableHead>
                      <TableHead className="text-center">Phone</TableHead>
                      <TableHead className="text-center">Date Deleted</TableHead>
                      <TableHead className="text-center">Deleted By</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentDoctors.map((doctor, idx) => (
                      <TableRow key={doctor.id} className="hover:bg-muted/50">
                        <TableCell className="text-center">{(currentPage - 1) * itemsPerPage + idx + 1}</TableCell>
                        <TableCell className="font-medium text-center">{doctor.id}</TableCell>
                        <TableCell className="font-medium text-center">{doctor.name}</TableCell>
                        <TableCell className="text-center">{doctor.phone}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center">
                            <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                            {formatDate(doctor.deletedAt)}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{doctor.deletedBy}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="destructive">Deleted</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="crm-modal-container">
                                <DialogHeader className="editpopup form dialog-header">
                                  <div className="editpopup form icon-title-container">
                                    <div className="editpopup form dialog-icon">
                                      <Eye className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                                    </div>
                                    <div className="editpopup form title-description">
                                      <DialogTitle className="editpopup form dialog-title">
                                        Doctor Details - {doctor.name}
                                      </DialogTitle>
                                      <DialogDescription className="editpopup form dialog-description">
                                        Complete information for deleted doctor {doctor.id}
                                      </DialogDescription>
                                    </div>
                                  </div>
                                </DialogHeader>
                                
                                <div className="editpopup form crm-edit-form-content">
                                  <div className="editpopup form crm-edit-form-grid">
                                    <div className="editpopup form crm-edit-form-group">
                                      <Label className="editpopup form crm-edit-form-label flex items-center gap-2">
                                        <UserCheck className="h-4 w-4" />
                                        Name
                                      </Label>
                                      <div className="p-3 bg-gray-50 rounded-lg border">
                                        <span className="text-gray-900">{doctor.name}</span>
                                      </div>
                                    </div>
                                    
                                    <div className="editpopup form crm-edit-form-group">
                                      <Label className="editpopup form crm-edit-form-label flex items-center gap-2">
                                        <Stethoscope className="h-4 w-4" />
                                        Specialization
                                      </Label>
                                      <div className="p-3 bg-gray-50 rounded-lg border">
                                        <span className="text-gray-900">{doctor.specialization || 'N/A'}</span>
                                      </div>
                                    </div>
                                    
                                    <div className="editpopup form crm-edit-form-group">
                                      <Label className="editpopup form crm-edit-form-label flex items-center gap-2">
                                        <Phone className="h-4 w-4" />
                                        Phone
                                      </Label>
                                      <div className="p-3 bg-gray-50 rounded-lg border">
                                        <span className="text-gray-900">{doctor.phone}</span>
                                      </div>
                                    </div>
                                    
                                    <div className="editpopup form crm-edit-form-group">
                                      <Label className="editpopup form crm-edit-form-label flex items-center gap-2">
                                        <Mail className="h-4 w-4" />
                                        Email
                                      </Label>
                                      <div className="p-3 bg-gray-50 rounded-lg border">
                                        <span className="text-gray-900">{doctor.email || 'N/A'}</span>
                                      </div>
                                    </div>
                                    
                                    <div className="editpopup form crm-edit-form-group">
                                      <Label className="editpopup form crm-edit-form-label flex items-center gap-2">
                                        <Building className="h-4 w-4" />
                                        Department
                                      </Label>
                                      <div className="p-3 bg-gray-50 rounded-lg border">
                                        <span className="text-gray-900">{doctor.department || 'N/A'}</span>
                                      </div>
                                    </div>
                                    
                                    <div className="editpopup form crm-edit-form-group">
                                      <Label className="editpopup form crm-edit-form-label flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Joining Date
                                      </Label>
                                      <div className="p-3 bg-gray-50 rounded-lg border">
                                        <span className="text-gray-900">{doctor.joinDate || doctor.join_date ? formatDate(doctor.joinDate || doctor.join_date!) : 'N/A'}</span>
                                      </div>
                                    </div>
                                    
                                    <div className="editpopup form crm-edit-form-group">
                                      <Label className="editpopup form crm-edit-form-label flex items-center gap-2">
                                        <Trash2 className="h-4 w-4" />
                                        Deleted Date
                                      </Label>
                                      <div className="p-3 bg-gray-50 rounded-lg border">
                                        <span className="text-gray-900">{formatDate(doctor.deletedAt)}</span>
                                      </div>
                                    </div>
                                    
                                    <div className="editpopup form crm-edit-form-group">
                                      <Label className="editpopup form crm-edit-form-label flex items-center gap-2">
                                        <UserCheck className="h-4 w-4" />
                                        Deleted By
                                      </Label>
                                      <div className="p-3 bg-gray-50 rounded-lg border">
                                        <span className="text-gray-900">{doctor.deletedBy}</span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="editpopup form crm-edit-form-group">
                                    <Label className="editpopup form crm-edit-form-label flex items-center gap-2">
                                      <MapPin className="h-4 w-4" />
                                      Address
                                    </Label>
                                    <div className="p-3 bg-gray-50 rounded-lg border">
                                      <span className="text-gray-900">{doctor.address || 'N/A'}</span>
                                    </div>
                                  </div>
                                  
                                  {doctor.photo && (
                                    <div className="editpopup form crm-edit-form-group">
                                      <Label className="editpopup form crm-edit-form-label flex items-center gap-2">
                                        <UserCheck className="h-4 w-4" />
                                        Photo
                                      </Label>
                                      <div className="p-3 bg-gray-50 rounded-lg border flex justify-center">
                                        <img src={doctor.photo} alt={doctor.name} className="w-24 h-24 rounded-full object-cover border-2 border-gray-200" />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-success hover:text-success hover:bg-success/10"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Restore Doctor?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will restore {doctor.name} ({doctor.id}) back to the active doctor list.
                                    The doctor will be available for normal operations again.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => restoreDoctor(doctor.id)}
                                    className="bg-success text-success-foreground hover:bg-success/90"
                                  >
                                    Restore Doctor
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 && (
                <div className="crm-pagination-container">
                  <p className="text-sm text-gray-600">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredDoctors.length)} of {filteredDoctors.length} entries
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="action-btn-lead"
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-700 font-medium">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="action-btn-lead"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeletedDoctors;
