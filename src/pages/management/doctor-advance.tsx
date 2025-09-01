import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ActionButtons } from '@/components/ui/HeaderActionButtons';
import { DatabaseService } from '@/services/databaseService';
import { DoctorAdvanceAPI } from '@/services/doctorAdvanceAPI';
import { DoctorAdvance } from '@/types/doctorAdvance';
import MonthYearPickerDialog from '@/components/shared/MonthYearPickerDialog';
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
} from 'lucide-react';
import '@/styles/global-crm-design.css';
import '@/styles/global-modal-design.css';

interface Doctor {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  specialization: string;
  department: string;
  join_date: Date | null;
  salary: number;
  status: string;
  photo: string;
}

const DoctorAdvancePage: React.FC = () => {
  // Debug: Component is rendering
  console.log('🩺 DoctorAdvancePage component is rendering...');
  
  // Months array for filtering
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentMonth = new Date().getMonth() + 1; // 1-based
  const currentYear = new Date().getFullYear();
  
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Dashboard stats
  const [allAdvances, setAllAdvances] = useState<DoctorAdvance[]>([]);
  const [filteredAllAdvances, setFilteredAllAdvances] = useState<DoctorAdvance[]>([]);
  
  // Page-level month/year filter states
  const [pageSelectedMonth, setPageSelectedMonth] = useState(currentMonth);
  const [pageSelectedYear, setPageSelectedYear] = useState(currentYear);
  const [showMonthYearDialog, setShowMonthYearDialog] = useState(false);
  const [filterMonth, setFilterMonth] = useState<number | null>(currentMonth);
  const [filterYear, setFilterYear] = useState<number | null>(currentYear);
  
  // Modal states
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [doctorAdvances, setDoctorAdvances] = useState<DoctorAdvance[]>([]);
  const [filteredAdvances, setFilteredAdvances] = useState<DoctorAdvance[]>([]);
  
  // Delete confirmation dialog states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [advanceToDelete, setAdvanceToDelete] = useState<DoctorAdvance | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Month/Year filter states
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Form states
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceReason, setAdvanceReason] = useState('');
  const [advanceDate, setAdvanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Filter doctors based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredDoctors(doctors);
    } else {
      const filtered = doctors.filter((doctor) =>
        doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDoctors(filtered);
    }
  }, [doctors, searchTerm]);

  // Filter advances by selected month/year (for modals)
  useEffect(() => {
    console.log('=== FILTERING ADVANCES ===');
    console.log('Doctor advances count:', doctorAdvances.length);
    console.log('Selected month:', selectedMonth);
    console.log('Selected year:', selectedYear);
    
    if (doctorAdvances.length > 0) {
      const filtered = doctorAdvances.filter(advance => {
        console.log('Processing advance:', advance);
        
        // Handle different date formats
        let advanceDate;
        if (advance.date.includes('/')) {
          // Handle DD/MM/YYYY format - assume DD/MM/YYYY since showing March data
          const [day, month, year] = advance.date.split('/').map(num => parseInt(num));
          advanceDate = new Date(year, month - 1, day); // month is 0-indexed in Date constructor
          console.log(`Parsed DD/MM/YYYY: ${day}/${month}/${year} -> ${advanceDate}`);
        } else {
          // Handle ISO format
          advanceDate = new Date(advance.date);
          console.log(`Parsed ISO: ${advance.date} -> ${advanceDate}`);
        }
        
        const advanceMonth = advanceDate.getMonth() + 1; // 1-12
        const advanceYear = advanceDate.getFullYear();
        
        console.log(`Advance date: ${advance.date} -> Month: ${advanceMonth}, Year: ${advanceYear}`);
        console.log(`Comparing with selected: Month: ${selectedMonth}, Year: ${selectedYear}`);
        
        const matches = advanceMonth === selectedMonth && advanceYear === selectedYear;
        console.log(`Matches: ${matches}`);
        
        return matches;
      });
      
      console.log('=== FILTER RESULTS ===');
      console.log(`Found ${filtered.length} matching advances:`, filtered);
      const total = filtered.reduce((sum, adv) => sum + adv.amount, 0);
      console.log(`Total amount: ₹${total}`);
      
      setFilteredAdvances(filtered);
    } else {
      console.log('No doctor advances to filter');
      setFilteredAdvances([]);
    }
  }, [doctorAdvances, selectedMonth, selectedYear]);

  // Filter all advances by page-level month/year filter (for dashboard stats)
  useEffect(() => {
    console.log('=== FILTERING ALL ADVANCES FOR STATS ===');
    console.log('All advances count:', allAdvances.length);
    console.log('All advances data:', allAdvances);
    console.log('Filter month (0-11):', filterMonth, 'Filter year:', filterYear);
    console.log('Current month (0-11):', currentMonth, 'Current year:', currentYear);
    
    if (allAdvances.length > 0) {
      // Use current month/year by default, or selected filter month/year
      const targetMonth = filterMonth !== null ? filterMonth : currentMonth; // 0-11
      const targetYear = filterYear !== null ? filterYear : currentYear;
      
      console.log('Target month (0-11):', targetMonth, 'Target year:', targetYear);
      
      const filtered = allAdvances.filter(advance => {
        console.log('Processing advance for stats:', advance);
        
        // Handle different date formats
        let advanceDate;
        if (advance.date && advance.date.includes('/')) {
          // Handle DD/MM/YYYY format
          const [day, month, year] = advance.date.split('/').map(num => parseInt(num));
          advanceDate = new Date(year, month - 1, day); // month is 0-indexed in Date constructor
          console.log(`Stats - Parsed DD/MM/YYYY: ${day}/${month}/${year} -> ${advanceDate}`);
        } else if (advance.date) {
          // Handle ISO format or other formats
          advanceDate = new Date(advance.date);
          console.log(`Stats - Parsed ISO: ${advance.date} -> ${advanceDate}`);
        } else {
          console.log('Stats - No date found for advance:', advance);
          return false;
        }
        
        const advanceMonth = advanceDate.getMonth() + 1; // 1-based to match other logic
        const advanceYear = advanceDate.getFullYear();
        
        console.log(`Stats - Advance date: ${advance.date} -> Month: ${advanceMonth}, Year: ${advanceYear}`);
        console.log(`Stats - Comparing with target: Month: ${targetMonth}, Year: ${targetYear}`);
        
        const matches = advanceMonth === targetMonth && advanceYear === targetYear;
        console.log(`Stats - Matches: ${matches}`);
        
        return matches;
      });
      
      console.log('=== STATS FILTER RESULTS ===');
      console.log(`Found ${filtered.length} matching advances for ${months[targetMonth]} ${targetYear}:`, filtered);
      const total = filtered.reduce((sum, adv) => {
        const amount = parseFloat(String(adv.amount)) || 0;
        console.log(`Adding amount: ${adv.amount} -> ${amount}`);
        return sum + amount;
      }, 0);
      console.log(`Total amount for stats: ₹${total}`);
      
      setFilteredAllAdvances(filtered);
    } else {
      console.log('Stats - No advances to filter');
      setFilteredAllAdvances([]);
    }
  }, [allAdvances, filterMonth, filterYear, currentMonth, currentYear]);

  // Utility function to get doctor photo URL
  const getDoctorPhotoUrl = (photoPath: string) => {
    if (!photoPath) return '/api/placeholder/40/40';
    
    // Handle both old and new path formats
    if (photoPath.startsWith('Photos/') || photoPath.startsWith('Photos\\')) {
      return `${import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:4000'}/${photoPath.replace(/\\/g, '/')}`;
    }
    
    return `${import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:4000'}/${photoPath}`;
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Starting to load data...');
      
      // Load active doctors
      console.log('📋 Fetching doctors from API...');
      const doctorsData = await DatabaseService.getAllDoctors();
      console.log('📋 Raw doctors data received:', doctorsData);
      
      // Filter only active doctors
      const activeDoctors = doctorsData.filter((doctor: any) => 
        doctor.status === 'Active' || doctor.status === 'active'
      ).map((doctor: any) => ({
        ...doctor,
        join_date: (() => {
          try {
            if (doctor.join_date) {
              const date = new Date(doctor.join_date);
              return isNaN(date.getTime()) ? null : date;
            }
            return null;
          } catch (e) {
            console.warn('Failed to parse join_date for doctor:', doctor.id, e);
            return null;
          }
        })()
      }));
      
      console.log('📋 Filtered active doctors:', activeDoctors);
      setDoctors(activeDoctors);
      
      // Load all advances for dashboard statistics
      try {
        console.log('💰 Fetching advances from API...');
        const advancesData = await DoctorAdvanceAPI.getAll();
        console.log('💰 Advances data received:', advancesData);
        setAllAdvances(advancesData || []);
      } catch (advanceError) {
        console.error('Error loading advances:', advanceError);
        setAllAdvances([]);
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load doctor data');
    } finally {
      setIsLoading(false);
    }
  };

  // Action handlers for doctors
  const handleViewDoctor = async (doctor: Doctor) => {
    console.log('Opening view modal for doctor:', doctor);
    setSelectedDoctor(doctor);
    
    // Always set to current month/year when opening modal
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // 1-12 (August = 8)
    const currentYear = currentDate.getFullYear(); // 2025
    
    console.log('Setting modal to current month:', currentMonth, 'year:', currentYear);
    setSelectedMonth(currentMonth);
    setSelectedYear(currentYear);
    setIsViewModalOpen(true);
    
    // Load existing advances for this doctor
    try {
      console.log(`Loading advances for doctor: ${doctor.id}`);
      const advances = await DoctorAdvanceAPI.getByDoctorId(doctor.id);
      console.log(`Found ${advances.length} advances for doctor ${doctor.id}:`, advances);
      setDoctorAdvances(advances);
      
      // Filter advances for current month/year only
      const filtered = advances.filter(advance => {
        let advanceDate;
        if (advance.date.includes('/')) {
          // Handle DD/MM/YYYY format
          const [day, month, year] = advance.date.split('/').map(num => parseInt(num));
          advanceDate = new Date(year, month - 1, day);
        } else {
          // Handle ISO format
          advanceDate = new Date(advance.date);
        }
        
        const advanceMonth = advanceDate.getMonth() + 1;
        const advanceYear = advanceDate.getFullYear();
        
        console.log('Advance:', advance.date, 'Month:', advanceMonth, 'Year:', advanceYear);
        const matches = advanceMonth === currentMonth && advanceYear === currentYear;
        console.log('Matches current month/year:', matches);
        
        return matches;
      });
      
      console.log(`Filtered ${filtered.length} advances for current month ${currentMonth}/${currentYear}:`, filtered);
      setFilteredAdvances(filtered);
      
    } catch (error) {
      console.error('Error loading doctor advances:', error);
      setDoctorAdvances([]);
      setFilteredAdvances([]);
      toast.error('Failed to load doctor advances');
    }
  };

  const handleEditDoctor = (doctor: Doctor) => {
    console.log('Opening add advance modal for doctor:', doctor);
    setSelectedDoctor(doctor);
    setIsAdvanceModalOpen(true);
  };

  const handleCloseAdvanceModal = () => {
    setIsAdvanceModalOpen(false);
    setSelectedDoctor(null);
    setAdvanceAmount('');
    setAdvanceReason('');
    setAdvanceDate(new Date().toISOString().split('T')[0]);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedDoctor(null);
    setDoctorAdvances([]);
    setFilteredAdvances([]);
  };

  const handleDeleteAdvance = (advance: DoctorAdvance) => {
    setAdvanceToDelete(advance);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!advanceToDelete) return;

    setSubmitting(true);
    try {
      await DoctorAdvanceAPI.delete(advanceToDelete.id);
      toast.success('Advance record deleted successfully');
      
      // Reload advances for current doctor
      if (selectedDoctor) {
        const advances = await DoctorAdvanceAPI.getByDoctorId(selectedDoctor.id);
        setDoctorAdvances(advances);
      }
      
      // Reload all advances to update dashboard stats
      try {
        const advancesData = await DoctorAdvanceAPI.getAll();
        setAllAdvances(advancesData || []);
      } catch (reloadError) {
        console.error('Error reloading advances:', reloadError);
      }
      
      setShowDeleteDialog(false);
      setAdvanceToDelete(null);
    } catch (error) {
      console.error('Error deleting advance:', error);
      toast.error('Failed to delete advance record');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddAdvance = async () => {
    if (!selectedDoctor || !advanceAmount || !advanceDate) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const advanceData = {
        doctor_id: selectedDoctor.id,
        doctor_name: selectedDoctor.name,
        date: advanceDate,
        amount: parseFloat(advanceAmount),
        reason: advanceReason
      };

      console.log('Sending advance data:', advanceData);
      await DoctorAdvanceAPI.create(advanceData);
      toast.success(`Advance of ₹${advanceAmount} added for Dr. ${selectedDoctor.name}`);
      
      // Reload all advances to update dashboard stats
      try {
        const advancesData = await DoctorAdvanceAPI.getAll();
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
      
    } catch (error) {
      console.error('Error adding advance:', error);
      toast.error('Failed to add advance');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number | undefined | null) => {
    // Handle invalid or undefined values
    if (amount === undefined || amount === null || isNaN(Number(amount))) {
      return '₹0';
    }
    
    // Use custom formatting with Indian Rupee symbol
    const formattedNumber = Number(amount).toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    
    return `₹${formattedNumber}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading doctor advances...</p>
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
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Doctor Advance Management</h1>
              </div>
            </div>
          
            <div className="flex flex-row sm:flex-row gap-1 sm:gap-3 w-full sm:w-auto">
              <ActionButtons.Refresh
                onClick={() => {
                  console.log('🔄 Manual refresh triggered - refreshing entire page');
                  window.location.reload();
                }}
                loading={isLoading}
              />
              
              {/* Month & Year Filter Button */}
              <ActionButtons.MonthYear
                onClick={() => setShowMonthYearDialog(true)}
                text={
                  filterMonth !== null && filterYear !== null 
                    ? `${months[filterMonth - 1]} ${filterYear}` // Convert 1-based to 0-based
                    : `${months[pageSelectedMonth - 1]} ${pageSelectedYear}` // Convert 1-based to 0-based
                }
              />

              {/* Clear Filter Button */}
              {(filterMonth !== currentMonth || filterYear !== currentYear) && (
                <Button 
                  onClick={() => {
                    setFilterMonth(currentMonth);
                    setFilterYear(currentYear);
                    setPageSelectedMonth(currentMonth);
                    setPageSelectedYear(currentYear);
                  }}
                  variant="outline"
                  className="global-btn flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
                >
                  <span className="hidden sm:inline">Reset</span>
                  <span className="sm:hidden">↻</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="crm-stats-grid">
          {/* Total Active Doctors Card */}
          <Card className="crm-stat-card crm-stat-card-blue">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-blue-700 mb-1 truncate">Active Doctors</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-900 mb-1">{doctors.length}</p>
                  <div className="flex items-center text-xs text-blue-600">
                    <TrendingUp className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Available</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-blue">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Total Advances Card */}
          <Card className="crm-stat-card crm-stat-card-green">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-green-700 mb-1 truncate">Total Advances</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-900 mb-1">{filteredAllAdvances.length}</p>
                  <div className="flex items-center text-xs text-green-600">
                    <FileText className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Records</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-green">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Total Amount Card */}
          <Card className="crm-stat-card crm-stat-card-red">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-red-700 mb-1 truncate">Total Amount</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-900 mb-1">
                    {formatCurrency(filteredAllAdvances.reduce((sum, advance) => {
                      const amount = Number(advance.amount);
                      return sum + (isNaN(amount) ? 0 : amount);
                    }, 0))}
                  </p>
                  <div className="flex items-center text-xs text-red-600">
                    <IndianRupee className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Advanced</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-red">
                  <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Last Updated Card */}
          <Card className="crm-stat-card crm-stat-card-orange">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-orange-700 mb-1 truncate">Last Updated</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-900 mb-1">
                    {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}
                  </p>
                  <div className="flex items-center text-xs text-orange-600">
                    <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Today</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-orange">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
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
                  placeholder="Search by doctor name, ID, specialization, or department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Active Doctors Table */}
        {filteredDoctors.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <User className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-600 mb-2">No Active Doctors Found</h3>
              <p className="text-slate-500 mb-4">
                {searchTerm ? 'No doctors match your search criteria.' : 'No active doctors available in the system.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="crm-table-container">
            <CardHeader className="crm-table-header">
              <div className="crm-table-title">
                <User className="crm-table-title-icon" />
                <span className="crm-table-title-text">Active Doctors List ({filteredDoctors.length})</span>
                <span className="crm-table-title-text-mobile">Doctors ({filteredDoctors.length})</span>
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
                          <span>Doctor ID</span>
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
                    {filteredDoctors.map((doctor, idx) => {
                      const sno = idx + 1;
                      return (
                        <TableRow key={doctor.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                          <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">
                            {sno}
                          </TableCell>
                          <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center">
                            <div className="flex justify-center">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-gray-100 ring-2 ring-blue-100">
                                <img
                                  src={getDoctorPhotoUrl(doctor.photo)}
                                  alt={doctor.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = '/api/placeholder/40/40';
                                  }}
                                />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 font-medium text-center text-xs sm:text-sm whitespace-nowrap">
                            {doctor.id}
                          </TableCell>
                          <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm">
                            <div className="font-medium text-slate-800">{doctor.name}</div>
                            <div className="text-xs text-gray-500">{doctor.specialization}</div>
                          </TableCell>
                          <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1 sm:gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleViewDoctor(doctor)}
                                className="action-btn-lead action-btn-view h-8 w-8 sm:h-9 sm:w-9 p-0"
                                title="View Doctor Details"
                              >
                                <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="sr-only">View</span>
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleEditDoctor(doctor)}
                                className="action-btn-lead action-btn-edit h-8 w-8 sm:h-9 sm:w-9 p-0"
                                title="Edit Doctor"
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

        {/* Doctor Add Advance Modal */}
        {isAdvanceModalOpen && selectedDoctor && (
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
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 ring-2 ring-blue-100">
                      <img
                        src={getDoctorPhotoUrl(selectedDoctor.photo)}
                        alt={selectedDoctor.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/api/placeholder/40/40';
                        }}
                      />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-slate-800">
                        Add Advance - Dr. {selectedDoctor.name}
                      </h2>
                      <p className="text-sm text-slate-600">ID: {selectedDoctor.id}</p>
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

        {/* Doctor View Modal with Exact PatientList Design */}
        {isViewModalOpen && selectedDoctor && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={handleCloseViewModal}
          >
            <div 
              className="max-w-[95vw] max-h-[95vh] w-full sm:max-w-6xl overflow-hidden bg-gradient-to-br from-white to-blue-50/30 border-0 shadow-2xl p-0 m-4 rounded-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header - Exact PatientList Style */}
              <div className="relative pb-3 sm:pb-4 md:pb-6 border-b border-blue-100 px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-6">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500"></div>
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mt-2 sm:mt-4">
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full overflow-hidden bg-gray-100 ring-2 sm:ring-4 ring-white shadow-lg">
                      <img
                        src={getDoctorPhotoUrl(selectedDoctor.photo)}
                        alt={selectedDoctor.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/api/placeholder/40/40';
                        }}
                      />
                    </div>
                    <div className="absolute -bottom-1 -right-1">
                      <Badge className="bg-green-100 text-green-800 border-2 border-white shadow-sm text-xs">
                        Active
                      </Badge>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-1 sm:gap-2 truncate">
                      <User className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-blue-600 flex-shrink-0" />
                      <span className="truncate">Dr. {selectedDoctor.name}</span>
                    </h2>
                    <div className="text-xs sm:text-sm md:text-lg lg:text-xl mt-1 flex items-center gap-2">
                      <span className="text-gray-600">
                        {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} Total:
                      </span>
                      <span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg border border-green-200">
                        {(() => {
                          const total = filteredAdvances.reduce((sum, adv) => {
                            const amount = typeof adv.amount === 'string' ? parseFloat(adv.amount) : adv.amount;
                            console.log('Adding to total:', sum, '+', amount, '=', sum + amount);
                            return sum + amount;
                          }, 0);
                          console.log('=== HEADER TOTAL CALCULATION ===');
                          console.log('Filtered advances:', filteredAdvances);
                          console.log('Total calculated:', total);
                          return formatCurrency(total);
                        })()}
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

              {/* Modal Body - Exact PatientList Style */}
              <div className="overflow-y-auto max-h-[calc(95vh-100px)] sm:max-h-[calc(95vh-120px)] md:max-h-[calc(95vh-140px)] lg:max-h-[calc(95vh-200px)] custom-scrollbar">
                <div className="p-2 sm:p-3 md:p-4 lg:p-6 space-y-3 sm:space-y-4 md:space-y-6 lg:space-y-8">
                  
                  {/* Doctor Information Section - Exact PatientList Style */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-blue-100 shadow-sm">
                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 flex items-center gap-2">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <User className="h-3 w-3 sm:h-3 sm:w-3 md:h-4 md:w-4 text-blue-600" />
                      </div>
                      Doctor Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                      
                      <div className="bg-gradient-to-br from-blue-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-blue-100">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-blue-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">Full Name</div>
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 truncate">{selectedDoctor.name}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-green-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-green-100">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-green-600 font-bold text-xs sm:text-sm">ID</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-green-600 uppercase tracking-wide">Doctor ID</div>
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">{selectedDoctor.id}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-purple-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-purple-100">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <FileText className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-purple-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-purple-600 uppercase tracking-wide">Specialization</div>
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">{selectedDoctor.specialization || 'General'}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-orange-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-orange-100">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <IndianRupee className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-orange-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-orange-600 uppercase tracking-wide">Salary</div>
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">{formatCurrency(selectedDoctor.salary || 0)}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-blue-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-blue-100">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-blue-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">Join Date</div>
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">
                              {selectedDoctor.join_date ? formatDate(selectedDoctor.join_date.toString()) : 'Not available'}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-green-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-green-100">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-green-600 font-bold text-xs sm:text-sm">✓</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-green-600 uppercase tracking-wide">Status</div>
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">{selectedDoctor.status}</p>
                          </div>
                        </div>
                      </div>
                      
                    </div>
                  </div>

                  {/* Advance Records Section - Detailed Table Format */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-blue-100 shadow-sm">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                      <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <IndianRupee className="h-3 w-3 sm:h-3 sm:w-3 md:h-4 md:w-4 text-green-600" />
                        </div>
                        Advance Records ({filteredAdvances.length})
                      </h3>
                      
                      {/* Month/Year Selector */}
                      <div className="flex items-center gap-3">
                        <select
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value={1}>January</option>
                          <option value={2}>February</option>
                          <option value={3}>March</option>
                          <option value={4}>April</option>
                          <option value={5}>May</option>
                          <option value={6}>June</option>
                          <option value={7}>July</option>
                          <option value={8}>August</option>
                          <option value={9}>September</option>
                          <option value={10}>October</option>
                          <option value={11}>November</option>
                          <option value={12}>December</option>
                        </select>
                        
                        <select
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {Array.from({ length: 5 }, (_, i) => {
                            const year = new Date().getFullYear() - 2 + i;
                            return (
                              <option key={year} value={year}>
                                {year}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>
                    
                    {filteredAdvances.length === 0 ? (
                      <div className="text-center py-8">
                        <IndianRupee className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">
                          No advance records found for {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Table Format */}
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-sm">
                            <thead>
                              <tr className="bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 text-white">
                                <th className="px-4 py-3 text-left text-sm font-semibold">S No</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold">ID Number</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold">Reason</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold">Amount</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {filteredAdvances.map((advance, index) => (
                                <tr key={advance.id || index} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    {index + 1}
                                  </td>
                                  <td className="px-4 py-3 text-sm font-medium text-blue-600">
                                    {advance.doctor_id}
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
                                      onClick={() => handleDeleteAdvance(advance)}
                                      className="action-btn-lead action-btn-delete h-8 w-8 sm:h-9 sm:w-9 p-0"
                                      title="Delete advance record"
                                    >
                                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        
                        {/* Summary Section */}
                        <div className="mt-4 pt-4 border-t border-blue-200">
                          <div className="bg-gradient-to-br from-blue-50 to-white p-3 sm:p-4 rounded-lg sm:rounded-xl border border-blue-100">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-gray-900">
                                Total for {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}:
                              </span>
                              <Badge className="bg-blue-100 text-blue-800 text-lg px-4 py-2 font-bold">
                                {formatCurrency(filteredAdvances.reduce((sum, adv) => {
                                  const amount = typeof adv.amount === 'string' ? parseFloat(adv.amount) : adv.amount;
                                  return sum + amount;
                                }, 0))}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                </div>
              </div>
            </div>
          </div>
        )}

        {/* Month/Year Picker Dialog */}
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
          description="Filter doctor advances by specific month and year"
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
                    Delete Advance Record
                  </DialogTitle>
                  <DialogDescription className="editpopup form dialog-description">
                    Are you sure you want to delete this advance record? This action cannot be undone.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            {advanceToDelete && (
              <div className="mx-4 my-4 p-4 bg-gray-50 rounded-lg border">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-900">₹{advanceToDelete.amount}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">{new Date(advanceToDelete.date).toLocaleDateString()}</span>
                  </div>
                  {advanceToDelete.reason && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">{advanceToDelete.reason}</span>
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
                disabled={submitting}
                className="editpopup form footer-button-cancel w-full sm:w-auto modern-btn modern-btn-secondary"
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={handleDeleteConfirm}
                disabled={submitting}
                className="editpopup form footer-button-delete w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
              >
                {submitting ? (
                  <>
                    <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    Delete Advance Record
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
};

export default DoctorAdvancePage;
