/*
  # Fix User Sign-up Trigger

  1. Changes
    - Drop the existing trigger `on_auth_user_created` on auth.users
    - Replace the `handle_new_user()` function with a simpler version
    - The new function only inserts user ID and default role ('student')
    - All other profile fields (full_name, avatar_url, etc.) remain null
    - Create new trigger with the same name using the updated function

  2. Details
    - Trigger fires AFTER INSERT ON auth.users FOR EACH ROW
    - Function inserts: id (from NEW.id) and roles (default array ['student'])
    - This fixes the "database error saving new user" issue
    - The referral_code generation is removed to prevent failures

  3. Security
    - Function maintains SECURITY DEFINER to allow insertion into profiles table
    - RLS policies on profiles table still apply for subsequent operations
*/

-- Drop the existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Replace the function with a simpler version
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, roles)
  VALUES (NEW.id, ARRAY['student']::text[]);
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
