const { query } = require('../db');

exports.getMenu = async (req, res) => {
  try {
    const { category, item_class, search, veg_only } = req.query;
    const params = [];
    let whereClause = 'WHERE mi.is_available = TRUE';

    if (category) {
      params.push(category);
      whereClause += ` AND mi.category = $${params.length}`;
    }
    if (item_class) {
      params.push(item_class);
      whereClause += ` AND mi.item_class = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND (mi.name ILIKE $${params.length} OR mi.description ILIKE $${params.length})`;
    }
    if (veg_only === 'true') {
      whereClause += ` AND 'veg' = ANY(mi.tags)`;
    }

    const result = await query(
      `SELECT id, name, description, category, cuisine, price, margin, item_class,
              popularity_score, rating, modifiers, tags, image_url
       FROM menu_items mi
       ${whereClause}
       ORDER BY popularity_score DESC, name ASC`,
      params
    );

    // Group by category
    const grouped = result.rows.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {});

    res.json({ items: result.rows, grouped, total: result.rows.length });
  } catch (err) {
    console.error('getMenu error:', err);
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
};

exports.getMenuItem = async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM menu_items WHERE id = $1`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Item not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch item' });
  }
};

exports.getCombos = async (req, res) => {
  try {
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

exports.createMenuItem = async (req, res) => {
  try {
    const {
      name, description = '', category, cuisine = '', price, cost,
      popularity_score = 0, rating = 0, modifiers = [], tags = [], image_url = ''
    } = req.body;

    const result = await query(
      `INSERT INTO menu_items (name,description,category,cuisine,price,cost,popularity_score,rating,modifiers,tags,image_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [name, description, category, cuisine, price, cost, popularity_score, rating,
       JSON.stringify(modifiers), tags, image_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('createMenuItem error:', err);
    res.status(500).json({ error: 'Failed to create menu item' });
  }
};

exports.updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    const allowed = ['name','description','category','cuisine','price','cost',
                     'popularity_score','rating','modifiers','tags','image_url','is_available'];
    const updates = [];
    const params = [];

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        params.push(fields[key]);
        updates.push(`${key} = $${params.length}`);
      }
    }

    if (!updates.length) return res.status(400).json({ error: 'No valid fields to update' });

    params.push(id);
    const result = await query(
      `UPDATE menu_items SET ${updates.join(',')} WHERE id = $${params.length} RETURNING *`,
      params
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Item not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update item' });
  }
};

exports.toggleAvailability = async (req, res) => {
  try {
    const result = await query(
      `UPDATE menu_items SET is_available = NOT is_available WHERE id = $1 RETURNING id, name, is_available`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Item not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle availability' });
  }
};
