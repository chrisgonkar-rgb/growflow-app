// Growflow Authentication Routes
// © TrueNorth Group of Companies Ltd.

import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../db';
import { hashPassword, verifyPassword, generateToken, generateOTP, getResetTokenExpiry } from '../utils/auth';
import { authenticate, authenticateStaff, authenticateCustomer } from '../middleware/auth';

const router = Router();

// Customer Signup
router.post('/customer/signup', async (req, res, next) => {
  try {
    const { full_name, phone, email, password, city, community, landmark, waste_type, frequency } = req.body;

    // Validate required fields
    if (!full_name || !phone || !email || !password || !city || !community || !landmark || !waste_type || !frequency) {
      res.status(400).json({ success: false, error: 'All fields are required' });
      return;
    }

    // Check if email exists
    const emailCheck = await pool.query('SELECT * FROM customers WHERE email = $1', [email.toLowerCase()]);
    if (emailCheck.rows.length > 0) {
      res.status(409).json({ success: false, error: 'Email already registered' });
      return;
    }

    // Check if phone exists
    const phoneCheck = await pool.query('SELECT * FROM customers WHERE phone = $1', [phone]);
    if (phoneCheck.rows.length > 0) {
      res.status(409).json({ success: false, error: 'Phone number already registered' });
      return;
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create customer
    const result = await pool.query(
      `INSERT INTO customers (full_name, phone, email, password_hash, city, community, landmark, waste_type, frequency, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, full_name, phone, email, city, community, landmark, waste_type, frequency, status, created_at`,
      [full_name, phone, email.toLowerCase(), passwordHash, city, community, landmark, waste_type, frequency, 'pending_quote']
    );

    const customer = result.rows[0];

    // Generate token
    const token = generateToken({
      userId: customer.id,
      email: customer.email,
      role: 'collector', // Default role for customers
      type: 'customer',
    });

    res.status(201).json({
      success: true,
      data: {
        customer,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Customer Login
router.post('/customer/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password are required' });
      return;
    }

    // Find customer
    const result = await pool.query('SELECT * FROM customers WHERE email = $1', [email.toLowerCase()]);
    if (result.rows.length === 0) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    const customer = result.rows[0];

    // Verify password
    const isValid = await verifyPassword(password, customer.password_hash);
    if (!isValid) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    // Generate token
    const token = generateToken({
      userId: customer.id,
      email: customer.email,
      role: 'collector',
      type: 'customer',
    });

    // Remove password_hash from response
    delete customer.password_hash;
    delete customer.reset_token;
    delete customer.reset_token_expires;

    res.json({
      success: true,
      data: {
        customer,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Staff Login
router.post('/staff/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password are required' });
      return;
    }

    // Find user
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (result.rows.length === 0) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    const user = result.rows[0];

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      type: 'staff',
    });

    // Remove password_hash from response
    delete user.password_hash;

    res.json({
      success: true,
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Request Password Reset (Customer)
router.post('/customer/reset-password-request', async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ success: false, error: 'Email is required' });
      return;
    }

    // Find customer
    const result = await pool.query('SELECT * FROM customers WHERE email = $1', [email.toLowerCase()]);
    
    // Always return success to prevent email enumeration
    if (result.rows.length === 0) {
      res.json({
        success: true,
        message: 'If an account exists with this email, you will receive reset instructions.',
      });
      return;
    }

    const customer = result.rows[0];

    // Generate OTP
    const otp = generateOTP();
    const expiry = getResetTokenExpiry();

    // Save reset token
    await pool.query(
      'UPDATE customers SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [otp, expiry, customer.id]
    );

    // TODO: Send email with OTP
    console.log(`Password reset OTP for ${email}: ${otp}`);

    res.json({
      success: true,
      message: 'If an account exists with this email, you will receive reset instructions.',
    });
  } catch (error) {
    next(error);
  }
});

// Reset Password (Customer)
router.post('/customer/reset-password', async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({ success: false, error: 'Token and new password are required' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
      return;
    }

    // Find customer with valid token
    const result = await pool.query(
      'SELECT * FROM customers WHERE reset_token = $1 AND reset_token_expires > NOW()',
      [token]
    );

    if (result.rows.length === 0) {
      res.status(400).json({ success: false, error: 'Invalid or expired reset code' });
      return;
    }

    const customer = result.rows[0];

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password and clear reset token
    await pool.query(
      'UPDATE customers SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
      [passwordHash, customer.id]
    );

    res.json({
      success: true,
      message: 'Password reset successful. Please log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
});

// Get current user (for both customer and staff)
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const { userId, type } = req.user!;

    let result;
    if (type === 'customer') {
      result = await pool.query(
        'SELECT id, full_name, phone, email, city, community, landmark, waste_type, frequency, status, created_at FROM customers WHERE id = $1',
        [userId]
      );
    } else {
      result = await pool.query(
        'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
        [userId]
      );
    }

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

export default router;
