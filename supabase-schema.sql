-- ============================================
-- SYGN E-Commerce Schema
-- Safe to re-run (uses IF NOT EXISTS)
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================

-- 1. CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
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
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  stock integer NOT NULL DEFAULT 10,
  is_trending boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 3. PROFILES (extends auth.users)
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

-- 4. ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  total numeric(10, 2) NOT NULL,
  shipping_name text,
  shipping_email text,
  shipping_address text,
  shipping_city text,
  shipping_state text,
  shipping_zip text,
  created_at timestamptz DEFAULT now()
);

-- 5. ORDER ITEMS
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(10, 2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 6. REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Drop old policies to avoid conflicts
DO $$ BEGIN
  DROP POLICY IF EXISTS "Categories are public" ON categories;
  DROP POLICY IF EXISTS "Products are public" ON products;
  DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can view own orders" ON orders;
  DROP POLICY IF EXISTS "Users can create orders" ON orders;
  DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
  DROP POLICY IF EXISTS "Users can create order items" ON order_items;
  DROP POLICY IF EXISTS "Reviews are public" ON reviews;
  DROP POLICY IF EXISTS "Authenticated users can create reviews" ON reviews;
  DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;
  DROP POLICY IF EXISTS "Users can delete own reviews" ON reviews;
EXCEPTION WHEN undefined_object THEN null;
END $$;

-- Categories: anyone can read
CREATE POLICY "Categories are public" ON categories
  FOR SELECT USING (true);

-- Products: anyone can read
CREATE POLICY "Products are public" ON products
  FOR SELECT USING (true);

-- Profiles: users can read/update their own
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Orders: users can read their own, anyone can insert
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Order items: users can read items from their own orders
CREATE POLICY "Users can view own order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can create order items" ON order_items
  FOR INSERT WITH CHECK (true);

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

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM categories LIMIT 1) THEN
    INSERT INTO categories (name, slug) VALUES
      ('Street Signs', 'street-signs'),
      ('Artist Series', 'artist-series'),
      ('SYGN Core', 'sygn-core'),
      ('Limited Edition', 'limited-edition');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM products LIMIT 1) THEN
    INSERT INTO products (title, subtitle, price, glow, size, image_url, category_id, stock, is_trending) VALUES
      ('NO PARKING', 'Neon Edition · 1 of 50', 1200.00, 'pink', 'xl', '/assets/sign1.png', (SELECT id FROM categories WHERE slug = 'limited-edition'), 50, true),
      ('ONE WAY', 'Street Series · Matte Black', 890.00, 'blue', 'xl', '/assets/sign2.png', (SELECT id FROM categories WHERE slug = 'street-signs'), 100, true),
      ('DEAD END', 'Limited Run · Steel', 750.00, 'red', 'lg', '/assets/sign3.png', (SELECT id FROM categories WHERE slug = 'street-signs'), 75, true),
      ('SYGN', 'Core · Pure White', 450.00, 'white', 'xl', '/assets/sign4.png', (SELECT id FROM categories WHERE slug = 'sygn-core'), 200, true),
      ('OPEN 24H', 'Always On · Amber Glass', 680.00, 'amber', 'sm', null, (SELECT id FROM categories WHERE slug = 'street-signs'), 60, true),
      ('DO NOT ENTER', 'Crimson Series · Acrylic', 920.00, 'red', 'md', null, (SELECT id FROM categories WHERE slug = 'street-signs'), 40, true),
      ('WALK', 'Pedestrian · Warm Neon', 540.00, 'green', 'sm', null, (SELECT id FROM categories WHERE slug = 'street-signs'), 80, true),
      ('ZONE', 'District · Electric Blue', 1050.00, 'cyan', 'md', null, (SELECT id FROM categories WHERE slug = 'artist-series'), 30, true),
      ('SLOW', 'Caution · Orange Glow', 380.00, 'warm', 'sm', null, (SELECT id FROM categories WHERE slug = 'street-signs'), 90, true),
      ('SYGN STUDIO', 'Flagship · Purple Haze', 1500.00, 'purple', 'lg', null, (SELECT id FROM categories WHERE slug = 'limited-edition'), 25, true);
  END IF;
END $$;
