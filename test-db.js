const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function test() {
  try {
    const connectionString = process.env.POSTGRES_URL || process.env.STORAGE_POSTGRES_URL || process.env.DATABASE_URL || process.env.STORAGE_DATABASE_URL;
    const sql = neon(connectionString);
    const rows = await sql`SELECT NOW();`;
    console.log('DB Connection successful:', rows);
  } catch (error) {
    console.error('DB Connection failed:', error);
  }
}
test();