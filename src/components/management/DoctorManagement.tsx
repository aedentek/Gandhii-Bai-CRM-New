import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { DatabaseService } from '@/services/databaseService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ActionButtons } from '@/components/ui/HeaderActionButtons';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Search, Eye, Edit2, Trash2, Users, Plus, Filter, Download, FileText, Upload, RefreshCw, UserCheck, Activity, TrendingUp, Clock, Stethoscope, User, Phone, Mail, MapPin, Calendar, IndianRupee, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import MonthYearPickerDialog from '@/components/shared/MonthYearPickerDialog';
import usePageTitle from '@/hooks/usePageTitle';
import '../../styles/modern-forms.css';
import '../../styles/modern-tables.css';
import '@/styles/global-crm-design.css';

// Utility function to create timezone-safe dates
const createLocalDate = (year: number, month: number, day: number): Date => {
  return new Date(year, month - 1, day); // month is 0-indexed in Date constructor
};

// Utility function to format date for backend (DD-MM-YYYY)
const formatDateForBackend = (date: Date | null): string => {
  if (!date) return '';
  
  // Handle Date objects directly
  if (date instanceof Date && !isNaN(date.getTime())) {
    const year = date.getFullYear();
    if (year < 1900 || year > 2100) return '';
    
    return format(date, 'dd-MM-yyyy');
  }
  
  return '';
};

// Utility function to format date for HTML input (YYYY-MM-DD)
const formatDateForInput = (date: Date | null): string => {
  if (!date) return '';
  
  // Handle both Date objects and date strings
  let dateObj: Date;
  if (date instanceof Date) {
    dateObj = date;
  } else {
    dateObj = new Date(date);
  }
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) return '';
  
  // Check if year is reasonable
  const year = dateObj.getFullYear();
  if (year < 1900 || year > 2100) return '';
  
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Utility function to parse HTML input date (YYYY-MM-DD) to local Date
const parseDateFromInput = (dateString: string): Date | null => {
  if (!dateString || dateString.trim() === '') return null;
  
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    
    // Validate the numbers
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    if (year < 1900 || year > 2100) return null;
    if (month < 1 || month > 12) return null;
    if (day < 1 || day > 31) return null;
    
    const date = createLocalDate(year, month, day);
    
    // Double-check the created date is valid
    if (isNaN(date.getTime())) return null;
    
    return date;
  } catch (error) {
    console.warn('Error parsing date from input:', dateString, error);
    return null;
  }
};

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
  documents: any;
  created_at: Date;
  updated_at: Date;
  total_paid: number;
  payment_mode: string | null;
}

interface DoctorCategory {
  id: number;
  name: string;
  status: string;
}

