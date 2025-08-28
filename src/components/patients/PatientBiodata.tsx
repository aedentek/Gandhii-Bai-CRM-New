import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DatabaseService } from '@/services/databaseService';
import { getPatientPhotoUrl, PatientPhoto } from '@/utils/photoUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import usePageTitle from '@/hooks/usePageTitle';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  Activity,
  Heart,
  FileText,
  Camera,
  Users,
  Clock,
  ArrowLeft,
  Edit,
  Download,
  Printer,
  Share,
  Eye,
  AlertCircle,
  CheckCircle,
  Info,
  CreditCard,
  UserCheck,
  Shield,
  Home,
  Briefcase,
  Baby,
  Stethoscope,
  Pill,
  TestTube,
  Clipboard,
  TrendingUp
} from 'lucide-react';
import '../../styles/modern-forms.css';
import '../../styles/modern-tables.css';
import '../../styles/modern-settings.css';
import '@/styles/global-crm-design.css';

interface Patient {
  id: string;
  patient_id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  email?: string;
  address?: string;
  emergencyContact?: string;
  guardian_name?: string;
  guardian_phone?: string;
  guardian_relation?: string;
  occupation?: string;
  marital_status?: string;
  language_preference?: string;
  medicalHistory?: string;
  admissionDate?: string;
  dateOfBirth?: string;
  status: string;
  attenderName?: string;
  attenderPhone?: string;
  attenderRelationship?: string;
  photo?: string;
  patientAadhar?: string;
  patientPan?: string;
  attenderAadhar?: string;
  attenderPan?: string;
  fees?: string;
  bloodTest?: string;
  pickupCharge?: string;
  otherFees?: string;
  totalAmount?: string;
  payAmount?: string;
  balance?: string;
  paymentType?: string;
  fatherName?: string;
  motherName?: string;
  marriageStatus?: string;
  employeeStatus?: string;
  created_at?: string;
  updated_at?: string;
}

interface PatientMedicalRecord {
  id: string;
  date: string;
  doctorName: string;
  diagnosis: string;
  prescription: string;
  notes?: string;
  symptoms?: string;
  treatment?: string;
  nextAppointment?: string;
}

interface PatientPayment {
  id: string;
  date: string;
  amount: number;
  paymentType: string;
  description: string;
  receiptNumber?: string;
}

interface PatientTest {
  id: string;
  date: string;
  testName: string;
  result: string;
  status: string;
  doctorName?: string;
  notes?: string;
}

