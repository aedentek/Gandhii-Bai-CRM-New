import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  DollarSign,
  Plus,
  FileText,
  Clock,
  X,
  Save,
  Calendar,
  Trash2,
  IndianRupee
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
}

const StaffAdvancePage: React.FC = () => {
  // Debug: Component is rendering
  console.log('👥 StaffAdvancePage component is rendering...');
  
  // Months array for filtering
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentMonth = new Date().getMonth();
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

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Filter staff based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredStaff(staff);
    } else {
      const filtered = staff.filter((staffMember) =>
        staffMember.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staffMember.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (staffMember.role && staffMember.role.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (staffMember.department && staffMember.department.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredStaff(filtered);
    }
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
        return advanceDate.getMonth() === filterMonth && advanceDate.getFullYear() === filterYear;
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
      
      setStaff(activeStaff);
      setFilteredStaff(activeStaff);
      
      // Prepare staff list for modal
      const staffForModal = activeStaff.map((staffMember: any) => ({
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

  // Handle Delete Advance
  const handleDeleteAdvance = async (advanceId: number) => {
    if (!window.confirm('Are you sure you want to delete this advance record?')) {
      return;
    }

    try {
      await StaffAdvanceAPI.delete(advanceId);
      toast.success('Advance record deleted successfully');
      
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
  const totalAmount = filteredAllAdvances.reduce((sum, advance) => sum + advance.amount, 0);
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
                <p className="text-sm text-gray-600 mt-1">
                  Manage staff advance payments and records
                </p>
              </div>
            </div>
            
            <div className="flex flex-row sm:flex-row gap-1 sm:gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                disabled={isLoading}
                className="flex items-center gap-2 text-xs sm:text-sm px-2 sm:px-3"
              >
                <RefreshCcw className={`h-3 w-3 sm:h-4 sm:w-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMonthYearDialog(true)}
                className="flex items-center gap-2 text-xs sm:text-sm px-2 sm:px-3"
              >
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>{months[filterMonth || 0]?.slice(0, 3)} {filterYear}</span>
              </Button>
              
              <Button
                size="sm"
                onClick={() => setIsStaffAdvanceModalOpen(true)}
                className="flex items-center gap-2 text-xs sm:text-sm px-2 sm:px-3 bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Add Advance</span>
                <span className="sm:hidden">Add</span>
              </Button>
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
                    <span className="truncate">{months[filterMonth || 0]} {filterYear}</span>
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
                    <DollarSign className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Advance payments</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-green">
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
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
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Photo
                      </TableHead>
                      <TableHead className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Staff ID
                      </TableHead>
                      <TableHead className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name & Role
                      </TableHead>
                      <TableHead className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStaff.map((staffMember, index) => {
                      return (
                        <TableRow key={staffMember.id || index} className="hover:bg-gray-50 transition-colors">
                          <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3">
                            <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                              <AvatarImage 
                                src={staffMember.photo ? `http://localhost:4000${staffMember.photo}` : undefined} 
                              />
                              <AvatarFallback className="bg-blue-100 text-blue-600 text-xs sm:text-sm">
                                {staffMember.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                          </TableCell>
                          <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 font-medium text-center text-xs sm:text-sm whitespace-nowrap">
                            {staffMember.id}
                          </TableCell>
                          <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm">
                            <div className="font-medium text-slate-800">{staffMember.name}</div>
                            <div className="text-xs text-gray-500">{staffMember.role}</div>
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
                                <Eye className="h-3 w-3" />
                                <span className="sr-only">View</span>
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleEditStaff(staffMember)}
                                className="action-btn-lead action-btn-edit h-8 w-8 sm:h-9 sm:w-9 p-0"
                                title="Add Advance"
                              >
                                <Edit className="h-3 w-3" />
                                <span className="sr-only">Add Advance</span>
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
                        src={selectedStaff.photo ? `http://localhost:4000${selectedStaff.photo}` : undefined} 
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

        {/* Staff View Modal with Exact PatientList Design */}
        {isViewModalOpen && selectedStaff && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={handleCloseViewModal}
          >
            <div 
              className="bg-white rounded-lg max-w-4xl w-full max-h-[95vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header - Fixed */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center gap-3 sm:gap-4">
                  <Avatar className="h-12 w-12 sm:h-16 sm:w-16">
                    <AvatarImage 
                      src={selectedStaff.photo ? `http://localhost:4000${selectedStaff.photo}` : undefined} 
                    />
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-lg sm:text-xl">
                      {selectedStaff.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{selectedStaff.name}</h2>
                    <p className="text-sm sm:text-base text-gray-600">Staff ID: {selectedStaff.id}</p>
                    <p className="text-xs sm:text-sm text-gray-500">{selectedStaff.role} • {selectedStaff.department}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseViewModal}
                  className="text-slate-500 hover:text-slate-700 h-8 w-8 p-0"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Modal Content - Scrollable */}
              <div className="overflow-y-auto max-h-[calc(95vh-100px)] sm:max-h-[calc(95vh-120px)] md:max-h-[calc(95vh-140px)] lg:max-h-[calc(95vh-200px)] custom-scrollbar">
                <div className="p-2 sm:p-3 md:p-4 lg:p-6 space-y-3 sm:space-y-4 md:space-y-6 lg:space-y-8">
                  
                  {/* Staff Information Section - Exact PatientList Style */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-blue-100 shadow-sm">
                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 flex items-center gap-2">
                      <User className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      Staff Information
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                      {/* Staff ID */}
                      <div className="bg-blue-50/80 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-200">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-600 font-bold text-xs sm:text-sm">#</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">ID</div>
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">{selectedStaff.id}</p>
                          </div>
                        </div>
                      </div>

                      {/* Phone */}
                      <div className="bg-green-50/80 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-green-200">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-green-600 font-bold text-xs sm:text-sm">📞</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-green-600 uppercase tracking-wide">Phone</div>
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">{selectedStaff.phone || 'N/A'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Department */}
                      <div className="bg-purple-50/80 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-purple-200">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-purple-600 font-bold text-xs sm:text-sm">🏢</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-purple-600 uppercase tracking-wide">Department</div>
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">{selectedStaff.department}</p>
                          </div>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="bg-green-50/80 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-green-200">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-green-600 font-bold text-xs sm:text-sm">✓</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-green-600 uppercase tracking-wide">Status</div>
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">{selectedStaff.status}</p>
                          </div>
                        </div>
                      </div>
                      
                    </div>
                  </div>

                  {/* Advance Records Section - Detailed Table Format */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-blue-100 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                      <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                        Advance Records ({filteredAdvances.length})
                      </h3>
                      <div className="flex items-center gap-2">
                        <select
                          value={selectedMonth}
                          onChange={(e) => handleMonthFilterChange(parseInt(e.target.value), selectedYear)}
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm"
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
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm"
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
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              #
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Staff ID
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Reason
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Amount
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredAdvances.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                No advance records found for {months[selectedMonth - 1]} {selectedYear}
                              </td>
                            </tr>
                          ) : (
                            filteredAdvances.map((advance, index) => (
                              <tr key={advance.id || index} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {index + 1}
                                </td>
                                <td className="px-4 py-3 text-sm font-medium text-blue-600">
                                  {advance.staff_id}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {new Date(advance.date).toLocaleDateString('en-IN')}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                                  <div className="truncate" title={advance.reason || 'No reason provided'}>
                                    {advance.reason || 'No reason provided'}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <Badge className="bg-green-100 text-green-800 font-semibold">
                                    {formatCurrency(advance.amount)}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeleteAdvance(advance.id!)}
                                    className="action-btn-lead action-btn-delete h-8 w-8 p-0"
                                    title="Delete advance record"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Summary Section */}
                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <div className="bg-gradient-to-br from-blue-50 to-white p-3 sm:p-4 rounded-lg sm:rounded-xl border border-blue-100">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-900">
                            Total for {months[selectedMonth - 1]} {selectedYear}:
                          </span>
                          <Badge className="bg-blue-100 text-blue-800 font-bold text-lg px-3 py-1">
                            {formatCurrency(filteredAdvances.reduce((sum, advance) => sum + advance.amount, 0))}
                          </Badge>
                        </div>
                      </div>
                    </div>
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

      </div>
    </div>
  );
};

export default StaffAdvancePage;
