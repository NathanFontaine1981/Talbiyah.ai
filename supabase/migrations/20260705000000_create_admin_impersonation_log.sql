-- Admin "act as student" impersonation audit log.
-- Idempotent: safe to run repeatedly in the Supabase SQL editor.
-- Only the service-role edge functions (admin-start-impersonation /
-- admin-end-impersonation) write to this table; admins may read it.

create table if not exists public.admin_impersonation_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references auth.users(id),
  target_user_id uuid not null references auth.users(id),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  ip inet,
  user_agent text
);

alter table public.admin_impersonation_log enable row level security;

do $$ begin
  create policy "Admins read impersonation log"
    on public.admin_impersonation_log for select
    using (
      exists (
        select 1 from public.profiles p
        where p.id = auth.uid()
          and 'admin' = any(p.roles)
      )
    );
exception when duplicate_object then null; end $$;

-- No INSERT/UPDATE/DELETE policy: writes go exclusively through the
-- service-role edge functions, which bypass RLS.

create index if not exists idx_impersonation_admin
  on public.admin_impersonation_log(admin_id);
create index if not exists idx_impersonation_target
  on public.admin_impersonation_log(target_user_id);
