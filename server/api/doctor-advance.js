import express from 'express';
import db from '../db/config.js';

const router = express.Router();

console.log('💰 Doctor Advance routes module loaded!');

// Get all doctor advances
router.get('/doctor-advances', async (req, res) => {
  try {
    console.log('📋 Getting all doctor advances...');
    
    const query = `
      SELECT 
        da.*,
        d.photo,
        d.phone
      FROM doctor_advance da
      LEFT JOIN doctors d ON da.doctor_id = d.id
      ORDER BY da.created_at DESC
    `;
    
    const [rows] = await db.execute(query);
    
    console.log(`✅ Found ${rows.length} doctor advances`);
    res.json({
      success: true,
      data: rows
    });
    
  } catch (error) {
    console.error('❌ Error fetching doctor advances:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctor advances',
      error: error.message
    });
  }
});

// Get doctor advance by ID
router.get('/doctor-advances/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📋 Getting doctor advance with ID: ${id}`);
    
    const query = `
      SELECT 
        da.*,
        d.photo,
        d.phone
      FROM doctor_advance da
      LEFT JOIN doctors d ON da.doctor_id = d.id
      WHERE da.id = ?
    `;
    
    const [rows] = await db.execute(query, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doctor advance not found'
      });
    }
    
    console.log('✅ Doctor advance found');
    res.json({
      success: true,
      data: rows[0]
    });
    
  } catch (error) {
    console.error('❌ Error fetching doctor advance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctor advance',
      error: error.message
    });
  }
});

// Get doctor advances by doctor ID
router.get('/doctor-advances/doctor/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    console.log(`📋 Getting doctor advances for doctor ID: ${doctorId}`);
    
    const query = `
      SELECT 
        da.*,
        d.photo,
        d.phone
      FROM doctor_advance da
      LEFT JOIN doctors d ON da.doctor_id = d.id
      WHERE da.doctor_id = ?
      ORDER BY da.created_at DESC
    `;
    
    const [rows] = await db.execute(query, [doctorId]);
    
    console.log(`✅ Found ${rows.length} advances for doctor ${doctorId}`);
    res.json({
      success: true,
      data: rows
    });
    
  } catch (error) {
    console.error('❌ Error fetching doctor advances:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctor advances',
      error: error.message
    });
  }
});

// Create new doctor advance
router.post('/doctor-advances', async (req, res) => {
  try {
    const { doctor_id, doctor_name, date, amount, reason } = req.body;
    
    console.log('💰 Creating new doctor advance:', { doctor_id, doctor_name, date, amount, reason });
    
    // Validation
    if (!doctor_id || !doctor_name || !date || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: doctor_id, doctor_name, date, amount'
      });
    }
    
    const query = `
      INSERT INTO doctor_advance (doctor_id, doctor_name, date, amount, reason)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    const [result] = await db.execute(query, [doctor_id, doctor_name, date, amount, reason || '']);
    
    console.log('✅ Doctor advance created successfully with ID:', result.insertId);
    
    res.status(201).json({
      success: true,
      message: 'Doctor advance created successfully',
      data: {
        id: result.insertId,
        doctor_id,
        doctor_name,
        date,
        amount,
        reason
      }
    });
    
  } catch (error) {
    console.error('❌ Error creating doctor advance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create doctor advance',
      error: error.message
    });
  }
});

// Update doctor advance
router.put('/doctor-advances/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { doctor_id, doctor_name, date, amount, reason } = req.body;
    
    console.log(`💰 Updating doctor advance ID: ${id}`, { doctor_id, doctor_name, date, amount, reason });
    
    // Check if advance exists
    const checkQuery = 'SELECT id FROM doctor_advance WHERE id = ?';
    const [existing] = await db.execute(checkQuery, [id]);
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doctor advance not found'
      });
    }
    
    // Validation
    if (!doctor_id || !doctor_name || !date || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: doctor_id, doctor_name, date, amount'
      });
    }
    
    const query = `
      UPDATE doctor_advance 
      SET doctor_id = ?, doctor_name = ?, date = ?, amount = ?, reason = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    const [result] = await db.execute(query, [doctor_id, doctor_name, date, amount, reason || '', id]);
    
    console.log('✅ Doctor advance updated successfully');
    
    res.json({
      success: true,
      message: 'Doctor advance updated successfully',
      data: {
        id: parseInt(id),
        doctor_id,
        doctor_name,
        date,
        amount,
        reason
      }
    });
    
  } catch (error) {
    console.error('❌ Error updating doctor advance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update doctor advance',
      error: error.message
    });
  }
});

// Delete doctor advance
router.delete('/doctor-advances/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ Deleting doctor advance ID: ${id}`);
    
    // Check if advance exists
    const checkQuery = 'SELECT id FROM doctor_advance WHERE id = ?';
    const [existing] = await db.execute(checkQuery, [id]);
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doctor advance not found'
      });
    }
    
    const query = 'DELETE FROM doctor_advance WHERE id = ?';
    const [result] = await db.execute(query, [id]);
    
    console.log('✅ Doctor advance deleted successfully');
    
    res.json({
      success: true,
      message: 'Doctor advance deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Error deleting doctor advance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete doctor advance',
      error: error.message
    });
  }
});

// Get doctors list for dropdown
router.get('/doctors-list', async (req, res) => {
  try {
    console.log('📋 Getting doctors list...');
    
    const query = `
      SELECT 
        id as doctor_id,
        name as doctor_name,
        phone,
        photo,
        specialization,
        status
      FROM doctors
      WHERE status = 'Active'
      ORDER BY name ASC
    `;
    
    const [rows] = await db.execute(query);
    
    console.log(`✅ Found ${rows.length} active doctors`);
    res.json({
      success: true,
      data: rows
    });
    
  } catch (error) {
    console.error('❌ Error fetching doctors list:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctors list',
      error: error.message
    });
  }
});

export default router;
