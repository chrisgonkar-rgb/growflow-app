// Growflow Admin Routes
// © TrueNorth Group of Companies Ltd.

import { Router } from 'express';
import pool from '../db';
import { authenticateAdmin, authenticateStaff } from '../middleware/auth';

const router = Router();

// Get dashboard metrics
router.get('/metrics', authenticateStaff, async (req, res, next) => {
  try {
    // Total active customers
    const activeCustomersResult = await pool.query(
      "SELECT COUNT(*) FROM customers WHERE status IN ('active_paid', 'active_payment_required')"
    );

    // Pending payments
    const pendingPaymentsResult = await pool.query(
      "SELECT COUNT(*) FROM payments WHERE status = 'pending'"
    );

    // Total paid this month
    const thisMonth = new Date();
    const paidThisMonthResult = await pool.query(
      `SELECT COUNT(*) FROM payments 
       WHERE status = 'approved' 
       AND EXTRACT(MONTH FROM submitted_at) = $1 
       AND EXTRACT(YEAR FROM submitted_at) = $2`,
      [thisMonth.getMonth() + 1, thisMonth.getFullYear()]
    );

    // Revenue (USD)
    const revenueUSDResult = await pool.query(
      `SELECT COALESCE(SUM(paid_amount), 0) as total FROM payments 
       WHERE status = 'approved' AND paid_currency = 'USD'`
    );

    // Revenue (LRD)
    const revenueLRDResult = await pool.query(
      `SELECT COALESCE(SUM(paid_amount), 0) as total FROM payments 
       WHERE status = 'approved' AND paid_currency = 'LRD'`
    );

    res.json({
      success: true,
      data: {
        total_active_customers: parseInt(activeCustomersResult.rows[0].count),
        pending_payments: parseInt(pendingPaymentsResult.rows[0].count),
        total_paid_this_month: parseInt(paidThisMonthResult.rows[0].count),
        revenue_usd: parseFloat(revenueUSDResult.rows[0].total),
        revenue_lrd: parseFloat(revenueLRDResult.rows[0].total),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get monthly revenue report
router.get('/reports/revenue', authenticateStaff, async (req, res, next) => {
  try {
    const { year } = req.query;
    const reportYear = year || new Date().getFullYear();

    const result = await pool.query(
      `SELECT 
        payment_month as month,
        payment_year as year,
        paid_currency as currency,
        COUNT(*) as count,
        SUM(paid_amount) as total
       FROM payments
       WHERE status = 'approved' AND payment_year = $1
       GROUP BY payment_month, payment_year, paid_currency
       ORDER BY payment_month`,
      [reportYear]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
});

// Bulk import customers (admin only)
router.post('/import', authenticateAdmin, async (req, res, next) => {
  try {
    const { customers } = req.body;

    if (!Array.isArray(customers) || customers.length === 0) {
      res.status(400).json({ success: false, error: 'Customers array is required' });
      return;
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (let i = 0; i < customers.length; i++) {
      const customer = customers[i];
      const rowNum = i + 2; // +2 for header row

      try {
        // Validate required fields
        const required = ['full_name', 'phone', 'email', 'city', 'community', 'landmark', 'waste_type', 'frequency'];
        const missing = required.filter(f => !customer[f]);
        if (missing.length > 0) {
          results.failed++;
          results.errors.push(`Row ${rowNum}: Missing fields: ${missing.join(', ')}`);
          continue;
        }

        // Check for duplicates
        const emailCheck = await pool.query('SELECT * FROM customers WHERE email = $1', [customer.email.toLowerCase()]);
        if (emailCheck.rows.length > 0) {
          results.failed++;
          results.errors.push(`Row ${rowNum}: Email ${customer.email} already exists`);
          continue;
        }

        const phoneCheck = await pool.query('SELECT * FROM customers WHERE phone = $1', [customer.phone]);
        if (phoneCheck.rows.length > 0) {
          results.failed++;
          results.errors.push(`Row ${rowNum}: Phone ${customer.phone} already exists`);
          continue;
        }

        // Import customer
        const { hashPassword } = await import('../utils/auth');
        const passwordHash = await hashPassword('changeme123');

        const customerResult = await pool.query(
          `INSERT INTO customers (full_name, phone, email, password_hash, city, community, landmark, waste_type, frequency, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           RETURNING id`,
          [
            customer.full_name,
            customer.phone,
            customer.email.toLowerCase(),
            passwordHash,
            customer.city,
            customer.community,
            customer.landmark,
            customer.waste_type,
            customer.frequency,
            customer.status || 'pending_quote',
          ]
        );

        // Create subscription if amount provided
        if (customer.agreed_amount_usd) {
          await pool.query(
            `INSERT INTO subscriptions (customer_id, agreed_amount_usd, agreed_amount_lrd, start_date, notes)
             VALUES ($1, $2, $3, $4, $5)`,
            [
              customerResult.rows[0].id,
              customer.agreed_amount_usd,
              customer.agreed_amount_lrd,
              customer.start_date || new Date().toISOString().split('T')[0],
              customer.notes,
            ]
          );
        }

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Row ${rowNum}: ${(error as Error).message}`);
      }
    }

    res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
});

// Export customers to CSV (staff only)
router.get('/export/customers', authenticateStaff, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT c.*, s.agreed_amount_usd, s.agreed_amount_lrd, s.start_date
       FROM customers c
       LEFT JOIN subscriptions s ON c.id = s.customer_id
       ORDER BY c.created_at DESC`
    );

    // Remove sensitive fields
    const customers = result.rows.map(c => {
      delete c.password_hash;
      delete c.reset_token;
      delete c.reset_token_expires;
      return c;
    });

    res.json({ success: true, data: customers });
  } catch (error) {
    next(error);
  }
});

// Export payments to CSV (staff only)
router.get('/export/payments', authenticateStaff, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT p.*, c.full_name, c.phone, c.email, u.name as verified_by_name
       FROM payments p
       JOIN customers c ON p.customer_id = c.id
       LEFT JOIN users u ON p.verified_by = u.id
       ORDER BY p.submitted_at DESC`
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
});

// Create staff user (admin only)
router.post('/users', authenticateAdmin, async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      res.status(400).json({ success: false, error: 'All fields are required' });
      return;
    }

    if (!['admin', 'staff'].includes(role)) {
      res.status(400).json({ success: false, error: 'Role must be admin or staff' });
      return;
    }

    // Check if email exists
    const emailCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (emailCheck.rows.length > 0) {
      res.status(409).json({ success: false, error: 'Email already exists' });
      return;
    }

    const { hashPassword } = await import('../utils/auth');
    const passwordHash = await hashPassword(password);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at`,
      [name, email.toLowerCase(), passwordHash, role]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

export default router;
