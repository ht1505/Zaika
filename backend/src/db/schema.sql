-- ============================================================
-- ZAIKA DATABASE SCHEMA
-- Run: psql -U postgres -d zaika_db -f schema.sql
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- fuzzy matching

-- ─── CUSTOMERS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) UNIQUE NOT NULL,
  phone         VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  preferred_language VARCHAR(20) DEFAULT 'hinglish' CHECK (preferred_language IN ('hinglish', 'hindi', 'gujarati', 'english')),
  locale        VARCHAR(10) DEFAULT 'en-IN',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── MENU ITEMS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS menu_items (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             VARCHAR(150) NOT NULL,
  description      TEXT,
  category         VARCHAR(80) NOT NULL,
  cuisine          VARCHAR(80),
  price            NUMERIC(10,2) NOT NULL,
  cost             NUMERIC(10,2) NOT NULL,
  margin           NUMERIC(5,2) GENERATED ALWAYS AS (
                     ROUND(((price - cost) / NULLIF(price, 0)) * 100, 2)
                   ) STORED,
  popularity_score NUMERIC(5,2) DEFAULT 0 CHECK (popularity_score BETWEEN 0 AND 10),
  rating           NUMERIC(3,2) DEFAULT 0 CHECK (rating BETWEEN 0 AND 5),
  -- BCG matrix classification
  item_class       VARCHAR(20) GENERATED ALWAYS AS (
    CASE
      WHEN ((price - cost) / NULLIF(price, 0)) * 100 >= 40 AND popularity_score >= 5 THEN 'star'
      WHEN ((price - cost) / NULLIF(price, 0)) * 100 >= 40 AND popularity_score < 5  THEN 'hidden_star'
      WHEN ((price - cost) / NULLIF(price, 0)) * 100 < 40  AND popularity_score >= 5 THEN 'workhorse'
      ELSE 'dog'
    END
  ) STORED,
  modifiers        JSONB DEFAULT '[]',   -- [{"name":"Spicy","extra":10}, ...]
  tags             TEXT[] DEFAULT '{}',  -- ['veg','gluten-free']
  is_available     BOOLEAN DEFAULT TRUE,
  image_url        TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Full-text + trigram index for fuzzy search
CREATE INDEX IF NOT EXISTS idx_menu_items_name_trgm ON menu_items USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items (category);
CREATE INDEX IF NOT EXISTS idx_menu_items_class ON menu_items (item_class);

-- ─── ORDERS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id      UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  items            JSONB NOT NULL,  -- [{item_id, name, qty, price, modifiers}]
  subtotal         NUMERIC(10,2) NOT NULL,
  tax              NUMERIC(10,2) DEFAULT 0,
  total_price      NUMERIC(10,2) NOT NULL,
  channel          VARCHAR(20) NOT NULL DEFAULT 'cart' CHECK (channel IN ('cart','chat','voice')),
  status           VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (
                     status IN ('pending','confirmed','preparing','ready','delivered','cancelled')
                   ),
  language_used    VARCHAR(20) DEFAULT 'english',
  special_notes    TEXT,
  delivery_phone   VARCHAR(20),
  delivery_email   VARCHAR(150),
  notification_sent BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders (customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_channel ON orders (channel);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders (created_at DESC);

-- ─── ORDER ITEM DETAILS (denormalised for analytics) ──────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_id     UUID NOT NULL REFERENCES menu_items(id),
  item_name   VARCHAR(150) NOT NULL,
  quantity    INT NOT NULL DEFAULT 1,
  unit_price  NUMERIC(10,2) NOT NULL,
  modifiers   JSONB DEFAULT '[]',
  line_total  NUMERIC(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_item ON order_items (item_id);

-- ─── COMBOS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS combos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(150) NOT NULL,
  description TEXT,
  item_ids    UUID[] NOT NULL,
  combo_price NUMERIC(10,2) NOT NULL,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── REVENUE SIGNALS (materialised view) ──────────────────────────────────────
CREATE MATERIALIZED VIEW IF NOT EXISTS revenue_signals AS
SELECT
  mi.id,
  mi.name,
  mi.category,
  mi.price,
  mi.cost,
  mi.margin,
  mi.item_class,
  mi.popularity_score,
  COUNT(oi.id)               AS total_orders,
  SUM(oi.line_total)         AS total_revenue,
  SUM(oi.line_total - (mi.cost * oi.quantity)) AS total_profit,
  AVG(oi.unit_price)         AS avg_selling_price,
  MAX(o.created_at)          AS last_ordered_at
FROM menu_items mi
LEFT JOIN order_items oi ON oi.item_id = mi.id
LEFT JOIN orders o ON o.id = oi.order_id AND o.status != 'cancelled'
GROUP BY mi.id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_revenue_signals_id ON revenue_signals (id);

-- ─── TRIGGERS: updated_at ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_customers_updated ON customers;
CREATE TRIGGER trg_customers_updated
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_menu_items_updated ON menu_items;
CREATE TRIGGER trg_menu_items_updated
  BEFORE UPDATE ON menu_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_orders_updated ON orders;
CREATE TRIGGER trg_orders_updated
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
