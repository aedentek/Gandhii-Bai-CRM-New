// Page permissions mapping with routes and display names
export const PAGE_PERMISSIONS_MAP: {[key: string]: {route: string, name: string, category: string}} = {
  // Main Navigation
  'dashboard': { route: '/dashboard', name: 'Dashboard', category: 'Main' },
  
  // Patient Management
  'add-patient': { route: '/patients/add', name: 'Add Patient', category: 'Patient Management' },
  'patient-list': { route: '/patients/list', name: 'Patient List', category: 'Patient Management' },
  'test-report-amount': { route: '/patients/test-report-amount', name: 'Test Report Amount', category: 'Patient Management' },
  'patient-attendance': { route: '/patients/attendance', name: 'Patient Attendance', category: 'Patient Management' },
  'medical-records': { route: '/patients/medical-records', name: 'Medical Record', category: 'Patient Management' },
  'patient-history': { route: '/patients/history', name: 'Patient History', category: 'Patient Management' },
  'call-records': { route: '/patients/call-records', name: 'Call Records', category: 'Patient Management' },
  'payment-fees': { route: '/patients/payment-fees', name: 'Payment Fees', category: 'Patient Management' },
  'deleted-patients': { route: '/patients/deleted', name: 'Deleted Patients', category: 'Patient Management' },
  
  // Staff Management
  'add-staff': { route: '/management/add-staff', name: 'Add Staff', category: 'Staff Management' },
  'staff-category': { route: '/management/staff-category', name: 'Staff Category', category: 'Staff Management' },
  'staff-list': { route: '/management/staff', name: 'Staff List', category: 'Staff Management' },
  'staff-attendance': { route: '/management/attendance', name: 'Staff Attendance', category: 'Staff Management' },
  'salary-payment': { route: '/management/salary-payment', name: 'Salary Payment', category: 'Staff Management' },
  'deleted-staff': { route: '/management/deleted-staff', name: 'Deleted Staff', category: 'Staff Management' },
  
  // Doctor Management
  'add-doctor': { route: '/management/add-doctor', name: 'Add Doctor', category: 'Doctor Management' },
  'doctor-role': { route: '/management/doctor-category', name: 'Doctor Role', category: 'Doctor Management' },
  'doctor-list': { route: '/management/doctors', name: 'Doctor List', category: 'Doctor Management' },
  'doctor-attendance': { route: '/management/doctor-attendance', name: 'Doctor Attendance', category: 'Doctor Management' },
  'doctor-salary': { route: '/management/doctor-salary', name: 'Doctor Salary', category: 'Doctor Management' },
  'deleted-doctors': { route: '/management/deleted-doctors', name: 'Deleted Doctors', category: 'Doctor Management' },
  
  // Medicine Management
  'add-medicine': { route: '/medicine/add', name: 'Add Medicine', category: 'Medicine Management' },
  'medicine-categories': { route: '/medicine/categories', name: 'Medicine Categories', category: 'Medicine Management' },
  'medicine-suppliers': { route: '/medicine/suppliers', name: 'Medicine Suppliers', category: 'Medicine Management' },
  'medicine-stock': { route: '/medicine/stock', name: 'Medicine Stock', category: 'Medicine Management' },
  'medicine-accounts': { route: '/medicine/accounts', name: 'Medicine Accounts', category: 'Medicine Management' },
  
  // Grocery Management
  'add-grocery': { route: '/grocery', name: 'Add Grocery', category: 'Grocery Management' },
  'grocery-categories': { route: '/grocery/categories', name: 'Grocery Categories', category: 'Grocery Management' },
  'grocery-suppliers': { route: '/grocery/suppliers', name: 'Grocery Suppliers', category: 'Grocery Management' },
  'grocery-stock': { route: '/grocery/stock', name: 'Grocery Stock', category: 'Grocery Management' },
  'grocery-accounts': { route: '/grocery/accounts', name: 'Grocery Accounts', category: 'Grocery Management' },
  
  // General Purchase
  'add-products': { route: '/general/add', name: 'Add Products', category: 'General Purchase' },
  'general-categories': { route: '/general/categories', name: 'General Categories', category: 'General Purchase' },
  'general-suppliers': { route: '/general/suppliers', name: 'General Suppliers', category: 'General Purchase' },
  'general-stock': { route: '/general/stock', name: 'General Stock', category: 'General Purchase' },
  'general-accounts': { route: '/general/accounts', name: 'General Accounts', category: 'General Purchase' },
  
  // User Management
  'administration': { route: '/administration', name: 'Administration', category: 'User Management' },
  'add-role': { route: '/management/user-role/add', name: 'Add Role', category: 'User Management' },
  'role-management': { route: '/management/user-role/roles', name: 'Role Management', category: 'User Management' },
  
  // Leads Management
  'add-lead-category': { route: '/leads/add-category', name: 'Add Lead Category', category: 'Leads Management' },
  'leads-list': { route: '/leads/list', name: 'Leads List', category: 'Leads Management' },
  
  // Settings
  'settings': { route: '/settings', name: 'Settings', category: 'Settings' }
};

