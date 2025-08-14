import express from 'express';
import db from '../db/config.js'; // Assuming you have a db.js file for database connection
const router = express.Router()
// Get all users
router.get('/users', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM users');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single user by ID
router.get('/users/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a user
router.post('/users', async (req, res) => {
  const { name, email } = req.body;
  try {
    const [result] = await db.query('INSERT INTO users (name, email) VALUES (?, ?)', [name, email]);
    res.status(201).json({ id: result.insertId, name, email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a user
router.put('/users/:id', async (req, res) => {
  const { name, email } = req.body;
  try {
    const [result] = await db.query('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ id: req.params.id, name, email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a user
router.delete('/users/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Get all roles
router.get('/roles', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM roles ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a new role
router.post('/roles', async (req, res) => {
  const { name, description, status } = req.body;
  const createdAt = new Date().toISOString().split('T')[0];
  try {
    const [result] = await db.query(
      'INSERT INTO roles (name, description, status, createdAt) VALUES (?, ?, ?, ?)',
      [name, description, status || 'active', createdAt]
    );
    res.json({ id: result.insertId, name, description, status: status || 'active', createdAt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a role
router.put('/roles/:id', async (req, res) => {
  const { name, description, status } = req.body;
  try {
    await db.query(
      'UPDATE roles SET name=?, description=?, status=? WHERE id=?',
      [name, description, status, req.params.id]
    );
    res.json({ id: req.params.id, name, description, status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a role
router.delete('/roles/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM roles WHERE id=?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



export default router;