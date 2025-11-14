#!/bin/bash

echo "Manually testing webhook with session cs_live_b1LGyRL7yj0gINVuIJALUulSLlVL2IxTixBE79RLTxbjfb3hrfjj9ycqtp"
echo ""

# First check if pending_booking exists
echo "1. Checking for pending_booking with this session..."
curl -s "https://boyrjgivpepjiboekwuu.supabase.co/rest/v1/pending_bookings?select=*&stripe_session_id=eq.cs_live_b1LGyRL7yj0gINVuIJALUulSLlVL2IxTixBE79RLTxbjfb3hrfjj9ycqtp" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2ODI3MDcsImV4cCI6MjA3NzI1ODcwN30.-BEMiplFBMTofQDc68bSGDhW4YkH8xTtiohk-IFfzzU" | jq

echo ""
echo "2. Simulating Stripe webhook call..."
curl -X POST https://boyrjgivpepjiboekwuu.supabase.co/functions/v1/stripe-webhooks-simple \
  -H "Content-Type: application/json" \
  -d '{
    "type": "checkout.session.completed",
    "data": {
      "object": {
        "id": "cs_live_b1LGyRL7yj0gINVuIJALUulSLlVL2IxTixBE79RLTxbjfb3hrfjj9ycqtp",
        "metadata": {
          "pending_booking_id": "WILL_GET_FROM_QUERY_ABOVE"
        }
      }
    }
  }'

echo ""
