import React from 'react';
import CorporateDashboard from './CorporateDashboard'; 
interface DashboardProps {
  user?: { name: string; role: string };
}

const ProperAlignedDashboard: React.FC<DashboardProps> = ({ user = { name: "Admin", role: "Administrator" } }) => {
  return <CorporateDashboard user={user} />;
};

export default ProperAlignedDashboard;
