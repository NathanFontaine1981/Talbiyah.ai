-- Parents must only ever see the parent-facing parts of published notes. RLS is row-level, so a policy
-- that let parents SELECT a published row also exposed teacher_activities and generation_checks.
-- Fix: the base table is teacher/admin only; parents read this view (notes + homework + covered units).
DROP POLICY IF EXISTS madrasa_materials_select ON public.madrasa_session_materials;
CREATE POLICY madrasa_materials_select ON public.madrasa_session_materials FOR SELECT TO authenticated
  USING (public.madrasa_can_view_class(public.madrasa_session_class(session_id)));

-- security_invoker = false: runs with the view owner's rights so it can read the base table; the WHERE
-- clause is the access check (caller must be a parent of an enrolled child, or a teacher/admin of the class).
CREATE OR REPLACE VIEW public.madrasa_published_notes WITH (security_invoker = false) AS
SELECT
  m.session_id,
  s.class_id,
  s.session_date,
  s.start_time,
  s.end_time,
  m.parent_notes,
  m.homework,
  m.published_at,
  (SELECT jsonb_agg(jsonb_build_object('unit_number', u.unit_number, 'title', u.title) ORDER BY u.unit_number)
     FROM public.madrasa_session_units su
     JOIN public.madrasa_units u ON u.id = su.unit_id
    WHERE su.session_id = m.session_id) AS units
FROM public.madrasa_session_materials m
JOIN public.madrasa_sessions s ON s.id = m.session_id
WHERE m.status = 'published'
  AND (public.madrasa_is_parent_in_class(s.class_id) OR public.madrasa_can_view_class(s.class_id));

REVOKE ALL ON public.madrasa_published_notes FROM PUBLIC, anon;
GRANT SELECT ON public.madrasa_published_notes TO authenticated;
