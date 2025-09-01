import express from 'express';
import db from '../db/config.js';

const router = express.Router();

// Test reports table is pre-created in production environment
// Table creation is disabled to avoid permission errors in hosted environments
console.log('📋 Test Reports router loaded with full CRUD operations');

// GET all test reports
router.get('/test-reports', async (req, res) => {
  try {
    console.log('🔍 GET /api/test-reports called');
    
    const [rows] = await db.execute(`
      SELECT * FROM test_reports 
      ORDER BY created_at DESC
    `);
    
    console.log(`✅ Retrieved ${rows.length} test reports from database`);
    
    res.json({
      success: true,
      data: rows,
      count: rows.length
    });
  } catch (error) {
    console.error('❌ Error fetching test reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch test reports',
      error: error.message
    });
  }
});

// GET test reports for specific patient
router.get('/test-reports/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    console.log(`🔍 GET test reports for patient: ${patientId}`);
    
    const [rows] = await db.execute(`
      SELECT * FROM test_reports 
      WHERE patient_id = ?
      ORDER BY test_date DESC
    `, [patientId]);
    
    console.log(`✅ Retrieved ${rows.length} test reports for patient ${patientId}`);
    
    res.json({
      success: true,
      data: rows,
      count: rows.length
    });
  } catch (error) {
    console.error('❌ Error fetching patient test reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient test reports',
      error: error.message
    });
  }
});

// POST new test report
router.post('/test-reports', async (req, res) => {
  try {
    console.log('✏️ POST /api/test-reports called');
    console.log('Request body:', req.body);
    
    const { patient_id, patient_name, test_type, test_date, amount, notes, status } = req.body;
    
    // Validation
    if (!patient_id || !patient_name || !test_type || !test_date || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: patient_id, patient_name, test_type, test_date, amount'
      });
    }
    
    const [result] = await db.execute(`
      INSERT INTO test_reports (patient_id, patient_name, test_type, test_date, amount, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [patient_id, patient_name, test_type, test_date, amount, notes || '', status || 'Pending']);
    
    // Fetch the created record
    const [newRecord] = await db.execute(`
      SELECT * FROM test_reports WHERE id = ?
    `, [result.insertId]);
    
    console.log(`✅ Test report created with ID: ${result.insertId}`);
    
    res.status(201).json({
      success: true,
      message: 'Test report created successfully',
      data: newRecord[0]
    });
  } catch (error) {
    console.error('❌ Error creating test report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create test report',
      error: error.message
    });
  }
});

// PUT update test report
router.put('/test-reports/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`✏️ PUT /api/test-reports/${id} called`);
    console.log('Request body:', req.body);
    
    const { test_type, test_date, amount, notes, status } = req.body;
    
    // Check if record exists
    const [existing] = await db.execute(`
      SELECT id FROM test_reports WHERE id = ?
    `, [id]);
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Test report not found'
      });
    }
    
    await db.execute(`
      UPDATE test_reports 
      SET test_type = ?, test_date = ?, amount = ?, notes = ?, status = ?
      WHERE id = ?
    `, [test_type, test_date, amount, notes || '', status || 'Pending', id]);
    
    // Fetch updated record
    const [updatedRecord] = await db.execute(`
      SELECT * FROM test_reports WHERE id = ?
    `, [id]);
    
    console.log(`✅ Test report ${id} updated successfully`);
    
    res.json({
      success: true,
      message: 'Test report updated successfully',
      data: updatedRecord[0]
    });
  } catch (error) {
    console.error('❌ Error updating test report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update test report',
      error: error.message
    });
  }
});

// DELETE test report
router.delete('/test-reports/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ DELETE /api/test-reports/${id} called`);
    
    // Check if record exists
    const [existing] = await db.execute(`
      SELECT id FROM test_reports WHERE id = ?
    `, [id]);
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Test report not found'
      });
    }
    
    await db.execute(`
      DELETE FROM test_reports WHERE id = ?
    `, [id]);
    
    console.log(`✅ Test report ${id} deleted successfully`);
    
    res.json({
      success: true,
      message: 'Test report deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting test report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete test report',
      error: error.message
    });
  }
});

export default router;
