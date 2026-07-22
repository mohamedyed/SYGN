-- ============================================
-- SYGN Admin Migration
-- Safe to re-run
-- Run this AFTER supabase-schema.sql in SQL Editor
-- ============================================

-- 1. Add is_admin to profiles (safe if already exists)
DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN is_admin boolean DEFAULT false;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

-- 2. SECURITY DEFINER function to check admin status (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT coalesce(
    (SELECT is_admin FROM profiles WHERE id = uid),
    false
  );
$$;

-- 3. Make the admin user
UPDATE profiles SET is_admin = true WHERE email = 'admin@sygn.com';

-- 4. Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Drop old admin policies, then recreate
DO $$ BEGIN
  DROP POLICY IF EXISTS "Product images are public" ON storage.objects;
  DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
  DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;
  DROP POLICY IF EXISTS "Admins can insert products" ON products;
  DROP POLICY IF EXISTS "Admins can update products" ON products;
  DROP POLICY IF EXISTS "Admins can delete products" ON products;
  DROP POLICY IF EXISTS "Admins can insert categories" ON categories;
  DROP POLICY IF EXISTS "Admins can update categories" ON categories;
  DROP POLICY IF EXISTS "Admins can delete categories" ON categories;
  DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
  DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;
  DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
EXCEPTION WHEN undefined_object THEN null;
END $$;

-- 6. Storage policies
CREATE POLICY "Product images are public" ON storage.objects
  FOR SELECT USING (bucket_id = 'products');

CREATE POLICY "Admins can upload product images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'products'
    AND public.is_admin()
  );

CREATE POLICY "Admins can delete product images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'products'
    AND public.is_admin()
  );

-- 7. Admin RLS policies for products
CREATE POLICY "Admins can insert products" ON products
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update products" ON products
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete products" ON products
  FOR DELETE USING (public.is_admin());

-- 8. Admin RLS policies for categories
CREATE POLICY "Admins can insert categories" ON categories
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update categories" ON categories
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete categories" ON categories
  FOR DELETE USING (public.is_admin());

-- 9. Admin can view all orders
CREATE POLICY "Admins can view all orders" ON orders
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can view all order items" ON order_items
  FOR SELECT USING (public.is_admin());

-- 10. Admin can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (public.is_admin());
