import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ActionButtons } from '@/components/ui/HeaderActionButtons';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DatabaseService } from '@/services/databaseService';
import { TestReportAmountAPI } from '@/services/testReportAmountAPI';
import { TestReportAmount } from '@/types/testReportAmount';
import { patientsAPI } from '@/utils/api';
import MonthYearPickerDialog from '@/components/shared/MonthYearPickerDialog';
import { getPatientPhotoUrl } from '@/utils/photoUtils';
import usePageTitle from '@/hooks/usePageTitle';
import { toast } from 'sonner';
import '@/styles/global-crm-design.css';
import {
  Search,
  Eye,
  Edit,
  User,
  RefreshCcw,
  TrendingUp,
  IndianRupee,
  Plus,
  FileText,
  Clock,
  X,
  Save,
  Calendar,
  Trash2,
  TestTube,
  Activity,
  Phone,
  Briefcase
} from 'lucide-react';
import '@/styles/global-crm-design.css';
import '@/styles/global-modal-design.css';

interface Patient {
  id: string;
  name: string;
  phone?: string;
  photo?: string;
  age?: number;
  gender?: string;
  status?: string;
  bloodTest?: number;
  pickupCharge?: number;
  otherFees?: number;
  admissionDate?: string;
}

const TestReportAmountPage: React.FC = () => {
  // Set page title
  usePageTitle();

  // Debug: Component is rendering
  console.log('🧪 TestReportAmountPage component is rendering...');
  
  // Months array for filtering
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentMonth = new Date().getMonth(); // 0-based: August = 7
  const currentYear = new Date().getFullYear();
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [testReports, setTestReports] = useState<TestReportAmount[]>([]);
  const [filteredReports, setFilteredReports] = useState<TestReportAmount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth + 1); // Convert to 1-based: August becomes 8
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [isMonthYearDialogOpen, setIsMonthYearDialogOpen] = useState(false);

  // Modal states
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteReport, setDeleteReport] = useState<TestReportAmount | null>(null);

  // Form states
  const [testType, setTestType] = useState('');
  const [testDate, setTestDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'Pending' | 'Completed' | 'Cancelled'>('Pending');

  useEffect(() => {
    loadPatients();
    loadTestReports();
  }, []);

  useEffect(() => {
    filterPatients();
  }, [patients, searchTerm, selectedMonth, selectedYear]);

  useEffect(() => {
    filterReports();
  }, [testReports, selectedMonth, selectedYear]);

  const formatPatientId = (id: string | number): string => {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    if (isNaN(numericId)) return 'PAT000';
    return `PAT${String(numericId).padStart(3, '0')}`;
  };

  const sortPatientsById = (patients: Patient[]): Patient[] => {
    return [...patients].sort((a, b) => {
      const numA = parseInt(a.id, 10) || 0;
      const numB = parseInt(b.id, 10) || 0;
      return numA - numB;
    });
  };

  const loadPatients = async () => {
    try {
      console.log('🔄 Loading patients...');
      setIsLoading(true);
      
      // Try the unified API first, then fallback to DatabaseService
      let data;
      try {
        data = await patientsAPI.getAll();
        console.log('✅ Patients loaded via unified API:', data.length, 'patients');
      } catch (apiError) {
        console.warn('⚠️ Unified API failed, falling back to DatabaseService:', apiError.message);
        const result = await DatabaseService.getAllPatients();
        
        // Handle DatabaseService response format
        if (result && result.success && result.data && Array.isArray(result.data)) {
          data = result.data;
        } else if (result && Array.isArray(result)) {
          data = result;
        } else {
          throw new Error('Invalid response format from DatabaseService');
        }
        console.log('✅ Patients loaded via DatabaseService fallback:', data.length, 'patients');
      }
      
      console.log('📋 Raw patient data:', data);
      
      if (!data || !Array.isArray(data)) {
        console.warn('⚠️ Invalid patient data received:', data);
        setPatients([]);
        toast('Warning', {
          description: 'No patient data received from server',
        });
        return;
      }
      
      const formattedPatients: Patient[] = data.map((patient: any) => ({
        id: patient.id?.toString() || '',
        name: patient.name || '',
        phone: patient.phone || '',
        photo: patient.photo || '',
        age: patient.age || 0,
        gender: patient.gender || '',
        status: patient.status || 'Active',
        bloodTest: Number(patient.bloodTest || patient.blood_test || 0),
        pickupCharge: Number(patient.pickupCharge || patient.pickup_charge || 0),
        otherFees: Number(patient.otherFees || patient.other_fees || 0),
        admissionDate: patient.admissionDate || patient.admission_date || ''
      }));
      
      console.log('🎯 Formatted patients:', formattedPatients);
      console.log('💰 Patient financial data:', formattedPatients.map(p => ({
        name: p.name,
        bloodTest: p.bloodTest,
        otherFees: p.otherFees,
        total: (p.bloodTest || 0) + (p.otherFees || 0)
      })));
      
      const sortedPatients = sortPatientsById(formattedPatients);
      setPatients(sortedPatients);
      console.log(`✅ Successfully loaded ${sortedPatients.length} patients`);
      
    } catch (error) {
      console.error('❌ Error loading patients:', error);
      console.error('❌ Error details:', error.message);
      setPatients([]);
      toast('Error', {
        description: `Failed to load patients: ${error.message}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadTestReports = async () => {
    try {
      console.log('🔄 Loading test reports...');
      const result = await TestReportAmountAPI.getAll();
      
      if (result.success && result.data) {
        setTestReports(result.data);
        console.log(`✅ Loaded ${result.data.length} test reports from database`);
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

    // Remove month/year filtering by admission date - show all patients regardless of joining date
    // The month/year picker is now only for reference/organization, not filtering
    /* 
    filtered = filtered.filter(patient => {
      const admissionDate = new Date(patient.admissionDate);
      return admissionDate.getMonth() + 1 === selectedMonth && admissionDate.getFullYear() === selectedYear;
    });
    */

    if (searchTerm) {
      filtered = filtered.filter(patient =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formatPatientId(patient.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (patient.phone && patient.phone.includes(searchTerm))
      );
    }

    setFilteredPatients(filtered);
  };

  const filterReports = () => {
    let filtered = [...testReports];

    // Filter by selected month and year
    filtered = filtered.filter(report => {
      const reportDate = new Date(report.test_date);
      return reportDate.getMonth() + 1 === selectedMonth && reportDate.getFullYear() === selectedYear;
    });

    setFilteredReports(filtered);
  };

  const handleMonthFilterChange = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  const handleViewPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedPatient(null);
  };

  const handleAddTestReport = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsReportModalOpen(true);
    // Reset form
    setTestType('');
    setTestDate(new Date().toISOString().split('T')[0]);
    setAmount('');
    setNotes('');
    setStatus('Pending');
  };

  const handleCloseReportModal = () => {
    setIsReportModalOpen(false);
    setSelectedPatient(null);
    setTestType('');
    setTestDate(new Date().toISOString().split('T')[0]);
    setAmount('');
    setNotes('');
    setStatus('Pending');
  };

  const handleAddReport = async () => {
    if (!selectedPatient || !testType || !amount || !testDate) {
      toast('Validation Error', {
        description: 'Please fill in all required fields',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      console.log('🧪 Adding test report for patient:', selectedPatient);
      console.log('📝 Report data:', { testType, testDate, amount, status, notes });
      
      const reportData = {
        patient_id: selectedPatient.id,
        patient_name: selectedPatient.name, // ✅ Added missing patient_name
        test_type: testType,
        test_date: testDate,
        amount: parseFloat(amount), // ✅ Ensure proper number conversion
        status: status,
        notes: notes || '' // ✅ Ensure notes is never undefined
      };

      console.log('📤 Sending report data to API:', reportData);

      const result = await TestReportAmountAPI.create(reportData);
      
      console.log('📥 API Response:', result);
      
      if (result.success) {
        toast('Success!', {
          description: 'Test report added successfully',
        });
        
        handleCloseReportModal();
        loadTestReports(); // Reload to get updated data
      } else {
        throw new Error(result.message || 'Failed to add test report');
      }
    } catch (error) {
      console.error('❌ Error adding test report:', error);
      toast('Error', {
        description: `Failed to add test report: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTestReport = (report: TestReportAmount) => {
    setDeleteReport(report);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteReport) return;

    setIsSubmitting(true);
    try {
      console.log('🗑️ Deleting test report:', deleteReport.id);
      
      const result = await TestReportAmountAPI.delete(deleteReport.id);
      
      if (result.success) {
        // Remove from local state to update UI immediately
        setTestReports(prev => prev.filter(report => report.id !== deleteReport.id));
        setFilteredReports(prev => prev.filter(report => report.id !== deleteReport.id));
        
        setShowDeleteConfirm(false);
        setDeleteReport(null);
        
        toast('Success!', {
          description: 'Test report deleted successfully',
        });
        
        console.log('✅ Test report deleted successfully');
      } else {
        throw new Error(result.message || 'Failed to delete test report');
      }
    } catch (error) {
      console.error('❌ Error deleting test report:', error);
      toast('Error', {
        description: `Failed to delete test report: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stats calculations - using month/year filtering for accurate stats
  // Get patients that have activity (admission or test reports) in selected month
  const patientsWithActivityInMonth = filteredPatients.filter(patient => {
    // Check if patient has test reports in the selected month
    const hasTestReportsInMonth = filteredReports.some(report => report.patient_id === patient.id);
    
    // Check if patient was admitted in the selected month
    let wasAdmittedInMonth = false;
    if (patient.admissionDate) {
      const admissionDate = new Date(patient.admissionDate);
      const admissionMonth = admissionDate.getMonth() + 1;
      const admissionYear = admissionDate.getFullYear();
      wasAdmittedInMonth = (selectedMonth === admissionMonth && selectedYear === admissionYear);
    }
    
    return hasTestReportsInMonth || wasAdmittedInMonth;
  });

  const totalPatients = patientsWithActivityInMonth.length;
  const activePatients = patientsWithActivityInMonth.filter(p => p.status === 'Active').length;
  const totalReports = filteredReports.length;
  const pendingReports = filteredReports.filter(r => r.status === 'Pending').length;
  
  // Calculate Total Amount only for patients with activity in selected month
  const totalAmount = patientsWithActivityInMonth.reduce((sum, patient) => {
    // Get test report amounts for this patient in the selected month
    const patientReports = filteredReports.filter(report => report.patient_id === patient.id);
    const testReportTotal = patientReports.reduce((reportSum, report) => {
      const amount = typeof report.amount === 'string' ? parseFloat(report.amount) : report.amount;
      return reportSum + (isNaN(amount) ? 0 : amount);
    }, 0);
    
    // Get patient fees (bloodTest + pickupCharge) only if admitted in selected month
    let patientFeesTotal = 0;
    if (patient.admissionDate) {
      const admissionDate = new Date(patient.admissionDate);
      const admissionMonth = admissionDate.getMonth() + 1;
      const admissionYear = admissionDate.getFullYear();
      
      // Only add patient fees if current month/year matches admission month/year
      if (selectedMonth === admissionMonth && selectedYear === admissionYear) {
        const bloodTest = typeof patient.bloodTest === 'number' ? patient.bloodTest : parseFloat(String(patient.bloodTest || 0));
        const pickupCharge = typeof patient.pickupCharge === 'number' ? patient.pickupCharge : parseFloat(String(patient.pickupCharge || 0));
        patientFeesTotal = (isNaN(bloodTest) ? 0 : bloodTest) + (isNaN(pickupCharge) ? 0 : pickupCharge);
      }
    }
    
    const patientTotal = testReportTotal + patientFeesTotal;
    return sum + patientTotal;
  }, 0);

  // Debug logging
  console.log('🔍 Debug Stats:', {
    totalPatients,
    activePatients,
    filteredPatientsLength: filteredPatients.length,
    isLoading,
    patientsArrayLength: patients.length,
    filteredReportsLength: filteredReports.length,
    totalAmount: `₹${totalAmount.toFixed(2)}`,
    calculationMethod: 'Test Reports + Patient Fees (for all patients)',
    selectedMonth,
    selectedYear,
    patientBreakdown: filteredPatients.map(p => {
      const patientReports = filteredReports.filter(report => report.patient_id === p.id);
      const testReportTotal = patientReports.reduce((reportSum, report) => {
        const amount = typeof report.amount === 'string' ? parseFloat(report.amount) : report.amount;
        return reportSum + (isNaN(amount) ? 0 : amount);
      }, 0);
      
      // Include patient fees for all patients regardless of admission date
      const bloodTest = typeof p.bloodTest === 'number' ? p.bloodTest : parseFloat(String(p.bloodTest || 0));
      const pickupCharge = typeof p.pickupCharge === 'number' ? p.pickupCharge : parseFloat(String(p.pickupCharge || 0));
      const patientFeesTotal = (isNaN(bloodTest) ? 0 : bloodTest) + (isNaN(pickupCharge) ? 0 : pickupCharge);
      
      return { 
        name: p.name,
        testReports: testReportTotal,
        patientFees: patientFeesTotal,
        total: testReportTotal + patientFeesTotal,
        admissionDate: p.admissionDate || 'No date'
      };
    })
  });

  return (
    <div className="crm-page-bg">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header Section */}
        <div className="crm-header-container">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="crm-header-icon">
                <TestTube className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Test Report Amount</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <Button 
                onClick={() => setIsMonthYearDialogOpen(true)}
                className="global-btn text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
              >
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                All Patients ({months[selectedMonth - 1]} {selectedYear})
              </Button>
              <ActionButtons.Refresh onClick={() => {
                console.log('🔄 Manual refresh triggered - refreshing entire page');
                window.location.reload();
              }} />
              {/* <Button 
                onClick={async () => {
                  console.log('🧪 Testing Test Reports API directly...');
                  try {
                    // Test GET
                    console.log('📡 Testing GET /api/test-reports...');
                    const getResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/test-reports`);
                    console.log('📡 GET API response status:', getResponse.status);
                    const getData = await getResponse.json();
                    console.log('📡 GET API response data:', getData);
                    
                    // Test CREATE with sample data
                    console.log('📡 Testing POST /api/test-reports...');
                    const testData = {
                      patient_id: 'PAT111',
                      patient_name: 'Sabarish T',
                      test_type: 'API Test Report',
                      test_date: '2025-08-22',
                      amount: 999,
                      notes: 'Direct API test from frontend',
                      status: 'Pending'
                    };
                    console.log('� Sending test data:', testData);
                    
                    const createResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/test-reports`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify(testData)
                    });
                    console.log('📡 CREATE API response status:', createResponse.status);
                    const createData = await createResponse.json();
                    console.log('📡 CREATE API response data:', createData);
                    
                    if (createData.success) {
                      toast('API Test Success!', {
                        description: 'Test report created successfully via direct API',
                      });
                      loadTestReports(); // Refresh the data
                    }
                  } catch (error) {
                    console.error('📡 Direct API error:', error);
                    toast('API Test Error', {
                      description: `API test failed: ${error.message}`,
                    });
                  }
                }}
                className="bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
              >
                Test API
              </Button> */}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="crm-stats-grid">
          {/* Total Patients Card */}
          <Card className="crm-stat-card crm-stat-card-blue">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-blue-700 mb-1 truncate">Total Patients</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-900 mb-1">{totalPatients}</p>
                  <div className="flex items-center text-xs text-blue-600">
                    <User className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Registered</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-blue">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
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
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-900 mb-1">{activePatients}</p>
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
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-900 mb-1">{totalReports}</p>
                  <div className="flex items-center text-xs text-orange-600">
                    <TestTube className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">This month</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-orange">
                  <TestTube className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Amount Card */}
          <Card className="crm-stat-card crm-stat-card-purple">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-purple-700 mb-1 truncate">Total Amount</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-900 mb-1">
                    ₹{totalAmount.toLocaleString('en-IN', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </p>
                  <div className="flex items-center text-xs text-purple-600">
                    <IndianRupee className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">
                      {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} Revenue
                    </span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-purple">
                  <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Patients List */}
        {!isLoading && (
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Patients ({filteredPatients.length})
                </CardTitle>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search patients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
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
                          <User className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>Photo</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                          <span>Patient ID</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                          <span>Patient Name</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1 sm:space-x-2">
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
                    {filteredPatients.map((patient, index) => {
                      const patientReports = filteredReports.filter(report => report.patient_id === patient.id);
                      const reportCount = patientReports.length;
                      const totalPatientAmount = patientReports.reduce((sum, report) => sum + report.amount, 0);

                      return (
                        <TableRow key={patient.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                          <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">
                            {index + 1}
                          </TableCell>
                          <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center">
                            <div className="flex justify-center">
                              <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                                <AvatarImage 
                                  src={patient.photo ? getPatientPhotoUrl(patient.photo) : undefined}
                                  onError={(e) => {
                                    console.log('❌ Image failed to load for patient:', patient.name);
                                    console.log('   Photo path:', patient.photo);
                                  }}
                                  onLoad={() => {
                                    console.log('✅ Image loaded for patient:', patient.name);
                                  }}
                                />
                                <AvatarFallback className="bg-blue-100 text-blue-600 text-xs sm:text-sm">
                                  {patient.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                          </TableCell>
                          <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap font-medium text-blue-600">
                            {formatPatientId(patient.id)}
                          </TableCell>
                          <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap font-medium">
                            {patient.name}
                          </TableCell>
                          <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">
                            {patient.phone || 'N/A'}
                          </TableCell>
                          <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">
                            <Badge 
                              className={`text-xs ${
                                patient.status === 'Active' ? 'bg-green-100 text-green-800' :
                                patient.status === 'Inactive' ? 'bg-gray-100 text-gray-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {patient.status || 'Active'}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1 sm:gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleViewPatient(patient)}
                                className="action-btn-lead action-btn-view h-8 w-8 sm:h-9 sm:w-9 p-0"
                                title="View Patient Details"
                              >
                                <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="sr-only">View</span>
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleAddTestReport(patient)}
                                className="action-btn-lead action-btn-edit h-8 w-8 sm:h-9 sm:w-9 p-0"
                                title="Add Test Report"
                              >
                                <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="sr-only">Add Report</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Month Year Picker Dialog */}
        <MonthYearPickerDialog
          open={isMonthYearDialogOpen}
          onOpenChange={setIsMonthYearDialogOpen}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
          onApply={() => {
            setIsMonthYearDialogOpen(false);
          }}
          title="Select Month & Year for Test Reports"
          description="Filter test reports by specific month and year"
        />

        {/* Add Test Report Modal */}
        <Dialog open={isReportModalOpen} onOpenChange={(open) => {
          if (!open) {
            handleCloseReportModal();
          }
        }}>
          <DialogContent className="editpopup form crm-modal-container sm:max-w-md w-[95vw] sm:w-full">
            <DialogHeader className="editpopup form crm-modal-header">
              <div className="flex items-center gap-3 mb-2">
                <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                  <AvatarImage 
                    src={selectedPatient?.photo ? getPatientPhotoUrl(selectedPatient.photo) : undefined}
                    onError={(e) => {
                      console.log('❌ Modal image failed to load for patient:', selectedPatient?.name);
                      console.log('   Photo path:', selectedPatient?.photo);
                    }}
                    onLoad={() => {
                      console.log('✅ Modal image loaded for patient:', selectedPatient?.name);
                    }}
                  />
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-sm sm:text-base">
                    {selectedPatient?.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <DialogTitle className="editpopup form crm-modal-title text-lg sm:text-xl">
                    <TestTube className="h-4 w-4 sm:h-5 sm:w-5 inline mr-2" />
                    Add Test Report - {selectedPatient?.name}
                  </DialogTitle>
                  <DialogDescription className="editpopup form text-sm text-gray-600">
                    ID: {selectedPatient ? formatPatientId(selectedPatient.id) : ''}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={(e) => {
              e.preventDefault();
              handleAddReport();
            }} className="editpopup form crm-edit-form space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="editpopup form crm-edit-form-group">
                  <label className="editpopup form crm-edit-form-label required">
                    Test Type
                  </label>
                  <Input
                    type="text"
                    value={testType}
                    onChange={(e) => setTestType(e.target.value)}
                    placeholder="Enter test type (e.g., Blood Test, X-Ray, CT Scan)"
                    className="editpopup form crm-edit-form-input"
                  />
                </div>
                
                <div className="editpopup form crm-edit-form-group">
                  <label className="editpopup form crm-edit-form-label required">
                    Test Date
                  </label>
                  <Input
                    type="date"
                    value={testDate}
                    onChange={(e) => setTestDate(e.target.value)}
                    className="editpopup form crm-edit-form-input"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="editpopup form crm-edit-form-group">
                  <label className="editpopup form crm-edit-form-label required">
                    Amount (₹)
                  </label>
                  <Input
                    type="number"
                    placeholder="Enter test amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="editpopup form crm-edit-form-input"
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div className="editpopup form crm-edit-form-group">
                  <label className="editpopup form crm-edit-form-label required">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'Pending' | 'Completed' | 'Cancelled')}
                    className="editpopup form crm-edit-form-select"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              
              <div className="editpopup form crm-edit-form-group">
                <label className="editpopup form crm-edit-form-label">
                  Notes
                </label>
                <Textarea
                  placeholder="Enter additional notes (optional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="editpopup form crm-edit-form-textarea"
                  rows={3}
                />
              </div>
            </form>

            <DialogFooter className="editpopup form dialog-footer flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
              <Button 
                type="button"
                variant="outline" 
                onClick={handleCloseReportModal} 
                className="editpopup form footer-button-cancel w-full sm:w-auto modern-btn modern-btn-secondary"
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                type="button"
                onClick={handleAddReport}
                disabled={isSubmitting || !testType || !amount || !testDate}
                className="editpopup form footer-button-save w-full sm:w-auto global-btn"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Adding...
                  </>
                ) : (
                  <>
                    <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    Add Test Report
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Patient View Modal - Glass Morphism Design */}
        {isViewModalOpen && selectedPatient && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={handleCloseViewModal}
          >
            <div 
              className="max-w-[95vw] max-h-[95vh] w-full sm:max-w-6xl overflow-hidden bg-gradient-to-br from-white to-blue-50/30 border-0 shadow-2xl p-0 m-4 rounded-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header - Glass Morphism Style */}
              <div className="relative pb-3 sm:pb-4 md:pb-6 border-b border-blue-100 px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-6">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500"></div>
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mt-2 sm:mt-4">
                  <div className="relative flex-shrink-0">
                    <Avatar className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full object-cover border-2 sm:border-4 border-white shadow-lg">
                      <AvatarImage 
                        src={selectedPatient.photo ? getPatientPhotoUrl(selectedPatient.photo) : undefined}
                        onError={(e) => {
                          console.log('❌ View modal image failed to load for patient:', selectedPatient.name);
                          console.log('   Photo path:', selectedPatient.photo);
                        }}
                        onLoad={() => {
                          console.log('✅ View modal image loaded for patient:', selectedPatient.name);
                        }}
                      />
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {selectedPatient.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1">
                      <Badge className="bg-green-100 text-green-800 border-2 border-white shadow-sm text-xs">
                        {selectedPatient.status || 'Active'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 flex items-center gap-1 sm:gap-2 truncate">
                      <User className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-blue-600 flex-shrink-0" />
                      <span className="truncate">{selectedPatient.name}</span>
                    </h2>
                    <div className="text-xs sm:text-sm md:text-base lg:text-lg mt-1 flex items-center gap-2">
                      <span className="text-gray-600">
                        {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} Total:
                      </span>
                      <span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg border border-green-200">
                        ₹{(() => {
                          const patientReports = filteredReports.filter(report => report.patient_id === selectedPatient.id);
                          const testReportTotal = patientReports.reduce((sum, report) => {
                            const amount = typeof report.amount === 'string' ? parseFloat(report.amount) : report.amount;
                            return sum + (isNaN(amount) ? 0 : amount);
                          }, 0);
                          
                          // Check if current selected month/year matches patient's joining month/year
                          let otherFeesTotal = 0;
                          if (selectedPatient.admissionDate) {
                            const admissionDate = new Date(selectedPatient.admissionDate);
                            const admissionMonth = admissionDate.getMonth() + 1; // getMonth() returns 0-11
                            const admissionYear = admissionDate.getFullYear();
                            
                            // Only add Other Fees Amount if current month/year matches admission month/year
                            if (selectedMonth === admissionMonth && selectedYear === admissionYear) {
                              otherFeesTotal = (selectedPatient.bloodTest || 0) + (selectedPatient.pickupCharge || 0);
                            }
                          }
                          
                          const grandTotal = testReportTotal + otherFeesTotal;
                          return grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        })()}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCloseViewModal}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Modal Body - Glass Morphism Style */}
              <div className="overflow-y-auto max-h-[calc(95vh-100px)] sm:max-h-[calc(95vh-120px)] md:max-h-[calc(95vh-140px)] lg:max-h-[calc(95vh-200px)] custom-scrollbar">
                <div className="p-2 sm:p-3 md:p-4 lg:p-6 space-y-3 sm:space-y-4 md:space-y-6 lg:space-y-8">
                  
                  {/* Patient Information - Staff-style Layout */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-4 sm:p-5 md:p-6 lg:p-8 border border-blue-100 shadow-sm">
                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 flex items-center gap-2">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <User className="h-3 w-3 sm:h-3 sm:w-3 md:h-4 md:w-4 text-blue-600" />
                      </div>
                      Patient Information
                    </h3>
                    
                    {/* First Row - Full Name, Patient ID, Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4 md:mb-6">
                      
                      {/* Full Name */}
                      <div className="bg-gradient-to-br from-blue-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-blue-100">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-blue-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">FULL NAME</div>
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 truncate">{selectedPatient.name}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Patient ID */}
                      <div className="bg-gradient-to-br from-green-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-green-100">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-green-600 font-bold text-xs sm:text-sm">ID</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-green-600 uppercase tracking-wide">PATIENT ID</div>
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">{formatPatientId(selectedPatient.id)}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Status */}
                      <div className="bg-gradient-to-br from-purple-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-purple-100">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Activity className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-purple-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-purple-600 uppercase tracking-wide">STATUS</div>
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 truncate">{selectedPatient.status || 'Active'}</p>
                          </div>
                        </div>
                      </div>
                      
                    </div>
                    
                    {/* Second Row - Joining Date, Phone, Age */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                      
                      {/* Joining Date */}
                      <div className="bg-gradient-to-br from-orange-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-orange-100">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-orange-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-orange-600 uppercase tracking-wide">JOINING DATE</div>
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">
                              {selectedPatient.admissionDate ? 
                                new Date(selectedPatient.admissionDate).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: '2-digit', 
                                  year: 'numeric'
                                }) : 'N/A'
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Phone */}
                      <div className="bg-gradient-to-br from-blue-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-blue-100">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Phone className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-blue-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">PHONE</div>
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">{selectedPatient.phone || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Age/Gender */}
                      <div className="bg-gradient-to-br from-green-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-green-100">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-green-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-green-600 uppercase tracking-wide">AGE/GENDER</div>
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">{selectedPatient.age || 'N/A'} / {selectedPatient.gender || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                      
                    </div>
                  </div>

                  {/* Other Fees Amount Container */}
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-amber-200 shadow-sm">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 md:mb-6">
                      <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                          <IndianRupee className="h-3 w-3 sm:h-3 sm:w-3 md:h-4 md:w-4 text-white" />
                        </div>
                        Other Fees Amount
                        <Badge variant="outline" className="text-xs bg-white border-amber-300 text-amber-700">
                          From Patient List
                        </Badge>
                      </h3>
                      
                      {/* Month/Year Display - matches Test Report Records style */}
                      <div className="flex items-center gap-3 mt-4 sm:mt-0">
                        <div className="px-3 sm:px-4 py-2 border border-amber-200 rounded-lg text-sm bg-white/80 backdrop-blur-sm">
                          {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {/* Blood Test Fee */}
                      <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border border-red-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-100 rounded-full flex items-center justify-center">
                              <TestTube className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm font-medium text-red-600 uppercase tracking-wide">Blood Test</p>
                              <p className="text-xs text-gray-500">Laboratory charges</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-base sm:text-lg font-bold text-gray-900">
                              ₹{(() => {
                                // Only show blood test fee for joining month
                                if (selectedPatient.admissionDate) {
                                  const admissionDate = new Date(selectedPatient.admissionDate);
                                  const admissionMonth = admissionDate.getMonth() + 1;
                                  const admissionYear = admissionDate.getFullYear();
                                  
                                  if (selectedMonth === admissionMonth && selectedYear === admissionYear) {
                                    return selectedPatient.bloodTest || 0;
                                  }
                                }
                                return 0;
                              })()}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Pickup Charge Fee */}
                      <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border border-green-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm font-medium text-green-600 uppercase tracking-wide">Pickup Charge</p>
                              <p className="text-xs text-gray-500">Transportation fee</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-base sm:text-lg font-bold text-gray-900">
                              ₹{(() => {
                                // Only show pickup charge for joining month
                                if (selectedPatient.admissionDate) {
                                  const admissionDate = new Date(selectedPatient.admissionDate);
                                  const admissionMonth = admissionDate.getMonth() + 1;
                                  const admissionYear = admissionDate.getFullYear();
                                  
                                  if (selectedMonth === admissionMonth && selectedYear === admissionYear) {
                                    return selectedPatient.pickupCharge || 0;
                                  }
                                }
                                return 0;
                              })()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Total Summary - Only for Selected Month */}
                    <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-amber-200">
                      <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 text-sm sm:text-base font-bold">Σ</span>
                            </div>
                            <span className="text-sm sm:text-base font-medium text-blue-600">
                              Total for {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </span>
                          </div>
                          <p className="text-lg sm:text-xl font-bold text-blue-600">
                            ₹{(() => {
                              // Only show fees for the joining month
                              if (selectedPatient.admissionDate) {
                                const admissionDate = new Date(selectedPatient.admissionDate);
                                const admissionMonth = admissionDate.getMonth() + 1;
                                const admissionYear = admissionDate.getFullYear();
                                
                                // Only show fees if current month/year matches admission month/year
                                if (selectedMonth === admissionMonth && selectedYear === admissionYear) {
                                  return ((selectedPatient.bloodTest || 0) + (selectedPatient.pickupCharge || 0)).toLocaleString();
                                }
                              }
                              return "0";
                            })()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Test Report Records Section - Glass Morphism Design */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-blue-100 shadow-sm">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 md:mb-6">
                      <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <TestTube className="h-3 w-3 sm:h-3 sm:w-3 md:h-4 md:w-4 text-green-600" />
                        </div>
                        Test Report Records ({filteredReports.filter(r => r.patient_id === selectedPatient.id).length})
                      </h3>
                      
                      {/* Month/Year Selector with Glass Morphism */}
                      <div className="flex items-center gap-3 mt-4 sm:mt-0">
                        <select
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                          className="px-3 sm:px-4 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80 backdrop-blur-sm"
                        >
                          <option value={1}>January</option>
                          <option value={2}>February</option>
                          <option value={3}>March</option>
                          <option value={4}>April</option>
                          <option value={5}>May</option>
                          <option value={6}>June</option>
                          <option value={7}>July</option>
                          <option value={8}>August</option>
                          <option value={9}>September</option>
                          <option value={10}>October</option>
                          <option value={11}>November</option>
                          <option value={12}>December</option>
                        </select>
                        
                        <select
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                          className="px-3 sm:px-4 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80 backdrop-blur-sm"
                        >
                          {Array.from({ length: 5 }, (_, i) => {
                            const year = new Date().getFullYear() - 2 + i;
                            return (
                              <option key={year} value={year}>
                                {year}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>
                    
                    {filteredReports.filter(r => r.patient_id === selectedPatient.id).length === 0 ? (
                      <>
                        <div className="text-center py-8 sm:py-12">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <TestTube className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
                          </div>
                          <p className="text-gray-500 text-lg font-medium mb-2">No test report records found</p>
                          <p className="text-gray-400 text-sm">
                            for {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                        
                        {/* Total Section - Show even when no test reports, to display Other Fees Amount */}
                        <div className="bg-gradient-to-r from-blue-50/80 to-purple-50/80 backdrop-blur-sm px-4 sm:px-6 py-4 sm:py-6 border-t border-blue-100 rounded-b-lg mt-4">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <Calendar className="h-4 w-4 text-blue-600" />
                              </div>
                              <span className="text-base sm:text-lg font-semibold text-gray-900">
                                Total for {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}:
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <span className="text-green-600 font-bold">₹</span>
                              </div>
                              <span className="text-xl sm:text-2xl font-bold text-green-600 bg-green-50/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-green-200">
                                ₹{(() => {
                                  // No test reports, so testReportTotal = 0
                                  const testReportTotal = 0;
                                  
                                  // Check if current selected month/year matches patient's joining month/year
                                  let otherFeesTotal = 0;
                                  if (selectedPatient.admissionDate) {
                                    const admissionDate = new Date(selectedPatient.admissionDate);
                                    const admissionMonth = admissionDate.getMonth() + 1; // getMonth() returns 0-11
                                    const admissionYear = admissionDate.getFullYear();
                                    
                                    // Only add Other Fees Amount if current month/year matches admission month/year
                                    if (selectedMonth === admissionMonth && selectedYear === admissionYear) {
                                      otherFeesTotal = (selectedPatient.bloodTest || 0) + (selectedPatient.pickupCharge || 0);
                                    }
                                  }
                                  
                                  const grandTotal = testReportTotal + otherFeesTotal;
                                  return grandTotal.toLocaleString('en-IN');
                                })()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Table with Glass Morphism Header */}
                        <div className="overflow-x-auto rounded-lg border border-blue-100">
                          <table className="w-full border-collapse bg-white/60 backdrop-blur-sm">
                            <thead>
                              <tr className="bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 text-white">
                                <th className="px-4 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-semibold">S No</th>
                                <th className="px-4 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-semibold">Patient ID</th>
                                <th className="px-4 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-semibold">Date</th>
                                <th className="px-4 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-semibold">Test Type</th>
                                <th className="px-4 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-semibold">Amount</th>
                                <th className="px-4 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-semibold">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-blue-100">
                              {filteredReports
                                .filter(report => report.patient_id === selectedPatient.id)
                                .map((report, index) => (
                                  <tr key={report.id} className="hover:bg-white/80 transition-colors">
                                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 font-medium text-center">
                                      {index + 1}
                                    </td>
                                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-blue-600 text-center">
                                      {formatPatientId(report.patient_id)}
                                    </td>
                                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 text-center">
                                      {new Date(report.test_date).toLocaleDateString('en-GB')}
                                    </td>
                                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 text-center">
                                      {report.test_type || 'No test type'}
                                    </td>
                                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-green-600 text-center">
                                      ₹{(() => {
                                        const amount = typeof report.amount === 'string' ? parseFloat(report.amount) : report.amount;
                                        return (isNaN(amount) ? 0 : amount).toLocaleString('en-IN');
                                      })()}
                                    </td>
                                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-center">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="action-btn-lead action-btn-delete h-8 w-8 sm:h-9 sm:w-9 p-0"
                                        title="Delete Test Report"
                                        onClick={() => handleDeleteTestReport(report)}
                                      >
                                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                        
                        {/* Total Section with Glass Morphism */}
                        <div className="bg-gradient-to-r from-blue-50/80 to-purple-50/80 backdrop-blur-sm px-4 sm:px-6 py-4 sm:py-6 border-t border-blue-100 rounded-b-lg mt-4">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <Calendar className="h-4 w-4 text-blue-600" />
                              </div>
                              <span className="text-base sm:text-lg font-semibold text-gray-900">
                                Total for {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}:
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <span className="text-green-600 font-bold">₹</span>
                              </div>
                              <span className="text-xl sm:text-2xl font-bold text-green-600 bg-green-50/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-green-200">
                                ₹{(() => {
                                  const patientReports = filteredReports.filter(report => report.patient_id === selectedPatient.id);
                                  const testReportTotal = patientReports.reduce((sum, report) => {
                                    const amount = typeof report.amount === 'string' ? parseFloat(report.amount) : report.amount;
                                    return sum + (isNaN(amount) ? 0 : amount);
                                  }, 0);
                                  
                                  // Check if current selected month/year matches patient's joining month/year
                                  let otherFeesTotal = 0;
                                  if (selectedPatient.admissionDate) {
                                    const admissionDate = new Date(selectedPatient.admissionDate);
                                    const admissionMonth = admissionDate.getMonth() + 1; // getMonth() returns 0-11
                                    const admissionYear = admissionDate.getFullYear();
                                    
                                    // Only add Other Fees Amount if current month/year matches admission month/year
                                    if (selectedMonth === admissionMonth && selectedYear === admissionYear) {
                                      otherFeesTotal = (selectedPatient.bloodTest || 0) + (selectedPatient.pickupCharge || 0);
                                    }
                                  }
                                  
                                  const grandTotal = testReportTotal + otherFeesTotal;
                                  return grandTotal.toLocaleString('en-IN');
                                })()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="crm-modal-container">
          <DialogHeader className="editpopup form dialog-header">
            <div className="editpopup form icon-title-container">
              <div className="editpopup form dialog-icon">
                <Trash2 className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
              </div>
              <div className="editpopup form title-description">
                <DialogTitle className="editpopup form dialog-title text-red-700">
                  Delete Test Report
                </DialogTitle>
                <DialogDescription className="editpopup form dialog-description">
                  Are you sure you want to delete this test report? This action cannot be undone.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          {deleteReport && (
            <div className="mx-4 my-4 p-4 bg-gray-50 rounded-lg border">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="font-medium text-gray-900">PAT{String(deleteReport.patient_id).padStart(3, '0')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <TestTube className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">{deleteReport.test_type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">{new Date(deleteReport.test_date).toLocaleDateString('en-GB')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">₹{(() => {
                    const amount = typeof deleteReport.amount === 'string' ? parseFloat(deleteReport.amount) : deleteReport.amount;
                    return (isNaN(amount) ? 0 : amount).toLocaleString('en-IN');
                  })()}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="editpopup form dialog-footer flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setShowDeleteConfirm(false);
                setDeleteReport(null);
              }}
              disabled={isSubmitting}
              className="editpopup form footer-button-cancel w-full sm:w-auto modern-btn modern-btn-secondary"
            >
              <X className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={confirmDelete}
              disabled={isSubmitting}
              className="editpopup form footer-button-delete w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Delete Test Report
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TestReportAmountPage;
