import React, { useState } from 'react';
import '@/styles/global-crm-design.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ActionButtons } from '@/components/ui/HeaderActionButtons';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Edit, Trash2, Truck, Phone, Mail, MapPin, RefreshCcw, Calendar, Download, Edit2, Activity, TrendingUp, AlertCircle, Eye, X, Users, FileText, Building, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import MonthYearPickerDialog from '@/components/shared/MonthYearPickerDialog';
import LoadingScreen from '@/components/shared/LoadingScreen';
import usePageTitle from '@/hooks/usePageTitle';
interface GeneralSupplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

const GeneralSuppliers: React.FC = () => {
  // Set page title
  usePageTitle();

  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<GeneralSupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isAddingSupplier, setIsAddingSupplier] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<GeneralSupplier | null>(null);
  const [viewingSupplier, setViewingSupplier] = useState<GeneralSupplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<GeneralSupplier | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    status: 'active' as 'active' | 'inactive',
  });

  // Month and year state for filtering
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-based for UI
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [showMonthYearDialog, setShowMonthYearDialog] = useState(false);
  const [filterMonth, setFilterMonth] = useState<number | null>(new Date().getMonth() + 1); // Also 1-based
  const [filterYear, setFilterYear] = useState<number | null>(currentYear);

  // Global refresh function
  const handleGlobalRefresh = async () => {
    setLoading(true);
    try {
      const data = await (await import('@/services/databaseService')).DatabaseService.getAllGeneralSuppliers();
      setSuppliers(data.map((sup: any) => ({
        ...sup,
        id: sup.id.toString(),
        contactPerson: sup.contact_person || sup.contactPerson || '',
        createdAt: sup.created_at || sup.createdAt || '',
      })));
    } catch (e) {
      toast({ title: "Error", description: "Failed to refresh data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };
  React.useEffect(() => {
    (async () => {
      try {
        const data = await (await import('@/services/databaseService')).DatabaseService.getAllGeneralSuppliers();
        setSuppliers(data.map((sup: any) => ({
          ...sup,
          id: sup.id.toString(),
          contactPerson: sup.contact_person || sup.contactPerson || '',
          createdAt: sup.created_at || sup.createdAt || '',
        })));
      } catch (e) {
        // Optionally show error
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Export CSV function
  const handleExportCSV = () => {
    const headers = ['S No', 'Date', 'Company Name', 'Contact Person', 'Email', 'Phone', 'Address', 'Status'];
    const csvData = filteredSuppliers.map((supplier, idx) => {
      const dateStr = supplier.createdAt;
      let formattedDate = '';
      if (dateStr) {
        let dateObj;
        if (dateStr.includes('T')) {
          dateObj = new Date(dateStr);
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          dateObj = new Date(dateStr + 'T00:00:00');
        }
        if (dateObj && !isNaN(dateObj.getTime())) {
          const day = String(dateObj.getDate()).padStart(2, '0');
          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
          const year = dateObj.getFullYear();
          formattedDate = `${day}/${month}/${year}`;
        }
      }
      
      return [
        idx + 1,
        formattedDate,
        supplier.name,
        supplier.contactPerson,
        supplier.email,
        supplier.phone,
        supplier.address,
        supplier.status.charAt(0).toUpperCase() + supplier.status.slice(1)
      ];
    });
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      const monthName = filterMonth !== null && filterYear !== null 
        ? `${months[filterMonth]}_${filterYear}` 
        : `${months[selectedMonth]}_${selectedYear}`;
      link.setAttribute('download', `general_suppliers_${monthName}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.contactPerson || !formData.email || !formData.phone) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const db = (await import('@/services/databaseService')).DatabaseService;
      
      if (editingSupplier) {
        const updated = await db.updateGeneralSupplier(editingSupplier.id, {
          name: formData.name,
          contactPerson: formData.contactPerson,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          status: formData.status
        });
        setSuppliers(suppliers.map(sup => sup.id === editingSupplier.id ? {
          ...sup,
          ...updated,
          id: sup.id,
          contactPerson: updated.contact_person || updated.contactPerson || '',
          createdAt: updated.created_at || updated.createdAt || ''
        } : sup));
        toast({ title: "Success", description: "Supplier updated successfully" });
      } else {
        const newSup = await db.addGeneralSupplier({
          name: formData.name,
          contactPerson: formData.contactPerson,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          status: formData.status
        });
        setSuppliers([{
          ...newSup,
          id: newSup.id.toString(),
          contactPerson: newSup.contact_person || newSup.contactPerson || '',
          createdAt: newSup.created_at || newSup.createdAt || ''
        }, ...suppliers]);
        toast({ title: "Success", description: "Supplier added successfully" });
      }
      
      setFormData({ name: '', contactPerson: '', email: '', phone: '', address: '', status: 'active' });
      setIsAddingSupplier(false);
      setEditingSupplier(null);
      handleGlobalRefresh();
    } catch (e) {
      toast({ 
        title: "Error", 
        description: editingSupplier ? "Failed to update supplier" : "Failed to add supplier", 
        variant: "destructive" 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSupplier = (supplier: GeneralSupplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contactPerson: supplier.contactPerson,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      status: supplier.status,
    });
    setIsAddingSupplier(true);
  };

  const handleDeleteSupplier = (supplier: GeneralSupplier) => {
    setSupplierToDelete(supplier);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!supplierToDelete) return;
    
    setSubmitting(true);
    try {
      const db = (await import('@/services/databaseService')).DatabaseService;
      await db.deleteGeneralSupplier(supplierToDelete.id);
      setSuppliers(suppliers.filter(supplier => supplier.id !== supplierToDelete.id));
      toast({ title: "Success", description: "Supplier deleted successfully" });
      setShowDeleteDialog(false);
      setSupplierToDelete(null);
    } catch (e) {
      toast({ title: "Error", description: "Failed to delete supplier", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // Filter suppliers by search, status, and by selected month/year if filter is active
  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch =
      supplier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || supplier.status === statusFilter;
    
    if (filterMonth !== null && filterYear !== null) {
      const dateStr = supplier.createdAt;
      if (!dateStr) return false;
      let d;
      if (dateStr.includes('T')) {
        d = new Date(dateStr);
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        d = new Date(dateStr + 'T00:00:00');
      } else {
        return false;
      }
      if (isNaN(d.getTime())) return false;
      return (
        matchesSearch &&
        matchesStatus &&
        d.getMonth() === (filterMonth - 1) &&
        d.getFullYear() === filterYear
      );
    }
    return matchesSearch && matchesStatus;
  }).sort((a, b) => parseInt(a.id) - parseInt(b.id)); // Ascending order by ID

  // Pagination logic
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.ceil(filteredSuppliers.length / pageSize);
  const paginatedSuppliers = filteredSuppliers.slice((page - 1) * pageSize, page * pageSize);

  const handlePrevPage = () => setPage((p) => Math.max(1, p - 1));
  const handleNextPage = () => setPage((p) => Math.min(totalPages, p + 1));
  React.useEffect(() => { setPage(1); }, [searchTerm, statusFilter, suppliers.length]);

  if (loading) {
    return <LoadingScreen message="Loading general suppliers data..." />;
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
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">General Suppliers</h1>
              </div>
            </div>          
            <div className="flex flex-row sm:flex-row gap-1 sm:gap-3 w-full sm:w-auto">
              <ActionButtons.Refresh
                onClick={() => {
                  window.location.reload();
                }}
                loading={loading}
              />
              
              <Button 
                onClick={handleExportCSV}
                className="global-btn flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
                title="Export filtered suppliers to CSV"
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">CSV</span>
              </Button>
              
              <ActionButtons.MonthYear
                onClick={() => setShowMonthYearDialog(true)}
                text={filterMonth !== null && filterYear !== null 
                  ? `${months[filterMonth - 1]} ${filterYear}`
                  : `${months[selectedMonth - 1]} ${selectedYear}`
                }
              />
              
              <Button 
                onClick={() => {
                  setFormData({
                    name: '',
                    contactPerson: '',
                    email: '',
                    phone: '',
                    address: '',
                    status: 'active',
                  });
                  setEditingSupplier(null);
                  setIsAddingSupplier(true);
                }}
                className="global-btn flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
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
          {/* Total Suppliers Card */}
          <Card className="crm-stat-card crm-stat-card-blue">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-blue-700 mb-1 truncate">Total Suppliers</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-900 mb-1">{filteredSuppliers.length}</p>
                  <div className="flex items-center text-xs text-blue-600">
                    <TrendingUp className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Available</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-blue">
                  <Truck className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Active Suppliers Card */}
          <Card className="crm-stat-card crm-stat-card-green">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-green-700 mb-1 truncate">Active Suppliers</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-900 mb-1">
                    {filteredSuppliers.filter(s => s.status === 'active').length}
                  </p>
                  <div className="flex items-center text-xs text-green-600">
                    <Activity className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">In service</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-green">
                  <Activity className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Email Contacts Card */}
          <Card className="crm-stat-card crm-stat-card-orange">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-orange-700 mb-1 truncate">Email Contacts</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-900 mb-1">
                    {filteredSuppliers.filter(s => s.email && s.email.trim() !== '').length}
                  </p>
                  <div className="flex items-center text-xs text-orange-600">
                    <Mail className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">With email</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-orange">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Inactive Suppliers Card */}
          <Card className="crm-stat-card crm-stat-card-red">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-red-700 mb-1 truncate">Inactive Suppliers</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-900 mb-1">
                    {filteredSuppliers.filter(s => s.status === 'inactive').length}
                  </p>
                  <div className="flex items-center text-xs text-red-600">
                    <AlertCircle className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Disabled</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-red">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
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
                  placeholder="Search suppliers by name, contact person, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>
            </div>
            
            <div className="w-full sm:w-auto min-w-[200px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
        <Card className="crm-table-container">
          <CardHeader className="crm-table-header">
            <div className="crm-table-title">
              <Truck className="crm-table-title-icon" />
              <span className="crm-table-title-text">Suppliers List ({filteredSuppliers.length})</span>
              <span className="crm-table-title-text-mobile">Suppliers ({filteredSuppliers.length})</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
        
        {/* Scrollable Table View for All Screen Sizes */}
        <div className="overflow-x-auto">
          <Table className="w-full min-w-[1200px]">
            <TableHeader>
              <TableRow className="bg-gray-50 border-b">
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center">
                    <span>S No</span>
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Date</span>
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center">
                    <span>Company</span>
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center">
                    <span>Contact Person</span>
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center">
                    <span>Contact Info</span>
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center">
                    <span>Address</span>
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
              {paginatedSuppliers.map((supplier, idx) => (
                <TableRow key={supplier.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{(page - 1) * pageSize + idx + 1}</TableCell>
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{
                    (() => {
                      const dateStr = supplier.createdAt;
                      if (!dateStr) return '';
                      let dateObj;
                      if (dateStr.includes('T')) {
                        dateObj = new Date(dateStr);
                      } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                        dateObj = new Date(dateStr + 'T00:00:00');
                      } else {
                        return dateStr;
                      }
                      if (isNaN(dateObj.getTime())) return dateStr;
                      const day = String(dateObj.getDate()).padStart(2, '0');
                      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                      const year = dateObj.getFullYear();
                      return `${day}/${month}/${year}`;
                    })()
                  }</TableCell>
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 font-medium text-center text-xs sm:text-sm whitespace-nowrap">{supplier.name}</TableCell>
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{supplier.contactPerson}</TableCell>
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs justify-center">
                        <Mail className="w-3 h-3" />
                        <span className="truncate max-w-[120px]">{supplier.email}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs justify-center">
                        <Phone className="w-3 h-3" />
                        <span>{supplier.phone}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap max-w-[150px] truncate">
                    <div className="flex items-center gap-1 text-xs justify-center">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{supplier.address}</span>
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
                    <div className="flex items-center justify-center gap-1 sm:gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setViewingSupplier(supplier)}
                        className="action-btn-lead action-btn-view h-8 w-8 sm:h-9 sm:w-9 p-0"
                        title="View Supplier"
                      >
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
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
        
        {/* Pagination - Only show if more than one page */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-gray-50/50 border-t">
            <div className="text-sm text-gray-600">
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, filteredSuppliers.length)} of {filteredSuppliers.length} suppliers
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={page === 1}
                className="h-8 px-3"
              >
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
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
                      className="h-8 w-8 p-0"
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
                className="h-8 px-3"
              >
                Next
              </Button>
            </div>
          </div>
        )}
        </CardContent>
        </Card>

        {/* Add/Edit Supplier Dialog */}
        <Dialog open={isAddingSupplier} onOpenChange={setIsAddingSupplier}>
          <DialogContent className="crm-modal-container">
            <DialogHeader className="editpopup form dialog-header">
              <div className="editpopup form icon-title-container">
                <div className="editpopup form dialog-icon">
                  <Truck className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
                <div className="editpopup form title-description">
                  <DialogTitle className="editpopup form dialog-title">
                    {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
                  </DialogTitle>
                  <DialogDescription className="editpopup form dialog-description">
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
                    className="editpopup form crm-edit-form-input"
                    required
                  />
                </div>
                <div className="editpopup form crm-edit-form-group">
                  <Label htmlFor="contactPerson" className="editpopup form crm-edit-form-label flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Contact Person <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="contactPerson"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                    placeholder="Enter contact person name"
                    className="editpopup form crm-edit-form-input"
                    required
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
                    className="editpopup form crm-edit-form-input"
                    required
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
                    className="editpopup form crm-edit-form-input"
                    required
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
                    placeholder="Enter company address (optional)"
                    className="editpopup form crm-edit-form-textarea"
                    rows={3}
                  />
                </div>
                <div className="editpopup form crm-edit-form-group">
                  <Label htmlFor="status" className="editpopup form crm-edit-form-label flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Status
                  </Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value as 'active' | 'inactive'})}>
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
                      contactPerson: '',
                      email: '',
                      phone: '',
                      address: '',
                      status: 'active',
                    });
                  }}
                  className="editpopup form footer-button-cancel w-full sm:w-auto modern-btn modern-btn-secondary"
                  disabled={submitting}
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="editpopup form footer-button-save w-full sm:w-auto global-btn"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
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

        {/* View Supplier Dialog - Glass Morphism Design */}
        {viewingSupplier && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setViewingSupplier(null)}
          >
            <div 
              className="max-w-[95vw] max-h-[95vh] w-full sm:max-w-4xl bg-gradient-to-br from-white to-blue-50/30 border-0 shadow-2xl p-0 m-4 rounded-xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header - Glass Morphism Style */}
              <div className="relative pb-3 sm:pb-4 md:pb-6 border-b border-blue-100 px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-6 flex-shrink-0">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500"></div>
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mt-2 sm:mt-4">
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full border-2 sm:border-4 border-white shadow-lg overflow-hidden bg-gradient-to-r from-green-500 to-blue-600">
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm sm:text-base md:text-lg lg:text-xl">
                          {(viewingSupplier.name || 'S').charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-1 sm:gap-2 truncate">
                      <Activity className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-blue-600 flex-shrink-0" />
                      <span className="truncate">Supplier Details</span>
                    </h2>
                    <div className="text-xs sm:text-sm md:text-lg lg:text-xl mt-1 flex items-center gap-2">
                      <span className="text-gray-600">
                        Complete supplier information and details
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewingSupplier(null)}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              
              {/* Main content with scrolling enabled */}
              <div className="flex-1 overflow-y-auto min-h-0 p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6" style={{scrollbarWidth: 'thin', scrollbarColor: '#60a5fa #dbeafe'}}>
                {/* Supplier Information Cards */}
                <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-blue-100 shadow-sm">
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 flex items-center gap-2">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    Supplier Information
                  </h3>

                  {/* Supplier Details Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-white p-3 sm:p-4 rounded-lg border border-blue-200 hover:shadow-md transition-all duration-200">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <label className="text-xs sm:text-sm font-medium text-blue-700 block">Company Name</label>
                          <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">{viewingSupplier.name}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-50 to-white p-3 sm:p-4 rounded-lg border border-purple-200 hover:shadow-md transition-all duration-200">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <label className="text-xs sm:text-sm font-medium text-purple-700 block">Status</label>
                          <p className="text-sm sm:text-base font-semibold">
                            <Badge 
                              variant={viewingSupplier.status === 'active' ? 'default' : 'secondary'}
                              className={`
                                ${viewingSupplier.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                              `}
                            >
                              {viewingSupplier.status.charAt(0).toUpperCase() + viewingSupplier.status.slice(1)}
                            </Badge>
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-50 to-white p-3 sm:p-4 rounded-lg border border-green-200 hover:shadow-md transition-all duration-200">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <label className="text-xs sm:text-sm font-medium text-green-700 block">Created Date</label>
                          <p className="text-sm sm:text-base font-semibold text-gray-900">
                            {viewingSupplier.createdAt ? (() => {
                              const dateStr = viewingSupplier.createdAt;
                              let dateObj;
                              if (dateStr.includes('T')) {
                                dateObj = new Date(dateStr);
                              } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                                dateObj = new Date(dateStr + 'T00:00:00');
                              }
                              if (dateObj && !isNaN(dateObj.getTime())) {
                                const day = String(dateObj.getDate()).padStart(2, '0');
                                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                                const year = dateObj.getFullYear();
                                return `${day}/${month}/${year}`;
                              }
                              return dateStr;
                            })() : 'Unknown'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-green-100 shadow-sm">
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 flex items-center gap-2">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                    Contact Information
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                    <div className="bg-gradient-to-br from-orange-50 to-white p-3 sm:p-4 rounded-lg border border-orange-200">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                          <Users className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <label className="text-xs sm:text-sm font-medium text-orange-700 block">Contact Person</label>
                          <p className="text-sm sm:text-base font-semibold text-gray-900">
                            {viewingSupplier.contactPerson || 'Not specified'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-white p-3 sm:p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <label className="text-xs sm:text-sm font-medium text-blue-700 block">Phone Number</label>
                          <p className="text-sm sm:text-base font-semibold text-gray-900">
                            {viewingSupplier.phone || 'Not specified'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-white p-3 sm:p-4 rounded-lg border border-purple-200">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <label className="text-xs sm:text-sm font-medium text-purple-700 block">Email Address</label>
                          <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                            {viewingSupplier.email || 'Not specified'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-white p-3 sm:p-4 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <label className="text-xs sm:text-sm font-medium text-green-700 block">Address</label>
                          <p className="text-sm sm:text-base font-semibold text-gray-900 leading-relaxed">
                            {viewingSupplier.address || 'Not specified'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

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
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">{supplierToDelete.contactPerson}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600 capitalize">{supplierToDelete.status}</span>
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
                    <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
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
    </div>
  );
};

export default GeneralSuppliers;