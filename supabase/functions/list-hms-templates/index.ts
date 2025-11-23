import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const HMS_MANAGEMENT_TOKEN = Deno.env.get('HMS_MANAGEMENT_TOKEN')

  try {
    const response = await fetch('https://api.100ms.live/v2/templates', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${HMS_MANAGEMENT_TOKEN}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      return new Response(JSON.stringify({
        error: 'Failed to fetch templates',
        status: response.status,
        details: errorText
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: response.status
      })
    }

    const data = await response.json()
    console.log('Templates:', JSON.stringify(data, null, 2))

    return new Response(JSON.stringify(data, null, 2), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
