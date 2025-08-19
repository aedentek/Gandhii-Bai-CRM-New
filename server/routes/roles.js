
import express from 'express';
import db from '../db/config.js';
const router = express.Router()

// All available pages and their permissions in the system
const ALL_PAGES_PERMISSIONS = [
  // Main Navigation Pages
  { id: 'dashboard', name: 'Dashboard', route: '/dashboard', category: 'Main' },
  
  // Patient Management
  { id: 'add-patient', name: 'Add Patient', route: '/patients/add', category: 'Patient Management' },
  { id: 'patient-list', name: 'Patient List', route: '/patients/list', category: 'Patient Management' },
  { id: 'test-report-amount', name: 'Test Report Amount', route: '/patients/test-report-amount', category: 'Patient Management' },
  { id: 'patient-attendance', name: 'Patient Attendance', route: '/patients/attendance', category: 'Patient Management' },
  { id: 'medical-records', name: 'Medical Record', route: '/patients/medical-records', category: 'Patient Management' },
  { id: 'patient-history', name: 'Patient History', route: '/patients/history', category: 'Patient Management' },
  { id: 'call-records', name: 'Call Records', route: '/patients/call-records', category: 'Patient Management' },
  { id: 'payment-fees', name: 'Payment Fees', route: '/patients/payment-fees', category: 'Patient Management' },
  { id: 'deleted-patients', name: 'Deleted Patients', route: '/patients/deleted', category: 'Patient Management' },
  
  // Staff Management
  { id: 'add-staff', name: 'Add Staff', route: '/management/add-staff', category: 'Staff Management' },
  { id: 'staff-category', name: 'Staff Category', route: '/management/staff-category', category: 'Staff Management' },
  { id: 'staff-list', name: 'Staff List', route: '/management/staff', category: 'Staff Management' },
  { id: 'staff-attendance', name: 'Staff Attendance', route: '/management/attendance', category: 'Staff Management' },
  { id: 'salary-payment', name: 'Salary Payment', route: '/management/salary-payment', category: 'Staff Management' },
  { id: 'deleted-staff', name: 'Deleted Staff', route: '/management/deleted-staff', category: 'Staff Management' },
  
  // Doctor Management
  { id: 'add-doctor', name: 'Add Doctor', route: '/management/add-doctor', category: 'Doctor Management' },
  { id: 'doctor-role', name: 'Doctor Role', route: '/management/doctor-category', category: 'Doctor Management' },
  { id: 'doctor-list', name: 'Doctor List', route: '/management/doctors', category: 'Doctor Management' },
  { id: 'doctor-attendance', name: 'Doctor Attendance', route: '/management/doctor-attendance', category: 'Doctor Management' },
  { id: 'doctor-salary', name: 'Doctor Salary', route: '/management/doctor-salary', category: 'Doctor Management' },
  { id: 'deleted-doctors', name: 'Deleted Doctors', route: '/management/deleted-doctors', category: 'Doctor Management' },
  
  // Medicine Management
  { id: 'add-medicine', name: 'Add Medicine', route: '/medicine/add', category: 'Medicine Management' },
  { id: 'medicine-categories', name: 'Medicine Categories', route: '/medicine/categories', category: 'Medicine Management' },
  { id: 'medicine-suppliers', name: 'Medicine Suppliers', route: '/medicine/suppliers', category: 'Medicine Management' },
  { id: 'medicine-stock', name: 'Medicine Stock', route: '/medicine/stock', category: 'Medicine Management' },
  { id: 'medicine-accounts', name: 'Medicine Accounts', route: '/medicine/accounts', category: 'Medicine Management' },
  
  // Grocery Management
  { id: 'add-grocery', name: 'Add Grocery', route: '/grocery', category: 'Grocery Management' },
  { id: 'grocery-categories', name: 'Grocery Categories', route: '/grocery/categories', category: 'Grocery Management' },
  { id: 'grocery-suppliers', name: 'Grocery Suppliers', route: '/grocery/suppliers', category: 'Grocery Management' },
  { id: 'grocery-stock', name: 'Grocery Stock', route: '/grocery/stock', category: 'Grocery Management' },
  { id: 'grocery-accounts', name: 'Grocery Accounts', route: '/grocery/accounts', category: 'Grocery Management' },
  
  // General Purchase
  { id: 'add-products', name: 'Add Products', route: '/general/add', category: 'General Purchase' },
  { id: 'general-categories', name: 'General Categories', route: '/general/categories', category: 'General Purchase' },
  { id: 'general-suppliers', name: 'General Suppliers', route: '/general/suppliers', category: 'General Purchase' },
  { id: 'general-stock', name: 'General Stock', route: '/general/stock', category: 'General Purchase' },
  { id: 'general-accounts', name: 'General Accounts', route: '/general/accounts', category: 'General Purchase' },
  
  // User Role Management
  { id: 'administration', name: 'Administration', route: '/administration', category: 'User Management' },
  { id: 'add-role', name: 'Add Role', route: '/management/user-role/add', category: 'User Management' },
  { id: 'role-management', name: 'Role Management', route: '/management/user-role/roles', category: 'User Management' },
  
  // Leads Management
  { id: 'add-lead-category', name: 'Add Lead Category', route: '/leads/add-category', category: 'Leads Management' },
  { id: 'leads-list', name: 'Leads List', route: '/leads/list', category: 'Leads Management' },
  
  // Settings
  { id: 'settings', name: 'Settings', route: '/settings', category: 'Settings' }
];

