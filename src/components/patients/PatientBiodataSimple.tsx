import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DatabaseService } from '@/services/databaseService';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface Patient {
  id: string;
  patient_id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  email: string;
  address: string;
}

const PatientBiodataSimple: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (patientId) {
      loadPatientData();
    }
  }, [patientId]);

  const loadPatientData = async () => {
    try {
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
      
    } catch (error) {
      console.error('Error loading patient data:', error);
      setError('Failed to load patient information');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading patient information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="text-center py-12">
          <div className="h-12 w-12 text-red-500 mx-auto mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Patient Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The requested patient could not be found.'}</p>
          <Button onClick={() => navigate('/patients')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Patients
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/patients')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Patient Biodata</h1>
              <p className="text-gray-600">Complete patient information</p>
            </div>
          </div>
        </div>
      </div>

      {/* Patient Info Card */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
            <span className="text-2xl text-gray-500">👤</span>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{patient.name}</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Patient ID:</span>
                <span className="ml-2 font-medium">{patient.patient_id}</span>
              </div>
              <div>
                <span className="text-gray-500">Age:</span>
                <span className="ml-2 font-medium">{patient.age} years</span>
              </div>
              <div>
                <span className="text-gray-500">Gender:</span>
                <span className="ml-2 font-medium">{patient.gender}</span>
              </div>
              <div>
                <span className="text-gray-500">Phone:</span>
                <span className="ml-2 font-medium">{patient.phone}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">Email:</span>
                <span className="ml-2 font-medium">{patient.email}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">Address:</span>
                <span className="ml-2 font-medium">{patient.address}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b px-6 py-4">
          <div className="flex space-x-8">
            <button className="text-blue-600 border-b-2 border-blue-600 pb-2 px-1 font-medium">
              Overview
            </button>
            <button className="text-gray-500 hover:text-gray-700 pb-2 px-1">
              Medical Records
            </button>
            <button className="text-gray-500 hover:text-gray-700 pb-2 px-1">
              Financial
            </button>
            <button className="text-gray-500 hover:text-gray-700 pb-2 px-1">
              Documents
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="text-center py-12">
            <p className="text-gray-500">Patient biodata loaded successfully! 🎉</p>
            <p className="text-sm text-gray-400 mt-2">PatientID: {patientId}</p>
            <p className="text-sm text-gray-400">Found Patient: {patient.name} (ID: {patient.id})</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientBiodataSimple;
