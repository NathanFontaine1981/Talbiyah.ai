import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { getHMSManagementToken } from "../_shared/hms.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { teacher_name, learner_name, subject_name } = await req.json().catch(() => ({
      teacher_name: "Nathan Fontaine",
      learner_name: "Abdullah Abbass",
      subject_name: "Quran"
    }));

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`🧪 Setting up test lesson for ${learner_name} with ${teacher_name}...`);

    // 1. Find teacher profile by name
    const { data: teacherData, error: teacherError } = await supabase
      .from('teacher_profiles')
      .select(`
        id,
        profiles!teacher_profiles_user_id_fkey(full_name)
      `)
      .limit(100);

    if (teacherError) {
      throw new Error(`Failed to fetch teachers: ${teacherError.message}`);
    }

    const teacher = teacherData?.find(t =>
      t.profiles?.full_name?.toLowerCase().includes(teacher_name.toLowerCase())
    );

    if (!teacher) {
      // List available teachers
      const teacherNames = teacherData?.map(t => t.profiles?.full_name).filter(Boolean);
      return new Response(JSON.stringify({
        error: `Teacher "${teacher_name}" not found`,
        available_teachers: teacherNames
      }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log(`✅ Found teacher: ${teacher.profiles?.full_name} (ID: ${teacher.id})`);

    // 2. Find learner by name
    const { data: learnerData, error: learnerError } = await supabase
      .from('learners')
      .select('id, name, parent_id')
      .ilike('name', `%${learner_name}%`)
      .limit(1)
      .single();

    if (learnerError || !learnerData) {
      // List available learners
      const { data: allLearners } = await supabase
        .from('learners')
        .select('name')
        .limit(20);

      return new Response(JSON.stringify({
        error: `Learner "${learner_name}" not found`,
        available_learners: allLearners?.map(l => l.name)
      }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log(`✅ Found learner: ${learnerData.name} (ID: ${learnerData.id})`);

    // 3. Find subject
    const { data: subjectData, error: subjectError } = await supabase
      .from('subjects')
      .select('id, name')
      .ilike('name', `%${subject_name}%`)
      .limit(1)
      .single();

    if (subjectError || !subjectData) {
      const { data: allSubjects } = await supabase
        .from('subjects')
        .select('name');

      return new Response(JSON.stringify({
        error: `Subject "${subject_name}" not found`,
        available_subjects: allSubjects?.map(s => s.name)
      }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log(`✅ Found subject: ${subjectData.name} (ID: ${subjectData.id})`);

    // 4. Create 100ms room
    console.log("🎥 Creating 100ms room...");

    const managementToken = await getHMSManagementToken();
    const roomName = `Test-${Date.now()}`;

    const roomResponse = await fetch('https://api.100ms.live/v2/rooms', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${managementToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: roomName,
        description: `Test lesson: ${learnerData.name} with ${teacher.profiles?.full_name}`,
        template_id: '696bc294a090b0544dfda056',
        region: 'eu',
      })
    });

    if (!roomResponse.ok) {
      const error = await roomResponse.text();
      throw new Error(`Failed to create 100ms room: ${error}`);
    }

    const roomData = await roomResponse.json();
    console.log(`✅ Room created: ${roomData.id}`);

    // Wait for room initialization
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Create room codes
    const codesResponse = await fetch(`https://api.100ms.live/v2/room-codes/room/${roomData.id}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${managementToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ enabled: true })
    });

    let teacherCode = null;
    let studentCode = null;

    if (codesResponse.ok) {
      const codesData = await codesResponse.json();
      if (codesData.data && Array.isArray(codesData.data)) {
        for (const codeObj of codesData.data) {
          if (codeObj.role === 'host' || codeObj.role === 'teacher' || codeObj.role === 'moderator') {
            teacherCode = codeObj.code;
          } else if (codeObj.role === 'guest' || codeObj.role === 'student' || codeObj.role === 'participant') {
            studentCode = codeObj.code;
          }
        }
      }
    }

    console.log(`✅ Room codes: teacher=${teacherCode}, student=${studentCode}`);

    // 5. Create lesson record
    const scheduledTime = new Date();
    scheduledTime.setMinutes(scheduledTime.getMinutes() + 5); // 5 minutes from now

    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .insert({
        teacher_id: teacher.id,
        learner_id: learnerData.id,
        subject_id: subjectData.id,
        scheduled_time: scheduledTime.toISOString(),
        duration_minutes: 60,
        status: 'scheduled',
        "100ms_room_id": roomData.id,
        teacher_room_code: teacherCode,
        student_room_code: studentCode,
        lesson_tier: 'premium', // Enable insights
      })
      .select()
      .single();

    if (lessonError) {
      throw new Error(`Failed to create lesson: ${lessonError.message}`);
    }

    console.log(`✅ Lesson created: ${lesson.id}`);

    // Generate join URLs
    const baseUrl = "https://talbiyah.ai";
    const teacherJoinUrl = `${baseUrl}/lesson/${lesson.id}/join?role=teacher`;
    const studentJoinUrl = `${baseUrl}/lesson/${lesson.id}/join?role=student`;

    return new Response(JSON.stringify({
      success: true,
      message: "Test lesson created successfully!",
      lesson: {
        id: lesson.id,
        scheduled_time: lesson.scheduled_time,
        status: lesson.status,
      },
      participants: {
        teacher: {
          name: teacher.profiles?.full_name,
          id: teacher.id,
          join_url: teacherJoinUrl,
          room_code: teacherCode,
        },
        learner: {
          name: learnerData.name,
          id: learnerData.id,
          join_url: studentJoinUrl,
          room_code: studentCode,
        },
      },
      subject: subjectData.name,
      room: {
        id: roomData.id,
        name: roomName,
      },
      instructions: [
        "1. Teacher joins first using the teacher URL",
        "2. Student joins using the student URL",
        "3. Have a short conversation (at least 1-2 minutes)",
        "4. Both leave the room",
        "5. Wait 2-5 minutes for recording to process",
        "6. Check for insights at: " + `${baseUrl}/student/${learnerData.id}/lesson/${lesson.id}/insights`
      ],
      insights_url: `${baseUrl}/student/${learnerData.id}/lesson/${lesson.id}/insights`,
    }, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: any) {
    console.error("❌ Error:", error);
    return new Response(JSON.stringify({
      error: error.message,
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
