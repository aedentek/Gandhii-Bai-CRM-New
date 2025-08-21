import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function verifyDatabaseSchema() {
    console.log('🗄️ Verifying Test Reports Database Schema...');
    console.log('='.repeat(50));
    
    try {
        // Create database connection
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'gandhi_bai_crm'
        });
        
        console.log('✅ Database connection established');
        
        // Check if test_reports table exists
        const [tables] = await connection.execute(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'test_reports'
        `, [process.env.DB_NAME || 'gandhi_bai_crm']);
        
        if (tables.length > 0) {
            console.log('✅ test_reports table exists');
            
            // Get table structure
            const [columns] = await connection.execute(`
                SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_KEY
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'test_reports'
                ORDER BY ORDINAL_POSITION
            `, [process.env.DB_NAME || 'gandhi_bai_crm']);
            
            console.log('\n📋 Table Structure:');
            console.table(columns);
            
            // Get current record count
            const [countResult] = await connection.execute('SELECT COUNT(*) as count FROM test_reports');
            console.log(`\n📊 Current record count: ${countResult[0].count}`);
            
            // Show sample records if any exist
            if (countResult[0].count > 0) {
                const [sampleRecords] = await connection.execute('SELECT * FROM test_reports LIMIT 3');
                console.log('\n🔍 Sample Records:');
                console.table(sampleRecords);
            }
            
        } else {
            console.log('❌ test_reports table does not exist');
        }
        
        await connection.end();
        console.log('\n✅ Database verification completed');
        
    } catch (error) {
        console.error('❌ Database verification error:', error.message);
    }
}

verifyDatabaseSchema();
