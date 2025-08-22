const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'healthcare_crm',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

async function runOtherFeesMigration() {
  let connection;
  
  try {
    console.log('🔄 Starting Other Fees column migration...');
    
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    // Check if otherFees column already exists
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'u745362362_crm' 
      AND TABLE_NAME = 'patients' 
      AND COLUMN_NAME = 'otherFees'
    `);
    
    if (columns.length > 0) {
      console.log('⚠️  otherFees column already exists, updating existing records...');
      
      // Update existing records
      await connection.execute(`
        UPDATE patients 
        SET otherFees = COALESCE(pickupCharge, 0) + COALESCE(bloodTest, 0)
      `);
      console.log('✅ Updated existing records with calculated otherFees');
      
    } else {
      console.log('➕ Adding otherFees column...');
      
      // Add the column
      await connection.execute(`
        ALTER TABLE patients 
        ADD COLUMN otherFees DECIMAL(10,2) DEFAULT 0 
        AFTER pickupCharge
      `);
      console.log('✅ Added otherFees column');
      
      // Update existing records
      await connection.execute(`
        UPDATE patients 
        SET otherFees = COALESCE(pickupCharge, 0) + COALESCE(bloodTest, 0)
      `);
      console.log('✅ Updated existing records with calculated otherFees');
    }
    
    // Check if triggers already exist
    const [triggers] = await connection.execute(`
      SELECT TRIGGER_NAME 
      FROM INFORMATION_SCHEMA.TRIGGERS 
      WHERE TRIGGER_SCHEMA = 'u745362362_crm' 
      AND TRIGGER_NAME IN ('update_other_fees_before_insert', 'update_other_fees_before_update')
    `);
    
    if (triggers.length === 0) {
      console.log('🔧 Creating triggers for automatic otherFees calculation...');
      
      // Create triggers
      await connection.execute(`
        CREATE TRIGGER update_other_fees_before_insert
        BEFORE INSERT ON patients
        FOR EACH ROW
        SET NEW.otherFees = COALESCE(NEW.pickupCharge, 0) + COALESCE(NEW.bloodTest, 0)
      `);
      
      await connection.execute(`
        CREATE TRIGGER update_other_fees_before_update
        BEFORE UPDATE ON patients
        FOR EACH ROW
        SET NEW.otherFees = COALESCE(NEW.pickupCharge, 0) + COALESCE(NEW.bloodTest, 0)
      `);
      
      console.log('✅ Created triggers successfully');
    } else {
      console.log('⚠️  Triggers already exist, skipping creation');
    }
    
    // Verify the migration with sample data
    const [sampleData] = await connection.execute(`
      SELECT 
        id, 
        name, 
        fees, 
        bloodTest, 
        pickupCharge, 
        otherFees,
        (COALESCE(bloodTest, 0) + COALESCE(pickupCharge, 0)) AS calculated_other_fees
      FROM patients 
      WHERE (bloodTest > 0 OR pickupCharge > 0)
      LIMIT 5
    `);
    
    console.log('\\n📊 Migration verification (sample data):');
    console.log('='.repeat(80));
    sampleData.forEach(patient => {
      console.log(`Patient: ${patient.name}`);
      console.log(`  Blood Test: ₹${patient.bloodTest || 0}`);
      console.log(`  Pickup Charge: ₹${patient.pickupCharge || 0}`);
      console.log(`  Other Fees (DB): ₹${patient.otherFees || 0}`);
      console.log(`  Calculated: ₹${patient.calculated_other_fees || 0}`);
      console.log(`  ✅ Match: ${patient.otherFees === patient.calculated_other_fees ? 'YES' : 'NO'}`);
      console.log('-'.repeat(40));
    });
    
    // Get total count of updated records
    const [countResult] = await connection.execute(`
      SELECT COUNT(*) as total_patients 
      FROM patients 
      WHERE otherFees IS NOT NULL
    `);
    
    console.log(`\\n✅ Migration completed successfully!`);
    console.log(`📊 Total patients with otherFees calculated: ${countResult[0].total_patients}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the migration
runOtherFeesMigration();
