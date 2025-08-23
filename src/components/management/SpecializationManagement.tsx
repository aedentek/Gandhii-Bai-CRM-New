import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Stethoscope } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface Specialization {
  id: string;
  name: string;
  description: string;
  requirements: string;
  yearsRequired: number;
  status: 'Active' | 'Inactive';
  createdAt: Date;
}

const SpecializationManagement: React.FC = () => {
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [editingSpecialization, setEditingSpecialization] = useState<Specialization | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    requirements: '',
    yearsRequired: 0,
    status: 'Active' as 'Active' | 'Inactive'
  });

  useEffect(() => {
    loadSpecializations();
  }, []);

  const loadSpecializations = () => {
    const savedSpecializations = JSON.parse(localStorage.getItem('specializations') || '[]');
    setSpecializations(savedSpecializations);
  };

  const generateSpecializationId = () => {
    const specializations = JSON.parse(localStorage.getItem('specializations') || '[]');
    const nextId = specializations.length + 1;
    return `SPEC${String(nextId).padStart(3, '0')}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingSpecialization) {
      // Update existing specialization
      const updatedSpecializations = specializations.map(spec =>
        spec.id === editingSpecialization.id
          ? { ...editingSpecialization, ...formData }
          : spec
      );
      setSpecializations(updatedSpecializations);
      localStorage.setItem('specializations', JSON.stringify(updatedSpecializations));
      
      toast({
        title: "Specialization Updated",
        description: `${formData.name} has been updated successfully.`,
      });
      setEditingSpecialization(null);
    } else {
      // Add new specialization
      const newSpecialization: Specialization = {
        id: generateSpecializationId(),
        ...formData,
        createdAt: new Date()
      };
      
      const updatedSpecializations = [...specializations, newSpecialization];
      setSpecializations(updatedSpecializations);
      localStorage.setItem('specializations', JSON.stringify(updatedSpecializations));
      
      toast({
        title: "Specialization Added",
        description: `${formData.name} has been added successfully.`,
      });
      setIsAddDialogOpen(false);
    }
    
    resetForm();
  };

  const handleEdit = (specialization: Specialization) => {
    setEditingSpecialization(specialization);
    setFormData({
      name: specialization.name,
      description: specialization.description,
      requirements: specialization.requirements,
      yearsRequired: specialization.yearsRequired,
      status: specialization.status
    });
  };

  const handleDelete = (specializationId: string) => {
    const updatedSpecializations = specializations.filter(spec => spec.id !== specializationId);
    setSpecializations(updatedSpecializations);
    localStorage.setItem('specializations', JSON.stringify(updatedSpecializations));
    
    toast({
      title: "Specialization Deleted",
      description: "Specialization has been deleted successfully.",
      variant: "destructive",
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      requirements: '',
      yearsRequired: 0,
      status: 'Active'
    });
  };

  const handleInputChange = (field: string, value: string | number) => {
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
          <h1 className="text-3xl font-bold text-foreground">Medical Specializations</h1>
          <p className="text-muted-foreground">Manage medical specializations and requirements</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-medical">
              <Plus className="w-4 h-4 mr-2" />
              Add Specialization
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Specialization</DialogTitle>
              <DialogDescription>
                Create a new medical specialization
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Specialization Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter specialization name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yearsRequired">Years Required *</Label>
                  <Input
                    id="yearsRequired"
                    type="number"
                    placeholder="Years of training required"
                    value={formData.yearsRequired}
                    onChange={(e) => handleInputChange('yearsRequired', parseInt(e.target.value) || 0)}
                    required
                    min="0"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter specialization description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="requirements">Requirements</Label>
                <Textarea
                  id="requirements"
                  placeholder="Enter specialization requirements"
                  value={formData.requirements}
                  onChange={(e) => handleInputChange('requirements', e.target.value)}
                  rows={3}
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
                  Add Specialization
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Specializations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Stethoscope className="w-5 h-5 mr-2 text-primary" />
            Specializations ({specializations.length})
          </CardTitle>
          <CardDescription>
            Manage medical specializations and their requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          {specializations.length === 0 ? (
            <div className="text-center py-8">
              <Stethoscope className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No specializations added yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Years Required</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {specializations.map((specialization) => (
                    <TableRow key={specialization.id}>
                      <TableCell className="font-medium">{specialization.id}</TableCell>
                      <TableCell>{specialization.name}</TableCell>
                      <TableCell>{specialization.yearsRequired} years</TableCell>
                      <TableCell>
                        <Badge variant={specialization.status === 'Active' ? 'default' : 'secondary'}>
                          {specialization.status.charAt(0).toUpperCase() + specialization.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(specialization)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Edit Specialization</DialogTitle>
                                <DialogDescription>
                                  Update specialization information
                                </DialogDescription>
                              </DialogHeader>
                              {editingSpecialization && (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="edit-name">Specialization Name *</Label>
                                      <Input
                                        id="edit-name"
                                        placeholder="Enter specialization name"
                                        value={formData.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        required
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="edit-yearsRequired">Years Required *</Label>
                                      <Input
                                        id="edit-yearsRequired"
                                        type="number"
                                        placeholder="Years of training required"
                                        value={formData.yearsRequired}
                                        onChange={(e) => handleInputChange('yearsRequired', parseInt(e.target.value) || 0)}
                                        required
                                        min="0"
                                      />
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-description">Description</Label>
                                    <Textarea
                                      id="edit-description"
                                      placeholder="Enter specialization description"
                                      value={formData.description}
                                      onChange={(e) => handleInputChange('description', e.target.value)}
                                      rows={3}
                                    />
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-requirements">Requirements</Label>
                                    <Textarea
                                      id="edit-requirements"
                                      placeholder="Enter specialization requirements"
                                      value={formData.requirements}
                                      onChange={(e) => handleInputChange('requirements', e.target.value)}
                                      rows={3}
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

                                  <div className="flex justify-end space-x-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => {
                                        setEditingSpecialization(null);
                                        resetForm();
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button type="submit" className="bg-gradient-medical">
                                      Update Specialization
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
                                <AlertDialogTitle>Delete Specialization?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the specialization
                                  "{specialization.name}" from the system.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(specialization.id)}
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

export default SpecializationManagement;