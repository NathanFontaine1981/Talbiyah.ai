-- Payout pipeline fixes, applied to production Jul 11 2026 (via Management API).
-- Found during live system testing (SYSTEM_TEST_CHECKLIST.md Test 2): the teacher-pay
-- pipeline was broken end-to-end — earnings trigger disabled, missing unique constraint
-- crashed it when enabled, held earnings never cleared, and no legacy-billing exemption.
-- Idempotent: safe to re-run.

-- 1. teacher_earnings needs one-row-per-lesson for the trigger's ON CONFLICT (lesson_id).
--    Without this, marking a lesson completed crashed — which is why the trigger had
--    been disabled (silently killing all teacher pay).
DO $do$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'teacher_earnings_lesson_id_unique') THEN
    ALTER TABLE teacher_earnings ADD CONSTRAINT teacher_earnings_lesson_id_unique UNIQUE (lesson_id);
  END IF;
END $do$;

-- 2. The referral-commission trigger function (shelved feature, still wired) referenced
--    teacher_profiles unqualified while the outer earnings trigger runs with an empty
--    search_path — every earnings insert exploded. Pin its search_path.
ALTER FUNCTION public.create_referral_commission_on_earning() SET search_path TO 'public';

-- 3. Recreate the earnings trigger function with a legacy-billing exemption:
--    teachers paid outside the platform (is_legacy_teacher, e.g. paid by their imam)
--    accrue no platform earnings.
CREATE OR REPLACE FUNCTION public.create_teacher_earning_on_lesson_complete()
RETURNS trigger LANGUAGE plpgsql SET search_path TO '' AS $function$
DECLARE
  v_teacher_rate numeric;
  v_duration_hours numeric;
  v_amount_earned numeric;
  v_platform_fee numeric;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Legacy-billed teachers (paid outside the platform, e.g. by their imam) accrue no earnings
    IF EXISTS (SELECT 1 FROM public.teacher_profiles WHERE id = NEW.teacher_id AND COALESCE(is_legacy_teacher, false)) THEN
      RETURN NEW;
    END IF;
    v_teacher_rate := COALESCE(NEW.teacher_rate_at_booking, 0);
    v_duration_hours := NEW.duration_minutes / 60.0;
    v_amount_earned := v_teacher_rate * v_duration_hours;
    v_platform_fee := COALESCE(NEW.platform_fee, 0);
    INSERT INTO public.teacher_earnings (lesson_id, teacher_id, amount_earned, platform_fee, total_lesson_cost, currency, status, lesson_completed_at, hold_period_days, cleared_at)
    VALUES (NEW.id, NEW.teacher_id, v_amount_earned, v_platform_fee, COALESCE(NEW.total_cost_paid, v_amount_earned + v_platform_fee), COALESCE(NEW.payment_currency, 'gbp'), 'held', NOW(), 7, NOW() + INTERVAL '7 days')
    ON CONFLICT (lesson_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;

-- 4. Re-enable the earnings trigger (was tgenabled='D' — disabled — since the constraint crash).
ALTER TABLE lessons ENABLE TRIGGER trigger_create_earning_on_lesson_complete;

-- 5. pg_cron: clear held earnings daily at 03:00 UTC (nothing ever ran clear_held_earnings;
--    Osama's Nov-2025 earnings sat 'held' 7 months past their cleared_at date).
--    NB: create via SQL editor with the service-role key in the Authorization header,
--    same pattern as the sweep-failed-recordings job. See cron.job for the live version.

-- Data fixes applied alongside (one-off, not repeatable):
--   * Osama Muhammad: 2 held earnings (£8, Nov 2025) cancelled — legacy-billed, paid by imam;
--     is_legacy_teacher set true.
--   * Skipped backfilling 54 historical completed lessons with no earnings (teachers were
--     settled outside the platform). Pipeline records earnings from Jul 11 2026 onward.