// Get user permissions from localStorage/context
export const getUserPermissions = () => {
  try {
    const userDataStr = localStorage.getItem('userData') || localStorage.getItem('healthcare_user');
    if (!userDataStr) {
      return { permissions: [], role: '' };
    }
    
    const userData = JSON.parse(userDataStr);
    return {
      permissions: userData.permissions || [],
      role: userData.role || ''
    };
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return { permissions: [], role: '' };
  }
};

// Check if user has permission for a specific page
export const hasPagePermission = (pageId: string): boolean => {
  const { permissions, role } = getUserPermissions();
  
  // Admin users have all permissions
  if (role && (
    role.toLowerCase() === 'admin' || 
    role.toLowerCase() === 'administrator' ||
    role.toLowerCase() === 'super admin'
  )) {
    return true;
  }
  
  // Check if user has specific permission
  return permissions.includes(pageId);
};

// Check if user has permission for a specific route
export const hasRoutePermission = (route: string): boolean => {
  // Find the page ID that matches this route
  const pageId = Object.keys(PAGE_PERMISSIONS_MAP).find(
    id => PAGE_PERMISSIONS_MAP[id].route === route
  );
  
  if (!pageId) {
    // If route not found in permissions map, allow access (for unknown routes)
    return true;
  }
  
  return hasPagePermission(pageId);
};

// Get all available permissions for role creation/editing
export const getAllPermissions = () => {
  return Object.keys(PAGE_PERMISSIONS_MAP).map(id => ({
    id,
    name: PAGE_PERMISSIONS_MAP[id].name,
    route: PAGE_PERMISSIONS_MAP[id].route,
    category: PAGE_PERMISSIONS_MAP[id].category
  }));
};

// Filter menu items based on user permissions
export const filterMenuItemsByPermissions = (menuItems: any[], userPermissions: string[], userRole: string) => {
  // Admin users see all menu items
  if (userRole && (
    userRole.toLowerCase() === 'admin' || 
    userRole.toLowerCase() === 'administrator' ||
    userRole.toLowerCase() === 'super admin'
  )) {
    return menuItems;
  }
  
  const filterMenuItem = (item: any): any | null => {
    // If item has a direct route, check permission
    if (item.href) {
      const pageId = Object.keys(PAGE_PERMISSIONS_MAP).find(
        id => PAGE_PERMISSIONS_MAP[id].route === item.href
      );
      
      if (pageId && !userPermissions.includes(pageId)) {
        return null; // User doesn't have permission for this page
      }
    }
    
    // If item has submenu, filter submenu items
    if (item.submenu && Array.isArray(item.submenu)) {
      const filteredSubmenu = item.submenu
        .map(filterMenuItem)
        .filter(subItem => subItem !== null);
      
      if (filteredSubmenu.length === 0) {
        return null; // No accessible submenu items
      }
      
      return {
        ...item,
        submenu: filteredSubmenu
      };
    }
    
    return item;
  };
  
  return menuItems
    .map(filterMenuItem)
    .filter(item => item !== null);
};

// Get permission categories grouped
export const getPermissionsByCategory = () => {
  const categories: { [key: string]: Array<{id: string, name: string, route: string}> } = {};
  
  Object.keys(PAGE_PERMISSIONS_MAP).forEach(id => {
    const permission = PAGE_PERMISSIONS_MAP[id];
    if (!categories[permission.category]) {
      categories[permission.category] = [];
    }
    categories[permission.category].push({
      id,
      name: permission.name,
      route: permission.route
    });
  });
  
  return categories;
};

// Legacy support for existing code
export const isRouteAccessible = (currentPath: string, userPermissions: string[], userRole?: string): boolean => {
  return hasRoutePermission(currentPath);
};