const DoctorManagement: React.FC = () => {
  // Set page title
  usePageTitle();

  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categories, setCategories] = useState<DoctorCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Month and year state for filtering (1-based like Grocery Management)
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-based like Grocery Management
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [showMonthYearDialog, setShowMonthYearDialog] = useState(false);
  const [filterMonth, setFilterMonth] = useState<number | null>(null); // Start with no filter
  const [filterYear, setFilterYear] = useState<number | null>(null); // Start with no filter

  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    specialization: '',
    department: '',
    join_date: '',
    salary: '',
    status: 'Active',
  });

  useEffect(() => {
    loadDoctors();
    loadCategories();
  }, []);

  useEffect(() => {
    filterDoctors();
  }, [doctors, searchTerm, statusFilter, selectedCategory, filterMonth, filterYear]);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      const response = await DatabaseService.getAllDoctors();
      console.log('Loaded doctors:', response);
      
      // Transform the data
      const transformedDoctors = response.map((doctor: any) => ({
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
        })(),
        created_at: (() => {
          try {
            const date = new Date(doctor.created_at);
            return isNaN(date.getTime()) ? new Date() : date;
          } catch (e) {
            console.warn('Failed to parse created_at for doctor:', doctor.id, e);
            return new Date();
          }
        })(),
        updated_at: (() => {
          try {
            const date = new Date(doctor.updated_at);
            return isNaN(date.getTime()) ? new Date() : date;
          } catch (e) {
            console.warn('Failed to parse updated_at for doctor:', doctor.id, e);
            return new Date();
          }
        })(),
        documents: (() => {
          try {
            if (typeof doctor.documents === 'string') {
              return JSON.parse(doctor.documents);
            } else if (doctor.documents && typeof doctor.documents === 'object') {
              return doctor.documents;
            } else {
              return {};
            }
          } catch (e) {
            console.warn('Failed to parse documents for doctor:', doctor.id, e);
            return {};
          }
        })(),
      }));
      
      setDoctors(transformedDoctors);
    } catch (error) {
      console.error('Error loading doctors:', error);
      toast({
        title: 'Error',
        description: 'Failed to load doctors',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await DatabaseService.getAllDoctorCategories();
      setCategories(response || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const filterDoctors = () => {
    let filtered = doctors;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(doctor =>
        doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.phone.includes(searchTerm) ||
        doctor.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(doctor => doctor.status.toLowerCase() === statusFilter.toLowerCase());
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(doctor => doctor.specialization === selectedCategory);
    }

    // Month/Year filter (1-based like Grocery Management)
    if (filterMonth !== null && filterYear !== null) {
      filtered = filtered.filter(doctor => {
        const dateStr = doctor.join_date || doctor.created_at;
        if (!dateStr) return false;
        
        let d;
        if (dateStr instanceof Date) {
          d = dateStr;
        } else {
          // Convert to string if it's not already
          const dateString = String(dateStr);
          if (dateString.includes('T')) {
            d = new Date(dateString);
          } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            d = new Date(dateString + 'T00:00:00');
          } else if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
            // Handle DD-MM-YYYY format
            const [day, month, year] = dateString.split('-');
            d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          } else {
            return false;
          }
        }
        
        if (isNaN(d.getTime())) return false;
        
        // Convert 1-based filterMonth to 0-based for comparison
        return (
          d.getMonth() === filterMonth - 1 &&
          d.getFullYear() === filterYear
        );
      });
    }

    setFilteredDoctors(filtered);
  };

  const handleView = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setShowViewModal(true);
  };

  const handleEdit = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setEditFormData({
      name: doctor.name,
      email: doctor.email,
      phone: doctor.phone,
      address: doctor.address,
      specialization: doctor.specialization,
      department: doctor.department,
      join_date: formatDateForInput(doctor.join_date),
      salary: doctor.salary.toString(),
      status: doctor.status,
    });
    setShowEditModal(true);
  };

  const handleDelete = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedDoctor) return;

    try {
      await DatabaseService.deleteDoctor(selectedDoctor.id);
      toast({
        title: 'Success',
        description: 'Doctor deleted successfully',
      });
      setShowDeleteModal(false);
      setSelectedDoctor(null);
      loadDoctors();
    } catch (error) {
      console.error('Error deleting doctor:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete doctor',
        variant: 'destructive',
      });
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor) return;

    try {
      const updateData = {
        name: editFormData.name,
        email: editFormData.email,
        phone: editFormData.phone,
        address: editFormData.address,
        specialization: editFormData.specialization,
        department: editFormData.department,
        join_date: formatDateForBackend(parseDateFromInput(editFormData.join_date)),
        salary: parseFloat(editFormData.salary) || 0,
        status: editFormData.status as "Active" | "Inactive",
      };

      await DatabaseService.updateDoctor(selectedDoctor.id, updateData);
      toast({
        title: 'Success',
        description: 'Doctor updated successfully',
      });
      setShowEditModal(false);
      setSelectedDoctor(null);
      loadDoctors();
    } catch (error) {
      console.error('Error updating doctor:', error);
      toast({
        title: 'Error',
        description: 'Failed to update doctor',
        variant: 'destructive',
      });
    }
  };

  const getDoctorPhotoUrl = (photoPath: string) => {
    if (!photoPath) return '/api/placeholder/40/40';
    
    // Handle both old and new path formats
    if (photoPath.startsWith('Photos/') || photoPath.startsWith('Photos\\')) {
      return `${import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:4000'}/${photoPath.replace(/\\/g, '/')}`;
    }
    
    return `${import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:4000'}/${photoPath}`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="crm-page-bg">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* CRM Header */}
        <div className="crm-header-container">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
            <div className="flex items-center gap-3">
              <div className="crm-header-icon">
                <Stethoscope className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Doctor Management</h1>
              </div>
            </div>

            <div className="flex flex-row sm:flex-row gap-1 sm:gap-3 w-full sm:w-auto">
              <ActionButtons.Refresh 
                onClick={() => {
                  console.log('🔄 Manual refresh triggered - refreshing entire page');
                  window.location.reload();
                }}
                loading={false}
                disabled={false}
              />
              
              {/* Month & Year Filter Button */}
              <ActionButtons.MonthYear
                onClick={() => setShowMonthYearDialog(true)}
                text={months[selectedMonth - 1]} // 1-based month to 0-based array
              />
              
              <Button 
                onClick={() => navigate('/management/doctors/add')}
                className="global-btn flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Add Doctor</span>
                <span className="sm:hidden">+</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="crm-stats-grid">
          {/* Total Doctors Card */}
          <Card className="crm-stat-card crm-stat-card-blue">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-blue-700 mb-1 truncate">Total Doctors</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-900 mb-1">{doctors.length}</p>
                  <div className="flex items-center text-xs text-blue-600">
                    <Users className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Registered</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-blue">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Active Doctors Card */}
          <Card className="crm-stat-card crm-stat-card-green">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-green-700 mb-1 truncate">Active Doctors</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-900 mb-1">
                    {doctors.filter(doc => doc.status === 'Active').length}
                  </p>
                  <div className="flex items-center text-xs text-green-600">
                    <UserCheck className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">On duty</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-green">
                  <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Specialists Card */}
          <Card className="crm-stat-card crm-stat-card-orange">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-orange-700 mb-1 truncate">Specialists</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-900 mb-1">
                    {doctors.filter(doc => doc.specialization && doc.specialization !== 'General').length}
                  </p>
                  <div className="flex items-center text-xs text-orange-600">
                    <Activity className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Specialized</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-orange">
                  <Activity className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Recent Additions Card */}
          <Card className="crm-stat-card crm-stat-card-purple">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-purple-700 mb-1 truncate">Recent</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-900 mb-1">
                    {doctors.filter(doc => {
                      const joinDate = new Date(doc.join_date);
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return joinDate >= weekAgo;
                    }).length}
                  </p>
                  <div className="flex items-center text-xs text-purple-600">
                    <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">This week</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-purple">
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
                <Input
                  placeholder="Search doctors by name, email, phone, or specialization..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <div className="px-2 py-1 border-t border-gray-200">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      onClick={() => {
                        setStatusFilter('all');
                        setSearchTerm('');
                        setSelectedCategory('all');
                        setFilterMonth(new Date().getMonth() + 1);
                        setFilterYear(new Date().getFullYear());
                        setSelectedMonth(new Date().getMonth() + 1);
                        setSelectedYear(new Date().getFullYear());
                      }}
                    >
                      <RefreshCw className="h-3 w-3 mr-2" />
                      Reset All Filters
                    </Button>
                  </div>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Doctors Table */}
        <Card className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-xl sm:rounded-2xl shadow-lg">
          <CardHeader className="p-4 sm:p-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <CardTitle className="text-lg sm:text-xl text-gray-900">
                Doctors List ({filteredDoctors.length})
              </CardTitle>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>Last updated: {format(new Date(), 'MMM dd, yyyy HH:mm')}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Loading doctors...</span>
              </div>
            ) : filteredDoctors.length === 0 ? (
              <div className="text-center py-12">
                <Stethoscope className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">No doctors found</p>
                <p className="text-gray-500 text-sm">Try adjusting your search or filters</p>
              </div>
            ) : (
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
                          <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>Photo</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                        <div className="flex items-center justify-center">
                          <span>Doctor ID</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                        <div className="flex items-center justify-center">
                          <span>Name</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                        <div className="flex items-center justify-center">
                          <span>Specialization</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                        <div className="flex items-center justify-center">
                          <span>Department</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                        <div className="flex items-center justify-center">
                          <span>Phone</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                          <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">Join Date</span>
                          <span className="sm:hidden">Date</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                          <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>Status</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                        <div className="flex items-center justify-center">
                          <span>Actions</span>
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDoctors.map((doctor, idx) => (
                      <TableRow key={doctor.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                        <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{idx + 1}</TableCell>
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
                        <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm font-medium text-blue-600 whitespace-nowrap">
                          {doctor.id}
                        </TableCell>
                        <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm font-medium text-gray-900 whitespace-nowrap">
                          {doctor.name}
                        </TableCell>
                        <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                          {doctor.specialization}
                        </TableCell>
                        <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                          {doctor.department}
                        </TableCell>
                        <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                          {doctor.phone}
                        </TableCell>
                        <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                          {doctor.join_date ? format(doctor.join_date, 'MM/dd/yyyy') : 'N/A'}
                        </TableCell>
                        <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center whitespace-nowrap">
                          <Badge 
                            className={`text-xs px-2 py-1 rounded-full font-medium ${
                              doctor.status.toLowerCase() === 'active' 
                                ? 'bg-green-100 text-green-800 border border-green-200' 
                                : 'bg-red-100 text-red-800 border border-red-200'
                            }`}
                          >
                            {doctor.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3">
                          <div className="flex items-center justify-center space-x-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleView(doctor)}
                              className="action-btn-lead action-btn-view h-7 w-7 sm:h-8 sm:w-8 p-0"
                              title="View Doctor"
                            >
                              <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(doctor)}
                              className="action-btn-lead action-btn-edit h-7 w-7 sm:h-8 sm:w-8 p-0"
                              title="Edit Doctor"
                            >
                              <Edit2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(doctor)}
                              className="action-btn-lead action-btn-delete h-7 w-7 sm:h-8 sm:w-8 p-0"
                              title="Delete Doctor"
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Doctor Modal - Glass Morphism Design */}
        {showViewModal && selectedDoctor && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowViewModal(false)}
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
                      <img
                        src={getDoctorPhotoUrl(selectedDoctor.photo)}
                        alt={selectedDoctor.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          const parent = target.parentElement as HTMLElement;
                          if (parent) {
                            parent.innerHTML = `<div class="w-full h-full flex items-center justify-center"><span class="text-lg font-semibold text-white">${selectedDoctor.name.charAt(0).toUpperCase()}</span></div>`;
                          }
                        }}
                      />
                    </div>
                    <div className="absolute -bottom-1 -right-1">
                      <div className={`border-2 border-white shadow-sm text-xs px-2 py-1 rounded-full ${getStatusColor(selectedDoctor.status)}`}>
                        {selectedDoctor.status}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-1 sm:gap-2 truncate">
                      <Stethoscope className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-blue-600 flex-shrink-0" />
                      <span className="truncate">Dr. {selectedDoctor.name}</span>
                    </h2>
                    <div className="text-xs sm:text-sm md:text-lg lg:text-xl mt-1 flex items-center gap-2">
                      <span className="text-gray-600">Doctor ID:</span>
                      <span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg border border-green-200">
                        {selectedDoctor.id}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowViewModal(false)}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Modal Body - Glass Morphism Style */}
              <div className="overflow-y-auto max-h-[calc(95vh-100px)] sm:max-h-[calc(95vh-120px)] md:max-h-[calc(95vh-140px)] lg:max-h-[calc(95vh-200px)] custom-scrollbar">
                <div className="p-2 sm:p-3 md:p-4 lg:p-6 space-y-3 sm:space-y-4 md:space-y-6 lg:space-y-8">
                  
                  {/* Personal Information Section */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-blue-100 shadow-sm">
                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 flex items-center gap-2">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <User className="h-3 w-3 sm:h-3 sm:w-3 md:h-4 md:w-4 text-blue-600" />
                      </div>
                      Personal Information
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
                            <Mail className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-green-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-green-600 uppercase tracking-wide">Email Address</div>
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 truncate">{selectedDoctor.email}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-purple-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-purple-100">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Phone className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-purple-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-purple-600 uppercase tracking-wide">Phone Number</div>
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">{selectedDoctor.phone}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-orange-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-orange-100 sm:col-span-2 lg:col-span-3">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <MapPin className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-orange-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-orange-600 uppercase tracking-wide">Address</div>
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">{selectedDoctor.address}</p>
                          </div>
                        </div>
                      </div>
                      
                    </div>
                  </div>

                  {/* Professional Information Section */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-blue-100 shadow-sm">
                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 flex items-center gap-2">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <Stethoscope className="h-3 w-3 sm:h-3 sm:w-3 md:h-4 md:w-4 text-green-600" />
                      </div>
                      Professional Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                      
                      <div className="bg-gradient-to-br from-blue-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-blue-100">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Stethoscope className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-blue-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">Specialization</div>
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">{selectedDoctor.specialization}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-green-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-green-100">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Users className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-green-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-green-600 uppercase tracking-wide">Department</div>
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">{selectedDoctor.department}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-purple-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-purple-100">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-purple-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-purple-600 uppercase tracking-wide">Join Date</div>
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">
                              {selectedDoctor.join_date ? format(selectedDoctor.join_date, 'dd/MM/yyyy') : 'N/A'}
                            </p>
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
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">₹{selectedDoctor.salary.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                      
                    </div>
                  </div>

                  {/* Documents Section */}
                  {selectedDoctor.documents && Object.keys(selectedDoctor.documents).length > 0 && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-blue-100 shadow-sm">
                      <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 flex items-center gap-2">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <FileText className="h-3 w-3 sm:h-3 sm:w-3 md:h-4 md:w-4 text-purple-600" />
                        </div>
                        Documents ({Object.keys(selectedDoctor.documents).length})
                      </h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                        {Object.entries(selectedDoctor.documents).map(([key, path]) => (
                          <Button
                            key={key}
                            variant="outline"
                            onClick={() => window.open(getDoctorPhotoUrl(path as string), '_blank')}
                            className="justify-start bg-gradient-to-br from-blue-50 to-white p-3 rounded-lg border border-blue-100 hover:from-blue-100 hover:to-white h-auto"
                          >
                            <FileText className="w-4 h-4 mr-2 text-blue-600" />
                            <span className="text-sm font-medium text-gray-900">
                              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Doctor Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="crm-modal-container">
            <DialogHeader className="editpopup form dialog-header">
              <div className="editpopup form icon-title-container">
                <div className="editpopup form dialog-icon">
                  <Edit2 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
                <div className="editpopup form title-description">
                  <DialogTitle className="editpopup form dialog-title">
                    Edit Doctor
                  </DialogTitle>
                  <DialogDescription className="editpopup form dialog-description">
                    Update doctor information and details
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <form onSubmit={handleEditSubmit} className="editpopup form crm-edit-form-content">
              <div className="editpopup form crm-edit-form-grid">
                <div className="editpopup form crm-edit-form-group">
                  <Label htmlFor="edit-name" className="editpopup form crm-edit-form-label flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Doctor Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-name"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                    placeholder="Enter doctor's full name"
                    className="editpopup form crm-edit-form-input"
                    required
                  />
                </div>
                
                <div className="editpopup form crm-edit-form-group">
                  <Label htmlFor="edit-email" className="editpopup form crm-edit-form-label flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                    placeholder="Enter email address"
                    className="editpopup form crm-edit-form-input"
                    required
                  />
                </div>
                
                <div className="editpopup form crm-edit-form-group">
                  <Label htmlFor="edit-phone" className="editpopup form crm-edit-form-label flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-phone"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                    placeholder="Enter phone number"
                    className="editpopup form crm-edit-form-input"
                    required
                  />
                </div>
                
                <div className="editpopup form crm-edit-form-group">
                  <Label htmlFor="edit-specialization" className="editpopup form crm-edit-form-label flex items-center gap-2">
                    <Stethoscope className="h-4 w-4" />
                    Specialization <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-specialization"
                    value={editFormData.specialization}
                    onChange={(e) => setEditFormData({...editFormData, specialization: e.target.value})}
                    placeholder="Enter specialization"
                    className="editpopup form crm-edit-form-input"
                    required
                  />
                </div>
                
                <div className="editpopup form crm-edit-form-group">
                  <Label htmlFor="edit-department" className="editpopup form crm-edit-form-label flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Department
                  </Label>
                  <Input
                    id="edit-department"
                    value={editFormData.department}
                    onChange={(e) => setEditFormData({...editFormData, department: e.target.value})}
                    placeholder="Enter department"
                    className="editpopup form crm-edit-form-input"
                  />
                </div>
                
                <div className="editpopup form crm-edit-form-group">
                  <Label htmlFor="edit-join-date" className="editpopup form crm-edit-form-label flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Join Date
                  </Label>
                  <Input
                    id="edit-join-date"
                    type="date"
                    value={editFormData.join_date}
                    onChange={(e) => setEditFormData({...editFormData, join_date: e.target.value})}
                    className="editpopup form crm-edit-form-input"
                  />
                </div>
                
                <div className="editpopup form crm-edit-form-group">
                  <Label htmlFor="edit-salary" className="editpopup form crm-edit-form-label flex items-center gap-2">
                    <IndianRupee className="h-4 w-4" />
                    Salary
                  </Label>
                  <Input
                    id="edit-salary"
                    type="number"
                    value={editFormData.salary}
                    onChange={(e) => setEditFormData({...editFormData, salary: e.target.value})}
                    placeholder="Enter salary amount"
                    className="editpopup form crm-edit-form-input"
                  />
                </div>
                
                <div className="editpopup form crm-edit-form-group">
                  <Label htmlFor="edit-status" className="editpopup form crm-edit-form-label flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Status
                  </Label>
                  <Select 
                    value={editFormData.status} 
                    onValueChange={(value) => setEditFormData({...editFormData, status: value})}
                  >
                    <SelectTrigger className="editpopup form crm-edit-form-select">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="editpopup form crm-edit-form-group">
                <Label htmlFor="edit-address" className="editpopup form crm-edit-form-label flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Address
                </Label>
                <Textarea
                  id="edit-address"
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
                  placeholder="Enter complete address"
                  rows={3}
                  className="editpopup form crm-edit-form-input"
                />
              </div>
              
              <DialogFooter className="editpopup form dialog-footer flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowEditModal(false)}
                  className="editpopup form footer-button-cancel w-full sm:w-auto modern-btn modern-btn-secondary"
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="editpopup form footer-button-save w-full sm:w-auto global-btn"
                >
                  <Edit2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Update Doctor
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Month/Year Picker Dialog */}
        <MonthYearPickerDialog
          open={showMonthYearDialog}
          onOpenChange={setShowMonthYearDialog}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
          onApply={() => {
            setFilterMonth(selectedMonth);
            setFilterYear(selectedYear);
            setShowMonthYearDialog(false);
          }}
          title="Select Month & Year"
          description="Filter doctors by specific month and year"
          previewText="doctors"
        />

        {/* Delete Confirmation Modal */}
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent className="crm-modal-container">
            <DialogHeader className="editpopup form dialog-header">
              <div className="editpopup form icon-title-container">
                <div className="editpopup form dialog-icon">
                  <Trash2 className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                </div>
                <div className="editpopup form title-description">
                  <DialogTitle className="editpopup form dialog-title text-red-700">
                    Delete Doctor
                  </DialogTitle>
                  <DialogDescription className="editpopup form dialog-description">
                    Are you sure you want to delete this doctor? This action cannot be undone.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            {selectedDoctor && (
              <div className="mx-4 my-4 p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
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
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-gray-900 truncate">{selectedDoctor.name}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <Stethoscope className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600 truncate">{selectedDoctor.specialization}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600 truncate">ID: {selectedDoctor.id}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="editpopup form dialog-footer flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteModal(false)}
                className="editpopup form footer-button-cancel w-full sm:w-auto modern-btn modern-btn-secondary"
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmDelete}
                className="editpopup form footer-button-delete w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                Delete Doctor
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default DoctorManagement;
