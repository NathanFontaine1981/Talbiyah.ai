import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const results: string[] = [];

    // Step 1: Drop all existing policies on arabic_learner_progress
    const dropPolicies = `
      DROP POLICY IF EXISTS "arabic_learner_progress_select_policy" ON arabic_learner_progress;
      DROP POLICY IF EXISTS "arabic_learner_progress_insert_policy" ON arabic_learner_progress;
      DROP POLICY IF EXISTS "arabic_learner_progress_update_policy" ON arabic_learner_progress;
      DROP POLICY IF EXISTS "arabic_learner_progress_delete_policy" ON arabic_learner_progress;
      DROP POLICY IF EXISTS "arabic_progress_select" ON arabic_learner_progress;
      DROP POLICY IF EXISTS "arabic_progress_insert" ON arabic_learner_progress;
      DROP POLICY IF EXISTS "arabic_progress_update" ON arabic_learner_progress;
      DROP POLICY IF EXISTS "arabic_progress_delete" ON arabic_learner_progress;
      DROP POLICY IF EXISTS "Users can view own progress" ON arabic_learner_progress;
      DROP POLICY IF EXISTS "Teachers can view student progress" ON arabic_learner_progress;
      DROP POLICY IF EXISTS "Teachers can insert progress" ON arabic_learner_progress;
      DROP POLICY IF EXISTS "Teachers can update progress" ON arabic_learner_progress;
    `;

    const { error: dropError } = await supabase.rpc('exec_sql', { sql: dropPolicies });
    if (dropError) {
      results.push(`Drop policies: ${dropError.message}`);
    } else {
      results.push('Drop policies: success');
    }

    // Step 2: Enable RLS
    const enableRLS = `ALTER TABLE arabic_learner_progress ENABLE ROW LEVEL SECURITY;`;
    const { error: rlsError } = await supabase.rpc('exec_sql', { sql: enableRLS });
    if (rlsError) {
      results.push(`Enable RLS: ${rlsError.message}`);
    } else {
      results.push('Enable RLS: success');
    }

    // Step 3: Create SELECT policy
    const selectPolicy = `
      CREATE POLICY "arabic_progress_select" ON arabic_learner_progress
      FOR SELECT USING (
        learner_id IN (SELECT id FROM learners WHERE user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM lessons l WHERE l.teacher_id = auth.uid() AND l.learner_id = arabic_learner_progress.learner_id)
        OR EXISTS (SELECT 1 FROM student_teachers st WHERE st.teacher_id = auth.uid() AND st.learner_id = arabic_learner_progress.learner_id)
        OR EXISTS (SELECT 1 FROM learners l WHERE l.id = arabic_learner_progress.learner_id AND l.parent_id = auth.uid())
        OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
      );
    `;
    const { error: selectError } = await supabase.rpc('exec_sql', { sql: selectPolicy });
    if (selectError) {
      results.push(`Select policy: ${selectError.message}`);
    } else {
      results.push('Select policy: success');
    }

    // Step 4: Create INSERT policy
    const insertPolicy = `
      CREATE POLICY "arabic_progress_insert" ON arabic_learner_progress
      FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM lessons l WHERE l.teacher_id = auth.uid() AND l.learner_id = arabic_learner_progress.learner_id)
        OR EXISTS (SELECT 1 FROM student_teachers st WHERE st.teacher_id = auth.uid() AND st.learner_id = arabic_learner_progress.learner_id)
        OR EXISTS (SELECT 1 FROM learners l WHERE l.id = arabic_learner_progress.learner_id AND l.parent_id = auth.uid())
        OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
      );
    `;
    const { error: insertError } = await supabase.rpc('exec_sql', { sql: insertPolicy });
    if (insertError) {
      results.push(`Insert policy: ${insertError.message}`);
    } else {
      results.push('Insert policy: success');
    }

    // Step 5: Create UPDATE policy
    const updatePolicy = `
      CREATE POLICY "arabic_progress_update" ON arabic_learner_progress
      FOR UPDATE USING (
        EXISTS (SELECT 1 FROM lessons l WHERE l.teacher_id = auth.uid() AND l.learner_id = arabic_learner_progress.learner_id)
        OR EXISTS (SELECT 1 FROM student_teachers st WHERE st.teacher_id = auth.uid() AND st.learner_id = arabic_learner_progress.learner_id)
        OR EXISTS (SELECT 1 FROM learners l WHERE l.id = arabic_learner_progress.learner_id AND l.parent_id = auth.uid())
        OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
      );
    `;
    const { error: updateError } = await supabase.rpc('exec_sql', { sql: updatePolicy });
    if (updateError) {
      results.push(`Update policy: ${updateError.message}`);
    } else {
      results.push('Update policy: success');
    }

    // Step 6: Create DELETE policy
    const deletePolicy = `
      CREATE POLICY "arabic_progress_delete" ON arabic_learner_progress
      FOR DELETE USING (
        EXISTS (SELECT 1 FROM lessons l WHERE l.teacher_id = auth.uid() AND l.learner_id = arabic_learner_progress.learner_id)
        OR EXISTS (SELECT 1 FROM student_teachers st WHERE st.teacher_id = auth.uid() AND st.learner_id = arabic_learner_progress.learner_id)
        OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
      );
    `;
    const { error: deleteError } = await supabase.rpc('exec_sql', { sql: deletePolicy });
    if (deleteError) {
      results.push(`Delete policy: ${deleteError.message}`);
    } else {
      results.push('Delete policy: success');
    }

    // Step 7: Create indexes
    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_arabic_learner_progress_learner_id ON arabic_learner_progress(learner_id);
      CREATE INDEX IF NOT EXISTS idx_arabic_learner_progress_syllabus_id ON arabic_learner_progress(syllabus_id);
    `;
    const { error: indexError } = await supabase.rpc('exec_sql', { sql: createIndexes });
    if (indexError) {
      results.push(`Create indexes: ${indexError.message}`);
    } else {
      results.push('Create indexes: success');
    }

    // Step 8: Enable RLS on arabic_syllabus for public read
    const syllabusRLS = `
      ALTER TABLE arabic_syllabus ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "arabic_syllabus_public_read" ON arabic_syllabus;
      CREATE POLICY "arabic_syllabus_public_read" ON arabic_syllabus FOR SELECT USING (true);
    `;
    const { error: syllabusError } = await supabase.rpc('exec_sql', { sql: syllabusRLS });
    if (syllabusError) {
      results.push(`Syllabus RLS: ${syllabusError.message}`);
    } else {
      results.push('Syllabus RLS: success');
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
