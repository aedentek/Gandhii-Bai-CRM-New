import DoctorCategory from '@/components/management/DoctorCategory';
import DeletedDoctors from '@/components/management/DeletedDoctors';
import AddDoctor from '@/components/management/AddDoctor';
import SalaryPayment from '@/components/management/SalaryPayment';
// import PatientCallRecord from '@/components/patients/PatientCallRecord';
// import PatientMedicalRecord from '@/components/patients/PatientMedicalRecord';
import PatientFullyHistory from '@/components/patients/PatientFullyHistory';
import PatientFullDetails from '@/components/patients/PatientFullDetailsSimple';
import PatientBiodata from '@/components/patients/PatientBiodata';
import TestReportAmount from '@/components/patients/TestReportAmount';
import TestReportAmountPage from '@/pages/management/test-report-amount';
import TestRoute from '@/components/TestRoute';
import StaffCategoryManagement from './components/management/StaffCategory';
import AddStaff from './components/management/AddStaff';
import DoctorAttendance from '@/components/management/DoctorAttendance';
import DoctorSalary from '@/components/management/DoctorSalary';
// import DoctorAdvance from '@/pages/management/doctor-advance';
import AddRole from '@/components/management/AddRole';
import AddUser from '@/components/management/AddUser';
import UserManagement from '@/components/management/UserManagement';
import AddLeadCategory from '@/components/leads/AddLeadCategory';
// import LeadsList from '@/components/leads/LeadsList';

// Import CSS globally
import './styles/modern-forms.css';
import './styles/modern-tables.css';
import './styles/global-crm-design.css';

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import LoginPage from '@/components/auth/LoginPage';
import ForgotPasswordPage from '@/components/auth/ForgotPasswordPage';
import Dashboard from '@/components/dashboard/Dashboard';
import ModernSidebar from '@/components/layout/ModernSidebar';
import AddPatient from '@/components/patients/AddPatient';
import PatientList from '@/components/patients/PatientList';
import DeletedPatients from '@/components/patients/DeletedPatients';
import PatientAttendance from '@/components/patients/PatientAttendance';
import PatientHistory from '@/components/patients/PatientHistory';
import PatientPaymentFees from '@/components/patients/PatientPaymentFees';
import StaffManagement from '@/components/management/StaffManagement';
import DeletedStaff from '@/components/management/DeletedStaff';
import DoctorManagement from '@/components/management/DoctorManagement';
import MedicineManagement from '@/components/management/MedicineManagement';
import SupplierManagement from '@/components/management/SupplierManagement';
import GroceryManagement from '@/components/management/GroceryManagement';
import GroceryCategories from '@/components/management/GroceryCategories';
import GrocerySuppliers from '@/components/management/GrocerySuppliers';
import GroceryStock from '@/components/management/GroceryStock';
import GroceryAccounts from '@/components/management/GroceryAccounts';
import AttendanceManagement from '@/components/management/AttendanceManagement';
// import UserRoleManagement from '@/components/management/UserRoleManagement';
import Settings from '@/components/settings/Settings';
import CategoryManagement from '@/components/management/CategoryManagement';
import MedicineStock from '@/components/management/MedicineStock';
import MedicineAccounts from '@/components/management/MedicineAccounts';
import GeneralManagement from '@/components/management/GeneralManagement';
import GeneralCategories from '@/components/management/GeneralCategories';
import GeneralSuppliers from '@/components/management/GeneralSuppliers';
import GeneralStock from '@/components/management/GeneralStock';
import GeneralAccounts from '@/components/management/GeneralAccounts';
import { cn } from '@/lib/utils';
import './App.css';

import { loadWebsiteSettings } from '@/utils/api';

const queryClient = new QueryClient();

