const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2ODI3MDcsImV4cCI6MjA3NzI1ODcwN30.-BEMiplFBMTofQDc68bSGDhW4YkH8xTtiohk-IFfzzU';

const response = await fetch('https://boyrjgivpepjiboekwuu.supabase.co/functions/v1/stripe-webhooks-simple', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ANON_KEY}`
  },
  body: JSON.stringify({
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_live_b1LGyRL7yj0gINVuIJALUulSLlVL2IxTixBE79RLTxbjfb3hrfjj9ycqtp',
        metadata: {
          pending_booking_id: '433529c0-7e5f-4637-9d37-bbe41b8ab272',
          user_id: 'c8a77dba-a666-4a30-87df-a4c26043b6a4',
          session_count: '1',
          total_amount: '750'
        }
      }
    }
  })
});

const result = await response.json();
console.log('Status:', response.status);
console.log('Response:', JSON.stringify(result, null, 2));
