import express from 'express';
import db from '../db/config.js'; // Assuming you have a db.js file for database connection
const router = express.Router()


router.get('/grocery-products', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM grocery_products ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a grocery product
router.post('/grocery-products', async (req, res) => {
  const { 
    name, description, category, supplier, price, quantity, status, purchaseDate,
    purchase_amount, settlement_amount, balance_amount, payment_status, payment_type 
  } = req.body;
  if (!name || !category || !supplier || !price || !quantity) return res.status(400).json({ error: 'Missing required fields' });
  try {
    // Calculate purchase_amount if not provided
    const calculatedPurchaseAmount = purchase_amount || (Number(price) * Number(quantity));
    const calculatedBalanceAmount = balance_amount || (calculatedPurchaseAmount - (settlement_amount || 0));
    
    const [result] = await db.query(
      `INSERT INTO grocery_products (
        name, description, category, supplier, price, quantity, current_stock, status, purchase_date,
        purchase_amount, settlement_amount, balance_amount, payment_status, payment_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, description, category, supplier, price, quantity, quantity, status || 'active', purchaseDate,
        calculatedPurchaseAmount, settlement_amount || 0, calculatedBalanceAmount, payment_status || 'pending', payment_type
      ]
    );
    const [rows] = await db.query('SELECT * FROM grocery_products WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a grocery product
router.put('/grocery-products/:id', async (req, res) => {
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
      `UPDATE grocery_products SET ${updateFields.join(', ')} WHERE id=?`,
      values
    );
    const [rows] = await db.query('SELECT * FROM grocery_products WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a grocery product
router.delete('/grocery-products/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM grocery_products WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Grocery Categories Endpoints
// Get all grocery categories
router.get('/grocery-categories', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM grocery_categories ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a grocery category
router.post('/grocery-categories', async (req, res) => {
  const { name, description, status } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  try {
    const [result] = await db.query(
      'INSERT INTO grocery_categories (name, description, status) VALUES (?, ?, ?)',
      [name, description, status || 'active']
    );
    const [rows] = await db.query('SELECT * FROM grocery_categories WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a grocery category
router.put('/grocery-categories/:id', async (req, res) => {
  const { name, description, status } = req.body;
  try {
    await db.query(
      'UPDATE grocery_categories SET name=?, description=?, status=? WHERE id=?',
      [name, description, status, req.params.id]
    );
    const [rows] = await db.query('SELECT * FROM grocery_categories WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a grocery category
router.delete('/grocery-categories/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM grocery_categories WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Category not found' });
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Grocery Suppliers Endpoints
// Get all grocery suppliers
router.get('/grocery-suppliers', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM grocery_suppliers ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a grocery supplier
router.post('/grocery-suppliers', async (req, res) => {
  const { name, contactPerson, email, phone, address, status } = req.body;
  if (!name || !contactPerson || !email || !phone) return res.status(400).json({ error: 'Missing required fields' });
  try {
    const [result] = await db.query(
      'INSERT INTO grocery_suppliers (name, contact_person, email, phone, address, status) VALUES (?, ?, ?, ?, ?, ?)',
      [name, contactPerson, email, phone, address, status || 'active']
    );
    const [rows] = await db.query('SELECT * FROM grocery_suppliers WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a grocery supplier
router.put('/grocery-suppliers/:id', async (req, res) => {
  const { name, contactPerson, email, phone, address, status } = req.body;
  try {
    await db.query(
      'UPDATE grocery_suppliers SET name=?, contact_person=?, email=?, phone=?, address=?, status=? WHERE id=?',
      [name, contactPerson, email, phone, address, status, req.params.id]
    );
    const [rows] = await db.query('SELECT * FROM grocery_suppliers WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a grocery supplier
router.delete('/grocery-suppliers/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM grocery_suppliers WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Supplier not found' });
    res.json({ message: 'Supplier deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Grocery Settlement History Endpoints
// Get settlement history for a grocery product
router.get('/grocery-settlement-history/:productId', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM grocery_settlement_history WHERE product_id = ? ORDER BY payment_date ASC, created_at ASC',
      [req.params.productId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add grocery settlement record
router.post('/grocery-settlement-history', async (req, res) => {
  const { product_id, amount, payment_date, payment_type, description } = req.body;
  if (!product_id || !amount || !payment_date) return res.status(400).json({ error: 'Missing required fields' });
  
  try {
    // Get product details first
    const [productResult] = await db.query(
      'SELECT name, category, supplier, purchase_date FROM grocery_products WHERE id = ?',
      [product_id]
    );
    
    if (productResult.length === 0) return res.status(404).json({ error: 'Product not found' });
    
    const product = productResult[0];
    
    // Insert settlement record with product details
    const [result] = await db.query(
      'INSERT INTO grocery_settlement_history (product_id, product_name, category, supplier, purchase_date, amount, payment_date, payment_type, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [product_id, product.name, product.category, product.supplier, product.purchase_date, amount, payment_date, payment_type || 'cash', description || '']
    );
    
    // Update product settlement and balance amounts
    const [totalResult] = await db.query(
      'SELECT SUM(amount) as total_paid FROM grocery_settlement_history WHERE product_id = ?',
      [product_id]
    );
    const totalPaid = totalResult[0].total_paid || 0;
    
    // Get product purchase amount
    const purchaseAmount = product.purchase_amount || 0;
    const balanceAmount = purchaseAmount - totalPaid;
    const paymentStatus = balanceAmount <= 0 ? 'completed' : 'pending';
    
    // Update product accounting fields
    await db.query(
      'UPDATE grocery_products SET settlement_amount = ?, balance_amount = ?, payment_status = ? WHERE id = ?',
      [totalPaid, balanceAmount, paymentStatus, product_id]
    );
    
    const [newRecord] = await db.query('SELECT * FROM grocery_settlement_history WHERE id = ?', [result.insertId]);
    res.status(201).json(newRecord[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete grocery settlement record
router.delete('/grocery-settlement-history/:id', async (req, res) => {
  try {
    // Get settlement record to know which product to update
    const [settlementRecord] = await db.query('SELECT product_id FROM grocery_settlement_history WHERE id = ?', [req.params.id]);
    if (settlementRecord.length === 0) return res.status(404).json({ error: 'Settlement record not found' });
    
    const productId = settlementRecord[0].product_id;
    
    // Delete the settlement record
    const [result] = await db.query('DELETE FROM grocery_settlement_history WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Settlement record not found' });
    
    // Recalculate totals for the product
    const [totalResult] = await db.query(
      'SELECT SUM(amount) as total_paid FROM grocery_settlement_history WHERE product_id = ?',
      [productId]
    );
    const totalPaid = totalResult[0].total_paid || 0;
    
    // Get product purchase amount
    const [productResult] = await db.query(
      'SELECT purchase_amount FROM grocery_products WHERE id = ?',
      [productId]
    );
    const purchaseAmount = productResult[0]?.purchase_amount || 0;
    const balanceAmount = purchaseAmount - totalPaid;
    const paymentStatus = balanceAmount <= 0 ? 'completed' : 'pending';
    
    // Update product accounting fields
    await db.query(
      'UPDATE grocery_products SET settlement_amount = ?, balance_amount = ?, payment_status = ? WHERE id = ?',
      [totalPaid, balanceAmount, paymentStatus, productId]
    );
    
    res.json({ message: 'Settlement record deleted and totals recalculated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Grocery Stock History Endpoints
// Get stock history for a grocery product
router.get('/grocery-stock-history/:productId', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM grocery_stock_history WHERE product_id = ? ORDER BY update_date DESC, created_at DESC',
      [req.params.productId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add grocery stock history record
router.post('/grocery-stock-history', async (req, res) => {
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
      'SELECT name, category, supplier, purchase_date FROM grocery_products WHERE id = ?',
      [product_id]
    );
    
    if (productRows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const product = productRows[0];
    
    const [result] = await db.query(
      `INSERT INTO grocery_stock_history (
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
    
    const [rows] = await db.query('SELECT * FROM grocery_stock_history WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete grocery stock history record
router.delete('/grocery-stock-history/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM grocery_stock_history WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Stock history record not found' });
    res.json({ message: 'Stock history record deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Get all grocery categories
router.get('/grocery-categories', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM grocery_categories ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching grocery categories:', err);
    res.status(500).json({ error: err.message });
  }
});



// Delete a grocery product
router.delete('/grocery-products/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM grocery_products WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Grocery product not found' });
    res.json({ message: 'Grocery product deleted successfully' });
  } catch (err) {
    console.error('Error deleting grocery product:', err);
    res.status(500).json({ error: err.message });
  }
});
// Add a grocery category
router.post('/grocery-categories', async (req, res) => {
  const { name, description, status } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO grocery_categories (name, description, status, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
      [name, description, status || 'active']
    );
    res.status(201).json({ 
      id: result.insertId, 
      name, 
      description, 
      status: status || 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error adding grocery category:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update a grocery category
router.put('/grocery-categories/:id', async (req, res) => {
  const { name, description, status } = req.body;
  try {
    const [result] = await db.query(
      'UPDATE grocery_categories SET name=?, description=?, status=?, updated_at=NOW() WHERE id=?',
      [name, description, status, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Grocery category not found' });
    res.json({ 
      id: req.params.id, 
      name, 
      description, 
      status,
      updated_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error updating grocery category:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete a grocery category
router.delete('/grocery-categories/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM grocery_categories WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Grocery category not found' });
    res.json({ message: 'Grocery category deleted successfully' });
  } catch (err) {
    console.error('Error deleting grocery category:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- GROCERY SUPPLIERS CRUD ENDPOINTS ---
// Get all grocery suppliers
router.get('/grocery-suppliers', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM grocery_suppliers ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching grocery suppliers:', err);
    res.status(500).json({ error: err.message });
  }
});

// Add a grocery supplier
router.post('/grocery-suppliers', async (req, res) => {
  const { name, contact_person, email, phone, address, status } = req.body;
  
  // Validate required fields
  if (!name || !contact_person || !email || !phone) {
    return res.status(400).json({ error: 'Missing required fields: name, contact_person, email, and phone are required' });
  }
  
  try {
    const [result] = await db.query(
      'INSERT INTO grocery_suppliers (name, contact_person, email, phone, address, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [name, contact_person, email, phone, address || '', status || 'active']
    );
    
    res.status(201).json({ 
      id: result.insertId, 
      name, 
      contact_person, 
      email, 
      phone, 
      address: address || '', 
      status: status || 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error adding grocery supplier:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update a grocery supplier
router.put('/grocery-suppliers/:id', async (req, res) => {
  const { name, contact_person, email, phone, address, status } = req.body;
  try {
    const [result] = await db.query(
      'UPDATE grocery_suppliers SET name=?, contact_person=?, email=?, phone=?, address=?, status=?, updated_at=NOW() WHERE id=?',
      [name, contact_person, email, phone, address, status, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Grocery supplier not found' });
    res.json({ 
      id: req.params.id, 
      name, 
      contact_person, 
      email, 
      phone, 
      address, 
      status,
      updated_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error updating grocery supplier:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete a grocery supplier
router.delete('/grocery-suppliers/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM grocery_suppliers WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Grocery supplier not found' });
    res.json({ message: 'Grocery supplier deleted successfully' });
  } catch (err) {
    console.error('Error deleting grocery supplier:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- GROCERY PRODUCTS CRUD ENDPOINTS ---
// Get all grocery products
router.get('/grocery-products', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM grocery_products ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching grocery products:', err);
    res.status(500).json({ error: err.message });
  }
});

// Add a grocery product
router.post('/grocery-products', async (req, res) => {
  const { 
    name, description, category, supplier, price, quantity, current_stock, 
    status, purchaseDate, purchase_amount, settlement_amount, balance_amount, payment_status 
  } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO grocery_products (
        name, description, category, supplier, price, quantity, current_stock, 
        status, purchase_date, purchase_amount, settlement_amount, balance_amount, 
        payment_status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        name, description, category, supplier, price, quantity, current_stock || quantity, 
        status || 'active', purchaseDate, purchase_amount, settlement_amount || 0, 
        balance_amount, payment_status || 'pending'
      ]
    );
    res.status(201).json({ 
      id: result.insertId, 
      name, description, category, supplier, price, quantity, current_stock: current_stock || quantity,
      status: status || 'active', purchase_date: purchaseDate, purchase_amount, 
      settlement_amount: settlement_amount || 0, balance_amount, payment_status: payment_status || 'pending',
      created_at: new Date().toISOString(), updated_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error adding grocery product:', err);
    res.status(500).json({ error: err.message });
  }
});




export default router;