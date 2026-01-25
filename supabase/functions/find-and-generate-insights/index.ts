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
    const { teacher_name, student_name, date, transcript, list_all, lesson_id } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // If lesson_id provided, use it directly
    if (lesson_id && transcript) {
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

      // Check if there's an existing insight with a title (may contain surah info)
      const { data: existingInsight } = await supabase
        .from('lesson_insights')
        .select('title')
        .eq('lesson_id', lesson_id)
        .maybeSingle();

      // Use existing insight title or subject name as lesson_title
      const lessonTitle = existingInsight?.title || subjectName;

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

      console.log(`Generating insights for lesson ${lesson.id} by ID, title: ${lessonTitle}`);

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
          lesson_title: lessonTitle, // Pass the title for surah parsing
          metadata: metadata,
        }),
      });

      if (!insightResponse.ok) {
        const errorText = await insightResponse.text();
        return new Response(
          JSON.stringify({ error: "Failed to generate insights", details: errorText }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = await insightResponse.json();
      if (result.insight_id) {
        await supabase
          .from('lesson_insights')
          .update({ learner_id: lesson.learner_id })
          .eq('id', result.insight_id);
      }

      return new Response(
        JSON.stringify({
          success: true,
          lesson_id: lesson.id,
          insight_id: result.insight_id,
          subject: subjectName,
          learner: learnerName
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // List all lessons if requested
    if (list_all) {
      const { data: allLessons, error: listError } = await supabase
        .from('lessons')
        .select(`
          id, scheduled_time, status, duration_minutes, "100ms_room_id",
          subjects(name),
          learners(name),
          teacher_profiles!lessons_teacher_id_fkey(profiles(full_name))
        `)
        .order('scheduled_time', { ascending: false })
        .limit(50);

      if (listError) {
        return new Response(
          JSON.stringify({ error: listError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const lessonsWithInsights = await Promise.all((allLessons || []).map(async (lesson) => {
        const { data: insight } = await supabase
          .from('lesson_insights')
          .select('id')
          .eq('lesson_id', lesson.id)
          .maybeSingle();

        return {
          lesson_id: lesson.id,
          scheduled_time: lesson.scheduled_time,
          status: lesson.status,
          subject: (lesson.subjects as any)?.name,
          learner: (lesson.learners as any)?.name,
          teacher: (lesson.teacher_profiles as any)?.profiles?.full_name,
          room_id: (lesson as any)["100ms_room_id"],
          has_insights: !!insight
        };
      }));

      return new Response(
        JSON.stringify({ lessons: lessonsWithInsights }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find lesson based on teacher name, student name, and date
    let query = supabase
      .from('lessons')
      .select(`
        id, subject_id, teacher_id, learner_id, scheduled_time, duration_minutes, status,
        subjects(name),
        learners(name),
        teacher_profiles!lessons_teacher_id_fkey(profiles(full_name))
      `)
      .in('status', ['completed', 'confirmed', 'scheduled']);

    // Filter by date if provided
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query = query
        .gte('scheduled_time', startOfDay.toISOString())
        .lte('scheduled_time', endOfDay.toISOString());
    }

    const { data: lessons, error: lessonError } = await query;

    if (lessonError) {
      return new Response(
        JSON.stringify({ error: "Failed to query lessons", details: lessonError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!lessons || lessons.length === 0) {
      return new Response(
        JSON.stringify({ error: "No completed lessons found for that date", lessons: [] }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter by names if provided
    let matchedLesson = lessons[0];
    if (teacher_name || student_name) {
      for (const lesson of lessons) {
        const teacherFullName = (lesson.teacher_profiles as any)?.profiles?.full_name?.toLowerCase() || '';
        const learnerName = (lesson.learners as any)?.name?.toLowerCase() || '';

        const teacherMatch = !teacher_name || teacherFullName.includes(teacher_name.toLowerCase());
        const studentMatch = !student_name || learnerName.includes(student_name.toLowerCase());

        if (teacherMatch && studentMatch) {
          matchedLesson = lesson;
          break;
        }
      }
    }

    // Check if insights already exist
    const { data: existingInsight } = await supabase
      .from('lesson_insights')
      .select('id')
      .eq('lesson_id', matchedLesson.id)
      .maybeSingle();

    if (existingInsight) {
      return new Response(
        JSON.stringify({
          message: "Insights already exist for this lesson",
          lesson_id: matchedLesson.id,
          insight_id: existingInsight.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If transcript provided, generate insights
    if (transcript) {
      const subjectName = (matchedLesson.subjects as any)?.name || "Lesson";
      const learnerName = (matchedLesson.learners as any)?.name || "Student";
      const teacherName = (matchedLesson.teacher_profiles as any)?.profiles?.full_name || "Teacher";

      const metadata = {
        teacher_name: teacherName,
        student_names: [learnerName],
        lesson_date: new Date(matchedLesson.scheduled_time).toLocaleDateString('en-GB', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        duration_minutes: matchedLesson.duration_minutes,
      };

      console.log(`Generating insights for lesson ${matchedLesson.id}, subject: ${subjectName}`);

      const insightResponse = await fetch(`${supabaseUrl}/functions/v1/generate-lesson-insights`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          lesson_id: matchedLesson.id,
          transcript: transcript,
          subject: subjectName,
          lesson_title: subjectName, // Pass subject name as title for surah parsing
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

      // Update learner_id on the insight
      if (result.insight_id) {
        await supabase
          .from('lesson_insights')
          .update({ learner_id: matchedLesson.learner_id })
          .eq('id', result.insight_id);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Insights generated successfully",
          lesson_id: matchedLesson.id,
          insight_id: result.insight_id,
          subject: subjectName,
          learner: learnerName
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return all found lessons info
    const allLessonsInfo = lessons.map(lesson => ({
      lesson_id: lesson.id,
      subject: (lesson.subjects as any)?.name,
      learner: (lesson.learners as any)?.name,
      teacher: (lesson.teacher_profiles as any)?.profiles?.full_name,
      scheduled_time: lesson.scheduled_time,
      status: lesson.status
    }));

    return new Response(
      JSON.stringify({
        matched_lesson: {
          lesson_id: matchedLesson.id,
          subject: (matchedLesson.subjects as any)?.name,
          learner: (matchedLesson.learners as any)?.name,
          teacher: (matchedLesson.teacher_profiles as any)?.profiles?.full_name,
          scheduled_time: matchedLesson.scheduled_time,
        },
        all_lessons: allLessonsInfo,
        total_found: lessons.length,
        message: "Provide transcript to generate insights for matched lesson."
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
