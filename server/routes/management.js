import express from 'express';
import db from '../db/config.js'; // Assuming you have a db.js file for database connection



const router = express.Router()

// Create management_users table (unique name to avoid conflicts)
router.post('/setup/management-users-table', async (req, res) => {
  try {
    await db.query('DROP TABLE IF EXISTS management_users');
    await db.query(`
      CREATE TABLE management_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        user_role VARCHAR(255) NOT NULL,
        user_password VARCHAR(255) NOT NULL,
        user_status ENUM('Active','Inactive') DEFAULT 'Active',
        created_at DATE
      )
    `);
    res.json({ success: true, message: 'Management users table created successfully' });
  } catch (err) {
    console.error('Table creation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get all management users
router.get('/management-users', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM management_users ORDER BY id DESC');
    res.json(rows.map(row => ({
      id: row.id,
      username: row.username,
      role: row.user_role,
      password: row.user_password,
      status: row.user_status,
      createdAt: row.created_at
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a new management user
router.post('/management-users', async (req, res) => {
  const { username, role, password, status } = req.body;
  const createdAt = new Date().toISOString().split('T')[0];
  try {
    const [result] = await db.query(
      'INSERT INTO management_users (username, user_role, user_password, user_status, created_at) VALUES (?, ?, ?, ?, ?)',
      [username, role, password, status || 'Active', createdAt]
    );
    res.json({ 
      id: result.insertId, 
      username, 
      role, 
      status: status || 'Active', 
      createdAt 
    });
  } catch (err) {
    console.error('Insert error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update a management user
router.put('/management-users/:id', async (req, res) => {
  const { username, role, password, status } = req.body;
  try {
    await db.query(
      'UPDATE management_users SET username=?, user_role=?, user_password=?, user_status=? WHERE id=?',
      [username, role, password, status, req.params.id]
    );
    res.json({ id: req.params.id, username, role, password, status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a management user
router.delete('/management-users/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM management_users WHERE id=?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get role permissions for a specific role name
router.get('/role-permissions/:roleName', async (req, res) => {
  try {
    const { roleName } = req.params;
    const [rows] = await db.query('SELECT permissions FROM roles WHERE name = ? AND status = ?', [roleName, 'active']);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }
    
    const permissions = rows[0].permissions ? JSON.parse(rows[0].permissions) : [];
    res.json({ role: roleName, permissions });
  } catch (err) {
    console.error('Error fetching role permissions:', err);
    res.status(500).json({ error: err.message });
  }
});

// User login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    console.log('✅ Login attempt for:', username);
    
    // Find user in management_users table
    const [userRows] = await db.query(
      'SELECT id, username, user_role, user_status FROM management_users WHERE username = ? AND user_password = ? AND user_status = ?',
      [username, password, 'Active']
    );
    
    if (userRows.length === 0) {
      console.log('❌ Login failed: Invalid credentials for', username);
      return res.status(401).json({ error: 'Invalid credentials or inactive account' });
    }
    
    const user = userRows[0];
    console.log('✅ User found:', user.username, 'Role:', user.user_role);
    
    // Get role permissions
    const [roleRows] = await db.query(
      'SELECT permissions FROM roles WHERE name = ? AND status = ?', 
      [user.user_role, 'active']
    );
    
    let permissions = [];
    if (roleRows.length > 0 && roleRows[0].permissions) {
      try {
        permissions = JSON.parse(roleRows[0].permissions);
      } catch (parseErr) {
        console.log('❌ Error parsing permissions:', parseErr);
        permissions = [];
      }
    }
    
    // Admin users get all permissions automatically
    if (user.user_role && (
      user.user_role.toLowerCase() === 'admin' || 
      user.user_role.toLowerCase() === 'administrator' ||
      user.user_role.toLowerCase() === 'super admin'
    )) {
      // Get all available page permissions
      const ALL_PAGE_PERMISSIONS = [
        'dashboard', 'add-patient', 'patient-list', 'test-report-amount', 'patient-attendance',
        'medical-records', 'patient-history', 'call-records', 'payment-fees', 'deleted-patients',
        'add-staff', 'staff-category', 'staff-list', 'staff-attendance', 'salary-payment', 'deleted-staff',
        'add-doctor', 'doctor-role', 'doctor-list', 'doctor-attendance', 'doctor-salary', 'deleted-doctors',
        'add-medicine', 'medicine-categories', 'medicine-suppliers', 'medicine-stock', 'medicine-accounts',
        'add-grocery', 'grocery-categories', 'grocery-suppliers', 'grocery-stock', 'grocery-accounts',
        'add-products', 'general-categories', 'general-suppliers', 'general-stock', 'general-accounts',
        'administration', 'add-role', 'role-management', 'add-lead-category', 'leads-list', 'settings'
      ];
      permissions = ALL_PAGE_PERMISSIONS;
      console.log('✅ Admin user - granted all permissions:', permissions.length);
    }
    
    const loginResponse = {
      id: user.id,
      name: user.username,
      role: user.user_role,
      email: user.username.includes('@') ? user.username : `${user.username}@healthcare.com`,
      permissions: permissions,
      status: user.user_status
    };
    
    console.log('✅ User logged in successfully:', user.username, 'Role:', user.user_role, 'Permissions:', permissions.length);
    res.json(loginResponse);
    
  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;