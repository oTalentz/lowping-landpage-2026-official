const { sql } = require('@vercel/postgres');
require('dotenv').config({ path: '.env.local' });

async function test() {
  try {
    const { rows } = await sql`SELECT NOW();`;
    console.log('DB Connection successful:', rows);
  } catch (error) {
    console.error('DB Connection failed:', error);
  }
}
test();