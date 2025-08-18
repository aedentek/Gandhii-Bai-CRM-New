import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DatabaseService } from '@/services/databaseService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MonthYearPickerDialog } from '@/components/shared';
import { toast } from '@/hooks/use-toast';
import { Search, Eye, Edit2, Trash2, Users, Plus, Filter, Download, FileText, Upload, RefreshCw, UserCheck, Activity, TrendingUp, Clock, Phone, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import '../../styles/modern-forms.css';
import '../../styles/modern-tables.css';
import '../../styles/modern-settings.css';

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
  const currentMonth = currentDate.getMonth();
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
      matchesDate = leadDate.getMonth() === filterMonth && leadDate.getFullYear() === filterYear;
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
      filename += `_${months[filterMonth]}_${filterYear}`;
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 px-2 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header Section */}
        <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-2xl p-4 sm:p-6 shadow-lg">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 bg-blue-100 rounded-xl">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Leads Management</h1>
             
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:flex-shrink-0">
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setStatusFilter('all');
                    setSearchTerm('');
                    setFilterMonth(currentMonth);
                    setFilterYear(currentYear);
                    setSelectedMonth(currentMonth);
                    setSelectedYear(currentYear);
                    setCurrentPage(1);
                    loadLeads();
                  }}
                  disabled={loading}
                  className="global-btn flex-1 sm:flex-none text-xs sm:text-sm px-3 sm:px-4 py-2 lg:min-w-[100px]"
                >
                  <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                  <span className="sm:hidden">↻</span>
                </Button>
                
                {/* Month & Year Filter Button */}
                <Button 
                  type="button"
                  onClick={() => setShowMonthYearDialog(true)}
                  variant="outline"
                  className="modern-btn modern-btn-secondary flex-1 sm:flex-none text-xs sm:text-sm px-3 sm:px-4 py-2 lg:min-w-[120px]"
                >
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden lg:inline">
                    {filterMonth !== null && filterYear !== null 
                      ? `${months[filterMonth]} ${filterYear}`
                      : `${months[selectedMonth]} ${selectedYear}`
                    }
                  </span>
                  <span className="lg:hidden">
                    {filterMonth !== null && filterYear !== null 
                      ? `${months[filterMonth].slice(0, 3)} ${String(filterYear).slice(-2)}`
                      : `${months[selectedMonth].slice(0, 3)} ${String(selectedYear).slice(-2)}`
                    }
                  </span>
                </Button>

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
                    className="modern-btn modern-btn-secondary flex-1 sm:flex-none text-xs sm:text-sm px-3 sm:px-4 py-2 lg:min-w-[80px]"
                  >
                    <span className="hidden sm:inline">Reset</span>
                    <span className="sm:hidden">↻</span>
                  </Button>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button 
                  type="button"
                  onClick={exportToCSV}
                  className="global-btn flex-1 sm:flex-none text-xs sm:text-sm px-3 sm:px-4 py-2 lg:min-w-[120px]"
                >
                  <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Export CSV</span>
                  <span className="sm:hidden">CSV</span>
                </Button>

                <Button 
                  type="button"
                  onClick={() => setShowAddDialog(true)}
                  className="global-btn flex-1 sm:flex-none text-xs sm:text-sm px-3 sm:px-4 py-2 lg:min-w-[120px]"
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Add Lead</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6">
          <div className="modern-stat-card stat-card-blue">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-3 w-3 sm:h-5 sm:w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-lg sm:text-2xl font-bold text-gray-900">{filteredLeads.length}</div>
                <div className="text-xs text-gray-600">Total Leads</div>
              </div>
            </div>
          </div>
          
          <div className="modern-stat-card stat-card-green">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="h-3 w-3 sm:h-5 sm:w-5 text-green-600" />
              </div>
              <div>
                <div className="text-lg sm:text-2xl font-bold text-gray-900">
                  {filteredLeads.filter(l => l.status === 'Closed').length}
                </div>
                <div className="text-xs text-gray-600">Closed</div>
              </div>
            </div>
          </div>
          
          <div className="modern-stat-card stat-card-orange">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Activity className="h-3 w-3 sm:h-5 sm:w-5 text-orange-600" />
              </div>
              <div>
                <div className="text-lg sm:text-2xl font-bold text-gray-900">
                  {filteredLeads.filter(l => l.status === 'Reminder').length}
                </div>
                <div className="text-xs text-gray-600">Reminder</div>
              </div>
            </div>
          </div>
          
          <div className="modern-stat-card stat-card-red">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingUp className="h-3 w-3 sm:h-5 sm:w-5 text-red-600" />
              </div>
              <div>
                <div className="text-lg sm:text-2xl font-bold text-gray-900">
                  {filteredLeads.filter(l => l.status === 'Not Interested').length}
                </div>
                <div className="text-xs text-gray-600">Not Interested</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-xl p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search leads by name, phone, or category..."
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
                  <SelectItem value="All">All Status</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                  <SelectItem value="Reminder">Reminder</SelectItem>
                  <SelectItem value="Not Interested">Not Interested</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Leads Table */}
        <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-xl shadow-sm overflow-hidden">
          <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gray-50/50">
            <div className="flex items-center text-base sm:text-lg font-semibold text-gray-900">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              <span className="hidden sm:inline">Leads List ({filteredLeads.length})</span>
              <span className="sm:hidden">Leads ({filteredLeads.length})</span>
            </div>
          </div>
        
        {/* Scrollable Table View for All Screen Sizes */}
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
                  <div className="flex items-center justify-center">
                    <span>Actions</span>
                  </div>
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
                          className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 hover:border-blue-400 action-btn-edit rounded-lg"
                          title="Edit Lead"
                        >
                          <Edit2 className="h-4 w-4 sm:h-4 sm:w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleDelete(lead)}
                          className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-400 action-btn-delete rounded-lg"
                          title="Delete Lead"
                        >
                          <Trash2 className="h-4 w-4 sm:h-4 sm:w-4" />
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
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-white/90 backdrop-blur-sm rounded-lg">
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, filteredLeads.length)} of {filteredLeads.length} leads
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="h-8 px-3"
              >
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
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
                      className="h-8 w-8 p-0"
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
                className="h-8 px-3"
              >
                Next
              </Button>
            </div>
          </div>
        )}
        </div>

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
          <DialogContent className="w-[calc(100vw-20px)] max-w-[500px] max-h-[90vh] overflow-y-auto m-2 sm:m-5 sm:mx-auto">
            <DialogHeader className="relative pb-3 sm:pb-4 border-b border-blue-100 p-4 sm:p-5">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg flex-shrink-0">
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <DialogTitle className="text-base sm:text-lg font-bold text-gray-900 truncate">
                    {editingLead ? 'Edit Lead' : 'Add New Lead'}
                  </DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm text-gray-600 mt-1">
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
              className="space-y-3 sm:space-y-4"
            >
              <div className="p-4 sm:p-5">
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                <div className="w-full">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter lead name"
                    className="mt-1 w-full h-11"
                    required
                  />
                </div>
                <div className="w-full">
                  <Label htmlFor="date" className="text-sm font-medium text-gray-700">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="mt-1 w-full h-11"
                  />
                </div>
                <div className="w-full">
                  <Label htmlFor="category" className="text-sm font-medium text-gray-700">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger className="mt-1 w-full h-11">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full">
                  <Label htmlFor="contactNumber" className="text-sm font-medium text-gray-700">Contact Number *</Label>
                  <Input
                    id="contactNumber"
                    value={formData.contactNumber}
                    onChange={e => setFormData({ ...formData, contactNumber: e.target.value })}
                    placeholder="Enter contact number"
                    className="mt-1 w-full h-11"
                    required
                  />
                </div>
                <div className="w-full">
                  <Label htmlFor="reminderDate" className="text-sm font-medium text-gray-700">Reminder Date</Label>
                  <Input
                    id="reminderDate"
                    type="date"
                    value={formData.reminderDate}
                    onChange={e => setFormData({ ...formData, reminderDate: e.target.value })}
                    className="mt-1 w-full h-11"
                  />
                </div>
                <div className="w-full">
                  <Label htmlFor="status" className="text-sm font-medium text-gray-700">Status</Label>
                  <Select value={formData.status} onValueChange={(value: 'Closed' | 'Reminder' | 'Not Interested') => setFormData({ ...formData, status: value })}>
                    <SelectTrigger className="mt-1 w-full h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Closed">Closed</SelectItem>
                      <SelectItem value="Reminder">Reminder</SelectItem>
                      <SelectItem value="Not Interested">Not Interested</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              <div className="w-full">
                <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter description (optional)"
                  className="mt-1 w-full resize-none min-h-[80px]"
                  rows={3}
                />
              </div>
              </div>
              </div>
              
              <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-100 p-4 sm:p-5">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowAddDialog(false);
                    setEditingLead(null);
                    resetForm();
                  }}
                  disabled={submitting}
                  className="w-full sm:w-auto min-h-[44px] text-sm"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full sm:w-auto global-btn min-h-[44px] text-sm"
                >
                  {submitting ? 'Saving...' : (editingLead ? 'Update Lead' : 'Add Lead')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="w-[calc(100vw-40px)] max-w-[400px] m-5 sm:mx-auto">
            <DialogHeader className="text-center pb-4 sm:pb-6 p-5 sm:p-6">
              <div className="mx-auto mb-4 h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
              </div>
              <DialogTitle className="text-lg sm:text-xl font-semibold text-gray-900">
                Delete Lead
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600 mt-2">
                Are you sure you want to delete this lead? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            {leadToDelete && (
              <div className="bg-gray-50 rounded-lg p-4 mx-5 my-4 sm:mx-6">
                <div className="text-sm space-y-2">
                  <div className="font-medium text-gray-900 text-center sm:text-left truncate">{leadToDelete.name}</div>
                  <div className="text-gray-600 text-center sm:text-left">{leadToDelete.contactNumber}</div>
                  <div className="text-gray-600 text-center sm:text-left">{leadToDelete.category}</div>
                </div>
              </div>
            )}

            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-gray-100 p-5 sm:p-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowDeleteDialog(false);
                  setLeadToDelete(null);
                }}
                disabled={submitting}
                className="modern-btn modern-btn-secondary w-full sm:w-auto min-h-[44px] text-sm"
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={confirmDelete}
                disabled={submitting}
                className="modern-btn modern-btn-danger w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white min-h-[44px] text-sm"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
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
