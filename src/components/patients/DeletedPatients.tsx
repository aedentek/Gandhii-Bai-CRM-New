import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { 
  RotateCcw, 
  Search, 
  Users, 
  Calendar as CalendarIcon, 
  Filter, 
  UserMinus, 
  Trash2, 
  Clock,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Heart,
  Activity,
  UserX
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { DatabaseService } from '@/services/databaseService';
import LoadingScreen from '@/components/shared/LoadingScreen';

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  email: string;
  address: string;
  emergencyContact: string;
  medicalHistory: string;
  admissionDate: Date;
  status: string;
  attenderName: string;
  attenderPhone: string;
  deletedAt: Date;
  deletedBy: string;
  photo?: string;
}

const DeletedPatients: React.FC = () => {
  const [deletedPatients, setDeletedPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateFilter, setDateFilter] = useState('');
  const [deletedByFilter, setDeletedByFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [restorePatient, setRestorePatient] = useState<Patient | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);

  // Set initial page when component mounts
  useEffect(() => {
    setCurrentPage(1);
  }, []);

  useEffect(() => {
    loadDeletedPatients();
  }, [selectedDate]);

  useEffect(() => {
    filterPatients();
  }, [deletedPatients, searchTerm, dateFilter, deletedByFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filteredPatients]);

  const loadDeletedPatients = async () => {
    try {
      setLoading(true);
      // Try to get from localStorage (fallback implementation)
      const deleted = JSON.parse(localStorage.getItem('deletedPatients') || '[]');
      const updatedDeleted = deleted.map((patient: any) => ({
        ...patient,
        deletedBy: patient.deletedBy || patient.deleted_by || 'System',
        deletedAt: patient.deletedAt || patient.deleted_at || new Date(),
        admissionDate: new Date(patient.admissionDate),
      }));
      setDeletedPatients(updatedDeleted);
    } catch (error) {
      console.error('Error fetching deleted patients:', error);
      setDeletedPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const filterPatients = () => {
    let filtered = [...deletedPatients];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(patient =>
        patient.name.toLowerCase().includes(searchLower) ||
        patient.id.toLowerCase().includes(searchLower) ||
        patient.phone.toLowerCase().includes(searchLower) ||
        patient.email.toLowerCase().includes(searchLower)
      );
    }

    if (dateFilter) {
      filtered = filtered.filter(patient => {
        const deletedDate = new Date(patient.deletedAt);
        const filterDate = new Date(dateFilter);
        return deletedDate.toDateString() === filterDate.toDateString();
      });
    }

    if (deletedByFilter) {
      filtered = filtered.filter(patient => patient.deletedBy === deletedByFilter);
    }

    setFilteredPatients(filtered);
  };

  const handleRestore = (patient: Patient) => {
    setRestorePatient(patient);
    setShowRestoreConfirm(true);
  };

  const confirmRestore = async () => {
    if (!restorePatient) return;

    try {
      // Try to restore patient (fallback implementation)
      const currentDeleted = JSON.parse(localStorage.getItem('deletedPatients') || '[]');
      const updatedDeleted = currentDeleted.filter((p: any) => p.id !== restorePatient.id);
      localStorage.setItem('deletedPatients', JSON.stringify(updatedDeleted));

      // Add back to active patients
      const currentPatients = JSON.parse(localStorage.getItem('patients') || '[]');
      const restoredPatient = { ...restorePatient, status: 'Active' };
      delete restoredPatient.deletedAt;
      delete restoredPatient.deletedBy;
      currentPatients.push(restoredPatient);
      localStorage.setItem('patients', JSON.stringify(currentPatients));

      toast({
        title: "Success",
        description: `${restorePatient.name} has been restored successfully.`,
      });

      loadDeletedPatients();
      setShowRestoreConfirm(false);
      setRestorePatient(null);
    } catch (error) {
      console.error('Error restoring patient:', error);
      toast({
        title: "Error",
        description: "Failed to restore patient. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getDeletedByOptions = () => {
    const options = new Set<string>();
    deletedPatients.forEach(patient => {
      if (patient.deletedBy) {
        options.add(patient.deletedBy);
      }
    });
    return Array.from(options);
  };

  const formatDate = (date: Date | string) => {
    try {
      const d = new Date(date);
      return format(d, 'MMM dd, yyyy');
    } catch {
      return 'Invalid Date';
    }
  };

  const exportToExcel = () => {
    const exportData = filteredPatients.map(patient => ({
      'Patient ID': patient.id,
      'Name': patient.name,
      'Age': patient.age,
      'Gender': patient.gender,
      'Phone': patient.phone,
      'Email': patient.email,
      'Address': patient.address,
      'Deleted Date': formatDate(patient.deletedAt),
      'Deleted By': patient.deletedBy,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Deleted Patients');
    XLSX.writeFile(wb, `deleted-patients-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);

    toast({
      title: "Export Successful",
      description: "Deleted patients data exported to Excel successfully.",
    });
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPatients = filteredPatients.slice(startIndex, endIndex);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Professional Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 hover:shadow-md hover:scale-[1.01] transition-all duration-300 cursor-pointer">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center transition-all duration-300 hover:bg-red-700 hover:scale-110">
                <UserX className="w-6 h-6 text-white transition-transform duration-300 hover:rotate-3" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 transition-colors duration-300 hover:text-red-600">Deleted Patients</h1>
                <p className="text-sm text-gray-600 mt-1">
                  
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button 
                onClick={exportToExcel}
                className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:shadow-lg hover:scale-105"
              >
                <Download className="h-4 w-4" />
                <span className="font-medium">Export Excel</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Professional Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-red-500"></div>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors duration-300">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Total Deleted</p>
                  <p className="text-2xl font-bold text-gray-900 group-hover:text-red-600 transition-colors duration-300">{deletedPatients.length}</p>
                </div>
              </div>
              <div className="mt-4 h-1 bg-red-200 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-orange-500"></div>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors duration-300">
                  <Filter className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Filtered</p>
                  <p className="text-2xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors duration-300">{filteredPatients.length}</p>
                </div>
              </div>
              <div className="mt-4 h-1 bg-orange-200 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500"></div>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors duration-300">
                  <CalendarIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors duration-300">This Month</p>
                  <p className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                    {deletedPatients.filter(p => {
                      const deletedDate = new Date(p.deletedAt);
                      const today = new Date();
                      return deletedDate.getMonth() === today.getMonth() && deletedDate.getFullYear() === today.getFullYear();
                    }).length}
                  </p>
                </div>
              </div>
              <div className="mt-4 h-1 bg-blue-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-purple-500"></div>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors duration-300">
                  <RotateCcw className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Can Restore</p>
                  <p className="text-2xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors duration-300">{filteredPatients.length}</p>
                </div>
              </div>
              <div className="mt-4 h-1 bg-purple-200 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 border-gray-200 hover:border-gray-300 transition-colors duration-300"
              />
            </div>
            
            <div className="relative">
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="h-12 border-gray-200 hover:border-gray-300 transition-colors duration-300"
              />
            </div>

            <div className="relative">
              <select
                className="w-full h-12 border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 hover:border-gray-300 transition-colors duration-300"
                value={deletedByFilter}
                onChange={(e) => setDeletedByFilter(e.target.value)}
              >
                <option value="">All Users</option>
                {getDeletedByOptions().map((person) => (
                  <option key={person} value={person}>
                    {person}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={() => {
                  setSearchTerm('');
                  setDateFilter('');
                  setDeletedByFilter('');
                }}
                variant="outline"
                className="h-12 border-gray-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition-all duration-300"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Patients Table */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Deleted Patient Records
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-300">
                  {filteredPatients.length} deleted
                </Badge>
                <Badge variant="outline">
                  Page {currentPage} of {totalPages}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {currentPatients.length === 0 ? (
              <div className="text-center py-12">
                <UserX className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No deleted patients found</h3>
                <p className="text-gray-500">There are no deleted patients matching your criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center font-semibold">Sr No.</TableHead>
                      <TableHead className="text-center font-semibold">Patient ID</TableHead>
                      <TableHead className="text-center font-semibold">Name</TableHead>
                      <TableHead className="text-center font-semibold">Age</TableHead>
                      <TableHead className="text-center font-semibold">Gender</TableHead>
                      <TableHead className="text-center font-semibold">Phone</TableHead>
                      <TableHead className="text-center font-semibold">Deleted Date</TableHead>
                      <TableHead className="text-center font-semibold">Deleted By</TableHead>
                      <TableHead className="text-center font-semibold">Status</TableHead>
                      <TableHead className="text-center font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentPatients.map((patient, idx) => (
                      <TableRow key={patient.id} className="hover:bg-gray-50">
                        <TableCell className="text-center font-medium">
                          {startIndex + idx + 1}
                        </TableCell>
                        <TableCell className="text-center font-mono text-blue-600">
                          {patient.id}
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {patient.name}
                        </TableCell>
                        <TableCell className="text-center">
                          {patient.age}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={patient.gender === 'Male' ? 'default' : 'secondary'}>
                            {patient.gender}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-mono">
                          {patient.phone}
                        </TableCell>
                        <TableCell className="text-center">
                          {formatDate(patient.deletedAt)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">
                            {patient.deletedBy}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="destructive">
                            Deleted
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestore(patient)}
                            className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 hover:border-green-400 action-btn-restore rounded-lg transition-all duration-300"
                            title="Restore Patient"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Professional Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredPatients.length)} of {filteredPatients.length} results
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className={cn(
                          "h-8 w-8 p-0",
                          currentPage === pageNum && "bg-blue-600 text-white"
                        )}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Restore Confirmation Dialog */}
        <Dialog open={showRestoreConfirm} onOpenChange={setShowRestoreConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <RotateCcw className="w-5 h-5 mr-2 text-green-600" />
                Restore Patient
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to restore <strong>{restorePatient?.name}</strong>?
                This will move the patient back to the active patients list.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowRestoreConfirm(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmRestore}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Restore Patient
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default DeletedPatients;
