import express from 'express';

import {
  createManualOrder,
  getOrderById,
  getOrderStats,
  listOrders,
  trackOrder,
  updateOrderStatus
} from '../controllers/orderController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/track/:orderId', trackOrder);

router.use(requireAuth);

router.get('/', listOrders);
router.post('/', createManualOrder);
router.get('/stats/summary', getOrderStats);
router.get('/:id', getOrderById);
router.patch('/:id/status', updateOrderStatus);

export default router;
