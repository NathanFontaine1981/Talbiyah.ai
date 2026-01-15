import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { lesson_id, transcript } = await req.json();

    if (!lesson_id || !transcript) {
      return new Response(
        JSON.stringify({ error: "lesson_id and transcript are required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get lesson details
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select(`
        id, subject_id, teacher_id, learner_id, scheduled_time, duration_minutes,
        subjects(name),
        learners(name),
        teacher_profiles!lessons_teacher_id_fkey(profiles(full_name))
      `)
      .eq('id', lesson_id)
      .single();

    if (lessonError || !lesson) {
      return new Response(
        JSON.stringify({ error: "Lesson not found", details: lessonError?.message }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const subjectName = (lesson.subjects as any)?.name || "Lesson";
    const learnerName = (lesson.learners as any)?.name || "Student";
    const teacherName = (lesson.teacher_profiles as any)?.profiles?.full_name || "Teacher";

    console.log(`Generating insights for lesson ${lesson_id}:`, {
      subject: subjectName,
      learner: learnerName,
      teacher: teacherName,
      transcript_length: transcript.length
    });

    // Call generate-lesson-insights
    const metadata = {
      teacher_name: teacherName,
      student_names: [learnerName],
      lesson_date: new Date(lesson.scheduled_time).toLocaleDateString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      duration_minutes: lesson.duration_minutes,
    };

    const insightResponse = await fetch(`${supabaseUrl}/functions/v1/generate-lesson-insights`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        lesson_id: lesson.id,
        transcript: transcript,
        subject: subjectName,
        metadata: metadata,
      }),
    });

    if (!insightResponse.ok) {
      const errorText = await insightResponse.text();
      console.error("Failed to generate insights:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate insights", details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await insightResponse.json();
    console.log("Insights generated:", result);

    // Update learner_id on the insight
    if (result.insight_id) {
      await supabase
        .from('lesson_insights')
        .update({ learner_id: lesson.learner_id })
        .eq('id', result.insight_id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        insight_id: result.insight_id,
        lesson_id: lesson.id,
        subject: subjectName,
        learner: learnerName
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
