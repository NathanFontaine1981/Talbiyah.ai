/*
  # Ensure Admin Account Can Sign In

  ## Summary
  Ensures the admin account contact@talbiyah.ai is properly configured in auth.users
  and can sign in with the password Admin123!

  ## Changes
  1. Verifies admin user exists in auth.users with correct credentials
  2. Ensures email is confirmed
  3. Sets up proper authentication metadata
  4. Links to admin profile in public.profiles

  ## Credentials
  - Email: contact@talbiyah.ai
  - Password: Admin123!
  - Role: Administrator with full access
*/

-- Ensure admin user exists in auth.users with proper sign-in configuration
DO $$
DECLARE
  admin_user_id uuid := 'a0000000-0000-0000-0000-000000000001'::uuid;
  existing_user_id uuid;
BEGIN
  -- Check if user already exists by email
  SELECT id INTO existing_user_id FROM auth.users WHERE email = 'contact@talbiyah.ai';

  -- If user exists with different ID, delete it first
  IF existing_user_id IS NOT NULL AND existing_user_id != admin_user_id THEN
    DELETE FROM auth.users WHERE email = 'contact@talbiyah.ai';
  END IF;

  -- Insert or update admin user in auth.users
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
    recovery_token,
    last_sign_in_at
  ) VALUES (
    admin_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'contact@talbiyah.ai',
    crypt('Admin123!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Talbiyah Admin"}'::jsonb,
    NOW(),
    NOW(),
    '',
    '',
    '',
    '',
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = 'contact@talbiyah.ai',
    encrypted_password = crypt('Admin123!', gen_salt('bf')),
    email_confirmed_at = NOW(),
    raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
    raw_user_meta_data = '{"full_name":"Talbiyah Admin"}'::jsonb,
    updated_at = NOW();

  -- Ensure admin profile exists
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
    full_name = 'Talbiyah Admin',
    updated_at = NOW();

  RAISE NOTICE '✅ Admin account ready: contact@talbiyah.ai / Admin123!';
END $$;