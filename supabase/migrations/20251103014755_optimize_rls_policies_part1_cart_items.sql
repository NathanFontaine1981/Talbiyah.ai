/*
  # Optimize RLS Policies - Part 1: Cart Items

  1. Performance Optimization
    - Replace auth.uid() with (SELECT auth.uid()) to prevent re-evaluation per row
    - This significantly improves query performance at scale
  
  2. Changes
    - Drop and recreate all cart_items RLS policies with optimized auth function calls
  
  3. Security
    - No security changes, only performance optimization
    - All access control logic remains identical
*/

-- Drop existing cart_items policies
DROP POLICY IF EXISTS "Admin users can delete all cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Admin users can read all cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can delete own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can insert own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can read own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can update own cart items" ON public.cart_items;

-- Recreate cart_items policies with optimized auth calls
CREATE POLICY "Admin users can delete all cart items"
  ON public.cart_items
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND 'admin' = ANY(profiles.roles)
    )
  );

CREATE POLICY "Admin users can read all cart items"
  ON public.cart_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND 'admin' = ANY(profiles.roles)
    )
  );

CREATE POLICY "Users can delete own cart items"
  ON public.cart_items
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own cart items"
  ON public.cart_items
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can read own cart items"
  ON public.cart_items
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own cart items"
  ON public.cart_items
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
