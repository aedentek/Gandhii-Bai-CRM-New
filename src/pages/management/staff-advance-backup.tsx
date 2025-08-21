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
        name: staff.name,
        phone: staff.phone,
        photo: staff.photo,
        department: staff.department,
        status: staff.status,
        join_date: staff.join_date
      }));
      
      setStaffList(activeStaff);
      setFilteredStaff(activeStaff);
      
      // Load all advances for this month/year filter
      const advancesData = await StaffAdvanceAPI.getAll();
      
      // Filter advances by header month/year filter
      const filteredAdvances = advancesData.filter((advance: StaffAdvance) => {
        const advanceDate = new Date(advance.date);
        return advanceDate.getMonth() + 1 === headerMonthFilter.month && 
               advanceDate.getFullYear() === headerMonthFilter.year;
      });
      
      setStaffAdvances(filteredAdvances);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load staff advance data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewStaff = async (staff: StaffListItem) => {
    setViewStaff(staff);
    setIsViewModalOpen(true);
  };

  const handleEditStaff = (staff: StaffListItem) => {
    setEditStaff(staff);
    setIsAddModalOpen(true);
    setFormData({
      staff_id: staff.staff_id,
      staff_name: staff.name,
      amount: '',
      reason: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await StaffAdvanceAPI.create(formData);
      toast({
        title: "Success",
        description: "Staff advance added successfully",
      });
      loadData();
      setIsAddModalOpen(false);
      setFormData({
        staff_id: '',
        staff_name: '',
        amount: '',
        reason: '',
        date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Error adding staff advance:', error);
      toast({
        title: "Error",
        description: "Failed to add staff advance",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this staff advance record?')) {
      return;
    }
    
    try {
      await StaffAdvanceAPI.delete(id);
      toast({
        title: "Success",
        description: "Staff advance deleted successfully",
      });
      loadData();
    } catch (error) {
      console.error('Error deleting staff advance:', error);
      toast({
        title: "Error",
        description: "Failed to delete staff advance",
        variant: "destructive",
      });
    }
  };

  // Calculate stats based on current filter
  const totalActiveStaff = filteredStaff.length;
  const totalAdvanceAmount = staffAdvances.reduce((sum, advance) => sum + parseFloat(advance.amount.toString()), 0);
  const totalAdvanceCount = staffAdvances.length;
  const staffWithAdvances = staffAdvances.filter((advance, index, self) => 
    self.findIndex(a => a.staff_id === advance.staff_id) === index
  ).length;

  // Get staff advances for view modal based on selected month/year
  const getStaffAdvancesForView = (staffId: string) => {
    return staffAdvances.filter(advance => {
      const advanceDate = new Date(advance.date);
      return advance.staff_id === staffId &&
             advanceDate.getMonth() + 1 === selectedMonth &&
             advanceDate.getFullYear() === selectedYear;
    });
  };

  const calculateMonthlyTotal = (staffId: string) => {
    const advances = getStaffAdvancesForView(staffId);
    return advances.reduce((sum, advance) => sum + parseFloat(advance.amount.toString()), 0);
  };

  const handleHeaderMonthYearChange = (month: number, year: number) => {
    setHeaderMonthFilter({ month, year });
    setIsHeaderFilterOpen(false);
  };

  if (loading) {
    return (
      <div className="crm-page-bg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-lg text-gray-600">Loading staff advance data...</p>
            </div>
          </div>
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
                <IndianRupee className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Staff Advance Management</h1>
                <p className="text-sm text-gray-600 mt-1">
                  {headerMonthFilter.month}/{headerMonthFilter.year} • {totalActiveStaff} Active Staff • {totalAdvanceCount} Advance Records
                </p>
              </div>
            </div>
            
            <div className="flex flex-row sm:flex-row gap-1 sm:gap-3 w-full sm:w-auto">
              <ActionButtons.Refresh 
                onClick={loadData}
                loading={loading}
                disabled={loading}
              />
              <ActionButtons.MonthYear 
                onClick={() => {/* Add month/year picker functionality if needed */}}
                text={`${headerMonthFilter.month}/${headerMonthFilter.year}`}
              />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="crm-stats-grid">
          {/* Total Active Staff Card */}
          <Card className="crm-stat-card crm-stat-card-blue">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-blue-700 mb-1 truncate">Total Active Staff</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-900 mb-1">{totalActiveStaff}</p>
                  <div className="flex items-center text-xs text-blue-600">
                    <TrendingUp className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Active members</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-blue">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Advance Amount Card */}
          <Card className="crm-stat-card crm-stat-card-green">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-green-700 mb-1 truncate">Total Advance Amount</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-900 mb-1">{formatIndianCurrency(totalAdvanceAmount)}</p>
                  <div className="flex items-center text-xs text-green-600">
                    <IndianRupee className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Current month total</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-green">
                  <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Advance Records Card */}
          <Card className="crm-stat-card crm-stat-card-purple">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-purple-700 mb-1 truncate">Advance Records</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-900 mb-1">{totalAdvanceCount}</p>
                  <div className="flex items-center text-xs text-purple-600">
                    <Activity className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Current month records</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-purple">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Staff with Advances Card */}
          <Card className="crm-stat-card crm-stat-card-orange">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-orange-700 mb-1 truncate">Staff with Advances</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-900 mb-1">{staffWithAdvances}</p>
                  <div className="flex items-center text-xs text-orange-600">
                    <UserCheck className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Have advances</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-orange">
                  <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Controls */}
        <div className="crm-controls-container">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search staff by name, ID, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Staff Table */}
        <Card className="crm-table-container">
          <CardHeader className="crm-table-header">
            <div className="crm-table-title">
              <Users className="crm-table-title-icon" />
              <span className="crm-table-title-text">Active Staff Members ({filteredStaff.length})</span>
              <span className="crm-table-title-text-mobile">Staff ({filteredStaff.length})</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Scrollable Table View for All Screen Sizes */}
            <div className="overflow-x-auto">
              <Table className="w-full min-w-[600px]">
                <TableHeader>
                  <TableRow className="bg-gray-50 border-b">
                    <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                      <div className="flex items-center justify-center">
                        <span>S.No</span>
                      </div>
                    </TableHead>
                    <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                        <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>Photo</span>
                      </div>
                    </TableHead>
                    <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                        <Badge className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>Staff ID</span>
                      </div>
                    </TableHead>
                    <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                        <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>Name</span>
                      </div>
                    </TableHead>
                    <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                        <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>Actions</span>
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaff.map((staff, index) => (
                    <TableRow key={staff.id} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
                      <TableCell className="px-2 sm:px-3 lg:px-4 py-3 text-center text-xs sm:text-sm font-medium text-gray-900">
                        {index + 1}
                      </TableCell>
                      <TableCell className="px-2 sm:px-3 lg:px-4 py-3 text-center">
                        <div className="flex justify-center">
                          <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                            <img
                              className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover border-2 border-gray-300"
                              src={staff.photo || "/api/placeholder/40/40"}
                              alt={staff.name}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "/api/placeholder/40/40";
                              }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-2 sm:px-3 lg:px-4 py-3 text-center">
                        <Badge variant="secondary" className="font-medium text-xs">
                          {staff.staff_id}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-2 sm:px-3 lg:px-4 py-3 text-center text-xs sm:text-sm font-medium text-gray-900">
                        {staff.name}
                      </TableCell>
                      <TableCell className="px-2 sm:px-3 lg:px-4 py-3 text-center">
                        <div className="flex justify-center space-x-1 sm:space-x-2">
                          <Button
                            onClick={() => handleViewStaff(staff)}
                            size="sm"
                            variant="outline"
                            className="h-6 w-6 sm:h-8 sm:w-8 p-0 hover:bg-blue-50 hover:border-blue-300"
                          >
                            <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                          </Button>
                          <Button
                            onClick={() => handleEditStaff(staff)}
                            size="sm"
                            variant="outline"
                            className="h-6 w-6 sm:h-8 sm:w-8 p-0 hover:bg-green-50 hover:border-green-300"
                          >
                            <Edit className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Advance Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Plus className="w-5 h-5 text-green-600" />
              Add Staff Advance
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="staff_id">Staff Member</Label>
              <Select 
                value={formData.staff_id} 
                onValueChange={(value) => setFormData({...formData, staff_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staffList.map((staff) => (
                    <SelectItem key={staff.id} value={staff.staff_id}>
                      {staff.name} (ID: {staff.staff_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                placeholder="Enter advance amount"
                required
              />
            </div>
            <div>
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                placeholder="Enter reason for advance"
                required
              />
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                required
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                Add Advance
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Advance Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-4xl bg-gradient-to-br from-blue-50 via-white to-purple-50 border-0 shadow-2xl">
          <DialogHeader className="pb-6 border-b border-gray-200/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <img
                    className="h-16 w-16 rounded-full object-cover border-4 border-white shadow-lg"
                    src={viewStaff?.photo || "/api/placeholder/64/64"}
                    alt={viewStaff?.name}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/api/placeholder/64/64";
                    }}
                  />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-gray-900 mb-1">
                    {viewStaff?.name}
                  </DialogTitle>
                  <div className="flex items-center space-x-4">
                    <Badge variant="secondary" className="text-sm font-medium px-3 py-1">
                      {viewStaff?.staff_id}
                    </Badge>
                    <div className="text-lg font-semibold text-green-600 flex items-center">
                      <IndianRupee className="w-5 h-5 mr-1" />
                      Total: {viewStaff ? formatCurrency(calculateMonthlyTotal(viewStaff.staff_id)) : '₹0.00'}
                    </div>
                  </div>
                </div>
              </div>
              <Button variant="outline" className="gap-2">
                <Calendar className="w-4 h-4" />
                {selectedMonth}/{selectedYear}
              </Button>
            </div>
          </DialogHeader>
          
          <div className="mt-6">
            <div className="bg-white/80 rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                Advance Records - {selectedMonth}/{selectedYear}
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 rounded-lg">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tl-lg">S No</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Number</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tr-lg">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getStaffAdvancesForView(viewStaff?.staff_id || '').map((advance, index) => (
                      <tr key={advance.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {index + 1}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Badge variant="outline" className="font-medium text-blue-700 bg-blue-50 border-blue-200">
                            SA{advance.id}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                          {new Date(advance.date).toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700 max-w-xs">
                          <div className="truncate" title={advance.reason}>
                            {advance.reason}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                          {formatCurrency(parseFloat(advance.amount.toString()))}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <Button
                            onClick={() => handleDelete(advance.id!)}
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 hover:bg-red-50 hover:border-red-300 transition-colors"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {getStaffAdvancesForView(viewStaff?.staff_id || '').length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                          No advance records found for {selectedMonth}/{selectedYear}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {getStaffAdvancesForView(viewStaff?.staff_id || '').length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">
                      Total Records: {getStaffAdvancesForView(viewStaff?.staff_id || '').length}
                    </span>
                    <div className="text-lg font-bold text-green-600 flex items-center">
                      <IndianRupee className="w-5 h-5 mr-1" />
                      Monthly Total: {viewStaff ? formatCurrency(calculateMonthlyTotal(viewStaff.staff_id)) : '₹0.00'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
