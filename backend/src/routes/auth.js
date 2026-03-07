const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimit');
const { authenticate } = require('../middleware/auth');
const authController = require('../controllers/authController');

// POST /api/auth/register
router.post('/register',
  authLimiter,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
    body('phone').optional().isMobilePhone(),
  ],
  validate,
  authController.register
);

// POST /api/auth/login
router.post('/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validate,
  authController.login
);

// GET /api/auth/me
router.get('/me', authenticate, authController.me);

module.exports = router;
