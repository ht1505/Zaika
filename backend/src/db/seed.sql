SET client_encoding = 'UTF8';
-- ============================================================
-- ZAIKA SEED DATA - Indian Restaurant Mock Dataset
-- Run AFTER schema.sql
-- ============================================================

-- Demo Users (passwords: demo123 and admin123)
INSERT INTO customers (name, email, phone, password_hash, role, preferred_language)
VALUES
  ('Arjun Mehta',  'customer@zaika.com', '+919876543210',
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh0y', 'customer', 'hinglish'),
  ('Priya Sharma', 'priya@zaika.com',    '+919123456789',
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh0y', 'customer', 'hindi'),
  ('Admin User',   'admin@zaika.com',    '+919999999999',
   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin',    'english');

-- Menu Items
INSERT INTO menu_items (name, description, category, cuisine, price, cost, popularity_score, rating, modifiers, tags, image_url)
VALUES
-- STARS (high margin, high popularity)
('Butter Chicken',      'Tender chicken in rich tomato-butter sauce',        'Main Course', 'North Indian',  380, 120, 8.5, 4.6, '[{"name":"Extra Butter","extra":30},{"name":"Boneless","extra":0}]',   '{"non-veg","bestseller"}', 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400'),
('Paneer Tikka Masala', 'Grilled paneer in spiced onion-tomato gravy',       'Main Course', 'North Indian',  320, 95,  7.8, 4.5, '[{"name":"Extra Paneer","extra":40},{"name":"Less Spicy","extra":0}]', '{"veg","bestseller"}',     'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400'),
('Dal Makhani',         'Slow-cooked black lentils with butter and cream',   'Main Course', 'North Indian',  260, 60,  7.2, 4.7, '[{"name":"Extra Cream","extra":20}]',                                  '{"veg","gluten-free"}',    'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400'),
('Garlic Naan',         'Soft naan with garlic and butter, tandoor-baked',   'Breads',      'Indian',         60, 12,  9.1, 4.8, '[{"name":"Cheese","extra":30},{"name":"Extra Butter","extra":10}]',    '{"veg"}',                  'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400'),
('Mango Lassi',         'Sweet yogurt drink with Alphonso mango pulp',       'Beverages',   'Indian',         90, 18,  8.0, 4.9, '[{"name":"No Sugar","extra":0},{"name":"Extra Thick","extra":10}]',    '{"veg","cold"}',           'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=400'),
-- HIDDEN STARS (high margin, low popularity)
('Raan Biryani',        'Slow-roasted lamb leg biryani, house specialty',    'Biryani',     'Mughlai',        750, 200, 3.2, 4.8, '[{"name":"Half Portion","extra":-200},{"name":"Extra Raita","extra":30}]', '{"non-veg","signature"}', 'https://images.unsplash.com/photo-1563379091339-03246963d21a?w=400'),
('Tawa Fish Masala',    'Fresh pomfret in spicy coastal masala on tawa',     'Main Course', 'Coastal Indian', 450, 130, 2.8, 4.7, '[{"name":"Extra Spicy","extra":0},{"name":"Less Oil","extra":0}]',     '{"non-veg","coastal"}',    'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400'),
('Shahi Tukda',         'Royal bread pudding with rabri and saffron',        'Desserts',    'Mughlai',        180, 40,  3.5, 4.6, '[{"name":"Extra Rabri","extra":30}]',                                  '{"veg","sweet"}',          'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400'),
('Kashmiri Dum Aloo',   'Baby potatoes in aromatic Kashmiri spice gravy',   'Main Course', 'Kashmiri',       280, 75,  4.2, 4.5, '[{"name":"Less Spicy","extra":0}]',                                    '{"veg","gluten-free"}',    'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400'),
-- WORKHORSES (low margin, high popularity)
('Veg Biryani',         'Fragrant basmati with vegetables and whole spices', 'Biryani',     'Hyderabadi',     280, 145, 6.8, 4.3, '[{"name":"Extra Raita","extra":30},{"name":"Less Spicy","extra":0}]',  '{"veg"}',                  'https://images.unsplash.com/photo-1563379091339-03246963d21a?w=400'),
('Chicken Biryani',     'Hyderabadi dum biryani with bone-in chicken',       'Biryani',     'Hyderabadi',     350, 195, 8.9, 4.6, '[{"name":"Boneless","extra":30},{"name":"Extra Raita","extra":30}]',   '{"non-veg","bestseller"}', 'https://images.unsplash.com/photo-1563379091339-03246963d21a?w=400'),
('Masala Chai',         'Ginger-cardamom spiced Indian tea',                 'Beverages',   'Indian',          40, 22,  7.5, 4.4, '[{"name":"No Sugar","extra":0},{"name":"Extra Strong","extra":0}]',    '{"veg","hot"}',            'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400'),
('Plain Roti',          'Whole wheat bread from tandoor',                    'Breads',      'Indian',          30, 18,  8.2, 4.1, '[]',                                                                   '{"veg","healthy"}',        'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400'),
('Aloo Paratha',        'Stuffed whole wheat flatbread with spiced potato',  'Breads',      'North Indian',   120, 70,  6.5, 4.4, '[{"name":"Extra Butter","extra":20},{"name":"With Curd","extra":20}]', '{"veg"}',                  'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400'),
('Samosa (2 pcs)',      'Crispy pastry with spiced potato-pea filling',      'Starters',    'Indian',          60, 35,  7.8, 4.2, '[{"name":"With Chutney","extra":0}]',                                  '{"veg","popular"}',        'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400'),
-- DOGS (low margin, low popularity)
('Corn Soup',           'Creamy sweet corn soup with bread croutons',        'Soups',       'Indo-Chinese',    90, 55,  2.1, 3.8, '[{"name":"Extra Spicy","extra":0}]',                                   '{"veg"}',                  'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400'),
('Veg Spring Roll',     'Crispy rolls with cabbage and carrot filling',      'Starters',    'Indo-Chinese',    80, 50,  3.8, 3.6, '[{"name":"Extra Sauce","extra":10}]',                                  '{"veg"}',                  'https://images.unsplash.com/photo-1544025162-d76694265947?w=400'),
('Cold Coffee',         'Chilled coffee with ice cream blended',             'Beverages',   'Indian',          80, 50,  4.1, 3.9, '[{"name":"No Sugar","extra":0},{"name":"Extra Ice Cream","extra":20}]','{"veg","cold"}',           'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400'),
('Gulab Jamun (2 pcs)', 'Soft milk-solid dumplings in rose sugar syrup',    'Desserts',    'Indian',          80, 48,  4.5, 4.0, '[{"name":"With Ice Cream","extra":30}]',                               '{"veg","sweet"}',          'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400'),
('Mix Veg',             'Seasonal vegetables in mild tomato-based gravy',    'Main Course', 'North Indian',   220, 145, 3.2, 3.7, '[{"name":"Less Spicy","extra":0}]',                                    '{"veg","healthy"}',        'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400'),
-- EXTRAS
('Paneer Tikka',        'Marinated cottage cheese grilled in tandoor',       'Starters',    'North Indian',   280, 90,  6.5, 4.6, '[{"name":"Extra Mint Chutney","extra":10}]',                           '{"veg","starter"}',        'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400'),
('Chicken Tikka',       'Bone-in chicken marinated in yogurt and spices',    'Starters',    'North Indian',   320, 130, 6.8, 4.5, '[{"name":"Boneless","extra":20}]',                                     '{"non-veg","starter"}',    'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400'),
('Raita',               'Chilled yogurt with cucumber and cumin',            'Sides',       'Indian',          60, 20,  5.2, 4.3, '[{"name":"Boondi Raita","extra":0},{"name":"Cucumber Raita","extra":0}]','{"veg","cold"}',          'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400'),
('Papad',               'Crispy lentil wafers, plain or roasted',            'Sides',       'Indian',          30, 8,   5.8, 4.1, '[{"name":"Roasted","extra":0},{"name":"Fried","extra":0}]',            '{"veg"}',                  'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400');

-- Combos
INSERT INTO combos (name, description, item_ids, combo_price)
SELECT
  'Biryani Meal',
  'Chicken Biryani + Raita + Papad - save Rs.40',
  ARRAY[
    (SELECT id FROM menu_items WHERE name = 'Chicken Biryani'),
    (SELECT id FROM menu_items WHERE name = 'Raita'),
    (SELECT id FROM menu_items WHERE name = 'Papad')
  ],
  380.00
WHERE NOT EXISTS (SELECT 1 FROM combos WHERE name = 'Biryani Meal');

INSERT INTO combos (name, description, item_ids, combo_price)
SELECT
  'Veg Thali Combo',
  'Dal Makhani + Garlic Naan + Raita - save Rs.50',
  ARRAY[
    (SELECT id FROM menu_items WHERE name = 'Dal Makhani'),
    (SELECT id FROM menu_items WHERE name = 'Garlic Naan'),
    (SELECT id FROM menu_items WHERE name = 'Raita')
  ],
  290.00
WHERE NOT EXISTS (SELECT 1 FROM combos WHERE name = 'Veg Thali Combo');

INSERT INTO combos (name, description, item_ids, combo_price)
SELECT
  'Tikka Starter Pack',
  'Paneer Tikka + Chicken Tikka + Mango Lassi - save Rs.60',
  ARRAY[
    (SELECT id FROM menu_items WHERE name = 'Paneer Tikka'),
    (SELECT id FROM menu_items WHERE name = 'Chicken Tikka'),
    (SELECT id FROM menu_items WHERE name = 'Mango Lassi')
  ],
  630.00
WHERE NOT EXISTS (SELECT 1 FROM combos WHERE name = 'Tikka Starter Pack');

-- Sample Orders
DO $$
DECLARE
  customer_id UUID;
  item1_id    UUID;
  item2_id    UUID;
  item3_id    UUID;
  order_id    UUID;
BEGIN
  SELECT id INTO customer_id FROM customers  WHERE email = 'customer@zaika.com';
  SELECT id INTO item1_id    FROM menu_items WHERE name  = 'Butter Chicken';
  SELECT id INTO item2_id    FROM menu_items WHERE name  = 'Garlic Naan';
  SELECT id INTO item3_id    FROM menu_items WHERE name  = 'Mango Lassi';

  IF customer_id IS NULL OR item1_id IS NULL THEN
    RAISE NOTICE 'Skipping sample order - required data not found';
    RETURN;
  END IF;

  INSERT INTO orders (id, customer_id, items, subtotal, tax, total_price, channel, status, delivery_email)
  VALUES (
    uuid_generate_v4(), customer_id,
    jsonb_build_array(
      jsonb_build_object('item_id', item1_id, 'name', 'Butter Chicken', 'qty', 1, 'price', 380, 'modifiers', jsonb_build_array()),
      jsonb_build_object('item_id', item2_id, 'name', 'Garlic Naan',    'qty', 2, 'price', 60,  'modifiers', jsonb_build_array()),
      jsonb_build_object('item_id', item3_id, 'name', 'Mango Lassi',    'qty', 1, 'price', 90,  'modifiers', jsonb_build_array())
    ),
    590, 30, 620, 'chat', 'delivered', 'customer@zaika.com'
  ) RETURNING id INTO order_id;

  INSERT INTO order_items (order_id, item_id, item_name, quantity, unit_price, modifiers)
  VALUES
    (order_id, item1_id, 'Butter Chicken', 1, 380, '[]'),
    (order_id, item2_id, 'Garlic Naan',    2, 60,  '[]'),
    (order_id, item3_id, 'Mango Lassi',    1, 90,  '[]');

  RAISE NOTICE 'Sample order created successfully';
END $$;

REFRESH MATERIALIZED VIEW revenue_signals;

DO $$ BEGIN
  RAISE NOTICE 'Zaika seed data loaded successfully.';
END $$;
