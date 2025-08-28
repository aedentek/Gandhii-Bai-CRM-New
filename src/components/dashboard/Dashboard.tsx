import React from 'react';
import ProperAlignedDashboard from './ProperAlignedDashboard';

interface DashboardProps {
  user: { name: string; role: string };
}

const Dashboard = ({ user }: DashboardProps): JSX.Element => {
  return <ProperAlignedDashboard user={user} />;
};

export default Dashboard;
