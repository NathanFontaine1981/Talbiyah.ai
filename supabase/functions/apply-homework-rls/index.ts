import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const dbUrl = Deno.env.get("SUPABASE_DB_URL")!;
    const client = new Client(dbUrl);
    await client.connect();

    const results: string[] = [];

    // Step 1: Enable RLS
    try {
      await client.queryArray(`ALTER TABLE homework_submissions ENABLE ROW LEVEL SECURITY;`);
      results.push('Enable RLS: success');
    } catch (e) {
      results.push(`Enable RLS: ${e.message}`);
    }

    // Step 2: Drop existing policies
    const dropPolicies = [
      'homework_select_policy',
      'homework_insert_policy',
      'homework_update_policy',
      'homework_delete_policy',
      'Students can view own homework',
      'Students can insert homework',
      'Students can update own homework',
      'Teachers can view student homework',
      'Teachers can update homework feedback'
    ];

    for (const policy of dropPolicies) {
      try {
        await client.queryArray(`DROP POLICY IF EXISTS "${policy}" ON homework_submissions;`);
      } catch (e) {
        // Ignore errors when dropping policies
      }
    }
    results.push('Drop policies: success');

    // Step 3: Create SELECT policy
    try {
      await client.queryArray(`
        CREATE POLICY "homework_select_policy" ON homework_submissions
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM learners
            WHERE learners.id = homework_submissions.learner_id
            AND learners.parent_id = auth.uid()
          )
          OR EXISTS (
            SELECT 1 FROM lessons l
            JOIN teacher_profiles tp ON tp.id = l.teacher_id
            WHERE l.learner_id = homework_submissions.learner_id
            AND tp.user_id = auth.uid()
          )
          OR EXISTS (
            SELECT 1 FROM student_teachers st
            JOIN teacher_profiles tp ON tp.id = st.teacher_id
            WHERE st.student_id = homework_submissions.learner_id
            AND tp.user_id = auth.uid()
          )
          OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
        );
      `);
      results.push('Select policy: success');
    } catch (e) {
      results.push(`Select policy: ${e.message}`);
    }

    // Step 4: Create INSERT policy
    try {
      await client.queryArray(`
        CREATE POLICY "homework_insert_policy" ON homework_submissions
        FOR INSERT WITH CHECK (
          EXISTS (
            SELECT 1 FROM learners
            WHERE learners.id = homework_submissions.learner_id
            AND learners.parent_id = auth.uid()
          )
          OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
        );
      `);
      results.push('Insert policy: success');
    } catch (e) {
      results.push(`Insert policy: ${e.message}`);
    }

    // Step 5: Create UPDATE policy
    try {
      await client.queryArray(`
        CREATE POLICY "homework_update_policy" ON homework_submissions
        FOR UPDATE USING (
          EXISTS (
            SELECT 1 FROM learners
            WHERE learners.id = homework_submissions.learner_id
            AND learners.parent_id = auth.uid()
          )
          OR EXISTS (
            SELECT 1 FROM lessons l
            JOIN teacher_profiles tp ON tp.id = l.teacher_id
            WHERE l.learner_id = homework_submissions.learner_id
            AND tp.user_id = auth.uid()
          )
          OR EXISTS (
            SELECT 1 FROM student_teachers st
            JOIN teacher_profiles tp ON tp.id = st.teacher_id
            WHERE st.student_id = homework_submissions.learner_id
            AND tp.user_id = auth.uid()
          )
          OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
        );
      `);
      results.push('Update policy: success');
    } catch (e) {
      results.push(`Update policy: ${e.message}`);
    }

    // Step 6: Create DELETE policy
    try {
      await client.queryArray(`
        CREATE POLICY "homework_delete_policy" ON homework_submissions
        FOR DELETE USING (
          (
            EXISTS (
              SELECT 1 FROM learners
              WHERE learners.id = homework_submissions.learner_id
              AND learners.parent_id = auth.uid()
            )
            AND status = 'draft'
          )
          OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
        );
      `);
      results.push('Delete policy: success');
    } catch (e) {
      results.push(`Delete policy: ${e.message}`);
    }

    // Step 7: Create indexes
    try {
      await client.queryArray(`CREATE INDEX IF NOT EXISTS idx_homework_submissions_learner_id ON homework_submissions(learner_id);`);
      await client.queryArray(`CREATE INDEX IF NOT EXISTS idx_homework_submissions_syllabus_id ON homework_submissions(syllabus_id);`);
      await client.queryArray(`CREATE INDEX IF NOT EXISTS idx_homework_submissions_course_type ON homework_submissions(course_type);`);
      await client.queryArray(`CREATE INDEX IF NOT EXISTS idx_homework_submissions_status ON homework_submissions(status);`);
      results.push('Create indexes: success');
    } catch (e) {
      results.push(`Create indexes: ${e.message}`);
    }

    await client.end();

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
