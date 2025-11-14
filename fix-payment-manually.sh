#!/bin/bash

echo "Manually processing your payment..."
echo "Pending Booking ID: 433529c0-7e5f-4637-9d37-bbe41b8ab272"
echo ""

curl -X POST https://boyrjgivpepjiboekwuu.supabase.co/functions/v1/stripe-webhooks-simple \
  -H "Content-Type: application/json" \
  -d '{
    "type": "checkout.session.completed",
    "data": {
      "object": {
        "id": "cs_live_b1LGyRL7yj0gINVuIJALUulSLlVL2IxTixBE79RLTxbjfb3hrfjj9ycqtp",
        "metadata": {
          "pending_booking_id": "433529c0-7e5f-4637-9d37-bbe41b8ab272",
          "user_id": "c8a77dba-a666-4a30-87df-a4c26043b6a4",
          "session_count": "1",
          "total_amount": "750"
        }
      }
    }
  }' | jq

echo ""
echo ""
echo "Checking if lesson was created..."
sleep 2

curl -s "https://boyrjgivpepjiboekwuu.supabase.co/rest/v1/lessons?select=id,created_at,payment_status,student_id,scheduled_time&order=created_at.desc&limit=1" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2ODI3MDcsImV4cCI6MjA3NzI1ODcwN30.-BEMiplFBMTofQDc68bSGDhW4YkH8xTtiohk-IFfzzU" | jq

echo ""
