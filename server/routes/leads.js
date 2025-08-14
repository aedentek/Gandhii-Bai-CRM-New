import express from 'express';
import db from '../db/config.js'; // Assuming you have a db.js file for database connection
const router = express.Router()




// --- LEADS CRUD ENDPOINTS ---
// Get all leads
router.get('/leads', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM leads');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single lead by ID
router.get('/leads/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM leads WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Lead not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a lead
router.post('/leads', async (req, res) => {
  const { date, name, contactNumber, reminderDate, category, status, description } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO leads (date, name, contactNumber, reminderDate, category, status, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [date, name, contactNumber, reminderDate, category, status, description]
    );
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update category references in all leads (when a category name is changed)
router.put('/leads/update-category-references', async (req, res) => {
  const { oldCategoryName, newCategoryName } = req.body;
  try {
    const [result] = await db.query(
      'UPDATE leads SET category = ? WHERE category = ?',
      [newCategoryName, oldCategoryName]
    );
    res.json({ 
      message: 'Lead category references updated successfully', 
      updatedCount: result.affectedRows 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a lead
router.put('/leads/:id', async (req, res) => {
  const { date, name, contactNumber, reminderDate, category, status, description } = req.body;
  try {
    const [result] = await db.query(
      'UPDATE leads SET date=?, name=?, contactNumber=?, reminderDate=?, category=?, status=?, description=? WHERE id=?',
      [date, name, contactNumber, reminderDate, category, status, description, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Lead not found' });
    res.json({ id: req.params.id, ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a lead
router.delete('/leads/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM leads WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Lead not found' });
    res.json({ message: 'Lead deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all lead categories
router.get('/lead-categories', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM lead_categories');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a lead category
router.post('/lead-categories', async (req, res) => {
  const { name, description, status } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO lead_categories (name, description, status, createdAt) VALUES (?, ?, ?, ?)',
      [name, description, status, new Date().toISOString().split('T')[0]]
    );
    res.status(201).json({ id: result.insertId, name, description, status, createdAt: new Date().toISOString().split('T')[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a lead category
router.put('/lead-categories/:id', async (req, res) => {
  const { name, description, status } = req.body;
  try {
    // First check if the category exists
    const [existingCategory] = await db.query('SELECT * FROM lead_categories WHERE id = ?', [req.params.id]);
    if (existingCategory.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    await db.query(
      'UPDATE lead_categories SET name=?, description=?, status=? WHERE id=?',
      [name, description, status, req.params.id]
    );
    
    res.json({ 
      id: req.params.id, 
      name, 
      description, 
      status,
      createdAt: existingCategory[0].createdAt 
    });
  } catch (err) {
    console.error('Error updating lead category:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete a lead category
router.delete('/lead-categories/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM lead_categories WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Category not found' });
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- LEADS CRUD ENDPOINTS ---
// Get all leads
router.get('/leads', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM leads ORDER BY id DESC');
    console.log(`Retrieved ${rows.length} leads`);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching leads:', err);
    res.status(500).json({ error: err.message });
  }
});

// Add a lead
router.post('/leads', async (req, res) => {
  const { date, name, contactNumber, reminderDate, category, status, description } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO leads (date, name, contactNumber, reminderDate, category, status, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [date, name, contactNumber, reminderDate, category, status || 'Closed', description || '']
    );
    res.status(201).json({ 
      id: result.insertId, 
      date, 
      name, 
      contactNumber, 
      reminderDate, 
      category, 
      status: status || 'Closed',
      description: description || ''
    });
  } catch (err) {
    console.error('Error adding lead:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update a lead
router.put('/leads/:id', async (req, res) => {
  const { date, name, contactNumber, reminderDate, category, status, description } = req.body;
  try {
    const [result] = await db.query(
      'UPDATE leads SET date=?, name=?, contactNumber=?, reminderDate=?, category=?, status=?, description=? WHERE id=?',
      [date, name, contactNumber, reminderDate, category, status, description, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Lead not found' });
    res.json({ 
      id: req.params.id, 
      date, 
      name, 
      contactNumber, 
      reminderDate, 
      category, 
      status,
      description
    });
  } catch (err) {
    console.error('Error updating lead:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete a lead
router.delete('/leads/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM leads WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Lead not found' });
    res.json({ message: 'Lead deleted successfully' });
  } catch (err) {
    console.error('Error deleting lead:', err);
    res.status(500).json({ error: err.message });
  }
});




export default router;