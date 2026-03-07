const { query } = require('../db');

/**
 * Get personalised item recommendations for a customer.
 * Strategy: 
 *   1. Items frequently bought WITH items just added (association)
 *   2. Customer's past favourite categories 
 *   3. Fallback: top Star-class items not yet in cart
 */
exports.getRecommendations = async (customerId, currentItemIds = []) => {
  try {
    // 1. Association-based: items from same orders as current items
    let associated = [];
    if (currentItemIds.length > 0) {
      const assocResult = await query(`
        SELECT oi2.item_id, mi.name, mi.price, mi.image_url, mi.item_class,
               COUNT(*) AS co_occurrence
        FROM order_items oi1
        JOIN order_items oi2 ON oi2.order_id = oi1.order_id AND oi2.item_id != oi1.item_id
        JOIN menu_items mi ON mi.id = oi2.item_id
        WHERE oi1.item_id = ANY($1::uuid[])
          AND oi2.item_id != ALL($1::uuid[])
          AND mi.is_available = TRUE
        GROUP BY oi2.item_id, mi.name, mi.price, mi.image_url, mi.item_class
        ORDER BY co_occurrence DESC
        LIMIT 4
      `, [currentItemIds]);
      associated = assocResult.rows;
    }

    // 2. Customer history-based
    const historyResult = await query(`
      SELECT mi.id AS item_id, mi.name, mi.price, mi.image_url, mi.item_class,
             COUNT(*) AS order_count
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      JOIN menu_items mi ON mi.id = oi.item_id
      WHERE o.customer_id = $1
        AND mi.is_available = TRUE
        AND mi.id != ALL($2::uuid[])
      GROUP BY mi.id, mi.name, mi.price, mi.image_url, mi.item_class
      ORDER BY order_count DESC
      LIMIT 4
    `, [customerId, currentItemIds.length > 0 ? currentItemIds : [null]]);

    // 3. Fallback: popular star items
    const fallbackResult = await query(`
      SELECT id AS item_id, name, price, image_url, item_class
      FROM menu_items
      WHERE is_available = TRUE
        AND item_class IN ('star','hidden_star')
        AND id != ALL($1::uuid[])
      ORDER BY popularity_score DESC
      LIMIT 4
    `, [currentItemIds.length > 0 ? currentItemIds : [null]]);

    // Merge and deduplicate
    const seen = new Set();
    const merged = [...associated, ...historyResult.rows, ...fallbackResult.rows]
      .filter(item => {
        if (seen.has(item.item_id)) return false;
        seen.add(item.item_id);
        return true;
      })
      .slice(0, 5);

    return merged;
  } catch (err) {
    console.error('getRecommendations error:', err);
    return [];
  }
};

/**
 * Get combo suggestions based on cart contents.
 */
exports.getComboSuggestions = async (cartItemIds = []) => {
  try {
    const result = await query(`
      SELECT c.id, c.name, c.description, c.combo_price, c.item_ids,
             (SELECT jsonb_agg(jsonb_build_object('id',mi.id,'name',mi.name,'price',mi.price))
              FROM menu_items mi WHERE mi.id = ANY(c.item_ids)) AS items_detail
      FROM combos c
      WHERE c.is_active = TRUE
      LIMIT 3
    `);
    return result.rows;
  } catch (err) {
    console.error('getComboSuggestions error:', err);
    return [];
  }
};
