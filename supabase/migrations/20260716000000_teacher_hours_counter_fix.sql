-- Teacher hours/lessons counter fix, applied Jul 16 2026 (via Management API).
-- Found during live system testing (SYSTEM_TEST_CHECKLIST.md Test 6): teacher_profiles
-- hours_taught/completed_lessons never updates in normal operation. The only code that
-- writes those columns is the check-tier-progression edge function, which nothing in the
-- app ever calls. Real data confirmed the drift, e.g. Osama Muhammad showed 2.00 hrs/2
-- lessons recorded vs 55 actual completed lessons (52.5 hrs).
--
-- Scope is deliberately narrow: this ONLY keeps the informational hours/lessons counter
-- in sync. It does NOT wire up tier promotion or bonus payments — auto-promotion was
-- intentionally disabled in June 2026 (trigger_auto_promote_teacher is tgenabled='D';
-- see memory teacher-pay-model.md) because it paid teachers too much too fast. The
-- check-tier-progression edge function's tier/bonus logic is also independently broken
-- (references teacher_tiers.tier_order/min_hours which don't exist — real columns are
-- tier_level/min_hours_taught — and two tables, tier_milestone_bonuses and
-- teacher_bonus_payments, that don't exist at all). None of that is touched here.
-- Idempotent: safe to re-run.

CREATE OR REPLACE FUNCTION public.sync_teacher_hours_counter()
RETURNS trigger LANGUAGE plpgsql SET search_path TO '' AS $function$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE public.teacher_profiles
    SET hours_taught = COALESCE(hours_taught, 0) + COALESCE(NEW.duration_minutes, 0) / 60.0,
        completed_lessons = COALESCE(completed_lessons, 0) + 1
    WHERE id = NEW.teacher_id;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_lesson_completed_update_teacher_hours ON lessons;
CREATE TRIGGER on_lesson_completed_update_teacher_hours
  AFTER INSERT OR UPDATE ON lessons
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_teacher_hours_counter();

-- Backfill: correct existing teachers' counters to match real completed-lesson history.
UPDATE teacher_profiles tp
SET hours_taught = COALESCE(l.hrs, 0),
    completed_lessons = COALESCE(l.cnt, 0)
FROM (
  SELECT teacher_id, COUNT(*) AS cnt, SUM(duration_minutes) / 60.0 AS hrs
  FROM lessons
  WHERE status = 'completed'
  GROUP BY teacher_id
) l
WHERE tp.id = l.teacher_id
  AND (tp.hours_taught IS DISTINCT FROM COALESCE(l.hrs, 0)
       OR tp.completed_lessons IS DISTINCT FROM COALESCE(l.cnt, 0));

-- Zero out any teacher with no completed lessons but a stale nonzero counter.
UPDATE teacher_profiles tp
SET hours_taught = 0, completed_lessons = 0
WHERE NOT EXISTS (
  SELECT 1 FROM lessons l WHERE l.teacher_id = tp.id AND l.status = 'completed'
)
AND (COALESCE(tp.hours_taught, 0) != 0 OR COALESCE(tp.completed_lessons, 0) != 0);
