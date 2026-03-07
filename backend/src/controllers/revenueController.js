const revenueService = require('../services/revenueService');

exports.getInsights = async (req, res) => {
  try {
    const insights = await revenueService.getFullInsights();
    res.json(insights);
  } catch (err) {
    console.error('Revenue insights error:', err);
    res.status(500).json({ error: 'Failed to fetch revenue insights' });
  }
};

exports.getRecommendations = async (req, res) => {
  try {
    const insights = await revenueService.getFullInsights();
    res.json(insights.recommendations);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
};

exports.getComboSuggestions = async (req, res) => {
  try {
    const { query } = require('../db');
    const result = await query(
      `SELECT c.*, 
              (SELECT jsonb_agg(jsonb_build_object('id',mi.id,'name',mi.name,'price',mi.price,'image_url',mi.image_url))
               FROM menu_items mi WHERE mi.id = ANY(c.item_ids)) AS items_detail
       FROM combos c WHERE c.is_active = TRUE`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch combos' });
  }
};
