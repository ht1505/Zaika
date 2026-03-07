const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const revenueController = require('../controllers/revenueController');

// All revenue routes are admin-only
router.use(authenticate, requireAdmin);

router.get('/insights',         revenueController.getInsights);
router.get('/recommendations',  revenueController.getRecommendations);
router.get('/combos',           revenueController.getComboSuggestions);

module.exports = router;
