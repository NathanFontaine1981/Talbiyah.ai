import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://boyrjgivpepjiboekwuu.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY4MjcwNywiZXhwIjoyMDc3MjU4NzA3fQ.IXUBhFJDOT5GXE33sP3Mg-fwDDOsEApCqC0IWIWQiIY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const sessionId = 'cs_test_a1p2qXHopb9ssWUfwWfoxi6uZdZvrDjhRtOofv0tPA90gmsr7IHyQtiHpm';

console.log('🔧 Manually processing credit purchase...');
console.log('Session ID:', sessionId);

// You'll need to tell me:
// 1. Which pack did you buy? (light/standard/intensive)
// 2. What's your user ID?

console.log('\n❓ Please provide:');
console.log('1. Pack type purchased (light/standard/intensive)');
console.log('2. Your user ID (check Supabase auth.users table)');
console.log('\nOnce you provide this info, I can manually create the purchase record and add credits.');
