// Growflow Payment Routes
// © TrueNorth Group of Companies Ltd.

import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../db';
import { authenticateCustomer, authenticateStaff } from '../middleware/auth';

const router = Router();

// Create payment (customer)
router.post('/', authenticateCustomer, async (req, res, next) => {
  try {
    const { userId } = req.user!;
    const { payment_month, payment_year, method, currency, amount, reference, proof_url } = req.body;

    // Validate required fields
    if (!payment_month || !payment_year || !method || !currency || !amount) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }

    // Get customer subscription
    const subResult = await pool.query('SELECT * FROM subscriptions WHERE customer_id = $1', [userId]);
    if (subResult.rows.length === 0) {
      res.status(400).json({ success: false, error: 'No active subscription found' });
      return;
    }

    const subscription = subResult.rows[0];

    // Validate amount matches agreed amount
    const paidAmount = parseFloat(amount);
    if (currency === 'USD' && paidAmount !== parseFloat(subscription.agreed_amount_usd)) {
      res.status(400).json({ 
        success: false, 
        error: `Amount must match your agreed monthly fee: $${subscription.agreed_amount_usd}` 
      });
      return;
    }

    if (currency === 'LRD' && subscription.agreed_amount_lrd && 
        paidAmount !== parseFloat(subscription.agreed_amount_lrd)) {
      res.status(400).json({ 
        success: false, 
        error: `Amount must match your agreed monthly fee: LRD ${subscription.agreed_amount_lrd}` 
      });
      return;
    }

    // Check if there's already an approved payment for this month
    const existingApproved = await pool.query(
      'SELECT * FROM payments WHERE customer_id = $1 AND payment_month = $2 AND payment_year = $3 AND status = $4',
      [userId, payment_month, payment_year, 'approved']
    );

    if (existingApproved.rows.length > 0) {
      res.status(409).json({ success: false, error: 'Payment for this month has already been approved' });
      return;
    }

    // Check if there's a pending payment for this month
    const existingPending = await pool.query(
      'SELECT * FROM payments WHERE customer_id = $1 AND payment_month = $2 AND payment_year = $3 AND status = $4',
      [userId, payment_month, payment_year, 'pending']
    );

    if (existingPending.rows.length > 0) {
      res.status(409).json({ success: false, error: 'You already have a pending payment for this month' });
      return;
    }

    // Create payment
    const result = await pool.query(
      `INSERT INTO payments (customer_id, subscription_id, payment_month, payment_year, paid_currency, paid_amount, method, reference, proof_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [userId, subscription.id, payment_month, payment_year, currency, paidAmount, method, reference, proof_url, 'pending']
    );

    // Update customer status
    await pool.query(
      "UPDATE customers SET status = 'payment_pending_verification' WHERE id = $1",
      [userId]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Get pending payments (staff only)
router.get('/pending', authenticateStaff, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT p.*, c.full_name, c.phone, c.email, s.agreed_amount_usd, s.agreed_amount_lrd
       FROM payments p
       JOIN customers c ON p.customer_id = c.id
       JOIN subscriptions s ON p.subscription_id = s.id
       WHERE p.status = 'pending'
       ORDER BY p.submitted_at ASC`
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
});

// Verify payment (staff only)
router.put('/:id/verify', authenticateStaff, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, rejection_reason } = req.body;
    const { userId } = req.user!;

    if (!status || !['approved', 'rejected'].includes(status)) {
      res.status(400).json({ success: false, error: 'Status must be approved or rejected' });
      return;
    }

    if (status === 'rejected' && !rejection_reason) {
      res.status(400).json({ success: false, error: 'Rejection reason is required' });
      return;
    }

    // Get payment
    const paymentResult = await pool.query('SELECT * FROM payments WHERE id = $1', [id]);
    if (paymentResult.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Payment not found' });
      return;
    }

    const payment = paymentResult.rows[0];

    // Update payment
    const result = await pool.query(
      `UPDATE payments 
       SET status = $1, verified_by = $2, verified_at = NOW(), rejection_reason = $3
       WHERE id = $4
       RETURNING *`,
      [status, userId, rejection_reason || null, id]
    );

    // Update customer status based on payment status
    if (status === 'approved') {
      await pool.query(
        "UPDATE customers SET status = 'active_paid' WHERE id = $1",
        [payment.customer_id]
      );
    } else {
      // If rejected, set back to active_payment_required
      await pool.query(
        "UPDATE customers SET status = 'active_payment_required' WHERE id = $1",
        [payment.customer_id]
      );
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Get payment history for a customer (staff only)
router.get('/customer/:customerId', authenticateStaff, async (req, res, next) => {
  try {
    const { customerId } = req.params;

    const result = await pool.query(
      `SELECT p.*, u.name as verified_by_name
       FROM payments p
       LEFT JOIN users u ON p.verified_by = u.id
       WHERE p.customer_id = $1
       ORDER BY p.payment_year DESC, p.payment_month DESC`,
      [customerId]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
});

export default router;
