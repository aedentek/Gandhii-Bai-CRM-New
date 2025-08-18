import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { DatabaseService } from '@/services/databaseService';
import LoadingScreen from '@/components/shared/LoadingScreen';

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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Professional Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 hover:shadow-md hover:scale-[1.01] transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center transition-all duration-300 hover:bg-red-700 hover:scale-110">
                <UserMinus className="w-6 h-6 text-white transition-transform duration-300 hover:rotate-3" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 transition-colors duration-300 hover:text-red-600">Deleted Staff</h1>
                <p className="text-sm text-gray-600 mt-1">Manage and restore deleted staff members</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button 
                onClick={() => loadDeletedStaff()}
                disabled={loading}
                variant="outline"
                className="global-btn flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''} transition-transform duration-300 hover:rotate-180`} />
                <span className="font-medium">Refresh</span>
              </Button>

              <Button 
                onClick={exportToExcel}
                className="flex items-center space-x-2 hover:scale-105 transition-all duration-300 hover:shadow-md bg-green-600 hover:bg-green-700 text-white"
              >
                <Download className="h-4 w-4 transition-transform duration-300 hover:scale-110" />
                <span className="font-medium">Export</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Professional Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-red-500"></div>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors duration-300">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Total Deleted</p>
                  <p className="text-2xl font-bold text-gray-900 group-hover:text-red-600 transition-colors duration-300">{deletedStaff.length}</p>
                </div>
              </div>
              <div className="mt-4 h-1 bg-red-200 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-orange-500"></div>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors duration-300">
                  <Filter className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Filtered Results</p>
                  <p className="text-2xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors duration-300">{filteredStaff.length}</p>
                </div>
              </div>
              <div className="mt-4 h-1 bg-orange-200 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500"></div>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors duration-300">
                  <CalendarIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors duration-300">This Month</p>
                  <p className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                    {deletedStaff.filter(s => {
                      const deletedDate = new Date(s.deleted_at);
                      const now = new Date();
                      return deletedDate.getMonth() === now.getMonth() && deletedDate.getFullYear() === now.getFullYear();
                    }).length}
                  </p>
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
                  <RotateCcw className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Can Restore</p>
                  <p className="text-2xl font-bold text-gray-900 group-hover:text-green-600 transition-colors duration-300">{filteredStaff.length}</p>
                </div>
              </div>
              <div className="mt-4 h-1 bg-green-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
              <Search className="w-5 h-5 mr-2 text-blue-600" />
              Search & Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search" className="text-sm font-medium text-gray-700">
                  Search Staff
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search by name, ID, phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dateFilter" className="text-sm font-medium text-gray-700">
                  Deleted Date
                </Label>
                <Input
                  id="dateFilter"
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deletedByFilter" className="text-sm font-medium text-gray-700">
                  Deleted By
                </Label>
                <select
                  id="deletedByFilter"
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

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Clear Filters</Label>
                <Button
                  onClick={() => {
                    setSearchTerm('');
                    setDateFilter('');
                    setDeletedByFilter('');
                  }}
                  variant="outline"
                  className="w-full"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Staff Table */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Deleted Staff Records
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-300">
                  {filteredStaff.length} deleted
                </Badge>
                <Badge variant="outline">
                  Page {currentPage} of {totalPages}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
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
                            <div className="flex items-center justify-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRestore(staff)}
                                className="h-8 w-8 p-0 border-green-300 hover:border-green-500 hover:bg-green-50 hover:scale-105 transition-all duration-300"
                              >
                                <RotateCcw className="h-4 w-4 text-green-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Professional Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-gray-200">
                    <div className="text-sm text-gray-700">
                      Showing {startIndex + 1} to {Math.min(endIndex, filteredStaff.length)} of {filteredStaff.length} results
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="flex items-center"
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Previous
                      </Button>
                      
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const pageNum = i + 1;
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                              className={cn(
                                "w-8 h-8 p-0",
                                currentPage === pageNum && "bg-blue-600 text-white"
                              )}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="flex items-center"
                      >
                        Next
                        <ChevronRight className="w-4 h-4 ml-1" />
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
              >
                Cancel
              </Button>
              <Button
                onClick={confirmRestore}
                className="bg-green-600 hover:bg-green-700 text-white"
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
