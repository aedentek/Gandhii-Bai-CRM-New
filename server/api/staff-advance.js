import express from 'express';
import db from '../db/config.js';

const router = express.Router();

console.log('👥 Staff Advance routes module loaded!');

// Get all staff advances
router.get('/staff-advances', async (req, res) => {
  try {
    console.log('📋 Getting all staff advances...');
    
    const query = `
      SELECT 
        sa.*,
        s.photo,
        s.phone
      FROM staff_advance sa
      LEFT JOIN staff s ON sa.staff_id = s.id
      ORDER BY sa.created_at DESC
    `;
    
    const [rows] = await db.execute(query);
    
    console.log(`✅ Found ${rows.length} staff advances`);
    res.json({
      success: true,
      data: rows
    });
    
  } catch (error) {
    console.error('❌ Error fetching staff advances:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff advances',
      error: error.message
    });
  }
});

// Get staff advance by ID
router.get('/staff-advances/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📋 Getting staff advance with ID: ${id}`);
    
    const query = `
      SELECT 
        sa.*,
        s.photo,
        s.phone
      FROM staff_advance sa
      LEFT JOIN staff s ON sa.staff_id = s.id
      WHERE sa.id = ?
    `;
    
    const [rows] = await db.execute(query, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Staff advance not found'
      });
    }
    
    console.log(`✅ Found staff advance: ${rows[0].staff_name}`);
    res.json({
      success: true,
      data: rows[0]
    });
    
  } catch (error) {
    console.error('❌ Error fetching staff advance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff advance',
      error: error.message
    });
  }
});

// Get staff advances by staff ID
router.get('/staff-advances/staff/:staffId', async (req, res) => {
  try {
    const { staffId } = req.params;
    console.log(`📋 Getting staff advances for staff ID: ${staffId}`);
    
    const query = `
      SELECT 
        sa.*,
        s.photo,
        s.phone
      FROM staff_advance sa
      LEFT JOIN staff s ON sa.staff_id = s.id
      WHERE sa.staff_id = ?
      ORDER BY sa.created_at DESC
    `;
    
    const [rows] = await db.execute(query, [staffId]);
    
    console.log(`✅ Found ${rows.length} advances for staff ${staffId}`);
    res.json({
      success: true,
      data: rows
    });
    
  } catch (error) {
    console.error('❌ Error fetching staff advances by staff ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff advances',
      error: error.message
    });
  }
});

// Create new staff advance
router.post('/staff-advances', async (req, res) => {
  try {
    const { staff_id, staff_name, date, amount, reason } = req.body;
    
    console.log('📝 Creating new staff advance:', {
      staff_id,
      staff_name,
      date,
      amount,
      reason
    });
    
    // Validate required fields
    if (!staff_id || !staff_name || !date || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: staff_id, staff_name, date, amount'
      });
    }
    
    const query = `
      INSERT INTO staff_advance (staff_id, staff_name, date, amount, reason)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    const [result] = await db.execute(query, [staff_id, staff_name, date, amount, reason || null]);
    
    // Get the created record
    const [newRecord] = await db.execute(
      'SELECT * FROM staff_advance WHERE id = ?',
      [result.insertId]
    );
    
    console.log('✅ Staff advance created successfully with ID:', result.insertId);
    res.status(201).json({
      success: true,
      data: newRecord[0],
      message: 'Staff advance created successfully'
    });
    
  } catch (error) {
    console.error('❌ Error creating staff advance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create staff advance',
      error: error.message
    });
  }
});

// Update staff advance
router.put('/staff-advances/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { staff_id, staff_name, date, amount, reason } = req.body;
    
    console.log(`📝 Updating staff advance ${id}:`, {
      staff_id,
      staff_name,
      date,
      amount,
      reason
    });
    
    // Check if record exists
    const [existing] = await db.execute('SELECT id FROM staff_advance WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Staff advance not found'
      });
    }
    
    const query = `
      UPDATE staff_advance 
      SET staff_id = ?, staff_name = ?, date = ?, amount = ?, reason = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await db.execute(query, [staff_id, staff_name, date, amount, reason || null, id]);
    
    // Get the updated record
    const [updatedRecord] = await db.execute('SELECT * FROM staff_advance WHERE id = ?', [id]);
    
    console.log('✅ Staff advance updated successfully');
    res.json({
      success: true,
      data: updatedRecord[0],
      message: 'Staff advance updated successfully'
    });
    
  } catch (error) {
    console.error('❌ Error updating staff advance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update staff advance',
      error: error.message
    });
  }
});

// Delete staff advance
router.delete('/staff-advances/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Deleting staff advance with ID: ${id}`);
    
    // Check if record exists
    const [existing] = await db.execute('SELECT id FROM staff_advance WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Staff advance not found'
      });
    }
    
    const query = 'DELETE FROM staff_advance WHERE id = ?';
    await db.execute(query, [id]);
    
    console.log('✅ Staff advance deleted successfully');
    res.json({
      success: true,
      message: 'Staff advance deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Error deleting staff advance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete staff advance',
      error: error.message
    });
  }
});

// Get staff list for dropdown
router.get('/staff-list', async (req, res) => {
  try {
    console.log('📋 Getting staff list...');
    
    const query = `
      SELECT 
        id as staff_id,
        name as staff_name,
        phone,
        photo,
        department,
        status
      FROM staff 
      WHERE status = 'active'
      ORDER BY name ASC
    `;
    
    const [rows] = await db.execute(query);
    
    console.log(`✅ Found ${rows.length} active staff members`);
    res.json({
      success: true,
      data: rows
    });
    
  } catch (error) {
    console.error('❌ Error fetching staff list:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff list',
      error: error.message
    });
  }
});

export default router;
