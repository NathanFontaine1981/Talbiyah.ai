-- Auto-enrol new signups who attend Cheadle Masjid into "Revert Unshakeable
-- Foundations" (group_sessions.id = a154368c-3bf1-495c-8c7f-069572c1f794),
-- so they get study notes + online access to the weekly lesson even when
-- they can't attend in person.
--
-- Driven by a new `attends_cheadle_masjid` boolean in auth.users.raw_user_meta_data,
-- set by the sign-up form (src/pages/SignUp.tsx). Runs inside handle_new_user()
-- (SECURITY DEFINER) so it fires immediately on signup regardless of role or
-- whether email confirmation is still pending.

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

  -- TODO(phone-parsing): the greedy ^(\+\d{1,3}) split mis-parses UNSPACED numbers: '+447000000001'
  -- becomes country code '+447' / number '000000001'. It only works when the signup form sends
  -- '+44 7000000001' (with a space). Affects every signup path that sends an unspaced number.
  -- Needs its own focused change (match against a known country-code list) with tests. Not fixed here.
  v_raw_phone := NEW.raw_user_meta_data->>'phone';
  IF v_raw_phone IS NOT NULL AND v_raw_phone != '' THEN
    v_country_code := (regexp_match(v_raw_phone, '^(\+\d{1,3})'))[1];
    v_phone_number := trim(regexp_replace(v_raw_phone, '^\+\d{1,3}\s*', ''));
  END IF;

  INSERT INTO public.profiles (
    id, full_name, phone, phone_number, phone_country_code,
    role, roles, referral_code, onboarding_completed
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    v_raw_phone, v_phone_number, COALESCE(v_country_code, '+44'),
    v_selected_role, v_roles, v_referral_code,
    v_selected_role != 'parent'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    phone_number = COALESCE(EXCLUDED.phone_number, profiles.phone_number),
    phone_country_code = COALESCE(EXCLUDED.phone_country_code, profiles.phone_country_code),
    role = COALESCE(EXCLUDED.role, profiles.role),
    roles = COALESCE(EXCLUDED.roles, profiles.roles),
    referral_code = COALESCE(EXCLUDED.referral_code, profiles.referral_code),
    onboarding_completed = COALESCE(EXCLUDED.onboarding_completed, profiles.onboarding_completed);

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
  v_attends_cheadle_masjid := COALESCE((NEW.raw_user_meta_data->>'attends_cheadle_masjid')::boolean, false);
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
