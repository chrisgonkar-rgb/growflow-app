// Growflow Database Seeding
// © TrueNorth Group of Companies Ltd.

import pool from './index';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('🌱 Seeding database...\n');

  try {
    // Check if admin user exists
    const adminCheck = await pool.query('SELECT * FROM users WHERE email = $1', ['admin@greenflow.com']);
    
    if (adminCheck.rows.length === 0) {
      console.log('Creating default admin user...');
      
      // Get admin password from environment or use a secure default
      const adminPassword = process.env.ADMIN_PASSWORD || 'changeme123';
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      
      await pool.query(
        `INSERT INTO users (name, email, role, password_hash) 
         VALUES ($1, $2, $3, $4)`,
        ['System Administrator', 'admin@greenflow.com', 'admin', passwordHash]
      );
      
      console.log('✅ Admin user created');
      console.log('   Email: admin@greenflow.com');
      console.log('   Password: (set in ADMIN_PASSWORD env variable)');
      console.log('   ⚠️  IMPORTANT: Change the default password after first login!\n');
    } else {
      console.log('ℹ️  Admin user already exists\n');
    }

    console.log('✅ Seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
