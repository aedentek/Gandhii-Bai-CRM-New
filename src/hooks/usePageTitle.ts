import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Define route to title mapping
const routeTitleMap: Record<string, string> = {
  // Dashboard
  '/dashboard': 'Dashboard',
  
  // Patient Management
  '/patients/add': 'Add Patient',
  '/patients/list': 'Patient List',
  '/patients/test-report-amount': 'Test Report Amount',
  '/patients/deleted': 'Deleted Patients',
  '/patients/attendance': 'Patient Attendance',
  '/patients/history': 'Patient History',
  '/patients/payment-fees': 'Payment Fees',
  
  // Staff Management  
  '/management/add-doctor': 'Add Doctor',
  '/management/deleted-doctors': 'Deleted Doctors',
  '/management/doctor-attendance': 'Doctor Attendance',
  '/management/doctor-salary': 'Doctor Salary',
  '/management/doctor-category': 'Doctor Category',
  '/management/staff-category': 'Staff Category',
  '/management/add-staff': 'Add Staff',
  '/management/staff': 'Staff Management',
  '/management/deleted-staff': 'Deleted Staff',
  '/management/doctors': 'Doctor Management',
  '/management/suppliers': 'Supplier Management',
  '/management/grocery': 'Grocery List',
  '/management/attendance': 'Attendance Management',
  '/management/salary-payment': 'Salary Payment',
  
  // Medicine Management
  '/medicine/management': 'Medicine List',
  '/medicine/categories': 'Medicine Categories',
  '/medicine/suppliers': 'Medicine Suppliers',
  '/medicine/stock': 'Medicine Stock',
  '/medicine/accounts': 'Medicine Accounts',
  
  // Grocery Management
  '/grocery/categories': 'Grocery Categories',
  '/grocery/suppliers': 'Grocery Suppliers',
  '/grocery/stock': 'Grocery Stock',
  '/grocery/accounts': 'Grocery Accounts',
  
  // General Management
  '/general/management': 'General Management',
  '/general/add': 'Add General Item',
  '/general/categories': 'General Categories',
  '/general/suppliers': 'General Suppliers',
  '/general/stock': 'General Stock',
  '/general/accounts': 'General Accounts',
  
  // Lead Management
  '/leads/list': 'Leads List',
  '/leads/add-category': 'Add Lead Category',
  
  // User Management
  '/users/add': 'Add User',
  '/users/list': 'User Management',
  '/users/add-role': 'Add Role',
  '/management/user-role/add': 'Add User Role',
  '/management/user-role/roles': 'User Roles',
  
  // Administration
  '/administration': 'Administration',
  
  // Patient Additional Routes
  '/patients/medical-records': 'Medical Records',
  
  // Staff Additional Routes  
  '/management/staff-advance': 'Staff Advance',
  
  // Settings
  '/settings': 'Settings',
};

// Function to extract title from dynamic routes
const getDynamicTitle = (pathname: string): string | null => {
  // Patient details route
  if (pathname.match(/^\/patients\/details\/\d+$/)) {
    return 'Patient Details';
  }
  
  // Patient full history route
  if (pathname.match(/^\/patients\/fully-history\/\d+$/)) {
    return 'Patient History';
  }
  
  // Test route
  if (pathname.match(/^\/test\/\w+$/)) {
    return 'Test Details';
  }
  
  return null;
};

export const usePageTitle = (customTitle?: string) => {
  const location = useLocation();
  
  useEffect(() => {
    let title = 'Gandhi by CRM';
    
    if (customTitle) {
      // If custom title is provided, use it
      title = `Gandhi by CRM / ${customTitle}`;
    } else {
      // Check static routes first
      const staticTitle = routeTitleMap[location.pathname];
      
      if (staticTitle) {
        title = `Gandhi by CRM / ${staticTitle}`;
      } else {
        // Check dynamic routes
        const dynamicTitle = getDynamicTitle(location.pathname);
        if (dynamicTitle) {
          title = `Gandhi by CRM / ${dynamicTitle}`;
        }
      }
    }
    
    // Update the document title
    document.title = title;
    
    // Optional: Log for debugging
    console.log(`📄 Page title updated: ${title}`);
    
  }, [location.pathname, customTitle]);
};

export default usePageTitle;
