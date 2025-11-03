/*
  # Fix Function Search Paths for Security - Final

  1. Security Enhancement
    - Set secure search_path for all functions to prevent SQL injection
    - Only recreate functions and triggers that actually exist in the schema
*/

-- Drop triggers that exist
DROP TRIGGER IF EXISTS assign_referral_code_trigger ON public.learners;
DROP TRIGGER IF EXISTS sync_teacher_approval_trigger ON public.teacher_profiles;
DROP TRIGGER IF EXISTS update_referral_credits_trigger ON public.referrals;
DROP TRIGGER IF EXISTS update_ayah_progress_timestamp ON public.ayah_progress;

-- Drop functions
DROP FUNCTION IF EXISTS public.cleanup_expired_cart_items() CASCADE;
DROP FUNCTION IF EXISTS public.assign_referral_code() CASCADE;
DROP FUNCTION IF EXISTS public.get_latest_khutbah_reflection() CASCADE;
DROP FUNCTION IF EXISTS public.sync_approved_teacher_status() CASCADE;
DROP FUNCTION IF EXISTS public.update_referral_credits() CASCADE;
DROP FUNCTION IF EXISTS public.get_chat_history(text, int) CASCADE;
DROP FUNCTION IF EXISTS public.redeem_points_for_credits(uuid, integer, numeric) CASCADE;
DROP FUNCTION IF EXISTS public.update_ayah_progress_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.generate_referral_code() CASCADE;

-- Recreate generate_referral_code first
CREATE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_code text;
  v_exists boolean;
BEGIN
  LOOP
    v_code := upper(substring(md5(random()::text) from 1 for 8));
    SELECT EXISTS(SELECT 1 FROM public.learners WHERE referral_code = v_code) INTO v_exists;
    IF NOT v_exists THEN
      RETURN v_code;
    END IF;
  END LOOP;
END;
$$;

-- Recreate all functions with secure search paths
CREATE FUNCTION public.cleanup_expired_cart_items()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  DELETE FROM public.cart_items WHERE expires_at < NOW();
END;
$$;

CREATE FUNCTION public.assign_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := public.generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE FUNCTION public.get_latest_khutbah_reflection()
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  action_points text[],
  published_date date,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  RETURN QUERY
  SELECT kr.id, kr.title, kr.content, kr.action_points, kr.published_date, kr.created_at
  FROM public.khutbah_reflections kr
  WHERE kr.published_date <= CURRENT_DATE
  ORDER BY kr.published_date DESC
  LIMIT 1;
END;
$$;

CREATE FUNCTION public.sync_approved_teacher_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    UPDATE public.profiles SET is_approved_teacher = true WHERE id = NEW.user_id;
  ELSIF NEW.status != 'approved' AND OLD.status = 'approved' THEN
    UPDATE public.profiles SET is_approved_teacher = false WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE FUNCTION public.update_referral_credits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_hours_completed numeric;
  v_credits_to_add numeric;
BEGIN
  IF NEW.hours_completed > OLD.hours_completed THEN
    v_hours_completed := NEW.hours_completed - OLD.hours_completed;
    v_credits_to_add := v_hours_completed / 10;
    UPDATE public.learners SET learning_credits = learning_credits + v_credits_to_add WHERE id = NEW.referrer_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE FUNCTION public.get_chat_history(p_session_id text, p_limit int DEFAULT 50)
RETURNS TABLE (
  id uuid,
  question text,
  answer text,
  source_references jsonb,
  jurisprudence_note text,
  is_complex_referral boolean,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  RETURN QUERY
  SELECT cc.id, cc.question, cc.answer, cc.source_references, cc.jurisprudence_note, 
         cc.is_complex_referral, cc.created_at
  FROM public.chat_conversations cc WHERE cc.session_id = p_session_id
  ORDER BY cc.created_at DESC LIMIT p_limit;
END;
$$;

CREATE FUNCTION public.redeem_points_for_credits(
  p_learner_id uuid,
  p_points_to_redeem integer,
  p_credits_to_receive numeric
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_current_xp integer;
BEGIN
  SELECT total_xp INTO v_current_xp FROM public.learners WHERE id = p_learner_id FOR UPDATE;
  IF v_current_xp >= p_points_to_redeem THEN
    UPDATE public.learners SET total_xp = total_xp - p_points_to_redeem, learning_credits = learning_credits + p_credits_to_receive WHERE id = p_learner_id;
    INSERT INTO public.credit_redemptions (learner_id, points_spent, credits_received) VALUES (p_learner_id, p_points_to_redeem, p_credits_to_receive);
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$;

CREATE FUNCTION public.update_ayah_progress_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Recreate triggers
CREATE TRIGGER assign_referral_code_trigger
  BEFORE INSERT ON public.learners
  FOR EACH ROW EXECUTE FUNCTION public.assign_referral_code();

CREATE TRIGGER sync_teacher_approval_trigger
  AFTER UPDATE OF status ON public.teacher_profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_approved_teacher_status();

CREATE TRIGGER update_referral_credits_trigger
  AFTER UPDATE OF hours_completed ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION public.update_referral_credits();

CREATE TRIGGER update_ayah_progress_timestamp
  BEFORE UPDATE ON public.ayah_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_ayah_progress_updated_at();