function App() {
  const [user, setUser] = useState<{ name: string; role: string; email: string; permissions: string[] } | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Load website settings (title, favicon) on app start using unified API
  useEffect(() => {
    const loadSettings = async () => {
      try {
        console.log('🔗 Loading website settings via unified API...');
        await loadWebsiteSettings();
        console.log('✅ Website settings applied successfully');
      } catch (error) {
        console.error('❌ Failed to load website settings:', error);
      } finally {
        setSettingsLoaded(true);
      }
    };

    loadSettings();
  }, []);

  useEffect(() => {
    console.log('🔐 Checking authentication...');
    const savedUser = localStorage.getItem('healthcare_user');
    console.log('💾 Saved user from localStorage:', savedUser);
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      console.log('✅ User authenticated:', parsedUser);
      setUser(parsedUser);
    } else {
      console.log('❌ No authenticated user found');
      // Check if the URL is for forgot password
      if (window.location.pathname === '/forgot-password') {
        console.log('🔄 Showing forgot password page');
        setShowForgotPassword(true);
        return;
      }
      console.log('🚫 No user found, creating auto-login for development');
      // Auto-login for development/testing
      const devUser = {
        name: 'Dr. Admin',
        role: 'Admin', 
        email: 'admin@healthcare.com',
        permissions: ['all'] // Admin has all permissions
      };
      setUser(devUser);
      localStorage.setItem('healthcare_user', JSON.stringify(devUser));
    }
  }, []);

  const handleLogin = (userData: { name: string; role: string; email: string; permissions: string[] }) => {
    setUser(userData);
    localStorage.setItem('healthcare_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('healthcare_user');
    // Force reload to ensure clean state
    window.location.href = '/';
  };

  console.log('🎭 App render state:', {
    settingsLoaded,
    showForgotPassword,
    userExists: !!user,
    user: user
  });

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App">
          {!settingsLoaded ? (
            <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading...</p>
              </div>
            </div>
          ) : showForgotPassword ? (
            <ForgotPasswordPage onBack={() => {
              setShowForgotPassword(false);
              window.history.pushState(null, '', '/');
            }} />
          ) : !user ? (
            <LoginPage onLogin={handleLogin} />
          ) : (
            <div className="min-h-screen bg-background border-r-4 sm:border-r-6 md:border-r-8 border-gray-300 pr-4 sm:pr-6 md:pr-8">
              <ModernSidebar 
                user={user} 
                onLogout={handleLogout} 
                onCollapsedChange={setSidebarCollapsed}
              />
              <main className={cn(
                "min-h-screen overflow-x-hidden overflow-y-auto bg-background scrollbar-hide transition-all duration-300 max-w-full",
                "ml-0 lg:ml-64", // Mobile: no margin, Desktop: 64 when expanded
                sidebarCollapsed && "lg:ml-16" // Desktop: 16 when collapsed
              )}>
                  <div className="min-h-screen w-full max-w-full p-4 pt-16 lg:p-6 lg:pt-6 page-content">
                  <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard user={user} />} />
                    
                  {/* Patient Management Routes */}
                  <Route path="/patients/details/:patientId" element={<PatientBiodata />} />
                  <Route path="/patients/fully-history/:patientId" element={<PatientFullyHistory />} />
                  <Route path="/test/:testId" element={<TestRoute />} />
                  <Route path="/patients/add" element={<AddPatient />} />
                  <Route path="/patients/list" element={<PatientList />} />
                  <Route path="/patients/test-report-amount" element={<TestReportAmountPage />} />
                  <Route path="/patients/deleted" element={<DeletedPatients />} />
                  <Route path="/patients/attendance" element={<PatientAttendance />} />
                  <Route path="/patients/history" element={<PatientHistory />} />
                  {/* <Route path="/patients/call-records" element={<PatientCallRecord />} /> */}
                  {/* <Route path="/patients/medical-records" element={<PatientMedicalRecord />} /> */}
                  <Route path="/patients/payment-fees" element={<PatientPaymentFees />} />
                  
                  {/* Staff Management Routes */}
                  <Route path="/management/add-doctor" element={<AddDoctor />} />
                  <Route path="/management/deleted-doctors" element={<DeletedDoctors />} />
                  <Route path="/management/doctor-attendance" element={<DoctorAttendance />} />
                  <Route path="/management/doctor-salary" element={<DoctorSalary />} />
                  {/* <Route path="/management/doctor-advance" element={<DoctorAdvance />} /> */}
                  <Route path="/management/doctor-category" element={<DoctorCategory />} />
              <Route path="/management/staff-category" element={<StaffCategoryManagement />} />
              <Route path="/management/add-staff" element={<AddStaff />} />
                  <Route path="/management/staff" element={<StaffManagement />} />
                  <Route path="/management/deleted-staff" element={<DeletedStaff />} />
                  <Route path="/management/doctors" element={<DoctorManagement />} />
                  <Route path="/management/suppliers" element={<SupplierManagement />} />
                  <Route path="/management/grocery" element={<GroceryManagement />} />
                  <Route path="/management/attendance" element={<AttendanceManagement />} />
                  <Route path="/management/salary-payment" element={<SalaryPayment />} />
                  <Route path="/management/test-report-amount" element={<TestReportAmountPage />} />
                  <Route path="/management/user-role/add" element={<AddRole />} />
                  <Route path="/management/user-role/roles" element={<UserManagement />} />
                  
                  {/* Medicine Management Routes */}
                  <Route path="/medicine/add" element={<MedicineManagement />} />
                  <Route path="/medicine/categories" element={<CategoryManagement />} />
                  <Route path="/medicine/suppliers" element={<SupplierManagement />} />
                  <Route path="/medicine/stock" element={<MedicineStock />} />
                  <Route path="/medicine/accounts" element={<MedicineAccounts />} />
                  
                   {/* Grocery Management Routes */}
                   <Route path="/grocery" element={<GroceryManagement />} />
                   <Route path="/grocery/categories" element={<GroceryCategories />} />
                   <Route path="/grocery/suppliers" element={<GrocerySuppliers />} />
                   <Route path="/grocery/stock" element={<GroceryStock />} />
                   <Route path="/grocery/accounts" element={<GroceryAccounts />} />
                   
                   {/* General Purchase Management Routes */}
                   <Route path="/general/add" element={<GeneralManagement />} />
                   <Route path="/general/categories" element={<GeneralCategories />} />
                   <Route path="/general/suppliers" element={<GeneralSuppliers />} />
                   <Route path="/general/stock" element={<GeneralStock />} />
                   <Route path="/general/accounts" element={<GeneralAccounts />} />
                  
                  {/* Settings */}
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/leads/add-category" element={<AddLeadCategory />} />
                  {/* <Route path="/leads/list" element={<LeadsList />} /> */}
                    
                  <Route path="*" element={
                    <div style={{ padding: '20px', backgroundColor: 'red', color: 'white' }}>
                      <h1>WILDCARD ROUTE CAUGHT!</h1>
                      <p>Current URL: {window.location.href}</p>
                      <p>Pathname: {window.location.pathname}</p>
                      <p>This means the route pattern did not match any defined routes.</p>
                      <p><strong>Expected routes that should match:</strong></p>
                      <ul>
                        <li>/patients/details/:patientId - for PatientBiodata</li>
                        <li>/patients/list - for PatientList</li>
                        <li>/dashboard - for Dashboard</li>
                      </ul>
                      <button onClick={() => window.location.href = '/dashboard'}>Go to Dashboard</button>
                      <button onClick={() => window.location.href = '/patients/list'} style={{marginLeft: '10px'}}>Go to Patient List</button>
                    </div>
                  } />
                </Routes>
                  </div>
              </main>
            </div>
          )}
          <Toaster />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
