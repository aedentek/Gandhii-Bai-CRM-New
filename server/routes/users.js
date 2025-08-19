import express from 'express';
import db from '../db/config.js'; // Assuming you have a db.js file for database connection
const router = express.Router()
// Get all users
router.get('/users', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM management_users');
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


// NOTE: Role routes have been moved to routes/roles.js for better organization and permissions handling

export default router;