import React from 'react';
import FastCorporateDashboard from './components/dashboard/FastCorporateDashboard';

// Emergency Simple App - No React Router to avoid path-to-regexp issues
const EmergencyApp: React.FC = () => {
  console.log('🚨 Emergency App Loaded - No React Router');
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <FastCorporateDashboard />
    </div>
  );
};

export default EmergencyApp;
