-- Growflow Database Schema
-- © TrueNorth Group of Companies Ltd.
-- Run this SQL to create all database tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Users Table (Admin/Staff)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'staff', 'collector')),
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Customers Table
-- ============================================
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- ============================================
-- Subscriptions Table
-- ============================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    agreed_amount_usd DECIMAL(10,2) NOT NULL,
    agreed_amount_lrd DECIMAL(10,2),
    start_date DATE NOT NULL,
    set_by UUID REFERENCES users(id),
    set_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- ============================================
-- Payments Table
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- ============================================
-- Indexes for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_month ON payments(payment_month, payment_year);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================
-- Comments
-- ============================================
COMMENT ON TABLE users IS 'Admin and staff user accounts';
COMMENT ON TABLE customers IS 'Customer accounts with authentication';
COMMENT ON TABLE subscriptions IS 'Monthly pricing agreements for customers';
COMMENT ON TABLE payments IS 'Monthly payment records with verification';
