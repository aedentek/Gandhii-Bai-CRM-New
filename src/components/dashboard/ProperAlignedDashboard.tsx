import React from 'react';
import FastCorporateDashboard from './FastCorporateDashboard'; 
interface DashboardProps {
  user?: { name: string; role: string };
}

const ProperAlignedDashboard: React.FC<DashboardProps> = ({ user = { name: "Admin", role: "Administrator" } }) => {
  return <FastCorporateDashboard user={user} />;
};

export default ProperAlignedDashboard;
