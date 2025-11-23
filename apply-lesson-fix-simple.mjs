import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://boyrjgivpepjiboekwuu.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY4MjcwNywiZXhwIjoyMDc3MjU4NzA3fQ.IXUBhFJDOT5GXE33sP3Mg-fwDDOsEApCqC0IWIWQiIY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const sql = fs.readFileSync('./supabase/migrations/20251117200000_fix_lesson_confirmation_functions.sql', 'utf8');

async function applyFix() {
  console.log('🔧 Applying lesson confirmation function fixes...\n');

  try {
    // Use fetch to execute raw SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Error response:', error);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log('✅ Migration applied successfully!\n');

    // Test the function
    console.log('🔍 Testing get_teacher_pending_lessons function...');
    const { data, error } = await supabase
      .rpc('get_teacher_pending_lessons', {
        p_teacher_id: 'dffab54a-d120-4044-9db6-e5d987b3d5d5'
      });

    if (error) {
      console.error('❌ Function test error:', error);
    } else {
      console.log('✅ Function working! Returned:', data ? data.length : 0, 'pending lessons');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

applyFix();
