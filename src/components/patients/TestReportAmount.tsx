import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DatabaseService } from '@/services/databaseService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { 
  FileText, Users, RefreshCw, Download, Plus, Eye, Edit, Trash2, 
  Calendar, Activity, TestTube, Receipt
} from 'lucide-react';
import { format } from 'date-fns';
import LoadingScreen from '@/components/shared/LoadingScreen';
import { getPatientPhotoUrl, PatientPhoto } from '@/utils/photoUtils';

interface Patient {
  id: string | number;
  originalId?: number;
  name: string;
  age: number;
  gender: string;
  phone: string;
  email?: string;
  address?: string;
  status: string;
  admissionDate: string;
  photo?: string;
  fees?: number;
  otherFees?: number;
  balance?: number;
}

interface TestReport {
  id?: number;
  patientId: string;
  patientName: string;
  testType: string;
  testDate: string;
  amount: number;
  notes: string;
  status: 'Pending' | 'Completed' | 'Cancelled';
  createdAt?: string;
  updatedAt?: string;
}

const TestReportAmount: React.FC = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [testReports, setTestReports] = useState<TestReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Active');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  
  // Add Test Report Modal
  const [isAddTestReportOpen, setIsAddTestReportOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [newTestReport, setNewTestReport] = useState<Partial<TestReport>>({
    testType: '',
    testDate: format(new Date(), 'yyyy-MM-dd'),
    amount: 0,
    notes: '',
    status: 'Pending'
  });
  
  // View Test Reports Modal
  const [isViewReportsOpen, setIsViewReportsOpen] = useState(false);
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);
  const [patientTestReports, setPatientTestReports] = useState<TestReport[]>([]);

  // Edit Test Report Modal
  const [isEditTestReportOpen, setIsEditTestReportOpen] = useState(false);
  const [editingTestReport, setEditingTestReport] = useState<TestReport | null>(null);

  useEffect(() => {
    loadPatients();
    loadTestReports();
  }, []);

  useEffect(() => {
    filterPatients();
    setCurrentPage(1);
  }, [patients, searchTerm, statusFilter]);

  const formatPatientId = (id: string | number): string => {
    if (!id) return '';
    const idStr = id.toString();
    if (idStr.startsWith('P')) return idStr;
    return `P${idStr.padStart(4, '0')}`;
  };

  const loadPatients = async () => {
    try {
      setLoading(true);
      console.log('🔗 Loading patients for Test Report Amount...');
      
      const data = await DatabaseService.getAllPatients();
      console.log('📋 Patients loaded:', data.length);
      
      const formattedPatients = data.map((p: any) => ({
        ...p,
        id: p.id || p.originalId,
        originalId: p.originalId || p.id,
        name: p.name || '',
        age: p.age || 0,
        gender: p.gender || '',
        phone: p.phone || '',
        email: p.email || '',
        address: p.address || '',
        status: p.status || 'Active',
        admissionDate: p.admissionDate || p.admission_date || '',
        photo: p.photo || '',
        fees: Number(p.fees || p.monthlyFees || 0),
        otherFees: Number(p.otherFees || p.other_fees || 0),
        balance: Number(p.balance || 0)
      }));
      
      setPatients(formattedPatients);
      console.log('✅ Patients formatted and set');
    } catch (error) {
      console.error('❌ Error loading patients:', error);
      toast({
        title: "Error",
        description: "Failed to load patients. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTestReports = async () => {
    try {
      console.log('📊 Loading test reports from database...');
      
      const response = await fetch('http://localhost:4000/api/test-reports');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Convert database format to frontend format
        const formattedReports: TestReport[] = result.data.map((report: any) => ({
          id: report.id,
          patientId: report.patient_id,
          patientName: report.patient_name,
          testType: report.test_type,
          testDate: report.test_date,
          amount: Number(report.amount),
          notes: report.notes || '',
          status: report.status,
          createdAt: report.created_at,
          updatedAt: report.updated_at
        }));
        
        setTestReports(formattedReports);
        console.log(`✅ Loaded ${formattedReports.length} test reports from database`);
      } else {
        console.warn('⚠️ Failed to load test reports:', result.message);
        setTestReports([]);
      }
    } catch (error) {
      console.error('❌ Error loading test reports:', error);
      setTestReports([]);
    }
  };

  const filterPatients = () => {
    let filtered = [...patients];

    if (searchTerm) {
      filtered = filtered.filter(patient =>
        (patient.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        formatPatientId(patient.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (patient.phone || '').includes(searchTerm) ||
        (patient.email || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'All') {
      filtered = filtered.filter(patient => patient.status === statusFilter);
    }

    // Only show active patients by default
    if (statusFilter === 'Active') {
      filtered = filtered.filter(patient => patient.status === 'Active');
    }

    setFilteredPatients(filtered);
  };

  const handleAddTestReport = (patient: Patient) => {
    setSelectedPatient(patient);
    setNewTestReport({
      patientId: formatPatientId(patient.id),
      patientName: patient.name,
      testType: '',
      testDate: format(new Date(), 'yyyy-MM-dd'),
      amount: 0,
      notes: '',
      status: 'Pending'
    });
    setIsAddTestReportOpen(true);
  };

  const handleViewReports = async (patient: Patient) => {
    setViewingPatient(patient);
    // Filter test reports for this patient
    const patientReports = testReports.filter(report => 
      report.patientId === formatPatientId(patient.id)
    );
    setPatientTestReports(patientReports);
    setIsViewReportsOpen(true);
  };

  const handleEditTestReport = (report: TestReport) => {
    setEditingTestReport(report);
    setNewTestReport({
      testType: report.testType,
      testDate: report.testDate,
      amount: report.amount,
      notes: report.notes,
      status: report.status
    });
    setIsEditTestReportOpen(true);
  };

  const handleUpdateTestReport = async () => {
    if (!editingTestReport || !newTestReport.testType || !newTestReport.amount) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('💾 Updating test report:', editingTestReport.id);
      
      const updateData = {
        test_type: newTestReport.testType,
        test_date: newTestReport.testDate,
        amount: Number(newTestReport.amount),
        notes: newTestReport.notes || '',
        status: newTestReport.status
      };

      const response = await fetch(`http://localhost:4000/api/test-reports/${editingTestReport.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Update local state
        setTestReports(prev => prev.map(report => 
          report.id === editingTestReport.id 
            ? { ...report, ...newTestReport, updatedAt: new Date().toISOString() }
            : report
        ));
        
        // Update patient reports if viewing
        if (viewingPatient) {
          const updatedPatientReports = testReports.map(report => 
            report.id === editingTestReport.id 
              ? { ...report, ...newTestReport, updatedAt: new Date().toISOString() }
              : report
          ).filter(report => report.patientId === formatPatientId(viewingPatient.id));
          setPatientTestReports(updatedPatientReports);
        }
        
        toast({
          title: "Success",
          description: "Test report updated successfully",
        });
        
        setIsEditTestReportOpen(false);
        setEditingTestReport(null);
        setNewTestReport({
          testType: '',
          testDate: format(new Date(), 'yyyy-MM-dd'),
          amount: 0,
          notes: '',
          status: 'Pending'
        });
      } else {
        throw new Error(result.message || 'Failed to update test report');
      }
    } catch (error) {
      console.error('❌ Error updating test report:', error);
      toast({
        title: "Error",
        description: `Failed to update test report: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteTestReport = async (reportId: number) => {
    if (!confirm('Are you sure you want to delete this test report?')) {
      return;
    }

    try {
      console.log('🗑️ Deleting test report:', reportId);
      
      const response = await fetch(`http://localhost:4000/api/test-reports/${reportId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Remove from local state
        setTestReports(prev => prev.filter(report => report.id !== reportId));
        
        // Update patient reports if viewing
        if (viewingPatient) {
          const updatedPatientReports = patientTestReports.filter(report => report.id !== reportId);
          setPatientTestReports(updatedPatientReports);
        }
        
        toast({
          title: "Success",
          description: "Test report deleted successfully",
        });
      } else {
        throw new Error(result.message || 'Failed to delete test report');
      }
    } catch (error) {
      console.error('❌ Error deleting test report:', error);
      toast({
        title: "Error",
        description: `Failed to delete test report: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleSaveTestReport = async () => {
    if (!selectedPatient || !newTestReport.testType || !newTestReport.amount) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('💾 Saving test report:', newTestReport);
      
      // Prepare data for API call
      const testReportData = {
        patient_id: formatPatientId(selectedPatient.id),
        patient_name: selectedPatient.name,
        test_type: newTestReport.testType,
        test_date: newTestReport.testDate,
        amount: Number(newTestReport.amount),
        notes: newTestReport.notes || '',
        status: newTestReport.status
      };

      // Make API call to save test report
      const response = await fetch('http://localhost:4000/api/test-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testReportData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Add to local state for immediate UI update
        const reportToSave: TestReport = {
          id: result.data.id,
          patientId: formatPatientId(selectedPatient.id),
          patientName: selectedPatient.name,
          testType: newTestReport.testType!,
          testDate: newTestReport.testDate!,
          amount: Number(newTestReport.amount),
          notes: newTestReport.notes || '',
          status: newTestReport.status as 'Pending' | 'Completed' | 'Cancelled',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        setTestReports(prev => [...prev, reportToSave]);
        
        toast({
          title: "Success",
          description: "Test report saved successfully to database",
        });
        
        setIsAddTestReportOpen(false);
        setSelectedPatient(null);
        setNewTestReport({
          testType: '',
          testDate: format(new Date(), 'yyyy-MM-dd'),
          amount: 0,
          notes: '',
          status: 'Pending'
        });
      } else {
        throw new Error(result.message || 'Failed to save test report');
      }
    } catch (error) {
      console.error('❌ Error saving test report:', error);
      toast({
        title: "Error",
        description: `Failed to save test report: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const exportToCSV = () => {
    try {
      const csvData = filteredPatients.map(patient => ({
        'Patient ID': formatPatientId(patient.id),
        'Name': patient.name,
        'Age': patient.age,
        'Gender': patient.gender,
        'Phone': patient.phone,
        'Email': patient.email,
        'Status': patient.status,
        'Admission Date': patient.admissionDate,
        'Monthly Fees': patient.fees,
        'Other Fees': patient.otherFees,
        'Balance': patient.balance
      }));

      const csv = [
        Object.keys(csvData[0]).join(','),
        ...csvData.map(row => Object.values(row).join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `test-report-patients-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Success",
        description: "Patient list exported successfully",
      });
    } catch (error) {
      console.error('❌ Error exporting CSV:', error);
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      });
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredPatients.length / pageSize);
  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handlePrevPage = () => setCurrentPage(p => Math.max(1, p - 1));
  const handleNextPage = () => setCurrentPage(p => Math.min(totalPages, p + 1));

  if (loading) {
    return <LoadingScreen message="Loading test report data..." />;
  }

  return (
    <div className="crm-page-bg">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header Section */}
        <div className="crm-header-container">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
            <div className="flex items-center gap-3">
              <div className="crm-header-icon">
                <TestTube className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Test Report Amount</h1>
                <p className="text-sm sm:text-base text-gray-600">Manage test reports and amounts for active patients</p>
              </div>
            </div>
          
            <div className="flex items-center gap-2 sm:gap-3">
              <Button 
                onClick={() => {
                  console.log('🔄 Manual refresh triggered');
                  loadPatients();
                  loadTestReports();
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
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          {/* Total Patients Card */}
          <Card className="crm-stat-card crm-stat-card-blue">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-blue-700 mb-1 truncate">Total Patients</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-900 mb-1">{filteredPatients.length}</p>
                  <div className="flex items-center text-xs text-blue-600">
                    <Activity className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Registered</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-blue">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Active Patients Card */}
          <Card className="crm-stat-card crm-stat-card-green">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-green-700 mb-1 truncate">Active Patients</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-900 mb-1">
                    {filteredPatients.filter(p => p.status === 'Active').length}
                  </p>
                  <div className="flex items-center text-xs text-green-600">
                    <Activity className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">In treatment</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-green">
                  <Activity className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Test Reports Card */}
          <Card className="crm-stat-card crm-stat-card-orange">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-orange-700 mb-1 truncate">Test Reports</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-900 mb-1">{testReports.length}</p>
                  <div className="flex items-center text-xs text-orange-600">
                    <TestTube className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Total tests</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-orange">
                  <TestTube className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Pending Reports Card */}
          <Card className="crm-stat-card crm-stat-card-red">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-red-700 mb-1 truncate">Pending Reports</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-900 mb-1">
                    {testReports.filter(r => r.status === 'Pending').length}
                  </p>
                  <div className="flex items-center text-xs text-red-600">
                    <Receipt className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Awaiting</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-red">
                  <Receipt className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="crm-controls-container">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by patient name, ID, phone, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
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
                  <SelectItem value="Critical">Critical</SelectItem>
                  <SelectItem value="Discharged">Discharged</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Patients Table */}
        <Card className="crm-table-container">
          <CardHeader className="crm-table-header">
            <div className="flex items-center text-base sm:text-lg font-semibold text-gray-900">
              <TestTube className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              <span className="hidden sm:inline">Active Patients List ({filteredPatients.length})</span>
              <span className="sm:hidden">Patients ({filteredPatients.length})</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
        
          <div className="overflow-x-auto">
            <Table className="w-full min-w-[1000px]">
              <TableHeader>
                <TableRow className="bg-gray-50 border-b">
                  <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                    <div className="flex items-center justify-center">
                      <span>S No</span>
                    </div>
                  </TableHead>
                  <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                    <div className="flex items-center justify-center">
                      <span>Patient ID</span>
                    </div>
                  </TableHead>
                  <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                    <div className="flex items-center justify-center">
                      <span>Patient Name</span>
                    </div>
                  </TableHead>
                  <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                    <div className="flex items-center justify-center">
                      <span>Age</span>
                    </div>
                  </TableHead>
                  <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                    <div className="flex items-center justify-center">
                      <span>Gender</span>
                    </div>
                  </TableHead>
                  <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                    <div className="flex items-center justify-center">
                      <span>Phone</span>
                    </div>
                  </TableHead>
                  <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                    <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                      <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>Status</span>
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
                {paginatedPatients.map((patient, idx) => (
                  <TableRow key={patient.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">
                      {(currentPage - 1) * pageSize + idx + 1}
                    </TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 font-medium text-center text-xs sm:text-sm whitespace-nowrap">
                      <span className="text-primary font-medium">
                        {formatPatientId(patient.id)}
                      </span>
                    </TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm">
                      <div className="flex items-center justify-center gap-2">
                        <PatientPhoto 
                          photoPath={patient.photo || ''} 
                          alt={`${patient.name}'s photo`}
                          className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover border border-gray-200" 
                        />
                        <span className="max-w-[100px] sm:max-w-[120px] truncate">{patient.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{patient.age}</TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{patient.gender}</TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{patient.phone}</TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center whitespace-nowrap">
                      <Badge className={`text-xs ${
                        patient.status === 'Active' ? 'bg-green-100 text-green-800' :
                        patient.status === 'Inactive' ? 'bg-gray-100 text-gray-800' :
                        patient.status === 'Critical' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {patient.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center whitespace-nowrap">
                      <div className="flex space-x-1 justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewReports(patient)}
                          className="action-btn-lead action-btn-view"
                          title="View Test Reports"
                        >
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddTestReport(patient)}
                          className="action-btn-lead action-btn-success"
                          title="Add Test Report"
                        >
                          <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {paginatedPatients.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No active patients found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="crm-pagination-container">
              <div className="text-sm text-gray-600">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredPatients.length)} of {filteredPatients.length} patients
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="h-8 px-3"
                >
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="h-8 w-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="h-8 px-3"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
          </CardContent>
        </Card>
      </div>

      {/* Add Test Report Modal */}
      <Dialog open={isAddTestReportOpen} onOpenChange={setIsAddTestReportOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl text-gray-900 flex items-center gap-2">
              <TestTube className="h-5 w-5 text-blue-600" />
              Add Test Report
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedPatient && (
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="flex items-center space-x-4 mb-3">
                  <PatientPhoto 
                    photoPath={selectedPatient.photo || ''} 
                    alt={`${selectedPatient.name}'s photo`}
                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-200" 
                  />
                  <div>
                    <p className="font-semibold text-gray-900">{selectedPatient.name}</p>
                    <p className="text-sm text-gray-600">Patient ID: {formatPatientId(selectedPatient.id)}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div>
              <Label htmlFor="testType" className="text-gray-700">Test Type *</Label>
              <Select value={newTestReport.testType} onValueChange={(value) => setNewTestReport(prev => ({ ...prev, testType: value }))}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select test type" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200">
                  <SelectItem value="Urine Test">Urine Test</SelectItem>
                  <SelectItem value="X-Ray">X-Ray</SelectItem>
                  <SelectItem value="CT Scan">CT Scan</SelectItem>
                  <SelectItem value="MRI">MRI</SelectItem>
                  <SelectItem value="Ultrasound">Ultrasound</SelectItem>
                  <SelectItem value="ECG">ECG</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="testDate" className="text-gray-700">Test Date *</Label>
              <Input
                id="testDate"
                type="date"
                value={newTestReport.testDate}
                onChange={(e) => setNewTestReport(prev => ({ ...prev, testDate: e.target.value }))}
                className="bg-white"
              />
            </div>
            
            <div>
              <Label htmlFor="amount" className="text-gray-700">Amount *</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter test amount"
                value={newTestReport.amount || ''}
                onChange={(e) => setNewTestReport(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                className="bg-white"
                min="0"
                step="0.01"
              />
            </div>
            
            <div>
              <Label htmlFor="status" className="text-gray-700">Status *</Label>
              <Select value={newTestReport.status} onValueChange={(value) => setNewTestReport(prev => ({ ...prev, status: value as 'Pending' | 'Completed' | 'Cancelled' }))}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200">
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="notes" className="text-gray-700">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Enter additional notes..."
                value={newTestReport.notes}
                onChange={(e) => setNewTestReport(prev => ({ ...prev, notes: e.target.value }))}
                className="bg-white"
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsAddTestReportOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveTestReport} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Save Test Report
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Test Report Modal */}
      <Dialog open={isEditTestReportOpen} onOpenChange={setIsEditTestReportOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl text-gray-900 flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-600" />
              Edit Test Report
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {editingTestReport && (
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="font-semibold text-gray-900">{editingTestReport.patientName}</p>
                <p className="text-sm text-gray-600">Patient ID: {editingTestReport.patientId}</p>
              </div>
            )}
            
            <div>
              <Label htmlFor="editTestType" className="text-gray-700">Test Type *</Label>
              <Select value={newTestReport.testType} onValueChange={(value) => setNewTestReport(prev => ({ ...prev, testType: value }))}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select test type" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200">
                  <SelectItem value="Urine Test">Urine Test</SelectItem>
                  <SelectItem value="X-Ray">X-Ray</SelectItem>
                  <SelectItem value="CT Scan">CT Scan</SelectItem>
                  <SelectItem value="MRI">MRI</SelectItem>
                  <SelectItem value="Ultrasound">Ultrasound</SelectItem>
                  <SelectItem value="ECG">ECG</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="editTestDate" className="text-gray-700">Test Date *</Label>
              <Input
                id="editTestDate"
                type="date"
                value={newTestReport.testDate}
                onChange={(e) => setNewTestReport(prev => ({ ...prev, testDate: e.target.value }))}
                className="bg-white"
              />
            </div>
            
            <div>
              <Label htmlFor="editAmount" className="text-gray-700">Amount *</Label>
              <Input
                id="editAmount"
                type="number"
                placeholder="Enter test amount"
                value={newTestReport.amount || ''}
                onChange={(e) => setNewTestReport(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                className="bg-white"
                min="0"
                step="0.01"
              />
            </div>
            
            <div>
              <Label htmlFor="editStatus" className="text-gray-700">Status *</Label>
              <Select value={newTestReport.status} onValueChange={(value) => setNewTestReport(prev => ({ ...prev, status: value as 'Pending' | 'Completed' | 'Cancelled' }))}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200">
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="editNotes" className="text-gray-700">Notes</Label>
              <Textarea
                id="editNotes"
                placeholder="Enter additional notes..."
                value={newTestReport.notes}
                onChange={(e) => setNewTestReport(prev => ({ ...prev, notes: e.target.value }))}
                className="bg-white"
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsEditTestReportOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateTestReport} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Edit className="h-4 w-4 mr-2" />
                Update Test Report
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Test Reports Modal */}
      <Dialog open={isViewReportsOpen} onOpenChange={setIsViewReportsOpen}>
        <DialogContent className="max-w-4xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl text-gray-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Test Reports - {viewingPatient?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {viewingPatient && (
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="flex items-center space-x-4 mb-3">
                  <PatientPhoto 
                    photoPath={viewingPatient.photo || ''} 
                    alt={`${viewingPatient.name}'s photo`}
                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-200" 
                  />
                  <div>
                    <p className="font-semibold text-gray-900">{viewingPatient.name}</p>
                    <p className="text-sm text-gray-600">Patient ID: {formatPatientId(viewingPatient.id)}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Test Reports History</h3>
                <Button 
                  onClick={() => {
                    setIsViewReportsOpen(false);
                    if (viewingPatient) {
                      handleAddTestReport(viewingPatient);
                    }
                  }}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Report
                </Button>
              </div>
              
              {patientTestReports.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Test Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patientTestReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.testType}</TableCell>
                        <TableCell>{format(new Date(report.testDate), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>₹{report.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge className={`text-xs ${
                            report.status === 'Completed' ? 'bg-green-100 text-green-800' :
                            report.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {report.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{report.notes || '-'}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditTestReport(report)}
                              className="action-btn-lead action-btn-edit"
                              title="Edit Report"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteTestReport(report.id!)}
                              className="action-btn-lead action-btn-delete"
                              title="Delete Report"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <TestTube className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium mb-2">No test reports found</p>
                  <p className="text-sm">This patient has no test reports yet.</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TestReportAmount;
