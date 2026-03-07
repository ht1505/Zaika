const { query } = require('../db');
const { parseVoiceOrder } = require('../services/claudeService');

exports.processVoiceOrder = async (req, res) => {
  try {
    const { transcript, language = 'hinglish' } = req.body;

    const menuResult = await query(
      'SELECT id, name, price, category FROM menu_items WHERE is_available = TRUE ORDER BY popularity_score DESC'
    );

    const parsed = await parseVoiceOrder({
      transcript,
      menu: menuResult.rows,
      language,
    });

    res.json({
      transcript,
      ...parsed,
      status: parsed.clarification_needed ? 'clarification_needed' : 'ready_to_confirm',
    });
  } catch (err) {
    console.error('Voice order error:', err);
    res.status(500).json({ error: 'Voice processing failed', fallback: true });
  }
};

exports.confirmVoiceOrder = async (req, res) => {
  // Delegate to the standard order placement
  req.body.channel = 'voice';
  const orderController = require('./orderController');
  return orderController.placeOrder(req, res);
};
