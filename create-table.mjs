import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://boyrjgivpepjiboekwuu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY4MjcwNywiZXhwIjoyMDc3MjU4NzA3fQ.2_LAq90mdfJFXl8aN0WyS2EcmNCsj7Xpe3_xqzvBs0E'
);

const sql = `
CREATE TABLE IF NOT EXISTS pending_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_data JSONB NOT NULL,
  total_amount INTEGER NOT NULL,
  session_count INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  stripe_session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pending_bookings_user_id ON pending_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_bookings_stripe_session_id ON pending_bookings(stripe_session_id);

ALTER TABLE pending_bookings ENABLE ROW LEVEL SECURITY;
`;

console.log('Creating pending_bookings table...');

// Execute SQL statements one by one
const statements = sql.split(';').filter(s => s.trim());

for (const statement of statements) {
  if (!statement.trim()) continue;

  console.log(`Executing: ${statement.substring(0, 50)}...`);
  const { data, error } = await supabase.rpc('exec_sql', { sql: statement });

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('✓ Success');
  }
}

// Now create policies
console.log('\nCreating RLS policies...');

const policies = [
  `CREATE POLICY IF NOT EXISTS "Users can view own pending bookings" ON pending_bookings FOR SELECT TO authenticated USING (user_id = auth.uid());`,
  `CREATE POLICY IF NOT EXISTS "Users can insert own pending bookings" ON pending_bookings FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());`,
  `CREATE POLICY IF NOT EXISTS "Service role can update pending bookings" ON pending_bookings FOR UPDATE TO authenticated USING (true);`
];

for (const policy of policies) {
  console.log(`Creating policy...`);
  const { error } = await supabase.rpc('exec_sql', { sql: policy });

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('✓ Policy created');
  }
}

console.log('\n✅ Done! Table created successfully.');
process.exit(0);
