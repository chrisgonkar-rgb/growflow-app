-- Growflow Database Seed Data
-- © TrueNorth Group of Companies Ltd.
-- Run this after schema.sql to populate initial data

-- ============================================
-- Create Admin User
-- IMPORTANT: Change the default password after first login!
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@greenflow.com') THEN
        INSERT INTO users (name, email, role, password_hash)
        VALUES (
            'System Administrator',
            'admin@greenflow.com',
            'admin',
            -- Password: changeme123 (bcrypt hash)
            '$2a$10$YourHashedPasswordHereChangeThisInProduction'
        );
        
        RAISE NOTICE 'Admin user created. Email: admin@greenflow.com';
        RAISE NOTICE 'IMPORTANT: Change the default password immediately after first login!';
    ELSE
        RAISE NOTICE 'Admin user already exists';
    END IF;
END $$;

-- ============================================
-- Sample Cities (for reference)
-- ============================================
-- These are the cities used in the application:
-- Paynesville, Gardnersville, Congo Town, Old Road, Sinkor, 
-- Monrovia, Johnsonville, Brewerville, RIA Highway

-- ============================================
-- Sample Waste Types (for reference)
-- ============================================
-- household, mixed, business, construction

-- ============================================
-- Sample Frequencies (for reference)
-- ============================================
-- weekly, twice_weekly, special
