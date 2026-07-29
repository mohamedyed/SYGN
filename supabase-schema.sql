-- ============================================
-- SYGN E-Commerce Schema
-- Safe to re-run (uses IF NOT EXISTS)
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================

-- 1. LABELS (replaces single-category with many-to-many tags)
CREATE TABLE IF NOT EXISTS labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 2. PRODUCTS
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  description text,
  price numeric(10, 2) NOT NULL,
  glow text NOT NULL DEFAULT 'white',
  size text NOT NULL DEFAULT 'md',
  image_url text,
  stock integer NOT NULL DEFAULT 10,
  is_trending boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 3. PRODUCT_LABELS (many-to-many junction)
CREATE TABLE IF NOT EXISTS product_labels (
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  label_id uuid REFERENCES labels(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, label_id)
);

-- 4. PROFILES (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  phone text,
  address text,
  city text,
  state text,
  zip text,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Auto-create profile on signup (drop + recreate to avoid duplicates)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 5. ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  total numeric(10, 2) NOT NULL,
  shipping_fee numeric(10, 2) NOT NULL DEFAULT 0,
  shipping_name text,
  shipping_email text,
  shipping_phone text,
  shipping_address text,
  shipping_city text,
  shipping_state text,
  shipping_zip text,
  created_at timestamptz DEFAULT now()
);

-- 6. ORDER ITEMS
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(10, 2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 7. REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now()
);

-- 8. SETTINGS (key-value store — e.g. shipping_fee)
CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Admins can read/write settings; the checkout hook reads publicly
DROP POLICY IF EXISTS "Anyone can read settings" ON settings;
CREATE POLICY "Anyone can read settings" ON settings
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can write settings" ON settings;
CREATE POLICY "Admins can write settings" ON settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Seed defaults
INSERT INTO settings (key, value) VALUES ('shipping_fee', '0')
  ON CONFLICT (key) DO NOTHING;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Drop old policies to avoid conflicts
DO $$ BEGIN
  DROP POLICY IF EXISTS "Products are public" ON products;
  DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can view own orders" ON orders;
  DROP POLICY IF EXISTS "Users can create orders" ON orders;
  DROP POLICY IF EXISTS "Users can delete own orders" ON orders;
  DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
  DROP POLICY IF EXISTS "Users can create order items" ON order_items;
  DROP POLICY IF EXISTS "Reviews are public" ON reviews;
  DROP POLICY IF EXISTS "Authenticated users can create reviews" ON reviews;
  DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;
  DROP POLICY IF EXISTS "Users can delete own reviews" ON reviews;
EXCEPTION WHEN undefined_object THEN null;
END $$;

-- Labels & product_labels: anyone can read
CREATE POLICY "Labels are public" ON labels
  FOR SELECT USING (true);
CREATE POLICY "Product labels are public" ON product_labels
  FOR SELECT USING (true);

-- Products: anyone can read
CREATE POLICY "Products are public" ON products
  FOR SELECT USING (true);

-- Profiles: users can read/update their own
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Orders: users can read/create/delete their own
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can delete own orders" ON orders
  FOR DELETE USING (auth.uid() = user_id);

-- Order items: users can read items from their own orders
CREATE POLICY "Users can view own order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can create order items" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
    )
  );

-- Reviews: anyone can read, authenticated users can create
CREATE POLICY "Reviews are public" ON reviews
  FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews" ON reviews
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- SEED DATA (only insert if table is empty)
-- ============================================

-- Server-side order validation function
CREATE OR REPLACE FUNCTION validate_order_total(p_order_id uuid)
RETURNS numeric
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT coalesce(sum(unit_price * quantity), 0) FROM order_items WHERE order_id = p_order_id;
$$;

-- Prevent order total manipulation: auto-update total from order_items + shipping_fee
CREATE OR REPLACE FUNCTION sync_order_total()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE orders SET total = (
    SELECT coalesce(sum(unit_price * quantity), 0) FROM order_items WHERE order_id = NEW.order_id
  ) + (SELECT coalesce(shipping_fee, 0) FROM orders WHERE id = NEW.order_id)
  WHERE id = NEW.order_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_order_item_insert ON order_items;
CREATE TRIGGER on_order_item_insert
  AFTER INSERT ON order_items
  FOR EACH ROW EXECUTE FUNCTION sync_order_total();

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM labels LIMIT 1) THEN
    INSERT INTO labels (name, slug) VALUES
      ('Street Signs', 'street-signs'),
      ('Artist Series', 'artist-series'),
      ('SYGN Core', 'sygn-core'),
      ('Limited Edition', 'limited-edition');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM products LIMIT 1) THEN
    INSERT INTO products (title, subtitle, price, glow, size, image_url, stock, is_trending) VALUES
      ('NO PARKING', 'Neon Edition · 1 of 50', 1200.00, 'pink', 'xl', '/assets/sign1.png', 50, true),
      ('ONE WAY', 'Street Series · Matte Black', 890.00, 'blue', 'xl', '/assets/sign2.png', 100, true),
      ('DEAD END', 'Limited Run · Steel', 750.00, 'red', 'lg', '/assets/sign3.png', 75, true),
      ('SYGN', 'Core · Pure White', 450.00, 'white', 'xl', '/assets/sign4.png', 200, true),
      ('OPEN 24H', 'Always On · Amber Glass', 680.00, 'amber', 'sm', null, 60, true),
      ('DO NOT ENTER', 'Crimson Series · Acrylic', 920.00, 'red', 'md', null, 40, true),
      ('WALK', 'Pedestrian · Warm Neon', 540.00, 'green', 'sm', null, 80, true),
      ('ZONE', 'District · Electric Blue', 1050.00, 'cyan', 'md', null, 30, true),
      ('SLOW', 'Caution · Orange Glow', 380.00, 'warm', 'sm', null, 90, true),
      ('SYGN STUDIO', 'Flagship · Purple Haze', 1500.00, 'purple', 'lg', null, 25, true);
  END IF;
END $$;
