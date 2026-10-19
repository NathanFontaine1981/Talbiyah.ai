-- Madrasa module: in-person group classes (pilot: Cheadle Masjid).
-- Lesson-log model: no video, no audio. Everything is prefixed madrasa_ to stay clear
-- of the online group_sessions / course_sessions tables.
--
-- Children are normal public.learners (learners.parent_id -> profiles.id); adults are
-- learners with is_self = true. Nothing here hard-wires a parent: the "child classes
-- need a parent" rule is a trigger keyed off madrasa_classes.learner_type.
-- Madrasa teachers are org members, NOT teacher_profiles rows, so they can never be
-- listed on /teachers or booked through Stripe.

-- ---------------------------------------------------------------------------
-- 0. teacher_type: allow 'madrasa' and make such a row structurally unbookable
-- ---------------------------------------------------------------------------
ALTER TABLE public.teacher_profiles DROP CONSTRAINT IF EXISTS teacher_profiles_teacher_type_check;
ALTER TABLE public.teacher_profiles
  ADD CONSTRAINT teacher_profiles_teacher_type_check
  CHECK (teacher_type = ANY (ARRAY['platform'::text, 'independent'::text, 'madrasa'::text]));

CREATE OR REPLACE FUNCTION public.madrasa_force_unbookable()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $$
BEGIN
  IF NEW.teacher_type = 'madrasa' THEN
    NEW.is_accepting_bookings := false;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_madrasa_force_unbookable ON public.teacher_profiles;
CREATE TRIGGER trg_madrasa_force_unbookable
  BEFORE INSERT OR UPDATE ON public.teacher_profiles
  FOR EACH ROW EXECUTE FUNCTION public.madrasa_force_unbookable();

-- ---------------------------------------------------------------------------
-- 1. Organisations
-- ---------------------------------------------------------------------------
CREATE TABLE public.madrasa_organisations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.madrasa_org_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES public.madrasa_organisations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'teacher')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organisation_id, user_id)
);
CREATE INDEX madrasa_org_members_user_idx ON public.madrasa_org_members(user_id);

-- ---------------------------------------------------------------------------
-- 2. Classes, timetable, enrolments
-- ---------------------------------------------------------------------------
CREATE TABLE public.madrasa_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES public.madrasa_organisations(id) ON DELETE CASCADE,
  name text NOT NULL,
  subject_id uuid REFERENCES public.subjects(id),
  syllabus_reference text,                 -- citation only, e.g. 'Safar Islamic Studies Book 3'
  academic_year text,                      -- e.g. '2026/27'
  term text,                               -- e.g. 'Autumn'
  term_start date,
  term_end date,
  age_band text NOT NULL,                  -- e.g. 'Year 3, ages 7-8'
  learner_type text NOT NULL DEFAULT 'child' CHECK (learner_type IN ('child', 'adult')),
  teacher_id uuid REFERENCES public.profiles(id),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX madrasa_classes_org_idx ON public.madrasa_classes(organisation_id);
CREATE INDEX madrasa_classes_teacher_idx ON public.madrasa_classes(teacher_id);

-- One row per weekly slot, so any combination of days/times is expressible.
CREATE TABLE public.madrasa_class_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.madrasa_classes(id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),  -- 0 = Sunday
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_provisional boolean NOT NULL DEFAULT true,   -- true until the masjid confirms the real timetable
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_time > start_time),
  UNIQUE (class_id, day_of_week, start_time)
);

CREATE TABLE public.madrasa_class_enrolments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.madrasa_classes(id) ON DELETE CASCADE,
  learner_id uuid NOT NULL REFERENCES public.learners(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'withdrawn')),
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_id, learner_id)
);
CREATE INDEX madrasa_enrolments_learner_idx ON public.madrasa_class_enrolments(learner_id);

-- Child classes: every learner must be a child of a parent/guardian account. learners.parent_id is
-- NOT NULL platform-wide (adults are is_self = true rows whose parent_id is their own account), so the
-- enforceable rule is "no standalone self-account learners in a child class". Adult classes: no rule.
CREATE OR REPLACE FUNCTION public.madrasa_check_enrolment()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $$
DECLARE
  v_type text;
  v_self boolean;
