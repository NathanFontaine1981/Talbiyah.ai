import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvoiceRequest {
  purchase_id: string;
  user_id: string;
  stripe_payment_intent_id?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('📄 generate-invoice called');

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { purchase_id, user_id, stripe_payment_intent_id }: InvoiceRequest = await req.json();

    if (!purchase_id || !user_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get purchase details
    const { data: purchase, error: purchaseError } = await supabaseAdmin
      .from('credit_purchases')
      .select('*')
      .eq('id', purchase_id)
      .single();

    if (purchaseError || !purchase) {
      console.error('Purchase not found:', purchaseError);
      return new Response(
        JSON.stringify({ success: false, error: 'Purchase not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('full_name, email')
      .eq('id', user_id)
      .single();

    if (profileError || !profile) {
      console.error('Profile not found:', profileError);
      return new Response(
        JSON.stringify({ success: false, error: 'User profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if invoice already exists for this purchase
    const { data: existingInvoice } = await supabaseAdmin
      .from('invoices')
      .select('id, invoice_number')
      .eq('credit_purchase_id', purchase_id)
      .maybeSingle();

    if (existingInvoice) {
      console.log('Invoice already exists:', existingInvoice.invoice_number);
      return new Response(
        JSON.stringify({
          success: true,
          invoice_number: existingInvoice.invoice_number,
          message: 'Invoice already exists'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate invoice number
    const { data: invoiceNumber, error: seqError } = await supabaseAdmin.rpc('generate_invoice_number');

    if (seqError) {
      console.error('Failed to generate invoice number:', seqError);
      // Fallback invoice number
      const fallbackNumber = `TAL-${new Date().toISOString().slice(0, 7).replace('-', '')}-${Date.now().toString().slice(-5)}`;
      console.log('Using fallback invoice number:', fallbackNumber);
    }

    const finalInvoiceNumber = invoiceNumber || `TAL-${new Date().toISOString().slice(0, 7).replace('-', '')}-${Date.now().toString().slice(-5)}`;

    // Calculate amounts
    const unitPrice = purchase.pack_price / purchase.credits_added;
    const subtotal = purchase.pack_price;
    const discountAmount = purchase.discount_amount || 0;
    const totalAmount = subtotal - discountAmount;

    // Pack type mapping
    const packTypeNames: Record<string, string> = {
      light: 'Starter Pack',
      standard: 'Standard Pack',
      intensive: 'Intensive Pack',
    };

    const packName = packTypeNames[purchase.pack_type] || purchase.pack_type;

    // Create invoice record
    const { data: invoice, error: insertError } = await supabaseAdmin
      .from('invoices')
      .insert({
        invoice_number: finalInvoiceNumber,
        user_id: user_id,
        credit_purchase_id: purchase_id,
        stripe_payment_intent_id: stripe_payment_intent_id || purchase.stripe_payment_id,
        customer_name: profile.full_name || 'Customer',
        customer_email: profile.email,
        description: `${packName} - ${purchase.credits_added} Lesson Credits`,
        quantity: purchase.credits_added,
        unit_price: unitPrice,
        subtotal: subtotal,
        discount_amount: discountAmount,
        discount_code: purchase.promo_code_used || null,
        total_amount: totalAmount,
        currency: 'GBP',
        status: 'paid',
        invoice_date: purchase.purchase_date || new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create invoice:', insertError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create invoice' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Invoice created:', invoice.invoice_number);

    // Send invoice email
    const invoiceDate = new Date(invoice.invoice_date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const emailHtml = generateInvoiceEmailHtml({
      invoiceNumber: invoice.invoice_number,
      invoiceDate,
      customerName: profile.full_name || 'Customer',
      customerEmail: profile.email,
      description: invoice.description,
      quantity: invoice.quantity,
      unitPrice: invoice.unit_price,
      subtotal: invoice.subtotal,
      discountAmount: invoice.discount_amount,
      discountCode: invoice.discount_code,
      totalAmount: invoice.total_amount,
    });

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'Talbiyah.ai <billing@talbiyah.ai>',
        to: [profile.email],
        subject: `Invoice ${invoice.invoice_number} - Talbiyah.ai`,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('Failed to send invoice email:', errorText);
      // Don't fail the whole operation if email fails
    } else {
      console.log('Invoice email sent successfully');
    }

    return new Response(
      JSON.stringify({
        success: true,
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        message: 'Invoice generated and sent successfully',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

interface InvoiceEmailData {
  invoiceNumber: string;
  invoiceDate: string;
  customerName: string;
  customerEmail: string;
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  discountAmount: number;
  discountCode: string | null;
  totalAmount: number;
}

function generateInvoiceEmailHtml(data: InvoiceEmailData): string {
  const {
    invoiceNumber,
    invoiceDate,
    customerName,
    customerEmail,
    description,
    quantity,
    unitPrice,
    subtotal,
    discountAmount,
    discountCode,
    totalAmount,
  } = data;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice ${invoiceNumber}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">

        <!-- Header -->
        <div style="background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%); border-radius: 16px; padding: 30px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0 0 8px 0; font-size: 24px;">Talbiyah.ai</h1>
          <p style="color: rgba(255, 255, 255, 0.9); font-size: 14px; margin: 0;">At Your Service</p>
        </div>

        <!-- Invoice Box -->
        <div style="background: white; border-radius: 12px; padding: 30px; margin-bottom: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">

          <!-- Invoice Header -->
          <div style="display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px;">
            <div>
              <h2 style="margin: 0 0 4px 0; color: #0f172a; font-size: 28px;">INVOICE</h2>
              <p style="margin: 0; color: #64748b; font-size: 14px;">${invoiceNumber}</p>
            </div>
            <div style="text-align: right;">
              <p style="margin: 0; color: #64748b; font-size: 12px;">Date</p>
              <p style="margin: 0; color: #0f172a; font-size: 16px; font-weight: 600;">${invoiceDate}</p>
            </div>
          </div>

          <!-- From / To -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
            <div>
              <p style="margin: 0 0 8px 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">From</p>
              <p style="margin: 0; color: #0f172a; font-size: 14px; font-weight: 600;">Talbiyah.ai</p>
              <p style="margin: 4px 0 0 0; color: #64748b; font-size: 13px;">billing@talbiyah.ai</p>
              <p style="margin: 4px 0 0 0; color: #64748b; font-size: 13px;">United Kingdom</p>
            </div>
            <div>
              <p style="margin: 0 0 8px 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Bill To</p>
              <p style="margin: 0; color: #0f172a; font-size: 14px; font-weight: 600;">${customerName}</p>
              <p style="margin: 4px 0 0 0; color: #64748b; font-size: 13px;">${customerEmail}</p>
            </div>
          </div>

          <!-- Status Badge -->
          <div style="margin-bottom: 20px;">
            <span style="display: inline-block; background: #d1fae5; color: #065f46; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase;">Paid</span>
          </div>

          <!-- Line Items -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background: #f8fafc;">
                <th style="padding: 12px; text-align: left; color: #64748b; font-size: 12px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0;">Description</th>
                <th style="padding: 12px; text-align: center; color: #64748b; font-size: 12px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0;">Qty</th>
                <th style="padding: 12px; text-align: right; color: #64748b; font-size: 12px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0;">Unit Price</th>
                <th style="padding: 12px; text-align: right; color: #64748b; font-size: 12px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 16px 12px; color: #0f172a; font-size: 14px; border-bottom: 1px solid #e2e8f0;">${description}</td>
                <td style="padding: 16px 12px; color: #0f172a; font-size: 14px; text-align: center; border-bottom: 1px solid #e2e8f0;">${quantity}</td>
                <td style="padding: 16px 12px; color: #0f172a; font-size: 14px; text-align: right; border-bottom: 1px solid #e2e8f0;">£${unitPrice.toFixed(2)}</td>
                <td style="padding: 16px 12px; color: #0f172a; font-size: 14px; text-align: right; border-bottom: 1px solid #e2e8f0;">£${subtotal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <!-- Totals -->
          <div style="margin-left: auto; width: 250px;">
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
              <span style="color: #64748b; font-size: 14px;">Subtotal</span>
              <span style="color: #0f172a; font-size: 14px;">£${subtotal.toFixed(2)}</span>
            </div>
            ${discountAmount > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
              <span style="color: #059669; font-size: 14px;">Discount${discountCode ? ` (${discountCode})` : ''}</span>
              <span style="color: #059669; font-size: 14px;">-£${discountAmount.toFixed(2)}</span>
            </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; padding: 12px 0; margin-top: 8px;">
              <span style="color: #0f172a; font-size: 18px; font-weight: 700;">Total</span>
              <span style="color: #0f172a; font-size: 18px; font-weight: 700;">£${totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <!-- Payment Method -->
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Payment Method</p>
            <p style="margin: 4px 0 0 0; color: #0f172a; font-size: 14px;">Stripe (Credit/Debit Card)</p>
          </div>
        </div>

        <!-- Footer Notes -->
        <div style="background: #f1f5f9; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 12px 0; color: #0f172a; font-size: 14px;">Important Information</h3>
          <ul style="margin: 0; padding-left: 20px; color: #64748b; font-size: 13px;">
            <li style="margin-bottom: 6px;">Credits can be refunded within 7 days of purchase</li>
            <li style="margin-bottom: 6px;">After 7 days, credits can be transferred to other users</li>
            <li>Contact support@talbiyah.ai for any queries</li>
          </ul>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px;">
          <p style="margin: 0;">Thank you for your purchase!</p>
          <p style="margin: 8px 0 0 0;">Talbiyah.ai - At Your Service</p>
          <p style="margin: 8px 0 0 0;">
            <a href="https://talbiyah.ai/payment-history" style="color: #06b6d4; text-decoration: none;">View Payment History</a>
          </p>
        </div>

      </body>
    </html>
  `;
}
