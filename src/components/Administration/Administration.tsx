
import React, { useEffect, useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Users, UserCheck, Activity, Pencil, Trash2, TrendingUp, Clock, RefreshCw, Download, Plus, Search, Eye, Edit2, Filter, X, EyeOff, Edit, UserPlus, Shield, Lock } from 'lucide-react';
import '@/styles/global-crm-design.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

interface User {
	id: number;
	username: string;
	role: string;
	password?: string;
	status: string;
	createdAt: string;
}

// Function to format date as DD/MM/YYYY
const formatDateDisplay = (dateString: string) => {
	if (!dateString) return 'Not Set';
	
	try {
		const date = new Date(dateString);
		if (isNaN(date.getTime())) return 'Invalid Date';
		
		const day = date.getDate().toString().padStart(2, '0');
		const month = (date.getMonth() + 1).toString().padStart(2, '0');
		const year = date.getFullYear();
		
		return `${day}/${month}/${year}`;
	} catch (error) {
		return 'Invalid Date';
	}
};

const Administration: React.FC = () => {
	usePageTitle();
	const [users, setUsers] = useState<User[]>([]);
	const [roles, setRoles] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState('');
	const [statusFilter, setStatusFilter] = useState('All');
	const [editUser, setEditUser] = useState<User | null>(null);
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [addDialogOpen, setAddDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [userToDelete, setUserToDelete] = useState<User | null>(null);
	const [showPassword, setShowPassword] = useState(false);
	const [showAddPassword, setShowAddPassword] = useState(false);
	const [formData, setFormData] = useState({
		username: '',
		role: '',
		password: '',
		status: 'Active'
	});
	const [addFormData, setAddFormData] = useState({
		username: '',
		role: '',
		password: '',
		status: 'Active'
	});

	useEffect(() => {
		loadUsers();
		loadRoles();
	}, []);

	const loadUsers = () => {
		setLoading(true);
		// Fetch users from backend using .env API URL
		const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:4000';
		fetch(`${apiUrl}/api/management-users`)
			.then(res => res.json())
			.then(data => {
				setUsers(data);
				setLoading(false);
			})
			.catch(() => setLoading(false));
	};

	const loadRoles = async () => {
		try {
			const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:4000';
			const res = await fetch(`${apiUrl}/api/roles`);
			const data = await res.json();
			setRoles(data);
		} catch (error) {
			console.error('Error fetching roles:', error);
		}
	};

	// Handle edit user button click
	const handleEditUser = (user: User) => {
		setEditUser(user);
		setFormData({
			username: user.username,
			role: user.role,
			password: '', // Don't pre-fill password for security
			status: user.status
		});
		setEditDialogOpen(true);
	};

	// Handle add user button click
	const handleAddUser = () => {
		setAddFormData({
			username: '',
			role: '',
			password: '',
			status: 'Active'
		});
		setAddDialogOpen(true);
	};

	// Handle add user API call
	const handleCreateUser = async () => {
		const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:4000';
		try {
			const response = await fetch(`${apiUrl}/api/management-users`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(addFormData),
			});

			if (response.ok) {
				toast({
					title: "Success",
					description: "User created successfully",
				});
				setAddDialogOpen(false);
				loadUsers(); // Reload users
			} else {
				throw new Error('Failed to create user');
			}
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to create user. Please try again.",
				variant: "destructive",
			});
		}
	};

	// Handle update user API call
	const handleUpdateUser = async () => {
		if (!editUser) return;
		
		const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:4000';
		try {
			const response = await fetch(`${apiUrl}/api/management-users/${editUser.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(formData),
			});

			if (response.ok) {
				toast({
					title: "Success",
					description: "User updated successfully",
				});
				setEditDialogOpen(false);
				loadUsers(); // Reload users
			} else {
				throw new Error('Failed to update user');
			}
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to update user. Please try again.",
				variant: "destructive",
			});
		}
	};

	// Handle delete user button click
	const handleDeleteUser = (user: User) => {
		setUserToDelete(user);
		setDeleteDialogOpen(true);
	};

	// Handle delete user API call
	const confirmDeleteUser = async () => {
		if (!userToDelete) return;
		
		const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:4000';
		try {
			const response = await fetch(`${apiUrl}/api/management-users/${userToDelete.id}`, {
				method: 'DELETE',
			});

			if (response.ok) {
				toast({
					title: "Success",
					description: "User deleted successfully",
				});
				setDeleteDialogOpen(false);
				loadUsers(); // Reload users
			} else {
				throw new Error('Failed to delete user');
			}
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to delete user. Please try again.",
				variant: "destructive",
			});
		}
	};

	// Filter users based on search term and status
	const filteredUsers = users.filter(user => {
		const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
							 user.role.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesStatus = statusFilter === 'All' || user.status === statusFilter;
		return matchesSearch && matchesStatus;
	});

	const getStatusBadge = (status: string) => {
		switch (status.toLowerCase()) {
			case 'active':
				return 'bg-green-100 text-green-800 hover:bg-green-200';
			case 'inactive':
				return 'bg-red-100 text-red-800 hover:bg-red-200';
			default:
				return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
		}
	};

	const exportToCSV = () => {
		const headers = ['S No', 'Username', 'Role', 'Status', 'Created Date'];
		const csvData = filteredUsers.map((user, index) => [
			index + 1,
			user.username,
			user.role,
			user.status,
			user.createdAt
		]);

		const csvContent = [headers, ...csvData]
			.map(row => row.join(','))
			.join('\n');

		const blob = new Blob([csvContent], { type: 'text/csv' });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'users-list.csv';
		a.click();
		window.URL.revokeObjectURL(url);
	};

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
								<h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">User Management</h1>
							</div>
						</div>
					
						<div className="flex flex-row sm:flex-row gap-1 sm:gap-3 w-full sm:w-auto">
							<Button 
								onClick={() => {
									console.log('🔄 Manual refresh triggered');
									loadUsers();
								}}
								disabled={loading}
								className="global-btn flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
							>
								<RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 ${loading ? 'animate-spin' : ''}`} />
								<span className="hidden sm:inline">Refresh</span>
								<span className="sm:hidden">↻</span>
							</Button>
							<Button 
								onClick={exportToCSV}
								className="global-btn flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
							>
								<Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
								<span className="hidden sm:inline">Export CSV</span>
								<span className="sm:hidden">CSV</span>
							</Button>
							<Button 
								onClick={handleAddUser}
								className="global-btn flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
							>
								<Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
								<span className="hidden sm:inline">Add User</span>
								<span className="sm:hidden">+</span>
							</Button>
						</div>
					</div>
				</div>

				{/* Stats Cards */}
				<div className="crm-stats-grid">
					{/* Total Users Card */}
					<Card className="crm-stat-card crm-stat-card-blue">
						<CardContent className="relative p-3 sm:p-4 lg:p-6">
							<div className="flex items-start justify-between">
								<div className="flex-1 min-w-0">
									<p className="text-xs sm:text-sm font-medium text-blue-700 mb-1 truncate">Total Users</p>
									<p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-900 mb-1">{filteredUsers.length}</p>
									<div className="flex items-center text-xs text-blue-600">
										<TrendingUp className="w-3 h-3 mr-1 flex-shrink-0" />
										<span className="truncate">Registered</span>
									</div>
								</div>
								<div className="crm-stat-icon crm-stat-icon-blue">
									<Users className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
								</div>
							</div>
						</CardContent>
					</Card>
					
					{/* Active Users Card */}
					<Card className="crm-stat-card crm-stat-card-green">
						<CardContent className="relative p-3 sm:p-4 lg:p-6">
							<div className="flex items-start justify-between">
								<div className="flex-1 min-w-0">
									<p className="text-xs sm:text-sm font-medium text-green-700 mb-1 truncate">Active Users</p>
									<p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-900 mb-1">
										{filteredUsers.filter(u => u.status === 'Active').length}
									</p>
									<div className="flex items-center text-xs text-green-600">
										<UserCheck className="w-3 h-3 mr-1 flex-shrink-0" />
										<span className="truncate">Online</span>
									</div>
								</div>
								<div className="crm-stat-icon crm-stat-icon-green">
									<UserCheck className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
								</div>
							</div>
						</CardContent>
					</Card>
					
					{/* Inactive Users Card */}
					<Card className="crm-stat-card crm-stat-card-red">
						<CardContent className="relative p-3 sm:p-4 lg:p-6">
							<div className="flex items-start justify-between">
								<div className="flex-1 min-w-0">
									<p className="text-xs sm:text-sm font-medium text-red-700 mb-1 truncate">Inactive Users</p>
									<p className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-900 mb-1">
										{filteredUsers.filter(u => u.status === 'Inactive').length}
									</p>
									<div className="flex items-center text-xs text-red-600">
										<Activity className="w-3 h-3 mr-1 flex-shrink-0" />
										<span className="truncate">Offline</span>
									</div>
								</div>
								<div className="crm-stat-icon crm-stat-icon-red">
									<Activity className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
								</div>
							</div>
						</CardContent>
					</Card>
					
					{/* Last Updated Card */}
					<Card className="crm-stat-card crm-stat-card-orange">
						<CardContent className="relative p-3 sm:p-4 lg:p-6">
							<div className="flex items-start justify-between">
								<div className="flex-1 min-w-0">
									<p className="text-xs sm:text-sm font-medium text-orange-700 mb-1 truncate">Last Updated</p>
									<p className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-900 mb-1">
										{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}
									</p>
									<div className="flex items-center text-xs text-orange-600">
										<Clock className="w-3 h-3 mr-1 flex-shrink-0" />
										<span className="truncate">Today</span>
									</div>
								</div>
								<div className="crm-stat-icon crm-stat-icon-orange">
									<Clock className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
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
									placeholder="Search users by name, role..."
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
									<SelectItem value="Active">Active</SelectItem>
									<SelectItem value="Inactive">Inactive</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</div>

				{/* Users Table */}
				<Card className="crm-table-container">
					<CardHeader className="crm-table-header">
						<div className="crm-table-title">
							<Users className="crm-table-title-icon" />
							<span className="crm-table-title-text">Users List ({filteredUsers.length})</span>
							<span className="crm-table-title-text-mobile">Users ({filteredUsers.length})</span>
						</div>
					</CardHeader>
					<CardContent className="p-0">
				
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
										<Users className="h-3 w-3 sm:h-4 sm:w-4" />
										<span>Username</span>
									</div>
								</TableHead>
								<TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
									<div className="flex items-center justify-center space-x-1 sm:space-x-2">
										<UserCheck className="h-3 w-3 sm:h-4 sm:w-4" />
										<span>Role</span>
									</div>
								</TableHead>
								<TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
									<div className="flex items-center justify-center space-x-1 sm:space-x-2">
										<Eye className="h-3 w-3 sm:h-4 sm:w-4" />
										<span>Password</span>
									</div>
								</TableHead>
								<TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
									<div className="flex items-center justify-center space-x-1 sm:space-x-2">
										<Activity className="h-3 w-3 sm:h-4 sm:w-4" />
										<span>Status</span>
									</div>
								</TableHead>
								<TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
									<div className="flex items-center justify-center space-x-1 sm:space-x-2">
										<Clock className="h-3 w-3 sm:h-4 sm:w-4" />
										<span>Created Date</span>
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
							{loading ? (
								<TableRow>
									<TableCell colSpan={7} className="text-center py-12">
										<div className="flex flex-col items-center">
											<RefreshCw className="h-8 w-8 text-gray-400 animate-spin mb-2" />
											<span className="text-gray-500">Loading users...</span>
										</div>
									</TableCell>
								</TableRow>
							) : filteredUsers.length === 0 ? (
								<TableRow>
									<TableCell colSpan={7} className="text-center py-12 bg-white">
										<Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
										<h3 className="text-lg font-medium text-gray-600 mb-2">No users found</h3>
										<p className="text-sm text-gray-500">
											No users match your search criteria. Try adjusting your filters.
										</p>
									</TableCell>
								</TableRow>
							) : (
								filteredUsers.map((user, index) => (
									<TableRow key={user.id} className="hover:bg-gray-50 border-b">
										<TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm font-medium text-gray-900 whitespace-nowrap">
											{index + 1}
										</TableCell>
										<TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm font-medium text-gray-900 whitespace-nowrap">
											{user.username}
										</TableCell>
										<TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm text-gray-600 whitespace-nowrap">
											{user.role}
										</TableCell>
										<TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm text-gray-600 whitespace-nowrap">
											<span className="font-mono text-xs">
												{user.password || <span className="text-gray-400">Not Set</span>}
											</span>
										</TableCell>
										<TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center whitespace-nowrap">
											<Badge className={`${getStatusBadge(user.status)} text-xs`}>
												{user.status.charAt(0).toUpperCase() + user.status.slice(1)}
											</Badge>
										</TableCell>
										<TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm text-gray-600 whitespace-nowrap">
											{formatDateDisplay(user.createdAt)}
										</TableCell>
										<TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center whitespace-nowrap">
											<div className="action-buttons-container">
												<Button
													variant="outline"
													size="sm"
													onClick={() => handleEditUser(user)}
													className="action-btn-lead action-btn-edit h-8 w-8 sm:h-9 sm:w-9 p-0"
													title="Edit User"
												>
													<Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
												</Button>
												<Button
													variant="outline"
													size="sm"
													onClick={() => handleDeleteUser(user)}
													className="action-btn-lead action-btn-delete h-8 w-8 sm:h-9 sm:w-9 p-0"
													title="Delete User"
												>
													<Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
					</div>
					</CardContent>
				</Card>
			</div>

			{/* Edit User Dialog */}
			<Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
				<DialogContent className="crm-modal-container">
					<DialogHeader className="editpopup form dialog-header">
						<div className="editpopup form icon-title-container">
							<div className="editpopup form dialog-icon">
								<Edit className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
							</div>
							<div className="editpopup form title-description">
								<DialogTitle className="editpopup form dialog-title">
									Edit User
								</DialogTitle>
								<DialogDescription className="editpopup form dialog-description">
									Update user information. Click save when you're done.
								</DialogDescription>
							</div>
						</div>
					</DialogHeader>
					
					<form
						onSubmit={e => {
							e.preventDefault();
							handleUpdateUser();
						}}
						className="editpopup form crm-edit-form-content"
					>
						<div className="editpopup form crm-edit-form-group">
							<Label htmlFor="username" className="editpopup form crm-edit-form-label flex items-center gap-2">
								<UserCheck className="h-4 w-4" />
								Username
							</Label>
							<Input
								id="username"
								value={formData.username}
								onChange={(e) => setFormData({ ...formData, username: e.target.value })}
								className="editpopup form crm-edit-form-input"
							/>
						</div>
						
						<div className="editpopup form crm-edit-form-group">
							<Label htmlFor="role" className="editpopup form crm-edit-form-label flex items-center gap-2">
								<Shield className="h-4 w-4" />
								Role
							</Label>
							<Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
								<SelectTrigger className="editpopup form crm-edit-form-select">
									<SelectValue placeholder="Select role" />
								</SelectTrigger>
								<SelectContent>
									{roles.map((role) => (
										<SelectItem key={role.id} value={role.name || role.role_name}>
											{role.name || role.role_name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						
						<div className="editpopup form crm-edit-form-group">
							<Label htmlFor="password" className="editpopup form crm-edit-form-label flex items-center gap-2">
								<Lock className="h-4 w-4" />
								Password
							</Label>
							<div className="relative">
								<Input
									id="password"
									type={showPassword ? "text" : "password"}
									value={formData.password}
									onChange={(e) => setFormData({ ...formData, password: e.target.value })}
									className="editpopup form crm-edit-form-input pr-10"
									placeholder="Enter new password (leave blank to keep current)"
								/>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
									onClick={() => setShowPassword(!showPassword)}
								>
									{showPassword ? (
										<EyeOff className="h-4 w-4 text-gray-400" />
									) : (
										<Eye className="h-4 w-4 text-gray-400" />
									)}
								</Button>
							</div>
						</div>
						
						<div className="editpopup form crm-edit-form-group">
							<Label htmlFor="status" className="editpopup form crm-edit-form-label flex items-center gap-2">
								<Activity className="h-4 w-4" />
								Status
							</Label>
							<Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
								<SelectTrigger className="editpopup form crm-edit-form-select">
									<SelectValue placeholder="Select status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="Active">Active</SelectItem>
									<SelectItem value="Inactive">Inactive</SelectItem>
								</SelectContent>
							</Select>
						</div>
						
						<DialogFooter className="editpopup form dialog-footer flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
							<Button 
								type="button" 
								variant="outline" 
								onClick={() => setEditDialogOpen(false)}
								className="editpopup form footer-button-cancel w-full sm:w-auto modern-btn modern-btn-secondary"
							>
								<X className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
								Cancel
							</Button>
							<Button 
								type="submit"
								className="editpopup form footer-button-save w-full sm:w-auto global-btn"
							>
								<Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
								Save Changes
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Add User Dialog */}
			<Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
				<DialogContent className="crm-modal-container">
					<DialogHeader className="editpopup form dialog-header">
						<div className="editpopup form icon-title-container">
							<div className="editpopup form dialog-icon">
								<UserPlus className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
							</div>
							<div className="editpopup form title-description">
								<DialogTitle className="editpopup form dialog-title">
									Add New User
								</DialogTitle>
								<DialogDescription className="editpopup form dialog-description">
									Create a new user account. Fill in all required information.
								</DialogDescription>
							</div>
						</div>
					</DialogHeader>
					
					<form
						onSubmit={e => {
							e.preventDefault();
							handleCreateUser();
						}}
						className="editpopup form crm-edit-form-content"
					>
						<div className="editpopup form crm-edit-form-group">
							<Label htmlFor="add-username" className="editpopup form crm-edit-form-label flex items-center gap-2">
								<UserCheck className="h-4 w-4" />
								Username <span className="text-red-500">*</span>
							</Label>
							<Input
								id="add-username"
								value={addFormData.username}
								onChange={(e) => setAddFormData({ ...addFormData, username: e.target.value })}
								className="editpopup form crm-edit-form-input"
								placeholder="Enter username"
								required
							/>
						</div>
						
						<div className="editpopup form crm-edit-form-group">
							<Label htmlFor="add-role" className="editpopup form crm-edit-form-label flex items-center gap-2">
								<Shield className="h-4 w-4" />
								Role <span className="text-red-500">*</span>
							</Label>
							<Select value={addFormData.role} onValueChange={(value) => setAddFormData({ ...addFormData, role: value })}>
								<SelectTrigger className="editpopup form crm-edit-form-select">
									<SelectValue placeholder="Select role" />
								</SelectTrigger>
								<SelectContent>
									{roles.map((role) => (
										<SelectItem key={role.id} value={role.name || role.role_name}>
											{role.name || role.role_name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						
						<div className="editpopup form crm-edit-form-group">
							<Label htmlFor="add-password" className="editpopup form crm-edit-form-label flex items-center gap-2">
								<Lock className="h-4 w-4" />
								Password <span className="text-red-500">*</span>
							</Label>
							<div className="relative">
								<Input
									id="add-password"
									type={showAddPassword ? "text" : "password"}
									value={addFormData.password}
									onChange={(e) => setAddFormData({ ...addFormData, password: e.target.value })}
									className="editpopup form crm-edit-form-input pr-10"
									placeholder="Enter password"
									required
								/>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
									onClick={() => setShowAddPassword(!showAddPassword)}
								>
									{showAddPassword ? (
										<EyeOff className="h-4 w-4 text-gray-400" />
									) : (
										<Eye className="h-4 w-4 text-gray-400" />
									)}
								</Button>
							</div>
						</div>
						
						<div className="editpopup form crm-edit-form-group">
							<Label htmlFor="add-status" className="editpopup form crm-edit-form-label flex items-center gap-2">
								<Activity className="h-4 w-4" />
								Status
							</Label>
							<Select value={addFormData.status} onValueChange={(value) => setAddFormData({ ...addFormData, status: value })}>
								<SelectTrigger className="editpopup form crm-edit-form-select">
									<SelectValue placeholder="Select status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="Active">Active</SelectItem>
									<SelectItem value="Inactive">Inactive</SelectItem>
								</SelectContent>
							</Select>
						</div>
						
						<DialogFooter className="editpopup form dialog-footer flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
							<Button 
								type="button" 
								variant="outline" 
								onClick={() => setAddDialogOpen(false)}
								className="editpopup form footer-button-cancel w-full sm:w-auto modern-btn modern-btn-secondary"
							>
								<X className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
								Cancel
							</Button>
							<Button 
								type="submit"
								className="editpopup form footer-button-save w-full sm:w-auto global-btn"
							>
								<UserPlus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
								Create User
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Delete User Dialog */}
			<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
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
									Are you sure you want to delete user "{userToDelete?.username}"? This action cannot be undone.
								</DialogDescription>
							</div>
						</div>
					</DialogHeader>
					
					<DialogFooter className="editpopup form dialog-footer flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
						<Button 
							type="button" 
							variant="outline" 
							onClick={() => setDeleteDialogOpen(false)}
							className="editpopup form footer-button-cancel w-full sm:w-auto modern-btn modern-btn-secondary"
						>
							<X className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
							Cancel
						</Button>
						<Button 
							type="button" 
							variant="destructive" 
							onClick={confirmDeleteUser}
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

export default Administration;

// export default Administration;
