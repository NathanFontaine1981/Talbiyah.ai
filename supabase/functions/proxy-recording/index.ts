import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Range",
  "Access-Control-Expose-Headers": "Content-Range, Accept-Ranges, Content-Length, Content-Type",
};

/**
 * This edge function proxies video requests from 100ms S3 recordings.
 * It fixes the region mismatch issue where 100ms generates presigned URLs
 * for us-east-1 but the bucket is actually in ap-south-1.
 */
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const recordingUrl = url.searchParams.get("url");

    if (!recordingUrl) {
      return new Response(
        JSON.stringify({ error: "Missing 'url' parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fix the region in the URL - change us-east-1 to ap-south-1
    let fixedUrl = recordingUrl;
    if (recordingUrl.includes("brytecam-test-bucket-ap-south-1.s3.us-east-1.amazonaws.com")) {
      fixedUrl = recordingUrl.replace(
        "brytecam-test-bucket-ap-south-1.s3.us-east-1.amazonaws.com",
        "brytecam-test-bucket-ap-south-1.s3.ap-south-1.amazonaws.com"
      );
      // Also fix the credential region in the signed URL parameters
      fixedUrl = fixedUrl.replace(
        /X-Amz-Credential=([^%]+)%2F(\d+)%2Fus-east-1/g,
        "X-Amz-Credential=$1%2F$2%2Fap-south-1"
      );
    }

    // Forward range headers for video seeking
    const headers: Record<string, string> = {};
    const rangeHeader = req.headers.get("Range");
    if (rangeHeader) {
      headers["Range"] = rangeHeader;
    }

    console.log("Proxying recording URL:", fixedUrl.substring(0, 100) + "...");

    // Fetch the video from S3
    const response = await fetch(fixedUrl, { headers });

    if (!response.ok) {
      console.error("S3 fetch failed:", response.status, await response.text());
      return new Response(
        JSON.stringify({ error: "Failed to fetch recording", status: response.status }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create response headers
    const responseHeaders: Record<string, string> = {
      ...corsHeaders,
    };

    // Copy important headers from S3 response
    const contentType = response.headers.get("Content-Type");
    if (contentType) responseHeaders["Content-Type"] = contentType;

    const contentLength = response.headers.get("Content-Length");
    if (contentLength) responseHeaders["Content-Length"] = contentLength;

    const contentRange = response.headers.get("Content-Range");
    if (contentRange) responseHeaders["Content-Range"] = contentRange;

    const acceptRanges = response.headers.get("Accept-Ranges");
    if (acceptRanges) responseHeaders["Accept-Ranges"] = acceptRanges;

    // Stream the video body
    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error("Proxy error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
