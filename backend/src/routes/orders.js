const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const orderController = require('../controllers/orderController');

// POST /api/orders — place order (cart or chat)
router.post('/',
  authenticate,
  [
    body('items').isArray({ min: 1 }).withMessage('Items array required'),
    body('items.*.item_id').notEmpty(),
    body('items.*.qty').isInt({ min: 1 }),
    body('channel').optional().isIn(['cart', 'chat', 'voice']),
  ],
  validate,
  orderController.placeOrder
);

// POST /api/orders/chat — AI chat ordering
router.post('/chat', authenticate, orderController.chatOrder);

// GET /api/orders — customer's own orders
router.get('/', authenticate, orderController.myOrders);

// GET /api/orders/all — admin: all orders
router.get('/all', authenticate, requireAdmin, orderController.allOrders);

// GET /api/orders/:id
router.get('/:id', authenticate, orderController.getOrder);

// PATCH /api/orders/:id/status — admin update status
router.patch('/:id/status',
  authenticate, requireAdmin,
  [body('status').isIn(['pending','confirmed','preparing','ready','delivered','cancelled'])],
  validate,
  orderController.updateStatus
);

module.exports = router;
