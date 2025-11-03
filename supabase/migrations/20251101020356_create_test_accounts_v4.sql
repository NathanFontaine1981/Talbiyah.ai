/*
  # Create Admin and Teacher Test Accounts

  ## Summary
  Creates two fully configured test accounts ready for immediate testing.

  ## Credentials

  ### Admin Account
  - Email: contact@talbiyah.ai
  - Password: Admin123!
  - Role: Full admin access

  ### Teacher Account
  - Email: nathanfontaine@aol.com
  - Password: Teacher123!
  - Role: Approved teacher (visible in marketplace)
  - Hourly Rate: £15.00
  - Subjects: Quran with Understanding, Arabic Language

  ## Database Operations
  1. Create users in auth.users
  2. Create profiles
  3. Create teacher profile (approved status)
  4. Link teacher to subjects
  5. Create learner profile
*/

-- Create Admin Account
DO $$
DECLARE
  admin_user_id uuid := 'a0000000-0000-0000-0000-000000000001'::uuid;
BEGIN
  -- Insert admin user
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    admin_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'contact@talbiyah.ai',
    crypt('Admin123!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Talbiyah Admin"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
  ON CONFLICT (id) DO NOTHING;

  -- Create admin profile
  INSERT INTO public.profiles (
    id,
    full_name,
    roles,
    is_admin,
    created_at,
    updated_at
  ) VALUES (
    admin_user_id,
    'Talbiyah Admin',
    ARRAY['admin'],
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    roles = ARRAY['admin'],
    is_admin = true,
    full_name = 'Talbiyah Admin';
END $$;

-- Create Teacher Account
DO $$
DECLARE
  teacher_user_id uuid := 'b0000000-0000-0000-0000-000000000002'::uuid;
  teacher_profile_id uuid;
  learner_exists boolean;
BEGIN
  -- Insert teacher user
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    teacher_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'nathanfontaine@aol.com',
    crypt('Teacher123!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Nathan Fontaine"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
  ON CONFLICT (id) DO NOTHING;

  -- Create teacher profile
  INSERT INTO public.profiles (
    id,
    full_name,
    roles,
    is_admin,
    gender,
    phone_number,
    location,
    created_at,
    updated_at,
    is_approved_teacher
  ) VALUES (
    teacher_user_id,
    'Nathan Fontaine',
    ARRAY['teacher', 'student'],
    false,
    'male',
    '+44 123 456 7890',
    'London, UK',
    NOW(),
    NOW(),
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    roles = ARRAY['teacher', 'student'],
    full_name = 'Nathan Fontaine',
    gender = 'male',
    phone_number = '+44 123 456 7890',
    location = 'London, UK',
    is_approved_teacher = true;

  -- Create teacher profile with approved status
  INSERT INTO public.teacher_profiles (
    user_id,
    status,
    hourly_rate,
    bio,
    is_talbiyah_certified,
    education_level,
    islamic_learning_interests,
    created_at,
    updated_at
  ) VALUES (
    teacher_user_id,
    'approved',
    15.00,
    'Experienced Islamic educator specializing in Quranic studies and Arabic language instruction. Holds Ijazah in Quranic recitation with 10+ years of teaching experience.',
    true,
    'Bachelor in Islamic Studies',
    ARRAY['Tajweed', 'Tafsir', 'Arabic Language', 'Quranic Memorization'],
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    status = 'approved',
    hourly_rate = 15.00,
    bio = 'Experienced Islamic educator specializing in Quranic studies and Arabic language instruction. Holds Ijazah in Quranic recitation with 10+ years of teaching experience.',
    is_talbiyah_certified = true,
    education_level = 'Bachelor in Islamic Studies',
    islamic_learning_interests = ARRAY['Tajweed', 'Tafsir', 'Arabic Language', 'Quranic Memorization']
  RETURNING id INTO teacher_profile_id;

  -- Get teacher profile ID if already existed
  IF teacher_profile_id IS NULL THEN
    SELECT id INTO teacher_profile_id
    FROM public.teacher_profiles
    WHERE user_id = teacher_user_id;
  END IF;

  -- Link to Quran subject
  INSERT INTO public.teacher_subjects (teacher_id, subject_id, created_at)
  SELECT teacher_profile_id, s.id, NOW()
  FROM public.subjects s
  WHERE s.name = 'Quran with Understanding'
  ON CONFLICT (teacher_id, subject_id) DO NOTHING;

  -- Link to Arabic subject
  INSERT INTO public.teacher_subjects (teacher_id, subject_id, created_at)
  SELECT teacher_profile_id, s.id, NOW()
  FROM public.subjects s
  WHERE s.name = 'Arabic Language'
  ON CONFLICT (teacher_id, subject_id) DO NOTHING;

  -- Check if learner already exists
  SELECT EXISTS (
    SELECT 1 FROM public.learners WHERE parent_id = teacher_user_id
  ) INTO learner_exists;

  -- Create or update learner profile
  IF NOT learner_exists THEN
    INSERT INTO public.learners (
      name,
      parent_id,
      gamification_points,
      total_points,
      login_streak,
      last_login_date,
      learning_credits,
      created_at,
      updated_at
    ) VALUES (
      'Nathan Fontaine',
      teacher_user_id,
      100,
      100,
      5,
      CURRENT_DATE,
      0,
      NOW(),
      NOW()
    );
  ELSE
    UPDATE public.learners
    SET
      gamification_points = 100,
      total_points = 100,
      login_streak = 5,
      last_login_date = CURRENT_DATE
    WHERE parent_id = teacher_user_id;
  END IF;
END $$;

-- Display credentials
DO $$
BEGIN
  RAISE NOTICE '╔════════════════════════════════════════╗';
  RAISE NOTICE '║   TEST ACCOUNTS CREATED SUCCESSFULLY   ║';
  RAISE NOTICE '╚════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '📧 ADMIN ACCOUNT';
  RAISE NOTICE '   Email: contact@talbiyah.ai';
  RAISE NOTICE '   Password: Admin123!';
  RAISE NOTICE '   Role: Administrator';
  RAISE NOTICE '';
  RAISE NOTICE '👨‍🏫 TEACHER ACCOUNT';
  RAISE NOTICE '   Email: nathanfontaine@aol.com';
  RAISE NOTICE '   Password: Teacher123!';
  RAISE NOTICE '   Role: Approved Teacher';
  RAISE NOTICE '   Rate: £15.00/hour';
  RAISE NOTICE '   Status: ✅ Ready for bookings';
  RAISE NOTICE '   Subjects: Quran & Arabic';
  RAISE NOTICE '';
  RAISE NOTICE '✨ Both accounts ready for immediate login';
END $$;