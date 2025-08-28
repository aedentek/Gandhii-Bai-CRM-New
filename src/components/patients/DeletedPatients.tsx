import React, { useState, useEffect } from 'react';
import '@/styles/global-crm-design.css';
import '@/styles/global-modal-design.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ActionButtons } from '@/components/ui/HeaderActionButtons';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import MonthYearPickerDialog from '@/components/shared/MonthYearPickerDialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { 
  Search,
  Users, 
  Download,
  Eye,
  RotateCcw,
  Trash2, 
  Clock,
  UserX,
  TrendingUp,
  Activity,
  Plus,
  RefreshCw,
  Filter,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { DatabaseService } from '@/services/databaseService';
import LoadingScreen from '@/components/shared/LoadingScreen';
import usePageTitle from '@/hooks/usePageTitle';

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
  // Set page title
  usePageTitle();

  // Month/year constants
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [deletedPatients, setDeletedPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [deletedByFilter, setDeletedByFilter] = useState('');
  
  // Month/Year filter states
  const [filterMonth, setFilterMonth] = useState<number | null>(currentMonth);
  const [filterYear, setFilterYear] = useState<number | null>(currentYear);
  const [showMonthYearDialog, setShowMonthYearDialog] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [restorePatient, setRestorePatient] = useState<Patient | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    loadDeletedPatients();
  }, []);

  useEffect(() => {
    filterPatients();
  }, [deletedPatients, searchTerm, dateFilter, deletedByFilter, filterMonth, filterYear]);

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

    // Month/Year filtering by deletion date
    if (filterMonth !== null && filterYear !== null) {
      filtered = filtered.filter(patient => {
        const deletedDate = new Date(patient.deletedAt);
        return deletedDate.getMonth() === (filterMonth - 1) && deletedDate.getFullYear() === filterYear;
      });
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
    setCurrentPage(1); // Reset to first page on filter
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
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header Section */}
        <div className="crm-header-container">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
            <div className="flex items-center gap-3">
              <div className="crm-header-icon">
                <UserX className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Deleted Patients</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <ActionButtons.Refresh onClick={() => {
                console.log('🔄 Manual refresh triggered - refreshing entire page');
                window.location.reload();
              }} />
              
              <ActionButtons.MonthYear
                text={`${months[(filterMonth || 1) - 1]} ${filterYear}`}
                onClick={() => setShowMonthYearDialog(true)}
              />
              
              <Button 
                onClick={exportToExcel}
                className="global-btn flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Export Excel</span>
                <span className="sm:hidden">Excel</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="crm-stats-grid">
          {/* Total Deleted Card */}
          <Card className="crm-stat-card crm-stat-card-red">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-red-700 mb-1 truncate">Total Deleted</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-900 mb-1">{deletedPatients.length}</p>
                  <div className="flex items-center text-xs text-red-600">
                    <Trash2 className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">{months[(filterMonth || 1) - 1]} {filterYear}</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-red">
                  <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filtered Results Card */}
          <Card className="crm-stat-card crm-stat-card-orange">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-orange-700 mb-1 truncate">Filtered Results</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-900 mb-1">{filteredPatients.length}</p>
                  <div className="flex items-center text-xs text-orange-600">
                    <Search className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Current view</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-orange">
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* This Month Card */}
          <Card className="crm-stat-card crm-stat-card-blue">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-blue-700 mb-1 truncate">This Month</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-900 mb-1">
                    {deletedPatients.filter(p => {
                      const deletedDate = new Date(p.deletedAt);
                      const today = new Date();
                      return deletedDate.getMonth() === today.getMonth() && deletedDate.getFullYear() === today.getFullYear();
                    }).length}
                  </p>
                  <div className="flex items-center text-xs text-blue-600">
                    <CalendarIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Recent deletions</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-blue">
                  <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Can Restore Card */}
          <Card className="crm-stat-card crm-stat-card-green">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-green-700 mb-1 truncate">Can Restore</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-900 mb-1">{filteredPatients.length}</p>
                  <div className="flex items-center text-xs text-green-600">
                    <RotateCcw className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Available</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-green">
                  <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
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
                  placeholder="Search deleted patients by name, ID, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="w-full sm:w-auto min-w-[160px]">
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="Deletion date"
                />
              </div>
              
              <div className="w-full sm:w-auto min-w-[140px]">
                <select
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
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
              
              <button
                onClick={() => {
                  setSearchTerm('');
                  setDateFilter('');
                  setDeletedByFilter('');
                }}
                className="global-btn global-btn-secondary flex-shrink-0 text-xs sm:text-sm px-3 sm:px-4 py-2"
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Clear Filters</span>
                <span className="sm:hidden">Clear</span>
              </button>
            </div>
          </div>
        </div>

        {/* Patients Table */}
        <Card className="crm-table-container">
          <CardHeader className="crm-table-header">
            <div className="crm-table-title">
              <UserX className="crm-table-title-icon" />
              <span className="crm-table-title-text">Deleted Patient Records ({filteredPatients.length})</span>
              <span className="crm-table-title-text-mobile">Deleted ({filteredPatients.length})</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-300">
                {filteredPatients.length} deleted
              </Badge>
              <Badge variant="outline">
                Page {currentPage} of {totalPages}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              {currentPatients.length === 0 ? (
                <div className="text-center py-12">
                  <UserX className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No deleted patients found</h3>
                  <p className="text-gray-500">There are no deleted patients matching your criteria.</p>
                </div>
              ) : (
                <Table className="crm-table">
                  <TableHeader>
                    <TableRow className="crm-table-header-row">
                      <TableHead className="crm-table-header-cell text-center">Sr No.</TableHead>
                      <TableHead className="crm-table-header-cell text-center">Patient ID</TableHead>
                      <TableHead className="crm-table-header-cell text-center">Name</TableHead>
                      <TableHead className="crm-table-header-cell text-center">Age</TableHead>
                      <TableHead className="crm-table-header-cell text-center">Gender</TableHead>
                      <TableHead className="crm-table-header-cell text-center">Phone</TableHead>
                      <TableHead className="crm-table-header-cell text-center">Deleted Date</TableHead>
                      <TableHead className="crm-table-header-cell text-center">Deleted By</TableHead>
                      <TableHead className="crm-table-header-cell text-center">Status</TableHead>
                      <TableHead className="crm-table-header-cell text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentPatients.map((patient, idx) => (
                      <TableRow key={patient.id} className="crm-table-row">
                        <TableCell className="crm-table-cell text-center">
                          {startIndex + idx + 1}
                        </TableCell>
                        <TableCell className="crm-table-cell text-center">
                          <span className="crm-patient-id">{patient.id}</span>
                        </TableCell>
                        <TableCell className="crm-table-cell text-center">
                          <span className="crm-patient-name">{patient.name}</span>
                        </TableCell>
                        <TableCell className="crm-table-cell text-center">
                          {patient.age}
                        </TableCell>
                        <TableCell className="crm-table-cell text-center">
                          <Badge variant={patient.gender === 'Male' ? 'default' : 'secondary'} className="crm-badge">
                            {patient.gender}
                          </Badge>
                        </TableCell>
                        <TableCell className="crm-table-cell text-center">
                          <span className="crm-phone">{patient.phone}</span>
                        </TableCell>
                        <TableCell className="crm-table-cell text-center">
                          <span className="crm-date">{formatDate(patient.deletedAt)}</span>
                        </TableCell>
                        <TableCell className="crm-table-cell text-center">
                          <Badge variant="outline" className="crm-badge">
                            {patient.deletedBy}
                          </Badge>
                        </TableCell>
                        <TableCell className="crm-table-cell text-center">
                          <Badge variant="destructive" className="crm-status-badge crm-status-deleted">
                            Deleted
                          </Badge>
                        </TableCell>
                        <TableCell className="crm-table-cell text-center">
                          <div className="crm-action-buttons">
                            <button
                              onClick={() => handleRestore(patient)}
                              className="crm-action-btn crm-action-btn-success"
                              title="Restore Patient"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {/* Modern CRM Pagination */}
              {totalPages > 1 && (
                <div className="crm-pagination-container">
                  <div className="crm-pagination-info">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredPatients.length)} of {filteredPatients.length} results
                  </div>
                  <div className="crm-pagination-controls">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="crm-pagination-btn"
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
                            "crm-pagination-btn",
                            currentPage === pageNum && "crm-pagination-btn-active"
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
                      className="crm-pagination-btn"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Restore Confirmation Dialog */}
        <Dialog open={showRestoreConfirm} onOpenChange={setShowRestoreConfirm}>
          <DialogContent className="crm-dialog">
            <DialogHeader>
              <DialogTitle className="crm-dialog-title">
                <RotateCcw className="w-5 h-5 mr-2 text-green-600" />
                Restore Patient
              </DialogTitle>
              <DialogDescription className="crm-dialog-description">
                Are you sure you want to restore <strong>{restorePatient?.name}</strong>?
                This will move the patient back to the active patients list.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="crm-dialog-footer">
              <button 
                className="global-btn global-btn-secondary"
                onClick={() => setShowRestoreConfirm(false)}
              >
                Cancel
              </button>
              <button 
                onClick={confirmRestore}
                className="global-btn global-btn-success"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Restore Patient
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Month Year Picker Dialog */}
        <MonthYearPickerDialog
          open={showMonthYearDialog}
          onOpenChange={setShowMonthYearDialog}
          selectedMonth={filterMonth || currentMonth}
          selectedYear={filterYear || currentYear}
          onMonthChange={setFilterMonth}
          onYearChange={setFilterYear}
          onApply={() => {
            setShowMonthYearDialog(false);
          }}
        />
      </div>
    </div>
  );
};

export default DeletedPatients;
