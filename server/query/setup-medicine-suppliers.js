import mysql from 'mysql2/promise';
import fs from 'fs';

// MySQL connection config
const db = await mysql.createPool({
  host: 'srv1639.hstgr.io',
  user: 'u745362362_crmusername',
  password: 'Aedentek@123#',
  database: 'u745362362_crm',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function setupMedicineSuppliers() {
  try {
    // Read and execute the table creation SQL
    const createTableSQL = fs.readFileSync('./create-medicine-suppliers-table.sql', 'utf8');
    await db.query(createTableSQL);
    console.log('Medicine suppliers table created successfully');

    // Insert default suppliers
    const defaultSuppliers = [
      {
        name: 'MedPharm Industries',
        contact_person: 'John Smith',
        email: 'john@medpharm.com',
        phone: '+1-555-0123',
        address: '123 Medical Center Dr, Healthcare City, HC 12345',
        status: 'active'
      },
      {
        name: 'Global Health Solutions',
        contact_person: 'Sarah Johnson',
        email: 'sarah@globalhealthsol.com',
        phone: '+1-555-0124',
        address: '456 Pharmacy Ave, Med District, MD 67890',
        status: 'active'
      },
      {
        name: 'Pharma Direct Supply',
        contact_person: 'Michael Brown',
        email: 'michael@pharmadirect.com',
        phone: '+1-555-0125',
        address: '789 Supply Chain Blvd, Medicine Town, MT 54321',
        status: 'active'
      },
      {
        name: 'Elite Medical Distributors',
        contact_person: 'Emily Davis',
        email: 'emily@elitemedical.com',
        phone: '+1-555-0126',
        address: '321 Distribution Center, Healthcare Hub, HH 98765',
        status: 'active'
      },
      {
        name: 'Reliable Pharmaceuticals',
        contact_person: 'David Wilson',
        email: 'david@reliablepharm.com',
        phone: '+1-555-0127',
        address: '654 Reliable Way, Pharma City, PC 13579',
        status: 'active'
      }
    ];

    for (const supplier of defaultSuppliers) {
      await db.query(
        'INSERT INTO medicine_suppliers (name, contact_person, email, phone, address, status) VALUES (?, ?, ?, ?, ?, ?)',
        [supplier.name, supplier.contact_person, supplier.email, supplier.phone, supplier.address, supplier.status]
      );
    }

    console.log(`${defaultSuppliers.length} default medicine suppliers added successfully`);
    
    // Verify the data
    const [rows] = await db.query('SELECT * FROM medicine_suppliers');
    console.log(`Total medicine suppliers in database: ${rows.length}`);
    
  } catch (error) {
    console.error('Error setting up medicine suppliers:', error);
  } finally {
    await db.end();
  }
}

setupMedicineSuppliers();
