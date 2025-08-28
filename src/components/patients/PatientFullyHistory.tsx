import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, Mail, MapPin, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DatabaseService } from '@/services/databaseService';
import { useToast } from '@/hooks/use-toast';
import usePageTitle from '@/hooks/usePageTitle';

interface Patient {
  id: string;
  originalId: number;
  name: string;
  age: number;
  gender: string;
  phone: string;
  email?: string;
  address?: string;
  status: string;
  admissionDate: Date;
}

const PatientFullyHistory: React.FC = () => {
  // Set page title
  usePageTitle();

  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  console.log('PatientFullyHistory - Received patientId:', patientId);

  useEffect(() => {
    if (patientId) {
      loadPatientDetails();
    }
  }, [patientId]);

  const loadPatientDetails = async () => {
    if (!patientId) return;
    
    setLoading(true);
    try {
      console.log('Loading patient details for ID:', patientId);
      const data = await DatabaseService.getAllPatients();
      
      // Convert P0104 -> 104 for matching
      const urlId = String(patientId).trim();
      const numericId = urlId.startsWith('P') ? parseInt(urlId.replace(/^P0*/i, '')) : parseInt(urlId);
      
      console.log('Searching for patient with numeric ID:', numericId);
      
      const foundPatient = data.find((p: any) => {
        const dbId = parseInt(p.id);
        return dbId === numericId;
      });

      if (foundPatient) {
        console.log('Patient found:', foundPatient.name);
        setPatient({
          id: patientId, // Use the formatted ID from URL
          originalId: foundPatient.id,
          name: foundPatient.name,
          age: foundPatient.age,
          gender: foundPatient.gender,
          phone: foundPatient.phone,
          email: foundPatient.email,
          address: foundPatient.address,
          status: foundPatient.status || 'active',
          admissionDate: foundPatient.created_at ? new Date(foundPatient.created_at) : new Date()
        });
      } else {
        console.error('Patient not found with ID:', numericId);
        toast({
          title: "Patient Not Found",
          description: "The requested patient could not be found.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error loading patient details:', error);
      toast({
        title: "Error",
        description: "Failed to load patient details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading patient details...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="text-lg text-red-600 mb-4">Patient not found</div>
            <Button onClick={() => navigate('/patients/list')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Patient List
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            onClick={() => navigate('/patients/list')} 
            variant="outline" 
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to List
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Patient Details</h1>
        </div>
      </div>

      {/* Patient Basic Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>Patient Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Patient ID</label>
                <p className="text-lg font-semibold text-blue-600">{patient.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Name</label>
                <p className="text-lg font-semibold">{patient.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Age</label>
                <p className="font-medium">{patient.age} years</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Gender</label>
                <p className="font-medium">{patient.gender}</p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-gray-500" />
                <div>
                  <label className="text-sm font-medium text-gray-600">Phone</label>
                  <p className="font-medium">{patient.phone}</p>
                </div>
              </div>
              {patient.email && (
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="font-medium">{patient.email}</p>
                  </div>
                </div>
              )}
              {patient.address && (
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <div>
                    <label className="text-sm font-medium text-gray-600">Address</label>
                    <p className="font-medium">{patient.address}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Status</label>
                <p className={`font-medium ${patient.status === 'active' ? 'text-green-600' : 'text-gray-600'}`}>
                  {patient.status}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <div>
                  <label className="text-sm font-medium text-gray-600">Admission Date</label>
                  <p className="font-medium">{patient.admissionDate.toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Debug Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>URL Parameter (patientId):</strong> {patientId}</p>
            <p><strong>Database ID (originalId):</strong> {patient.originalId}</p>
            <p><strong>Current URL:</strong> {window.location.href}</p>
            <p><strong>Component Status:</strong> <span className="text-green-600">Successfully Loaded</span></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientFullyHistory;