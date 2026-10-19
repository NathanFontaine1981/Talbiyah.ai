-- Atomically swap the unit numbers of two units in the same class (used by the scheme-of-work
-- reorder buttons). SECURITY INVOKER: RLS (madrasa_can_manage_class) still decides who may do it.
-- Needs a temporary number because (class_id, unit_number) is unique.
CREATE OR REPLACE FUNCTION public.madrasa_swap_units(p_a uuid, p_b uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path TO ''
AS $$
DECLARE
  a public.madrasa_units%ROWTYPE;
  b public.madrasa_units%ROWTYPE;
BEGIN
  SELECT * INTO a FROM public.madrasa_units WHERE id = p_a FOR UPDATE;
  SELECT * INTO b FROM public.madrasa_units WHERE id = p_b FOR UPDATE;
  IF a.id IS NULL OR b.id IS NULL OR a.class_id <> b.class_id THEN
    RAISE EXCEPTION 'Units not found, or not in the same class';
  END IF;
  UPDATE public.madrasa_units SET unit_number = -1 WHERE id = a.id;
  UPDATE public.madrasa_units SET unit_number = a.unit_number WHERE id = b.id;
  UPDATE public.madrasa_units SET unit_number = b.unit_number WHERE id = a.id;
  -- RLS can silently filter an UPDATE to zero rows; make that loud instead of leaving unit -1 behind.
  IF NOT EXISTS (SELECT 1 FROM public.madrasa_units WHERE id = a.id AND unit_number = b.unit_number) THEN
    RAISE EXCEPTION 'Not allowed to reorder these units';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.madrasa_swap_units(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.madrasa_swap_units(uuid, uuid) TO authenticated;
