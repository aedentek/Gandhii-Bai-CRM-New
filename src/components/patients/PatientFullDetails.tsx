import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { 
  ArrowLeft, User, Calendar, Phone, Mail, MapPin, 
  Heart, CreditCard, Clock, FileText, Activity, 
  Users, Eye, Download, Edit2, RefreshCw
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { DatabaseService } from '@/services/databaseService';
import { patientsAPI } from '@/utils/api';
import LoadingScreen from '@/components/shared/LoadingScreen';
import '../../styles/modern-forms.css';
import '../../styles/modern-tables.css';

interface Patient {
  id: string;
  originalId: number;
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
  photo: string;
  fees: number;
  bloodTest: number;
  pickupCharge: number;
  totalAmount: number;
  payAmount: number;
  balance: number;
  paymentType: string;
  fatherName: string;
  motherName: string;
  attenderRelationship: string;
  dateOfBirth: Date;
  marriageStatus: string;
  employeeStatus: string;
  patientAadhar?: string;
  patientPan?: string;
  attenderAadhar?: string;
  attenderPan?: string;
}

interface AttendanceRecord {
  id: string;
  patient_id: string;
  attendance_date: string;
  check_in_time: string;
  check_out_time?: string;
  status: 'Present' | 'Absent' | 'Late';
  notes?: string;
}

interface MedicalRecord {
  id: string;
  patient_id: string;
  date: string;
  symptoms: string;
  diagnosis: string;
  treatment: string;
  prescription: string;
  notes?: string;
  doctor_name?: string;
}

interface PatientHistoryRecord {
  id: string;
  patient_id: string;
  visit_date: string;
  reason: string;
  symptoms: string;
  diagnosis: string;
  treatment: string;
  prescription: string;
  doctor_name: string;
  notes?: string;
}

interface CallRecord {
  id: string;
  patientId: string;
  date: string;
  description: string;
  callType: 'Incoming' | 'Outgoing';
  duration?: string;
  notes?: string;
}

interface PaymentRecord {
  id: string;
  patient_id: string;
  payment_date: string;
  amount: number;
  payment_type: string;
  description?: string;
  status: 'Paid' | 'Pending' | 'Overdue';
}

const PatientFullDetails: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  
  console.log('🔍 PatientFullDetails component loaded with patientId:', patientId);
  
  // Add alert for debugging
  React.useEffect(() => {
    console.log('🚨 PatientFullDetails useEffect triggered with patientId:', patientId);
  }, [patientId]);
  
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [patientHistory, setPatientHistory] = useState<PatientHistoryRecord[]>([]);
  const [callRecords, setCallRecords] = useState<CallRecord[]>([]);
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    console.log('🔄 useEffect triggered with patientId:', patientId);
    if (patientId) {
      loadPatientDetails();
    } else {
      console.error('❌ No patientId provided');
      setLoading(false);
    }
  }, [patientId]);

  const formatPatientId = (id: number): string => {
    return `P${id.toString().padStart(4, '0')}`;
  };

  const loadPatientDetails = async () => {
    setLoading(true);
    try {
      console.log('🔍 Loading patient details for ID:', patientId);

      // Load patient basic information first
      await loadPatientInfo();
      
    } catch (error) {
      console.error('❌ Error loading patient details:', error);
      toast({
        title: "Error",
        description: "Failed to load patient details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPatientInfo = async () => {
    try {
      console.log('🔄 Starting to load patient info...');
      const response = await patientsAPI.getAll();
      console.log('📡 API response received:', response);
      const patients = response.data || response;
      console.log('📋 Patients array:', patients);
      
      console.log('🔍 Looking for patient with ID:', patientId);
      console.log('📋 Available patients:', patients?.map((p: any) => ({ id: p.id, name: p.name, formatted: formatPatientId(p.id) })));
      
      // Extract numeric ID from formatted ID (P0106 -> 106)
      let numericId: number;
      if (patientId?.startsWith('P')) {
        numericId = parseInt(patientId.substring(1), 10);
      } else {
        numericId = parseInt(patientId || '0', 10);
      }
      
      console.log('🔢 Searching for numeric ID:', numericId);
      
      // Find patient by numeric ID
      const foundPatient = patients.find((p: any) => {
        console.log('🔍 Comparing:', p.id, 'with', numericId);
        return p.id === numericId;
      });

      console.log('👤 Found patient:', foundPatient);

      if (foundPatient) {
        console.log('✅ Patient found, setting patient data...');
        const patientData = {
          ...foundPatient,
          originalId: foundPatient.id,
          id: formatPatientId(foundPatient.id),
          admissionDate: foundPatient.admissionDate ? new Date(foundPatient.admissionDate) : new Date(),
          dateOfBirth: foundPatient.dateOfBirth ? new Date(foundPatient.dateOfBirth) : new Date(),
        };
        setPatient(patientData);
        console.log('✅ Patient data set successfully');
        
        // Load all related data after patient is set
        console.log('🔄 Loading related data...');
        await loadAllRelatedData(foundPatient.id);
        console.log('✅ All related data loaded');
      } else {
        console.error('❌ Patient not found with ID:', patientId, 'Numeric ID:', numericId);
        console.error('Available patients:', patients);
        throw new Error(`Patient not found with ID: ${patientId}`);
      }
    } catch (error) {
      console.error('❌ Error loading patient info:', error);
      throw error;
    }
  };

  const loadAllRelatedData = async (originalPatientId: number) => {
    try {
      // Load all related data in parallel
      await Promise.all([
        loadAttendanceRecords(originalPatientId),
        loadMedicalRecords(originalPatientId),
        loadPatientHistory(originalPatientId),
        loadCallRecords(originalPatientId),
        loadPaymentRecords(originalPatientId)
      ]);
    } catch (error) {
      console.error('❌ Error loading related data:', error);
    }
  };

  const loadAttendanceRecords = async (originalPatientId: number) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/patient-attendance`);
      if (response.ok) {
        const data = await response.json();
        const records = (data.data || data).filter((record: any) => 
          record.patient_id?.toString() === originalPatientId?.toString()
        );
        setAttendanceRecords(records.slice(0, 10)); // Show latest 10 records
      }
    } catch (error) {
      console.error('❌ Error loading attendance records:', error);
    }
  };

  const loadMedicalRecords = async (originalPatientId: number) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/patient-medical-records`);
      if (response.ok) {
        const data = await response.json();
        const records = (data.data || data).filter((record: any) => 
          record.patient_id?.toString() === originalPatientId?.toString()
        );
        setMedicalRecords(records.slice(0, 10)); // Show latest 10 records
      }
    } catch (error) {
      console.error('❌ Error loading medical records:', error);
    }
  };

  const loadPatientHistory = async (originalPatientId: number) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/patient-history`);
      if (response.ok) {
        const data = await response.json();
        const records = (data.data || data).filter((record: any) => 
          record.patient_id?.toString() === originalPatientId?.toString()
        );
        setPatientHistory(records.slice(0, 10)); // Show latest 10 records
      }
    } catch (error) {
      console.error('❌ Error loading patient history:', error);
    }
  };

  const loadCallRecords = async (originalPatientId: number) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/patient-call-records`);
      if (response.ok) {
        const data = await response.json();
        const records = (data.data || data).filter((record: any) => 
          record.patientId?.toString() === originalPatientId?.toString()
        );
        setCallRecords(records.slice(0, 10)); // Show latest 10 records
      }
    } catch (error) {
      console.error('❌ Error loading call records:', error);
    }
  };

  const loadPaymentRecords = async (originalPatientId: number) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/patient-payment-fees`);
      if (response.ok) {
        const data = await response.json();
        const records = (data.data || data).filter((record: any) => 
          record.patient_id?.toString() === originalPatientId?.toString()
        );
        setPaymentRecords(records.slice(0, 10)); // Show latest 10 records
      }
    } catch (error) {
      console.error('❌ Error loading payment records:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'present':
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'inactive':
      case 'absent':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'late':
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleEditPatient = () => {
    navigate(`/patients/list?edit=${patient?.originalId}`);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!patient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center space-y-4 pt-6">
            <User className="h-12 w-12 text-muted-foreground" />
            <div className="text-center">
              <h3 className="text-lg font-semibold">Patient Not Found</h3>
              <p className="text-sm text-muted-foreground">
                The patient with ID {patientId} could not be found.
              </p>
            </div>
            <Button onClick={() => navigate('/patients/list')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Patient List
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/patients/list')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Patients</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Patient Details</h1>
              <p className="text-gray-600">Comprehensive view of patient information</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={loadPatientDetails}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={handleEditPatient}>
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Patient
            </Button>
          </div>
        </div>

        {/* Patient Overview Card */}
        <Card className="w-full">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                  {patient.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <CardTitle className="text-2xl">{patient.name}</CardTitle>
                  <p className="text-lg text-muted-foreground">Patient ID: {patient.id}</p>
                </div>
              </div>
              <Badge className={getStatusColor(patient.status)} variant="secondary">
                {patient.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Personal Info</span>
                </div>
                <div className="space-y-1">
                  <p><span className="font-medium">Age:</span> {patient.age} years</p>
                  <p><span className="font-medium">Gender:</span> {patient.gender}</p>
                  <p><span className="font-medium">DOB:</span> {format(patient.dateOfBirth, 'dd MMM yyyy')}</p>
                  <p><span className="font-medium">Marriage:</span> {patient.marriageStatus}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>Contact Info</span>
                </div>
                <div className="space-y-1">
                  <p><span className="font-medium">Phone:</span> {patient.phone}</p>
                  <p><span className="font-medium">Email:</span> {patient.email || 'N/A'}</p>
                  <p><span className="font-medium">Emergency:</span> {patient.emergencyContact}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Family Info</span>
                </div>
                <div className="space-y-1">
                  <p><span className="font-medium">Father:</span> {patient.fatherName || 'N/A'}</p>
                  <p><span className="font-medium">Mother:</span> {patient.motherName || 'N/A'}</p>
                  <p><span className="font-medium">Attender:</span> {patient.attenderName}</p>
                  <p><span className="font-medium">Relation:</span> {patient.attenderRelationship}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <CreditCard className="h-4 w-4" />
                  <span>Financial Info</span>
                </div>
                <div className="space-y-1">
                  <p><span className="font-medium">Total:</span> ₹{patient.totalAmount?.toFixed(2) || '0.00'}</p>
                  <p><span className="font-medium">Paid:</span> ₹{patient.payAmount?.toFixed(2) || '0.00'}</p>
                  <p><span className="font-medium">Balance:</span> ₹{patient.balance?.toFixed(2) || '0.00'}</p>
                  <p><span className="font-medium">Type:</span> {patient.paymentType}</p>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2 flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  Address
                </h4>
                <p className="text-sm text-muted-foreground">{patient.address}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 flex items-center">
                  <Heart className="h-4 w-4 mr-2" />
                  Medical History
                </h4>
                <p className="text-sm text-muted-foreground">{patient.medicalHistory || 'No medical history available'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Different Sections */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="medical">Medical Records</TabsTrigger>
            <TabsTrigger value="history">Patient History</TabsTrigger>
            <TabsTrigger value="calls">Call Records</TabsTrigger>
            <TabsTrigger value="payments">Payment Fees</TabsTrigger>
          </TabsList>

          {/* Attendance Tab */}
          <TabsContent value="attendance">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5" />
                    <span>Attendance Records</span>
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={() => navigate('/patients/attendance')}>
                    <Eye className="h-4 w-4 mr-2" />
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {attendanceRecords.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Check In</TableHead>
                        <TableHead>Check Out</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendanceRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{format(parseISO(record.attendance_date), 'dd MMM yyyy')}</TableCell>
                          <TableCell>{record.check_in_time}</TableCell>
                          <TableCell>{record.check_out_time || 'Not checked out'}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(record.status)} variant="secondary">
                              {record.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{record.notes || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No attendance records found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Medical Records Tab */}
          <TabsContent value="medical">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Medical Records</span>
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={() => navigate('/patients/medical-records')}>
                    <Eye className="h-4 w-4 mr-2" />
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {medicalRecords.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Symptoms</TableHead>
                        <TableHead>Diagnosis</TableHead>
                        <TableHead>Treatment</TableHead>
                        <TableHead>Doctor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {medicalRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{format(parseISO(record.date), 'dd MMM yyyy')}</TableCell>
                          <TableCell>{record.symptoms}</TableCell>
                          <TableCell>{record.diagnosis}</TableCell>
                          <TableCell>{record.treatment}</TableCell>
                          <TableCell>{record.doctor_name || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No medical records found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Patient History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>Patient History</span>
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={() => navigate('/patients/history')}>
                    <Eye className="h-4 w-4 mr-2" />
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {patientHistory.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Visit Date</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Diagnosis</TableHead>
                        <TableHead>Treatment</TableHead>
                        <TableHead>Doctor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {patientHistory.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{format(parseISO(record.visit_date), 'dd MMM yyyy')}</TableCell>
                          <TableCell>{record.reason}</TableCell>
                          <TableCell>{record.diagnosis}</TableCell>
                          <TableCell>{record.treatment}</TableCell>
                          <TableCell>{record.doctor_name}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No patient history found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Call Records Tab */}
          <TabsContent value="calls">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Phone className="h-5 w-5" />
                    <span>Call Records</span>
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={() => navigate('/patients/call-records')}>
                    <Eye className="h-4 w-4 mr-2" />
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {callRecords.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {callRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{format(parseISO(record.date), 'dd MMM yyyy')}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {record.callType}
                            </Badge>
                          </TableCell>
                          <TableCell>{record.duration || 'N/A'}</TableCell>
                          <TableCell>{record.description}</TableCell>
                          <TableCell>{record.notes || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No call records found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Fees Tab */}
          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5" />
                    <span>Payment Records</span>
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={() => navigate('/patients/payment-fees')}>
                    <Eye className="h-4 w-4 mr-2" />
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {paymentRecords.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Payment Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{format(parseISO(record.payment_date), 'dd MMM yyyy')}</TableCell>
                          <TableCell>₹{record.amount.toFixed(2)}</TableCell>
                          <TableCell>{record.payment_type}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(record.status)} variant="secondary">
                              {record.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{record.description || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No payment records found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PatientFullDetails;
