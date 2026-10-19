-- 1) Admin approval fix
-- Admins could not approve/reject teachers because teacher_profiles had no admin
-- UPDATE policy — only "Teachers can update own profile" (user_id = auth.uid()).
-- Clicking Approve in the admin UI silently matched 0 rows, so teachers stayed pending.
drop policy if exists "Admins can update teacher profiles" on public.teacher_profiles;
create policy "Admins can update teacher profiles"
on public.teacher_profiles
for update
using (
  exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid())
      and 'admin' = any (profiles.roles)
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid())
      and 'admin' = any (profiles.roles)
  )
);

-- Approve Mariam Galal Aref (was stuck pending due to the missing policy above)
update public.teacher_profiles
set status = 'approved', updated_at = now()
where id = '995a2a93-a604-41be-8ea3-326c0509451f'
  and status = 'pending_approval';

-- NOTE: The original version of this migration also (a) rewrote teacher_tiers to a
-- unified £3–£7 pay scale and retroactively rescaled platform teachers' hourly_rate,
-- and (b) disabled the trigger_auto_promote_teacher trigger. Those pay-policy changes
-- were intentionally REMOVED — only the safe admin RLS fixes and the single approval
-- are kept. Re-introduce the pay changes deliberately if/when that model is adopted.

-- 2) Let admins set which subjects a teacher is bookable for. teacher_subjects
-- previously only had a "Teachers can manage own subjects" write policy, so the
-- admin subject selector would have been blocked by RLS.
drop policy if exists "Admins can manage teacher subjects" on public.teacher_subjects;
create policy "Admins can manage teacher subjects"
on public.teacher_subjects
for all
using (
  exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid())
      and 'admin' = any (profiles.roles)
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid())
      and 'admin' = any (profiles.roles)
  )
);
