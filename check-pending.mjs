import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://boyrjgivpepjiboekwuu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2ODI3MDcsImV4cCI6MjA3NzI1ODcwN30.-BEMiplFBMTofQDc68bSGDhW4YkH8xTtiohk-IFfzzU'
);

console.log('Checking pending_bookings...');

const { data, error } = await supabase
  .from('pending_bookings')
  .select('id, created_at, stripe_session_id, status')
  .eq('user_id', 'c8a77dba-a666-4a30-87df-a4c26043b6a4')
  .order('created_at', { ascending: false })
  .limit(5);

console.log('Result:', JSON.stringify(data, null, 2));
console.log('Error:', error);
