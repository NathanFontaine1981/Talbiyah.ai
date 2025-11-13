import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface StageDetectionRequest {
  prompt: string;
  transcript: string;
}

interface StageDetectionResult {
  detected_stage: 'understanding' | 'fluency' | 'memorization';
  confidence: number;
  evidence: string[];
  mixed_stage: boolean;
  secondary_stage: 'understanding' | 'fluency' | 'memorization' | null;
  stage_breakdown: {
    understanding: number;
    fluency: number;
    memorization: number;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, transcript } = await req.json() as StageDetectionRequest;

    if (!transcript || transcript.trim().length < 50) {
      return new Response(
        JSON.stringify({ error: "Transcript is required and must be at least 50 characters" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get API key from environment
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicApiKey) {
      console.error("ANTHROPIC_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Claude API not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Call Claude API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Claude API error:", errorData);
      return new Response(
        JSON.stringify({ error: "Failed to analyze transcript" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const claudeResponse = await response.json();

    // Extract the JSON from Claude's response
    const content = claudeResponse.content[0].text;

    // Try to parse JSON from the response
    let result: StageDetectionResult;
    try {
      // Claude might wrap JSON in markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) ||
                       content.match(/(\{[\s\S]*?\})/);

      if (jsonMatch) {
        result = JSON.parse(jsonMatch[1]);
      } else {
        result = JSON.parse(content);
      }
    } catch (parseError) {
      console.error("Failed to parse Claude response as JSON:", content);
      return new Response(
        JSON.stringify({ error: "Invalid response format from AI" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate the result structure
    if (
      !result.detected_stage ||
      !['understanding', 'fluency', 'memorization'].includes(result.detected_stage) ||
      typeof result.confidence !== 'number' ||
      !Array.isArray(result.evidence) ||
      !result.stage_breakdown
    ) {
      console.error("Invalid stage detection result structure:", result);
      return new Response(
        JSON.stringify({ error: "Invalid analysis result format" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in detect-lesson-stage function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
