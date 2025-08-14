import express from 'express';
import db from '../db/config.js'; // Assuming you have a db.js file for database connection



const router = express.Router()

router.get('/general-products', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM general_products ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update general stock (alias for updating stock fields in general_products)
router.put('/stock/general-stock/:id', async (req, res) => {
  const {
    current_stock, used_stock, balance_stock, stock_status, last_update
  } = req.body;
  try {
    let updateFields = [];
    let values = [];
    if (current_stock !== undefined) { updateFields.push('current_stock=?'); values.push(current_stock); }
    if (used_stock !== undefined) { updateFields.push('used_stock=?'); values.push(used_stock); }
    if (balance_stock !== undefined) { updateFields.push('balance_stock=?'); values.push(balance_stock); }
    if (stock_status !== undefined) { updateFields.push('stock_status=?'); values.push(stock_status); }
    if (last_update !== undefined) { updateFields.push('last_update=?'); values.push(last_update); }
    if (updateFields.length === 0) return res.status(400).json({ error: 'No stock fields provided' });
    values.push(req.params.id);
    await db.query(
      `UPDATE general_products SET ${updateFields.join(', ')} WHERE id=?`,
      values
    );
    const [rows] = await db.query('SELECT * FROM general_products WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Get general account by product ID
router.get('/general-accounts/product/:productId', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT ga.*, gp.name as product_name, gp.category, gp.supplier, gp.price, gp.quantity
      FROM general_accounts ga
      LEFT JOIN general_products gp ON ga.product_id = gp.id
      WHERE ga.product_id = ?
    `, [req.params.productId]);
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create or update general account
router.post('/general-accounts', async (req, res) => {
  const { product_id, purchase_amount, settlement_amount, balance_amount, status, payment_type } = req.body;
  if (!product_id || purchase_amount === undefined) return res.status(400).json({ error: 'Missing required fields' });
  try {
    // Check if account already exists
    const [existing] = await db.query('SELECT id FROM general_accounts WHERE product_id = ?', [product_id]);
    
    if (existing.length > 0) {
      // Update existing account
      await db.query(
        'UPDATE general_accounts SET purchase_amount=?, settlement_amount=?, balance_amount=?, status=?, payment_type=?, updated_at=CURRENT_TIMESTAMP WHERE product_id=?',
        [purchase_amount, settlement_amount || 0, balance_amount || (purchase_amount - (settlement_amount || 0)), status || 'pending', payment_type || 'cash', product_id]
      );
      const [rows] = await db.query('SELECT * FROM general_accounts WHERE product_id = ?', [product_id]);
      res.json(rows[0]);
    } else {
      // Create new account
      const [result] = await db.query(
        'INSERT INTO general_accounts (product_id, purchase_amount, settlement_amount, balance_amount, status, payment_type) VALUES (?, ?, ?, ?, ?, ?)',
        [product_id, purchase_amount, settlement_amount || 0, balance_amount || (purchase_amount - (settlement_amount || 0)), status || 'pending', payment_type || 'cash']
      );
      const [rows] = await db.query('SELECT * FROM general_accounts WHERE id = ?', [result.insertId]);
      res.status(201).json(rows[0]);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update general account
router.put('/general-accounts/:id', async (req, res) => {
  const { purchase_amount, settlement_amount, balance_amount, status, payment_type } = req.body;
  try {
    await db.query(
      'UPDATE general_accounts SET purchase_amount=?, settlement_amount=?, balance_amount=?, status=?, payment_type=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
      [purchase_amount, settlement_amount, balance_amount, status, payment_type, req.params.id]
    );
    const [rows] = await db.query('SELECT * FROM general_accounts WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete general account
router.delete('/general-accounts/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM general_accounts WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Account not found' });
    res.json({ message: 'Account deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// General Settlement History Endpoints
// Get settlement history for a product
router.get('/general-settlement-history/:productId', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM general_settlement_history WHERE product_id = ? ORDER BY payment_date ASC',
      [req.params.productId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add settlement record
router.post('/general-settlement-history', async (req, res) => {
  const { product_id, amount, payment_date, payment_type, notes } = req.body;
  if (!product_id || !amount || !payment_date) return res.status(400).json({ error: 'Missing required fields' });
  try {
    const [result] = await db.query(
      'INSERT INTO general_settlement_history (product_id, amount, payment_date, payment_type, notes) VALUES (?, ?, ?, ?, ?)',
      [product_id, amount, payment_date, payment_type || 'cash', notes || '']
    );
    const [rows] = await db.query('SELECT * FROM general_settlement_history WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete settlement record
router.delete('/general-settlement-history/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM general_settlement_history WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Settlement record not found' });
    res.json({ message: 'Settlement record deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get('/general-accounts', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT ga.*, gp.name as product_name, gp.category, gp.supplier, gp.price, gp.quantity
      FROM general_accounts ga
      LEFT JOIN general_products gp ON ga.product_id = gp.id
      ORDER BY ga.id DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get('/stock-history/:productId', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM stock_history WHERE product_id = ? ORDER BY update_date DESC, created_at DESC',
      [req.params.productId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add stock history record
router.post('/stock-history', async (req, res) => {
  const { 
    product_id, 
    stock_change, 
    stock_type, 
    current_stock_before, 
    current_stock_after, 
    update_date, 
    description 
  } = req.body;
  
  if (!product_id || stock_change === undefined || !current_stock_before === undefined || !current_stock_after === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  try {
    // Get product details for the history record
    const [productRows] = await db.query(
      'SELECT name, category, supplier, purchase_date FROM general_products WHERE id = ?',
      [product_id]
    );
    
    if (productRows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const product = productRows[0];
    
    const [result] = await db.query(
      `INSERT INTO stock_history (
        product_id, product_name, category, supplier, purchase_date,
        stock_change, stock_type, current_stock_before, current_stock_after,
        update_date, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        product_id, 
        product.name, 
        product.category, 
        product.supplier, 
        product.purchase_date,
        stock_change, 
        stock_type || 'used', 
        current_stock_before, 
        current_stock_after,
        update_date || new Date().toISOString().split('T')[0], 
        description || ''
      ]
    );
    
    const [rows] = await db.query('SELECT * FROM stock_history WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete stock history record
router.delete('/stock-history/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM stock_history WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Stock history record not found' });
    res.json({ message: 'Stock history record deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.post('/general-stock', async (req, res) => {
  const { product_id, current_stock, used_stock, balance_stock, stock_status, last_update } = req.body;

  try {
    // Assuming you have a function to create a general stock entry
    const newStockEntry = await createGeneralStock({
      product_id,
      current_stock,
      used_stock,
      balance_stock,
      stock_status,
      last_update
    });

    res.status(201).json(newStockEntry);
  } catch (error) {
    console.error('Error creating general stock:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


export default router;
