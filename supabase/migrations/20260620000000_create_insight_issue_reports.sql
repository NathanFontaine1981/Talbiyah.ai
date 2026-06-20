-- Lets a student/parent (or teacher) report that a lesson's insights haven't come through.
-- Each report is logged here, an admin alert email is sent, and recovery is auto-triggered.
create table if not exists public.insight_issue_reports (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  learner_id uuid references public.learners(id) on delete set null,
  reported_by uuid references auth.users(id) on delete set null,
  reporter_email text,
  description text,
  status text not null default 'open',
  recovery_triggered boolean not null default false,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists insight_issue_reports_lesson_id_idx on public.insight_issue_reports(lesson_id);
create index if not exists insight_issue_reports_status_idx on public.insight_issue_reports(status);

alter table public.insight_issue_reports enable row level security;

-- Authenticated users can file a report for themselves
drop policy if exists "users can insert own insight issue reports" on public.insight_issue_reports;
create policy "users can insert own insight issue reports"
  on public.insight_issue_reports for insert to authenticated
  with check (reported_by = auth.uid());

-- Admins can read all reports
drop policy if exists "admins can read insight issue reports" on public.insight_issue_reports;
create policy "admins can read insight issue reports"
  on public.insight_issue_reports for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Admins can update (e.g. mark resolved)
drop policy if exists "admins can update insight issue reports" on public.insight_issue_reports;
create policy "admins can update insight issue reports"
  on public.insight_issue_reports for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
