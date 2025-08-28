import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import MonthYearPickerDialog from '@/components/shared/MonthYearPickerDialog';
import '../../styles/modern-forms.css';
import '../../styles/modern-tables.css';
import '../../styles/modern-settings.css';

// Simple error boundary for dialog content
function DialogErrorBoundary({ children }: { children: React.ReactNode }) {
  const [error, setError] = useState<Error | null>(null);
  if (error) {
    return <div className="p-4 text-red-600">Error: {error.message}</div>;
  }
  return (
    <React.Suspense fallback={<div className="p-4">Loading...</div>}>
      <ErrorCatcher onError={setError}>{children}</ErrorCatcher>
    </React.Suspense>
  );
}

class ErrorCatcher extends React.Component<{ onError: (e: Error) => void, children: React.ReactNode }> {
  componentDidCatch(error: Error) { this.props.onError(error); }
  render() { return this.props.children; }
}

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ActionButtons } from '@/components/ui/HeaderActionButtons';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit2, Trash2, Truck, RefreshCw, Activity, TrendingUp, AlertCircle, Calendar, Download, Phone, Mail, MapPin, Building, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DatabaseService } from '@/services/databaseService';
import usePageTitle from '@/hooks/usePageTitle';
import '@/styles/global-crm-design.css';

type Supplier = {
  id: number;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
};

