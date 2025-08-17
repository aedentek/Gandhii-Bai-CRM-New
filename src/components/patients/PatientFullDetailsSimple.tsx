import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, RefreshCw, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { patientsAPI } from '@/utils/api';
import { getPatientPhotoUrl, PatientPhoto } from '@/utils/photoUtils';
import LoadingScreen from '@/components/shared/LoadingScreen';
import { Label } from '@/components/ui/label';

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
  // Document fields
  patientAadhar?: string;
  patientPan?: string;
  attenderAadhar?: string;
  attenderPan?: string;
}

const PatientFullDetails: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  
  console.log('🔍 PatientFullDetails component loaded with patientId:', patientId);
  
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<Patient | null>(null);

  useEffect(() => {
    if (patientId) {
      loadPatientDetails();
    }
  }, [patientId]);

  const formatPatientId = (id: number): string => {
    return `P${id.toString().padStart(4, '0')}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'discharged':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const loadPatientDetails = async () => {
    setLoading(true);
    try {
      console.log('🔍 Loading patient details for ID:', patientId);
      
      // Use the same logic as the working popup
      const response = await patientsAPI.getAll();
      console.log('📡 API response received:', response);
      const patients = response.data || response;
      console.log('📋 Patients array:', patients);
      
      // Extract numeric ID from formatted ID (P0106 -> 106)
      let numericId: number;
      if (patientId?.startsWith('P')) {
        numericId = parseInt(patientId.substring(1), 10);
      } else {
        numericId = parseInt(patientId || '0', 10);
      }
      
      console.log('🔢 Searching for numeric ID:', numericId);
      
      // Find patient by numeric ID (same as popup logic)
      const foundPatient = patients.find((p: any) => {
        console.log('🔍 Comparing:', p.id, 'with', numericId);
        return p.id === numericId;
      });

      console.log('👤 Found patient:', foundPatient);

      if (foundPatient) {
        console.log('✅ Patient found, setting patient data...');
        
        // Transform the data exactly like the popup does
        const patientData = {
          ...foundPatient,
          originalId: foundPatient.id,
          id: formatPatientId(foundPatient.id),
          admissionDate: foundPatient.admissionDate ? new Date(foundPatient.admissionDate) : new Date(),
          dateOfBirth: foundPatient.dateOfBirth ? new Date(foundPatient.dateOfBirth) : new Date(),
        };
        
        setPatient(patientData);
        console.log('✅ Patient data set successfully:', patientData);
      } else {
        console.error('❌ Patient not found with ID:', patientId, 'Numeric ID:', numericId);
        throw new Error(`Patient not found with ID: ${patientId}`);
      }
    } catch (error) {
      console.error('❌ Error loading patient details:', error);
    } finally {
      setLoading(false);
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
            <Users className="h-12 w-12 text-muted-foreground" />
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

  // Use the exact same UI structure as the working popup
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
              <p className="text-gray-600">Complete medical profile</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={loadPatientDetails}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={handleEditPatient}>
              <span className="h-4 w-4 mr-2">✏️</span>
              Edit Patient
            </Button>
          </div>
        </div>

        {/* Main Content - Same as popup structure */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header Section */}
          <div className="relative pb-6 border-b border-blue-100 px-6 pt-6">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500"></div>
            <div className="flex items-center gap-4 mt-4">
              <div className="relative flex-shrink-0">
                <PatientPhoto 
                  photoPath={patient.photo} 
                  alt={patient.name}
                  className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                />
                <div className="absolute -bottom-1 -right-1">
                  <Badge className={`${getStatusBadge(patient.status)} border-2 border-white shadow-sm text-xs`}>
                    {patient.status.charAt(0).toUpperCase() + patient.status.slice(1)}
                  </Badge>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2 truncate">
                  <Users className="h-7 w-7 text-blue-600 flex-shrink-0" />
                  <span className="truncate">{patient.name}</span>
                </h2>
                <p className="text-xl text-gray-600 mt-1 truncate">
                  Patient ID: {patient.id} • Complete Medical Profile
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-6 space-y-8">
            {/* Personal Information Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-blue-100 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                Personal Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Label className="text-xs font-medium text-blue-600 uppercase tracking-wide">Full Name</Label>
                      <p className="text-lg font-semibold text-gray-900 truncate">{patient.name}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-white p-4 rounded-xl border border-green-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-green-600 font-bold text-sm">{patient.age}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <Label className="text-xs font-medium text-green-600 uppercase tracking-wide">Age & Gender</Label>
                      <p className="text-lg font-semibold text-gray-900">{patient.age} years • {patient.gender}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-white p-4 rounded-xl border border-purple-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Activity className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Label className="text-xs font-medium text-purple-600 uppercase tracking-wide">Date of Birth</Label>
                      <p className="text-lg font-semibold text-gray-900">
                        {patient.dateOfBirth && !isNaN(new Date(patient.dateOfBirth).getTime()) 
                          ? format(new Date(patient.dateOfBirth), 'dd-MM-yyyy') 
                          : 'Not provided'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 text-sm">📞</span>
                </div>
                Contact Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-white p-4 rounded-xl border border-green-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-green-600 text-lg">📞</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <Label className="text-xs font-medium text-green-600 uppercase tracking-wide">Phone Number</Label>
                      <p className="text-lg font-semibold text-gray-900 truncate">{patient.phone}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 text-lg">📧</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <Label className="text-xs font-medium text-blue-600 uppercase tracking-wide">Email Address</Label>
                      <p className="text-lg font-semibold text-gray-900 truncate">{patient.email || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-orange-50 to-white p-4 rounded-xl border border-orange-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-orange-600 text-lg">🚨</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <Label className="text-xs font-medium text-orange-600 uppercase tracking-wide">Emergency Contact</Label>
                      <p className="text-lg font-semibold text-gray-900 truncate">{patient.emergencyContact}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-gray-600 text-lg">🏠</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Address</Label>
                      <p className="text-sm font-medium text-gray-900 leading-relaxed">{patient.address}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Medical Information Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-red-100 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <Activity className="h-4 w-4 text-red-600" />
                </div>
                Medical Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-red-50 to-white p-4 rounded-xl border border-red-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-red-600 text-lg">📅</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <Label className="text-xs font-medium text-red-600 uppercase tracking-wide">Admission Date</Label>
                      <p className="text-lg font-semibold text-gray-900">
                        {patient.admissionDate && !isNaN(patient.admissionDate.getTime()) 
                          ? format(patient.admissionDate, 'dd-MM-yyyy') 
                          : 'Invalid Date'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {patient.medicalHistory && (
                  <div className="sm:col-span-2 bg-gradient-to-br from-purple-50 to-white p-4 rounded-xl border border-purple-100">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-purple-600 text-lg">📋</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <Label className="text-xs font-medium text-purple-600 uppercase tracking-wide">Medical History</Label>
                        <p className="text-sm text-gray-900 leading-relaxed mt-1">{patient.medicalHistory}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Information Section */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 backdrop-blur-sm border border-amber-200/50 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl">💰</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                    Payment Information
                  </h3>
                  <p className="text-sm text-amber-600/70 mt-1">Financial details and billing information</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Fees Card */}
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-amber-200/30 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 text-lg">🏥</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Label className="text-xs font-medium text-blue-600 uppercase tracking-wide">Consultation Fees</Label>
                      <p className="text-lg font-semibold text-gray-900 mt-1">₹{patient.fees || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Blood Test Card */}
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-amber-200/30 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-red-600 text-lg">🩸</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Label className="text-xs font-medium text-red-600 uppercase tracking-wide">Blood Test</Label>
                      <p className="text-lg font-semibold text-gray-900 mt-1">₹{patient.bloodTest || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Pickup Charge Card */}
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-amber-200/30 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-green-600 text-lg">🚗</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Label className="text-xs font-medium text-green-600 uppercase tracking-wide">Pickup Charge</Label>
                      <p className="text-lg font-semibold text-gray-900 mt-1">₹{patient.pickupCharge || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Total Amount Card */}
                <div className="bg-gradient-to-br from-purple-100 to-indigo-100 backdrop-blur-sm rounded-xl p-4 border border-purple-200/50 shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-lg">📊</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Label className="text-xs font-medium text-purple-600 uppercase tracking-wide">Total Amount</Label>
                      <p className="text-xl font-bold text-purple-700 mt-1">₹{patient.totalAmount || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Pay Amount Card */}
                <div className="bg-gradient-to-br from-green-100 to-emerald-100 backdrop-blur-sm rounded-xl p-4 border border-green-200/50 shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-lg">✅</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Label className="text-xs font-medium text-green-600 uppercase tracking-wide">Amount Paid</Label>
                      <p className="text-xl font-bold text-green-700 mt-1">₹{patient.payAmount || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Balance Card */}
                <div className={`backdrop-blur-sm rounded-xl p-4 border shadow-md ${
                  (patient.balance || 0) > 0 
                    ? 'bg-gradient-to-br from-red-100 to-rose-100 border-red-200/50' 
                    : 'bg-gradient-to-br from-gray-100 to-slate-100 border-gray-200/50'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      (patient.balance || 0) > 0 
                        ? 'bg-red-500' 
                        : 'bg-gray-500'
                    }`}>
                      <span className="text-white text-lg">
                        {(patient.balance || 0) > 0 ? '⚠️' : '🎉'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Label className={`text-xs font-medium uppercase tracking-wide ${
                        (patient.balance || 0) > 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {(patient.balance || 0) > 0 ? 'Outstanding Balance' : 'Balance'}
                      </Label>
                      <p className={`text-xl font-bold mt-1 ${
                        (patient.balance || 0) > 0 ? 'text-red-700' : 'text-gray-700'
                      }`}>
                        ₹{patient.balance || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Type Section */}
              {patient.paymentType && (
                <div className="mt-6 bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-amber-200/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-indigo-600 text-lg">💳</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Label className="text-xs font-medium text-indigo-600 uppercase tracking-wide">Payment Method</Label>
                      <p className="text-sm font-medium text-gray-900 mt-1">{patient.paymentType}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Document Information Section */}
            <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 backdrop-blur-sm border border-slate-200/50 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-500 to-gray-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl">📄</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-slate-600 to-gray-700 bg-clip-text text-transparent">
                    Document Information
                  </h3>
                  <p className="text-sm text-slate-600/70 mt-1">Identity documents and verification files</p>
                </div>
              </div>

              {/* Debug Information */}
              <div className="mb-6 p-4 bg-yellow-50/80 backdrop-blur-sm border border-yellow-200/50 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-yellow-600 text-sm">🔍</span>
                  <strong className="text-sm font-medium text-yellow-800">Debug Information</strong>
                </div>
                <div className="text-xs space-y-2 text-yellow-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <strong>Database Values:</strong>
                      <br />
                      • Patient Aadhar: {patient.patientAadhar || 'Not set'} {patient.patientAadhar ? '✅' : '❌'}
                      <br />
                      • Patient PAN: {patient.patientPan || 'Not set'} {patient.patientPan ? '✅' : '❌'}
                      <br />
                      • Attender Aadhar: {patient.attenderAadhar || 'Not set'} {patient.attenderAadhar ? '✅' : '❌'}
                      <br />
                      • Attender PAN: {patient.attenderPan || 'Not set'} {patient.attenderPan ? '✅' : '❌'}
                    </div>
                    <div>
                      <strong>System Info:</strong>
                      <br />
                      • Patient ID: {patient.id}
                      <br />
                      • Last Refresh: {new Date().toLocaleTimeString()}
                      <br />
                      • Total Documents: {[patient.patientAadhar, patient.patientPan, patient.attenderAadhar, patient.attenderPan].filter(Boolean).length}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Patient Documents */}
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-5 border border-slate-200/30 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 text-sm">👤</span>
                    </div>
                    <h4 className="text-lg font-semibold text-blue-700">Patient Documents</h4>
                  </div>
                  
                  <div className="space-y-4">
                    {patient.patientAadhar && patient.patientAadhar.trim() !== '' ? (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200/50">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-blue-600 text-sm">🪪</span>
                          <Label className="text-sm font-medium text-blue-700">Aadhar Card</Label>
                        </div>
                        <div className="relative group">
                          <img
                            src={getPatientPhotoUrl(patient.patientAadhar)}
                            alt="Patient Aadhar Card"
                            className="w-full h-40 object-cover rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
                            onClick={() => window.open(getPatientPhotoUrl(patient.patientAadhar), '_blank')}
                            onError={(e) => {
                              console.error('❌ Failed to load Patient Aadhar image:', patient.patientAadhar);
                              console.error('❌ Constructed URL:', getPatientPhotoUrl(patient.patientAadhar));
                              const img = e.currentTarget as HTMLImageElement;
                              img.style.display = 'none';
                              if (!img.parentNode?.querySelector('.error-message')) {
                                const errorDiv = document.createElement('div');
                                errorDiv.className = 'error-message p-4 bg-red-50 border border-red-200 rounded-lg text-center';
                                errorDiv.innerHTML = `<div class="text-red-500 text-sm font-medium mb-2">⚠️ Failed to load image</div><div class="text-xs text-red-400 font-mono">${patient.patientAadhar}</div>`;
                                img.parentNode?.appendChild(errorDiv);
                              }
                            }}
                            onLoad={() => {
                              console.log('✅ Patient Aadhar loaded successfully:', patient.patientAadhar);
                            }}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-all duration-200 flex items-center justify-center">
                            <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium bg-black/50 px-3 py-1 rounded-full transition-all duration-200">
                              Click to open
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {patient.patientPan && patient.patientPan.trim() !== '' ? (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200/50">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-green-600 text-sm">💳</span>
                          <Label className="text-sm font-medium text-green-700">PAN Card</Label>
                        </div>
                        <div className="relative group">
                          <img
                            src={getPatientPhotoUrl(patient.patientPan)}
                            alt="Patient PAN Card"
                            className="w-full h-40 object-cover rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
                            onClick={() => window.open(getPatientPhotoUrl(patient.patientPan), '_blank')}
                            onError={(e) => {
                              console.error('❌ Failed to load Patient PAN image:', patient.patientPan);
                              console.error('❌ Constructed URL:', getPatientPhotoUrl(patient.patientPan));
                              const img = e.currentTarget as HTMLImageElement;
                              img.style.display = 'none';
                              if (!img.parentNode?.querySelector('.error-message')) {
                                const errorDiv = document.createElement('div');
                                errorDiv.className = 'error-message p-4 bg-red-50 border border-red-200 rounded-lg text-center';
                                errorDiv.innerHTML = `<div class="text-red-500 text-sm font-medium mb-2">⚠️ Failed to load image</div><div class="text-xs text-red-400 font-mono">${patient.patientPan}</div>`;
                                img.parentNode?.appendChild(errorDiv);
                              }
                            }}
                            onLoad={() => {
                              console.log('✅ Patient PAN loaded successfully:', patient.patientPan);
                            }}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-all duration-200 flex items-center justify-center">
                            <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium bg-black/50 px-3 py-1 rounded-full transition-all duration-200">
                              Click to open
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {!patient.patientAadhar && !patient.patientPan && (
                      <div className="text-center py-8 text-gray-500">
                        <span className="text-4xl mb-2 block">📄</span>
                        <p className="text-sm">No patient documents uploaded</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Attender Documents */}
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-5 border border-slate-200/30 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span className="text-purple-600 text-sm">👥</span>
                    </div>
                    <h4 className="text-lg font-semibold text-purple-700">Attender Documents</h4>
                  </div>
                  
                  <div className="space-y-4">
                    {patient.attenderAadhar && patient.attenderAadhar.trim() !== '' ? (
                      <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg p-4 border border-purple-200/50">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-purple-600 text-sm">🪪</span>
                          <Label className="text-sm font-medium text-purple-700">Aadhar Card</Label>
                        </div>
                        <div className="relative group">
                          <img
                            src={getPatientPhotoUrl(patient.attenderAadhar)}
                            alt="Attender Aadhar Card"
                            className="w-full h-40 object-cover rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
                            onClick={() => window.open(getPatientPhotoUrl(patient.attenderAadhar), '_blank')}
                            onError={(e) => {
                              console.error('❌ Failed to load Attender Aadhar image:', patient.attenderAadhar);
                              console.error('❌ Constructed URL:', getPatientPhotoUrl(patient.attenderAadhar));
                              const img = e.currentTarget as HTMLImageElement;
                              img.style.display = 'none';
                              if (!img.parentNode?.querySelector('.error-message')) {
                                const errorDiv = document.createElement('div');
                                errorDiv.className = 'error-message p-4 bg-red-50 border border-red-200 rounded-lg text-center';
                                errorDiv.innerHTML = `<div class="text-red-500 text-sm font-medium mb-2">⚠️ Failed to load image</div><div class="text-xs text-red-400 font-mono">${patient.attenderAadhar}</div>`;
                                img.parentNode?.appendChild(errorDiv);
                              }
                            }}
                            onLoad={() => {
                              console.log('✅ Attender Aadhar loaded successfully:', patient.attenderAadhar);
                            }}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-all duration-200 flex items-center justify-center">
                            <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium bg-black/50 px-3 py-1 rounded-full transition-all duration-200">
                              Click to open
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {patient.attenderPan && patient.attenderPan.trim() !== '' ? (
                      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4 border border-orange-200/50">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-orange-600 text-sm">💳</span>
                          <Label className="text-sm font-medium text-orange-700">PAN Card</Label>
                        </div>
                        <div className="relative group">
                          <img
                            src={getPatientPhotoUrl(patient.attenderPan)}
                            alt="Attender PAN Card"
                            className="w-full h-40 object-cover rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
                            onClick={() => window.open(getPatientPhotoUrl(patient.attenderPan), '_blank')}
                            onError={(e) => {
                              console.error('❌ Failed to load Attender PAN image:', patient.attenderPan);
                              console.error('❌ Constructed URL:', getPatientPhotoUrl(patient.attenderPan));
                              const img = e.currentTarget as HTMLImageElement;
                              img.style.display = 'none';
                              if (!img.parentNode?.querySelector('.error-message')) {
                                const errorDiv = document.createElement('div');
                                errorDiv.className = 'error-message p-4 bg-red-50 border border-red-200 rounded-lg text-center';
                                errorDiv.innerHTML = `<div class="text-red-500 text-sm font-medium mb-2">⚠️ Failed to load image</div><div class="text-xs text-red-400 font-mono">${patient.attenderPan}</div>`;
                                img.parentNode?.appendChild(errorDiv);
                              }
                            }}
                            onLoad={() => {
                              console.log('✅ Attender PAN loaded successfully:', patient.attenderPan);
                            }}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-all duration-200 flex items-center justify-center">
                            <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium bg-black/50 px-3 py-1 rounded-full transition-all duration-200">
                              Click to open
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {!patient.attenderAadhar && !patient.attenderPan && (
                      <div className="text-center py-8 text-gray-500">
                        <span className="text-4xl mb-2 block">📄</span>
                        <p className="text-sm">No attender documents uploaded</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientFullDetails;
