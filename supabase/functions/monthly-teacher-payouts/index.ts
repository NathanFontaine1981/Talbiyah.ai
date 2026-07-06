import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Monthly payout run (intended to be scheduled for the 1st of each month via pg_cron).
// - Stripe Connect teachers: paid automatically (transfer + email).
// - Everyone else (TapTap Send / PayPal / bank / Wise): queued as a payout REQUEST for
//   the admin to send manually, and listed in a summary email to the admin.
// Service-role only.
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, serviceKey)

    // Guard: require the service role key (so only the cron / an admin tool can run this).
    const auth = req.headers.get('Authorization') || ''
    if (!auth.includes(serviceKey) || !serviceKey) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const adminEmail = Deno.env.get('PAYOUT_NOTIFY_EMAIL') || 'contact@talbiyah.ai'

    // All teachers with a positive cleared balance (no minimum).
    const { data: eligible, error: eligErr } = await supabase
      .from('teacher_earnings_overview')
      .select('teacher_profile_id, teacher_name, teacher_email, cleared_earnings, preferred_payout_method, stripe_account_id')
      .gt('cleared_earnings', 0)
    if (eligErr) throw eligErr

    const autoPaid: any[] = []
    const queued: any[] = []
    const failed: any[] = []

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: '2023-10-16' }) : null

    for (const t of eligible || []) {
      const teacherId = t.teacher_profile_id
      const method = t.preferred_payout_method
      try {
        // Re-read cleared earnings authoritatively
        const { data: cleared } = await supabase
          .from('teacher_earnings').select('id, amount_earned')
          .eq('teacher_id', teacherId).eq('status', 'cleared')
        if (!cleared || cleared.length === 0) continue
        const total = cleared.reduce((s, e) => s + Number(e.amount_earned), 0)

        // ---- Stripe Connect → pay automatically ----
        if (stripe && t.stripe_account_id && method === 'stripe_connect') {
          const { data: payout } = await supabase.from('teacher_payouts').insert({
            teacher_id: teacherId, total_amount: total, currency: 'gbp',
            earnings_count: cleared.length, payout_method: 'stripe_connect',
            status: 'processing', notes: 'Monthly auto-payout',
          }).select().single()

          const transfer = await stripe.transfers.create({
            amount: Math.round(total * 100), currency: 'gbp',
            destination: t.stripe_account_id,
            metadata: { teacher_id: teacherId, payout_id: payout.id, run: 'monthly' },
          })

          await supabase.from('teacher_payouts').update({
            status: 'completed', external_payout_id: transfer.id, completed_at: new Date().toISOString(),
          }).eq('id', payout.id)
          await supabase.from('teacher_earnings').update({
            status: 'paid', payout_id: payout.id, paid_at: new Date().toISOString(),
          }).in('id', cleared.map((e) => e.id))

          // Remittance email to teacher + admin (bcc)
          await supabase.functions.invoke('send-payout-notification', {
            body: { payout_id: payout.id, teacher_id: teacherId, type: 'completed' },
          }).catch(() => {})

          autoPaid.push({ name: t.teacher_name, amount: total, method: 'Stripe' })
          continue
        }

        // ---- Everyone else → queue a payout REQUEST for the admin (don't mark paid) ----
        // Skip if there's already an open request/pending payout for this teacher.
        const { data: open } = await supabase.from('teacher_payouts')
          .select('id').eq('teacher_id', teacherId).in('status', ['requested', 'pending', 'processing']).limit(1)
        if (open && open.length > 0) {
          queued.push({ name: t.teacher_name, amount: total, method: method || 'manual', note: 'already queued' })
          continue
        }
        await supabase.from('teacher_payouts').insert({
          teacher_id: teacherId, total_amount: total, currency: 'gbp',
          earnings_count: cleared.length, payout_method: method || 'manual',
          status: 'requested', notes: 'Monthly auto-run: due for manual payment',
        })
        queued.push({ name: t.teacher_name, amount: total, method: method || 'manual', email: t.teacher_email })
      } catch (e) {
        failed.push({ name: t.teacher_name, error: (e as Error).message })
      }
    }

    // ---- Summary email to admin ----
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const fmt = (n: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n)
    const rows = (arr: any[], cols: (r: any) => string) => arr.map(cols).join('')
    const summaryHtml = `
      <h2>Monthly payout run</h2>
      <h3>✅ Auto-paid (Stripe): ${autoPaid.length}</h3>
      <table border="1" cellpadding="6" style="border-collapse:collapse">
        <tr><th>Teacher</th><th>Amount</th></tr>
        ${rows(autoPaid, r => `<tr><td>${r.name}</td><td>${fmt(r.amount)}</td></tr>`) || '<tr><td colspan=2>None</td></tr>'}
      </table>
      <h3>📋 Need manual payment: ${queued.length}</h3>
      <p>Pay these from Admin → Teacher Payouts (send the money, then approve to mark paid & email them):</p>
      <table border="1" cellpadding="6" style="border-collapse:collapse">
        <tr><th>Teacher</th><th>Amount</th><th>Method</th></tr>
        ${rows(queued, r => `<tr><td>${r.name}</td><td>${fmt(r.amount)}</td><td>${String(r.method).replace('_',' ')}</td></tr>`) || '<tr><td colspan=3>None</td></tr>'}
      </table>
      ${failed.length ? `<h3>⚠️ Failed: ${failed.length}</h3><pre>${JSON.stringify(failed, null, 2)}</pre>` : ''}
    `
    if (resendApiKey) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Talbiyah.ai <billing@talbiyah.ai>', to: adminEmail,
          subject: `Monthly payouts — ${autoPaid.length} auto-paid, ${queued.length} to pay manually`,
          html: summaryHtml,
        }),
      }).catch(() => {})
    }

    return new Response(
      JSON.stringify({ success: true, auto_paid: autoPaid, queued, failed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    )
  } catch (error) {
    console.error('monthly-teacher-payouts error:', error)
    return new Response(JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
  }
})