const SupplierManagement: React.FC = () => {
  // Set page title
  usePageTitle();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  React.useEffect(() => {
    (async () => {
      if (refreshKey > 0) console.log('Refreshing data...');
      try {
        const data = await DatabaseService.getAllMedicineSuppliers();
        setSuppliers(data);
      } catch (e) {
        // Optionally show error
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshKey]);

  // Auto-refresh data periodically
  React.useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = React.useCallback(() => {
    setLoading(true);
    setRefreshKey(prev => prev + 1);
  }, []);

  const [isAddingSupplier, setIsAddingSupplier] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    status: 'active',
  });

  // Month and year state for filtering
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-based
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [showMonthYearDialog, setShowMonthYearDialog] = useState(false);
  const [filterMonth, setFilterMonth] = useState<number | null>(new Date().getMonth() + 1); // 1-based
  const [filterYear, setFilterYear] = useState<number | null>(currentYear);

  const { toast } = useToast();

  // Enhanced global refresh function
  const handleGlobalRefresh = React.useCallback(async () => {
    try {
      setLoading(true);
      
      const currentFilterMonth = filterMonth;
      const currentFilterYear = filterYear;
      const currentSearchTerm = searchTerm;
      const currentStatusFilter = statusFilter;
      
      const freshSuppliers = await DatabaseService.getAllMedicineSuppliers();
      
      setSuppliers(freshSuppliers);
      
      setFilterMonth(currentFilterMonth);
      setFilterYear(currentFilterYear);
      setSearchTerm(currentSearchTerm);
      setStatusFilter(currentStatusFilter);
      
      toast({
        title: "Success",
        description: "Data refreshed successfully"
      });
      
    } catch (error) {
      console.error('Refresh error:', error);
      toast({
        title: "Error",
        description: "Failed to refresh data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [filterMonth, filterYear, searchTerm, statusFilter, toast]);

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contact_person: supplier.contact_person,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      status: supplier.status,
    });
    setIsAddingSupplier(true);
  };

  const handleDeleteSupplier = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setShowDeleteDialog(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.contact_person || !formData.email || !formData.phone) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setSubmitting(true);
      
      if (editingSupplier) {
        const updatedSupplier = await DatabaseService.updateMedicineSupplier(editingSupplier.id, formData);
        setSuppliers(suppliers.map(sup => (sup.id === editingSupplier.id ? updatedSupplier : sup)));
        toast({ title: "Success", description: "Supplier updated successfully" });
      } else {
        const newSupplier = await DatabaseService.addMedicineSupplier(formData);
        setSuppliers([...suppliers, newSupplier]);
        toast({ title: "Success", description: "Supplier added successfully" });
      }
      
      handleRefresh();
      
      setFormData({ name: '', contact_person: '', email: '', phone: '', address: '', status: 'active' });
      setIsAddingSupplier(false);
      setEditingSupplier(null);
    } catch (e) {
      toast({ title: "Error", description: `Failed to ${editingSupplier ? 'update' : 'add'} supplier`, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!supplierToDelete) return;
    
    try {
      setSubmitting(true);
      await DatabaseService.deleteMedicineSupplier(supplierToDelete.id);
      
      setSuppliers(suppliers.filter(supplier => supplier.id !== supplierToDelete.id));
      
      setShowDeleteDialog(false);
      setSupplierToDelete(null);
      toast({ 
        title: "Success", 
        description: "Supplier deleted successfully" 
      });
    } catch (e) {
      toast({ 
        title: "Error", 
        description: "Failed to delete supplier", 
        variant: "destructive" 
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Export CSV function
  const handleExportCSV = () => {
    try {
      const headers = ['S No', 'Date', 'Company Name', 'Contact Person', 'Email', 'Phone', 'Address', 'Status'];
      
      const csvData = filteredSuppliers.map((supplier, index) => {
        const dateStr = supplier.created_at;
        let formattedDate = '';
        
        if (dateStr) {
          const dateObj = new Date(dateStr);
          if (!isNaN(dateObj.getTime())) {
            const day = String(dateObj.getDate()).padStart(2, '0');
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const year = dateObj.getFullYear();
            formattedDate = `${day}/${month}/${year}`;
          } else {
            formattedDate = dateStr;
          }
        }
        
        return [
          index + 1,
          formattedDate,
          `"${supplier.name}"`,
          `"${supplier.contact_person}"`,
          supplier.email,
          supplier.phone,
          `"${supplier.address || ''}"`,
          supplier.status.charAt(0).toUpperCase() + supplier.status.slice(1),
        ];
      });
      
      const csvContent = [headers, ...csvData]
        .map(row => row.join(','))
        .join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        let filename = `medicine-suppliers-${dateStr}`;
        
        if (filterMonth !== null && filterYear !== null) {
          filename += `-${months[filterMonth - 1]}-${filterYear}`; // Convert 1-based to 0-based
        }
        
        if (statusFilter !== 'all') {
          filename += `-${statusFilter}`;
        }
        
        if (searchTerm) {
          filename += `-filtered`;
        }
        
        link.setAttribute('download', `${filename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "Success",
          description: `CSV exported successfully! ${filteredSuppliers.length} suppliers exported.`
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Error",
        description: "Failed to export CSV file",
        variant: "destructive"
      });
    }
  };

  // Filter suppliers
  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch =
      supplier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.phone?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter !== 'all') {
      matchesStatus = supplier.status === statusFilter;
    }
    
    if (filterMonth !== null && filterYear !== null) {
      const dateStr = supplier.created_at;
      if (!dateStr) return false;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return false;
      return (
        matchesSearch &&
        matchesStatus &&
        d.getMonth() === (filterMonth - 1) && // Convert 1-based to 0-based
        d.getFullYear() === filterYear
      );
    }
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    const idA = a.id || 0;
    const idB = b.id || 0;
    return idA - idB;
  });

  // Pagination logic
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.ceil(filteredSuppliers.length / pageSize);
  const paginatedSuppliers = filteredSuppliers.slice((page - 1) * pageSize, page * pageSize);

  const handlePrevPage = () => setPage((p) => Math.max(1, p - 1));
  const handleNextPage = () => setPage((p) => Math.min(totalPages, p + 1));
  React.useEffect(() => { setPage(1); }, [searchTerm, suppliers.length]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 px-2 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-2xl p-4 sm:p-6 shadow-lg">
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-3 text-lg">Loading...</span>
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
                <Truck className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Medicine Suppliers</h1>
              </div>
            </div>
          
            <div className="flex flex-row sm:flex-row gap-1 sm:gap-3 w-full sm:w-auto">
              <ActionButtons.Refresh onClick={() => {
                console.log('🔄 Manual refresh triggered - refreshing entire page');
                window.location.reload();
              }} />
              
              <ActionButtons.MonthYear
                onClick={() => setShowMonthYearDialog(true)}
                text={
                  filterMonth !== null && filterYear !== null 
                    ? `${months[filterMonth - 1]} ${filterYear}` // Convert 1-based to 0-based
                    : `${months[selectedMonth - 1]} ${selectedYear}` // Convert 1-based to 0-based
                }
              />
              
              <Button 
                onClick={handleExportCSV}
                className="global-btn global-btn-primary flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">CSV</span>
              </Button>
              
              <Button 
                onClick={() => {
                  setFormData({
                    name: '',
                    contact_person: '',
                    email: '',
                    phone: '',
                    address: '',
                    status: 'active',
                  });
                  setIsAddingSupplier(true);
                }}
                className="global-btn global-btn-primary flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Add Supplier</span>
                <span className="sm:hidden">+</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="crm-stats-grid">
          <Card className="crm-stat-card crm-stat-card-blue">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-blue-700 mb-1 truncate">Total Suppliers</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-900 mb-1">{filteredSuppliers.length}</p>
                  <div className="flex items-center text-xs text-blue-600">
                    <Building className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Companies</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-blue">
                  <Building className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="crm-stat-card crm-stat-card-green">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-green-700 mb-1 truncate">Active</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-900 mb-1">
                    {filteredSuppliers.filter(s => s.status === 'active').length}
                  </p>
                  <div className="flex items-center text-xs text-green-600">
                    <Activity className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Available</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-green">
                  <Activity className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="crm-stat-card crm-stat-card-orange">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-orange-700 mb-1 truncate">With Email</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-900 mb-1">
                    {filteredSuppliers.filter(s => s.email && s.email.includes('@')).length}
                  </p>
                  <div className="flex items-center text-xs text-orange-600">
                    <Mail className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Connected</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-orange">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="crm-stat-card crm-stat-card-red">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-red-700 mb-1 truncate">Inactive</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-900 mb-1">
                    {filteredSuppliers.filter(s => s.status === 'inactive').length}
                  </p>
                  <div className="flex items-center text-xs text-red-600">
                    <AlertCircle className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Suspended</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-red">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Section */}
        <div className="crm-controls-container">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search suppliers by name, contact person, email, or phone..."
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
                </SelectContent>
              </Select>
            </div>
            {searchTerm && (
              <Button
                onClick={() => setSearchTerm('')}
                variant="outline"
                size="sm"
                className="px-3"
              >
                Clear
              </Button>
            )}
          </div>
        </div>

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
          description="Filter suppliers by specific month and year"
          previewText="suppliers"
        />

        {/* Suppliers Table */}
        <Card className="crm-table-card">
          <CardContent className="p-0">
            <div className="crm-table-header">
              <div className="flex items-center text-base sm:text-lg font-semibold text-gray-900">
                <Truck className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                <span className="crm-table-title-text">Suppliers List ({filteredSuppliers.length})</span>
                <span className="crm-table-title-text-mobile">Suppliers ({filteredSuppliers.length})</span>
              </div>
            </div>
        
            <div className="crm-table-container">
              <Table className="crm-table">
                <TableHeader>
                  <TableRow className="crm-table-header-row">
                    <TableHead className="crm-table-head">S No</TableHead>
                    <TableHead className="crm-table-head">
                      <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>Date</span>
                      </div>
                    </TableHead>
                    <TableHead className="crm-table-head">Company Name</TableHead>
                    <TableHead className="crm-table-head">Contact Person</TableHead>
                    <TableHead className="crm-table-head">Contact Info</TableHead>
                    <TableHead className="crm-table-head">Address</TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                    <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Status</span>
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedSuppliers.map((supplier, idx) => (
                <TableRow key={supplier.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{(page - 1) * pageSize + idx + 1}</TableCell>
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{
                    (() => {
                      const dateStr = supplier.created_at;
                      if (!dateStr) return '';
                      const dateObj = new Date(dateStr);
                      if (isNaN(dateObj.getTime())) return dateStr;
                      const day = String(dateObj.getDate()).padStart(2, '0');
                      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                      const year = dateObj.getFullYear();
                      return `${day}/${month}/${year}`;
                    })()
                  }</TableCell>
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 font-medium text-center text-xs sm:text-sm whitespace-nowrap">{supplier.name}</TableCell>
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{supplier.contact_person}</TableCell>
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm max-w-[200px]">
                    <div className="space-y-1">
                      <div className="flex items-center justify-center gap-1 text-xs">
                        <Mail className="h-3 w-3 text-gray-400" />
                        <span className="truncate">{supplier.email}</span>
                      </div>
                      <div className="flex items-center justify-center gap-1 text-xs">
                        <Phone className="h-3 w-3 text-gray-400" />
                        <span>{supplier.phone}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm max-w-[200px]">
                    <div className="flex items-center justify-center gap-1 text-xs">
                      <MapPin className="h-3 w-3 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{supplier.address || '-'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">
                    <Badge 
                      variant={supplier.status === 'active' ? 'default' : 'secondary'}
                      className={`
                        ${supplier.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}
                      `}
                    >
                      {supplier.status.charAt(0).toUpperCase() + supplier.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">
                    <div className="flex items-center justify-center gap-2 sm:gap-3">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleEditSupplier(supplier)}
                        className="action-btn-lead action-btn-edit h-8 w-8 sm:h-9 sm:w-9 p-0"
                        title="Edit Supplier"
                      >
                        <Edit2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDeleteSupplier(supplier)}
                        className="action-btn-lead action-btn-delete h-8 w-8 sm:h-9 sm:w-9 p-0"
                        title="Delete Supplier"
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedSuppliers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No suppliers found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
            </div>
          </CardContent>
        </Card>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="crm-pagination-container">
            <div className="crm-pagination-info">
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, filteredSuppliers.length)} of {filteredSuppliers.length} suppliers
            </div>
            
            <div className="crm-pagination-controls">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={page === 1}
                className="crm-pagination-btn"
              >
                Previous
              </Button>
              
              <div className="crm-pagination-pages">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPage(pageNum)}
                      className="crm-pagination-page-btn"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={page === totalPages}
                className="crm-pagination-btn"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

        {/* Add/Edit Supplier Dialog */}
        <Dialog open={isAddingSupplier} onOpenChange={setIsAddingSupplier}>
          <DialogContent className="editpopup form crm-modal-container sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader className="editpopup form crm-modal-header">
              <div className="editpopup form crm-modal-header-content">
                <div className="editpopup form crm-modal-icon">
                  {editingSupplier ? <Edit2 className="h-5 w-5 text-blue-600" /> : <Plus className="h-5 w-5 text-blue-600" />}
                </div>
                <div className="editpopup form crm-modal-title-section">
                  <DialogTitle className="editpopup form crm-modal-title">
                    {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
                  </DialogTitle>
                  <DialogDescription className="editpopup form crm-modal-description">
                    {editingSupplier ? 'Update supplier information' : 'Enter the details for the new supplier'}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSubmit();
              }}
              className="editpopup form crm-edit-form-content"
            >
              <div className="editpopup form crm-edit-form-grid grid-cols-1 md:grid-cols-2">
                <div className="editpopup form crm-edit-form-group">
                  <Label htmlFor="name" className="editpopup form crm-edit-form-label flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Company Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter company name"
                    required
                    className="editpopup form crm-edit-form-input"
                  />
                </div>
                <div className="editpopup form crm-edit-form-group">
                  <Label htmlFor="contact_person" className="editpopup form crm-edit-form-label flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Contact Person <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="contact_person"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                    placeholder="Enter contact person name"
                    required
                    className="editpopup form crm-edit-form-input"
                  />
                </div>
                <div className="editpopup form crm-edit-form-group">
                  <Label htmlFor="email" className="editpopup form crm-edit-form-label flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="Enter email address"
                    required
                    className="editpopup form crm-edit-form-input"
                  />
                </div>
                <div className="editpopup form crm-edit-form-group">
                  <Label htmlFor="phone" className="editpopup form crm-edit-form-label flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="Enter phone number"
                    required
                    className="editpopup form crm-edit-form-input"
                  />
                </div>
                <div className="editpopup form crm-edit-form-group md:col-span-2">
                  <Label htmlFor="address" className="editpopup form crm-edit-form-label flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Address
                  </Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="Enter company address"
                    rows={3}
                    className="editpopup form crm-edit-form-textarea"
                  />
                </div>
                <div className="editpopup form crm-edit-form-group">
                  <Label htmlFor="status" className="editpopup form crm-edit-form-label flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Status
                  </Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                    <SelectTrigger className="editpopup form crm-edit-form-select">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DialogFooter className="editpopup form dialog-footer flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsAddingSupplier(false);
                    setEditingSupplier(null);
                    setFormData({
                      name: '',
                      contact_person: '',
                      email: '',
                      phone: '',
                      address: '',
                      status: 'active',
                    });
                  }}
                  className="editpopup form footer-button-cancel w-full sm:w-auto modern-btn modern-btn-secondary"
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitting}
                  className="editpopup form footer-button-save w-full sm:w-auto global-btn"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      {editingSupplier ? 'Updating...' : 'Adding...'}
                    </>
                  ) : (
                    <>
                      <Truck className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      {editingSupplier ? 'Update Supplier' : 'Add Supplier'}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

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
                    Delete Supplier
                  </DialogTitle>
                  <DialogDescription className="editpopup form dialog-description">
                    Are you sure you want to delete this supplier? This action cannot be undone.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            {supplierToDelete && (
              <div className="mx-4 my-4 p-4 bg-gray-50 rounded-lg border">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-900">{supplierToDelete.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">{supplierToDelete.contact_person}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">{supplierToDelete.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">{supplierToDelete.phone}</span>
                  </div>
                </div>
              </div>
            )}
            
            <DialogFooter className="editpopup form dialog-footer flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowDeleteDialog(false);
                  setSupplierToDelete(null);
                }}
                disabled={submitting}
                className="editpopup form footer-button-cancel w-full sm:w-auto modern-btn modern-btn-secondary"
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={confirmDelete}
                disabled={submitting}
                className="editpopup form footer-button-delete w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    Delete Supplier
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  );
};

export default SupplierManagement;
