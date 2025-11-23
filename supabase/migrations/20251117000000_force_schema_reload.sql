-- Force PostgREST schema cache reload by making a benign DDL change
COMMENT ON TABLE teacher_profiles IS 'Teacher profile information including tier data';

-- Also ensure the view exists and is accessible
COMMENT ON VIEW teacher_tier_stats IS 'Consolidated view of teacher profiles with tier information';
