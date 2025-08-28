import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Import all components
import Dashboard from '@/components/dashboard/Dashboard';
import AddPatient from '@/components/patients/AddPatient';
import PatientList from '@/components/patients/PatientList';
import DeletedPatients from '@/components/patients/DeletedPatients';
import PatientAttendance from '@/components/patients/PatientAttendance';
import PatientHistory from '@/components/patients/PatientHistory';
import PatientPaymentFees from '@/components/patients/PatientPaymentFees';
import PatientBiodata from '@/components/patients/PatientBiodata';
import PatientFullyHistory from '@/components/patients/PatientFullyHistory';
import TestRoute from '@/components/TestRoute';
import TestReportAmountPage from '@/pages/management/test-report-amount';
import PatientMedicalRecord from '@/components/patients/PatientMedicalRecord';

import StaffManagement from '@/components/management/StaffManagement';
import DeletedStaff from '@/components/management/DeletedStaff';
import AddStaff from '@/components/management/AddStaff';
import StaffCategoryManagement from '@/components/management/StaffCategory';
import AttendanceManagement from '@/components/management/AttendanceManagement';
import SalaryPayment from '@/components/management/SalaryPayment';

import DoctorManagement from '@/components/management/DoctorManagement';
import AddDoctor from '@/components/management/AddDoctor';
import DeletedDoctors from '@/components/management/DeletedDoctors';
import DoctorAttendance from '@/components/management/DoctorAttendance';
import DoctorSalary from '@/components/management/DoctorSalary';
import DoctorCategory from '@/components/management/DoctorCategory';

import MedicineManagement from '@/components/management/MedicineManagement';
import CategoryManagement from '@/components/management/MedicineCategories';
import MedicineStock from '@/components/management/MedicineStock';
import MedicineAccounts from '@/components/management/MedicineAccounts';

import SupplierManagement from '@/components/management/SupplierManagement';
import GroceryManagement from '@/components/management/GroceryManagement';
import GroceryCategories from '@/components/management/GroceryCategories';
import GrocerySuppliers from '@/components/management/GrocerySuppliers';
import GroceryStock from '@/components/management/GroceryStock';
import GroceryAccounts from '@/components/management/GroceryAccounts';

import GeneralManagement from '@/components/management/GeneralManagement';
import GeneralCategories from '@/components/management/GeneralCategories';
import GeneralSuppliers from '@/components/management/GeneralSuppliers';
import GeneralStock from '@/components/management/GeneralStock';
import GeneralAccounts from '@/components/management/GeneralAccounts';

import AddUser from '@/components/management/AddUser';
import UserManagement from '@/components/management/UserManagement';
import AddRole from '@/components/management/AddRole';
import AddLeadCategory from '@/components/leads/AddLeadCategory';
import LeadsList from '@/components/leads/LeadsList';
import Settings from '@/components/settings/Settings';
import Administration from '@/components/Administration/Administration';
import StaffAdvance from '@/pages/management/staff-advance';

interface AppRoutesProps {
  user: { name: string; role: string; email: string; permissions: string[] };
}

const AppRoutes: React.FC<AppRoutesProps> = ({ user }) => {
  // Note: Individual components now handle their own page titles
  // usePageTitle() is called in each component for better control

  return (
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
      <Route path="/patients/payment-fees" element={<PatientPaymentFees />} />
      <Route path="/patients/medical-records" element={<PatientMedicalRecord />} />
      
      {/* Staff Management Routes */}
      <Route path="/management/add-doctor" element={<AddDoctor />} />
      <Route path="/management/deleted-doctors" element={<DeletedDoctors />} />
      <Route path="/management/doctor-attendance" element={<DoctorAttendance />} />
      <Route path="/management/doctor-salary" element={<DoctorSalary />} />
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
      <Route path="/management/staff-advance" element={<StaffAdvance />} />
      
      {/* Medicine Management Routes */}
      <Route path="/medicine/management" element={<MedicineManagement />} />
      <Route path="/medicine/categories" element={<CategoryManagement />} />
      <Route path="/medicine/suppliers" element={<SupplierManagement />} />
      <Route path="/medicine/stock" element={<MedicineStock />} />
      <Route path="/medicine/accounts" element={<MedicineAccounts />} />
      
      {/* Grocery Management Routes */}
      <Route path="/grocery/categories" element={<GroceryCategories />} />
      <Route path="/grocery/suppliers" element={<GrocerySuppliers />} />
      <Route path="/grocery/stock" element={<GroceryStock />} />
      <Route path="/grocery/accounts" element={<GroceryAccounts />} />
      
      {/* General Management Routes */}
      <Route path="/general/management" element={<GeneralManagement />} />
      <Route path="/general/add" element={<GeneralManagement />} />
      <Route path="/general/categories" element={<GeneralCategories />} />
      <Route path="/general/suppliers" element={<GeneralSuppliers />} />
      <Route path="/general/stock" element={<GeneralStock />} />
      <Route path="/general/accounts" element={<GeneralAccounts />} />
      
      {/* Lead Management Routes */}
      <Route path="/leads/list" element={<LeadsList />} />
      <Route path="/leads/add-category" element={<AddLeadCategory />} />
      
      {/* User Management Routes */}
      <Route path="/users/add" element={<AddUser />} />
      <Route path="/users/list" element={<UserManagement />} />
      <Route path="/users/add-role" element={<AddRole />} />
      <Route path="/management/user-role/add" element={<AddRole />} />
      <Route path="/management/user-role/roles" element={<UserManagement />} />
      
      {/* Administration Route */}
      <Route path="/administration" element={<Administration />} />
      
      {/* Settings Routes */}
      <Route path="/settings" element={<Settings />} />
    </Routes>
  );
};

export default AppRoutes;
