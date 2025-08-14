import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const PatientFullyHistory: React.FC = () => {
  console.log('🚀 PatientFullyHistory component is loading...');
  console.log('🌐 Current URL:', window.location.href);
  console.log('🛣️  Current pathname:', window.location.pathname);
  
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  
  console.log('🏥 PatientFullyHistory component loaded with patientId:', patientId);

  // Simple early return for testing
  if (!patientId) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-lg text-red-600">No patient ID found in URL</div>
        </div>
      </div>
    );
  }

  // Simple test component
  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate('/patients')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Patient List</span>
          </Button>
        </div>

        <h1 className="text-3xl font-bold mb-6">Patient Full History</h1>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Patient ID: {patientId}</h2>
          <p className="text-gray-600">✅ Navigation successful! This is the patient history page.</p>
          <p className="text-sm text-gray-500 mt-2">URL: {window.location.pathname}</p>
          <p className="text-sm text-blue-600 mt-2">The Patient ID navigation is working correctly!</p>
        </div>
      </div>
    </div>
  );
};

export default PatientFullyHistory;
