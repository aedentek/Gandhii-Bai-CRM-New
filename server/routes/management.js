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


export default router;