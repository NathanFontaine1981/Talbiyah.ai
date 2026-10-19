-- Comment-only. No schema/data change.
--
-- TODO(cleanup): matchmaking_profiles is orphaned. It was created for a
-- matchmaking/marriage-profile product that has since moved to its own
-- codebase. Nothing in src/ references this table; it's only touched by
-- account-deletion cleanup (cleanup-deleted-users, hard-delete-user edge
-- functions). Drop the table (and remove those two cleanup references)
-- in a future migration once confirmed the other codebase owns this data.
COMMENT ON TABLE matchmaking_profiles IS
  'TODO(cleanup): orphaned - matchmaking product moved to its own codebase (noted 2026-08-23). Drop in a future migration.';
