import React, { useState, useEffect } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ActionButtons } from '@/components/ui/HeaderActionButtons';
import { DatabaseService } from '@/services/databaseService';
import { StaffAdvanceAPI } from '@/services/staffAdvanceAPI';
import { StaffAdvance } from '@/types/staffAdvance';
import MonthYearPickerDialog from '@/components/shared/MonthYearPickerDialog';
import StaffAdvanceModal from '@/components/forms/StaffAdvanceModal';
import { toast } from 'sonner';
import {
  Search,
  Eye,
  Edit,
  User,
  RefreshCcw,
  TrendingUp,
  IndianRupee,
  Plus,
  FileText,
  Clock,
  X,
  Save,
  Calendar,
  Trash2,
  Briefcase
} from 'lucide-react';
import '@/styles/global-crm-design.css';
import '@/styles/global-modal-design.css';

interface Staff {
  id: string;
  name: string;
  phone?: string;
  photo?: string;
  role?: string;
  department?: string;
  status?: string;
  salary?: number | string;
  join_date?: string;
}

const StaffAdvancePage: React.FC = () => {
  usePageTitle();
  // Debug: Component is rendering
  console.log('👥 StaffAdvancePage component is rendering...');
  
  // Months array for filtering
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  
  const [staff, setStaff] = useState<Staff[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<Staff[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Dashboard stats
  const [allAdvances, setAllAdvances] = useState<StaffAdvance[]>([]);
  const [filteredAllAdvances, setFilteredAllAdvances] = useState<StaffAdvance[]>([]);
  
  // Page-level month/year filter states
  const [pageSelectedMonth, setPageSelectedMonth] = useState(currentMonth);
  const [pageSelectedYear, setPageSelectedYear] = useState(currentYear);
  const [showMonthYearDialog, setShowMonthYearDialog] = useState(false);
  const [filterMonth, setFilterMonth] = useState<number | null>(currentMonth);
  const [filterYear, setFilterYear] = useState<number | null>(currentYear);
  
  // Modal states
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [staffAdvances, setStaffAdvances] = useState<StaffAdvance[]>([]);
  const [filteredAdvances, setFilteredAdvances] = useState<StaffAdvance[]>([]);
  
  // Month/Year filter states
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Form states
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceReason, setAdvanceReason] = useState('');
  const [advanceDate, setAdvanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Staff advance modal states
  const [isStaffAdvanceModalOpen, setIsStaffAdvanceModalOpen] = useState(false);
  const [editAdvanceData, setEditAdvanceData] = useState<StaffAdvance | null>(null);
  const [staffList, setStaffList] = useState<any[]>([]);
  
  // Delete dialog states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [advanceToDelete, setAdvanceToDelete] = useState<StaffAdvance | null>(null);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

    // Helper function to format Staff ID for display (STF001, STF002, etc.)
  const formatStaffId = (id: string): string => {
    // Extract the numeric part and format it with leading zeros
    const numStr = id.replace(/\D/g, '');
    const num = parseInt(numStr, 10) || 0;
    
    // Format as 3-digit number with leading zeros (STF001, STF002, etc.)
    return `STF${num.toString().padStart(3, '0')}`;
  };

  // Helper function to sort staff by ID in ascending order (STF001, STF002, etc.)
  const sortStaffById = (staffList: Staff[]): Staff[] => {
    return staffList.sort((a, b) => {
      // Handle different Staff ID formats: STF001, STF0001, STF1, STF05, etc.
      // Extract all digits from staff ID for proper numeric comparison
      const extractNumber = (id: string): number => {
        const numStr = id.replace(/\D/g, ''); // Remove all non-digits
        return parseInt(numStr, 10) || 0;
      };
      
      const aNum = extractNumber(a.id);
      const bNum = extractNumber(b.id);
      
      return aNum - bNum;
    });
  };

  // Filter staff based on search term
  useEffect(() => {
    let filtered: Staff[];
    if (!searchTerm.trim()) {
      filtered = [...staff];
    } else {
      filtered = staff.filter((staffMember) =>
        staffMember.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staffMember.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (staffMember.role && staffMember.role.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (staffMember.department && staffMember.department.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Sort the filtered staff by ID in ascending order
    const sortedFiltered = sortStaffById(filtered);
    setFilteredStaff(sortedFiltered);
  }, [searchTerm, staff]);

  // Apply filters when month/year changes
  useEffect(() => {
    applyFilters();
  }, [filterMonth, filterYear, allAdvances]);

  const applyFilters = () => {
    let filtered = [...allAdvances];
    
    if (filterMonth !== null && filterYear !== null) {
      filtered = filtered.filter(advance => {
        const advanceDate = new Date(advance.date);
        return advanceDate.getMonth() === (filterMonth - 1) && advanceDate.getFullYear() === filterYear;
      });
    }
    
    setFilteredAllAdvances(filtered);
  };

  // Utility function to format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Loading staff and advance data...');
      
      // Load staff data
      const staffData = await DatabaseService.getAllStaff();
      const activeStaff = staffData
        .filter((staffMember: any) => staffMember.status === 'Active')
        .map((staffMember: any) => ({
          id: staffMember.id,
          name: staffMember.name,
          phone: staffMember.phone,
          photo: staffMember.photo,
          role: staffMember.role,
          department: staffMember.department,
          status: staffMember.status
        }));
      
      // Sort staff by ID in ascending order
      const sortedActiveStaff = sortStaffById(activeStaff);
      
      setStaff(sortedActiveStaff);
      setFilteredStaff(sortedActiveStaff);
      
      // Prepare staff list for modal (using sorted staff)
      const staffForModal = sortedActiveStaff.map((staffMember: any) => ({
        staff_id: staffMember.id,
        staff_name: staffMember.name,
        phone: staffMember.phone,
        photo: staffMember.photo,
        role: staffMember.role,
        department: staffMember.department,
        status: staffMember.status
      }));
      setStaffList(staffForModal);
      
      // Load all advances data for dashboard
      try {
        const allAdvancesData = await StaffAdvanceAPI.getAll();
        setAllAdvances(allAdvancesData || []);
      } catch (advanceError) {
        console.error('Error loading staff advances:', advanceError);
        setAllAdvances([]);
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load staff data');
    } finally {
      setIsLoading(false);
    }
  };

  // Action handlers for staff
  const handleViewStaff = async (staffMember: Staff) => {
    console.log('Opening view modal for staff:', staffMember);
    setSelectedStaff(staffMember);
    
    // Always set to current month/year when opening modal
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // 1-12 (August = 8)
    const currentYear = currentDate.getFullYear(); // 2025
    
    console.log('Setting modal to current month:', currentMonth, 'year:', currentYear);
    setSelectedMonth(currentMonth);
    setSelectedYear(currentYear);
    setIsViewModalOpen(true);
    
    // Load existing advances for this staff member
    try {
      console.log(`Loading advances for staff: ${staffMember.id}`);
      const advances = await StaffAdvanceAPI.getByStaffId(staffMember.id);
      console.log('Raw advances data:', advances);
      
      // Filter by currently selected month and year
      const matches = advances.filter((advance: StaffAdvance) => {
        const advanceDate = new Date(advance.date);
        const month = advanceDate.getMonth() + 1; // 1-12
        const year = advanceDate.getFullYear();
        
        console.log(`Advance date: ${advance.date}, month: ${month}, year: ${year}, target: ${currentMonth}/${currentYear}`);
        return month === currentMonth && year === currentYear;
      });
      
      console.log(`Filtered ${matches.length} advances for current month ${currentMonth}/${currentYear}:`, matches);
      setFilteredAdvances(matches);
      
    } catch (error) {
      console.error('Error loading staff advances:', error);
      setStaffAdvances([]);
      setFilteredAdvances([]);
      toast.error('Failed to load staff advances');
    }
  };

  const handleEditStaff = (staffMember: Staff) => {
    console.log('Opening add advance modal for staff:', staffMember);
    setSelectedStaff(staffMember);
    setIsAdvanceModalOpen(true);
  };

  const handleCloseAdvanceModal = () => {
    setIsAdvanceModalOpen(false);
    setSelectedStaff(null);
    setAdvanceAmount('');
    setAdvanceReason('');
    setAdvanceDate(new Date().toISOString().split('T')[0]);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedStaff(null);
    setStaffAdvances([]);
    setFilteredAdvances([]);
  };

  const handleAddAdvance = async () => {
    if (!selectedStaff || !advanceAmount || !advanceDate) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const advanceData = {
        staff_id: selectedStaff.id,
        staff_name: selectedStaff.name,
        date: advanceDate,
        amount: parseFloat(advanceAmount),
        reason: advanceReason
      };

      console.log('Sending advance data:', advanceData);
      await StaffAdvanceAPI.create(advanceData);
      toast.success(`Advance of ₹${advanceAmount} added for ${selectedStaff.name}`);
      
      // Reload all advances to update dashboard stats
      try {
        const advancesData = await StaffAdvanceAPI.getAll();
        setAllAdvances(advancesData || []);
      } catch (reloadError) {
        console.error('Error reloading advances:', reloadError);
      }
      
      // Clear form
      setAdvanceAmount('');
      setAdvanceReason('');
      setAdvanceDate(new Date().toISOString().split('T')[0]);
      
      // Close the modal
      setIsAdvanceModalOpen(false);
      setSelectedStaff(null);
      
    } catch (error) {
      console.error('Error adding advance:', error);
      toast.error('Failed to add advance');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Edit Advance
  const handleEditAdvance = (advance: StaffAdvance) => {
    setEditAdvanceData(advance);
    setIsStaffAdvanceModalOpen(true);
  };

  // Handle Delete Advance - Show confirmation dialog
  const handleDeleteClick = (advance: StaffAdvance) => {
    setAdvanceToDelete(advance);
    setShowDeleteDialog(true);
  };

  const handleDeleteAdvance = async () => {
    if (!advanceToDelete) return;

    try {
      await StaffAdvanceAPI.delete(advanceToDelete.id);
      toast.success('Advance record deleted successfully');
      
      // Close dialog and reset state
      setShowDeleteDialog(false);
      setAdvanceToDelete(null);
      
      // Reload advances for the current view
      if (selectedStaff) {
        const advances = await StaffAdvanceAPI.getByStaffId(selectedStaff.id);
        const matches = advances.filter((advance: StaffAdvance) => {
          const advanceDate = new Date(advance.date);
          return advanceDate.getMonth() + 1 === selectedMonth && advanceDate.getFullYear() === selectedYear;
        });
        setFilteredAdvances(matches);
      }
      
      // Also reload all advances to update dashboard stats
      const allAdvancesData = await StaffAdvanceAPI.getAll();
      setAllAdvances(allAdvancesData || []);
      
    } catch (error) {
      console.error('Error deleting advance:', error);
      toast.error('Failed to delete advance record');
    }
  };

  // Handle modal close for staff advance modal
  const handleStaffAdvanceModalClose = () => {
    setIsStaffAdvanceModalOpen(false);
    setEditAdvanceData(null);
  };

  // Handle successful advance creation/update
  const handleAdvanceSuccess = async () => {
    // Reload all advances to update dashboard stats
    try {
      const allAdvancesData = await StaffAdvanceAPI.getAll();
      setAllAdvances(allAdvancesData || []);
    } catch (error) {
      console.error('Error reloading advances:', error);
    }
    
    // Reload advances for the current view if in view modal
    if (selectedStaff && isViewModalOpen) {
      try {
        const advances = await StaffAdvanceAPI.getByStaffId(selectedStaff.id);
        const matches = advances.filter((advance: StaffAdvance) => {
          const advanceDate = new Date(advance.date);
          return advanceDate.getMonth() + 1 === selectedMonth && advanceDate.getFullYear() === selectedYear;
        });
        setFilteredAdvances(matches);
      } catch (error) {
        console.error('Error reloading staff advances:', error);
      }
    }
  };

  // Handle month filter change in view modal
  const handleMonthFilterChange = async (month: number, year: number) => {
    console.log('Filtering by:', month, year);
    setSelectedMonth(month);
    setSelectedYear(year);
    
    if (selectedStaff) {
      try {
        const advances = await StaffAdvanceAPI.getByStaffId(selectedStaff.id);
        const matches = advances.filter((advance: StaffAdvance) => {
          const advanceDate = new Date(advance.date);
          return advanceDate.getMonth() + 1 === month && advanceDate.getFullYear() === year;
        });
        
        console.log(`Filtered ${matches.length} advances for ${month}/${year}:`, matches);
        setFilteredAdvances(matches);
      } catch (error) {
        console.error('Error filtering advances:', error);
      }
    }
  };

  // Dashboard statistics
  const totalStaff = filteredStaff.length;
  const totalAdvances = filteredAllAdvances.length;
  const totalAmount = filteredAllAdvances.reduce((sum, advance) => sum + (Number(advance.amount) || 0), 0);
  const currentDate = new Date().toLocaleDateString('en-IN');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading staff advances...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="crm-page-bg">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header Section */}
        <div className="crm-header-container">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
            <div className="flex items-center gap-3">
              <div className="crm-header-icon">
                <IndianRupee className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Staff Advance</h1>
              </div>
            </div>
            
            <div className="flex flex-row sm:flex-row gap-1 sm:gap-3 w-full sm:w-auto">
              <ActionButtons.Refresh onClick={() => {
                console.log('🔄 Manual refresh triggered - refreshing entire page');
                window.location.reload();
              }} />
              
              <ActionButtons.MonthYear
                text={`${months[(filterMonth || 1) - 1]} ${filterYear}`}
                onClick={() => setShowMonthYearDialog(true)}
              />

            </div>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="crm-stats-grid">
          {/* Total Staff Card */}
          <Card className="crm-stat-card crm-stat-card-blue">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-blue-700 mb-1 truncate">Active Staff</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-900 mb-1">{totalStaff}</p>
                  <div className="flex items-center text-xs text-blue-600">
                    <TrendingUp className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Available staff</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-blue">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Advances Card */}
          <Card className="crm-stat-card crm-stat-card-orange">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-orange-700 mb-1 truncate">Total Advances</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-900 mb-1">{totalAdvances}</p>
                  <div className="flex items-center text-xs text-orange-600">
                    <FileText className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">{months[(filterMonth || 1) - 1]} {filterYear}</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-orange">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Amount Card */}
          <Card className="crm-stat-card crm-stat-card-green">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-green-700 mb-1 truncate">Total Amount</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-900 mb-1">{formatCurrency(totalAmount)}</p>
                  <div className="flex items-center text-xs text-green-600">
                    <IndianRupee className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Advance payments</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-green">
                  <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Last Updated Card */}
          <Card className="crm-stat-card crm-stat-card-purple">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-purple-700 mb-1 truncate">Last Updated</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-900 mb-1">{currentDate}</p>
                  <div className="flex items-center text-xs text-purple-600">
                    <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Data refresh</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-purple">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Staff List */}
        {!isLoading && (
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Staff Members ({filteredStaff.length})
                </CardTitle>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search staff..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
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
                          <User className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>Photo</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                          <User className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>Staff ID</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                          <User className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>Name</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStaff.map((staffMember, index) => {
                      return (
                        <TableRow key={staffMember.id || index} className="bg-white border-b hover:bg-gray-50 transition-colors">
                          <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">
                            {index + 1}
                          </TableCell>
                          <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center">
                            <div className="flex justify-center">
                              <Avatar className="h-10 w-10">
                                <AvatarImage 
                                  src={staffMember.photo ? `${import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:4000'}${staffMember.photo}` : undefined} 
                                />
                                <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                                  {staffMember.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                          </TableCell>
                          <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 font-medium text-center text-xs sm:text-sm whitespace-nowrap">
                            {formatStaffId(staffMember.id)}
                          </TableCell>
                          <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm">
                            <div className="font-medium text-slate-800">{staffMember.name}</div>
                          </TableCell>
                          <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1 sm:gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleViewStaff(staffMember)}
                                className="action-btn-lead action-btn-view h-8 w-8 sm:h-9 sm:w-9 p-0"
                                title="View Staff Details"
                              >
                                <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="sr-only">View</span>
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleEditStaff(staffMember)}
                                className="action-btn-lead action-btn-edit h-8 w-8 sm:h-9 sm:w-9 p-0"
                                title="Add Advance"
                              >
                                <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Staff Add Advance Modal */}
        {isAdvanceModalOpen && selectedStaff && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={handleCloseAdvanceModal}
          >
            <div 
              className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage 
                        src={selectedStaff.photo ? `${import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:4000'}${selectedStaff.photo}` : undefined} 
                      />
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {selectedStaff.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-xl font-semibold text-slate-800">
                        Add Advance - {selectedStaff.name}
                      </h2>
                      <p className="text-sm text-slate-600">ID: {selectedStaff.id}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCloseAdvanceModal}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {/* Add New Advance Form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Plus className="h-5 w-5 text-blue-600" />
                      Add New Advance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Amount (₹) *
                      </label>
                      <Input
                        type="number"
                        placeholder="Enter advance amount"
                        value={advanceAmount}
                        onChange={(e) => setAdvanceAmount(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Date *
                      </label>
                      <Input
                        type="date"
                        value={advanceDate}
                        onChange={(e) => setAdvanceDate(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Reason
                      </label>
                      <Textarea
                        placeholder="Enter reason for advance (optional)"
                        value={advanceReason}
                        onChange={(e) => setAdvanceReason(e.target.value)}
                        className="w-full min-h-[80px]"
                      />
                    </div>
                    
                    <Button 
                      onClick={handleAddAdvance}
                      disabled={isSubmitting || !advanceAmount || !advanceDate}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Adding...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Add Advance
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* Staff View Modal - Glass Morphism Design */}
        {isViewModalOpen && selectedStaff && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={handleCloseViewModal}
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
                      {selectedStaff.photo ? (
                        <img
                          src={`${import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:4000'}${selectedStaff.photo}`}
                          alt={selectedStaff.name || 'Profile'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            const parent = target.parentElement as HTMLElement;
                            if (parent) {
                              parent.innerHTML = `<div class="w-full h-full flex items-center justify-center"><span class="text-lg font-semibold text-white">${(selectedStaff.name || 'S').charAt(0).toUpperCase()}</span></div>`;
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-lg font-semibold text-white">
                            {(selectedStaff.name || 'S').charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1">
                      <div className="bg-green-100 text-green-800 border-2 border-white shadow-sm text-xs px-2 py-1 rounded-full">
                        {selectedStaff.status || 'Active'}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 flex items-center gap-1 sm:gap-2 truncate">
                      <User className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-blue-600 flex-shrink-0" />
                      <span className="truncate">{selectedStaff.name}</span>
                    </h2>
                    <div className="text-xs sm:text-sm md:text-base lg:text-lg mt-1 flex items-center gap-2">
                      <span className="text-gray-600">Staff ID:</span>
                      <span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg border border-green-200">
                        {formatStaffId(selectedStaff.id)}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCloseViewModal}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Modal Body - Glass Morphism Style */}
              <div className="overflow-y-auto max-h-[calc(95vh-100px)] sm:max-h-[calc(95vh-120px)] md:max-h-[calc(95vh-140px)] lg:max-h-[calc(95vh-200px)] custom-scrollbar">
                <div className="p-2 sm:p-3 md:p-4 lg:p-6 space-y-3 sm:space-y-4 md:space-y-6 lg:space-y-8">
                  
                  {/* Staff Information - Doctor-style Layout */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-blue-100 shadow-sm">
                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 flex items-center gap-2">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <User className="h-3 w-3 sm:h-3 sm:w-3 md:h-4 md:w-4 text-blue-600" />
                      </div>
                      Staff Information
                    </h3>
                    
                    {/* First Row - Full Name, Staff ID, Role */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4 md:mb-6">
                      
                      {/* Full Name */}
                      <div className="bg-gradient-to-br from-blue-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-blue-100">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-blue-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">FULL NAME</div>
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 truncate">{selectedStaff.name}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Staff ID */}
                      <div className="bg-gradient-to-br from-green-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-green-100">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-green-600 font-bold text-xs sm:text-sm">ID</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-green-600 uppercase tracking-wide">STAFF ID</div>
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">{formatStaffId(selectedStaff.id)}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Role/Department */}
                      <div className="bg-gradient-to-br from-purple-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-purple-100">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Briefcase className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-purple-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-purple-600 uppercase tracking-wide">ROLE</div>
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 truncate">{selectedStaff.role}</p>
                          </div>
                        </div>
                      </div>
                      
                    </div>
                    
                    {/* Second Row - Salary, Join Date, Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                      
                      {/* Salary */}
                      <div className="bg-gradient-to-br from-orange-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-orange-100">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-orange-600 font-bold text-xs sm:text-sm">₹</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-orange-600 uppercase tracking-wide">SALARY</div>
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">₹{selectedStaff.salary ? new Intl.NumberFormat('en-IN').format(Number(selectedStaff.salary)) : '15,000'}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Join Date */}
                      <div className="bg-gradient-to-br from-blue-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-blue-100">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-blue-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">JOIN DATE</div>
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">
                              {selectedStaff.join_date ? new Date(selectedStaff.join_date).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              }) : '20 Mar 2025'}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Status */}
                      <div className="bg-gradient-to-br from-green-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-green-100">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-green-600 font-bold text-xs sm:text-sm">✓</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-green-600 uppercase tracking-wide">STATUS</div>
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">{selectedStaff.status || 'Active'}</p>
                          </div>
                        </div>
                      </div>
                      
                    </div>
                  </div>

                  {/* Advance Records Section */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-blue-100 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                      <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <FileText className="h-3 w-3 sm:h-3 sm:w-3 md:h-4 md:w-4 text-green-600" />
                        </div>
                        Advance Records ({filteredAdvances.length})
                      </h3>
                      <div className="flex items-center gap-2">
                        <select
                          value={selectedMonth}
                          onChange={(e) => handleMonthFilterChange(parseInt(e.target.value), selectedYear)}
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white"
                        >
                          {months.map((month, index) => (
                            <option key={index} value={index + 1}>
                              {month}
                            </option>
                          ))}
                        </select>
                        <select
                          value={selectedYear}
                          onChange={(e) => handleMonthFilterChange(selectedMonth, parseInt(e.target.value))}
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white"
                        >
                          {[2023, 2024, 2025, 2026].map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-sm">
                        <thead>
                          <tr className="bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 text-white">
                            <th className="px-4 py-3 text-center text-sm font-semibold">S No</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold">Staff ID</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold">Date</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold">Reason</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold">Amount</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredAdvances.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-4 py-8 text-center text-gray-500 bg-gray-50">
                                <div className="flex flex-col items-center gap-2">
                                  <FileText className="h-8 w-8 text-gray-400" />
                                  <span>No advance records found for {months[selectedMonth - 1]} {selectedYear}</span>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            filteredAdvances.map((advance, index) => (
                              <tr key={advance.id || index} className="hover:bg-blue-50 transition-colors border-b border-gray-200">
                                <td className="px-4 py-3 text-center text-sm font-medium text-gray-900">
                                  {index + 1}
                                </td>
                                <td className="px-4 py-3 text-center text-sm font-semibold text-blue-600">
                                  {formatStaffId(advance.staff_id)}
                                </td>
                                <td className="px-4 py-3 text-center text-sm text-gray-900">
                                  {new Date(advance.date).toLocaleDateString('en-IN')}
                                </td>
                                <td className="px-4 py-3 text-center text-sm text-gray-600 max-w-xs">
                                  <div className="truncate" title={advance.reason || 'No reason provided'}>
                                    {advance.reason || 'No reason provided'}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center text-sm">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    {formatCurrency(advance.amount)}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <button
                                    onClick={() => handleDeleteClick(advance)}
                                    className="action-btn-lead action-btn-delete h-8 w-8 sm:h-9 sm:w-9 p-0 inline-flex items-center justify-center"
                                    title="Delete advance record"
                                  >
                                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Summary Section */}
                    {filteredAdvances.length > 0 && (
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="bg-gradient-to-br from-blue-50 to-white p-3 rounded-lg border border-blue-100">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-bold text-xs">#</span>
                              </div>
                              <div>
                                <div className="text-xs text-blue-600 uppercase tracking-wide">Total Records</div>
                                <div className="text-lg font-bold text-gray-900">{filteredAdvances.length}</div>
                              </div>
                            </div>
                          </div>
                          <div className="bg-gradient-to-br from-green-50 to-white p-3 rounded-lg border border-green-100">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                <IndianRupee className="h-3 w-3 text-green-600" />
                              </div>
                              <div>
                                <div className="text-xs text-green-600 uppercase tracking-wide">Total Amount</div>
                                <div className="text-lg font-bold text-gray-900">
                                  {formatCurrency(filteredAdvances.reduce((sum, advance) => sum + (Number(advance.amount) || 0), 0))}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="bg-gradient-to-br from-purple-50 to-white p-3 rounded-lg border border-purple-100">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                                <Calendar className="h-3 w-3 text-purple-600" />
                              </div>
                              <div>
                                <div className="text-xs text-purple-600 uppercase tracking-wide">Period</div>
                                <div className="text-lg font-bold text-gray-900">{months[selectedMonth - 1]} {selectedYear}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </div>
          </div>
        )}

        {/* Staff Advance Modal */}
        <StaffAdvanceModal
          isOpen={isStaffAdvanceModalOpen}
          onClose={handleStaffAdvanceModalClose}
          onSuccess={handleAdvanceSuccess}
          staff={staffList}
          editData={editAdvanceData}
        />

        {/* Month Year Picker Dialog */}
        <MonthYearPickerDialog
          open={showMonthYearDialog}
          onOpenChange={setShowMonthYearDialog}
          selectedMonth={pageSelectedMonth}
          selectedYear={pageSelectedYear}
          onMonthChange={setPageSelectedMonth}
          onYearChange={setPageSelectedYear}
          onApply={() => {
            setFilterMonth(pageSelectedMonth);
            setFilterYear(pageSelectedYear);
            setShowMonthYearDialog(false);
          }}
          title="Select Month & Year"
          description="Filter staff advances by specific month and year"
          previewText="advances"
        />

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="crm-modal-container">
            <DialogHeader className="editpopup form dialog-header">
              <div className="editpopup form icon-title-container">
                <div className="editpopup form dialog-icon">
                  <Trash2 className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                </div>
                <div className="editpopup form title-description">
                  <DialogTitle className="editpopup form dialog-title text-red-700">
                    Delete Staff Advance
                  </DialogTitle>
                  <DialogDescription className="editpopup form dialog-description">
                    Are you sure you want to delete this staff advance? This action cannot be undone.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            {advanceToDelete && (
              <div className="mx-4 my-4 p-4 bg-gray-50 rounded-lg border">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-900">{advanceToDelete.staff_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <IndianRupee className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Amount: ₹{advanceToDelete.amount}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Date: {new Date(advanceToDelete.date).toLocaleDateString()}</span>
                  </div>
                  {advanceToDelete.reason && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">Reason: {advanceToDelete.reason}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <DialogFooter className="editpopup form dialog-footer flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowDeleteDialog(false);
                  setAdvanceToDelete(null);
                }}
                className="editpopup form footer-button-cancel w-full sm:w-auto modern-btn modern-btn-secondary"
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={handleDeleteAdvance}
                className="editpopup form footer-button-delete w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                Delete Advance
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
};

export default StaffAdvancePage;
