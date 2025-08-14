import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Package, 
  RefreshCw, 
  Calendar, 
  Download, 
  Plus, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign,
  Edit2, 
  Trash2, 
  Eye,
  CheckCircle,
  AlertCircle,
  Clock,
  CreditCard
} from 'lucide-react';
import { DatabaseService } from '@/services/databaseService';

interface Doctor {
  id: string;
  name: string;
  photo?: string;
  salary: string;
  total_paid: string;
  payment_mode?: string;
  status?: string;
  specialization?: string;
  join_date?: string;
}

const DoctorSalary: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const rowsPerPage = 10;
  const monthNames = ['all', 'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

  // Form states for add/edit
  const [formData, setFormData] = useState({
    name: '',
    salary: '',
    specialization: '',
    payment_mode: 'bank_transfer'
  });

  const [paymentData, setPaymentData] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_mode: 'bank_transfer',
    notes: ''
  });

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await DatabaseService.getAllDoctors();
      setDoctors(response || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter doctors based on search and month
  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doctor.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Calculate statistics
  const totalDoctors = filteredDoctors.length;
  const totalSalary = filteredDoctors.reduce((sum, d) => sum + (parseFloat(d.salary) || 0), 0);
  const totalPaid = filteredDoctors.reduce((sum, d) => sum + (parseFloat(d.total_paid) || 0), 0);
  const totalPending = totalSalary - totalPaid;
  const activeDoctors = filteredDoctors.filter(d => d.status === 'Active').length;

  // Pagination
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentDoctors = filteredDoctors.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredDoctors.length / rowsPerPage);

  const handleAddDoctor = async () => {
    try {
      const newDoctor = {
        ...formData,
        id: `DOC${Date.now()}`,
        total_paid: '0',
        status: 'Active',
        join_date: new Date().toISOString().split('T')[0]
      };
      
      await DatabaseService.addDoctor(newDoctor);
      setDoctors(prev => [...prev, newDoctor]);
      setAddModalOpen(false);
      setFormData({ name: '', salary: '', specialization: '', payment_mode: 'bank_transfer' });
    } catch (error) {
      console.error('Error adding doctor:', error);
    }
  };

  const handleUpdateDoctor = async () => {
    if (!selectedDoctor) return;
    
    try {
      const updateData = {
        name: formData.name,
        salary: parseFloat(formData.salary) || 0,
        specialization: formData.specialization,
        payment_mode: formData.payment_mode as "Cash" | "Bank" | "UPI" | "Cheque",
        status: "Active" as const
      };
      
      await DatabaseService.updateDoctor(selectedDoctor.id, updateData);
      
      const updatedDoctor = { ...selectedDoctor, ...formData };
      setDoctors(prev => prev.map(d => d.id === updatedDoctor.id ? updatedDoctor : d));
      setEditModalOpen(false);
      setSelectedDoctor(null);
    } catch (error) {
      console.error('Error updating doctor:', error);
    }
  };

  const handleDeleteDoctor = async () => {
    if (!selectedDoctor) return;
    
    try {
      await DatabaseService.deleteDoctor(selectedDoctor.id);
      setDoctors(prev => prev.filter(d => d.id !== selectedDoctor.id));
      setDeleteModalOpen(false);
      setSelectedDoctor(null);
    } catch (error) {
      console.error('Error deleting doctor:', error);
    }
  };

  const handlePayment = async () => {
    if (!selectedDoctor) return;
    
    try {
      const currentPaid = parseFloat(selectedDoctor.total_paid || '0');
      const newAmount = parseFloat(paymentData.amount);
      const updateData = {
        total_paid: parseFloat(selectedDoctor.total_paid || '0') + newAmount,
        salary: parseFloat(selectedDoctor.salary || '0'),
        status: "Active" as const
      };
      
      await DatabaseService.updateDoctor(selectedDoctor.id, updateData);
      setDoctors(prev => prev.map(d => d.id === selectedDoctor.id ? {...d, total_paid: (currentPaid + newAmount).toString()} : d));
      setPaymentModalOpen(false);
      setSelectedDoctor(null);
      setPaymentData({ amount: '', payment_date: new Date().toISOString().split('T')[0], payment_mode: 'bank_transfer', notes: '' });
    } catch (error) {
      console.error('Error processing payment:', error);
    }
  };

  const exportToCSV = () => {
    const headers = ['S.No', 'Doctor Name', 'Specialization', 'Salary', 'Total Paid', 'Balance', 'Status'];
    const csvData = [
      headers.join(','),
      ...filteredDoctors.map((doctor, index) => [
        index + 1,
        doctor.name,
        doctor.specialization || '',
        doctor.salary || '0',
        doctor.total_paid || '0',
        (parseFloat(doctor.salary || '0') - parseFloat(doctor.total_paid || '0')).toString(),
        doctor.status || 'Active'
      ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `doctor-salary-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-blue-50 p-2 sm:p-4 lg:p-6">
      {/* Header */}
      <div className="w-full bg-white/90 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg mb-4 lg:mb-6">
        <div className="p-3 sm:p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 bg-blue-100 rounded-xl shadow-sm">
                <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Doctor Salary Management</h1>
                {/* <p className="text-sm text-gray-600 mt-1">Manage and track doctor salary payments</p> */}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <Button
                onClick={fetchDoctors}
                // variant="outline"
                className="modern-btn modern-btn-outline flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
              >
                <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Refresh</span>
                <span className="sm:hidden">Refresh</span>
              </Button>
              
              <Button
                variant="outline"
                className="modern-btn modern-btn-outline flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
              >
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">August 2025</span>
                <span className="sm:hidden">Aug 2025</span>
              </Button>
              
              <Button
                onClick={exportToCSV}
                // variant="outline"
                className="modern-btn modern-btn-outline flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">Export</span>
              </Button>
              
              <Button
                onClick={() => setAddModalOpen(true)}
                className="modern-btn modern-btn-primary flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Add Doctor</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6 mb-4 lg:mb-6">
        <div className="modern-stat-card stat-card-blue">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-3 w-3 sm:h-5 sm:w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-medium text-blue-600">Total Doctors</p>
              <p className="text-lg sm:text-2xl font-bold text-blue-900">{totalDoctors}</p>
            </div>
          </div>
        </div>
        
        <div className="modern-stat-card stat-card-green">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-3 w-3 sm:h-5 sm:w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-medium text-green-600">Total Salary</p>
              <p className="text-lg sm:text-2xl font-bold text-green-900">₹{totalSalary.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="modern-stat-card stat-card-orange">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <CheckCircle className="h-3 w-3 sm:h-5 sm:w-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-medium text-orange-600">Total Paid</p>
              <p className="text-lg sm:text-2xl font-bold text-orange-900">₹{totalPaid.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="modern-stat-card stat-card-red">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="h-3 w-3 sm:h-5 sm:w-5 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-medium text-red-600">Pending</p>
              <p className="text-lg sm:text-2xl font-bold text-red-900">₹{totalPending.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-xl shadow-sm mb-4 lg:mb-6">
        <div className="p-3 sm:p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search doctors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 modern-input"
              />
            </div>
            
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-full sm:w-48 modern-select">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {monthNames.slice(1).map(month => (
                  <SelectItem key={month} value={month}>
                    {month.charAt(0).toUpperCase() + month.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Salary Table */}
      <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-xl shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center text-base sm:text-lg font-semibold text-gray-900">
            <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            <span className="hidden sm:inline">Salary Management ({filteredDoctors.length})</span>
            <span className="sm:hidden">Salaries ({filteredDoctors.length})</span>
          </div>
        </div>
      
        {/* Scrollable Table View for All Screen Sizes */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left p-3 text-xs sm:text-sm font-medium text-gray-600">S.No</th>
                <th className="text-left p-3 text-xs sm:text-sm font-medium text-gray-600">Profile</th>
                <th className="text-left p-3 text-xs sm:text-sm font-medium text-gray-600">Doctor Name</th>
                <th className="text-left p-3 text-xs sm:text-sm font-medium text-gray-600">Salary</th>
                <th className="text-left p-3 text-xs sm:text-sm font-medium text-gray-600">Total Paid</th>
                <th className="text-left p-3 text-xs sm:text-sm font-medium text-gray-600">Balance</th>
                <th className="text-left p-3 text-xs sm:text-sm font-medium text-gray-600">Status</th>
                <th className="text-left p-3 text-xs sm:text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center p-8">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      <span className="ml-2 text-gray-600">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : currentDoctors.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center p-8 text-gray-500">
                    No doctors found
                  </td>
                </tr>
              ) : (
                currentDoctors.map((doctor, index) => {
                  const balance = parseFloat(doctor.salary || '0') - parseFloat(doctor.total_paid || '0');
                  const serialNumber = startIndex + index + 1;
                  
                  return (
                    <tr key={doctor.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="p-3 text-xs sm:text-sm font-medium text-gray-900">{serialNumber}</td>
                      <td className="p-3">
                        {doctor.photo ? (
                          <img
                            src={doctor.photo}
                            alt={doctor.name}
                            className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover border border-gray-200"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`h-8 w-8 sm:h-10 sm:w-10 bg-blue-100 rounded-full flex items-center justify-center border border-gray-200 ${doctor.photo ? 'hidden' : 'flex'}`}>
                          <Users className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-xs sm:text-sm font-medium text-gray-900">{doctor.name}</div>
                        <div className="text-xs text-gray-500">{doctor.specialization || 'General'}</div>
                      </td>
                      <td className="p-3 text-xs sm:text-sm font-medium text-green-600">
                        ₹{parseFloat(doctor.salary || '0').toLocaleString()}
                      </td>
                      <td className="p-3 text-xs sm:text-sm font-medium text-blue-600">
                        ₹{parseFloat(doctor.total_paid || '0').toLocaleString()}
                      </td>
                      <td className="p-3">
                        <span className={`text-xs sm:text-sm font-medium ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          ₹{balance.toLocaleString()}
                        </span>
                      </td>
                      <td className="p-3">
                        <Badge 
                          className={`text-xs ${balance > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}
                        >
                          {balance > 0 ? 'Pending' : 'Paid'}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <button
                            onClick={() => {
                              setSelectedDoctor(doctor);
                              setViewModalOpen(true);
                            }}
                            className="p-1 sm:p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                            title="View Details"
                          >
                            <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedDoctor(doctor);
                              setFormData({
                                name: doctor.name,
                                salary: doctor.salary,
                                specialization: doctor.specialization || '',
                                payment_mode: doctor.payment_mode || 'bank_transfer'
                              });
                              setEditModalOpen(true);
                            }}
                            className="p-1 sm:p-1.5 text-green-600 hover:bg-green-50 rounded"
                            title="Edit Doctor"
                          >
                            <Edit2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedDoctor(doctor);
                              setPaymentModalOpen(true);
                            }}
                            className="p-1 sm:p-1.5 text-orange-600 hover:bg-orange-50 rounded"
                            title="Record Payment"
                          >
                            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedDoctor(doctor);
                              setDeleteModalOpen(true);
                            }}
                            className="p-1 sm:p-1.5 text-red-600 hover:bg-red-50 rounded"
                            title="Delete Doctor"
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredDoctors.length > rowsPerPage && (
          <div className="px-4 py-3 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="text-xs sm:text-sm text-gray-600">
                Showing {Math.min(startIndex + 1, filteredDoctors.length)} to {Math.min(endIndex, filteredDoctors.length)} of {filteredDoctors.length} doctors
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-50"
                >
                  Previous
                </button>
                
                <span className="text-xs sm:text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Doctor Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="modern-dialog">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900">Add New Doctor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">Doctor Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter doctor name"
                className="modern-input"
              />
            </div>
            <div>
              <Label htmlFor="specialization" className="text-sm font-medium text-gray-700">Specialization</Label>
              <Input
                id="specialization"
                value={formData.specialization}
                onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                placeholder="Enter specialization"
                className="modern-input"
              />
            </div>
            <div>
              <Label htmlFor="salary" className="text-sm font-medium text-gray-700">Monthly Salary</Label>
              <Input
                id="salary"
                type="number"
                value={formData.salary}
                onChange={(e) => setFormData({...formData, salary: e.target.value})}
                placeholder="Enter salary amount"
                className="modern-input"
              />
            </div>
            <div>
              <Label htmlFor="payment_mode" className="text-sm font-medium text-gray-700">Payment Mode</Label>
              <Select value={formData.payment_mode} onValueChange={(value) => setFormData({...formData, payment_mode: value})}>
                <SelectTrigger className="modern-select">
                  <SelectValue placeholder="Select payment mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => {
                  setAddModalOpen(false);
                  setFormData({ name: '', salary: '', specialization: '', payment_mode: 'bank_transfer' });
                }}
                variant="outline"
                className="flex-1 modern-btn modern-btn-outline"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddDoctor}
                className="flex-1 modern-btn bg-blue-600 hover:bg-blue-700 text-white"
              >
                Add Doctor
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Doctor Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="modern-dialog">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900">Edit Doctor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name" className="text-sm font-medium text-gray-700">Doctor Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter doctor name"
                className="modern-input"
              />
            </div>
            <div>
              <Label htmlFor="edit-specialization" className="text-sm font-medium text-gray-700">Specialization</Label>
              <Input
                id="edit-specialization"
                value={formData.specialization}
                onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                placeholder="Enter specialization"
                className="modern-input"
              />
            </div>
            <div>
              <Label htmlFor="edit-salary" className="text-sm font-medium text-gray-700">Monthly Salary</Label>
              <Input
                id="edit-salary"
                type="number"
                value={formData.salary}
                onChange={(e) => setFormData({...formData, salary: e.target.value})}
                placeholder="Enter salary amount"
                className="modern-input"
              />
            </div>
            <div>
              <Label htmlFor="edit-payment_mode" className="text-sm font-medium text-gray-700">Payment Mode</Label>
              <Select value={formData.payment_mode} onValueChange={(value) => setFormData({...formData, payment_mode: value})}>
                <SelectTrigger className="modern-select">
                  <SelectValue placeholder="Select payment mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => {
                  setEditModalOpen(false);
                  setSelectedDoctor(null);
                }}
                variant="outline"
                className="flex-1 modern-btn modern-btn-outline"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateDoctor}
                className="modern-btn modern-btn-primary flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
              >
                Update Doctor
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="modern-dialog">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Record Payment - {selectedDoctor?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">Current Balance</div>
              <div className="text-xl font-bold text-red-600">
                ₹{selectedDoctor ? (parseFloat(selectedDoctor.salary || '0') - parseFloat(selectedDoctor.total_paid || '0')).toLocaleString() : 0}
              </div>
            </div>
            <div>
              <Label htmlFor="payment-amount" className="text-sm font-medium text-gray-700">Payment Amount</Label>
              <Input
                id="payment-amount"
                type="number"
                value={paymentData.amount}
                onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
                placeholder="Enter payment amount"
                className="modern-input"
              />
            </div>
            <div>
              <Label htmlFor="payment-date" className="text-sm font-medium text-gray-700">Payment Date</Label>
              <Input
                id="payment-date"
                type="date"
                value={paymentData.payment_date}
                onChange={(e) => setPaymentData({...paymentData, payment_date: e.target.value})}
                className="modern-input"
              />
            </div>
            <div>
              <Label htmlFor="payment-mode" className="text-sm font-medium text-gray-700">Payment Mode</Label>
              <Select value={paymentData.payment_mode} onValueChange={(value) => setPaymentData({...paymentData, payment_mode: value})}>
                <SelectTrigger className="modern-select">
                  <SelectValue placeholder="Select payment mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="payment-notes" className="text-sm font-medium text-gray-700">Notes (Optional)</Label>
              <Input
                id="payment-notes"
                value={paymentData.notes}
                onChange={(e) => setPaymentData({...paymentData, notes: e.target.value})}
                placeholder="Enter any notes"
                className="modern-input"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => {
                  setPaymentModalOpen(false);
                  setSelectedDoctor(null);
                  setPaymentData({ amount: '', payment_date: new Date().toISOString().split('T')[0], payment_mode: 'bank_transfer', notes: '' });
                }}
                variant="outline"
                className="flex-1 modern-btn modern-btn-outline"
              >
                Cancel
              </Button>
              <Button
                onClick={handlePayment}
                className="flex-1 modern-btn bg-green-600 hover:bg-green-700 text-white"
              >
                Process Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Doctor Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="modern-dialog">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900">Doctor Details</DialogTitle>
          </DialogHeader>
          {selectedDoctor && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {selectedDoctor.photo ? (
                  <img
                    src={selectedDoctor.photo}
                    alt={selectedDoctor.name}
                    className="h-16 w-16 rounded-full object-cover border border-gray-200"
                  />
                ) : (
                  <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedDoctor.name}</h3>
                  <p className="text-gray-600">{selectedDoctor.specialization || 'General'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Doctor ID</div>
                  <div className="font-medium">{selectedDoctor.id}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Join Date</div>
                  <div className="font-medium">{selectedDoctor.join_date || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Monthly Salary</div>
                  <div className="font-medium text-green-600">₹{parseFloat(selectedDoctor.salary || '0').toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Total Paid</div>
                  <div className="font-medium text-blue-600">₹{parseFloat(selectedDoctor.total_paid || '0').toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Balance</div>
                  <div className={`font-medium ${(parseFloat(selectedDoctor.salary || '0') - parseFloat(selectedDoctor.total_paid || '0')) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ₹{(parseFloat(selectedDoctor.salary || '0') - parseFloat(selectedDoctor.total_paid || '0')).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Payment Mode</div>
                  <div className="font-medium">{selectedDoctor.payment_mode || 'N/A'}</div>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setViewModalOpen(false)}
                  variant="outline"
                  className="flex-1 modern-btn modern-btn-outline"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setViewModalOpen(false);
                    setFormData({
                      name: selectedDoctor.name,
                      salary: selectedDoctor.salary,
                      specialization: selectedDoctor.specialization || '',
                      payment_mode: selectedDoctor.payment_mode || 'bank_transfer'
                    });
                    setEditModalOpen(true);
                  }}
                  className="flex-1 modern-btn bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Edit Doctor
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="modern-dialog">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900">Confirm Delete</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to delete <strong>{selectedDoctor?.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setSelectedDoctor(null);
                }}
                variant="outline"
                className="flex-1 modern-btn modern-btn-outline"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteDoctor}
                className="flex-1 modern-btn bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorSalary;
