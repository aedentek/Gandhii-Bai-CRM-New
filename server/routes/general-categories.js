import express from 'express';
import db from '../db/config.js'; // Assuming you have a db.js file for database connection

const router = express.Router()

// Function to generate next GP ID
async function generateNextGpId() {
  try {
    // Get the latest GP ID from database
    const [rows] = await db.query(
      'SELECT gp_id FROM general_products WHERE gp_id IS NOT NULL ORDER BY gp_id DESC LIMIT 1'
    );
    
    if (rows.length === 0) {
      // First GP ID
      return 'GP0001';
    }
    
    // Extract number from latest GP ID (e.g., 'GP0001' -> 1)
    const latestGpId = rows[0].gp_id;
    const currentNumber = parseInt(latestGpId.replace('GP', ''));
    const nextNumber = currentNumber + 1;
    
    // Format with leading zeros (e.g., 2 -> 'GP0002')
    return `GP${nextNumber.toString().padStart(4, '0')}`;
  } catch (error) {
    console.error('Error generating GP ID:', error);
    // Fallback to a timestamp-based ID if there's an error
    return `GP${Date.now().toString().slice(-4)}`;
  }
}



router.post('/general-products', async (req, res) => {
  const { 
    name, description, category, supplier, price, quantity, status, purchaseDate,
    purchase_amount, settlement_amount, balance_amount, payment_status, payment_type 
  } = req.body;
  if (!name || !category || !supplier || !price || !quantity) return res.status(400).json({ error: 'Missing required fields' });
  try {
    // Generate GP ID automatically
    const gpId = await generateNextGpId();
    
    // Calculate purchase_amount if not provided
    const calculatedPurchaseAmount = purchase_amount || (Number(price) * Number(quantity));
    const calculatedBalanceAmount = balance_amount || (calculatedPurchaseAmount - (settlement_amount || 0));
    
    const [result] = await db.query(
      `INSERT INTO general_products (
        gp_id, name, description, category, supplier, price, quantity, current_stock, status, purchase_date,
        purchase_amount, settlement_amount, balance_amount, payment_status, payment_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        gpId, name, description, category, supplier, price, quantity, quantity, status || 'active', purchaseDate,
        calculatedPurchaseAmount, settlement_amount || 0, calculatedBalanceAmount, payment_status || 'pending', payment_type
      ]
    );
    const [rows] = await db.query('SELECT * FROM general_products WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a general product

// Update a general product (now supports stock fields)
router.put('/general-products/:id', async (req, res) => {
  const {
    name, description, category, supplier, price, quantity, status, purchaseDate,
    current_stock, used_stock, balance_stock, stock_status, last_update,
    purchase_amount, settlement_amount, balance_amount, payment_status, payment_type
  } = req.body;
  try {
    // Build dynamic query for all possible fields
    let updateFields = [];
    let values = [];
    
    // Core product fields
    if (name !== undefined) { updateFields.push('name=?'); values.push(name); }
    if (description !== undefined) { updateFields.push('description=?'); values.push(description); }
    if (category !== undefined) { updateFields.push('category=?'); values.push(category); }
    if (supplier !== undefined) { updateFields.push('supplier=?'); values.push(supplier); }
    if (price !== undefined) { updateFields.push('price=?'); values.push(price); }
    if (quantity !== undefined) { updateFields.push('quantity=?'); values.push(quantity); }
    if (status !== undefined) { updateFields.push('status=?'); values.push(status); }
    if (purchaseDate !== undefined) { updateFields.push('purchase_date=?'); values.push(purchaseDate); }
    
    // Stock fields
    if (current_stock !== undefined) { updateFields.push('current_stock=?'); values.push(current_stock); }
    if (used_stock !== undefined) { updateFields.push('used_stock=?'); values.push(used_stock); }
    if (balance_stock !== undefined) { updateFields.push('balance_stock=?'); values.push(balance_stock); }
    if (stock_status !== undefined) { updateFields.push('stock_status=?'); values.push(stock_status); }
    if (last_update !== undefined) { updateFields.push('last_update=?'); values.push(last_update); }
    
    // Accounting fields
    if (purchase_amount !== undefined) { updateFields.push('purchase_amount=?'); values.push(purchase_amount); }
    if (settlement_amount !== undefined) { updateFields.push('settlement_amount=?'); values.push(settlement_amount); }
    if (balance_amount !== undefined) { updateFields.push('balance_amount=?'); values.push(balance_amount); }
    if (payment_status !== undefined) { updateFields.push('payment_status=?'); values.push(payment_status); }
    if (payment_type !== undefined) { updateFields.push('payment_type=?'); values.push(payment_type); }
    
    if (updateFields.length === 0) return res.status(400).json({ error: 'No fields provided for update' });
    
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






// Delete a general product
router.delete('/general-products/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM general_products WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// General Suppliers Endpoints
// Get all general suppliers
router.get('/general-suppliers', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM general_suppliers ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a general supplier
router.post('/general-suppliers', async (req, res) => {
  const { name, contactPerson, email, phone, address, status } = req.body;
  if (!name || !contactPerson || !email || !phone) return res.status(400).json({ error: 'Missing required fields' });
  try {
    const [result] = await db.query(
      'INSERT INTO general_suppliers (name, contact_person, email, phone, address, status) VALUES (?, ?, ?, ?, ?, ?)',
      [name, contactPerson, email, phone, address, status || 'active']
    );
    const [rows] = await db.query('SELECT * FROM general_suppliers WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a general supplier
router.put('/general-suppliers/:id', async (req, res) => {
  const { name, contactPerson, email, phone, address, status } = req.body;
  try {
    await db.query(
      'UPDATE general_suppliers SET name=?, contact_person=?, email=?, phone=?, address=?, status=? WHERE id=?',
      [name, contactPerson, email, phone, address, status, req.params.id]
    );
    const [rows] = await db.query('SELECT * FROM general_suppliers WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a general supplier
router.delete('/general-suppliers/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM general_suppliers WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Supplier not found' });
    res.json({ message: 'Supplier deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// General Categories Endpoints
// Get all general categories
router.get('/general-categories', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM general_categories ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a general category
router.post('/general-categories', async (req, res) => {
  const { name, description, status } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  try {
    const [result] = await db.query(
      'INSERT INTO general_categories (name, description, status) VALUES (?, ?, ?)',
      [name, description, status || 'active']
    );
    const [rows] = await db.query('SELECT * FROM general_categories WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a general category
router.put('/general-categories/:id', async (req, res) => {
  const { name, description, status } = req.body;
  try {
    await db.query(
      'UPDATE general_categories SET name=?, description=?, status=? WHERE id=?',
      [name, description, status, req.params.id]
    );
    const [rows] = await db.query('SELECT * FROM general_categories WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a general category
router.delete('/general-categories/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM general_categories WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Category not found' });
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// General Products endpoints  
router.get('/general-products', async (req, res) => {
  console.log('✅ General products requested');
  try {
    const [rows] = await db.execute('SELECT * FROM general_products ORDER BY id DESC');
    console.log('📋 Sample general product data:', rows.length > 0 ? rows[0] : 'No products found');
    if (rows.length > 0) {
      console.log('🔍 Available columns:', Object.keys(rows[0]));
    }
    res.json(rows);
  } catch (error) {
    console.error('❌ Error fetching general products:', error);
    res.status(500).json({ error: 'Failed to fetch general products' });
  }
});

export default router;