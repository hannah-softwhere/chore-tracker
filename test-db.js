require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    const sql = neon(process.env.DATABASE_URL);
    
    // Test a simple query
    const result = await sql`SELECT NOW() as current_time`;
    console.log('✅ Database connection successful!');
    console.log('Current time from database:', result[0].current_time);
    
    // Test if our tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    console.log('📋 Available tables:');
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(error.message);
    
    if (error.message.includes('password authentication failed')) {
      console.error('\n💡 This might be a credentials issue. Check your DATABASE_URL.');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('\n💡 This might be a network/host issue. Check your DATABASE_URL.');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 This might be a connection issue. Check if your database is running.');
    }
  }
}

testConnection();