// Function to get permissions for a role
const getPermissionsForRole = (roleName, requestedPermissions) => {
  // Super Admin and Admin users automatically get all permissions
  if (roleName && (
    roleName.toLowerCase().includes('super admin') || 
    roleName.toLowerCase() === 'admin' || 
    roleName.toLowerCase() === 'administrator' || 
    roleName.toLowerCase() === 'super admin'
  )) {
    console.log('🔑 Admin role detected, granting all permissions');
    return ALL_PAGES_PERMISSIONS.map(page => page.id);
  }
  
  // Other roles get their requested permissions (ensure it's an array)
  const permissions = Array.isArray(requestedPermissions) ? requestedPermissions : [];
  console.log('👤 Regular role, permissions:', permissions);
  return permissions;
};

// Get all available pages/permissions
router.get('/permissions', async (req, res) => {
  try {
    console.log('✅ All permissions requested');
    res.json({
      pages: ALL_PAGES_PERMISSIONS,
      permissions: ALL_PAGES_PERMISSIONS.map(page => page.id)
    });
  } catch (err) {
    console.error('❌ Error fetching permissions:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get roles
router.get('/roles', async (req, res) => {
  try {
    console.log('✅ GET /api/roles - Fetching all roles');
    const [rows] = await db.execute('SELECT * FROM roles ORDER BY id DESC');
    console.log(`✅ Found ${rows.length} roles`);
    
    // Parse JSON permissions for each role and ensure consistent format
    const rolesWithPermissions = rows.map(role => {
      let parsedPermissions = [];
      
      if (role.permissions) {
        try {
          // If it's already a string, parse it
          if (typeof role.permissions === 'string') {
            parsedPermissions = JSON.parse(role.permissions);
          } else if (Array.isArray(role.permissions)) {
            parsedPermissions = role.permissions;
          }
        } catch (e) {
          console.error(`❌ Failed to parse permissions for role ${role.id}:`, e.message);
          parsedPermissions = [];
        }
      }
      
      // Ensure Super Admin always has all permissions
      if (role.name && role.name.toLowerCase().includes('super admin')) {
        parsedPermissions = ALL_PAGES_PERMISSIONS.map(page => page.id);
        console.log(`🔑 Super Admin role detected - granted all ${parsedPermissions.length} permissions`);
      }
      
      return {
        ...role,
        permissions: parsedPermissions
      };
    });
    
    res.json(rolesWithPermissions);
  } catch (err) {
    console.error('❌ Error fetching roles:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get role by ID
router.get('/roles/:id', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM roles WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }
    
    const role = {
      ...rows[0],
      permissions: rows[0].permissions ? JSON.parse(rows[0].permissions) : []
    };
    
    res.json(role);
  } catch (err) {
    console.error('❌ Error fetching role:', err);
    res.status(500).json({ error: err.message });
  }
});

// Add role
router.post('/roles', async (req, res) => {
  try {
    console.log('🔍 POST /api/roles - Creating role:', req.body);
    const { name, description, permissions, status } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Role name is required' });
    }
    
    // Check if role already exists
    const [existing] = await db.execute('SELECT id FROM roles WHERE name = ?', [name]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Role already exists' });
    }
    
    // Ensure permissions is an array
    let validPermissions = [];
    if (Array.isArray(permissions)) {
      validPermissions = permissions.filter(perm => 
        ALL_PAGES_PERMISSIONS.some(page => page.id === perm)
      );
    }
    
    console.log('🔍 Valid permissions after filtering:', validPermissions);
    
    // Get final permissions for this role
    const finalPermissions = getPermissionsForRole(name, validPermissions);
    
    console.log('🔍 Final permissions to store:', finalPermissions);
    
    // Store permissions as JSON string
    const permissionsJSON = JSON.stringify(finalPermissions);
    console.log('🔍 Permissions JSON to store:', permissionsJSON);
    
    const [result] = await db.execute(
      'INSERT INTO roles (name, description, permissions, status, createdAt) VALUES (?, ?, ?, ?, NOW())',
      [name, description || '', permissionsJSON, status || 'active']
    );
    
    console.log('✅ Role created successfully with ID:', result.insertId);
    
    res.status(201).json({ 
      id: result.insertId, 
      name, 
      description: description || '', 
      permissions: finalPermissions,
      status: status || 'active',
      message: 'Role created successfully' 
    });
  } catch (err) {
    console.error('❌ Error creating role:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update role
router.put('/roles/:id', async (req, res) => {
  try {
    console.log('✅ Update role requested:', req.params.id, req.body);
    const { name, description, permissions, status } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Role name is required' });
    }
    
    // Check if role exists
    const [existing] = await db.execute('SELECT id FROM roles WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }
    
    // Validate permissions are valid page IDs
    const validPermissions = permissions ? permissions.filter(perm => 
      ALL_PAGES_PERMISSIONS.some(page => page.id === perm)
    ) : [];
    
    // Get appropriate permissions for this role
    const finalPermissions = getPermissionsForRole(name, validPermissions);
    
    const [result] = await db.execute(
      'UPDATE roles SET name = ?, description = ?, permissions = ?, status = ? WHERE id = ?',
      [name, description || '', JSON.stringify(finalPermissions), status || 'active', req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }
    
    console.log('✅ Role updated successfully, permissions assigned:', finalPermissions.length);
    res.json({ message: 'Role updated successfully', permissions: finalPermissions });
  } catch (err) {
    console.error('❌ Error updating role:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete role
router.delete('/roles/:id', async (req, res) => {
  try {
    console.log('✅ Delete role requested:', req.params.id);
    
    // Check if role is being used by any users
    const [usersWithRole] = await db.execute('SELECT COUNT(*) as count FROM management_users WHERE user_role = (SELECT name FROM roles WHERE id = ?)', [req.params.id]);
    
    if (usersWithRole[0].count > 0) {
      return res.status(400).json({ 
        error: `Cannot delete role. ${usersWithRole[0].count} user(s) are assigned to this role.` 
      });
    }
    
    const [result] = await db.execute('DELETE FROM roles WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }
    
    console.log('✅ Role deleted successfully');
    res.json({ message: 'Role deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting role:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get user permissions by user ID or username
router.get('/user-permissions/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    console.log('✅ User permissions requested for:', identifier);
    
    // Try to find user by ID first, then by username
    let query = 'SELECT user_role FROM management_users WHERE id = ?';
    let [users] = await db.execute(query, [identifier]);
    
    if (users.length === 0) {
      // Try by username
      query = 'SELECT user_role FROM management_users WHERE username = ?';
      [users] = await db.execute(query, [identifier]);
    }
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userRole = users[0].user_role;
    
    // Get role permissions
    const [roles] = await db.execute('SELECT permissions FROM roles WHERE name = ?', [userRole]);
    
    let permissions = [];
    if (roles.length > 0 && roles[0].permissions) {
      permissions = JSON.parse(roles[0].permissions);
    }
    
    // Admin users get all permissions
    if (userRole && (
      userRole.toLowerCase() === 'admin' || 
      userRole.toLowerCase() === 'administrator' || 
      userRole.toLowerCase() === 'super admin'
    )) {
      permissions = ALL_PAGES_PERMISSIONS.map(page => page.id);
    }
    
    console.log('✅ User permissions found:', permissions.length);
    res.json({
      role: userRole,
      permissions: permissions,
      pages: ALL_PAGES_PERMISSIONS.filter(page => permissions.includes(page.id))
    });
    
  } catch (err) {
    console.error('❌ Error fetching user permissions:', err);
    res.status(500).json({ error: err.message });
  }
});

// Check if user has permission for specific page
router.get('/check-permission/:userId/:pageId', async (req, res) => {
  try {
    const { userId, pageId } = req.params;
    console.log('✅ Permission check requested:', userId, pageId);
    
    // Get user role
    const [users] = await db.execute('SELECT user_role FROM management_users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userRole = users[0].user_role;
    
    // Admin users have all permissions
    if (userRole && (
      userRole.toLowerCase() === 'admin' || 
      userRole.toLowerCase() === 'administrator' || 
      userRole.toLowerCase() === 'super admin'
    )) {
      return res.json({ hasPermission: true, role: userRole });
    }
    
    // Get role permissions
    const [roles] = await db.execute('SELECT permissions FROM roles WHERE name = ?', [userRole]);
    
    let hasPermission = false;
    if (roles.length > 0 && roles[0].permissions) {
      const permissions = JSON.parse(roles[0].permissions);
      hasPermission = permissions.includes(pageId);
    }
    
    res.json({ hasPermission, role: userRole });
    
  } catch (err) {
    console.error('❌ Error checking permission:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;