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
import { CalendarIcon, Search, Users, Download, CheckCircle, XCircle, Clock, RotateCcw, Trash2, UserCheck, UserX, Timer, ClockIcon, RefreshCw, Plus, ChevronLeft, ChevronRight, CreditCard, Edit2, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { DatabaseService } from '@/services/databaseService';
import LoadingScreen from '@/components/shared/LoadingScreen';

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
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Professional Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 hover:shadow-md hover:scale-[1.01] transition-all duration-300 cursor-pointer">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 lg:gap-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center transition-all duration-300 hover:bg-green-700 hover:scale-110">
                <CreditCard className="w-6 h-6 text-white transition-transform duration-300 hover:rotate-3" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 transition-colors duration-300 hover:text-green-600">Staff Salary Payment</h1>
                <p className="text-gray-600 mt-1 transition-colors duration-300 hover:text-gray-700">
                  <span className="inline-flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 transition-transform duration-300 hover:scale-125"></div>
                    System Online
                  </span>
                  <span className="mx-2">•</span>
                  <span>{filteredStaff.length} Active Staff</span>
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full lg:w-auto">
              <Button 
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                  refreshData();
                }}
                disabled={loading}
                variant="outline"
                className="flex items-center space-x-2 hover:scale-105 transition-all duration-300 hover:shadow-md hover:border-green-300 hover:bg-green-50 w-full sm:w-auto"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''} transition-transform duration-300 hover:rotate-180`} />
                <span className="font-medium">Refresh</span>
              </Button>
              
              <Button 
                onClick={exportToExcel}
                variant="outline"
                className="flex items-center space-x-2 hover:scale-105 transition-all duration-300 hover:shadow-md hover:border-blue-300 hover:bg-blue-50 w-full sm:w-auto"
              >
                <Download className="h-4 w-4 transition-transform duration-300 hover:scale-110" />
                <span className="font-medium">Export</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Professional Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6">
          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500"></div>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 sm:p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors duration-300">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Total Staff</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">{stats.total}</p>
                </div>
              </div>
              <div className="mt-3 sm:mt-4 h-1 bg-blue-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-green-500"></div>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 sm:p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors duration-300">
                  <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Total Salary</p>
                  <p className="text-sm sm:text-2xl font-bold text-gray-900 group-hover:text-green-600 transition-colors duration-300">₹{stats.totalSalary.toLocaleString()}</p>
                </div>
              </div>
              <div className="mt-3 sm:mt-4 h-1 bg-green-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 sm:p-3 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors duration-300">
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Total Paid</p>
                  <p className="text-sm sm:text-2xl font-bold text-gray-900 group-hover:text-emerald-600 transition-colors duration-300">₹{stats.totalPaid.toLocaleString()}</p>
                </div>
              </div>
              <div className="mt-3 sm:mt-4 h-1 bg-emerald-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-orange-500"></div>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 sm:p-3 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors duration-300">
                  <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Total Pending</p>
                  <p className="text-sm sm:text-2xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors duration-300">₹{stats.totalPending.toLocaleString()}</p>
                </div>
              </div>
              <div className="mt-3 sm:mt-4 h-1 bg-orange-200 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search staff by name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-green-500 focus:ring-green-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="border-gray-300 hover:border-green-500 hover:bg-green-50">
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Staff Salary Payment</h3>
            <p className="text-sm text-gray-600 mt-1">Manage and track staff salary payments</p>
          </div>
          
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
                          <div className="flex items-center justify-center space-x-2">
                            <Button
                              size="sm"
                              onClick={() => handleEditStaff(staff)}
                              variant="outline"
                              className="h-8 w-8 p-0 border-orange-300 hover:border-orange-500 hover:bg-orange-50 hover:scale-105 transition-all duration-300"
                            >
                              <Edit2 className="h-4 w-4 text-orange-600" />
                            </Button>
                            {(parseFloat(staff.total_paid || '0') > 0) && (
                              <Button
                                size="sm"
                                onClick={() => handleDeleteClick(staff)}
                                variant="outline"
                                className="h-8 w-8 p-0 border-red-300 hover:border-red-500 hover:bg-red-50 hover:scale-105 transition-all duration-300"
                              >
                                <RotateCcw className="h-4 w-4 text-red-600" />
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
            <div className="bg-gray-50/80 px-4 sm:px-6 py-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <p className="text-sm text-gray-600">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredStaff.length)} of {filteredStaff.length} staff
                </p>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="border-gray-300 text-gray-600 hover:bg-green-50 hover:border-green-300 hover:text-green-600 transition-all duration-200 hover:scale-105"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  {Array.from({ length: Math.min(5, Math.ceil(filteredStaff.length / itemsPerPage)) }, (_, i) => {
                    const pageNumber = i + Math.max(1, currentPage - 2);
                    if (pageNumber > Math.ceil(filteredStaff.length / itemsPerPage)) return null;
                    return (
                      <Button
                        key={pageNumber}
                        variant={currentPage === pageNumber ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNumber)}
                        className={cn(
                          "w-10 h-8 transition-all duration-200 hover:scale-110",
                          currentPage === pageNumber 
                            ? "bg-green-600 text-white hover:bg-green-700 shadow-lg" 
                            : "border-gray-300 text-gray-600 hover:bg-green-50 hover:border-green-300 hover:text-green-600"
                        )}
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(Math.ceil(filteredStaff.length / itemsPerPage), currentPage + 1))}
                    disabled={currentPage === Math.ceil(filteredStaff.length / itemsPerPage)}
                    className="border-gray-300 text-gray-600 hover:bg-green-50 hover:border-green-300 hover:text-green-600 transition-all duration-200 hover:scale-105"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

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
                <Button variant="outline" onClick={() => setEditStaff(null)}>
                  Cancel
                </Button>
                <Button onClick={saveEditedStaff} className="bg-green-600 hover:bg-green-700 text-white">
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
                className="px-6 border-gray-300 text-gray-600 hover:bg-gray-50 transition-all duration-200 hover:scale-105"
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmDeleteStaff}
                className="px-6 bg-orange-600 hover:bg-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
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
