// @ts-ignore - Deno types
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { package_type } = body;

    // Validate package_type
    if (!package_type || typeof package_type !== "string") {
      return new Response(
        JSON.stringify({ error: "Invalid request" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Create service client for database operations
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Token package configurations
    const packages: Record<string, { tokens: number; price: number; name: string; description: string }> = {
      starter: {
        tokens: 100,
        price: 500, // £5.00 in pence
        name: "100 AI Tokens",
        description: "Starter Token Pack - 100 tokens (£0.05 per token)"
      },
      standard: {
        tokens: 250,
        price: 1000, // £10.00 in pence
        name: "250 AI Tokens",
        description: "Standard Token Pack - 250 tokens (£0.04 per token) - BETTER VALUE"
      },
      best_value: {
        tokens: 500,
        price: 1800, // £18.00 in pence
        name: "500 AI Tokens",
        description: "Best Value Token Pack - 500 tokens (£0.036 per token) - BEST VALUE"
      }
    };

    const tokenPackage = packages[package_type];
    if (!tokenPackage) {
      return new Response(
        JSON.stringify({ error: "Invalid package type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Creating token checkout for package:", package_type, tokenPackage);

    // Create Stripe checkout session
    const stripe = await import("https://esm.sh/stripe@13.0.0");
    const stripeClient = new stripe.default(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2023-10-16",
    });

    const origin = req.headers.get("origin") || "https://talbiyah.ai";

    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      allow_promotion_codes: true,
      success_url: `${origin}/token-purchase-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/buy-credits?tab=tokens&cancelled=true`,
      line_items: [
        {
          price_data: {
            currency: "gbp",
            unit_amount: tokenPackage.price,
            product_data: {
              name: tokenPackage.name,
              description: tokenPackage.description,
              metadata: {
                package_type,
                tokens: tokenPackage.tokens.toString(),
                type: "token_purchase"
              }
            }
          },
          quantity: 1,
        },
      ],
      metadata: {
        user_id: user.id,
        package_type,
        tokens: tokenPackage.tokens.toString(),
        type: "token_purchase",
      },
    });

    console.log("Created token checkout session:", session.id);

    // Create pending token purchase record
    const { error: insertError } = await supabaseService
      .from("token_purchases")
      .insert({
        user_id: user.id,
        package_type,
        tokens_amount: tokenPackage.tokens,
        price_paid: tokenPackage.price / 100,
        stripe_checkout_session_id: session.id,
        status: "pending"
      });

    if (insertError) {
      console.warn("Failed to create pending purchase record:", insertError.message);
      // Don't fail the checkout - the webhook will handle the purchase
    }

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Token pack checkout error:", error instanceof Error ? error.message : "Unknown error");

    return new Response(
      JSON.stringify({ error: "Failed to create checkout session" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
