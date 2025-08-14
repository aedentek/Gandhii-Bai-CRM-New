import express from 'express';
import db from '../db/config.js'; // Assuming you have a db.js file for database connection

const router = express.Router()


router.get('/', async (req, res) => {
  try {
    const { patientId } = req.query;
    
    let query = 'SELECT * FROM fees';
    let params = [];
    
    if (patientId) {
      query += ' WHERE patient_id = ?';
      params.push(patientId);
    }
    
    query += ' ORDER BY date DESC, id DESC';
    
    const [results] = await db.execute(query, params);
    res.json(results);
  } catch (error) {
    console.error('Error fetching fees:', error);
    res.status(500).json({ 
      error: 'Failed to fetch fees',
      details: error.message 
    });
  }
});

// POST /api/fees - Add a new fee
router.post('/', async (req, res) => {
  try {
    const { patientId, fee, date, amount } = req.body;
    
    // Validation
    if (!patientId || !fee || !date || !amount) {
      return res.status(400).json({ 
        error: 'Missing required fields. PatientId, fee, date, and amount are required.' 
      });
    }
    
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ 
        error: 'Amount must be a positive number' 
      });
    }
    
    const query = 'INSERT INTO fees (patient_id, fee, date, amount) VALUES (?, ?, ?, ?)';
    const params = [patientId, fee, date, parseFloat(amount)];
    
    const [result] = await db.execute(query, params);
    
    // Return the newly created fee
    const [newFee] = await db.execute('SELECT * FROM fees WHERE id = ?', [result.insertId]);
    res.status(201).json(newFee[0]);
  } catch (error) {
    console.error('Error adding fee:', error);
    res.status(500).json({ 
      error: 'Failed to add fee',
      details: error.message 
    });
  }
});

// PUT /api/fees/:id - Update an existing fee
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { fee, date, amount } = req.body;
    
    // Validation
    if (!fee || !date || !amount) {
      return res.status(400).json({ 
        error: 'Missing required fields. Fee, date, and amount are required.' 
      });
    }
    
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ 
        error: 'Amount must be a positive number' 
      });
    }
    
    const query = 'UPDATE fees SET fee = ?, date = ?, amount = ? WHERE id = ?';
    const params = [fee, date, parseFloat(amount), id];
    
    const [result] = await db.execute(query, params);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        error: 'Fee not found' 
      });
    }
    
    // Return the updated fee
    const [updatedFee] = await db.execute('SELECT * FROM fees WHERE id = ?', [id]);
    res.json(updatedFee[0]);
  } catch (error) {
    console.error('Error updating fee:', error);
    res.status(500).json({ 
      error: 'Failed to update fee',
      details: error.message 
    });
  }
});

// DELETE /api/fees/:id - Delete a fee
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = 'DELETE FROM fees WHERE id = ?';
    
    const [result] = await db.execute(query, [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        error: 'Fee not found' 
      });
    }
    
    res.json({ 
      message: 'Fee deleted successfully',
      deletedId: id 
    });
  } catch (error) {
    console.error('Error deleting fee:', error);
    res.status(500).json({ 
      error: 'Failed to delete fee',
      details: error.message 
    });
  }
});

router.get('/fees', (req, res) => {
  const { patientId } = req.query;
  
  let query = 'SELECT * FROM fees';
  let params = [];
  
  if (patientId) {
    query += ' WHERE patient_id = ?';
    params.push(patientId);
  }
  
  query += ' ORDER BY date DESC, id DESC';
  
  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Error fetching fees:', err);
      return res.status(500).json({ 
        error: 'Failed to fetch fees',
        details: err.message 
      });
    }
    res.json(results);
  });
});

// POST /fees - Add a new fee
router.post('/fees', (req, res) => {
  const { patientId, fee, date, amount } = req.body;
  
  // Validation
  if (!patientId || !fee || !date || !amount) {
    return res.status(400).json({ 
      error: 'Missing required fields. PatientId, fee, date, and amount are required.' 
    });
  }
  
  if (isNaN(amount) || amount <= 0) {
    return res.status(400).json({ 
      error: 'Amount must be a positive number' 
    });
  }
  
  const query = 'INSERT INTO fees (patient_id, fee, date, amount) VALUES (?, ?, ?, ?)';
  const params = [patientId, fee, date, parseFloat(amount)];
  
  db.query(query, params, (err, result) => {
    if (err) {
      console.error('Error adding fee:', err);
      return res.status(500).json({ 
        error: 'Failed to add fee',
        details: err.message 
      });
    }
    
    // Return the newly created fee
    db.query('SELECT * FROM fees WHERE id = ?', [result.insertId], (err, rows) => {
      if (err) {
        console.error('Error fetching new fee:', err);
        return res.status(500).json({ 
          error: 'Fee added but failed to fetch details',
          details: err.message 
        });
      }
      res.status(201).json(rows[0]);
    });
  });
});

// PUT /fees/:id - Update an existing fee
router.put('/fees/:id', (req, res) => {
  const { id } = req.params;
  const { fee, date, amount } = req.body;
  
  // Validation
  if (!fee || !date || !amount) {
    return res.status(400).json({ 
      error: 'Missing required fields. Fee, date, and amount are required.' 
    });
  }
  
  if (isNaN(amount) || amount <= 0) {
    return res.status(400).json({ 
      error: 'Amount must be a positive number' 
    });
  }
  
  const query = 'UPDATE fees SET fee = ?, date = ?, amount = ? WHERE id = ?';
  const params = [fee, date, parseFloat(amount), id];
  
  db.query(query, params, (err, result) => {
    if (err) {
      console.error('Error updating fee:', err);
      return res.status(500).json({ 
        error: 'Failed to update fee',
        details: err.message 
      });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        error: 'Fee not found' 
      });
    }
    
    // Return the updated fee
    db.query('SELECT * FROM fees WHERE id = ?', [id], (err, rows) => {
      if (err) {
        console.error('Error fetching updated fee:', err);
        return res.status(500).json({ 
          error: 'Fee updated but failed to fetch details',
          details: err.message 
        });
      }
      res.json(rows[0]);
    });
  });
});

// DELETE /fees/:id - Delete a fee
router.delete('/fees/:id', (req, res) => {
  const { id } = req.params;
  
  const query = 'DELETE FROM fees WHERE id = ?';
  
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('Error deleting fee:', err);
      return res.status(500).json({ 
        error: 'Failed to delete fee',
        details: err.message 
      });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        error: 'Fee not found' 
      });
    }
    
    res.json({ 
      message: 'Fee deleted successfully',
      deletedId: id 
    });
  });
});


export default router;