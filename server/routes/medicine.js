import express from 'express';
import db from '../db/config.js'; // Assuming you have a db.js file for database connection

console.log('💊 Medicine routes module loaded!');

const router = express.Router()

// Get all medicine categories
router.get('/medicine-categories', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM medicine_categories ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a medicine category
router.post('/medicine-categories', async (req, res) => {
  const { name, description, status } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  try {
    const [result] = await db.query(
      'INSERT INTO medicine_categories (name, description, status) VALUES (?, ?, ?)',
      [name, description, status || 'active']
    );
    const [rows] = await db.query('SELECT * FROM medicine_categories WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a medicine category
router.put('/medicine-categories/:id', async (req, res) => {
  const { name, description, status } = req.body;
  try {
    await db.query(
      'UPDATE medicine_categories SET name=?, description=?, status=? WHERE id=?',
      [name, description, status, req.params.id]
    );
    const [rows] = await db.query('SELECT * FROM medicine_categories WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a medicine category
router.delete('/medicine-categories/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM medicine_categories WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Category not found' });
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === MEDICINE SUPPLIERS ENDPOINTS ===

// Get all medicine suppliers
router.get('/medicine-suppliers', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM medicine_suppliers ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a new medicine supplier
router.post('/medicine-suppliers', async (req, res) => {
  const { name, contact_person, email, phone, address, status } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO medicine_suppliers (name, contact_person, email, phone, address, status) VALUES (?, ?, ?, ?, ?, ?)',
      [name, contact_person, email, phone, address, status || 'active']
    );
    const [rows] = await db.query('SELECT * FROM medicine_suppliers WHERE id = ?', [result.insertId]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a medicine supplier
router.put('/medicine-suppliers/:id', async (req, res) => {
  const { name, contact_person, email, phone, address, status } = req.body;
  try {
    const [result] = await db.query(
      'UPDATE medicine_suppliers SET name=?, contact_person=?, email=?, phone=?, address=?, status=? WHERE id=?',
      [name, contact_person, email, phone, address, status, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Supplier not found' });
    const [rows] = await db.query('SELECT * FROM medicine_suppliers WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a medicine supplier
router.delete('/medicine-suppliers/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM medicine_suppliers WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Supplier not found' });
    res.json({ message: 'Supplier deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === MEDICINE PRODUCTS ENDPOINTS ===

// Get all medicine products
router.get('/medicine-products', async (req, res) => {
  try {
    console.log('🔍 Fetching medicine products from database...');
    const [rows] = await db.query('SELECT * FROM medicine_products ORDER BY id DESC');
    console.log(`✅ Found ${rows.length} medicine products`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a medicine product
router.post('/medicine-products', async (req, res) => {
  const { 
    name, description, category, supplier, manufacturer, batch_number, expiry_date, 
    price, quantity, status, purchase_date, purchase_amount, settlement_amount, 
    balance_amount, payment_status, payment_type 
  } = req.body;
  
  if (!name || !category || !supplier || !price || !quantity) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  try {
    // Calculate purchase_amount if not provided
    const calculatedPurchaseAmount = purchase_amount || (Number(price) * Number(quantity));
    
    // Determine stock status based on quantity
    let stockStatus = 'in_stock';
    if (quantity === 0) stockStatus = 'out_of_stock';
    else if (quantity <= 10) stockStatus = 'low_stock';
    
    const [result] = await db.query(
      `INSERT INTO medicine_products (
        name, description, category, supplier, manufacturer, batch_number, expiry_date,
        price, quantity, status, purchase_date, purchase_amount, settlement_amount,
        balance_amount, payment_status, payment_type, current_stock, used_stock, balance_stock, stock_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, description, category, supplier, manufacturer, batch_number, expiry_date,
        price, quantity, status || 'active', purchase_date, calculatedPurchaseAmount,
        settlement_amount || 0, balance_amount || calculatedPurchaseAmount,
        payment_status || 'pending', payment_type || 'cash',
        quantity, 0, quantity, stockStatus
      ]
    );
    
    const [rows] = await db.query('SELECT * FROM medicine_products WHERE id = ?', [result.insertId]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a medicine product
router.put('/medicine-products/:id', async (req, res) => {
  const {
    name, description, category, supplier, manufacturer, batch_number, expiry_date,
    price, quantity, status, purchase_date, purchase_amount, settlement_amount,
    balance_amount, payment_status, payment_type
  } = req.body;
  
  try {
    let updateFields = [];
    let values = [];
    
    if (name !== undefined) { updateFields.push('name=?'); values.push(name); }
    if (description !== undefined) { updateFields.push('description=?'); values.push(description); }
    if (category !== undefined) { updateFields.push('category=?'); values.push(category); }
    if (supplier !== undefined) { updateFields.push('supplier=?'); values.push(supplier); }
    if (manufacturer !== undefined) { updateFields.push('manufacturer=?'); values.push(manufacturer); }
    if (batch_number !== undefined) { updateFields.push('batch_number=?'); values.push(batch_number); }
    if (expiry_date !== undefined) { updateFields.push('expiry_date=?'); values.push(expiry_date); }
    if (price !== undefined) { updateFields.push('price=?'); values.push(price); }
    if (quantity !== undefined) { 
      updateFields.push('quantity=?'); 
      values.push(quantity);
      updateFields.push('current_stock=?'); 
      values.push(quantity);
      updateFields.push('balance_stock=?'); 
      values.push(quantity);
      
      // Update stock status based on quantity
      let stockStatus = 'in_stock';
      if (quantity === 0) stockStatus = 'out_of_stock';
      else if (quantity <= 10) stockStatus = 'low_stock';
      updateFields.push('stock_status=?');
      values.push(stockStatus);
    }
    if (status !== undefined) { updateFields.push('status=?'); values.push(status); }
    if (purchase_date !== undefined) { updateFields.push('purchase_date=?'); values.push(purchase_date); }
    if (purchase_amount !== undefined) { updateFields.push('purchase_amount=?'); values.push(purchase_amount); }
    if (settlement_amount !== undefined) { updateFields.push('settlement_amount=?'); values.push(settlement_amount); }
    if (balance_amount !== undefined) { updateFields.push('balance_amount=?'); values.push(balance_amount); }
    if (payment_status !== undefined) { updateFields.push('payment_status=?'); values.push(payment_status); }
    if (payment_type !== undefined) { updateFields.push('payment_type=?'); values.push(payment_type); }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(req.params.id);
    
    const [result] = await db.query(
      `UPDATE medicine_products SET ${updateFields.join(', ')} WHERE id=?`,
      values
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const [rows] = await db.query('SELECT * FROM medicine_products WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a medicine product
router.delete('/medicine-products/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM medicine_products WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === MEDICINE SETTLEMENT HISTORY ENDPOINTS ===

// Get settlement history for a specific medicine product
router.get('/medicine-settlement-history/:productId', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM medicine_settlement_history WHERE product_id = ? ORDER BY payment_date DESC',
      [req.params.productId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a settlement record for a medicine product
router.post('/medicine-settlement-history', async (req, res) => {
  const { 
    product_id, product_name, category, supplier, amount, 
    payment_date, payment_type, description 
  } = req.body;
  
  if (!product_id || !amount || !payment_date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  try {
    // Insert settlement record
    const [result] = await db.query(
      `INSERT INTO medicine_settlement_history (
        product_id, product_name, category, supplier, amount,
        payment_date, payment_type, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [product_id, product_name, category, supplier, amount, payment_date, payment_type, description]
    );

    // Update the medicine product's settlement and balance amounts
    // Calculate total settlement amount from all settlement records
    const [settlementSumRows] = await db.query(
      'SELECT COALESCE(SUM(amount), 0) as total_settlement FROM medicine_settlement_history WHERE product_id = ?',
      [product_id]
    );
    const totalSettlementAmount = Number(settlementSumRows[0].total_settlement);
    
    const [productRows] = await db.query('SELECT * FROM medicine_products WHERE id = ?', [product_id]);
    if (productRows.length > 0) {
      const product = productRows[0];
      const purchaseAmount = Number(product.purchase_amount || 0);
      const newBalanceAmount = purchaseAmount - totalSettlementAmount;
      const paymentStatus = newBalanceAmount <= 0 ? 'completed' : 'pending';
      
      await db.query(
        'UPDATE medicine_products SET settlement_amount = ?, balance_amount = ?, payment_status = ? WHERE id = ?',
        [totalSettlementAmount, newBalanceAmount, paymentStatus, product_id]
      );
    }

    const [rows] = await db.query('SELECT * FROM medicine_settlement_history WHERE id = ?', [result.insertId]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a settlement record and update product amounts
router.delete('/medicine-settlement-history/:id', async (req, res) => {
  try {
    // Get settlement record before deleting
    const [settlementRows] = await db.query('SELECT * FROM medicine_settlement_history WHERE id = ?', [req.params.id]);
    if (settlementRows.length === 0) {
      return res.status(404).json({ error: 'Settlement record not found' });
    }
    
    const settlement = settlementRows[0];
    
    // Delete the settlement record
    const [result] = await db.query('DELETE FROM medicine_settlement_history WHERE id = ?', [req.params.id]);
    
    // Recalculate total settlement amount from remaining settlement records
    const [settlementSumRows] = await db.query(
      'SELECT COALESCE(SUM(amount), 0) as total_settlement FROM medicine_settlement_history WHERE product_id = ?',
      [settlement.product_id]
    );
    const totalSettlementAmount = Number(settlementSumRows[0].total_settlement);
    
    // Update the medicine product's settlement and balance amounts
    const [productRows] = await db.query('SELECT * FROM medicine_products WHERE id = ?', [settlement.product_id]);
    if (productRows.length > 0) {
      const product = productRows[0];
      const purchaseAmount = Number(product.purchase_amount || 0);
      const newBalanceAmount = purchaseAmount - totalSettlementAmount;
      const paymentStatus = newBalanceAmount <= 0 ? 'completed' : 'pending';
      
      await db.query(
        'UPDATE medicine_products SET settlement_amount = ?, balance_amount = ?, payment_status = ? WHERE id = ?',
        [totalSettlementAmount, newBalanceAmount, paymentStatus, settlement.product_id]
      );
    }
    
    res.json({ message: 'Settlement record deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Medicine Stock History Endpoints ---

// Get medicine stock history for a product
router.get('/medicine-stock-history/:productId', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM medicine_stock_history WHERE product_id = ? ORDER BY update_date DESC, id DESC',
      [req.params.productId]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching medicine stock history:', err);
    res.status(500).json({ error: err.message });
  }
});

// Add a medicine stock history record
router.post('/medicine-stock-history', async (req, res) => {
  try {
    const { 
      product_id, 
      stock_change, 
      stock_type, 
      current_stock_before, 
      current_stock_after, 
      update_date, 
      description 
    } = req.body;

    if (!product_id || !stock_change || !stock_type) {
      return res.status(400).json({ error: 'product_id, stock_change, and stock_type are required' });
    }

    const [result] = await db.query(
      `INSERT INTO medicine_stock_history 
       (product_id, stock_change, stock_type, current_stock_before, current_stock_after, update_date, description) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [product_id, stock_change, stock_type, current_stock_before, current_stock_after, update_date, description]
    );

    const [rows] = await db.query('SELECT * FROM medicine_stock_history WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error adding medicine stock history record:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete a medicine stock history record
router.delete('/medicine-stock-history/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM medicine_stock_history WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Medicine stock history record not found' });
    }
    
    res.json({ message: 'Medicine stock history record deleted successfully' });
  } catch (err) {
    console.error('Error deleting medicine stock history record:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;