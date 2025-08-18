import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { CalendarIcon, Search, Users, Download, CheckCircle, XCircle, Clock, RotateCcw, Trash2, UserCheck, UserX, Timer, ClockIcon, RefreshCw, Plus, ChevronLeft, ChevronRight, CreditCard, Edit2, User, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { DatabaseService } from '@/services/databaseService';
import LoadingScreen from '@/components/shared/LoadingScreen';
import '@/styles/global-crm-design.css';

interface StaffSalary {
  id: string;
  name: string;
  salary: string;
  total_paid: string;
  payment_mode: string;
  photo?: string;
  status: string;
  join_date?: string;
}

const SalaryPayment: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [downloadMonth, setDownloadMonth] = useState<Date>(new Date());
  const [staff, setStaff] = useState<StaffSalary[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredStaff, setFilteredStaff] = useState<StaffSalary[]>([]);
  const [loading, setLoading] = useState(true);
  const [editStaff, setEditStaff] = useState<StaffSalary | null>(null);
  const [deleteStaff, setDeleteStaff] = useState<StaffSalary | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Set initial page when component mounts
  useEffect(() => {
    setCurrentPage(1);
  }, []);

  useEffect(() => {
    loadStaff();
  }, [selectedDate]);

  useEffect(() => {
    filterStaff();
  }, [staff, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, staff]);

  // Ensure we stay on first page when data changes
  useEffect(() => {
    if (filteredStaff.length > 0) {
      setCurrentPage(1);
    }
  }, [filteredStaff.length]);

  const filterStaff = () => {
    let filtered = staff;
    if (searchTerm) {
      filtered = staff.filter(member =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Only include active staff
    filtered = filtered.filter(s => s.status === 'active' || s.status === 'Active');
    
    // Sort staff by ID in ascending order
    filtered.sort((a, b) => {
      const getNum = (id: string) => {
        if (!id) return 0;
        const match = id.match(/STF(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      };
      return getNum(a.id) - getNum(b.id);
    });
    
    setFilteredStaff(filtered);
  };

  const loadStaff = async () => {
    try {
      setLoading(true);
      const response = await DatabaseService.getStaffSalarySummary();
      setStaff(response.staff || []);
      setCurrentPage(1); // Ensure we start from the first page
    } catch (error) {
      console.error('Error loading staff:', error);
      toast({
        title: "Error",
        description: "Failed to load staff salary data",
        variant: "destructive",
      });
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    await loadStaff();
    toast({
      title: "Data Refreshed",
      description: "Staff salary data updated successfully",
    });
  };

  const updateStaffSalary = async (staffId: string, updateData: { total_paid: number; payment_mode: "Cash" | "UPI" | "Cheque" | "Bank" }) => {
    try {
      await DatabaseService.updateStaffSalaryPayment(staffId, updateData);
      
      // Update local state
      setStaff(prev => 
        prev.map(s => 
          s.id === staffId 
            ? { ...s, total_paid: updateData.total_paid.toString(), payment_mode: updateData.payment_mode }
            : s
        )
      );

      toast({
        title: "Salary Updated",
        description: "Staff salary payment updated successfully",
      });
    } catch (error) {
      console.error('Error updating staff salary:', error);
      toast({
        title: "Error",
        description: "Failed to update salary payment",
        variant: "destructive",
      });
    }
  };

  const exportToExcel = () => {
    const currentDate = selectedDate || new Date();
    
    // Create data structure for Excel export
    const salaryRecords = filteredStaff.map((staff, index) => {
      const balance = (parseFloat(staff.salary || '0') - parseFloat(staff.total_paid || '0')).toFixed(2);
      return {
        'S No': index + 1,
        'Staff ID': staff.id,
        'Staff Name': staff.name || '',
        'Salary': `₹${staff.salary || '0'}`,
        'Total Paid': `₹${staff.total_paid || '0'}`,
        'Balance': `₹${balance}`,
        'Payment Mode': staff.payment_mode || '-',
        'Join Date': staff.join_date ? format(new Date(staff.join_date), 'dd/MM/yyyy') : '-'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(salaryRecords);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Staff Salary');
    
    const fileName = `staff-salary-payment-${format(currentDate, 'MMM-yyyy')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    toast({
      title: "Export Successful",
      description: `Staff salary data exported to ${fileName}`,
    });
  };

  const handleEditStaff = (staff: StaffSalary) => {
    setEditStaff({ ...staff });
  };

  const saveEditedStaff = async () => {
    if (!editStaff) return;

    try {
      await updateStaffSalary(editStaff.id, {
        total_paid: parseFloat(editStaff.total_paid || '0'),
        payment_mode: (editStaff.payment_mode as "Cash" | "UPI" | "Cheque" | "Bank") || "Cash"
      });
      
      setEditStaff(null);
    } catch (error) {
      console.error('Error updating staff salary:', error);
    }
  };

  const handleDeleteClick = (staff: StaffSalary) => {
    setDeleteStaff(staff);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteStaff = async () => {
    if (!deleteStaff) return;
    
    try {
      // Reset salary payment data
      await updateStaffSalary(deleteStaff.id, {
        total_paid: 0,
        payment_mode: 'Cash'
      });
      
      setShowDeleteConfirm(false);
      setDeleteStaff(null);
      
      toast({
        title: "Success",
        description: "Staff salary payment data reset successfully",
      });
    } catch (error) {
      console.error('Error resetting staff salary:', error);
      toast({
        title: "Error",
        description: "Failed to reset salary payment data",
        variant: "destructive",
      });
    }
  };

  // Calculate stats dynamically when dependencies change
  const stats = useMemo(() => {
    const totalSalary = filteredStaff.reduce((sum, s) => sum + (parseFloat(s.salary) || 0), 0);
    const totalPaid = filteredStaff.reduce((sum, s) => sum + (parseFloat(s.total_paid) || 0), 0);
    const totalPending = totalSalary - totalPaid;
    
    return {
      total: filteredStaff.length,
      totalSalary,
      totalPaid,
      totalPending
    };
  }, [filteredStaff]);

  if (loading) {
    return <LoadingScreen message="Loading staff salary data..." />;
  }

  return (
    <div className="crm-page-bg">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* CRM Header */}
        <div className="crm-header-container">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
            <div className="flex items-center gap-3">
              <div className="crm-header-icon">
                <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Staff Salary Payment</h1>
                <p className="text-sm sm:text-base text-gray-600">Manage and track staff salary payments</p>
              </div>
            </div>
            
            <div className="flex flex-row sm:flex-row gap-1 sm:gap-3 w-full sm:w-auto">
              <Button 
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                  refreshData();
                }}
                disabled={loading}
                className="global-btn flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
              >
                <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
                <span className="sm:hidden">↻</span>
              </Button>
              
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
          {/* Total Staff Card */}
          <Card className="crm-stat-card crm-stat-card-blue">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-blue-700 mb-1 truncate">Total Staff</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-900 mb-1">{stats.total}</p>
                  <div className="flex items-center text-xs text-blue-600">
                    <Activity className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Active</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-blue">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Salary Card */}
          <Card className="crm-stat-card crm-stat-card-green">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-green-700 mb-1 truncate">Total Salary</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-900 mb-1">₹{stats.totalSalary.toLocaleString()}</p>
                  <div className="flex items-center text-xs text-green-600">
                    <Activity className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Monthly</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-green">
                  <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Paid Card */}
          <Card className="crm-stat-card crm-stat-card-purple">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-purple-700 mb-1 truncate">Total Paid</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-900 mb-1">₹{stats.totalPaid.toLocaleString()}</p>
                  <div className="flex items-center text-xs text-purple-600">
                    <Activity className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Completed</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-purple">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Pending Card */}
          <Card className="crm-stat-card crm-stat-card-orange">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-orange-700 mb-1 truncate">Total Pending</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-900 mb-1">₹{stats.totalPending.toLocaleString()}</p>
                  <div className="flex items-center text-xs text-orange-600">
                    <Activity className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Outstanding</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-orange">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search staff by name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button className="global-btn">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {selectedDate ? format(selectedDate, 'dd/MM/yyyy') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Salary Payment Table */}
        <Card className="crm-table-container">
          <CardHeader className="crm-table-header">
            <div className="crm-table-title">
              <CreditCard className="crm-table-title-icon" />
              <span className="crm-table-title-text">Staff Salary Payment ({filteredStaff.length})</span>
              <span className="crm-table-title-text-mobile">Salary ({filteredStaff.length})</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80 hover:bg-gray-50">
                  <TableHead className="text-center font-semibold text-gray-700">S No</TableHead>
                  <TableHead className="text-center font-semibold text-gray-700">Profile</TableHead>
                  <TableHead className="text-center font-semibold text-gray-700">Staff ID</TableHead>
                  <TableHead className="text-center font-semibold text-gray-700">Staff Name</TableHead>
                  <TableHead className="text-center font-semibold text-gray-700">Salary</TableHead>
                  <TableHead className="text-center font-semibold text-gray-700">Paid</TableHead>
                  <TableHead className="text-center font-semibold text-gray-700">Balance</TableHead>
                  <TableHead className="text-center font-semibold text-gray-700">Mode</TableHead>
                  <TableHead className="text-center font-semibold text-gray-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.length > 0 ? (
                  filteredStaff.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((staff, index) => {
                    const balance = (parseFloat(staff.salary || '0') - parseFloat(staff.total_paid || '0')).toFixed(2);
                    const globalIndex = (currentPage - 1) * itemsPerPage + index + 1;
                    
                    return (
                      <TableRow 
                        key={staff.id} 
                        className="hover:bg-gray-50/80 transition-colors duration-200 group"
                      >
                        <TableCell className="text-center font-medium text-gray-900 group-hover:text-green-600 transition-colors duration-200">
                          {globalIndex}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            {staff.photo ? (
                              <>
                                <img
                                  src={staff.photo}
                                  alt={staff.name || 'Profile'}
                                  className="w-10 h-10 rounded-full object-cover border-2 border-green-200 shadow-sm group-hover:border-green-300 transition-colors duration-200"
                                  onError={(e) => {
                                    console.log(`Failed to load image: ${staff.photo}`);
                                    const target = e.currentTarget as HTMLImageElement;
                                    target.style.display = 'none';
                                    const fallback = target.nextElementSibling as HTMLElement;
                                    if (fallback) fallback.style.display = 'flex';
                                  }}
                                />
                                <div 
                                  className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors duration-200"
                                  style={{ display: 'none' }}
                                >
                                  <span className="text-sm font-semibold text-green-600">
                                    {staff.name?.charAt(0)?.toUpperCase() || 'S'}
                                  </span>
                                </div>
                              </>
                            ) : (
                              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors duration-200">
                                <span className="text-sm font-semibold text-green-600">
                                  {staff.name?.charAt(0)?.toUpperCase() || 'S'}
                                </span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-medium text-gray-900 group-hover:text-green-600 transition-colors duration-200">
                          {staff.id}
                        </TableCell>
                        <TableCell className="text-center font-medium text-gray-900 group-hover:text-green-600 transition-colors duration-200">
                          {staff.name}
                        </TableCell>
                        <TableCell className="text-center font-medium text-gray-700">
                          ₹{staff.salary || '0'}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 group-hover:bg-emerald-200 transition-colors duration-200">
                            ₹{staff.total_paid || '0'}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-all duration-200",
                            parseFloat(balance) > 0 
                              ? "bg-orange-100 text-orange-800 group-hover:bg-orange-200"
                              : "bg-green-100 text-green-800 group-hover:bg-green-200"
                          )}>
                            ₹{balance}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 group-hover:bg-purple-200 transition-colors duration-200">
                            {staff.payment_mode || 'Not Set'}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="action-buttons-container">
                            <Button
                              size="sm"
                              onClick={() => handleEditStaff(staff)}
                              className="action-btn-lead action-btn-edit h-8 w-8 sm:h-9 sm:w-9 p-0"
                              title="Edit Salary Payment"
                            >
                              <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                            {(parseFloat(staff.total_paid || '0') > 0) && (
                              <Button
                                size="sm"
                                onClick={() => handleDeleteClick(staff)}
                                className="action-btn-lead action-btn-delete h-8 w-8 sm:h-9 sm:w-9 p-0"
                                title="Reset Payment"
                              >
                                <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="p-4 bg-gray-100 rounded-full">
                          <Users className="h-8 w-8 text-gray-400" />
                        </div>
                        <div className="text-center">
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No staff found</h3>
                          <p className="text-gray-500">No staff match your search criteria or no staff have been added yet.</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Professional Pagination */}
          {Math.ceil(filteredStaff.length / itemsPerPage) > 1 && (
            <div className="crm-pagination-container">
              <div className="text-xs sm:text-sm text-gray-600 order-2 sm:order-1">
                <span className="hidden sm:inline">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredStaff.length)} of {filteredStaff.length} staff
                </span>
                <span className="sm:hidden">
                  {currentPage} / {Math.ceil(filteredStaff.length / itemsPerPage)}
                </span>
              </div>
              <div className="flex items-center gap-2 order-1 sm:order-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="bg-white hover:bg-gray-50 text-gray-600 border-gray-300 text-xs sm:text-sm px-2 sm:px-3"
                >
                  <span className="hidden sm:inline">Previous</span>
                  <span className="sm:hidden">Prev</span>
                </Button>
                
                {/* Page Numbers */}
                <div className="hidden sm:flex items-center gap-1">
                  {Array.from({ length: Math.min(5, Math.ceil(filteredStaff.length / itemsPerPage)) }, (_, i) => {
                    const pageNumber = i + Math.max(1, currentPage - 2);
                    if (pageNumber > Math.ceil(filteredStaff.length / itemsPerPage)) return null;
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
                  onClick={() => setCurrentPage(Math.min(Math.ceil(filteredStaff.length / itemsPerPage), currentPage + 1))}
                  disabled={currentPage === Math.ceil(filteredStaff.length / itemsPerPage)}
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

        {/* Edit Staff Salary Dialog */}
        {editStaff && (
          <Dialog open={!!editStaff} onOpenChange={() => setEditStaff(null)}>
            <DialogContent className="sm:max-w-md bg-white border border-gray-200 shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-green-800">Edit Salary Payment</DialogTitle>
                <DialogDescription className="text-green-600">
                  Update salary payment for {editStaff.name}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Monthly Salary: ₹{editStaff.salary || '0'}</Label>
                </div>
                
                <div className="space-y-2">
                  <Label>Total Paid Amount</Label>
                  <Input
                    type="number"
                    min="0"
                    max={editStaff.salary}
                    value={editStaff.total_paid || ''}
                    onChange={(e) =>
                      setEditStaff({ ...editStaff, total_paid: e.target.value })
                    }
                    placeholder="Enter paid amount"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Payment Mode</Label>
                  <Select
                    value={editStaff.payment_mode || ''}
                    onValueChange={(value) =>
                      setEditStaff({ ...editStaff, payment_mode: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Bank">Bank Transfer</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="Cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                  <div className="text-sm">
                    <p><strong>Balance:</strong> ₹{(parseFloat(editStaff.salary || '0') - parseFloat(editStaff.total_paid || '0')).toFixed(2)}</p>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setEditStaff(null)}
                  className="global-btn"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={saveEditedStaff} 
                  className="global-btn"
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Professional Delete Confirmation Dialog */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent className="sm:max-w-md bg-white border border-gray-200 shadow-2xl">
            <DialogHeader className="text-center pb-4">
              <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <RotateCcw className="h-6 w-6 text-orange-600" />
              </div>
              <DialogTitle className="text-xl font-semibold text-gray-900">Reset Salary Payment</DialogTitle>
              <DialogDescription className="text-center text-gray-600 mt-2">
                Are you sure you want to reset the salary payment for{' '}
                <span className="font-semibold text-gray-900">{deleteStaff?.name}</span>?
                <br />
                <span className="text-orange-600 font-medium text-sm">This will set paid amount to ₹0 and clear payment mode.</span>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex justify-center gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteConfirm(false)}
                className="global-btn px-6"
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmDeleteStaff}
                className="global-btn px-6"
              >
                Reset Payment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default SalaryPayment;
