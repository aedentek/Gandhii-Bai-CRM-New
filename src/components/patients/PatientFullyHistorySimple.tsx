import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const PatientFullyHistory: React.FC = () => {
  console.log('🚀 PatientFullyHistory component is loading...');
  console.log('🌐 Current URL:', window.location.href);
  console.log('🛣️  Current pathname:', window.location.pathname);
  
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  
  console.log('🔍 Received patientId from URL params:', patientId);
  console.log('🔍 patientId type:', typeof patientId);
  console.log('🔍 patientId length:', patientId?.length);
  
  // SIMPLE TEST: Just return a basic component to test if routing works
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Patient Fully History - TEST</h1>
      <div className="bg-green-100 p-4 rounded">
        <p><strong>SUCCESS!</strong> Component loaded successfully!</p>
        <p><strong>Patient ID from URL:</strong> {patientId || 'NO ID FOUND'}</p>
        <p><strong>Current URL:</strong> {window.location.href}</p>
        <p><strong>Pathname:</strong> {window.location.pathname}</p>
        <button 
          onClick={() => navigate('/patients/list')}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Back to Patient List
        </button>
      </div>
    </div>
  );
};

export default PatientFullyHistory;
