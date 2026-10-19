-- One row per email attempt about a session's notes. Makes publish idempotent: the unique index below
-- guarantees a parent gets at most ONE 'publish' email per session, even on a double-click or retry.
-- Re-emailing after an edit is an explicit 'update' kind (not unique).
CREATE TABLE public.madrasa_notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.madrasa_sessions(id) ON DELETE CASCADE,
  parent_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('publish', 'update')),
  status text NOT NULL CHECK (status IN ('sent', 'skipped_test_address', 'no_email', 'error')),
  provider_message_id text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- Only a real send claims the slot: a skipped test address must not stop a later real email.
CREATE UNIQUE INDEX madrasa_notification_publish_once
  ON public.madrasa_notification_log (session_id, parent_id)
  WHERE kind = 'publish' AND status = 'sent';
CREATE INDEX madrasa_notification_session_idx ON public.madrasa_notification_log (session_id);

ALTER TABLE public.madrasa_notification_log ENABLE ROW LEVEL SECURITY;
-- Teachers/admins of the class can see what was sent. Parents and everyone else: nothing. Writes: service role only.
CREATE POLICY madrasa_notification_log_select ON public.madrasa_notification_log FOR SELECT TO authenticated
  USING (public.madrasa_can_manage_class(public.madrasa_session_class(session_id)));
