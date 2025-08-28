import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'srv1639.hstgr.io',
  user: 'u745362362_crmusername', 
  password: 'Aedentek@123#',
  database: 'u745362362_crm'
};

try {
  const connection = await mysql.createConnection(dbConfig);
  
  console.log('🧪 Testing SQL query from patient-payments.js...');
  
  const targetMonth = 8;
  const targetYear = 2025;
  const limit = 10;
  const offset = 0;
  
  // Test the exact query from the API (simplified version)
  const [patients] = await connection.execute(`
    SELECT 
      p.id,
      p.name as patient_name,
      CONCAT('P', LPAD(p.id, 4, '0')) as patient_id,
      COALESCE(p.fees, 0) as fees,
      COALESCE(p.payAmount, 0) as amount_paid,
      COALESCE(p.balance, 0) as amount_pending,
      
      -- Get carry forward information from patient_monthly_records
      COALESCE(
        (SELECT carry_forward_from_previous 
         FROM patient_monthly_records 
         WHERE patient_id = CONCAT('P', LPAD(p.id, 4, '0'))
         AND month = ? AND year = ?
         LIMIT 1
        ), 0
      ) as carry_forward_from_previous
      
    FROM patients p
    WHERE p.status = 'Active'
      AND p.admissionDate IS NOT NULL
    ORDER BY p.id ASC
    LIMIT 3
  `, [targetMonth, targetYear]);
  
  console.log('✅ Query executed successfully');
  console.table(patients);
  
  await connection.end();
} catch (error) {
  console.error('❌ SQL Error:', error.message);
}
