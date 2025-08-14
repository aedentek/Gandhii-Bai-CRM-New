// --- Doctor Management with GeneralManagement Design Pattern ---
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Search, Users, Plus, Eye, Edit2, Trash2, RefreshCw, Activity, CheckCircle, XCircle, Stethoscope } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { parseISO, format as formatDate } from 'date-fns';
import * as XLSX from 'xlsx';
import { DatabaseService } from '@/services/databaseService';
import { useToast } from '@/hooks/use-toast';
import LoadingScreen from '@/components/shared/LoadingScreen';
import { cn } from '@/lib/utils';

const getStatusBadge = (status: string) => {
  const variants: any = {
    Active: 'bg-blue-100 text-blue-700 border border-blue-200',
    Inactive: 'bg-gray-100 text-gray-600 border border-gray-200',
  };
  return variants[status] || 'bg-gray-100 text-gray-600 border border-gray-200';
};

const DoctorManagement: React.FC = () => {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewDoctor, setViewDoctor] = useState<any | null>(null);
  const [editDoctor, setEditDoctor] = useState<any | null>(null);
  const [deleteDoctor, setDeleteDoctor] = useState<any | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const { toast } = useToast();
  const rowsPerPage = 10;

  useEffect(() => {
    loadDoctors();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await DatabaseService.getAllDoctorCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast({
        title: "Error",
        description: "Failed to load doctor categories",
        variant: "destructive",
      });
    }
  };

  const loadDoctors = async () => {
    try {
      setLoading(true);
      const doctorData = await DatabaseService.getAllDoctors();
      setDoctors(doctorData);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error loading doctors:', error);
      toast({
        title: "Error",
        description: "Failed to load doctors from database",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  let filteredDoctors = doctors.filter((d) =>
    (d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.role?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (statusFilter === 'All' || d.status === statusFilter)
  );
  
  filteredDoctors.sort((a, b) => {
    const getNum = (id: string) => {
      if (!id) return 0;
      const match = id.match(/DOC(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    };
    return getNum(a.id) - getNum(b.id);
  });

  const exportToExcel = () => {
    const data = filteredDoctors.map((d, idx) => ({
      'S No': idx + 1,
      'Doctor ID': d.id,
      'Name': d.name,
      'Email': d.email,
      'Phone': d.phone,
      'Specialization': d.role,
      'Join Date': d.joinDate,
      'Salary': d.salary,
      'Status': d.status,
      'Address': d.address || '',
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Doctors');
    XLSX.writeFile(wb, 'doctor-list.xlsx');
  };

  if (loading) {
    return <LoadingScreen message="Loading doctor management data..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Professional Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 hover:shadow-md hover:scale-[1.01] transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center transition-all duration-300 hover:bg-blue-700 hover:scale-110">
                <Users className="w-6 h-6 text-white transition-transform duration-300 hover:rotate-3" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 transition-colors duration-300 hover:text-blue-600">Doctor Management</h1>
                <p className="text-sm text-gray-600 mt-1">Manage doctor profiles and information</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('All');
                  setCurrentPage(1);
                  loadDoctors();
                }}
                disabled={loading}
                variant="outline"
                className="flex items-center space-x-2 hover:scale-105 transition-all duration-300 hover:shadow-md border-blue-300 hover:border-blue-500 hover:bg-blue-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''} transition-transform duration-300 hover:rotate-180 text-blue-600`} />
                <span className="font-medium">Refresh</span>
              </Button>
              
              <Button 
                onClick={exportToExcel}
                variant="outline"
                className="flex items-center space-x-2 hover:scale-105 transition-all duration-300 hover:shadow-md border-green-300 hover:border-green-500 hover:bg-green-50"
              >
                <Download className="h-4 w-4 transition-transform duration-300 hover:scale-110 text-green-600" />
                <span className="font-medium">Export</span>
              </Button>
              
              <Button 
                onClick={() => window.location.href = '/management/add-doctor'}
                className="flex items-center space-x-2 hover:scale-105 transition-all duration-300 hover:shadow-md bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 transition-transform duration-300 hover:scale-110" />
                <span className="font-medium">Add Doctor</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Professional Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500"></div>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors duration-300">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Total Doctors</p>
                  <p className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">{doctors.length}</p>
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
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Active Doctors</p>
                  <p className="text-2xl font-bold text-gray-900 group-hover:text-green-600 transition-colors duration-300">{doctors.filter(d => d.status === 'Active').length}</p>
                </div>
              </div>
              <div className="mt-4 h-1 bg-green-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-orange-500"></div>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors duration-300">
                  <XCircle className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Inactive Doctors</p>
                  <p className="text-2xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors duration-300">{doctors.filter(d => d.status === 'Inactive').length}</p>
                </div>
              </div>
              <div className="mt-4 h-1 bg-orange-200 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-purple-500"></div>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors duration-300">
                  <Stethoscope className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Total Filtered</p>
                  <p className="text-2xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors duration-300">{filteredDoctors.length}</p>
                </div>
              </div>
              <div className="mt-4 h-1 bg-purple-200 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search doctors by name, ID, or specialization..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Doctors Table */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-100 p-6">
            <CardTitle className="text-xl font-semibold text-gray-900">Doctor List</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-left font-semibold text-gray-900 py-4 px-6">Doctor</TableHead>
                    <TableHead className="text-center font-semibold text-gray-900 py-4 px-6">Doctor ID</TableHead>
                    <TableHead className="text-center font-semibold text-gray-900 py-4 px-6">Specialization</TableHead>
                    <TableHead className="text-center font-semibold text-gray-900 py-4 px-6">Status</TableHead>
                    <TableHead className="text-center font-semibold text-gray-900 py-4 px-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDoctors.length > 0 ? (
                    filteredDoctors.map((doctor, index) => (
                      <TableRow key={doctor.id || index} className="hover:bg-gray-50 transition-colors duration-200">
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-semibold text-blue-600">
                                {doctor.name?.charAt(0)?.toUpperCase() || 'D'}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{doctor.name}</div>
                              <div className="text-sm text-gray-500">{doctor.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-medium text-gray-900 py-4 px-6">
                          {doctor.id}
                        </TableCell>
                        <TableCell className="text-center py-4 px-6">
                          <span className="text-sm text-gray-600">{doctor.role || doctor.specialization || '-'}</span>
                        </TableCell>
                        <TableCell className="text-center py-4 px-6">
                          <Badge variant={doctor.status === 'Active' ? 'default' : 'secondary'}>
                            {doctor.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center py-4 px-6">
                          <div className="flex items-center justify-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 hover:border-blue-400 action-btn-view rounded-lg transition-all duration-300"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200 hover:border-orange-400 action-btn-edit rounded-lg transition-all duration-300"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-400 action-btn-delete rounded-lg transition-all duration-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12">
                        <div className="flex flex-col items-center justify-center space-y-4">
                          <div className="p-4 bg-gray-100 rounded-full">
                            <Users className="h-8 w-8 text-gray-400" />
                          </div>
                          <div className="text-center">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No doctors found</h3>
                            <p className="text-gray-500">No doctors match your search criteria or no doctors have been added yet.</p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DoctorManagement;
