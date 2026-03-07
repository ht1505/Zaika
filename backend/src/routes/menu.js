const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const { body, query: qv } = require('express-validator');
const { validate } = require('../middleware/validate');
const menuController = require('../controllers/menuController');

// GET /api/menu — public or authenticated
router.get('/', authenticate, menuController.getMenu);

// GET /api/menu/combos
router.get('/combos', authenticate, menuController.getCombos);

// GET /api/menu/:id
router.get('/:id', authenticate, menuController.getMenuItem);

// POST /api/menu — admin only
router.post('/',
  authenticate, requireAdmin,
  [
    body('name').trim().notEmpty(),
    body('category').notEmpty(),
    body('price').isFloat({ min: 0 }),
    body('cost').isFloat({ min: 0 }),
  ],
  validate,
  menuController.createMenuItem
);

// PUT /api/menu/:id — admin only
router.put('/:id', authenticate, requireAdmin, menuController.updateMenuItem);

// PATCH /api/menu/:id/availability — admin only
router.patch('/:id/availability', authenticate, requireAdmin, menuController.toggleAvailability);

module.exports = router;
