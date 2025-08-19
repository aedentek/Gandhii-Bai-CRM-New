// Permission utility functions for role-based access control

export interface UserPermissions {
  role: string;
  permissions: string[];
}

// Map sidebar href to permission names
export const PAGE_PERMISSIONS_MAP = {
  // Dashboard
  '/dashboard': 'Dashboard',
  
  // Patient Management
  '/patients/add': 'Add Patient',
  '/patients/list': 'Patient List',
  '/patients/test-report-amount': 'Test Report Amount',
  '/patients/attendance': 'Patient Attendance',
  '/patients/medical-records': 'Medical Record',
  '/patients/history': 'Patient History',
  '/patients/call-records': 'Call Records',
  '/patients/payment-fees': 'Payment Fees',
  '/patients/deleted': 'Deleted Patients',
  
  // Staff Management
  '/management/add-staff': 'Add Staff',
  '/management/staff-category': 'Staff Category',
  '/management/staff': 'Staff List',
  '/management/attendance': 'Staff Attendance',
  '/management/salary-payment': 'Salary Payment',
  '/management/deleted-staff': 'Deleted Staff',
  
  // Doctor Management
  '/management/add-doctor': 'Add Doctor',
  '/management/doctor-category': 'Doctor Role',
  '/management/doctors': 'Doctor List',
  '/management/doctor-attendance': 'Doctor Attendance',
  '/management/doctor-salary': 'Doctor Salary',
  '/management/deleted-doctors': 'Deleted Doctors',
  
  // Medicine Management
  '/medicine/add': 'Add Medicine',
  '/medicine/categories': 'Medicine Categories',
  '/medicine/suppliers': 'Medicine Suppliers',
  '/medicine/stock': 'Medicine Stock',
  '/medicine/accounts': 'Medicine Accounts',
  
  // Grocery Management
  '/grocery': 'Add Grocery',
  '/grocery/categories': 'Grocery Categories',
  '/grocery/suppliers': 'Grocery Suppliers',
  '/grocery/stock': 'Grocery Stock',
  '/grocery/accounts': 'Grocery Accounts',
  
  // General Purchase
  '/general/add': 'Add Products',
  '/general/categories': 'General Category',
  '/general/suppliers': 'General Suppliers',
  '/general/stock': 'General Stock',
  '/general/accounts': 'General Accounts',
  
  // User Role Management
  '/administration': 'Administration',
  '/management/user-role/add': 'Add Role',
  '/management/user-role/roles': 'Role Management',
  
  // Leads Management
  '/leads/add-category': 'Add Category (Leads)',
  '/leads/list': 'Leads List',
  
  // Settings
  '/settings': 'Settings'
};

/**
 * Check if user has permission to access a specific page
 */
export const hasPagePermission = (userPermissions: string[], pageHref: string, userRole?: string): boolean => {
  // Admin users have access to all pages by default
  if (userRole === 'admin' || userRole === 'Admin') {
    return true;
  }
  
  const requiredPermission = PAGE_PERMISSIONS_MAP[pageHref as keyof typeof PAGE_PERMISSIONS_MAP];
  
  if (!requiredPermission) {
    // If no specific permission is required, allow access
    return true;
  }
  
  return userPermissions.includes(requiredPermission);
};

/**
 * Check if user has any permission from a list of permissions
 */
export const hasAnyPermission = (userPermissions: string[], requiredPermissions: string[]): boolean => {
  return requiredPermissions.some(permission => userPermissions.includes(permission));
};

/**
 * Filter menu items based on user permissions
 */
export const filterMenuItemsByPermissions = (menuItems: any[], userPermissions: string[], userRole?: string) => {
  // Admin users can see all menu items
  if (userRole === 'admin' || userRole === 'Admin') {
    return menuItems;
  }
  
  return menuItems.map(item => {
    // If item has direct href, check permission
    if (item.href) {
      const hasAccess = hasPagePermission(userPermissions, item.href, userRole);
      return hasAccess ? item : null;
    }
    
    // If item has submenu, filter submenu items
    if (item.submenu && Array.isArray(item.submenu)) {
      const filteredSubmenu = item.submenu.filter((subItem: any) => 
        hasPagePermission(userPermissions, subItem.href, userRole)
      );
      
      // Only show parent menu if it has accessible submenu items
      if (filteredSubmenu.length > 0) {
        return {
          ...item,
          submenu: filteredSubmenu
        };
      }
      return null;
    }
    
    // If no href and no submenu, show by default (shouldn't happen in this case)
    return item;
  }).filter(Boolean); // Remove null items
};

/**
 * Get user permissions from localStorage or API
 */
export const getUserPermissions = (): { permissions: string[]; role: string } => {
  try {
    const userData = localStorage.getItem('healthcare_user');
    if (userData) {
      const user = JSON.parse(userData);
      return {
        permissions: user.permissions || [],
        role: user.role || ''
      };
    }
  } catch (error) {
    console.error('Error getting user permissions:', error);
  }
  return { permissions: [], role: '' };
};

/**
 * Check if current route is accessible by user
 */
export const isRouteAccessible = (currentPath: string, userPermissions: string[], userRole?: string): boolean => {
  return hasPagePermission(userPermissions, currentPath, userRole);
};
