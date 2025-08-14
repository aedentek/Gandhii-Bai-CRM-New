const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_User || 'root',
  password: process.env.DB_Password || '',
  database: process.env.Database_Name || 'u745362362_crm',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

async function fixPatientIds() {
  let connection;
  
  try {
    console.log('🔗 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database successfully');
    
    // Get all patients with NULL patient_id
    console.log('📋 Finding patients with NULL patient_id...');
    const [patients] = await connection.execute(
      'SELECT id, name FROM patients WHERE patient_id IS NULL OR patient_id = "" ORDER BY id'
    );
    
    console.log(`Found ${patients.length} patients with missing patient_id`);
    
    if (patients.length === 0) {
      console.log('✅ All patients already have patient_id values');
      return;
    }
    
    // Update each patient with the correct patient_id format
    for (const patient of patients) {
      const patientId = `P${String(patient.id).padStart(4, '0')}`;
      
      await connection.execute(
        'UPDATE patients SET patient_id = ? WHERE id = ?',
        [patientId, patient.id]
      );
      
      console.log(`✅ Updated patient ${patient.name} (ID: ${patient.id}) with patient_id: ${patientId}`);
    }
    
    console.log('🎉 All patient IDs have been fixed successfully!');
    
    // Verify the fix
    console.log('🔍 Verifying the fix...');
    const [updatedPatients] = await connection.execute(
      'SELECT id, patient_id, name FROM patients WHERE patient_id IS NOT NULL ORDER BY id LIMIT 10'
    );
    
    console.log('Updated patients (first 10):');
    updatedPatients.forEach(p => {
      console.log(`  ${p.patient_id} - ${p.name} (ID: ${p.id})`);
    });
    
  } catch (error) {
    console.error('❌ Error fixing patient IDs:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the fix
fixPatientIds();
