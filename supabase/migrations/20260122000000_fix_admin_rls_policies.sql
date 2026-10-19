-- Fix Admin RLS Policies Migration
-- This migration fixes three admin experience issues:
-- 1. Admin can't view user bookings (missing admin exception in bookings SELECT policy)
-- 2. Admin settings not saving (missing INSERT policy on platform_settings)

-- ==========================================
-- ISSUE 1: FIX BOOKINGS SELECT POLICY
-- Add admin exception so admins can view all bookings
-- ==========================================

DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid()
    OR teacher_id = auth.uid()
    OR EXISTS (SELECT 1 FROM learners WHERE learners.id = bookings.student_id AND learners.parent_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND 'admin' = ANY(profiles.roles))
  );

-- ==========================================
-- ISSUE 2: FIX PLATFORM_SETTINGS INSERT POLICY
-- Add INSERT policy so admins can insert settings (for upsert)
-- ==========================================

-- Add INSERT policy for admins
CREATE POLICY "Admins can insert platform settings"
  ON platform_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR 'admin' = ANY(profiles.roles))
    )
  );

-- Update GRANT to include INSERT permission
GRANT INSERT ON platform_settings TO authenticated;
