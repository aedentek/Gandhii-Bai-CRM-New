import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { DatabaseService } from '@/services/databaseService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Search, Eye, Edit2, Trash2, Users, Plus, Filter, Download, FileText, Upload, RefreshCw, UserCheck, Activity, TrendingUp, Clock, Stethoscope } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import '../../styles/modern-forms.css';
import '../../styles/modern-tables.css';
import '@/styles/global-crm-design.css';

// Import centralized date utilities
import {
  parseDate,
  formatDateForInput,
  formatDateForBackend,
  formatDateForDisplay,
  parseDateFromInput,
  toSafeBackendDate,
  toSafeDisplayDate,
  DATE_CSS_CLASSES
} from '@/utils/dateUtils';

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
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categories, setCategories] = useState<DoctorCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

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
  }, [doctors, searchTerm, statusFilter, selectedCategory]);

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
        join_date: toSafeBackendDate(editFormData.join_date),
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
      return `http://localhost:4000/${photoPath.replace(/\\/g, '/')}`;
    }
    
    return `http://localhost:4000/${photoPath}`;
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
                <p className="text-sm sm:text-base text-gray-600">Manage medical professionals and their information</p>
              </div>
            </div>

            <div className="flex flex-row sm:flex-row gap-1 sm:gap-3 w-full sm:w-auto">
              <Button 
                onClick={() => navigate('/management/doctors/add')}
                className="global-btn flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Add Doctor</span>
                <span className="sm:hidden">+</span>
              </Button>
              <Button 
                onClick={loadDoctors}
                variant="outline"
                className="action-btn-lead flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
              >
                <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
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

        {/* Search and Filters */}
        <Card className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-xl sm:rounded-2xl shadow-lg mb-6 sm:mb-8">
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search doctors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-200 focus:border-blue-500 rounded-lg"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="rounded-lg border-gray-200">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="rounded-lg border-gray-200">
                  <SelectValue placeholder="Filter by specialization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Specializations</SelectItem>
                  {Array.from(new Set(doctors.map(d => d.specialization))).map((spec) => (
                    <SelectItem key={spec} value={spec}>
                      {spec}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 rounded-lg border-gray-200">
                  <Filter className="w-4 h-4 mr-2" />
                  More Filters
                </Button>
                <Button variant="outline" className="rounded-lg border-gray-200">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

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
                          {toSafeDisplayDate(doctor.join_date)}
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
                              className="h-7 w-7 sm:h-8 sm:w-8 p-0 border-green-200 text-green-600 hover:bg-green-50 hover:border-green-400 rounded-md"
                              title="View Doctor"
                            >
                              <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(doctor)}
                              className="h-7 w-7 sm:h-8 sm:w-8 p-0 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-400 rounded-md"
                              title="Edit Doctor"
                            >
                              <Edit2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(doctor)}
                              className="h-7 w-7 sm:h-8 sm:w-8 p-0 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-400 rounded-md"
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

        {/* View Doctor Modal */}
        <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Stethoscope className="w-5 h-5 text-blue-600" />
                <span>Doctor Details</span>
              </DialogTitle>
            </DialogHeader>
            {selectedDoctor && (
              <div className="space-y-6">
                {/* Photo and Basic Info */}
                <div className="flex items-start space-x-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100">
                    <img
                      src={getDoctorPhotoUrl(selectedDoctor.photo)}
                      alt={selectedDoctor.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/api/placeholder/80/80';
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900">{selectedDoctor.name}</h3>
                    <p className="text-gray-600">{selectedDoctor.id}</p>
                    <Badge className={getStatusColor(selectedDoctor.status)}>
                      {selectedDoctor.status}
                    </Badge>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Email</Label>
                    <p className="text-gray-900">{selectedDoctor.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Phone</Label>
                    <p className="text-gray-900">{selectedDoctor.phone}</p>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-gray-700">Address</Label>
                    <p className="text-gray-900">{selectedDoctor.address}</p>
                  </div>
                </div>

                {/* Professional Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Specialization</Label>
                    <p className="text-gray-900">{selectedDoctor.specialization}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Department</Label>
                    <p className="text-gray-900">{selectedDoctor.department}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Join Date</Label>
                    <p className="text-gray-900">
                      {toSafeDisplayDate(selectedDoctor.join_date)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Salary</Label>
                    <p className="text-gray-900">₹{selectedDoctor.salary.toLocaleString()}</p>
                  </div>
                </div>

                {/* Documents */}
                {selectedDoctor.documents && Object.keys(selectedDoctor.documents).length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Documents</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(selectedDoctor.documents).map(([key, path]) => (
                        <Button
                          key={key}
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(getDoctorPhotoUrl(path as string), '_blank')}
                          className="justify-start"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Doctor Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Edit2 className="w-5 h-5 text-green-600" />
                <span>Edit Doctor</span>
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Name *</Label>
                  <Input
                    id="edit-name"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email">Email *</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-phone">Phone *</Label>
                  <Input
                    id="edit-phone"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-specialization">Specialization *</Label>
                  <Input
                    id="edit-specialization"
                    value={editFormData.specialization}
                    onChange={(e) => setEditFormData({...editFormData, specialization: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-department">Department</Label>
                  <Input
                    id="edit-department"
                    value={editFormData.department}
                    onChange={(e) => setEditFormData({...editFormData, department: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-join-date">Join Date</Label>
                  <Input
                    id="edit-join-date"
                    type="date"
                    className={`${DATE_CSS_CLASSES.input}`}
                    value={editFormData.join_date}
                    onChange={(e) => setEditFormData({...editFormData, join_date: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-salary">Salary</Label>
                  <Input
                    id="edit-salary"
                    type="number"
                    value={editFormData.salary}
                    onChange={(e) => setEditFormData({...editFormData, salary: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-status">Status</Label>
                  <Select 
                    value={editFormData.status} 
                    onValueChange={(value) => setEditFormData({...editFormData, status: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-address">Address</Label>
                <Textarea
                  id="edit-address"
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
                  rows={3}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                  Update Doctor
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2 text-red-600">
                <Trash2 className="w-5 h-5" />
                <span>Delete Doctor</span>
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this doctor? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {selectedDoctor && (
              <div className="py-4">
                <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100">
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
                    <p className="font-medium text-gray-900">{selectedDoctor.name}</p>
                    <p className="text-sm text-gray-600">{selectedDoctor.id} - {selectedDoctor.specialization}</p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
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
