import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Plus, Search, Edit2, Trash2, Users, User, Shield, Activity, UserCheck, X } from 'lucide-react';
import usePageTitle from '@/hooks/usePageTitle';

interface User {
  id: string;
  username: string;
  role: string;
  password: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

const AddUser: React.FC = () => {
  // Set page title
  usePageTitle();

  const [users, setUsers] = useState<User[]>(() => {
    const stored = localStorage.getItem('users');
    return stored ? JSON.parse(stored) : [];
  });
  useEffect(() => {
    localStorage.setItem('users', JSON.stringify(users));
  }, [users]);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    role: '',
    password: '',
    confirmPassword: '',
    status: 'Active' as 'Active' | 'Inactive',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('userRoles');
    setRoles(stored ? JSON.parse(stored) : []);
  }, []);

  const handleSubmit = () => {
    if (!formData.username || !formData.role || !formData.password || !formData.confirmPassword) {
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    if (editingUser) {
      const updatedUsers = users.map(u =>
        u.id === editingUser.id ? { ...u, ...formData, password: formData.password, status: formData.status } : u
      );
      setUsers(updatedUsers);
      toast({ title: 'User Updated', description: 'User details updated successfully' });
    } else {
      const newUser: User = {
        id: (users.length + 1).toString(),
        username: formData.username,
        role: formData.role,
        password: formData.password,
        status: formData.status,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setUsers([...users, newUser]);
      toast({ title: 'User Added', description: 'New user account created successfully' });
    }
    setShowAddDialog(false);
    setEditingUser(null);
    setFormData({ username: '', role: '', password: '', confirmPassword: '', status: 'Active' });
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

  const confirmDelete = () => {
    if (!userToDelete) return;
    
    setUsers(users.filter(u => u.id !== userToDelete.id));
    setShowDeleteDialog(false);
    setUserToDelete(null);
    toast({ title: 'User Deleted', description: 'User account deleted successfully' });
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <Button onClick={() => setShowAddDialog(true)} className="bg-gradient-medical">
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
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
                        <Button size="sm" variant="outline" onClick={() => handleEdit(user)} className="action-btn-lead action-btn-edit h-8 w-8 sm:h-9 sm:w-9 p-0">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDelete(user)} className="action-btn-lead action-btn-delete h-8 w-8 sm:h-9 sm:w-9 p-0">
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md w-[95vw] sm:w-full">
          <DialogHeader className="text-center">
            <DialogTitle className="text-destructive text-lg sm:text-xl">Delete User Account</DialogTitle>
            <DialogDescription className="text-center text-sm sm:text-base">
              Are you sure you want to delete user <strong>{userToDelete?.username}</strong> (ID: {userToDelete?.id})?
              <br />
              <br />
              <div className="text-left bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">Username:</span>
                  <span>{userToDelete?.username}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-purple-600" />
                  <span className="font-medium">Role:</span>
                  <span>{userToDelete?.role}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-green-600" />
                  <span className="font-medium">Status:</span>
                  <span>{userToDelete?.status}</span>
                </div>
              </div>
              <br />
              <span className="text-destructive font-medium">This action cannot be undone.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
              className="w-full sm:w-auto"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmDelete}
              className="w-full sm:w-auto"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddUser;
