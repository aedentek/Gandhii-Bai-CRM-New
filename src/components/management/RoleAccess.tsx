import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import LoadingScreen from '@/components/shared/LoadingScreen';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Shield, Users, Settings, UserCheck, UserCog, Plus, Pencil, Eye, Trash2, RefreshCw, Activity, Calendar, Download, Lock, Key } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Helper to format any date string as DD/MM/YYYY
function formatDateDDMMYYYY(dateStr?: string): string {
  if (!dateStr) return '-';
  const dateObj = new Date(dateStr);
  if (!isNaN(dateObj.getTime())) {
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split('-');
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }
  return dateStr;
}

interface RoleAccess {
  id: string;
  role: string;
  accessPages: string[];
  status: 'Active' | 'Inactive';
  createdAt: string;
}

const ALL_PAGES = [
  'Dashboard',
  'Patient Management',
  'Staff Management',
  'Doctors Management',
  'Medicine Management',
  'Grocery Management',
  'General Purchase',
  'User Management',
  'Role Management',
  'Reports & Analytics',
  'Settings & Configuration',
  'System Administration',
  'Backup & Restore',
  'Data Import/Export',
  'Audit Logs'
];

const RoleAccess: React.FC = () => {
  const [accessList, setAccessList] = useState<RoleAccess[]>(() => {
    const stored = localStorage.getItem('roleAccess');
    return stored ? JSON.parse(stored) : [];
  });
  
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    localStorage.setItem('roleAccess', JSON.stringify(accessList));
  }, [accessList]);

  // Auto-refresh data periodically
  React.useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 60000); // Refresh every minute for role access
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = React.useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      setRefreshKey(prev => prev + 1);
      setLoading(false);
    }, 500);
  }, []);

  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewAccess, setViewAccess] = useState<RoleAccess | null>(null);
  const [editingAccess, setEditingAccess] = useState<RoleAccess | null>(null);
  const [formData, setFormData] = useState({
    role: '',
    accessPages: [] as string[],
    status: 'Active' as 'Active' | 'Inactive',
  });
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('userRoles');
    setRoles(stored ? JSON.parse(stored) : []);
  }, []);

  const { toast } = useToast();

  // Enhanced global refresh function
  const handleGlobalRefresh = React.useCallback(async () => {
    try {
      setLoading(true);
      
      const currentSearchTerm = searchTerm;
      const currentStatusFilter = statusFilter;
      
      // Simulate API refresh - in real app, fetch from backend
      const stored = localStorage.getItem('roleAccess');
      const freshData = stored ? JSON.parse(stored) : [];
      
      setAccessList(freshData);
      
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
  }, [searchTerm, statusFilter, toast]);

  const handleViewClick = (access: RoleAccess) => {
    setViewAccess(access);
    setViewModalOpen(true);
  };

  const handleEditClick = (access: RoleAccess) => {
    setEditingAccess(access);
    setFormData({
      role: access.role,
      accessPages: access.accessPages,
      status: access.status,
    });
    setEditModalOpen(true);
  };

  const handleAddAccess = async () => {
    if (!formData.role || formData.accessPages.length === 0) {
      toast({
        title: "Error",
        description: "Please select role and at least one access page",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      
      const newAccess: RoleAccess = {
        id: (accessList.length + 1).toString(),
        role: formData.role,
        accessPages: formData.accessPages,
        status: formData.status,
        createdAt: new Date().toISOString().split('T')[0],
      };
      
      setAccessList([...accessList, newAccess]);
      setFormData({ role: '', accessPages: [], status: 'Active' });
      setAddModalOpen(false);
      
      toast({
        title: "Success",
        description: "Role access added successfully"
      });
      
    } catch (error) {
      console.error('Error adding access:', error);
      toast({
        title: "Error",
        description: "Failed to add role access",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateAccess = async () => {
    if (!editingAccess || !formData.role || formData.accessPages.length === 0) {
      toast({
        title: "Error",
        description: "Please select role and at least one access page",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      
      const updated = accessList.map(a =>
        a.id === editingAccess.id ? { ...a, ...formData } : a
      );
      
      setAccessList(updated);
      setEditModalOpen(false);
      setEditingAccess(null);
      setFormData({ role: '', accessPages: [], status: 'Active' });
      
      toast({
        title: "Success",
        description: "Role access updated successfully"
      });
      
    } catch (error) {
      console.error('Error updating access:', error);
      toast({
        title: "Error",
        description: "Failed to update role access",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAccess = async (accessId: string, roleName: string) => {
    if (!window.confirm(`Are you sure you want to delete access for role "${roleName}"?`)) return;
    
    try {
      setSubmitting(true);
      
      setAccessList(accessList.filter(a => a.id !== accessId));
      
      toast({
        title: "Success",
        description: "Role access deleted successfully"
      });
      
    } catch (error) {
      console.error('Error deleting access:', error);
      toast({
        title: "Error",
        description: "Failed to delete role access",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePageChange = (page: string, checked: boolean) => {
    if (checked) {
      setFormData({...formData, accessPages: [...formData.accessPages, page]});
    } else {
      setFormData({...formData, accessPages: formData.accessPages.filter(p => p !== page)});
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'default';
      case 'Inactive':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  // Export CSV function
  const handleExportCSV = () => {
    try {
      const headers = ['S No', 'Role', 'Access Pages', 'Status', 'Created Date'];
      
      const csvData = filteredAccess.map((access, index) => [
        index + 1,
        `"${access.role}"`,
        `"${access.accessPages.join('; ')}"`,
        access.status,
        formatDateDDMMYYYY(access.createdAt),
      ]);
      
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
        let filename = `role-access-management-${dateStr}`;
        
        if (statusFilter !== 'all') {
          filename += `-${statusFilter.toLowerCase()}`;
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
          description: `CSV exported successfully! ${filteredAccess.length} access records exported.`
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

  // Filter access records
  const filteredAccess = accessList.filter(access => {
    const matchesSearch = access.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      access.accessPages.join(', ').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || access.status.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.ceil(filteredAccess.length / pageSize);
  const paginatedAccess = filteredAccess.slice((page - 1) * pageSize, page * pageSize);

  const handlePrevPage = () => setPage((p) => Math.max(1, p - 1));
  const handleNextPage = () => setPage((p) => Math.min(totalPages, p + 1));
  React.useEffect(() => { setPage(1); }, [searchTerm, accessList.length, statusFilter]);

  // Calculate summary totals
  const activeAccess = accessList.filter(access => access.status === 'Active').length;
  const inactiveAccess = accessList.filter(access => access.status === 'Inactive').length;
  const totalAccess = accessList.length;

  if (loading) {
    return <LoadingScreen message="Loading role access data..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 px-2 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header Section */}
        <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-2xl p-4 sm:p-6 shadow-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 bg-blue-100 rounded-xl">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Role Access Management</h1>
                {/* <p className="text-sm text-gray-600 mt-1">Manage role-based page access permissions</p> */}
              </div>
            </div>
          
            <div className="flex flex-row sm:flex-row gap-1 sm:gap-3 w-full sm:w-auto">
              <Button 
                onClick={() => {
                  setStatusFilter('all');
                  setSearchTerm('');
                  setPage(1);
                  handleGlobalRefresh();
                }}
                disabled={loading}
                className="modern-btn modern-btn-primary flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
              >
                <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
                <span className="sm:hidden">↻</span>
              </Button>
              
              <Button 
                onClick={() => setAddModalOpen(true)}
                className="modern-btn modern-btn-primary flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Add Access</span>
                <span className="sm:hidden">Add</span>
              </Button>
              
              <Button 
                onClick={handleExportCSV}
                className="modern-btn modern-btn-primary flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">CSV</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-4 lg:gap-6">
          <div className="modern-stat-card stat-card-blue">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-3 w-3 sm:h-5 sm:w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-lg sm:text-2xl font-bold text-gray-900">{totalAccess}</div>
                <div className="text-xs text-gray-600">Total Access Records</div>
              </div>
            </div>
          </div>
          
          <div className="modern-stat-card stat-card-green">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="h-3 w-3 sm:h-5 sm:w-5 text-green-600" />
              </div>
              <div>
                <div className="text-lg sm:text-2xl font-bold text-gray-900">{activeAccess}</div>
                <div className="text-xs text-gray-600">Active Access</div>
              </div>
            </div>
          </div>
          
          <div className="modern-stat-card stat-card-orange">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Key className="h-3 w-3 sm:h-5 sm:w-5 text-orange-600" />
              </div>
              <div>
                <div className="text-lg sm:text-2xl font-bold text-gray-900">{ALL_PAGES.length}</div>
                <div className="text-xs text-gray-600">Available Pages</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-xl p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search role access by role name or pages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="w-full sm:w-40">
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
          </div>
        </div>

        {/* Access Table */}
        <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-xl shadow-sm overflow-hidden">
          <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gray-50/50">
            <div className="flex items-center text-base sm:text-lg font-semibold text-gray-900">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              <span className="hidden sm:inline">Role Access Management ({filteredAccess.length})</span>
              <span className="sm:hidden">Access ({filteredAccess.length})</span>
            </div>
          </div>
        
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow className="bg-gray-50 border-b">
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">S No</TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">Role</TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">Access Pages</TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                    <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Status</span>
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">Created Date</TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedAccess.map((access, idx) => {
                const sno = (page - 1) * pageSize + idx + 1;
                return (
                  <TableRow key={access.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{sno}</TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 font-medium text-center text-xs sm:text-sm whitespace-nowrap">{access.role}</TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm max-w-xs">
                      <div className="truncate" title={access.accessPages.join(', ')}>
                        {access.accessPages.length > 3 
                          ? `${access.accessPages.slice(0, 3).join(', ')}... (+${access.accessPages.length - 3} more)`
                          : access.accessPages.join(', ')
                        }
                      </div>
                    </TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">
                      <Badge variant={getStatusColor(access.status)}>
                        {access.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{formatDateDDMMYYYY(access.createdAt)}</TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1 sm:gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleViewClick(access)}
                          className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 hover:border-green-400 rounded-lg"
                          title="View Details"
                        >
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleEditClick(access)}
                          className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 hover:border-blue-400 rounded-lg"
                          title="Edit Access"
                        >
                          <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleDeleteAccess(access.id, access.role)}
                          disabled={submitting}
                          className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-400 rounded-lg"
                          title="Delete Access"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {paginatedAccess.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No access records found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-gray-50/50 border-t">
            <div className="text-sm text-gray-600">
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, filteredAccess.length)} of {filteredAccess.length} access records
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
      </div>

        {/* Add Access Dialog */}
        <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader className="relative pb-3 sm:pb-4 md:pb-6 border-b border-blue-100 px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Plus className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-gray-900">
                    Add Role Access
                  </DialogTitle>
                  <DialogDescription className="text-gray-600 mt-1">
                    Configure page access permissions for a role
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <form
              onSubmit={e => {
                e.preventDefault();
                handleAddAccess();
              }}
              className="space-y-4 p-3 sm:p-4 md:p-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-sm font-medium text-gray-700">Role *</Label>
                  <Select value={formData.role} onValueChange={val => setFormData({ ...formData, role: val })}>
                    <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map(role => (
                        <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium text-gray-700">Status</Label>
                  <Select value={formData.status} onValueChange={val => setFormData({ ...formData, status: val as 'Active' | 'Inactive' })}>
                    <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Access Pages *</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                  {ALL_PAGES.map((page) => (
                    <div key={page} className="flex items-center space-x-2">
                      <Checkbox
                        id={`add-${page}`}
                        checked={formData.accessPages.includes(page)}
                        onCheckedChange={(checked) => handlePageChange(page, checked as boolean)}
                      />
                      <Label htmlFor={`add-${page}`} className="text-sm">{page}</Label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500">Selected: {formData.accessPages.length} pages</p>
              </div>
              
              <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setAddModalOpen(false);
                    setFormData({ role: '', accessPages: [], status: 'Active' });
                  }}
                  disabled={submitting}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full sm:w-auto modern-btn modern-btn-primary"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Access'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Access Dialog */}
        <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader className="text-center pb-2">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Eye className="h-6 w-6 text-blue-600" />
              </div>
              <DialogTitle className="text-lg font-semibold text-gray-900">
                Role Access Details
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600 mt-2">
                Complete information about role access permissions
              </DialogDescription>
            </DialogHeader>
            
            {viewAccess && (
              <div className="space-y-6 p-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">Role:</span>
                    <span className="font-semibold text-gray-900">{viewAccess.role}</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">Status:</span>
                    <Badge variant={getStatusColor(viewAccess.status)}>
                      {viewAccess.status}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">Created Date:</span>
                    <span className="text-gray-900">{formatDateDDMMYYYY(viewAccess.createdAt)}</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900">Access Pages ({viewAccess.accessPages.length})</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                    {viewAccess.accessPages.length === 0 ? (
                      <p className="text-gray-500 col-span-2">No pages assigned</p>
                    ) : (
                      viewAccess.accessPages.map((page, idx) => (
                        <div key={idx} className="flex items-center space-x-2">
                          <Key className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-gray-700">{page}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="flex justify-center pt-4">
              <Button 
                variant="outline" 
                onClick={() => setViewModalOpen(false)}
                className="w-full sm:w-auto"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Access Dialog */}
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader className="relative pb-3 sm:pb-4 md:pb-6 border-b border-blue-100 px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Pencil className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-gray-900">
                    Edit Role Access
                  </DialogTitle>
                  <DialogDescription className="text-gray-600 mt-1">
                    Update page access permissions for role
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <form
              onSubmit={e => {
                e.preventDefault();
                handleUpdateAccess();
              }}
              className="space-y-4 p-3 sm:p-4 md:p-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editRole" className="text-sm font-medium text-gray-700">Role *</Label>
                  <Select value={formData.role} onValueChange={val => setFormData({ ...formData, role: val })}>
                    <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map(role => (
                        <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editStatus" className="text-sm font-medium text-gray-700">Status</Label>
                  <Select value={formData.status} onValueChange={val => setFormData({ ...formData, status: val as 'Active' | 'Inactive' })}>
                    <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Access Pages *</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                  {ALL_PAGES.map((page) => (
                    <div key={page} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-${page}`}
                        checked={formData.accessPages.includes(page)}
                        onCheckedChange={(checked) => handlePageChange(page, checked as boolean)}
                      />
                      <Label htmlFor={`edit-${page}`} className="text-sm">{page}</Label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500">Selected: {formData.accessPages.length} pages</p>
              </div>
              
              <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setEditModalOpen(false);
                    setEditingAccess(null);
                    setFormData({ role: '', accessPages: [], status: 'Active' });
                  }}
                  disabled={submitting}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full sm:w-auto modern-btn modern-btn-primary"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Access'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default RoleAccess;
