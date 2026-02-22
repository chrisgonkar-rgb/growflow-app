// Growflow Database Migrations
// © TrueNorth Group of Companies Ltd.

import pool from './index';

const migrations = [
  // Migration 1: Create users table
  `
  CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'staff', 'collector')),
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  `,

  // Migration 2: Create customers table
  `
  CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    community VARCHAR(255) NOT NULL,
    landmark TEXT NOT NULL,
    waste_type VARCHAR(50) NOT NULL,
    frequency VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending_quote',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP
  );
  `,

  // Migration 3: Create subscriptions table
  `
  CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    agreed_amount_usd DECIMAL(10,2) NOT NULL,
    agreed_amount_lrd DECIMAL(10,2),
    start_date DATE NOT NULL,
    set_by UUID REFERENCES users(id),
    set_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
  );
  `,

  // Migration 4: Create payments table
  `
  CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id),
    payment_month INTEGER NOT NULL CHECK (payment_month BETWEEN 1 AND 12),
    payment_year INTEGER NOT NULL,
    paid_currency VARCHAR(3) NOT NULL CHECK (paid_currency IN ('USD', 'LRD')),
    paid_amount DECIMAL(10,2) NOT NULL,
    method VARCHAR(50) NOT NULL,
    reference VARCHAR(255),
    proof_url TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP,
    verified_by UUID REFERENCES users(id),
    rejection_reason TEXT,
    UNIQUE(customer_id, payment_month, payment_year, status)
  );
  `,

  // Migration 5: Create indexes
  `
  CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
  CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
  CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
  CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);
  CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
  CREATE INDEX IF NOT EXISTS idx_payments_month ON payments(payment_month, payment_year);
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `,
];

async function migrate() {
  console.log('🔄 Running database migrations...\n');

  try {
    for (let i = 0; i < migrations.length; i++) {
      const migration = migrations[i];
      console.log(`Migration ${i + 1}/${migrations.length}...`);
      await pool.query(migration);
      console.log(`✅ Migration ${i + 1} completed\n`);
    }

    console.log('✅ All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
