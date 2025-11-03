/*
  # Fix Profile Creation Trigger to Use Selected Role

  1. Changes
    - Update the `handle_new_user()` function to read the selected_role from user metadata
    - If no selected_role is provided, default to 'student'
    - This ensures profiles are created with the correct role when users sign up

  2. Details
    - Function now checks NEW.raw_user_meta_data for selected_role
    - Falls back to 'student' if no role is specified
    - Maintains SECURITY DEFINER for proper permissions

  3. Security
    - Function maintains SECURITY DEFINER to allow insertion into profiles table
    - RLS policies on profiles table still apply for subsequent operations
*/

-- Update the function to use selected_role from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  user_role text;
BEGIN
  -- Extract selected_role from user metadata, default to 'student'
  user_role := COALESCE(
    NEW.raw_user_meta_data->>'selected_role',
    'student'
  );

  -- Insert profile with the appropriate role
  INSERT INTO public.profiles (id, roles)
  VALUES (NEW.id, ARRAY[user_role]::text[]);
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, just return
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error but don't fail the signup
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;