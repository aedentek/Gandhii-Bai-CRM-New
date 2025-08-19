import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import LoadingScreen from '@/components/shared/LoadingScreen';
import { getAllPermissions, getPermissionsByCategory } from '@/utils/permissions';
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
import { Search, Shield, Users, Settings, UserCheck, UserCog, Plus, Pencil, Eye, Trash2, RefreshCw, Activity, Calendar, Download, Lock } from 'lucide-react';
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

interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  status?: 'active' | 'inactive';
  createdAt?: string;
}

// Get permissions from the centralized system
const allPermissions = getAllPermissions();
const permissionsByCategory = getPermissionsByCategory();

const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [roleTemplates, setRoleTemplates] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch role templates for dropdown
  React.useEffect(() => {
    const fetchRoleTemplates = async () => {
      try {
        const res = await fetch('http://localhost:4000/api/roles');
        const data = await res.json();
        const templates = data.map((role: any) => ({
          id: role.id.toString(),
          name: role.name
        }));
        setRoleTemplates(templates);
      } catch (e) {
        console.error('Error fetching role templates:', e);
      }
    };
    fetchRoleTemplates();
  }, []);

  React.useEffect(() => {
    (async () => {
      if (refreshKey > 0) console.log('Refreshing data...');
      try {
        const res = await fetch('http://localhost:4000/api/roles');
        const data = await res.json();
        const mappedRoles = data.map((role: any) => ({
          id: role.id.toString(),
          name: role.name,
          description: role.description || '',
          permissions: role.permissions || [],
          status: role.status || 'active',
          createdAt: role.createdAt || new Date().toISOString()
        }));
        setRoles(mappedRoles);
      } catch (e) {
        console.error('Error fetching roles:', e);
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

  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewRole, setViewRole] = useState<Role | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
    status: 'active' as 'active' | 'inactive',
  });

  const { toast } = useToast();

  // Enhanced global refresh function
  const handleGlobalRefresh = React.useCallback(async () => {
    try {
      setLoading(true);
      
      const currentSearchTerm = searchTerm;
      const currentStatusFilter = statusFilter;
      
      const res = await fetch('http://localhost:4000/api/roles');
      const data = await res.json();
      const freshRoles = data.map((role: any) => ({
        id: role.id.toString(),
        name: role.name,
        description: role.description || '',
        permissions: role.permissions || [],
        status: role.status || 'active',
        createdAt: role.createdAt || new Date().toISOString()
      }));
      
      setRoles(freshRoles);
      
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

  const handleViewClick = (role: Role) => {
    setViewRole(role);
    setViewModalOpen(true);
  };

  const handleEditClick = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
      permissions: role.permissions,
      status: role.status || 'active',
    });
    setEditModalOpen(true);
  };

  const handleAddRole = async () => {
    if (!formData.name) {
      toast({
        title: "Error",
        description: "Please select a role name",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('http://localhost:4000/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          permissions: formData.permissions,
          status: formData.status
        }),
      });
      
      if (!res.ok) throw new Error('Failed to add role');
      
      setFormData({ name: '', description: '', permissions: [], status: 'active' });
      setAddModalOpen(false);
      
      toast({
        title: "Success",
        description: "Role added successfully"
      });
      
      handleRefresh();
    } catch (error) {
      console.error('Error adding role:', error);
      toast({
        title: "Error",
        description: "Failed to add role",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!editingRole || !formData.name) {
      toast({
        title: "Error",
        description: "Please select a role name",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`http://localhost:4000/api/roles/${editingRole.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          permissions: formData.permissions,
          status: formData.status
        }),
      });
      
      if (!res.ok) throw new Error('Failed to update role');
      
      setEditModalOpen(false);
      setEditingRole(null);
      setFormData({ name: '', description: '', permissions: [], status: 'active' });
      
      toast({
        title: "Success",
        description: "Role updated successfully"
      });
      
      handleRefresh();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to update role",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    if (!window.confirm(`Are you sure you want to delete the role "${roleName}"?`)) return;
    
    try {
      setSubmitting(true);
      const res = await fetch(`http://localhost:4000/api/roles/${roleId}`, { 
        method: 'DELETE' 
      });
      
      if (!res.ok) throw new Error('Failed to delete role');
      
      toast({
        title: "Success",
        description: "Role deleted successfully"
      });
      
      handleRefresh();
    } catch (error) {
      console.error('Error deleting role:', error);
      toast({
        title: "Error",
        description: "Failed to delete role",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePermissionChange = (permission: string, checked: boolean) => {
    if (checked) {
      setFormData({...formData, permissions: [...formData.permissions, permission]});
    } else {
      setFormData({...formData, permissions: formData.permissions.filter(p => p !== permission)});
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  // Export CSV function
  const handleExportCSV = () => {
    try {
      const headers = ['S No', 'Role Name', 'Description', 'Permissions Count', 'Status', 'Created Date'];
      
      const csvData = filteredRoles.map((role, index) => [
        index + 1,
        `"${role.name}"`,
        `"${role.description || '-'}"`,
        role.permissions.length,
        (role.status || 'active').charAt(0).toUpperCase() + (role.status || 'active').slice(1),
        formatDateDDMMYYYY(role.createdAt),
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
        let filename = `role-management-${dateStr}`;
        
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
          description: `CSV exported successfully! ${filteredRoles.length} roles exported.`
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

  // Filter roles
  const filteredRoles = roles.filter(role => {
    const matchesSearch = role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (role.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || (role.status || 'active') === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.ceil(filteredRoles.length / pageSize);
  const paginatedRoles = filteredRoles.slice((page - 1) * pageSize, page * pageSize);

  const handlePrevPage = () => setPage((p) => Math.max(1, p - 1));
  const handleNextPage = () => setPage((p) => Math.min(totalPages, p + 1));
  React.useEffect(() => { setPage(1); }, [searchTerm, roles.length, statusFilter]);

  // Calculate summary totals
  const activeRoles = roles.filter(role => (role.status || 'active') === 'active').length;
  const inactiveRoles = roles.filter(role => (role.status || 'active') === 'inactive').length;
  const totalRoles = roles.length;

  if (loading) {
    return <LoadingScreen message="Loading roles..." />;
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
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Role Management page</h1>
                {/* <p className="text-sm text-gray-600 mt-1">Create and manage user roles with permissions</p> */}
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
                <span className="hidden sm:inline">Add Role</span>
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
                <div className="text-lg sm:text-2xl font-bold text-gray-900">{totalRoles}</div>
                <div className="text-xs text-gray-600">Total Roles</div>
              </div>
            </div>
          </div>
          
          <div className="modern-stat-card stat-card-green">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="h-3 w-3 sm:h-5 sm:w-5 text-green-600" />
              </div>
              <div>
                <div className="text-lg sm:text-2xl font-bold text-gray-900">{activeRoles}</div>
                <div className="text-xs text-gray-600">Active Roles</div>
              </div>
            </div>
          </div>
          
          <div className="modern-stat-card stat-card-orange">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Lock className="h-3 w-3 sm:h-5 sm:w-5 text-orange-600" />
              </div>
              <div>
                <div className="text-lg sm:text-2xl font-bold text-gray-900">{allPermissions.length}</div>
                <div className="text-xs text-gray-600">Available Permissions</div>
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
                  placeholder="Search roles by name or description..."
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

        {/* Roles Table */}
        <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-xl shadow-sm overflow-hidden">
          <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gray-50/50">
            <div className="flex items-center text-base sm:text-lg font-semibold text-gray-900">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              <span className="hidden sm:inline">Role Management ({filteredRoles.length})</span>
              <span className="sm:hidden">Roles ({filteredRoles.length})</span>
            </div>
          </div>
        
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow className="bg-gray-50 border-b">
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">S No</TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">Role Name</TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">Description</TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">Permissions</TableHead>
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
              {paginatedRoles.map((role, idx) => {
                const sno = (page - 1) * pageSize + idx + 1;
                return (
                  <TableRow key={role.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{sno}</TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 font-medium text-center text-xs sm:text-sm whitespace-nowrap">{role.name}</TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm max-w-xs truncate">{role.description || '-'}</TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{role.permissions.length} permissions</TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">
                      <Badge variant={getStatusColor(role.status || 'active')}>
                        {(role.status || 'active').charAt(0).toUpperCase() + (role.status || 'active').slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{formatDateDDMMYYYY(role.createdAt)}</TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1 sm:gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleViewClick(role)}
                          className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 hover:border-green-400 rounded-lg"
                          title="View Details"
                        >
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleEditClick(role)}
                          className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 hover:border-blue-400 rounded-lg"
                          title="Edit Role"
                        >
                          <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleDeleteRole(role.id, role.name)}
                          disabled={submitting}
                          className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-400 rounded-lg"
                          title="Delete Role"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {paginatedRoles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No roles found
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
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, filteredRoles.length)} of {filteredRoles.length} roles
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

        {/* Add Role Dialog */}
        <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader className="relative pb-3 sm:pb-4 md:pb-6 border-b border-blue-100 px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Plus className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-gray-900">
                    Add New Role
                  </DialogTitle>
                  <DialogDescription className="text-gray-600 mt-1">
                    Create a new user role with specific permissions
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <form
              onSubmit={e => {
                e.preventDefault();
                handleAddRole();
              }}
              className="space-y-4 p-3 sm:p-4 md:p-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="roleName" className="text-sm font-medium text-gray-700">Role Name *</Label>
                  <Select value={formData.name} onValueChange={(value) => setFormData({...formData, name: value})}>
                    <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="Select role name" />
                    </SelectTrigger>
                    <SelectContent>
                      {roleTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.name}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roleStatus" className="text-sm font-medium text-gray-700">Status</Label>
                  <Select value={formData.status} onValueChange={(value: 'active' | 'inactive') => setFormData({...formData, status: value})}>
                    <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="roleDescription" className="text-sm font-medium text-gray-700">Description</Label>
                <Input
                  id="roleDescription"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Enter role description"
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Permissions</Label>
                <div className="max-h-80 overflow-y-auto border rounded-lg p-3 space-y-4">
                  {Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => (
                    <div key={category} className="space-y-2">
                      <h4 className="font-medium text-gray-800 text-sm border-b pb-1">{category}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2">
                        {categoryPermissions.map((permission) => (
                          <div key={permission.name} className="flex items-center space-x-2">
                            <Checkbox
                              id={`add-${permission.name}`}
                              checked={formData.permissions.includes(permission.id)}
                              onCheckedChange={(checked) => handlePermissionChange(permission.id, checked as boolean)}
                            />
                            <Label htmlFor={`add-${permission.name}`} className="text-sm">{permission.name}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500">Selected: {formData.permissions.length} permissions</p>
              </div>
              
              <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setAddModalOpen(false);
                    setFormData({ name: '', description: '', permissions: [], status: 'active' });
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
                    'Add Role'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Role Dialog */}
        <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader className="text-center pb-2">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Eye className="h-6 w-6 text-blue-600" />
              </div>
              <DialogTitle className="text-lg font-semibold text-gray-900">
                Role Details
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600 mt-2">
                Complete information about this role and its permissions
              </DialogDescription>
            </DialogHeader>
            
            {viewRole && (
              <div className="space-y-6 p-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">Role Name:</span>
                    <span className="font-semibold text-gray-900">{viewRole.name}</span>
                  </div>
                  
                  <div className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">Description:</span>
                    <span className="text-gray-900 text-right max-w-xs">{viewRole.description || 'No description available'}</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">Status:</span>
                    <Badge variant={getStatusColor(viewRole.status || 'active')}>
                      {(viewRole.status || 'active').charAt(0).toUpperCase() + (viewRole.status || 'active').slice(1)}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">Created Date:</span>
                    <span className="text-gray-900">{formatDateDDMMYYYY(viewRole.createdAt)}</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900">Permissions ({viewRole.permissions.length})</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                    {viewRole.permissions.length === 0 ? (
                      <p className="text-gray-500 col-span-2">No permissions assigned</p>
                    ) : (
                      viewRole.permissions.map((permission, idx) => (
                        <div key={idx} className="flex items-center space-x-2">
                          <UserCog className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-gray-700">{permission}</span>
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

        {/* Edit Role Dialog */}
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader className="relative pb-3 sm:pb-4 md:pb-6 border-b border-blue-100 px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Pencil className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-gray-900">
                    Edit Role
                  </DialogTitle>
                  <DialogDescription className="text-gray-600 mt-1">
                    Update role information and permissions
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <form
              onSubmit={e => {
                e.preventDefault();
                handleUpdateRole();
              }}
              className="space-y-4 p-3 sm:p-4 md:p-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editRoleName" className="text-sm font-medium text-gray-700">Role Name *</Label>
                  <Select value={formData.name} onValueChange={(value) => setFormData({...formData, name: value})}>
                    <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="Select role name" />
                    </SelectTrigger>
                    <SelectContent>
                      {roleTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.name}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editRoleStatus" className="text-sm font-medium text-gray-700">Status</Label>
                  <Select value={formData.status} onValueChange={(value: 'active' | 'inactive') => setFormData({...formData, status: value})}>
                    <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="editRoleDescription" className="text-sm font-medium text-gray-700">Description</Label>
                <Input
                  id="editRoleDescription"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Enter role description"
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Permissions</Label>
                <div className="max-h-80 overflow-y-auto border rounded-lg p-3 space-y-4">
                  {Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => (
                    <div key={category} className="space-y-2">
                      <h4 className="font-medium text-gray-800 text-sm border-b pb-1">{category}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2">
                        {categoryPermissions.map((permission) => (
                          <div key={permission.name} className="flex items-center space-x-2">
                            <Checkbox
                              id={`edit-${permission.name}`}
                              checked={formData.permissions.includes(permission.id)}
                              onCheckedChange={(checked) => handlePermissionChange(permission.id, checked as boolean)}
                            />
                            <Label htmlFor={`edit-${permission.name}`} className="text-sm">{permission.name}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500">Selected: {formData.permissions.length} permissions</p>
              </div>
              
              <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setEditModalOpen(false);
                    setEditingRole(null);
                    setFormData({ name: '', description: '', permissions: [], status: 'active' });
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
                    'Update Role'
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

export default RoleManagement;
