import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ActionButtons } from '@/components/ui/HeaderActionButtons';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Plus, Search, Edit2, Trash2, Users } from 'lucide-react';
import { usersAPI, rolesAPI } from '@/utils/api';
import LoadingScreen from '@/components/shared/LoadingScreen';

interface User {
  id: string;
  username: string;
  role: string;
  password: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch users from backend
  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching users from backend...');
      const res = await fetch('http://localhost:4000/api/management-users');
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
        const res = await fetch('http://localhost:4001/api/roles');
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
        const res = await fetch(`http://localhost:4001/api/management-users/${editingUser.id}`, {
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
        
        const res = await fetch('http://localhost:4001/api/management-users', {
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

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const res = await fetch(`http://localhost:4001/api/management-users/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete user');
        
        // Refresh the users list from backend to ensure immediate display
        await fetchUsers();
        toast({ title: 'User Deleted', description: 'User account deleted successfully' });
      } catch (err) {
        toast({ title: 'Error', description: 'Failed to delete user', variant: 'destructive' });
      }
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
    <div className="p-6">
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
                        <Button size="sm" variant="outline" onClick={() => handleDelete(user.id)}>
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User' : 'Add User'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="username">User Name *</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Enter user name"
                className="border-primary/30 focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select value={formData.role} onValueChange={val => setFormData({ ...formData, role: val })}>
                <SelectTrigger className="border-primary/30 focus:border-primary">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter password"
                className="border-primary/30 focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password *</Label>
              <Input
                id="confirm-password"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Re-enter password"
                className="border-primary/30 focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={val => setFormData({ ...formData, status: val as 'Active' | 'Inactive' })}>
                <SelectTrigger className="border-primary/30 focus:border-primary">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90">
              {editingUser ? 'Update User' : 'Add User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
