import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Trash2, RotateCcw, Search, Eye, Users, Calendar, Filter } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { DatabaseService } from '@/services/databaseService';

interface Doctor {
  id: string;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  specialization?: string;
  department?: string;
  join_date?: string;
  joinDate?: string;
  photo?: string;
  deletedAt: string;
  deletedBy: string;
}

const DeletedDoctors: React.FC = () => {
  const [deletedDoctors, setDeletedDoctors] = useState<Doctor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [deletedByFilter, setDeletedByFilter] = useState('');
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeletedDoctors();
  }, []);

  useEffect(() => {
    filterDoctors();
  }, [deletedDoctors, searchTerm, dateFilter, deletedByFilter]);

  const loadDeletedDoctors = async () => {
    try {
      setLoading(true);
      const doctors = await DatabaseService.getDeletedDoctors();
      console.log('Loaded deleted doctors:', doctors);
      setDeletedDoctors(doctors);
    } catch (error) {
      console.error('Error loading deleted doctors:', error);
      toast({
        title: "Error",
        description: "Failed to load deleted doctors. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterDoctors = () => {
    let filtered = deletedDoctors;
    if (searchTerm) {
      filtered = filtered.filter(doctor =>
        doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doctor.phone && doctor.phone.includes(searchTerm))
      );
    }
    if (dateFilter) {
      filtered = filtered.filter(doctor => {
        const deletedDate = format(new Date(doctor.deletedAt), 'yyyy-MM-dd');
        return deletedDate === dateFilter;
      });
    }
    if (deletedByFilter && deletedByFilter !== 'all') {
      filtered = filtered.filter(doctor => 
        doctor.deletedBy.toLowerCase().includes(deletedByFilter.toLowerCase())
      );
    }
    setFilteredDoctors(filtered);
    setCurrentPage(1);
  };

  const restoreDoctor = async (doctorId: string) => {
    try {
      await DatabaseService.restoreDoctor(doctorId);
      await loadDeletedDoctors(); // Refresh the list
      toast({
        title: "Doctor Restored",
        description: `Doctor has been restored successfully.`,
      });
    } catch (error) {
      console.error('Error restoring doctor:', error);
      toast({
        title: "Error",
        description: "Failed to restore doctor. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (date: string) => {
    return format(new Date(date), 'dd/MM/yyyy');
  };

  const getDeletedByOptions = () => {
    const uniqueDeletedBy = [...new Set(deletedDoctors.map(d => d.deletedBy))];
    return uniqueDeletedBy.sort();
  };

  const totalPages = Math.ceil(filteredDoctors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDoctors = filteredDoctors.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-lg">Loading deleted doctors...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-destructive rounded-lg">
            <Trash2 className="w-6 h-6 text-destructive-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Deleted Doctors</h1>
          </div>
        </div>
      </div>
      <Card className="mb-6 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name, ID, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-filter">Date Deleted</Label>
              <Input
                id="date-filter"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deleted-by">Deleted By</Label>
              <select
                id="deleted-by"
                value={deletedByFilter}
                onChange={e => setDeletedByFilter(e.target.value)}
                className="w-full border rounded px-2 py-2"
              >
                <option value="all">All users</option>
                {getDeletedByOptions().map((deletedBy) => (
                  <option key={deletedBy} value={deletedBy}>{deletedBy}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Clear Filters</Label>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setDateFilter('');
                  setDeletedByFilter('');
                }}
                className="w-full"
              >
                Clear All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Deleted Doctors ({filteredDoctors.length})</span>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>Page {currentPage} of {totalPages}</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredDoctors.length === 0 ? (
            <div className="text-center py-12">
              <Trash2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No deleted doctors found</h3>
              <p className="text-muted-foreground">
                {searchTerm || dateFilter || deletedByFilter 
                  ? 'Try adjusting your search criteria'
                  : 'No doctors have been deleted yet'
                }
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center">S No</TableHead>
                      <TableHead className="text-center">Doctor ID</TableHead>
                      <TableHead className="text-center">Name</TableHead>
                      <TableHead className="text-center">Phone</TableHead>
                      <TableHead className="text-center">Date Deleted</TableHead>
                      <TableHead className="text-center">Deleted By</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentDoctors.map((doctor, idx) => (
                      <TableRow key={doctor.id} className="hover:bg-muted/50">
                        <TableCell className="text-center">{(currentPage - 1) * itemsPerPage + idx + 1}</TableCell>
                        <TableCell className="font-medium text-center">{doctor.id}</TableCell>
                        <TableCell className="font-medium text-center">{doctor.name}</TableCell>
                        <TableCell className="text-center">{doctor.phone}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center">
                            <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                            {formatDate(doctor.deletedAt)}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{doctor.deletedBy}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="destructive">Deleted</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Doctor Details - {doctor.name}</DialogTitle>
                                  <DialogDescription>
                                    Complete information for deleted doctor {doctor.id}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium">Name:</label>
                                      <p className="text-sm text-muted-foreground">{doctor.name}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Specialization:</label>
                                      <p className="text-sm text-muted-foreground">{doctor.specialization || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Phone:</label>
                                      <p className="text-sm text-muted-foreground">{doctor.phone}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Email:</label>
                                      <p className="text-sm text-muted-foreground">{doctor.email || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Department:</label>
                                      <p className="text-sm text-muted-foreground">{doctor.department || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Joining Date:</label>
                                      <p className="text-sm text-muted-foreground">{doctor.joinDate || doctor.join_date ? formatDate(doctor.joinDate || doctor.join_date!) : 'N/A'}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Deleted Date:</label>
                                      <p className="text-sm text-muted-foreground">{formatDate(doctor.deletedAt)}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Deleted By:</label>
                                      <p className="text-sm text-muted-foreground">{doctor.deletedBy}</p>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Address:</label>
                                    <p className="text-sm text-muted-foreground">{doctor.address || 'N/A'}</p>
                                  </div>
                                  {doctor.photo && (
                                    <div>
                                      <label className="text-sm font-medium">Photo:</label>
                                      <img src={doctor.photo} alt={doctor.name} className="w-24 h-24 rounded-full object-cover mt-2" />
                                    </div>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-success hover:text-success hover:bg-success/10"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Restore Doctor?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will restore {doctor.name} ({doctor.id}) back to the active doctor list.
                                    The doctor will be available for normal operations again.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => restoreDoctor(doctor.id)}
                                    className="bg-success text-success-foreground hover:bg-success/90"
                                  >
                                    Restore Doctor
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
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredDoctors.length)} of {filteredDoctors.length} entries
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DeletedDoctors;
