-- Create function to get users with their emails for admin
-- This function accesses auth.users which is normally not accessible
CREATE OR REPLACE FUNCTION public.get_users_with_emails()
RETURNS TABLE (
  id uuid,
  email text
)
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with the privileges of the function owner
SET search_path = public, auth
AS $$
BEGIN
  -- Check if the calling user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND (
      profiles.roles && ARRAY['admin']::text[]
      OR profiles.is_admin = true
    )
  ) THEN
    RAISE EXCEPTION 'Only admins can access user emails';
  END IF;

  -- Return user IDs and emails from auth.users
  RETURN QUERY
  SELECT
    au.id,
    au.email::text
  FROM auth.users au;
END;
$$;

-- Grant execute permission to authenticated users (function checks admin internally)
GRANT EXECUTE ON FUNCTION public.get_users_with_emails() TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.get_users_with_emails() IS 'Returns user IDs and emails for admin users only';
