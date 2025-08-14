import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Heart,
  FileText,
  IndianRupee,
  Users,
  Camera,
  Download,
  Edit2,
  Activity,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  File,
  Play,
  Pause,
  Volume2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DatabaseService } from '@/services/databaseService';
import { getFileUrl } from '@/services/simpleFileUpload';
import { useToast } from '@/hooks/use-toast';

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
  patientAadhar: string;
  patientPan: string;
  attenderAadhar: string;
  attenderPan: string;
}

interface MedicalRecord {
  id: number;
  patientId: string;
  patientName: string;
  date: string;
  recordType: string;
  description: string;
  images: string[];
  createdAt: string;
  createdBy: string;
}

interface ViewMedicalRecord {
  id: number;
  patientId: string;
  patientName: string;
  date: string;
  recordType: string;
  description: string;
  images: string[];
  createdAt: string;
  createdBy: string;
}

const PatientFullyHistory: React.FC = () => {
  console.log('🚀 PatientFullyHistory component is loading...');
  console.log('🌐 Current URL:', window.location.href);
  console.log('🛣️  Current pathname:', window.location.pathname);
  
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  console.log('🏥 PatientFullyHistory component loaded with patientId:', patientId);

  // State variables
  const [patient, setPatient] = useState<Patient | null>(null);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [medicalRecordsLoading, setMedicalRecordsLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [viewRecord, setViewRecord] = useState<ViewMedicalRecord | null>(null);
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(10);
  const [filterMonth, setFilterMonth] = useState(String(new Date().getMonth() + 1));
  
  // Helper constants
  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  // Simple early return for testing if no patientId
  if (!patientId) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-lg text-red-600">No patient ID found in URL</div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    console.log('🔄 useEffect triggered with patientId:', patientId);
    if (patientId) {
      console.log('✅ patientId exists, calling loadPatientDetails and loadMedicalRecords');
      loadPatientDetails();
      loadMedicalRecords();
    } else {
      console.log('❌ No patientId, skipping data loading');
    }
  }, [patientId, selectedMonth, filterYear]);

  const loadPatientDetails = async () => {
    console.log('🔍 loadPatientDetails called with patientId:', patientId);
    setLoading(true);
    try {
      console.log('📡 Calling DatabaseService.getAllPatients()...');
      const data = await DatabaseService.getAllPatients();
      console.log('📦 Database response received:', data.length, 'patients');
      
      console.log('🔍 Searching for patient with ID:', patientId, 'in', data.length, 'patients');
      console.log('🔍 First few patients from DB:', data.slice(0, 3).map(p => ({ 
        dbId: p.id, 
        name: p.name
      })));
      
      // The database stores numeric IDs (1, 2, 3...) but frontend uses P-prefixed format (P0001, P0002...)
      // So we need to convert P0001 -> 1 for matching
      const urlId = String(patientId).trim();
      const urlNumericId = urlId.startsWith('P') ? parseInt(urlId.replace(/^P0*/i, '')) : parseInt(urlId);
      
      console.log('🔍 Converted ID for search:', {
        originalUrlId: urlId,
        numericIdForSearch: urlNumericId
      });
      
      // Enhanced search logic to handle mixed database structure:
      // - Some patients have patient_id field (P0067, P0068) 
      // - Others have NULL in patient_id field
      // - All patients have numeric id field (67, 68, 70...)
      const foundPatient = data.find((p: any) => {
        const urlId = String(patientId).trim();
        const urlNumericId = urlId.startsWith('P') ? parseInt(urlId.replace(/^P0*/i, '')) : parseInt(urlId);
        const dbId = parseInt(p.id);
        
        // Check multiple matching strategies
        const isMatch = 
          // 1. Direct patient_id match if it exists (P0067 === P0067)
          (p.patient_id && String(p.patient_id).trim() === urlId) ||
          // 2. Match by database numeric ID (67 === 67)
          (dbId === urlNumericId) ||
          // 3. For NULL patient_id fields, match by generated P-format
          (!p.patient_id && urlId === `P${String(p.id).padStart(4, '0')}`);
        
        // Debug log for first 3 patients or if match found
        if (data.indexOf(p) < 3 || isMatch) {
          console.log('🔍 Enhanced Patient Matching:', {
            patient: p.name,
            dbId: dbId,
            patient_id: p.patient_id || 'NULL in DB',
            generatedPId: `P${String(p.id).padStart(4, '0')}`,
            urlId: urlId,
            urlNumericId: urlNumericId,
            isMatch: isMatch
          });
        }
        
        return isMatch;
      });
      
      if (foundPatient) {
        console.log('✅ Patient found:', foundPatient.name, 'DB ID:', foundPatient.id, 'Patient ID:', foundPatient.patient_id);
        
        const parseDateFromDDMMYYYY = (dateStr: any): Date => {
          if (!dateStr) return new Date();
          
          // If it's already a Date object, return it
          if (dateStr instanceof Date) return dateStr;
          
          // If it's in DD-MM-YYYY format
          if (typeof dateStr === 'string' && dateStr.match(/^\d{2}-\d{2}-\d{4}$/)) {
            const [day, month, year] = dateStr.split('-');
            return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          }
          
          // If it's in YYYY-MM-DD format, convert normally
          if (typeof dateStr === 'string' && dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
            return new Date(dateStr);
          }
          
          // Try to parse as regular date
          const parsed = new Date(dateStr);
          return isNaN(parsed.getTime()) ? new Date() : parsed;
        };

        // Generate P-prefixed ID for consistency with PatientList
        const displayPatientId = `P${String(foundPatient.id).padStart(4, '0')}`;
        const numericId = parseInt(foundPatient.id) || 1;
        
        const fees = parseFloat(foundPatient.fees) || 0;
        const bloodTest = parseFloat(foundPatient.bloodTest) || 0;
        const pickupCharge = parseFloat(foundPatient.pickupCharge) || 0;
        const payAmount = parseFloat(foundPatient.payAmount) || 0;
        
        // Calculate total amount and balance
        const totalAmount = fees + bloodTest + pickupCharge;
        const balance = totalAmount - payAmount;

        const parsedPatient: Patient = {
          id: patientId,
          originalId: numericId,
          name: foundPatient.name,
          age: parseInt(foundPatient.age) || 0,
          gender: foundPatient.gender,
          phone: foundPatient.phone,
          email: foundPatient.email || '',
          address: foundPatient.address,
          emergencyContact: foundPatient.emergencyContact || '',
          medicalHistory: foundPatient.medicalHistory || '',
          admissionDate: parseDateFromDDMMYYYY(foundPatient.admissionDate),
          status: foundPatient.status || 'Active',
          attenderName: foundPatient.attenderName || '',
          attenderPhone: foundPatient.attenderPhone || '',
          photo: foundPatient.photo || '',
          fees: fees,
          bloodTest: bloodTest,
          pickupCharge: pickupCharge,
          totalAmount: totalAmount,
          payAmount: payAmount,
          balance: balance,
          paymentType: foundPatient.paymentType || '',
          fatherName: foundPatient.fatherName || '',
          motherName: foundPatient.motherName || '',
          attenderRelationship: foundPatient.attenderRelationship || '',
          dateOfBirth: parseDateFromDDMMYYYY(foundPatient.dateOfBirth),
          marriageStatus: foundPatient.marriageStatus || '',
          employeeStatus: foundPatient.employeeStatus || '',
          patientAadhar: foundPatient.patientAadhar || '',
          patientPan: foundPatient.patientPan || '',
          attenderAadhar: foundPatient.attenderAadhar || '',
          attenderPan: foundPatient.attenderPan || ''
        };

        setPatient(parsedPatient);
      } else {
        console.log('❌ Patient not found with ID:', patientId);
        console.log('Available patients:', data.map(p => ({ id: p.id, originalId: p.originalId, name: p.name })));
        toast({
          title: "Patient Not Found",
          description: "The requested patient could not be found.",
          variant: "destructive",
        });
        // Temporarily commenting out the redirect to debug
        // navigate('/patients/list');
      }
    } catch (error) {
      console.error('Error loading patient details:', error);
      toast({
        title: "Error",
        description: "Failed to load patient details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMedicalRecords = async () => {
    setMedicalRecordsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/patient-history`);
      if (response.ok) {
        const allRecords = await response.json();
        // Filter records for current patient and selected month
        const filteredRecords = allRecords.filter((record: any) => {
          const recordPatientId = record.patient_id || `P${record.patient_id?.toString().padStart(4, '0')}`;
          const recordDate = new Date(record.date);
          const recordMonth = recordDate.getMonth() + 1; // Get month as number (1-12)
          const recordYear = recordDate.getFullYear();
          
          return (record.patient_id === patientId || recordPatientId === patientId) &&
                 (recordMonth === selectedMonth && recordYear === filterYear);
        });
        
        // Map the patient_history data to MedicalRecord format
        const mappedRecords = filteredRecords.map((record: any) => {
          let images: string[] = [];
          
          // Handle documents_info field
          if (record.documents_info) {
            try {
              const documentsData = JSON.parse(record.documents_info);
              if (Array.isArray(documentsData)) {
                images = documentsData.map((doc: any) => {
                  // Handle different document formats
                  if (typeof doc === 'string') {
                    return doc;
                  } else if (doc.data) {
                    return doc.data; // Base64 data
                  } else if (doc.filePath) {
                    return doc.filePath; // File path
                  } else if (doc.name) {
                    return doc.name; // File name
                  }
                  return '';
                }).filter(Boolean);
              }
            } catch (e) {
              console.warn('Error parsing documents_info:', e);
              images = [];
            }
          }
          
          return {
            id: record.id,
            patientId: record.patient_id,
            patientName: record.patient_name,
            date: record.date,
            recordType: record.category || record.title || 'Medical Record',
            description: record.description,
            images: images,
            createdAt: record.date,
            createdBy: record.doctor || 'Unknown'
          };
        });
        
        setMedicalRecords(mappedRecords);
      }
    } catch (error) {
      console.error('Error loading medical records:', error);
      toast({
        title: "Error",
        description: "Failed to load medical records. Please try again.",
        variant: "destructive",
      });
    } finally {
      setMedicalRecordsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      Active: 'bg-success text-success-foreground',
      Inactive: 'bg-muted text-muted-foreground',
      Critical: 'bg-destructive text-destructive-foreground',
      Discharged: 'bg-warning text-warning-foreground'
    };
    return variants[status as keyof typeof variants] || 'bg-muted text-muted-foreground';
  };

  const exportPatientData = () => {
    if (!patient) return;
    
    const patientData = {
      ...patient,
      admissionDate: patient.admissionDate ? format(patient.admissionDate, 'dd/MM/yyyy') : '',
      dateOfBirth: patient.dateOfBirth ? format(patient.dateOfBirth, 'dd/MM/yyyy') : ''
    };
    
    const dataStr = JSON.stringify(patientData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${patient.name}_${patient.id}_full_details.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Delete medical record
  const handleDeleteMedicalRecord = async (record: MedicalRecord | ViewMedicalRecord) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/patient-history/${record.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove from local state
        setMedicalRecords(prev => prev.filter(r => r.id !== record.id));
        
        // Close view dialog if open
        if (viewRecord && viewRecord.id === record.id) {
          setViewRecord(null);
        }
        
        toast({
          title: "Success",
          description: "Medical record deleted successfully.",
        });
      } else {
        throw new Error('Failed to delete record');
      }
    } catch (error) {
      console.error('Error deleting medical record:', error);
      toast({
        title: "Error",
        description: "Failed to delete medical record. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-lg">Loading patient details...</div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-lg text-muted-foreground">Patient not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="bg-gray-100 hover:bg-gray-200 text-gray-600 border-gray-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Patient List
            </Button>
            <div className="p-2 bg-primary rounded-lg">
              <User className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Patient Full History</h1>
              {/* <p className="text-muted-foreground">Complete details for {patient.name} ({patient.id})</p> */}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => console.log('Edit patient functionality temporarily disabled')}
              className="bg-blue-100 hover:bg-blue-200 text-blue-600 border-blue-200"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Patient
            </Button>
            <Button
              variant="outline"
              onClick={exportPatientData}
              className="bg-purple-100 hover:bg-purple-200 text-purple-600 border-purple-200"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Photo and Basic Info */}
        <div className="lg:col-span-1">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Camera className="w-5 h-5 mr-2 text-primary" />
                Patient Photo
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="w-48 h-48 rounded-full overflow-hidden bg-muted border mx-auto mb-4">
                {patient.photo && patient.photo.trim() !== '' ? (
                  <img 
                    src={patient.photo.startsWith('data:') ? patient.photo : getFileUrl(patient.photo)} 
                    alt={patient.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.log('Profile image failed to load for patient:', patient.name);
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                      ((e.currentTarget as HTMLImageElement).nextElementSibling as HTMLElement).style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className={`w-full h-full flex items-center justify-center text-muted-foreground text-6xl font-medium bg-primary/10 ${patient.photo && patient.photo.trim() !== '' ? 'hidden' : 'flex'}`}
                >
                  {patient.name.charAt(0).toUpperCase()}
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2">{patient.name}</h2>
              <Badge className={`${getStatusBadge(patient.status)} text-lg px-3 py-1`}>
                {patient.status.charAt(0).toUpperCase() + patient.status.slice(1)}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Personal Information */}
        <div className="lg:col-span-2">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2 text-primary" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-medium text-foreground">Patient ID</Label>
                  <div className="p-3 bg-muted rounded-md border">
                    <p className="text-sm font-mono">{patient.id}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-medium text-foreground">Name</Label>
                  <div className="p-3 bg-muted rounded-md border">
                    <p className="text-sm">{patient.name}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-medium text-foreground">Age</Label>
                  <div className="p-3 bg-muted rounded-md border">
                    <p className="text-sm">{patient.age} years</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-medium text-foreground">Gender</Label>
                  <div className="p-3 bg-muted rounded-md border">
                    <p className="text-sm">{patient.gender}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-medium text-foreground">Date of Birth</Label>
                  <div className="p-3 bg-muted rounded-md border">
                    <p className="text-sm">
                      {patient.dateOfBirth && !isNaN(new Date(patient.dateOfBirth).getTime()) 
                        ? format(new Date(patient.dateOfBirth), 'dd-MM-yyyy') 
                        : 'Not provided'}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-medium text-foreground">Marriage Status</Label>
                  <div className="p-3 bg-muted rounded-md border">
                    <p className="text-sm">{patient.marriageStatus || 'Not provided'}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-medium text-foreground">Father's Name</Label>
                  <div className="p-3 bg-muted rounded-md border">
                    <p className="text-sm">{patient.fatherName || 'Not provided'}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-medium text-foreground">Mother's Name</Label>
                  <div className="p-3 bg-muted rounded-md border">
                    <p className="text-sm">{patient.motherName || 'Not provided'}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-medium text-foreground">Employee Status</Label>
                  <div className="p-3 bg-muted rounded-md border">
                    <p className="text-sm">{patient.employeeStatus || 'Not provided'}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-medium text-foreground">Admission Date</Label>
                  <div className="p-3 bg-muted rounded-md border">
                    <p className="text-sm">
                      {patient.admissionDate && !isNaN(patient.admissionDate.getTime()) 
                        ? format(patient.admissionDate, 'dd-MM-yyyy') 
                        : 'Invalid Date'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Contact Information */}
      <Card className="shadow-card mt-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Phone className="w-5 h-5 mr-2 text-primary" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="font-medium text-foreground flex items-center">
                <Phone className="w-4 h-4 mr-2" />
                Phone Number
              </Label>
              <div className="p-3 bg-muted rounded-md border">
                <p className="text-sm">{patient.phone}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-medium text-foreground flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                Email Address
              </Label>
              <div className="p-3 bg-muted rounded-md border">
                <p className="text-sm">{patient.email || 'Not provided'}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-medium text-foreground flex items-center">
                <Phone className="w-4 h-4 mr-2" />
                Emergency Contact
              </Label>
              <div className="p-3 bg-muted rounded-md border">
                <p className="text-sm">{patient.emergencyContact || 'Not provided'}</p>
              </div>
            </div>
            <div className="space-y-2 md:col-span-2 lg:col-span-3">
              <Label className="font-medium text-foreground flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                Address
              </Label>
              <div className="p-3 bg-muted rounded-md border">
                <p className="text-sm">{patient.address}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attender Information */}
      {(patient.attenderName || patient.attenderPhone) && (
        <Card className="shadow-card mt-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2 text-primary" />
              Attender Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="font-medium text-foreground">Attender Name</Label>
                <div className="p-3 bg-muted rounded-md border">
                  <p className="text-sm">{patient.attenderName || 'Not provided'}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-medium text-foreground">Attender Phone</Label>
                <div className="p-3 bg-muted rounded-md border">
                  <p className="text-sm">{patient.attenderPhone || 'Not provided'}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-medium text-foreground">Relationship</Label>
                <div className="p-3 bg-muted rounded-md border">
                  <p className="text-sm">{patient.attenderRelationship || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Medical History */}
      {patient.medicalHistory && (
        <Card className="shadow-card mt-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Heart className="w-5 h-5 mr-2 text-primary" />
              Medical History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-3 bg-muted rounded-md border">
              <p className="text-sm whitespace-pre-wrap">{patient.medicalHistory}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Information */}
      <Card className="shadow-card mt-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <IndianRupee className="w-5 h-5 mr-2 text-primary" />
            Joining Initial Payment Fees
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="font-medium text-foreground">Monthly Fees</Label>
              <div className="p-3 bg-muted rounded-md border">
                <p className="text-sm font-semibold">₹{patient.fees || 0}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-medium text-foreground">Blood Test</Label>
              <div className="p-3 bg-muted rounded-md border">
                <p className="text-sm font-semibold">₹{patient.bloodTest || 0}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-medium text-foreground">Pickup Charge</Label>
              <div className="p-3 bg-muted rounded-md border">
                <p className="text-sm font-semibold">₹{patient.pickupCharge || 0}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-medium text-foreground">Total Amount</Label>
              <div className="p-3 bg-green-100 border border-green-200 rounded-md">
                <p className="text-sm font-bold text-green-700">₹{patient.totalAmount || 0}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-medium text-foreground">Paid Amount</Label>
              <div className="p-3 bg-blue-100 border border-blue-200 rounded-md">
                <p className="text-sm font-bold text-blue-700">₹{patient.payAmount || 0}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-medium text-foreground">Balance</Label>
              <div className={`p-3 rounded-md border ${patient.balance > 0 ? 'bg-red-100 border-red-200' : 'bg-green-100 border-green-200'}`}>
                <p className={`text-sm font-bold ${patient.balance > 0 ? 'text-red-700' : 'text-green-700'}`}>
                  ₹{patient.balance || 0}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-medium text-foreground">Payment Type</Label>
              <div className="p-3 bg-muted rounded-md border">
                <p className="text-sm">{patient.paymentType || 'Not specified'}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-medium text-foreground">Payment Status</Label>
              <div className="p-3 bg-muted rounded-md border">
                <Badge className={patient.balance <= 0 ? 'bg-success text-success-foreground' : patient.payAmount > 0 ? 'bg-warning text-warning-foreground' : 'bg-destructive text-destructive-foreground'}>
                  {patient.balance <= 0 ? 'Paid' : patient.payAmount > 0 ? 'Partial' : 'Pending'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Information */}
      {(patient.patientAadhar || patient.patientPan || patient.attenderAadhar || patient.attenderPan) && (
        <Card className="shadow-card mt-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2 text-primary" />
              Document Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Patient Documents */}
              <div className="space-y-4">
                <h4 className="font-medium text-foreground text-lg">Patient Documents</h4>
                {patient.patientAadhar && (
                  <div className="space-y-2">
                    <Label className="font-medium text-foreground">Aadhar Card</Label>
                    <div className="p-3 bg-muted rounded-md border">
                      <img
                        src={patient.patientAadhar.startsWith('data:') ? patient.patientAadhar : getFileUrl(patient.patientAadhar)}
                        alt="Patient Aadhar Card"
                        className="w-full h-48 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => window.open(patient.patientAadhar.startsWith('data:') ? patient.patientAadhar : getFileUrl(patient.patientAadhar), '_blank')}
                        onError={(e) => {
                          console.log('Patient Aadhar image failed to load');
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}
                {patient.patientPan && (
                  <div className="space-y-2">
                    <Label className="font-medium text-foreground">PAN Card</Label>
                    <div className="p-3 bg-muted rounded-md border">
                      <img
                        src={patient.patientPan.startsWith('data:') ? patient.patientPan : getFileUrl(patient.patientPan)}
                        alt="Patient PAN Card"
                        className="w-full h-48 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => window.open(patient.patientPan.startsWith('data:') ? patient.patientPan : getFileUrl(patient.patientPan), '_blank')}
                        onError={(e) => {
                          console.log('Patient PAN image failed to load');
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}
                {!patient.patientAadhar && !patient.patientPan && (
                  <p className="text-sm text-muted-foreground">No patient documents uploaded</p>
                )}
              </div>

              {/* Attender Documents */}
              <div className="space-y-4">
                <h4 className="font-medium text-foreground text-lg">Attender Documents</h4>
                {patient.attenderAadhar && (
                  <div className="space-y-2">
                    <Label className="font-medium text-foreground">Aadhar Card</Label>
                    <div className="p-3 bg-muted rounded-md border">
                      <img
                        src={patient.attenderAadhar.startsWith('data:') ? patient.attenderAadhar : getFileUrl(patient.attenderAadhar)}
                        alt="Attender Aadhar Card"
                        className="w-full h-48 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => window.open(patient.attenderAadhar.startsWith('data:') ? patient.attenderAadhar : getFileUrl(patient.attenderAadhar), '_blank')}
                        onError={(e) => {
                          console.log('Attender Aadhar image failed to load');
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}
                {patient.attenderPan && (
                  <div className="space-y-2">
                    <Label className="font-medium text-foreground">PAN Card</Label>
                    <div className="p-3 bg-muted rounded-md border">
                      <img
                        src={patient.attenderPan.startsWith('data:') ? patient.attenderPan : getFileUrl(patient.attenderPan)}
                        alt="Attender PAN Card"
                        className="w-full h-48 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => window.open(patient.attenderPan.startsWith('data:') ? patient.attenderPan : getFileUrl(patient.attenderPan), '_blank')}
                        onError={(e) => {
                          console.log('Attender PAN image failed to load');
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}
                {!patient.attenderAadhar && !patient.attenderPan && (
                  <p className="text-sm text-muted-foreground">No attender documents uploaded</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Medical Records */}
      <Card className="shadow-card mt-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2 text-primary" />
            Record History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Month Selection in Table Format */}
          <div className="mb-6">
            <Label className="font-medium text-foreground mb-4 block text-lg">Medical History</Label>
            <div className="flex justify-end mb-4">
              <button
                type="button"
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors cursor-pointer"
                onClick={() => setShowFilterDialog(true)}
              >
                {selectedMonth} {filterYear}
              </button>
            </div>
            
            <Table className="border">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-center font-semibold">S NO</TableHead>
                  <TableHead className="text-center font-semibold">Date</TableHead>
                  <TableHead className="text-center font-semibold">Record Type</TableHead>
                  <TableHead className="text-center font-semibold">Description</TableHead>
                  <TableHead className="text-center font-semibold">Created By</TableHead>
                  <TableHead className="text-center font-semibold">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {medicalRecordsLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="text-muted-foreground">Loading medical records...</div>
                    </TableCell>
                  </TableRow>
                ) : medicalRecords.length > 0 ? (
                  medicalRecords
                    .slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage)
                    .map((record, index) => (
                      <TableRow key={record.id}>
                        <TableCell className="text-center">
                          {((currentPage - 1) * recordsPerPage) + index + 1}
                        </TableCell>
                        <TableCell className="text-center">
                          {new Date(record.date).toLocaleDateString('en-GB')}
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {record.recordType}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="max-w-md mx-auto">
                            {record.description || 'No description'}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {record.createdBy}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            {record.images && record.images.length > 0 ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-blue-600 hover:text-blue-800"
                                  onClick={() => setViewRecord(record)}
                                  title="View Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <span className="text-sm text-green-600">{record.images.length}x</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-green-600 hover:text-green-800"
                                  onClick={() => {
                                    record.images.forEach((image: string) => {
                                      const link = document.createElement('a');
                                      link.href = image.startsWith('data:') ? image : getFileUrl(image);
                                      link.download = `medical-record-${record.id}-${Date.now()}.jpg`;
                                      link.click();
                                    });
                                  }}
                                  title="Download All Files"
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-blue-600 hover:text-blue-800"
                                  onClick={() => setViewRecord(record)}
                                  title="View Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <span className="text-sm text-muted-foreground">0x</span>
                                <span className="text-muted-foreground">-</span>
                              </>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-800"
                              onClick={() => handleDeleteMedicalRecord(record)}
                              title="Delete Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center">
                        <FileText className="w-16 h-16 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">No Medical Records Found</h3>
                        <p className="text-muted-foreground">
                          No medical records found for {selectedMonth} {filterYear}.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Month Selection Buttons */}
          {/* <div className="mb-6">
            <Label className="font-medium text-foreground mb-3 block">Filter by Month:</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedMonth === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedMonth('all')}
                className="min-w-[100px]"
              >
                All Months
              </Button>
              {months.map((month) => (
                <Button
                  key={month}
                  variant={selectedMonth === month ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedMonth(month)}
                  className="min-w-[100px]"
                >
                  {month}
                </Button>
              ))}
            </div>
          </div> */}

          {/* Pagination */}
          {Math.ceil(medicalRecords.length / recordsPerPage) > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * recordsPerPage) + 1} to{' '}
                {Math.min(currentPage * recordsPerPage, medicalRecords.length)} of{' '}
                {medicalRecords.length} records
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.ceil(medicalRecords.length / recordsPerPage) }, (_, i) => i + 1)
                    .filter(page => {
                      const totalPages = Math.ceil(medicalRecords.length / recordsPerPage);
                      if (totalPages <= 7) return true;
                      if (page === 1 || page === totalPages) return true;
                      if (page >= currentPage - 1 && page <= currentPage + 1) return true;
                      return false;
                    })
                    .map((page, index, array) => (
                      <React.Fragment key={page}>
                        {index > 0 && array[index - 1] !== page - 1 && (
                          <span className="text-muted-foreground">...</span>
                        )}
                        <Button
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="h-8 w-8 p-0"
                        >
                          {page}
                        </Button>
                      </React.Fragment>
                    ))
                  }
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(medicalRecords.length / recordsPerPage)))}
                  disabled={currentPage === Math.ceil(medicalRecords.length / recordsPerPage)}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filter Records Dialog */}
      {showFilterDialog && (
        <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Filter Records</DialogTitle>
              <DialogDescription>
                Select month and year to filter records
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <Label className="font-medium mb-2 block">Month</Label>
                <Select value={filterMonth} onValueChange={setFilterMonth}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="font-medium mb-2 block">Year</Label>
                <Select value={filterYear.toString()} onValueChange={(value) => setFilterYear(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => {
                  const currentMonth = new Date().getMonth() + 1; // Get month as number (1-12)
                  const currentYear = new Date().getFullYear();
                  setSelectedMonth(currentMonth);
                  setFilterMonth(String(currentMonth));
                  setFilterYear(currentYear);
                }}
                className="text-muted-foreground"
              >
                Clear Filter
              </Button>
              <Button 
                onClick={() => {
                  setSelectedMonth(parseInt(filterMonth)); // Convert string to number
                  setShowFilterDialog(false);
                  setCurrentPage(1); // Reset to first page when filtering
                }}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Apply Filter
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* View Medical Record Dialog */}
      {viewRecord && (
        <Dialog open={!!viewRecord} onOpenChange={() => setViewRecord(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="text-center border-b pb-4">
              <DialogTitle className="text-2xl font-bold text-primary">Medical Record Details</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Patient Details Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-primary">Patient Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div>
                    <Label className="font-semibold text-muted-foreground">Patient Name:</Label>
                    <p className="text-foreground font-medium">{viewRecord.patientName}</p>
                  </div>
                  <div>
                    <Label className="font-semibold text-muted-foreground">Patient ID:</Label>
                    <p className="text-foreground font-medium">{viewRecord.patientId}</p>
                  </div>
                  <div>
                    <Label className="font-semibold text-muted-foreground">Record Date:</Label>
                    <p className="text-foreground font-medium">
                      {new Date(viewRecord.date).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Record Details Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-primary">Record Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="font-semibold text-muted-foreground">Record Type:</Label>
                    <p className="text-foreground font-medium">{viewRecord.recordType}</p>
                  </div>
                  <div>
                    <Label className="font-semibold text-muted-foreground">Created By:</Label>
                    <p className="text-foreground font-medium">{viewRecord.createdBy}</p>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="font-semibold text-muted-foreground">Description:</Label>
                    <p className="text-foreground mt-2 p-3 bg-muted/50 rounded-lg">
                      {viewRecord.description || 'No description provided'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Images Section */}
              {viewRecord.images && viewRecord.images.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-primary">Medical Images ({viewRecord.images.length} files)</h3>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {viewRecord.images.map((image, index) => (
                        <div key={index} className="border rounded-lg overflow-hidden bg-background">
                          <div className="aspect-square relative">
                            <img
                              src={image.startsWith('data:') ? image : getFileUrl(image)}
                              alt={`Medical record ${index + 1}`}
                              className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => window.open(image.startsWith('data:') ? image : getFileUrl(image), '_blank')}
                            />
                          </div>
                          <div className="p-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Image {index + 1}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = image.startsWith('data:') ? image : getFileUrl(image);
                                  link.download = `medical-record-${viewRecord.id}-image-${index + 1}.jpg`;
                                  link.click();
                                }}
                                className="text-xs"
                              >
                                <Download className="w-3 h-3 mr-1" />
                                Download
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Download All Button */}
                    <div className="mt-4 flex justify-center">
                      <Button
                        onClick={() => {
                          viewRecord.images.forEach((image, index) => {
                            const link = document.createElement('a');
                            link.href = image.startsWith('data:') ? image : getFileUrl(image);
                            link.download = `medical-record-${viewRecord.id}-image-${index + 1}.jpg`;
                            link.click();
                          });
                        }}
                        className="flex items-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download All Images</span>
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* No Images Message */}
              {(!viewRecord.images || viewRecord.images.length === 0) && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-primary">Medical Images</h3>
                  <div className="bg-muted/50 p-8 rounded-lg text-center">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No images attached to this medical record</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Created: {new Date(viewRecord.createdAt).toLocaleString('en-GB')}
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteMedicalRecord(viewRecord)}
                    className="flex items-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Record</span>
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default PatientFullyHistory;
