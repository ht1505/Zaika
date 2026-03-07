const { query } = require('../db');

/**
 * Refresh the materialised revenue_signals view and return full insights.
 */
exports.getFullInsights = async () => {
  await query('REFRESH MATERIALIZED VIEW CONCURRENTLY revenue_signals').catch(() =>
    query('REFRESH MATERIALIZED VIEW revenue_signals')
  );

  const [overview, byClass, topItems, lowItems, categoryBreakdown, channelBreakdown, recentOrders] =
    await Promise.all([
      getOverview(),
      getByClass(),
      getTopItems(),
      getLowItems(),
      getCategoryBreakdown(),
      getChannelBreakdown(),
      getRecentOrders(),
    ]);

  return {
    overview,
    bcg_matrix: byClass,
    top_items: topItems,
    low_performers: lowItems,
    category_breakdown: categoryBreakdown,
    channel_breakdown: channelBreakdown,
    recent_orders: recentOrders,
    recommendations: generateRecommendations({ overview, byClass, lowItems }),
    generated_at: new Date().toISOString(),
  };
};

async function getOverview() {
  const result = await query(`
    SELECT
      COUNT(DISTINCT o.id)                          AS total_orders,
      COUNT(DISTINCT o.customer_id)                 AS unique_customers,
      COALESCE(SUM(o.total_price),0)                AS total_revenue,
      COALESCE(AVG(o.total_price),0)                AS avg_order_value,
      COALESCE(SUM(o.total_price) FILTER (WHERE o.created_at >= NOW() - INTERVAL '7 days'), 0) AS revenue_7d,
      COALESCE(SUM(o.total_price) FILTER (WHERE o.created_at >= NOW() - INTERVAL '30 days'),0) AS revenue_30d,
      COUNT(*) FILTER (WHERE o.channel = 'chat')    AS chat_orders,
      COUNT(*) FILTER (WHERE o.channel = 'voice')   AS voice_orders,
      COUNT(*) FILTER (WHERE o.channel = 'cart')    AS cart_orders
    FROM orders o WHERE o.status != 'cancelled'
  `);
  return result.rows[0];
}

async function getByClass() {
  const result = await query(`
    SELECT
      item_class,
      COUNT(*)                      AS item_count,
      AVG(margin)                   AS avg_margin,
      SUM(total_revenue)            AS class_revenue,
      SUM(total_profit)             AS class_profit,
      AVG(popularity_score)         AS avg_popularity
    FROM revenue_signals
    GROUP BY item_class
  `);
  return result.rows;
}

async function getTopItems() {
  const result = await query(`
    SELECT id, name, category, price, margin, item_class, total_orders, total_revenue, total_profit
    FROM revenue_signals
    ORDER BY total_revenue DESC NULLS LAST
    LIMIT 10
  `);
  return result.rows;
}

async function getLowItems() {
  const result = await query(`
    SELECT id, name, category, price, margin, item_class, total_orders, total_revenue, popularity_score
    FROM revenue_signals
    WHERE item_class = 'dog' OR (total_orders IS NULL OR total_orders = 0)
    ORDER BY total_revenue ASC NULLS FIRST
    LIMIT 10
  `);
  return result.rows;
}

async function getCategoryBreakdown() {
  const result = await query(`
    SELECT
      category,
      COUNT(*)                   AS item_count,
      AVG(margin)                AS avg_margin,
      SUM(total_revenue)         AS total_revenue,
      SUM(total_orders)          AS total_orders
    FROM revenue_signals
    GROUP BY category
    ORDER BY total_revenue DESC NULLS LAST
  `);
  return result.rows;
}

async function getChannelBreakdown() {
  const result = await query(`
    SELECT channel, COUNT(*) AS orders, COALESCE(SUM(total_price),0) AS revenue
    FROM orders WHERE status != 'cancelled'
    GROUP BY channel
  `);
  return result.rows;
}

async function getRecentOrders() {
  const result = await query(`
    SELECT o.id, o.total_price, o.channel, o.status, o.created_at,
           c.name AS customer_name
    FROM orders o JOIN customers c ON c.id = o.customer_id
    ORDER BY o.created_at DESC LIMIT 10
  `);
  return result.rows;
}

function generateRecommendations({ overview, byClass, lowItems }) {
  const recs = [];

  // Suggest promoting hidden stars
  const hiddenStars = byClass.find(b => b.item_class === 'hidden_star');
  if (hiddenStars && hiddenStars.item_count > 0) {
    recs.push({
      type: 'promotion',
      priority: 'high',
      title: 'Promote Hidden Star Items',
      description: `You have ${hiddenStars.item_count} high-margin items with low visibility. Feature them in "Today's Special" section or offer a limited-time discount to boost their popularity.`,
      impact: 'Revenue boost: ₹2,000–5,000/week estimated',
    });
  }

  // Dog items: consider removing or repricing
  if (lowItems.length > 0) {
    recs.push({
      type: 'menu_cleanup',
      priority: 'medium',
      title: 'Review Low-Performing Items',
      description: `${lowItems.length} items have low margin AND low orders. Consider removing or redesigning these dishes to reduce kitchen complexity.`,
      items: lowItems.map(i => i.name),
      impact: 'Operational efficiency improvement',
    });
  }

  // AOV opportunity
  if (overview.avg_order_value < 400) {
    recs.push({
      type: 'upsell',
      priority: 'high',
      title: 'Increase Average Order Value',
      description: 'Current AOV is below ₹400. Enable combo suggestions in the chat flow and display "Frequently ordered together" pairings.',
      impact: `+15–20% AOV = +₹${Math.round(overview.avg_order_value * 0.175)}/order`,
    });
  }

  // Chat/Voice channel adoption
  const chatPct = overview.total_orders > 0
    ? (Number(overview.chat_orders) / Number(overview.total_orders)) * 100 : 0;
  if (chatPct < 30) {
    recs.push({
      type: 'channel',
      priority: 'low',
      title: 'Drive Chat-Based Ordering',
      description: 'Only ' + Math.round(chatPct) + '% of orders come through the AI chat. AI-guided orders show higher AOV. Add a prominent "Chat to Order" CTA on the homepage.',
      impact: 'Higher AOV + better customer satisfaction',
    });
  }

  return recs;
}
