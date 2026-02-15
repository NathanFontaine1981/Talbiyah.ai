import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface UseSelfLearnerResult {
  learnerId: string | null;
  loading: boolean;
  error: string | null;
}

/**
 * Shared hook that resolves the current user's "self" learner record.
 * Uses the `is_self` column to find the correct learner, avoiding the
 * .maybeSingle() crash when multiple learner records exist.
 *
 * If no is_self record exists, creates one automatically.
 */
export function useSelfLearner(): UseSelfLearnerResult {
  const [learnerId, setLearnerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (!cancelled) setError('Not authenticated');
          return;
        }

        // Try to find the is_self learner
        const { data: selfLearner, error: fetchError } = await supabase
          .from('learners')
          .select('id')
          .eq('parent_id', user.id)
          .eq('is_self', true)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (selfLearner) {
          if (!cancelled) setLearnerId(selfLearner.id);
          return;
        }

        // No is_self learner found - check if any learners exist
        const { data: allLearners } = await supabase
          .from('learners')
          .select('id')
          .eq('parent_id', user.id);

        if (allLearners && allLearners.length === 1) {
          // Single learner exists but not marked as is_self - mark it
          const { error: updateError } = await supabase
            .from('learners')
            .update({ is_self: true })
            .eq('id', allLearners[0].id);

          if (updateError) throw updateError;
          if (!cancelled) setLearnerId(allLearners[0].id);
          return;
        }

        if (allLearners && allLearners.length > 1) {
          // Multiple learners but none marked is_self - pick the one with most progress
          for (const l of allLearners) {
            const { count } = await supabase
              .from('ayah_progress')
              .select('*', { count: 'exact', head: true })
              .eq('learner_id', l.id);
            if (count && count > 0) {
              const { error: updateError } = await supabase
                .from('learners')
                .update({ is_self: true })
                .eq('id', l.id);
              if (updateError) throw updateError;
              if (!cancelled) setLearnerId(l.id);
              return;
            }
          }
          // No progress on any - mark the first one
          const { error: updateError } = await supabase
            .from('learners')
            .update({ is_self: true })
            .eq('id', allLearners[0].id);
          if (updateError) throw updateError;
          if (!cancelled) setLearnerId(allLearners[0].id);
          return;
        }

        // No learners at all - create one
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .maybeSingle();

        const { data: newLearner, error: insertError } = await supabase
          .from('learners')
          .insert({
            parent_id: user.id,
            name: profile?.full_name || 'Student',
            is_self: true,
            gamification_points: 0,
          })
          .select('id')
          .single();

        if (insertError) throw insertError;
        if (!cancelled) setLearnerId(newLearner.id);
      } catch (err: any) {
        console.error('useSelfLearner error:', err);
        if (!cancelled) setError(err.message || 'Failed to resolve learner');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    resolve();
    return () => { cancelled = true; };
  }, []);

  return { learnerId, loading, error };
}
