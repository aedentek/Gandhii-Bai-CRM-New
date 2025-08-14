
import express from 'express';
import db from '../db/config.js'; // Assuming you have a db.js file for database connection
const router = express.Router()

// Get roles
router.get('/roles', async (req, res) => {
  try {
    console.log('✅ Roles requested');
    const [rows] = await db.execute('SELECT * FROM roles ORDER BY id');
    console.log('✅ Found roles:', rows.length);
    res.json(rows);
  } catch (err) {
    console.error('❌ Error fetching roles:', err);
    res.status(500).json({ error: err.message });
  }
});

// Add role
router.post('/roles', async (req, res) => {
  try {
    console.log('✅ Add role requested:', req.body);
    const { name, description, status } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Role name is required' });
    }
    
    // Check if role already exists
    const [existing] = await db.execute('SELECT id FROM roles WHERE name = ?', [name]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Role already exists' });
    }
    
    const [result] = await db.execute(
      'INSERT INTO roles (name, description, status, createdAt) VALUES (?, ?, ?, CURDATE())',
      [name, description || '', status || 'active']
    );
    
    console.log('✅ Role added successfully with ID:', result.insertId);
    res.status(201).json({ 
      id: result.insertId, 
      name, 
      description: description || '', 
      status: status || 'active',
      message: 'Role created successfully' 
    });
  } catch (err) {
    console.error('❌ Error creating role:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/roles/:id', async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    const [result] = await db.execute(
      'UPDATE roles SET name = ?, description = ?, permissions = ? WHERE id = ?',
      [name, description, JSON.stringify(permissions || []), req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }
    res.json({ message: 'Role updated successfully' });
  } catch (err) {
    console.error('Error updating role:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/roles/:id', async (req, res) => {
  try {
    const [result] = await db.execute('DELETE FROM roles WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }
    res.json({ message: 'Role deleted successfully' });
  } catch (err) {
    console.error('Error deleting role:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;