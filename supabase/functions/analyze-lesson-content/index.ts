import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Detection patterns for suspicious content
const PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
  phone_uk: /(?:(?:\+44\s?|0)(?:7\d{3}|\d{4})[\s\-]?\d{3}[\s\-]?\d{3}|\d{10,11})/g,
  phone_intl: /\+?[1-9]\d{7,14}/g,
  social: /\b(whatsapp|telegram|instagram|facebook|snapchat|twitter|tiktok|discord|signal)\b/gi,
  file_share: /\b(dropbox\.com|drive\.google\.com|wetransfer\.com|mega\.nz|mediafire\.com|onedrive\.live\.com)\b/gi,
  keywords: /\b(email me|call me|my number is|add me on|text me|contact me outside|private lesson|off platform|my email is|reach me at|message me on|contact me directly)\b/gi
};

interface DetectedFlag {
  flag_type: string;
  matched_content: string;
  severity: 'warning' | 'critical';
}

function analyzeContent(content: string): DetectedFlag[] {
  const flags: DetectedFlag[] = [];

  // Check email
  const emailMatches = content.match(PATTERNS.email);
  if (emailMatches) {
    emailMatches.forEach(match => {
      flags.push({
        flag_type: 'email',
        matched_content: match,
        severity: 'critical'
      });
    });
  }

  // Check UK phone numbers
  const phoneUkMatches = content.match(PATTERNS.phone_uk);
  if (phoneUkMatches) {
    phoneUkMatches.forEach(match => {
      flags.push({
        flag_type: 'phone',
        matched_content: match,
        severity: 'critical'
      });
    });
  }

  // Check international phone numbers
  const phoneIntlMatches = content.match(PATTERNS.phone_intl);
  if (phoneIntlMatches) {
    phoneIntlMatches.forEach(match => {
      // Avoid flagging small numbers that might be Quran verses
      if (match.length >= 10) {
        flags.push({
          flag_type: 'phone',
          matched_content: match,
          severity: 'critical'
        });
      }
    });
  }

  // Check social media mentions
  const socialMatches = content.match(PATTERNS.social);
  if (socialMatches) {
    socialMatches.forEach(match => {
      flags.push({
        flag_type: 'social_media',
        matched_content: match.toLowerCase(),
        severity: 'warning'
      });
    });
  }

  // Check file sharing links
  const fileShareMatches = content.match(PATTERNS.file_share);
  if (fileShareMatches) {
    fileShareMatches.forEach(match => {
      flags.push({
        flag_type: 'file_share',
        matched_content: match.toLowerCase(),
        severity: 'warning'
      });
    });
  }

  // Check keywords
  const keywordMatches = content.match(PATTERNS.keywords);
  if (keywordMatches) {
    keywordMatches.forEach(match => {
      flags.push({
        flag_type: 'keyword',
        matched_content: match.toLowerCase(),
        severity: 'warning'
      });
    });
  }

  // Deduplicate flags by matched_content
  const uniqueFlags = flags.filter((flag, index, self) =>
    index === self.findIndex(f => f.matched_content === flag.matched_content && f.flag_type === flag.flag_type)
  );

  return uniqueFlags;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { content, lesson_id, source, teacher_id, student_id } = await req.json();

    if (!content || !lesson_id || !source) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: content, lesson_id, source" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Analyzing ${source} content for lesson ${lesson_id}`);

    // Analyze content for suspicious patterns
    const flags = analyzeContent(content);

    if (flags.length === 0) {
      return new Response(
        JSON.stringify({ message: "No suspicious content detected", flags: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${flags.length} suspicious patterns`);

    // Insert flags into database
    const insertedFlags = [];
    for (const flag of flags) {
      const { data, error } = await supabase
        .from('lesson_content_flags')
        .insert({
          lesson_id,
          flag_type: flag.flag_type,
          source,
          flagged_content: flag.matched_content,
          context: content.substring(0, 500), // First 500 chars as context
          teacher_id,
          student_id,
          severity: flag.severity
        })
        .select()
        .single();

      if (error) {
        console.error('Error inserting flag:', error);
      } else {
        insertedFlags.push(data);

        // Trigger admin alert for each critical flag
        if (flag.severity === 'critical') {
          try {
            await fetch(`${supabaseUrl}/functions/v1/send-admin-alert`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseServiceKey}`
              },
              body: JSON.stringify({
                flag_id: data.id,
                flag_type: flag.flag_type,
                lesson_id,
                flagged_content: flag.matched_content,
                context: content.substring(0, 500),
                severity: flag.severity
              })
            });
          } catch (alertError) {
            console.error('Error sending admin alert:', alertError);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        message: `Detected ${flags.length} suspicious patterns`,
        flags: insertedFlags
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error analyzing content:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
