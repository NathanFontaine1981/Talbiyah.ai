import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Wise (TransferWise) API base. Defaults to live; set WISE_API_URL to the
// sandbox (https://api.sandbox.transferwise.tech) for testing.
const WISE_API_URL = Deno.env.get('WISE_API_URL') || 'https://api.transferwise.com'

interface WiseConfig {
  token: string
  profileId: string
}

async function wiseFetch(cfg: WiseConfig, path: string, init: RequestInit = {}) {
  const res = await fetch(`${WISE_API_URL}${path}`, {
    ...init,
    headers: {
      'Authorization': `Bearer ${cfg.token}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  })
  const text = await res.text()
  let body: any = null
  try { body = text ? JSON.parse(text) : null } catch { body = text }
  if (!res.ok) {
    const message = body?.errors?.[0]?.message || body?.message || text || `Wise API error (${res.status})`
    throw new Error(`Wise: ${message}`)
  }
  return body
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const token = Deno.env.get('WISE_API_TOKEN')
    const profileId = Deno.env.get('WISE_PROFILE_ID')
    if (!token || !profileId) {
      throw new Error('Wise is not configured. Set WISE_API_TOKEN and WISE_PROFILE_ID.')
    }
    const cfg: WiseConfig = { token, profileId }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Authenticate + require admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No authorization header')
    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(jwt)
    if (userError || !user) throw new Error('Unauthorized')

    const { data: adminProfile } = await supabaseClient
      .from('profiles')
      .select('roles')
      .eq('id', user.id)
      .single()
    if (!adminProfile?.roles || !adminProfile.roles.includes('admin')) {
      throw new Error('Admin access required')
    }

    const { teacher_id } = await req.json()
    if (!teacher_id) throw new Error('teacher_id is required')

    // Load the teacher's international bank details
    const { data: settings, error: settingsError } = await supabaseClient
      .from('teacher_payment_settings')
      .select('bank_account_holder_name, bank_iban, bank_swift_bic, bank_country, bank_currency')
      .eq('teacher_id', teacher_id)
      .single()

    if (settingsError || !settings) throw new Error('Payment settings not found')
    if (!settings.bank_account_holder_name) throw new Error('Missing account holder name')
    if (!settings.bank_iban && !settings.bank_swift_bic) {
      throw new Error('Missing IBAN / SWIFT — teacher must complete their bank details')
    }

    const targetCurrency = (settings.bank_currency || '').toUpperCase()
    if (!targetCurrency) throw new Error('Missing payout currency on the teacher\'s bank details')

    // Cleared earnings are accounted in GBP
    const { data: clearedEarnings, error: earningsError } = await supabaseClient
      .from('teacher_earnings')
      .select('id, amount_earned')
      .eq('teacher_id', teacher_id)
      .eq('status', 'cleared')
    if (earningsError) throw earningsError
    if (!clearedEarnings || clearedEarnings.length === 0) {
      throw new Error('No cleared earnings to payout')
    }

    const totalAmount = clearedEarnings.reduce((sum, e) => sum + Number(e.amount_earned), 0)

    // Create the payout record up front (idempotency reference for Wise)
    const { data: payout, error: payoutCreateError } = await supabaseClient
      .from('teacher_payouts')
      .insert({
        teacher_id,
        total_amount: totalAmount,
        currency: 'gbp',
        earnings_count: clearedEarnings.length,
        payout_method: 'wise',
        status: 'processing',
        processed_by: user.id,
        notes: `Wise payout for ${clearedEarnings.length} lessons → ${targetCurrency}`,
      })
      .select()
      .single()
    if (payoutCreateError) throw payoutCreateError

    try {
      // 1) Quote: convert GBP -> teacher's currency, sending a fixed GBP source amount
      const quote = await wiseFetch(cfg, `/v3/profiles/${profileId}/quotes`, {
        method: 'POST',
        body: JSON.stringify({
          sourceCurrency: 'GBP',
          targetCurrency,
          sourceAmount: totalAmount,
          payOut: 'BANK_TRANSFER',
        }),
      })

      // 2) Recipient account — IBAN when available, otherwise SWIFT
      const useIban = !!settings.bank_iban
      const recipientPayload = {
        currency: targetCurrency,
        type: useIban ? 'iban' : 'swift_code',
        profile: Number(profileId),
        accountHolderName: settings.bank_account_holder_name,
        details: useIban
          ? { IBAN: settings.bank_iban }
          : {
              swiftCode: settings.bank_swift_bic,
              accountNumber: settings.bank_iban || undefined,
              ...(settings.bank_country ? { legalType: 'PRIVATE', address: { country: settings.bank_country } } : {}),
            },
      }
      const recipient = await wiseFetch(cfg, `/v1/accounts`, {
        method: 'POST',
        body: JSON.stringify(recipientPayload),
      })

      // 3) Transfer
      const transfer = await wiseFetch(cfg, `/v1/transfers`, {
        method: 'POST',
        body: JSON.stringify({
          targetAccount: recipient.id,
          quoteUuid: quote.id,
          customerTransactionId: crypto.randomUUID(),
          details: {
            reference: `Talbiyah ${payout.id.slice(0, 8)}`,
            transferPurpose: 'verification.transfers.purpose.pay.bills',
            sourceOfFunds: 'verification.source.of.funds.other',
          },
        }),
      })

      // 4) Fund the transfer from the Wise balance
      await wiseFetch(cfg, `/v3/profiles/${profileId}/transfers/${transfer.id}/payments`, {
        method: 'POST',
        body: JSON.stringify({ type: 'BALANCE' }),
      })

      await supabaseClient
        .from('teacher_payouts')
        .update({
          status: 'completed',
          external_payout_id: String(transfer.id),
          completed_at: new Date().toISOString(),
          payment_details: { provider: 'wise', target_currency: targetCurrency, recipient_id: recipient.id, quote_id: quote.id },
        })
        .eq('id', payout.id)

      await supabaseClient
        .from('teacher_earnings')
        .update({ status: 'paid', payout_id: payout.id, paid_at: new Date().toISOString() })
        .in('id', clearedEarnings.map(e => e.id))

      return new Response(
        JSON.stringify({
          success: true,
          payout_id: payout.id,
          transfer_id: transfer.id,
          amount: totalAmount,
          currency: 'gbp',
          target_currency: targetCurrency,
          earnings_count: clearedEarnings.length,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    } catch (wiseError) {
      await supabaseClient
        .from('teacher_payouts')
        .update({
          status: 'failed',
          failed_at: new Date().toISOString(),
          failure_reason: (wiseError as Error).message,
        })
        .eq('id', payout.id)
      throw wiseError
    }
  } catch (error) {
    console.error('Error processing Wise payout:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
