require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const p = new Pool({ connectionString: process.env.DATABASE_URL });

async function fix() {
  const customerHash = await bcrypt.hash('demo123', 10);
  const adminHash = await bcrypt.hash('admin123', 10);

  console.log('Customer hash:', customerHash);
  console.log('Admin hash:', adminHash);

  await p.query(
    'UPDATE customers SET password_hash = $1 WHERE email = $2',
    [customerHash, 'customer@zaika.com']
  );
  await p.query(
    'UPDATE customers SET password_hash = $1 WHERE email = $2',
    [customerHash, 'priya@zaika.com']
  );
  await p.query(
    'UPDATE customers SET password_hash = $1 WHERE email = $2',
    [adminHash, 'admin@zaika.com']
  );

  console.log('All passwords updated successfully!');
  p.end();
}

fix().catch(console.error);