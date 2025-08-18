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
  profilePicture?: string;
  // Delete tracking fields
  deletedAt: Date | string;
  deletedBy: string;
}

const DeletedPatients: React.FC = () => {
  const [deletedPatients, setDeletedPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [deletedByFilter, setDeletedByFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [restorePatient, setRestorePatient] = useState<Patient | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    loadDeletedPatients();
  }, []);

  useEffect(() => {
    filterPatients();
  }, [deletedPatients, searchTerm, dateFilter, deletedByFilter]);

  const loadDeletedPatients = async () => {
    try {
      setLoading(true);
      // Try to load from API first (if available)
      try {
        const response = await fetch('/api/patients/deleted');
        if (response.ok) {
          const data = await response.json();
          setDeletedPatients(data);
        } else {
          throw new Error('API not available');
        }
      } catch (apiError) {
        // Fallback to localStorage or mock data
        const stored = localStorage.getItem('deletedPatients');
        if (stored) {
          setDeletedPatients(JSON.parse(stored));
        } else {
          // Create some mock deleted patients for demonstration
          const mockDeleted: Patient[] = [
            {
              id: 'DEL001',
              name: 'John Deleted',
              age: 45,
              gender: 'Male',
              phone: '+91 98765 43210',
              email: 'john.deleted@email.com',
              address: '123 Deleted St, City',
              emergencyContact: '+91 98765 43211',
              medicalHistory: 'Previous medical records',
              admissionDate: new Date('2024-01-15'),
              status: 'Deleted',
              attenderName: 'Dr. Smith',
              deletedAt: new Date('2024-01-20'),
              deletedBy: 'Admin User'
            },
            {
              id: 'DEL002',
              name: 'Jane Removed',
              age: 32,
              gender: 'Female',
              phone: '+91 98765 43212',
              email: 'jane.removed@email.com',
              address: '456 Removed Ave, City',
              emergencyContact: '+91 98765 43213',
              medicalHistory: 'Allergies noted',
              admissionDate: new Date('2024-01-10'),
              status: 'Deleted',
              attenderName: 'Dr. Jones',
              deletedAt: new Date('2024-01-25'),
              deletedBy: 'Manager User'
            }
          ];
          setDeletedPatients(mockDeleted);
          localStorage.setItem('deletedPatients', JSON.stringify(mockDeleted));
        }
      }
    } catch (error) {
      console.error('Error loading deleted patients:', error);
      toast({
        title: "Error",
        description: "Failed to load deleted patients.",
        variant: "destructive",
      });
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
    <div className="crm-page-bg">
      <div className="max-w-7xl mx-auto">
        {/* Professional Header */}
        <div className="crm-header-container">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center transition-all duration-300 hover:bg-red-700 hover:scale-110">
                <UserX className="w-6 h-6 text-white transition-transform duration-300 hover:rotate-3" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 transition-colors duration-300 hover:text-red-600">Deleted Patients</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Manage and restore deleted patient records
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button 
                onClick={exportToExcel}
                className="action-btn-lead-danger"
              >
                <Download className="h-4 w-4" />
                <span className="font-medium">Export Excel</span>
              </button>
            </div>
          </div>
        </div>

        {/* Professional Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="crm-stat-card-danger">
            <div className="crm-stat-icon">
              <Trash2 className="h-6 w-6" />
            </div>
            <div className="crm-stat-content">
              <p className="crm-stat-label">Total Deleted</p>
              <p className="crm-stat-value">{deletedPatients.length}</p>
            </div>
            <div className="crm-stat-bar"></div>
          </div>

          <div className="crm-stat-card-warning">
            <div className="crm-stat-icon">
              <Filter className="h-6 w-6" />
            </div>
            <div className="crm-stat-content">
              <p className="crm-stat-label">Filtered</p>
              <p className="crm-stat-value">{filteredPatients.length}</p>
            </div>
            <div className="crm-stat-bar"></div>
          </div>

          <div className="crm-stat-card-info">
            <div className="crm-stat-icon">
              <CalendarIcon className="h-6 w-6" />
            </div>
            <div className="crm-stat-content">
              <p className="crm-stat-label">This Month</p>
              <p className="crm-stat-value">
                {deletedPatients.filter(p => {
                  const deletedDate = new Date(p.deletedAt);
                  const today = new Date();
                  return deletedDate.getMonth() === today.getMonth() && deletedDate.getFullYear() === today.getFullYear();
                }).length}
              </p>
            </div>
            <div className="crm-stat-bar"></div>
          </div>

          <div className="crm-stat-card-purple">
            <div className="crm-stat-icon">
              <RotateCcw className="h-6 w-6" />
            </div>
            <div className="crm-stat-content">
              <p className="crm-stat-label">Can Restore</p>
              <p className="crm-stat-value">{filteredPatients.length}</p>
            </div>
            <div className="crm-stat-bar"></div>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="crm-controls-container">
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
              <button
                onClick={() => {
                  setSearchTerm('');
                  setDateFilter('');
                  setDeletedByFilter('');
                }}
                className="global-btn-secondary h-12"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Patients Table */}
        <div className="crm-table-container">
          <div className="crm-table-title">
            <h2>Deleted Patient Records</h2>
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-300">
                {filteredPatients.length} deleted
              </Badge>
              <Badge variant="outline">
                Page {currentPage} of {totalPages}
              </Badge>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            {currentPatients.length === 0 ? (
              <div className="text-center py-12">
                <UserX className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No deleted patients found</h3>
                <p className="text-gray-500">There are no deleted patients matching your criteria.</p>
              </div>
            ) : (
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
                        <button
                          onClick={() => handleRestore(patient)}
                          className="action-btn-success-sm"
                          title="Restore Patient"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
          </div>
        </div>

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
