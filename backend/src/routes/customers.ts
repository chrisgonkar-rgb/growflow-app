// Growflow Customer Routes
// © TrueNorth Group of Companies Ltd.

import { Router } from 'express';
import pool from '../db';
import { authenticateCustomer, authenticateStaff } from '../middleware/auth';

const router = Router();

// Get customer profile (own profile)
router.get('/me', authenticateCustomer, async (req, res, next) => {
  try {
    const { userId } = req.user!;

    const result = await pool.query(
      `SELECT id, full_name, phone, email, city, community, landmark, waste_type, frequency, status, created_at 
       FROM customers WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Customer not found' });
      return;
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Get customer subscription
router.get('/me/subscription', authenticateCustomer, async (req, res, next) => {
  try {
    const { userId } = req.user!;

    const result = await pool.query(
      `SELECT s.*, u.name as set_by_name
       FROM subscriptions s
       LEFT JOIN users u ON s.set_by = u.id
       WHERE s.customer_id = $1`,
      [userId]
    );

    res.json({ success: true, data: result.rows[0] || null });
  } catch (error) {
    next(error);
  }
});

// Get customer payments
router.get('/me/payments', authenticateCustomer, async (req, res, next) => {
  try {
    const { userId } = req.user!;

    const result = await pool.query(
      `SELECT p.*, u.name as verified_by_name
       FROM payments p
       LEFT JOIN users u ON p.verified_by = u.id
       WHERE p.customer_id = $1
       ORDER BY p.payment_year DESC, p.payment_month DESC`,
      [userId]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
});

// Get all customers (staff only)
router.get('/', authenticateStaff, async (req, res, next) => {
  try {
    const { search, status, city } = req.query;

    let query = `
      SELECT c.id, c.full_name, c.phone, c.email, c.city, c.community, c.landmark, 
             c.waste_type, c.frequency, c.status, c.created_at,
             s.agreed_amount_usd, s.agreed_amount_lrd, s.start_date
      FROM customers c
      LEFT JOIN subscriptions s ON c.id = s.customer_id
      WHERE 1=1
    `;
    const params: unknown[] = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (
        c.full_name ILIKE $${paramIndex} OR 
        c.phone ILIKE $${paramIndex} OR 
        c.email ILIKE $${paramIndex} OR 
        c.city ILIKE $${paramIndex} OR 
        c.community ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (status) {
      query += ` AND c.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (city) {
      query += ` AND c.city = $${paramIndex}`;
      params.push(city);
      paramIndex++;
    }

    query += ` ORDER BY c.created_at DESC`;

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
});

// Get single customer (staff only)
router.get('/:id', authenticateStaff, async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT c.*, s.agreed_amount_usd, s.agreed_amount_lrd, s.start_date, s.notes as subscription_notes
       FROM customers c
       LEFT JOIN subscriptions s ON c.id = s.customer_id
       WHERE c.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Customer not found' });
      return;
    }

    // Remove sensitive fields
    const customer = result.rows[0];
    delete customer.password_hash;
    delete customer.reset_token;
    delete customer.reset_token_expires;

    res.json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
});

// Update customer (staff only)
router.put('/:id', authenticateStaff, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { full_name, phone, city, community, landmark, waste_type, frequency, status } = req.body;

    const result = await pool.query(
      `UPDATE customers 
       SET full_name = COALESCE($1, full_name),
           phone = COALESCE($2, phone),
           city = COALESCE($3, city),
           community = COALESCE($4, community),
           landmark = COALESCE($5, landmark),
           waste_type = COALESCE($6, waste_type),
           frequency = COALESCE($7, frequency),
           status = COALESCE($8, status)
       WHERE id = $9
       RETURNING id, full_name, phone, email, city, community, landmark, waste_type, frequency, status, created_at`,
      [full_name, phone, city, community, landmark, waste_type, frequency, status, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Customer not found' });
      return;
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Set customer subscription/quote (admin only)
router.post('/:id/subscription', authenticateStaff, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { agreed_amount_usd, agreed_amount_lrd, start_date, notes } = req.body;
    const { userId } = req.user!;

    if (!agreed_amount_usd || !start_date) {
      res.status(400).json({ success: false, error: 'USD amount and start date are required' });
      return;
    }

    // Check if customer exists
    const customerCheck = await pool.query('SELECT * FROM customers WHERE id = $1', [id]);
    if (customerCheck.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Customer not found' });
      return;
    }

    // Check if subscription already exists
    const subCheck = await pool.query('SELECT * FROM subscriptions WHERE customer_id = $1', [id]);
    
    let result;
    if (subCheck.rows.length > 0) {
      // Update existing subscription
      result = await pool.query(
        `UPDATE subscriptions 
         SET agreed_amount_usd = $1, agreed_amount_lrd = $2, start_date = $3, notes = $4, set_by = $5, set_at = NOW()
         WHERE customer_id = $6
         RETURNING *`,
        [agreed_amount_usd, agreed_amount_lrd, start_date, notes, userId, id]
      );
    } else {
      // Create new subscription
      result = await pool.query(
        `INSERT INTO subscriptions (customer_id, agreed_amount_usd, agreed_amount_lrd, start_date, notes, set_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [id, agreed_amount_usd, agreed_amount_lrd, start_date, notes, userId]
      );

      // Update customer status
      await pool.query(
        "UPDATE customers SET status = 'active_payment_required' WHERE id = $1",
        [id]
      );
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

export default router;
