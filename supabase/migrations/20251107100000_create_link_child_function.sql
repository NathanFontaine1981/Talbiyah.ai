-- Create a secure function to link a child to a parent
-- This function runs with elevated privileges (SECURITY DEFINER)
-- to bypass RLS when creating the parent-child relationship

CREATE OR REPLACE FUNCTION link_child_to_parent(
  p_parent_id uuid,
  p_child_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_link_id uuid;
BEGIN
  -- Verify that the calling user is the parent
  IF auth.uid() != p_parent_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only link children to your own account';
  END IF;

  -- Insert the parent-child relationship
  INSERT INTO parent_children (parent_id, child_id)
  VALUES (p_parent_id, p_child_id)
  RETURNING id INTO v_link_id;

  RETURN v_link_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION link_child_to_parent(uuid, uuid) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION link_child_to_parent IS
  'Securely links a child account to a parent account. Verifies the caller is the parent before creating the link.';
