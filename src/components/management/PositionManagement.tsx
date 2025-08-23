import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Briefcase } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface Position {
  id: string;
  name: string;
  department: string;
  description: string;
  requirements: string;
  salary: string;
  status: 'Active' | 'Inactive';
  createdAt: Date;
}

const PositionManagement: React.FC = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    description: '',
    requirements: '',
    salary: '',
    status: 'Active' as 'Active' | 'Inactive'
  });

  useEffect(() => {
    loadPositions();
  }, []);

  const loadPositions = () => {
    const savedPositions = JSON.parse(localStorage.getItem('positions') || '[]');
    setPositions(savedPositions);
  };

  const generatePositionId = () => {
    const positions = JSON.parse(localStorage.getItem('positions') || '[]');
    const nextId = positions.length + 1;
    return `POS${String(nextId).padStart(3, '0')}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingPosition) {
      // Update existing position
      const updatedPositions = positions.map(pos =>
        pos.id === editingPosition.id
          ? { ...editingPosition, ...formData }
          : pos
      );
      setPositions(updatedPositions);
      localStorage.setItem('positions', JSON.stringify(updatedPositions));
      
      toast({
        title: "Position Updated",
        description: `${formData.name} has been updated successfully.`,
      });
      setEditingPosition(null);
    } else {
      // Add new position
      const newPosition: Position = {
        id: generatePositionId(),
        ...formData,
        createdAt: new Date()
      };
      
      const updatedPositions = [...positions, newPosition];
      setPositions(updatedPositions);
      localStorage.setItem('positions', JSON.stringify(updatedPositions));
      
      toast({
        title: "Position Added",
        description: `${formData.name} has been added successfully.`,
      });
      setIsAddDialogOpen(false);
    }
    
    resetForm();
  };

  const handleEdit = (position: Position) => {
    setEditingPosition(position);
    setFormData({
      name: position.name,
      department: position.department,
      description: position.description,
      requirements: position.requirements,
      salary: position.salary,
      status: position.status
    });
  };

  const handleDelete = (positionId: string) => {
    const updatedPositions = positions.filter(pos => pos.id !== positionId);
    setPositions(updatedPositions);
    localStorage.setItem('positions', JSON.stringify(updatedPositions));
    
    toast({
      title: "Position Deleted",
      description: "Position has been deleted successfully.",
      variant: "destructive",
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      department: '',
      description: '',
      requirements: '',
      salary: '',
      status: 'Active'
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Position Management</h1>
          <p className="text-muted-foreground">Manage job positions and roles</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-medical">
              <Plus className="w-4 h-4 mr-2" />
              Add Position
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Position</DialogTitle>
              <DialogDescription>
                Create a new job position in the system
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Position Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter position name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <Input
                    id="department"
                    placeholder="Enter department"
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter position description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="requirements">Requirements</Label>
                <Textarea
                  id="requirements"
                  placeholder="Enter position requirements"
                  value={formData.requirements}
                  onChange={(e) => handleInputChange('requirements', e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salary">Salary Range</Label>
                  <Input
                    id="salary"
                    placeholder="Enter salary range"
                    value={formData.salary}
                    onChange={(e) => handleInputChange('salary', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-gradient-medical">
                  Add Position
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Positions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Briefcase className="w-5 h-5 mr-2 text-primary" />
            Positions ({positions.length})
          </CardTitle>
          <CardDescription>
            Manage job positions and their details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {positions.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No positions added yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Position ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Salary Range</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {positions.map((position) => (
                    <TableRow key={position.id}>
                      <TableCell className="font-medium">{position.id}</TableCell>
                      <TableCell>{position.name}</TableCell>
                      <TableCell>{position.department}</TableCell>
                      <TableCell>{position.salary || 'Not specified'}</TableCell>
                      <TableCell>
                        <Badge variant={position.status === 'Active' ? 'default' : 'secondary'}>
                          {position.status.charAt(0).toUpperCase() + position.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(position)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Edit Position</DialogTitle>
                                <DialogDescription>
                                  Update position information
                                </DialogDescription>
                              </DialogHeader>
                              {editingPosition && (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="edit-name">Position Name *</Label>
                                      <Input
                                        id="edit-name"
                                        placeholder="Enter position name"
                                        value={formData.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        required
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="edit-department">Department *</Label>
                                      <Input
                                        id="edit-department"
                                        placeholder="Enter department"
                                        value={formData.department}
                                        onChange={(e) => handleInputChange('department', e.target.value)}
                                        required
                                      />
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-description">Description</Label>
                                    <Textarea
                                      id="edit-description"
                                      placeholder="Enter position description"
                                      value={formData.description}
                                      onChange={(e) => handleInputChange('description', e.target.value)}
                                      rows={3}
                                    />
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-requirements">Requirements</Label>
                                    <Textarea
                                      id="edit-requirements"
                                      placeholder="Enter position requirements"
                                      value={formData.requirements}
                                      onChange={(e) => handleInputChange('requirements', e.target.value)}
                                      rows={3}
                                    />
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="edit-salary">Salary Range</Label>
                                      <Input
                                        id="edit-salary"
                                        placeholder="Enter salary range"
                                        value={formData.salary}
                                        onChange={(e) => handleInputChange('salary', e.target.value)}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="edit-status">Status</Label>
                                      <select
                                        id="edit-status"
                                        value={formData.status}
                                        onChange={(e) => handleInputChange('status', e.target.value)}
                                        className="w-full px-3 py-2 border border-input rounded-md bg-background"
                                      >
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                      </select>
                                    </div>
                                  </div>

                                  <div className="flex justify-end space-x-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => {
                                        setEditingPosition(null);
                                        resetForm();
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button type="submit" className="bg-gradient-medical">
                                      Update Position
                                    </Button>
                                  </div>
                                </form>
                              )}
                            </DialogContent>
                          </Dialog>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="action-btn-lead action-btn-delete h-8 w-8 sm:h-9 sm:w-9 p-0">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Position?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the position
                                  "{position.name}" from the system.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(position.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PositionManagement;