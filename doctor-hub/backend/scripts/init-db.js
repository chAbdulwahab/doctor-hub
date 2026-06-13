import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import dns from 'dns';
import pool from '../config/db.js';

// Force Node to prefer IPv4 when resolving hostnames in database connection
dns.setDefaultResultOrder('ipv4first');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDb() {
  try {
    console.log('Generating bcrypt hashes for seed users...');
    const hashed = await bcrypt.hash('Password123', 10);
    console.log('Hash generated successfully.');

    const sqlPath = path.resolve(__dirname, '../../DoctorHub_Database.sql');
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`SQL schema file not found at ${sqlPath}`);
    }

    let sqlText = fs.readFileSync(sqlPath, 'utf8');

    // Replace the placeholders
    sqlText = sqlText.replace(/\$2b\$12\$examplehashedpassword001/g, hashed);
    sqlText = sqlText.replace(/\$2b\$12\$examplehashedpassword002/g, hashed);
    sqlText = sqlText.replace(/\$2b\$12\$examplehashedpassword003/g, hashed);
    sqlText = sqlText.replace(/\$2b\$12\$examplehashedpassword004/g, hashed);

    console.log('Initializing database tables, triggers, and seed data...');
    
    // Execute the SQL text
    await pool.query(sqlText);
    
    console.log('Database initialized successfully with schema and seed data!');
    console.log('\n--- Seed Accounts (Password: Password123) ---');
    console.log('Super Admin: superadmin@doctorhub.com');
    console.log('Admin:       admin@doctorhub.com');
    console.log('Doctor:      dr.ahmed@doctorhub.com');
    console.log('Patient:     ali.hassan@gmail.com');
    console.log('--------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

initDb();
