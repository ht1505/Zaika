const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const { sendOrderNotification } = require('../services/notifyService');
const { query } = require('../db');

// POST /api/notify — manually trigger notification (admin)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { order_id } = req.body;
    if (!order_id) return res.status(400).json({ error: 'order_id required' });

    const orderResult = await query(
      `SELECT o.*, c.name AS customer_name, c.email, c.phone
       FROM orders o JOIN customers c ON c.id = o.customer_id
       WHERE o.id = $1`,
      [order_id]
    );
    if (!orderResult.rows.length) return res.status(404).json({ error: 'Order not found' });

    const order = orderResult.rows[0];
    await sendOrderNotification(order, { email: order.email, phone: order.phone });

    await query('UPDATE orders SET notification_sent = TRUE WHERE id = $1', [order_id]);
    res.json({ success: true, message: 'Notification sent' });
  } catch (err) {
    console.error('Notify error:', err);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

module.exports = router;