BEGIN
  SELECT learner_type INTO v_type FROM public.madrasa_classes WHERE id = NEW.class_id;
  IF v_type = 'child' THEN
    SELECT COALESCE(is_self, false) INTO v_self FROM public.learners WHERE id = NEW.learner_id;
    IF v_self THEN
      RAISE EXCEPTION 'Child classes cannot enrol a self-account learner (learner %): children must belong to a parent account', NEW.learner_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_madrasa_check_enrolment
  BEFORE INSERT OR UPDATE OF class_id, learner_id ON public.madrasa_class_enrolments
  FOR EACH ROW EXECUTE FUNCTION public.madrasa_check_enrolment();

-- ---------------------------------------------------------------------------
-- 3. Scheme of work. Citation only: never store book text, scans or teacher-guide content.
-- ---------------------------------------------------------------------------
CREATE TABLE public.madrasa_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.madrasa_classes(id) ON DELETE CASCADE,
  unit_number integer NOT NULL,
  title text NOT NULL,
  description text,
  book_reference text,
  page_from integer,
  page_to integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_id, unit_number),
  CHECK (page_to IS NULL OR page_from IS NULL OR page_to >= page_from)
);

-- ---------------------------------------------------------------------------
-- 4. Sessions, covered units, attendance
-- ---------------------------------------------------------------------------
CREATE TABLE public.madrasa_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.madrasa_classes(id) ON DELETE CASCADE,
  session_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status text NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'taught', 'cancelled', 'teacher_absent')),
  taught_by uuid REFERENCES public.profiles(id),
  teacher_emphasis text,                   -- teacher's own free-text emphasis / homework instructions
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_time > start_time),
  UNIQUE (class_id, session_date, start_time)
);
CREATE INDEX madrasa_sessions_date_idx ON public.madrasa_sessions(session_date);

CREATE TABLE public.madrasa_session_units (
  session_id uuid NOT NULL REFERENCES public.madrasa_sessions(id) ON DELETE CASCADE,
  unit_id uuid NOT NULL REFERENCES public.madrasa_units(id) ON DELETE CASCADE,
  PRIMARY KEY (session_id, unit_id)
);
CREATE INDEX madrasa_session_units_unit_idx ON public.madrasa_session_units(unit_id);

CREATE TABLE public.madrasa_attendance (
  session_id uuid NOT NULL REFERENCES public.madrasa_sessions(id) ON DELETE CASCADE,
  learner_id uuid NOT NULL REFERENCES public.learners(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('present', 'absent')),
  marked_by uuid REFERENCES public.profiles(id),
  marked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, learner_id)
);
CREATE INDEX madrasa_attendance_learner_idx ON public.madrasa_attendance(learner_id);

