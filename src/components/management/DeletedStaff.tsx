import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ActionButtons } from '@/components/ui/HeaderActionButtons';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { 
  Trash2, 
  Download, 
  Search, 
  Filter, 
  RotateCcw, 
  UserMinus, 
  Calendar as CalendarIcon, 
  Edit,
  Eye,
  Printer,
  X,
  UserCheck,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { DatabaseService } from '@/services/databaseService';
import LoadingScreen from '@/components/shared/LoadingScreen';
import usePageTitle from '@/hooks/usePageTitle';
import '@/styles/global-crm-design.css';

interface Staff {
  id: string;
  name: string;
  role: string;
  phone: string;
  email?: string;
  address?: string;
  category?: string;
  joiningDate?: string;
  photo?: string;
  deleted_at: string;
  deleted_by: string;
}

const DeletedStaff: React.FC = () => {
  // Set page title
  usePageTitle();

  const [deletedStaff, setDeletedStaff] = useState<Staff[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<Staff[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateFilter, setDateFilter] = useState('');
  const [deletedByFilter, setDeletedByFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [restoreStaff, setRestoreStaff] = useState<Staff | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);

  // Set initial page when component mounts
  useEffect(() => {
    setCurrentPage(1);
  }, []);

  useEffect(() => {
    loadDeletedStaff();
  }, [selectedDate]);

  useEffect(() => {
    filterStaff();
  }, [deletedStaff, searchTerm, dateFilter, deletedByFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filteredStaff]);

  const loadDeletedStaff = async () => {
    try {
      setLoading(true);
      const deleted = await DatabaseService.getDeletedStaff();
      console.log('Fetched deleted staff from MySQL:', deleted);
      setDeletedStaff(deleted);
    } catch (error) {
      console.error('Error fetching deleted staff:', error);
      // Fallback to localStorage if MySQL fails
      const deleted = JSON.parse(localStorage.getItem('deletedStaff') || '[]');
      const updatedDeleted = deleted.map((staff: any) => ({
        ...staff,
        deleted_by: staff.deletedBy || staff.deleted_by || 'System',
        deleted_at: staff.deletedAt || staff.deleted_at || new Date().toISOString(),
      }));
      setDeletedStaff(updatedDeleted);
    } finally {
      setLoading(false);
    }
  };

  const filterStaff = () => {
    let filtered = deletedStaff;
    
    if (searchTerm) {
      filtered = filtered.filter((staff) =>
        staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (staff.phone && staff.phone.includes(searchTerm))
      );
    }
    
    if (dateFilter) {
      filtered = filtered.filter((staff) => {
        const deletedDate = new Date(staff.deleted_at).toISOString().split('T')[0];
        return deletedDate === dateFilter;
      });
    }
    
    if (deletedByFilter && deletedByFilter !== 'all') {
      filtered = filtered.filter((staff) =>
        staff.deleted_by.toLowerCase().includes(deletedByFilter.toLowerCase())
      );
    }
    
    setFilteredStaff(filtered);
  };

  const handleRestore = async (staff: Staff) => {
    setRestoreStaff(staff);
    setShowRestoreConfirm(true);
  };

  const confirmRestore = async () => {
    if (!restoreStaff) return;

    try {
      await DatabaseService.restoreStaff(restoreStaff.id);
      
      const updatedDeleted = deletedStaff.filter((s: Staff) => s.id !== restoreStaff.id);
      setDeletedStaff(updatedDeleted);
      
      toast({
        title: "Staff Restored",
        description: `${restoreStaff.name} has been restored successfully.`,
      });
      
      setShowRestoreConfirm(false);
      setRestoreStaff(null);
      console.log('Staff restored successfully');
    } catch (error) {
      console.error('Error restoring staff:', error);
      toast({
        title: "Error",
        description: "Failed to restore staff member. Please try again.",
        variant: "destructive",
      });
    }
  };

  const exportToExcel = () => {
    const exportData = filteredStaff.map((staff, index) => ({
      'S No': index + 1,
      'Staff ID': staff.id,
      'Name': staff.name,
      'Role': staff.role,
      'Phone': staff.phone,
      'Email': staff.email || 'N/A',
      'Date Deleted': format(new Date(staff.deleted_at), 'dd/MM/yyyy'),
      'Deleted By': staff.deleted_by,
      'Status': 'Deleted'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Deleted Staff');
    XLSX.writeFile(wb, `deleted-staff-${format(new Date(), 'dd-MM-yyyy')}.xlsx`);
    
    toast({
      title: "Export Successful",
      description: "Deleted staff data has been exported to Excel.",
    });
  };

  const formatDate = (date: string) => {
    try {
      return format(new Date(date), 'dd/MM/yyyy');
    } catch {
      return 'Invalid Date';
    }
  };

  const getStaffImageUrl = (photoPath: string) => {
    if (!photoPath) return '/api/placeholder/40/40';
    
    // Handle both old and new path formats
    if (photoPath.startsWith('Photos/') || photoPath.startsWith('Photos\\')) {
      return `${import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:4000'}/${photoPath.replace(/\\/g, '/')}`;
    }
    
    return `${import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:4000'}/${photoPath}`;
  };

  const getDeletedByOptions = () => {
    const uniqueDeletedBy = [...new Set(deletedStaff.map(s => s.deleted_by))];
    return uniqueDeletedBy.sort();
  };

  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentStaff = filteredStaff.slice(startIndex, endIndex);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="crm-page-bg">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* CRM Header */}
        <div className="crm-header-container">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
            <div className="flex items-center gap-3">
              <div className="crm-header-icon">
                <UserMinus className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Deleted Staff</h1>
              </div>
            </div>
            
            <div className="flex flex-row sm:flex-row gap-1 sm:gap-3 w-full sm:w-auto">
              <ActionButtons.Refresh onClick={() => {
                console.log('🔄 Manual refresh triggered - refreshing entire page');
                window.location.reload();
              }} />

              <Button 
                onClick={exportToExcel}
                className="global-btn flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Export</span>
                <span className="sm:hidden">↓</span>
              </Button>
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
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-900 mb-1">{deletedStaff.length}</p>
                  <div className="flex items-center text-xs text-red-600">
                    <Activity className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Removed</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-red">
                  <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filtered Results Card */}
          <Card className="crm-stat-card crm-stat-card-orange">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-orange-700 mb-1 truncate">Filtered Results</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-900 mb-1">{filteredStaff.length}</p>
                  <div className="flex items-center text-xs text-orange-600">
                    <Activity className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Showing</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-orange">
                  <Filter className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* This Month Card */}
          <Card className="crm-stat-card crm-stat-card-blue">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-blue-700 mb-1 truncate">This Month</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-900 mb-1">
                    {deletedStaff.filter(s => {
                      const deletedDate = new Date(s.deleted_at);
                      const now = new Date();
                      return deletedDate.getMonth() === now.getMonth() && deletedDate.getFullYear() === now.getFullYear();
                    }).length}
                  </p>
                  <div className="flex items-center text-xs text-blue-600">
                    <Activity className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Recent</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-blue">
                  <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
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
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-900 mb-1">{filteredStaff.length}</p>
                  <div className="flex items-center text-xs text-green-600">
                    <Activity className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Available</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-green">
                  <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="crm-controls-container">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by name, ID, phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="min-w-[150px]">
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="min-w-[150px]">
                <select
                  className="w-full h-10 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={deletedByFilter}
                  onChange={(e) => setDeletedByFilter(e.target.value)}
                >
                  <option value="">All Users</option>
                  {getDeletedByOptions().map((person) => (
                    <option key={person} value={person}>
                      {person}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                onClick={() => {
                  setSearchTerm('');
                  setDateFilter('');
                  setDeletedByFilter('');
                }}
                className="global-btn"
              >
                <Filter className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        </div>

        {/* Staff Table */}
        <Card className="crm-table-container">
          <CardHeader className="crm-table-header">
            <div className="crm-table-title">
              <UserMinus className="crm-table-title-icon" />
              <span className="crm-table-title-text">Deleted Staff Records ({filteredStaff.length})</span>
              <span className="crm-table-title-text-mobile">Deleted ({filteredStaff.length})</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {currentStaff.length === 0 ? (
              <div className="text-center py-12">
                <UserMinus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No deleted staff found</h3>
                <p className="text-gray-500">Try adjusting your search criteria or filters.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-center font-semibold">S No</TableHead>
                        <TableHead className="text-center font-semibold">Photo</TableHead>
                        <TableHead className="text-center font-semibold">Staff ID</TableHead>
                        <TableHead className="text-center font-semibold">Name</TableHead>
                        <TableHead className="text-center font-semibold">Role</TableHead>
                        <TableHead className="text-center font-semibold">Phone</TableHead>
                        <TableHead className="text-center font-semibold">Date Deleted</TableHead>
                        <TableHead className="text-center font-semibold">Deleted By</TableHead>
                        <TableHead className="text-center font-semibold">Status</TableHead>
                        <TableHead className="text-center font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentStaff.map((staff, idx) => (
                        <TableRow 
                          key={staff.id} 
                          className="hover:bg-gray-50 transition-colors duration-200"
                        >
                          <TableCell className="text-center font-medium">
                            {startIndex + idx + 1}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <Avatar className="h-10 w-10">
                                <AvatarImage 
                                  src={getStaffImageUrl(staff.photo || '')} 
                                  alt={staff.name}
                                />
                                <AvatarFallback className="bg-blue-100 text-blue-600 font-medium">
                                  {staff.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="font-mono">
                              {staff.id}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            {staff.name}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">
                              {staff.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center font-mono">
                            {staff.phone}
                          </TableCell>
                          <TableCell className="text-center">
                            {formatDate(staff.deleted_at)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">
                              {staff.deleted_by}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="destructive">
                              Deleted
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="action-buttons-container">
                              <Button
                                size="sm"
                                onClick={() => handleRestore(staff)}
                                className="action-btn-lead action-btn-view h-8 w-8 sm:h-9 sm:w-9 p-0"
                                title="Restore Staff"
                              >
                                <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* CRM Pagination */}
                {totalPages > 1 && (
                  <div className="crm-pagination-container">
                    <div className="text-xs sm:text-sm text-gray-600 order-2 sm:order-1">
                      <span className="hidden sm:inline">
                        Showing {startIndex + 1} to {Math.min(endIndex, filteredStaff.length)} of {filteredStaff.length} results
                      </span>
                      <span className="sm:hidden">
                        {currentPage} / {totalPages}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 order-1 sm:order-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="bg-white hover:bg-gray-50 text-gray-600 border-gray-300 text-xs sm:text-sm px-2 sm:px-3"
                      >
                        <span className="hidden sm:inline">Previous</span>
                        <span className="sm:hidden">Prev</span>
                      </Button>
                      
                      {/* Page Numbers */}
                      <div className="hidden sm:flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const pageNumber = i + Math.max(1, currentPage - 2);
                          if (pageNumber > totalPages) return null;
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
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="bg-white hover:bg-gray-50 text-gray-600 border-gray-300 text-xs sm:text-sm px-2 sm:px-3"
                      >
                        <span className="hidden sm:inline">Next</span>
                        <span className="sm:hidden">Next</span>
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Restore Confirmation Dialog */}
        <Dialog open={showRestoreConfirm} onOpenChange={setShowRestoreConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <RotateCcw className="w-5 h-5 mr-2 text-green-600" />
                Restore Staff Member
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to restore <strong>{restoreStaff?.name}</strong>? 
                This will move them back to the active staff list.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowRestoreConfirm(false)}
                className="global-btn"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmRestore}
                className="global-btn"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Restore Staff
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default DeletedStaff;
