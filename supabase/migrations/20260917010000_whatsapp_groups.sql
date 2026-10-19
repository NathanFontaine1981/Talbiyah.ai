-- Cheadle Masjid WhatsApp activity groups (Fajr Hiking Club, Fajr Cycle Club, etc.)
-- shown on the dashboard to anyone who attends Cheadle Masjid.

-- 1) Durable, directly-queryable flag (was previously only in
--    auth.users.raw_user_meta_data, one-time-read at signup by handle_new_user()).
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS attends_cheadle_masjid boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_selected_role text;
  v_roles text[];
  v_referral_code text;
  v_raw_phone text;
  v_country_code text;
  v_phone_number text;
  v_attends_cheadle_masjid boolean;
BEGIN
  v_selected_role := COALESCE(NEW.raw_user_meta_data->>'selected_role', 'student');

  IF v_selected_role = 'parent' THEN
    v_roles := ARRAY['student', 'parent']::text[];
  ELSIF v_selected_role = 'explorer' THEN
    v_roles := ARRAY['explorer']::text[];
  ELSE
    v_roles := ARRAY[v_selected_role]::text[];
  END IF;

  IF v_selected_role != 'explorer' THEN
    v_referral_code := upper(substring(md5(random()::text) from 1 for 6));
  END IF;

  v_raw_phone := NEW.raw_user_meta_data->>'phone';
  IF v_raw_phone IS NOT NULL AND v_raw_phone != '' THEN
    v_country_code := (regexp_match(v_raw_phone, '^(\+\d{1,3})'))[1];
    v_phone_number := trim(regexp_replace(v_raw_phone, '^\+\d{1,3}\s*', ''));
  END IF;

  v_attends_cheadle_masjid := COALESCE((NEW.raw_user_meta_data->>'attends_cheadle_masjid')::boolean, false);

  INSERT INTO public.profiles (
    id, full_name, phone, phone_number, phone_country_code,
    role, roles, referral_code, onboarding_completed, attends_cheadle_masjid
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    v_raw_phone, v_phone_number, COALESCE(v_country_code, '+44'),
    v_selected_role, v_roles, v_referral_code,
    v_selected_role != 'parent', v_attends_cheadle_masjid
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    phone_number = COALESCE(EXCLUDED.phone_number, profiles.phone_number),
    phone_country_code = COALESCE(EXCLUDED.phone_country_code, profiles.phone_country_code),
    role = COALESCE(EXCLUDED.role, profiles.role),
    roles = COALESCE(EXCLUDED.roles, profiles.roles),
    referral_code = COALESCE(EXCLUDED.referral_code, profiles.referral_code),
    onboarding_completed = COALESCE(EXCLUDED.onboarding_completed, profiles.onboarding_completed),
    attends_cheadle_masjid = profiles.attends_cheadle_masjid OR EXCLUDED.attends_cheadle_masjid;

  INSERT INTO public.user_credits (user_id, credits_remaining, total_credits_purchased, total_credits_used)
  VALUES (NEW.id, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- Auto-create teacher profile with pending_approval status for admin review
  IF v_selected_role = 'teacher' THEN
    INSERT INTO public.teacher_profiles (
      id, user_id, status, hourly_rate, tier,
      is_accepting_bookings, is_talbiyah_certified, created_at, updated_at
    )
    VALUES (
      gen_random_uuid(), NEW.id, 'pending_approval', 7, 'newcomer',
      true, false, now(), now()
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  -- Auto-enrol Cheadle Masjid attendees into "Unshakeable Foundations"
  IF v_attends_cheadle_masjid THEN
    INSERT INTO public.group_session_participants (group_session_id, student_id)
    VALUES ('a154368c-3bf1-495c-8c7f-069572c1f794', NEW.id)
    ON CONFLICT (group_session_id, student_id) DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user failed for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$function$;

-- Backfill the flag for the handful of Cheadle Masjid attendees already
-- enrolled via the previous (enrolment-only) version of this trigger.
UPDATE public.profiles
SET attends_cheadle_masjid = true
WHERE id IN (
  SELECT student_id FROM public.group_session_participants
  WHERE group_session_id = 'a154368c-3bf1-495c-8c7f-069572c1f794'
) AND attends_cheadle_masjid = false;

-- 2) WhatsApp activity/hobby groups
CREATE TABLE IF NOT EXISTS public.whatsapp_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  whatsapp_url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone signed in can view active whatsapp groups"
  ON public.whatsapp_groups FOR SELECT
  TO authenticated
  USING (is_active = true);

INSERT INTO public.whatsapp_groups (title, whatsapp_url, sort_order) VALUES
  ('Fajr Hiking Club', 'https://chat.whatsapp.com/Eut9xsA2Wu6F9JfmJNfHF2?s=sw&p=i&mlu=4&ilr=4', 1),
  ('Fajr Cycle Club', 'https://chat.whatsapp.com/J3XBts8iOKc2gEWJQzBxC1?s=sw&p=i&mlu=4&ilr=4', 2),
  ('Fajr Padel Club', 'https://chat.whatsapp.com/FdZv6sBreOJ53moetoWEwd?s=sw&p=i&mlu=4&ilr=4', 3),
  ('Fajr Run Club', 'https://chat.whatsapp.com/K1IHhHrm78C5eLtcJPDp6t?s=sw&p=a&mlu=4&ilr=4', 4);
