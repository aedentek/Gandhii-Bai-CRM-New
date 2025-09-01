import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ActionButtons } from '@/components/ui/HeaderActionButtons';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Plus, Search, Edit2, Trash2, Users, User, UserCheck, Shield, Lock, Activity, X } from 'lucide-react';
import { usersAPI, rolesAPI } from '@/utils/api';
import LoadingScreen from '@/components/shared/LoadingScreen';
import { usePageTitle } from '@/hooks/usePageTitle';
import '@/styles/global-crm-design.css';

interface User {
  id: string;
  username: string;
  role: string;
  password: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

const UserManagement: React.FC = () => {
  // Set page title
  usePageTitle();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch users from backend
  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching users from backend...');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/management-users`);
      console.log('🔗 Users fetch response status:', res.status);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log('📥 Raw users data from backend:', data);
      
      const mappedUsers = data.map((u: any) => ({
        id: u.id.toString(),
        username: u.username,
        role: u.user_role || '',
        password: u.user_password || '',
        status: u.user_status || 'Active',
        createdAt: u.created_at ? new Date(u.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      }));
      
      console.log('✅ Mapped users data:', mappedUsers);
      setUsers(mappedUsers);
    } catch (err) {
      console.error('❌ Failed to fetch users:', err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    role: '',
    password: '',
    confirmPassword: '',
    status: 'Active' as 'Active' | 'Inactive',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);

  // Fetch roles from backend
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        console.log('🔍 Fetching roles from backend...');
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/roles`);
        console.log('🔗 Roles fetch response status:', res.status);
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        const data = await res.json();
        console.log('📥 Raw roles data from backend:', data);
        
        const mappedRoles = data.map((role: any) => ({ id: role.id.toString(), name: role.name }));
        console.log('✅ Mapped roles data:', mappedRoles);
        setRoles(mappedRoles);
      } catch (err) {
        console.error('❌ Failed to fetch roles:', err);
        setRoles([]);
      }
    };
    fetchRoles();
  }, []);

  const handleSubmit = async () => {
    console.log('🔍 handleSubmit called with formData:', formData);
    
    if (!formData.username || !formData.role || !formData.password || !formData.confirmPassword) {
      console.log('❌ Validation failed: missing fields');
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      console.log('❌ Validation failed: passwords do not match');
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    
    console.log('✅ Validation passed, proceeding with API call');
    
    try {
      if (editingUser) {
        console.log('📝 Updating existing user:', editingUser.id);
        // Update user via API
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/management-users/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: formData.username,
            role: formData.role,
            password: formData.password,
            status: formData.status
          })
        });
        console.log('🔗 PUT response status:', res.status);
        if (!res.ok) {
          const errorText = await res.text();
          console.error('❌ PUT failed:', errorText);
          throw new Error('Failed to update user');
        }
        
        // Refresh the users list from backend to ensure immediate display
        await fetchUsers();
        toast({ title: 'User Updated', description: 'User details updated successfully' });
      } else {
        console.log('➕ Adding new user');
        // Add user via API
        const requestBody = {
          username: formData.username,
          role: formData.role,
          password: formData.password,
          status: formData.status
        };
        console.log('📤 POST request body:', requestBody);
        
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/management-users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });
        
        console.log('🔗 POST response status:', res.status);
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error('❌ POST failed:', errorText);
          throw new Error(`Failed to add user: ${errorText}`);
        }
        
        const newUser = await res.json();
        console.log('✅ New user created:', newUser);
        
        // Refresh the users list from backend to ensure immediate display
        await fetchUsers();
        toast({ title: 'User Added', description: 'New user account created successfully' });
      }
      setShowAddDialog(false);
      setEditingUser(null);
      setFormData({ username: '', role: '', password: '', confirmPassword: '', status: 'Active' });
    } catch (err) {
      console.error('❌ handleSubmit error:', err);
      toast({ title: 'Error', description: 'Failed to save user', variant: 'destructive' });
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      role: user.role,
      password: user.password,
      confirmPassword: user.password,
      status: user.status,
    });
    setShowAddDialog(true);
  };

  const handleDelete = (user: User) => {
    setUserToDelete(user);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/management-users/${userToDelete.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete user');
      
      // Refresh the users list from backend to ensure immediate display
      await fetchUsers();
      toast({ title: 'User Deleted', description: 'User account deleted successfully' });
      setShowDeleteDialog(false);
      setUserToDelete(null);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to delete user', variant: 'destructive' });
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <LoadingScreen message="Loading user management data..." />;
  }

  return (
    <div className="pl-1 pr-3 sm:pl-2 sm:pr-4 lg:pl-3 lg:pr-6 py-4 sm:py-6">
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-primary rounded-lg">
            <Users className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          </div>
        </div>
      </div>
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>User List</CardTitle>
            </div>
            <div className="flex gap-2">
              <ActionButtons.Refresh onClick={() => {
                console.log('🔄 Manual refresh triggered - refreshing entire page');
                window.location.reload();
              }} />
              <Button onClick={() => setShowAddDialog(true)} className="bg-gradient-medical">
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">S NO</TableHead>
                  <TableHead className="text-center">User Name</TableHead>
                  <TableHead className="text-center">Role</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Created Date</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user, idx) => (
                  <TableRow key={user.id} className="text-center">
                    <TableCell className="align-middle">{idx + 1}</TableCell>
                    <TableCell className="font-medium align-middle">{user.username}</TableCell>
                    <TableCell className="align-middle">{user.role}</TableCell>
                    <TableCell className="align-middle">
                      <span className={user.status === 'Active' ? 'text-success' : 'text-destructive'}>
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="align-middle">{user.createdAt}</TableCell>
                    <TableCell className="align-middle">
                      <div className="flex space-x-1 justify-center">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(user)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDelete(user)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="crm-modal-container">
          <DialogHeader className="editpopup form dialog-header">
            <div className="editpopup form icon-title-container">
              <div className="editpopup form dialog-icon">
                <User className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div className="editpopup form title-description">
                <DialogTitle className="editpopup form dialog-title">
                  {editingUser ? 'Edit User' : 'Add User'}
                </DialogTitle>
                <DialogDescription className="editpopup form dialog-description">
                  {editingUser ? 'Update user information and permissions' : 'Create a new user account with role'}
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
            <div className="editpopup form crm-edit-form-group">
              <Label htmlFor="username" className="editpopup form crm-edit-form-label flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                User Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Enter user name"
                className="editpopup form crm-edit-form-input"
                required
              />
            </div>
            
            <div className="editpopup form crm-edit-form-group">
              <Label htmlFor="role" className="editpopup form crm-edit-form-label flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Role <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.role} onValueChange={val => setFormData({ ...formData, role: val })}>
                <SelectTrigger className="editpopup form crm-edit-form-select">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="editpopup form crm-edit-form-group">
              <Label htmlFor="password" className="editpopup form crm-edit-form-label flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Password <span className="text-red-500">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter password"
                className="editpopup form crm-edit-form-input"
                required
              />
            </div>
            
            <div className="editpopup form crm-edit-form-group">
              <Label htmlFor="confirm-password" className="editpopup form crm-edit-form-label flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Confirm Password <span className="text-red-500">*</span>
              </Label>
              <Input
                id="confirm-password"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Re-enter password"
                className="editpopup form crm-edit-form-input"
                required
              />
            </div>
            
            <div className="editpopup form crm-edit-form-group">
              <Label htmlFor="status" className="editpopup form crm-edit-form-label flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Status
              </Label>
              <Select value={formData.status} onValueChange={val => setFormData({ ...formData, status: val as 'Active' | 'Inactive' })}>
                <SelectTrigger className="editpopup form crm-edit-form-select">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <DialogFooter className="editpopup form dialog-footer flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowAddDialog(false)}
                className="editpopup form footer-button-cancel w-full sm:w-auto modern-btn modern-btn-secondary"
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="editpopup form footer-button-save w-full sm:w-auto global-btn"
              >
                <User className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                {editingUser ? 'Update User' : 'Add User'}
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
                  Delete User
                </DialogTitle>
                <DialogDescription className="editpopup form dialog-description">
                  Are you sure you want to delete this user? This action cannot be undone.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          {userToDelete && (
            <div className="mx-4 my-4 p-4 bg-gray-50 rounded-lg border">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="font-medium text-gray-900">{userToDelete.username}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">{userToDelete.role}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Status: {userToDelete.status}</span>
                </div>
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">ID: {userToDelete.id}</span>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="editpopup form dialog-footer flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
              className="editpopup form footer-button-cancel w-full sm:w-auto modern-btn modern-btn-secondary"
            >
              <X className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={confirmDelete}
              className="editpopup form footer-button-delete w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
