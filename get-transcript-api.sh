#!/bin/bash
curl -s -X POST "https://boyrjgivpepjiboekwuu.supabase.co/functions/v1/get-transcript-content" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY4MjcwNywiZXhwIjoyMDc3MjU4NzA3fQ.8bjdYy46MPL58Z4l5yqW9WOEOMDoPU-BmqyZNdroZ_Q" \
  -d '{"room_id": "69298254cd12050d5608f8d6"}'
