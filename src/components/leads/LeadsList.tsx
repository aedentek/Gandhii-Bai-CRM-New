import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
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
import { MonthYearPickerDialog } from '@/components/shared';
import { toast } from '@/hooks/use-toast';
import { Search, Eye, Edit2, Trash2, Users, Plus, Filter, Download, FileText, Upload, RefreshCw, UserCheck, Activity, TrendingUp, Clock, Phone, Calendar, User, UserPlus, FolderOpen, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import '../../styles/modern-forms.css';
import '../../styles/modern-tables.css';
import '../../styles/modern-settings.css';
import '../../styles/global-crm-design.css';

interface Lead {
  id: string;
  date: string;
  name: string;
  contactNumber: string;
  reminderDate: string;
  category: string;
  status: 'Closed' | 'Reminder' | 'Not Interested';
  description?: string;
}

interface LeadCategory {
  id: string;
  name: string;
}

const LeadsList: React.FC = () => {
  usePageTitle();
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [categories, setCategories] = useState<LeadCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showMonthYearDialog, setShowMonthYearDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Month/Year filter states
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // 1-based
  const currentYear = currentDate.getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [filterMonth, setFilterMonth] = useState<number | null>(currentMonth);
  const [filterYear, setFilterYear] = useState<number | null>(currentYear);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Form data state
  const [formData, setFormData] = useState({
    name: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    category: '',
    contactNumber: '',
    reminderDate: '',
    status: 'Reminder' as 'Closed' | 'Reminder' | 'Not Interested',
    description: ''
  });

  useEffect(() => {
    loadLeads();
    fetchCategories();
  }, []);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const data = await DatabaseService.getAllLeads();
      setLeads(data || []);
    } catch (error) {
      console.error('Error loading leads:', error);
      toast({
        title: "Error",
        description: "Failed to load leads",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await DatabaseService.getAllLeadCategories();
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  // Filter leads based on search term, status, and date
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = !searchTerm || 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.contactNumber.includes(searchTerm) ||
      lead.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
    
    let matchesDate = true;
    if (filterMonth !== null && filterYear !== null) {
      const leadDate = new Date(lead.date);
      matchesDate = leadDate.getMonth() === (filterMonth - 1) && leadDate.getFullYear() === filterYear; // Convert 1-based to 0-based
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  }).sort((a, b) => {
    // Sort by ID in ascending order
    return parseInt(a.id) - parseInt(b.id);
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredLeads.length / rowsPerPage);

  const handleSubmit = async () => {
    if (!formData.name || !formData.contactNumber || !formData.category) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      if (editingLead) {
        await DatabaseService.updateLead(editingLead.id, formData);
        toast({
          title: "Success",
          description: "Lead updated successfully"
        });
      } else {
        await DatabaseService.addLead(formData);
        toast({
          title: "Success",
          description: "Lead added successfully"
        });
      }
      
      setShowAddDialog(false);
      setEditingLead(null);
      resetForm();
      await loadLeads();
    } catch (error) {
      console.error('Error saving lead:', error);
      toast({
        title: "Error",
        description: "Failed to save lead",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      name: lead.name,
      date: lead.date,
      category: lead.category,
      contactNumber: lead.contactNumber,
      reminderDate: lead.reminderDate,
      status: lead.status,
      description: lead.description || ''
    });
    setShowAddDialog(true);
  };

  const handleDelete = async (lead: Lead) => {
    setLeadToDelete(lead);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!leadToDelete) return;
    
    try {
      setSubmitting(true);
      await DatabaseService.deleteLead(leadToDelete.id);
      toast({
        title: "Success",
        description: "Lead deleted successfully"
      });
      await loadLeads();
      setShowDeleteDialog(false);
      setLeadToDelete(null);
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast({
        title: "Error",
        description: "Failed to delete lead",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      category: '',
      contactNumber: '',
      reminderDate: '',
      status: 'Reminder',
      description: ''
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch {
      return dateString;
    }
  };

  const exportToCSV = () => {
    const headers = ['S No', 'Date', 'Name', 'Contact', 'Reminder Date', 'Category', 'Status', 'Description'];
    const csvData = filteredLeads.map((lead, index) => [
      index + 1,
      formatDate(lead.date),
      lead.name,
      lead.contactNumber,
      formatDate(lead.reminderDate),
      lead.category,
      lead.status,
      lead.description || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Create filename with filter info
    let filename = 'leads-list';
    if (filterMonth !== null && filterYear !== null) {
      filename += `_${months[filterMonth - 1]}_${filterYear}`; // Convert 1-based to 0-based
    }
    if (statusFilter !== 'All') {
      filename += `_${statusFilter.toLowerCase()}`;
    }
    filename += '.csv';
    
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="crm-page-bg">
        <div className="max-w-7xl mx-auto p-6">
          <Card className="crm-loading-card">
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading leads...</p>
            </CardContent>
          </Card>
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
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Leads Management</h1>
              </div>
            </div>

            <div className="flex flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              <ActionButtons.Refresh 
                onClick={() => {
                  console.log('🔄 Manual refresh triggered - refreshing entire page');
                  window.location.reload();
                }}
              />
              
              <ActionButtons.MonthYear 
                onClick={() => setShowMonthYearDialog(true)}
                text={filterMonth !== null && filterYear !== null 
                  ? `${months[filterMonth - 1].slice(0, 3)} ${String(filterYear).slice(-2)}` // Convert 1-based to 0-based
                  : `${months[selectedMonth - 1].slice(0, 3)} ${String(selectedYear).slice(-2)}` // Convert 1-based to 0-based
                }
              />

              {/* Clear Filter Button */}
              {(filterMonth !== currentMonth || filterYear !== currentYear) && (
                <Button 
                  type="button"
                  onClick={() => {
                    setFilterMonth(currentMonth);
                    setFilterYear(currentYear);
                    setSelectedMonth(currentMonth);
                    setSelectedYear(currentYear);
                  }}
                  variant="outline"
                  className="modern-btn modern-btn-secondary flex-1 sm:flex-none text-xs sm:text-sm px-3 sm:px-4 py-2"
                >
                  <span className="hidden sm:inline">Reset</span>
                  <span className="sm:hidden">↻</span>
                </Button>
              )}

              <Button 
                type="button"
                onClick={exportToCSV}
                className="global-btn flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">CSV</span>
              </Button>

              <Button 
                type="button"
                onClick={() => setShowAddDialog(true)}
                className="global-btn flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Add Lead</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="crm-stats-grid">
          {/* Total Leads Card */}
          <Card className="crm-stat-card crm-stat-card-blue">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-blue-700 mb-1 truncate">Total Leads</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-900 mb-1">{filteredLeads.length}</p>
                  <div className="flex items-center text-xs text-blue-600">
                    <TrendingUp className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">All leads</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-blue">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Closed Leads Card */}
          <Card className="crm-stat-card crm-stat-card-green">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-green-700 mb-1 truncate">Closed Leads</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-900 mb-1">
                    {filteredLeads.filter(l => l.status === 'Closed').length}
                  </p>
                  <div className="flex items-center text-xs text-green-600">
                    <UserCheck className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Successful</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-green">
                  <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Reminder Leads Card */}
          <Card className="crm-stat-card crm-stat-card-orange">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-orange-700 mb-1 truncate">Reminder Leads</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-900 mb-1">
                    {filteredLeads.filter(l => l.status === 'Reminder').length}
                  </p>
                  <div className="flex items-center text-xs text-orange-600">
                    <Activity className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Pending</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-orange">
                  <Activity className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Not Interested Leads Card */}
          <Card className="crm-stat-card crm-stat-card-red">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-red-700 mb-1 truncate">Not Interested</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-900 mb-1">
                    {filteredLeads.filter(l => l.status === 'Not Interested').length}
                  </p>
                  <div className="flex items-center text-xs text-red-600">
                    <TrendingUp className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Declined</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-red">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Controls */}
        <Card className="crm-controls-card">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search leads by name, phone, or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 h-10 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="w-full sm:w-auto sm:min-w-[200px]">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-10 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Status</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                    <SelectItem value="Reminder">Reminder</SelectItem>
                    <SelectItem value="Not Interested">Not Interested</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leads Table */}
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
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Date</span>
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center">
                    <span>Name</span>
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                    <Phone className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Contact</span>
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center">
                    <span>Category</span>
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Reminder Date</span>
                    <span className="sm:hidden">Reminder</span>
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                    <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Status</span>
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads
                .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
                .map((lead, idx) => (
                  <TableRow key={lead.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{(currentPage - 1) * rowsPerPage + idx + 1}</TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{formatDate(lead.date)}</TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 font-medium text-center text-xs sm:text-sm whitespace-nowrap">{lead.name}</TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{lead.contactNumber}</TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{lead.category}</TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{formatDate(lead.reminderDate)}</TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">
                      <Badge 
                        variant={lead.status === 'Closed' ? 'default' : lead.status === 'Reminder' ? 'secondary' : 'destructive'}
                        className={`
                          ${lead.status === 'Closed' ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''}
                          ${lead.status === 'Reminder' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' : ''}
                          ${lead.status === 'Not Interested' ? 'bg-red-100 text-red-800 hover:bg-red-200' : ''}
                        `}
                      >
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2 sm:gap-3">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleEdit(lead)}
                          className="action-btn-lead action-btn-edit h-8 w-8 sm:h-9 sm:w-9 p-0"
                          title="Edit Lead"
                        >
                          <Edit2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleDelete(lead)}
                          className="action-btn-lead action-btn-delete h-8 w-8 sm:h-9 sm:w-9 p-0"
                          title="Delete Lead"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              {filteredLeads.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No leads found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination - Only show if more than one page */}
        {totalPages > 1 && (
          <div className="crm-pagination-container">
            <div className="crm-pagination-info">
              Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, filteredLeads.length)} of {filteredLeads.length} leads
            </div>
            
            <div className="crm-pagination-controls">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="crm-pagination-btn"
              >
                Previous
              </Button>
              
              <div className="crm-pagination-pages">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let page;
                  if (totalPages <= 5) {
                    page = i + 1;
                  } else if (currentPage <= 3) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i;
                  } else {
                    page = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="crm-pagination-page"
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="crm-pagination-btn"
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Month/Year Filter Dialog */}
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
          description="Filter leads by specific month and year"
          previewText="leads"
        />

        {/* Add/Edit Lead Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="crm-modal-container">
            <DialogHeader className="editpopup form dialog-header">
              <div className="editpopup form icon-title-container">
                <div className="editpopup form dialog-icon">
                  <UserPlus className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
                <div className="editpopup form title-description">
                  <DialogTitle className="editpopup form dialog-title">
                    {editingLead ? 'Edit Lead' : 'Add New Lead'}
                  </DialogTitle>
                  <DialogDescription className="editpopup form dialog-description">
                    {editingLead ? 'Update lead information' : 'Enter new lead details'}
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
                    <User className="h-4 w-4" />
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter lead name"
                    className="editpopup form crm-edit-form-input"
                    required
                  />
                </div>
                
                <div className="editpopup form crm-edit-form-group">
                  <Label htmlFor="date" className="editpopup form crm-edit-form-label flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="editpopup form crm-edit-form-input"
                  />
                </div>
              </div>
              
              <div className="editpopup form crm-edit-form-grid grid-cols-1 md:grid-cols-2">
                <div className="editpopup form crm-edit-form-group">
                  <Label htmlFor="category" className="editpopup form crm-edit-form-label flex items-center gap-2">
                    <FolderOpen className="h-4 w-4" />
                    Category <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger className="editpopup form crm-edit-form-select">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="editpopup form crm-edit-form-group">
                  <Label htmlFor="contactNumber" className="editpopup form crm-edit-form-label flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Contact Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="contactNumber"
                    value={formData.contactNumber}
                    onChange={e => setFormData({ ...formData, contactNumber: e.target.value })}
                    placeholder="Enter contact number"
                    className="editpopup form crm-edit-form-input"
                    required
                  />
                </div>
              </div>
              
              <div className="editpopup form crm-edit-form-grid grid-cols-1 md:grid-cols-2">
                <div className="editpopup form crm-edit-form-group">
                  <Label htmlFor="reminderDate" className="editpopup form crm-edit-form-label flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Reminder Date
                  </Label>
                  <Input
                    id="reminderDate"
                    type="date"
                    value={formData.reminderDate}
                    onChange={e => setFormData({ ...formData, reminderDate: e.target.value })}
                    className="editpopup form crm-edit-form-input"
                  />
                </div>
                
                <div className="editpopup form crm-edit-form-group">
                  <Label htmlFor="status" className="editpopup form crm-edit-form-label flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Status
                  </Label>
                  <Select value={formData.status} onValueChange={(value: 'Closed' | 'Reminder' | 'Not Interested') => setFormData({ ...formData, status: value })}>
                    <SelectTrigger className="editpopup form crm-edit-form-select">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Closed">Closed</SelectItem>
                      <SelectItem value="Reminder">Reminder</SelectItem>
                      <SelectItem value="Not Interested">Not Interested</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="editpopup form crm-edit-form-group">
                <Label htmlFor="description" className="editpopup form crm-edit-form-label flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter description (optional)"
                  className="editpopup form crm-edit-form-input"
                  rows={3}
                />
              </div>
              
              <DialogFooter className="editpopup form dialog-footer flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowAddDialog(false);
                    setEditingLead(null);
                    resetForm();
                  }}
                  disabled={submitting}
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
                      Saving...
                    </>
                  ) : editingLead ? (
                    <>
                      <Edit2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      Update Lead
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      Add Lead
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
                    Delete Lead
                  </DialogTitle>
                  <DialogDescription className="editpopup form dialog-description">
                    Are you sure you want to delete this lead? This action cannot be undone.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            {leadToDelete && (
              <div className="mx-4 my-4 p-4 bg-gray-50 rounded-lg border">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-900">{leadToDelete.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">{leadToDelete.contactNumber}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">{leadToDelete.category}</span>
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
                  setLeadToDelete(null);
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
                    Delete Lead
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

export default LeadsList;