const PatientBiodata: React.FC = () => {
  // Set page title
  usePageTitle();

  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  
  console.log('🏥 PatientBiodata component mounted with patientId:', patientId);
  console.log('🔗 Current URL:', window.location.href);
  console.log('📍 Current pathname:', window.location.pathname);
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [medicalRecords, setMedicalRecords] = useState<PatientMedicalRecord[]>([]);
  const [payments, setPayments] = useState<PatientPayment[]>([]);
  const [tests, setTests] = useState<PatientTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'medical' | 'financial' | 'documents'>('overview');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔄 PatientBiodata useEffect triggered with patientId:', patientId);
    if (patientId) {
      loadPatientData();
    } else {
      console.log('❌ No patientId provided');
    }
  }, [patientId]);

  const loadPatientData = async () => {
    try {
      console.log('📊 Starting loadPatientData for patientId:', patientId);
      setLoading(true);
      setError(null);
      
      console.log('Loading patient data for patientId:', patientId);
      
      // Load patient details
      const patients = await DatabaseService.getAllPatients();
      
      // Try multiple matching strategies
      const foundPatient = patients.find((p: any) => {
        // Direct ID match (for numeric IDs like 111)
        if (p.id?.toString() === patientId) return true;
        
        // Patient ID field match (for formatted IDs like P0001)
        if (p.patient_id === patientId) return true;
        
        // Extract numeric from formatted ID and match (P0111 -> 111)
        if (patientId?.startsWith('P')) {
          const numericFromFormatted = patientId.replace('P', '').replace(/^0+/, '');
          if (p.id?.toString() === numericFromFormatted) return true;
        }
        
        // Format numeric ID and match with patient_id (111 -> P0111)
        if (!patientId?.startsWith('P') && p.patient_id) {
          const formattedId = `P${String(patientId).padStart(4, '0')}`;
          if (p.patient_id === formattedId) return true;
        }
        
        return false;
      });
      
      console.log('Patient search result:', {
        searchedId: patientId,
        foundPatient: foundPatient ? { id: foundPatient.id, patient_id: foundPatient.patient_id, name: foundPatient.name } : null,
        totalPatients: patients.length
      });
      
      if (!foundPatient) {
        setError('Patient not found');
        return;
      }
      
      setPatient(foundPatient);
      
      // Load medical records (mock data for now)
      setMedicalRecords([
        {
          id: '1',
          date: '2025-08-20',
          doctorName: 'Dr. Smith',
          diagnosis: 'Hypertension',
          prescription: 'Amlodipine 5mg daily',
          symptoms: 'High blood pressure, headache',
          treatment: 'Medication and lifestyle changes',
          nextAppointment: '2025-09-20'
        }
      ]);
      
      // Load payment history (mock data for now)
      setPayments([
        {
          id: '1',
          date: '2025-08-15',
          amount: 3000,
          paymentType: 'Cash',
          description: 'Consultation and medicines',
          receiptNumber: 'RCP001'
        }
      ]);
      
      // Load test results (mock data for now)
      setTests([
        {
          id: '1',
          date: '2025-08-18',
          testName: 'Blood Pressure Check',
          result: '140/90 mmHg',
          status: 'Completed',
          doctorName: 'Dr. Smith',
          notes: 'Elevated blood pressure'
        }
      ]);
      
    } catch (error) {
      console.error('Error loading patient data:', error);
      setError('Failed to load patient data');
      toast({
        title: "Error",
        description: "Failed to load patient information",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      Active: { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3" /> },
      Inactive: { color: 'bg-gray-100 text-gray-800', icon: <AlertCircle className="h-3 w-3" /> },
      Discharged: { color: 'bg-blue-100 text-blue-800', icon: <Info className="h-3 w-3" /> },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Active;
    
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        {config.icon}
        {status}
      </Badge>
    );
  };

  const formatCurrency = (amount: string | number | undefined) => {
    if (!amount) return '₹0';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `₹${numAmount.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Not set';
    try {
      return format(new Date(dateString), 'dd MMM yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <div className="modern-container">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading patient information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="modern-container">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Patient Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The requested patient could not be found.'}</p>
          <Button onClick={() => navigate('/patients')} className="global-btn">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Patients
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="modern-container">
      {/* Header Section */}
      <div className="modern-page-header">
        <div className="modern-page-header-content">
          <div className="modern-page-title-section">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/patients')}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="modern-page-icon">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h1 className="modern-page-title">{patient.name}</h1>
              <p className="modern-page-subtitle">
                Patient ID: {patientId} • Complete Medical Profile
              </p>
            </div>
          </div>
          
          <div className="modern-page-actions">
            <Button className="modern-btn modern-btn-secondary">
              <Printer className="h-4 w-4 mr-2" />
              Print Profile
            </Button>
            <Button className="modern-btn modern-btn-secondary">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button 
              className="global-btn"
              onClick={() => navigate(`/patients/edit/${patientId}`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Patient
            </Button>
          </div>
        </div>
      </div>

      {/* Patient Stats Cards */}
      <div className="modern-stats-grid">
        <div className="modern-stat-card">
          <div className="modern-stat-icon modern-stat-icon-blue">
            <User className="h-4 w-4" />
          </div>
          <div className="modern-stat-content">
            <div className="modern-stat-value">{patient.age}</div>
            <div className="modern-stat-label">Years Old</div>
          </div>
        </div>
        
        <div className="modern-stat-card">
          <div className="modern-stat-icon modern-stat-icon-green">
            <Activity className="h-4 w-4" />
          </div>
          <div className="modern-stat-content">
            <div className={`modern-stat-value ${patient.status === 'Active' ? 'status-active' : patient.status === 'Inactive' ? 'status-inactive' : 'status-discharged'}`}>
              {patient.status || 'Active'}
            </div>
            <div className="modern-stat-label">Current Status</div>
          </div>
        </div>
        
        <div className="modern-stat-card">
          <div className="modern-stat-icon modern-stat-icon-purple">
            <CreditCard className="h-4 w-4" />
          </div>
          <div className="modern-stat-content">
            <div className="modern-stat-value">{formatCurrency(patient.balance)}</div>
            <div className="modern-stat-label">Outstanding Balance</div>
          </div>
        </div>
        
        <div className="modern-stat-card">
          <div className="modern-stat-icon modern-stat-icon-orange">
            <Calendar className="h-4 w-4" />
          </div>
          <div className="modern-stat-content">
            <div className="modern-stat-value">{formatDate(patient.admissionDate)}</div>
            <div className="modern-stat-label">Admission Date</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="modern-tabs">
        <div className="modern-tabs-list">
          <button
            className={`modern-tab ${activeTab === 'overview' ? 'modern-tab-active' : ''}`}
            onClick={() => setActiveTab('overview')}
            data-label="Overview"
          >
            <User className="h-3.5 w-3.5" />
            <span>Overview</span>
          </button>
          <button
            className={`modern-tab ${activeTab === 'medical' ? 'modern-tab-active' : ''}`}
            onClick={() => setActiveTab('medical')}
            data-label="Medical"
          >
            <Stethoscope className="h-3.5 w-3.5" />
            <span>Medical History</span>
          </button>
          <button
            className={`modern-tab ${activeTab === 'financial' ? 'modern-tab-active' : ''}`}
            onClick={() => setActiveTab('financial')}
            data-label="Financial"
          >
            <CreditCard className="h-3.5 w-3.5" />
            <span>Financial Records</span>
          </button>
          <button
            className={`modern-tab ${activeTab === 'documents' ? 'modern-tab-active' : ''}`}
            onClick={() => setActiveTab('documents')}
            data-label="Documents"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Documents</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="modern-tab-content">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Patient Photo and Basic Info */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1">
                <Card className="modern-setting-card h-full">
                  <CardHeader className="text-center pb-4">
                    <CardTitle className="flex items-center justify-center gap-2 text-lg">
                      <Camera className="h-5 w-5" />
                      Patient Photo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <PatientPhoto 
                      photoPath={patient.photo} 
                      alt={patient.name}
                      className="w-28 h-28 rounded-full object-cover mx-auto mb-3 border-3 border-gray-200 shadow-md"
                    />
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{patient.name}</h3>
                    <p className="text-sm text-gray-500 mb-2">{patient.patient_id || patientId}</p>
                    <div className="flex justify-center">
                      {getStatusBadge(patient.status)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Personal Information */}
              <div className="lg:col-span-3">
                <Card className="modern-setting-card h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <User className="h-5 w-5" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="modern-setting-item">
                        <div className="modern-setting-label">
                          <User className="h-4 w-4" />
                          Full Name
                        </div>
                        <div className="modern-setting-value">{patient.name}</div>
                      </div>
                      
                      <div className="modern-setting-item">
                        <div className="modern-setting-label">
                          <Calendar className="h-4 w-4" />
                          Age / DOB
                        </div>
                        <div className="modern-setting-value">
                          {patient.age} years • {formatDate(patient.dateOfBirth)}
                        </div>
                      </div>
                      
                      <div className="modern-setting-item">
                        <div className="modern-setting-label">
                          <UserCheck className="h-4 w-4" />
                          Gender
                        </div>
                        <div className="modern-setting-value">{patient.gender}</div>
                      </div>
                      
                      <div className="modern-setting-item">
                        <div className="modern-setting-label">
                          <Heart className="h-4 w-4" />
                          Marital Status
                        </div>
                        <div className="modern-setting-value">{patient.marital_status || patient.marriageStatus || 'Not specified'}</div>
                      </div>
                      
                      <div className="modern-setting-item">
                        <div className="modern-setting-label">
                          <Briefcase className="h-4 w-4" />
                          Occupation
                        </div>
                        <div className="modern-setting-value">{patient.occupation || patient.employeeStatus || 'Not specified'}</div>
                      </div>
                      
                      <div className="modern-setting-item">
                        <div className="modern-setting-label">
                          <Calendar className="h-4 w-4" />
                          Admission Date
                        </div>
                        <div className="modern-setting-value">{formatDate(patient.admissionDate)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Contact Information */}
            <Card className="modern-setting-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Phone className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="modern-setting-item">
                    <div className="modern-setting-label">
                      <Phone className="h-4 w-4" />
                      Primary Phone
                    </div>
                    <div className="modern-setting-value">{patient.phone}</div>
                  </div>
                  
                  <div className="modern-setting-item">
                    <div className="modern-setting-label">
                      <Mail className="h-4 w-4" />
                      Email Address
                    </div>
                    <div className="modern-setting-value">{patient.email || 'Not provided'}</div>
                  </div>
                  
                  <div className="modern-setting-item">
                    <div className="modern-setting-label">
                      <Shield className="h-4 w-4" />
                      Emergency Contact
                    </div>
                    <div className="modern-setting-value">{patient.emergencyContact || 'Not provided'}</div>
                  </div>
                  
                  <div className="modern-setting-item lg:col-span-3">
                    <div className="modern-setting-label">
                      <MapPin className="h-4 w-4" />
                      Address
                    </div>
                    <div className="modern-setting-value">{patient.address || 'Not provided'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Guardian/Attender Information */}
            {(patient.guardian_name || patient.attenderName) && (
              <div className="lg:col-span-3">
                <Card className="modern-setting-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Guardian / Attender Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="modern-setting-item">
                        <div className="modern-setting-label">
                          <User className="h-4 w-4" />
                          Guardian Name
                        </div>
                        <div className="modern-setting-value">{patient.guardian_name || patient.attenderName || 'Not specified'}</div>
                      </div>
                      
                      <div className="modern-setting-item">
                        <div className="modern-setting-label">
                          <Phone className="h-4 w-4" />
                          Guardian Phone
                        </div>
                        <div className="modern-setting-value">{patient.guardian_phone || patient.attenderPhone || 'Not provided'}</div>
                      </div>
                      
                      <div className="modern-setting-item">
                        <div className="modern-setting-label">
                          <Heart className="h-4 w-4" />
                          Relationship
                        </div>
                        <div className="modern-setting-value">{patient.guardian_relation || patient.attenderRelationship || 'Not specified'}</div>
                      </div>
                      
                      {patient.fatherName && (
                        <div className="modern-setting-item">
                          <div className="modern-setting-label">
                            <User className="h-4 w-4" />
                            Father's Name
                          </div>
                          <div className="modern-setting-value">{patient.fatherName}</div>
                        </div>
                      )}
                      
                      {patient.motherName && (
                        <div className="modern-setting-item">
                          <div className="modern-setting-label">
                            <User className="h-4 w-4" />
                            Mother's Name
                          </div>
                          <div className="modern-setting-value">{patient.motherName}</div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Medical History Summary */}
            {patient.medicalHistory && (
              <div className="lg:col-span-3">
                <Card className="modern-setting-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Stethoscope className="h-5 w-5" />
                      Medical History Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="modern-setting-item">
                      <div className="modern-setting-value text-sm">
                        {patient.medicalHistory}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {activeTab === 'medical' && (
          <div className="space-y-6">
            <Card className="modern-setting-card">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-800">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Stethoscope className="h-5 w-5 text-green-600" />
                  </div>
                  Medical Records & Consultations
                </CardTitle>
              </CardHeader>
              <CardContent>
                {medicalRecords.length > 0 ? (
                  <div className="space-y-6">
                    {medicalRecords.map((record) => (
                      <div key={record.id} className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                        {/* Header Section */}
                        <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-200">
                          <div className="flex-1">
                            <h4 className="font-bold text-xl text-gray-800 mb-2">{record.diagnosis}</h4>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                Dr. {record.doctorName}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {formatDate(record.date)}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Badge className="bg-blue-100 text-blue-800 font-medium px-3 py-1">Consultation</Badge>
                          </div>
                        </div>
                        
                        {/* Content Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                              <strong className="text-gray-700 font-semibold">Symptoms:</strong>
                            </div>
                            <p className="text-gray-600 bg-red-50 p-3 rounded-lg border border-red-100">{record.symptoms}</p>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                              <strong className="text-gray-700 font-semibold">Treatment:</strong>
                            </div>
                            <p className="text-gray-600 bg-green-50 p-3 rounded-lg border border-green-100">{record.treatment}</p>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                              <strong className="text-gray-700 font-semibold">Prescription:</strong>
                            </div>
                            <p className="text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-100">{record.prescription}</p>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                              <strong className="text-gray-700 font-semibold">Next Appointment:</strong>
                            </div>
                            <p className="text-gray-600 bg-purple-50 p-3 rounded-lg border border-purple-100">{formatDate(record.nextAppointment)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Stethoscope className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Medical Records</h3>
                    <p className="text-gray-600">No medical consultation records found for this patient</p>
                    <p className="text-gray-400 text-sm mt-2">Medical records will appear here once consultations are recorded</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="modern-setting-card">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-800">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <TestTube className="h-5 w-5 text-orange-600" />
                  </div>
                  Test Results & Lab Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tests.length > 0 ? (
                  <div className="space-y-6">
                    {tests.map((test) => (
                      <div key={test.id} className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                        {/* Header Section */}
                        <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-200">
                          <div className="flex-1">
                            <h4 className="font-bold text-xl text-gray-800 mb-2">{test.testName}</h4>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {formatDate(test.date)}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Badge className={test.status === 'Completed' ? 'bg-green-100 text-green-800 font-medium px-3 py-1' : 'bg-yellow-100 text-yellow-800 font-medium px-3 py-1'}>
                              {test.status}
                            </Badge>
                          </div>
                        </div>
                        
                        {/* Content Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                              <strong className="text-gray-700 font-semibold">Result:</strong>
                            </div>
                            <p className="text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-100 font-mono text-sm">{test.result}</p>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                              <strong className="text-gray-700 font-semibold">Doctor:</strong>
                            </div>
                            <p className="text-gray-600 bg-green-50 p-3 rounded-lg border border-green-100">{test.doctorName}</p>
                          </div>
                          
                          {test.notes && (
                            <div className="space-y-1 md:col-span-2">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                                <strong className="text-gray-700 font-semibold">Notes:</strong>
                              </div>
                              <p className="text-gray-600 bg-purple-50 p-3 rounded-lg border border-purple-100">{test.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <TestTube className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Test Results</h3>
                    <p className="text-gray-600">No lab test results found for this patient</p>
                    <p className="text-gray-400 text-sm mt-2">Test results will appear here once lab reports are available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'financial' && (
          <div className="space-y-6">
            {/* Financial Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="modern-setting-card border-l-4 border-l-blue-500 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md">
                        <TrendingUp className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-gray-900">{formatCurrency(patient.totalAmount)}</div>
                        <div className="text-sm text-blue-600 font-medium">Total Amount</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="modern-setting-card border-l-4 border-l-green-500 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md">
                        <CheckCircle className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-gray-900">{formatCurrency(patient.payAmount)}</div>
                        <div className="text-sm text-green-600 font-medium">Amount Paid</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="modern-setting-card border-l-4 border-l-red-500 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-md">
                        <AlertCircle className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-gray-900">{formatCurrency(patient.balance)}</div>
                        <div className="text-sm text-red-600 font-medium">Outstanding Balance</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Fee Breakdown */}
            <Card className="modern-setting-card">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-800">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Clipboard className="h-5 w-5 text-blue-600" />
                  </div>
                  Fee Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-0 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-center py-4 border-b border-gray-200 hover:bg-blue-50 rounded-lg px-4 transition-colors">
                    <span className="text-gray-700 font-medium">Base Fees:</span>
                    <span className="font-bold text-gray-900 text-lg">{formatCurrency(patient.fees)}</span>
                  </div>
                  <div className="flex justify-between items-center py-4 border-b border-gray-200 hover:bg-blue-50 rounded-lg px-4 transition-colors">
                    <span className="text-gray-700 font-medium">Blood Test:</span>
                    <span className="font-bold text-gray-900 text-lg">{formatCurrency(patient.bloodTest)}</span>
                  </div>
                  <div className="flex justify-between items-center py-4 border-b border-gray-200 hover:bg-blue-50 rounded-lg px-4 transition-colors">
                    <span className="text-gray-700 font-medium">Pickup Charge:</span>
                    <span className="font-bold text-gray-900 text-lg">{formatCurrency(patient.pickupCharge)}</span>
                  </div>
                  <div className="flex justify-between items-center py-4 border-b border-gray-200 hover:bg-blue-50 rounded-lg px-4 transition-colors">
                    <span className="text-gray-700 font-medium">Other Fees:</span>
                    <span className="font-bold text-gray-900 text-lg">{formatCurrency(patient.otherFees)}</span>
                  </div>
                  
                  {/* Total Amount - Highlighted */}
                  <div className="mt-4 pt-4 border-t-2 border-blue-200">
                    <div className="flex justify-between items-center py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg px-6 shadow-md">
                      <span className="font-bold text-lg">Total Amount:</span>
                      <span className="font-bold text-xl">{formatCurrency(patient.totalAmount)}</span>
                    </div>
                  </div>
                  
                  {/* Payment Method */}
                  <div className="mt-4">
                    <div className="flex justify-between items-center py-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg px-4">
                      <span className="text-green-700 font-medium flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Payment Method:
                      </span>
                      <span className="font-bold text-green-800 bg-green-100 px-3 py-1 rounded-full text-sm">{patient.paymentType || 'Cash'}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment History */}
            <Card className="modern-setting-card">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-800">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <CreditCard className="h-5 w-5 text-purple-600" />
                  </div>
                  Payment History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {payments.length > 0 ? (
                  <div className="space-y-4">
                    {payments.map((payment) => (
                      <div key={payment.id} className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                              <h4 className="font-bold text-xl text-gray-800">{formatCurrency(payment.amount)}</h4>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {formatDate(payment.date)}
                              </span>
                            </div>
                            <p className="text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">{payment.description}</p>
                          </div>
                          <div className="text-right space-y-2">
                            <Badge className="bg-green-100 text-green-800 font-medium px-3 py-1">{payment.paymentType}</Badge>
                            {payment.receiptNumber && (
                              <div className="text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                                Receipt: {payment.receiptNumber}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CreditCard className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Payment History</h3>
                    <p className="text-gray-600">No payment records found for this patient</p>
                    <p className="text-gray-400 text-sm mt-2">Payment history will appear here once payments are made</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-6">
            <Card className="modern-setting-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Identity Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {patient.patientAadhar && (
                    <div className="modern-setting-item">
                      <div className="modern-setting-label">
                        <Shield className="h-4 w-4" />
                        Patient Aadhar Card
                      </div>
                      <div className="mt-2">
                        <img 
                          src={getPatientPhotoUrl(patient.patientAadhar)} 
                          alt="Patient Aadhar"
                          className="w-full h-40 object-cover rounded-lg border"
                        />
                        <Button size="sm" variant="outline" className="mt-2">
                          <Eye className="h-4 w-4 mr-2" />
                          View Full
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {patient.patientPan && (
                    <div className="modern-setting-item">
                      <div className="modern-setting-label">
                        <Shield className="h-4 w-4" />
                        Patient PAN Card
                      </div>
                      <div className="mt-2">
                        <img 
                          src={getPatientPhotoUrl(patient.patientPan)} 
                          alt="Patient PAN"
                          className="w-full h-40 object-cover rounded-lg border"
                        />
                        <Button size="sm" variant="outline" className="mt-2">
                          <Eye className="h-4 w-4 mr-2" />
                          View Full
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {patient.attenderAadhar && (
                    <div className="modern-setting-item">
                      <div className="modern-setting-label">
                        <Shield className="h-4 w-4" />
                        Attender Aadhar Card
                      </div>
                      <div className="mt-2">
                        <img 
                          src={getPatientPhotoUrl(patient.attenderAadhar)} 
                          alt="Attender Aadhar"
                          className="w-full h-40 object-cover rounded-lg border"
                        />
                        <Button size="sm" variant="outline" className="mt-2">
                          <Eye className="h-4 w-4 mr-2" />
                          View Full
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {patient.attenderPan && (
                    <div className="modern-setting-item">
                      <div className="modern-setting-label">
                        <Shield className="h-4 w-4" />
                        Attender PAN Card
                      </div>
                      <div className="mt-2">
                        <img 
                          src={getPatientPhotoUrl(patient.attenderPan)} 
                          alt="Attender PAN"
                          className="w-full h-40 object-cover rounded-lg border"
                        />
                        <Button size="sm" variant="outline" className="mt-2">
                          <Eye className="h-4 w-4 mr-2" />
                          View Full
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                
                {!patient.patientAadhar && !patient.patientPan && !patient.attenderAadhar && !patient.attenderPan && (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No documents uploaded</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientBiodata;
