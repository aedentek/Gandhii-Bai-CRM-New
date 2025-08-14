import express from 'express';
import db from '../db/config.js'; // Assuming you have a db.js file for database connection

const router = express.Router()

// Get settlement history for a product
router.get('/settlement-history/:productId', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM settlement_history WHERE product_id = ? ORDER BY payment_date ASC, created_at ASC',
      [req.params.productId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add settlement record
router.post('/settlement-history', async (req, res) => {
  const { product_id, amount, payment_date, payment_type, description } = req.body;
  if (!product_id || !amount || !payment_date) return res.status(400).json({ error: 'Missing required fields' });
  
  try {
    // Get product details first
    const [productResult] = await db.query(
      'SELECT name, category, supplier, purchase_date FROM general_products WHERE id = ?',
      [product_id]
    );
    
    if (productResult.length === 0) return res.status(404).json({ error: 'Product not found' });
    
    const product = productResult[0];
    
    // Insert settlement record with product details
    const [result] = await db.query(
      'INSERT INTO settlement_history (product_id, product_name, category, supplier, purchase_date, amount, payment_date, payment_type, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [product_id, product.name, product.category, product.supplier, product.purchase_date, amount, payment_date, payment_type || 'cash', description || '']
    );
    
    // Update product settlement and balance amounts
    const [totalResult] = await db.query(
      'SELECT SUM(amount) as total_paid FROM settlement_history WHERE product_id = ?',
      [product_id]
    );
    const totalPaid = totalResult[0].total_paid || 0;
    
    // Get product purchase amount
    const purchaseAmount = product.purchase_amount || 0;
    const balanceAmount = purchaseAmount - totalPaid;
    const paymentStatus = balanceAmount <= 0 ? 'completed' : 'pending';
    
    // Update product accounting fields
    await db.query(
      'UPDATE general_products SET settlement_amount = ?, balance_amount = ?, payment_status = ? WHERE id = ?',
      [totalPaid, balanceAmount, paymentStatus, product_id]
    );
    
    const [newRecord] = await db.query('SELECT * FROM settlement_history WHERE id = ?', [result.insertId]);
    res.status(201).json(newRecord[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete settlement record
router.delete('/settlement-history/:id', async (req, res) => {
  try {
    // Get settlement record to know which product to update
    const [settlementRecord] = await db.query('SELECT product_id FROM settlement_history WHERE id = ?', [req.params.id]);
    if (settlementRecord.length === 0) return res.status(404).json({ error: 'Settlement record not found' });
    
    const productId = settlementRecord[0].product_id;
    
    // Delete the settlement record
    const [result] = await db.query('DELETE FROM settlement_history WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Settlement record not found' });
    
    // Recalculate totals for the product
    const [totalResult] = await db.query(
      'SELECT SUM(amount) as total_paid FROM settlement_history WHERE product_id = ?',
      [productId]
    );
    const totalPaid = totalResult[0].total_paid || 0;
    
    // Get product purchase amount
    const [productResult] = await db.query(
      'SELECT purchase_amount FROM general_products WHERE id = ?',
      [productId]
    );
    const purchaseAmount = productResult[0]?.purchase_amount || 0;
    const balanceAmount = purchaseAmount - totalPaid;
    const paymentStatus = balanceAmount <= 0 ? 'completed' : 'pending';
    
    // Update product accounting fields
    await db.query(
      'UPDATE general_products SET settlement_amount = ?, balance_amount = ?, payment_status = ? WHERE id = ?',
      [totalPaid, balanceAmount, paymentStatus, productId]
    );
    
    res.json({ message: 'Settlement record deleted and totals recalculated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;