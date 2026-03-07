const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { voiceLimiter } = require('../middleware/rateLimit');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const voiceController = require('../controllers/voiceController');

// POST /api/voice/order — parse transcript to order
router.post('/order',
  authenticate,
  voiceLimiter,
  [
    body('transcript').notEmpty().withMessage('Transcript required'),
    body('language').optional().isIn(['hinglish','hindi','gujarati','english']),
  ],
  validate,
  voiceController.processVoiceOrder
);

// POST /api/voice/confirm — confirm and place voice-parsed order
router.post('/confirm', authenticate, voiceController.confirmVoiceOrder);

module.exports = router;
