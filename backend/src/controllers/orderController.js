const { query, getClient } = require('../db');
const { chatWithMenu } = require('../services/claudeService');
const { sendOrderNotification } = require('../services/notifyService');
const { getRecommendations } = require('../services/recommendationService');

exports.placeOrder = async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const {
      items, channel = 'cart', special_notes = '',
      language_used = 'english', delivery_phone, delivery_email
    } = req.body;

    // Validate items and compute totals
    let subtotal = 0;
    const enrichedItems = [];

    for (const item of items) {
      const menuItem = await client.query(
        'SELECT id, name, price, is_available FROM menu_items WHERE id = $1',
        [item.item_id]
      );
      if (!menuItem.rows.length) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Item ${item.item_id} not found` });
      }
      const mi = menuItem.rows[0];
      if (!mi.is_available) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `${mi.name} is currently unavailable` });
      }
      const lineTotal = mi.price * item.qty;
      subtotal += lineTotal;
      enrichedItems.push({
        item_id: mi.id, name: mi.name,
        qty: item.qty, price: mi.price,
        modifiers: item.modifiers || [],
      });
    }

    const tax = Math.round(subtotal * 0.05);
    const total_price = subtotal + tax;

    // Create order
    const orderResult = await client.query(
      `INSERT INTO orders (customer_id, items, subtotal, tax, total_price, channel, status, language_used, special_notes, delivery_phone, delivery_email)
       VALUES ($1,$2,$3,$4,$5,$6,'confirmed',$7,$8,$9,$10)
       RETURNING *`,
      [req.user.id, JSON.stringify(enrichedItems), subtotal, tax, total_price,
       channel, language_used, special_notes,
       delivery_phone || req.user.phone || null,
       delivery_email || req.user.email || null]
    );
    const order = orderResult.rows[0];

    // Insert order_items for analytics
    for (const item of enrichedItems) {
      await client.query(
        `INSERT INTO order_items (order_id, item_id, item_name, quantity, unit_price, modifiers)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [order.id, item.item_id, item.name, item.qty, item.price, JSON.stringify(item.modifiers)]
      );
    }

    await client.query('COMMIT');

    // Fire notification async (non-blocking)
    sendOrderNotification(order, req.user).catch(console.error);

    // Get recommendations for response
    const recommendations = await getRecommendations(req.user.id, enrichedItems.map(i => i.item_id));

    res.status(201).json({ order, recommendations });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('placeOrder error:', err);
    res.status(500).json({ error: 'Failed to place order' });
  } finally {
    client.release();
  }
};

exports.chatOrder = async (req, res) => {
  try {
    const { message, conversation_history = [], language = 'hinglish' } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });

    // Fetch menu for context
    const menuResult = await query(
      `SELECT id, name, description, category, price, item_class, tags, modifiers
       FROM menu_items WHERE is_available = TRUE ORDER BY popularity_score DESC`
    );

    const response = await chatWithMenu({
      message,
      conversation_history,
      menu: menuResult.rows,
      language,
      user: req.user,
    });

    res.json(response);
  } catch (err) {
    console.error('chatOrder error:', err);
    res.status(500).json({
      error: 'Chat service unavailable',
      fallback: true,
      message: 'Please use the menu to add items directly.',
    });
  }
};

exports.myOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT o.*, 
              (SELECT COUNT(*) FROM orders WHERE customer_id = $1) AS total_count
       FROM orders o
       WHERE o.customer_id = $1
       ORDER BY o.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );
    res.json({
      orders: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: result.rows[0]?.total_count || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

exports.allOrders = async (req, res) => {
  try {
    const { status, channel, page = 1, limit = 20 } = req.query;
    const params = [];
    let where = 'WHERE 1=1';

    if (status) { params.push(status); where += ` AND o.status = $${params.length}`; }
    if (channel) { params.push(channel); where += ` AND o.channel = $${params.length}`; }

    params.push(limit, (page - 1) * limit);
    const result = await query(
      `SELECT o.*, c.name AS customer_name, c.email AS customer_email
       FROM orders o
       JOIN customers c ON c.id = o.customer_id
       ${where}
       ORDER BY o.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch all orders' });
  }
};

exports.getOrder = async (req, res) => {
  try {
    const result = await query(
      `SELECT o.*, c.name AS customer_name FROM orders o
       JOIN customers c ON c.id = o.customer_id
       WHERE o.id = $1`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Order not found' });
    const order = result.rows[0];
    // Customers can only see their own orders
    if (req.user.role !== 'admin' && order.customer_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const result = await query(
      `UPDATE orders SET status = $1 WHERE id = $2 RETURNING *`,
      [req.body.status, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Order not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
};
