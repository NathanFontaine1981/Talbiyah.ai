-- CLEAN DATABASE - Keep only Admin account
-- This will delete all users, students, teachers, parents EXCEPT the admin
-- WARNING: This is destructive! Make sure you want to do this.

-- First, let's identify the admin user
-- Assuming admin has role 'admin' in their roles array
DO $$
DECLARE
  admin_id UUID;
  deleted_count INTEGER;
BEGIN
  -- Find admin user ID
  SELECT id INTO admin_id
  FROM profiles
  WHERE roles @> ARRAY['admin']::text[]
  LIMIT 1;

  IF admin_id IS NULL THEN
    RAISE NOTICE 'No admin user found! Aborting cleanup.';
  ELSE
    RAISE NOTICE 'Admin user ID: %', admin_id;
    RAISE NOTICE 'Starting cleanup...';

    -- Delete lessons (except those involving admin)
    DELETE FROM lessons WHERE learner_id NOT IN (
      SELECT id FROM learners WHERE parent_id = admin_id
    );
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % lessons', deleted_count;

    -- Delete student_teacher_relationships
    DELETE FROM student_teacher_relationships WHERE student_id NOT IN (
      SELECT id FROM learners WHERE parent_id = admin_id
    );
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % student_teacher_relationships', deleted_count;

    -- Delete teacher availability
    DELETE FROM teacher_availability WHERE teacher_id != admin_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % teacher_availability records', deleted_count;

    -- Delete teacher profiles
    DELETE FROM teacher_profiles WHERE user_id != admin_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % teacher_profiles', deleted_count;

    -- Delete pending bookings
    DELETE FROM pending_bookings WHERE user_id != admin_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % pending_bookings', deleted_count;

    -- Delete credit transactions
    DELETE FROM credit_transactions WHERE user_id != admin_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % credit_transactions', deleted_count;

    -- Delete credit purchases
    DELETE FROM credit_purchases WHERE user_id != admin_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % credit_purchases', deleted_count;

    -- Delete user credits
    DELETE FROM user_credits WHERE user_id != admin_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % user_credits', deleted_count;

    -- Delete parent_children relationships
    DELETE FROM parent_children WHERE parent_id != admin_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % parent_children relationships', deleted_count;

    -- Delete learners (children)
    DELETE FROM learners WHERE parent_id != admin_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % learners', deleted_count;

    -- Delete profiles (except admin)
    DELETE FROM profiles WHERE id != admin_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % profiles', deleted_count;

    -- Note: We cannot delete from auth.users table from SQL
    -- You'll need to manually delete users from Supabase Authentication dashboard
    -- OR use the Supabase admin API

    RAISE NOTICE '✅ Cleanup complete!';
    RAISE NOTICE 'Admin account preserved: %', admin_id;
    RAISE NOTICE '⚠️  IMPORTANT: You still need to delete users from Authentication dashboard';
    RAISE NOTICE 'Go to: https://supabase.com/dashboard/project/boyrjgivpepjiboekwuu/auth/users';
    RAISE NOTICE 'Delete all users except the admin user';
  END IF;
END $$;

-- Show remaining users
SELECT
  id,
  email,
  full_name,
  roles,
  created_at
FROM profiles
ORDER BY created_at;

-- Verify cleanup
SELECT
  'profiles' as table_name, COUNT(*) as remaining_records FROM profiles
UNION ALL
SELECT 'teacher_profiles', COUNT(*) FROM teacher_profiles
UNION ALL
SELECT 'learners', COUNT(*) FROM learners
UNION ALL
SELECT 'lessons', COUNT(*) FROM lessons
UNION ALL
SELECT 'user_credits', COUNT(*) FROM user_credits
UNION ALL
SELECT 'pending_bookings', COUNT(*) FROM pending_bookings;