-- ---------------------------------------------------------------------------
-- 5. Generated materials (draft -> published). Contains no child data.
-- ---------------------------------------------------------------------------
CREATE TABLE public.madrasa_session_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL UNIQUE REFERENCES public.madrasa_sessions(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  parent_notes text,                       -- markdown
  homework text,                           -- markdown
  teacher_activities jsonb NOT NULL DEFAULT '[]'::jsonb,   -- 3-4 {title, description, ...}
  ai_model text,
  generated_at timestamptz,
  edited_at timestamptz,
  published_at timestamptz,
  published_by uuid REFERENCES public.profiles(id),
  parents_notified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Lesson-prep activities generated from an upcoming unit, before any session exists.
CREATE TABLE public.madrasa_unit_prep (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL UNIQUE REFERENCES public.madrasa_units(id) ON DELETE CASCADE,
  teacher_activities jsonb NOT NULL DEFAULT '[]'::jsonb,
  ai_model text,
  generated_by uuid REFERENCES public.profiles(id),
  generated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 6. Per-student unit progress. catchup_* columns are for the future holiday/catch-up
--    mode; they stay NULL until that UI exists.
-- ---------------------------------------------------------------------------
CREATE TABLE public.madrasa_unit_progress (
  learner_id uuid NOT NULL REFERENCES public.learners(id) ON DELETE CASCADE,
  unit_id uuid NOT NULL REFERENCES public.madrasa_units(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.madrasa_classes(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('covered', 'missed', 'catchup_assigned', 'catchup_done')),
  session_id uuid REFERENCES public.madrasa_sessions(id) ON DELETE SET NULL,
  covered_at timestamptz,
  catchup_mode text,                       -- future: 'remote' | 'holiday' | 'in_person'
  catchup_assigned_at timestamptz,
  catchup_completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (learner_id, unit_id)
);
CREATE INDEX madrasa_unit_progress_class_idx ON public.madrasa_unit_progress(class_id);

-- ---------------------------------------------------------------------------
-- 7. updated_at triggers
-- ---------------------------------------------------------------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['madrasa_organisations','madrasa_classes','madrasa_units',
                           'madrasa_sessions','madrasa_session_materials','madrasa_unit_progress']
  LOOP
    EXECUTE format('CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON public.%I
                    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', t, t);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 8. Access helpers (SECURITY DEFINER so policies never recurse). Admin = public.is_admin().
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.madrasa_is_org_admin(p_org uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO '' AS $$
  SELECT public.is_admin() OR EXISTS (
    SELECT 1 FROM public.madrasa_org_members
    WHERE organisation_id = p_org AND user_id = auth.uid() AND role = 'admin');
$$;

CREATE OR REPLACE FUNCTION public.madrasa_is_org_member(p_org uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO '' AS $$
  SELECT public.is_admin() OR EXISTS (
    SELECT 1 FROM public.madrasa_org_members
    WHERE organisation_id = p_org AND user_id = auth.uid());
$$;

-- Teacher of this class, or an admin of its organisation.
CREATE OR REPLACE FUNCTION public.madrasa_can_manage_class(p_class uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.madrasa_classes c
    WHERE c.id = p_class
      AND (c.teacher_id = auth.uid() OR public.madrasa_is_org_admin(c.organisation_id)));
$$;

-- Any org member (any teacher/admin of the class's organisation) can read the class.
CREATE OR REPLACE FUNCTION public.madrasa_can_view_class(p_class uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.madrasa_classes c
    WHERE c.id = p_class AND public.madrasa_is_org_member(c.organisation_id));
$$;

-- The caller is the parent of an actively enrolled learner in this class.
CREATE OR REPLACE FUNCTION public.madrasa_is_parent_in_class(p_class uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.madrasa_class_enrolments e
    JOIN public.learners l ON l.id = e.learner_id
    WHERE e.class_id = p_class AND e.status = 'active' AND l.parent_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.madrasa_is_parent_of(p_learner uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.learners WHERE id = p_learner AND parent_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.madrasa_session_class(p_session uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO '' AS $$
  SELECT class_id FROM public.madrasa_sessions WHERE id = p_session;
$$;

-- Roster for teachers/admins: first name only (no age, DOB, parent or contact data).
CREATE OR REPLACE FUNCTION public.madrasa_class_roster(p_class_id uuid)
RETURNS TABLE (learner_id uuid, first_name text, status text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO '' AS $$
BEGIN
  IF NOT public.madrasa_can_view_class(p_class_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  RETURN QUERY
  SELECT l.id,
         COALESCE(NULLIF(l.first_name, ''), split_part(l.name, ' ', 1)),
         e.status
  FROM public.madrasa_class_enrolments e
  JOIN public.learners l ON l.id = e.learner_id
  WHERE e.class_id = p_class_id
  ORDER BY 2;
END;
$$;

-- Right-to-erasure: remove a learner's madrasa data without touching their 1:1 account.
-- (Deleting the learner row cascades through the same tables.)
CREATE OR REPLACE FUNCTION public.madrasa_erase_learner(p_learner uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
DECLARE
  n_prog int; n_att int; n_enr int;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin only';
  END IF;
  DELETE FROM public.madrasa_unit_progress WHERE learner_id = p_learner;  GET DIAGNOSTICS n_prog = ROW_COUNT;
  DELETE FROM public.madrasa_attendance WHERE learner_id = p_learner;     GET DIAGNOSTICS n_att = ROW_COUNT;
  DELETE FROM public.madrasa_class_enrolments WHERE learner_id = p_learner; GET DIAGNOSTICS n_enr = ROW_COUNT;
  RETURN jsonb_build_object('unit_progress', n_prog, 'attendance', n_att, 'enrolments', n_enr);
END;
$$;

-- ---------------------------------------------------------------------------
-- 9. Auto-marking progress when a session is closed as 'taught'.
--    present -> covered; explicit absent -> missed. Never downgrades covered / catch-up rows.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.madrasa_apply_session_progress(p_session uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
DECLARE
  v_class uuid;
BEGIN
  SELECT class_id INTO v_class FROM public.madrasa_sessions
  WHERE id = p_session AND status = 'taught';
  IF v_class IS NULL THEN RETURN; END IF;

  INSERT INTO public.madrasa_unit_progress (learner_id, unit_id, class_id, status, session_id, covered_at)
  SELECT a.learner_id, su.unit_id, v_class,
         CASE a.status WHEN 'present' THEN 'covered' ELSE 'missed' END,
         p_session,
         CASE a.status WHEN 'present' THEN now() END
  FROM public.madrasa_session_units su
  JOIN public.madrasa_attendance a ON a.session_id = su.session_id
  JOIN public.madrasa_class_enrolments e ON e.class_id = v_class AND e.learner_id = a.learner_id
  WHERE su.session_id = p_session
  ON CONFLICT (learner_id, unit_id) DO UPDATE
    SET status = EXCLUDED.status,
        session_id = EXCLUDED.session_id,
        covered_at = EXCLUDED.covered_at
    WHERE public.madrasa_unit_progress.status IN ('missed')   -- only upgrade a gap; never touch covered/catch-up rows
      AND EXCLUDED.status = 'covered';
END;
$$;

CREATE OR REPLACE FUNCTION public.madrasa_on_session_taught()
RETURNS trigger LANGUAGE plpgsql SET search_path TO '' AS $$
BEGIN
  IF NEW.status = 'taught' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'taught') THEN
    NEW.closed_at := COALESCE(NEW.closed_at, now());
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_madrasa_session_closed
  BEFORE INSERT OR UPDATE OF status ON public.madrasa_sessions
  FOR EACH ROW EXECUTE FUNCTION public.madrasa_on_session_taught();

CREATE OR REPLACE FUNCTION public.madrasa_after_session_taught()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
BEGIN
  IF NEW.status = 'taught' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'taught') THEN
    PERFORM public.madrasa_apply_session_progress(NEW.id);
  END IF;
  RETURN NULL;
END;
$$;
CREATE TRIGGER trg_madrasa_session_progress
  AFTER INSERT OR UPDATE OF status ON public.madrasa_sessions
  FOR EACH ROW EXECUTE FUNCTION public.madrasa_after_session_taught();

-- Attendance edited after the session was closed: re-apply.
CREATE OR REPLACE FUNCTION public.madrasa_after_attendance_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
BEGIN
  PERFORM public.madrasa_apply_session_progress(NEW.session_id);
  RETURN NULL;
END;
$$;
CREATE TRIGGER trg_madrasa_attendance_progress
  AFTER INSERT OR UPDATE ON public.madrasa_attendance
  FOR EACH ROW EXECUTE FUNCTION public.madrasa_after_attendance_change();

-- ---------------------------------------------------------------------------
-- 10. RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.madrasa_organisations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.madrasa_org_members        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.madrasa_classes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.madrasa_class_schedule     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.madrasa_class_enrolments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.madrasa_units              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.madrasa_sessions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.madrasa_session_units      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.madrasa_attendance         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.madrasa_session_materials  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.madrasa_unit_prep          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.madrasa_unit_progress      ENABLE ROW LEVEL SECURITY;

-- organisations
CREATE POLICY madrasa_orgs_select ON public.madrasa_organisations FOR SELECT TO authenticated
  USING (public.madrasa_is_org_member(id));
CREATE POLICY madrasa_orgs_admin ON public.madrasa_organisations FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- org members
CREATE POLICY madrasa_members_select ON public.madrasa_org_members FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR public.madrasa_is_org_admin(organisation_id));
CREATE POLICY madrasa_members_admin ON public.madrasa_org_members FOR ALL TO authenticated
  USING (public.madrasa_is_org_admin(organisation_id))
  WITH CHECK (public.madrasa_is_org_admin(organisation_id));

-- classes
CREATE POLICY madrasa_classes_select ON public.madrasa_classes FOR SELECT TO authenticated
  USING (public.madrasa_is_org_member(organisation_id) OR public.madrasa_is_parent_in_class(id));
CREATE POLICY madrasa_classes_write ON public.madrasa_classes FOR ALL TO authenticated
  USING (public.madrasa_is_org_admin(organisation_id))
  WITH CHECK (public.madrasa_is_org_admin(organisation_id));

-- schedule
CREATE POLICY madrasa_schedule_select ON public.madrasa_class_schedule FOR SELECT TO authenticated
  USING (public.madrasa_can_view_class(class_id) OR public.madrasa_is_parent_in_class(class_id));
CREATE POLICY madrasa_schedule_write ON public.madrasa_class_schedule FOR ALL TO authenticated
  USING (public.madrasa_can_manage_class(class_id))
  WITH CHECK (public.madrasa_can_manage_class(class_id));

-- enrolments (names come from madrasa_class_roster, never from reading learners directly)
CREATE POLICY madrasa_enrolments_select ON public.madrasa_class_enrolments FOR SELECT TO authenticated
  USING (public.madrasa_can_view_class(class_id) OR public.madrasa_is_parent_of(learner_id));
CREATE POLICY madrasa_enrolments_write ON public.madrasa_class_enrolments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.madrasa_classes c
                 WHERE c.id = class_id AND public.madrasa_is_org_admin(c.organisation_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.madrasa_classes c
                      WHERE c.id = class_id AND public.madrasa_is_org_admin(c.organisation_id)));

-- units
CREATE POLICY madrasa_units_select ON public.madrasa_units FOR SELECT TO authenticated
  USING (public.madrasa_can_view_class(class_id) OR public.madrasa_is_parent_in_class(class_id));
CREATE POLICY madrasa_units_write ON public.madrasa_units FOR ALL TO authenticated
  USING (public.madrasa_can_manage_class(class_id))
  WITH CHECK (public.madrasa_can_manage_class(class_id));

-- sessions
CREATE POLICY madrasa_sessions_select ON public.madrasa_sessions FOR SELECT TO authenticated
  USING (public.madrasa_can_view_class(class_id) OR public.madrasa_is_parent_in_class(class_id));
CREATE POLICY madrasa_sessions_write ON public.madrasa_sessions FOR ALL TO authenticated
  USING (public.madrasa_can_manage_class(class_id))
  WITH CHECK (public.madrasa_can_manage_class(class_id));

-- session units
CREATE POLICY madrasa_session_units_select ON public.madrasa_session_units FOR SELECT TO authenticated
  USING (public.madrasa_can_view_class(public.madrasa_session_class(session_id))
         OR public.madrasa_is_parent_in_class(public.madrasa_session_class(session_id)));
CREATE POLICY madrasa_session_units_write ON public.madrasa_session_units FOR ALL TO authenticated
  USING (public.madrasa_can_manage_class(public.madrasa_session_class(session_id)))
  WITH CHECK (public.madrasa_can_manage_class(public.madrasa_session_class(session_id)));

-- attendance: teachers see the class, parents see only their own child
CREATE POLICY madrasa_attendance_select ON public.madrasa_attendance FOR SELECT TO authenticated
  USING (public.madrasa_can_view_class(public.madrasa_session_class(session_id))
         OR public.madrasa_is_parent_of(learner_id));
CREATE POLICY madrasa_attendance_write ON public.madrasa_attendance FOR ALL TO authenticated
  USING (public.madrasa_can_manage_class(public.madrasa_session_class(session_id)))
  WITH CHECK (public.madrasa_can_manage_class(public.madrasa_session_class(session_id)));

-- materials: parents only see PUBLISHED notes for classes their child is in
CREATE POLICY madrasa_materials_select ON public.madrasa_session_materials FOR SELECT TO authenticated
  USING (public.madrasa_can_view_class(public.madrasa_session_class(session_id))
         OR (status = 'published'
             AND public.madrasa_is_parent_in_class(public.madrasa_session_class(session_id))));
CREATE POLICY madrasa_materials_write ON public.madrasa_session_materials FOR ALL TO authenticated
  USING (public.madrasa_can_manage_class(public.madrasa_session_class(session_id)))
  WITH CHECK (public.madrasa_can_manage_class(public.madrasa_session_class(session_id)));

-- unit prep: teacher-facing only
CREATE POLICY madrasa_unit_prep_select ON public.madrasa_unit_prep FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.madrasa_units u
                 WHERE u.id = unit_id AND public.madrasa_can_view_class(u.class_id)));
CREATE POLICY madrasa_unit_prep_write ON public.madrasa_unit_prep FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.madrasa_units u
                 WHERE u.id = unit_id AND public.madrasa_can_manage_class(u.class_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.madrasa_units u
                      WHERE u.id = unit_id AND public.madrasa_can_manage_class(u.class_id)));

-- progress: written by the SECURITY DEFINER trigger; read-only for everyone except admin
CREATE POLICY madrasa_progress_select ON public.madrasa_unit_progress FOR SELECT TO authenticated
  USING (public.madrasa_can_view_class(class_id) OR public.madrasa_is_parent_of(learner_id));
CREATE POLICY madrasa_progress_admin ON public.madrasa_unit_progress FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- 11. Function privileges: signed-in users only
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.madrasa_class_roster(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.madrasa_erase_learner(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.madrasa_apply_session_progress(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.madrasa_class_roster(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.madrasa_erase_learner(uuid) TO authenticated;
