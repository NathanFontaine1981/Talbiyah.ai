-- ┌────────────────────────────────────────────────────────────────────┐
-- │ TEACHER ENROLLMENT AGREEMENT                                        │
-- │ Records a teacher's acceptance of the Talbiyah teaching covenant.   │
-- │ Approved teachers must read & confirm before accessing the teacher  │
-- │ area (enforced client-side in ProtectedRoute).                      │
-- └────────────────────────────────────────────────────────────────────┘

ALTER TABLE teacher_profiles
  ADD COLUMN IF NOT EXISTS agreement_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS agreement_version text,
  ADD COLUMN IF NOT EXISTS agreement_signed_name text;

COMMENT ON COLUMN teacher_profiles.agreement_accepted_at IS 'When the teacher accepted the teaching agreement (null = not yet accepted).';
COMMENT ON COLUMN teacher_profiles.agreement_version IS 'Version string of the agreement the teacher accepted (re-prompt if it changes).';
COMMENT ON COLUMN teacher_profiles.agreement_signed_name IS 'Full name the teacher typed as their signature.';
