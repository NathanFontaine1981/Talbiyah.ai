#!/usr/bin/env node

// Test Email Script
// Sends a test booking notification email

const SUPABASE_URL = 'https://boyrjgivpepjiboekwuu.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2ODI3MDcsImV4cCI6MjA3NzI1ODcwN30.-BEMiplFBMTofQDc68bSGDhW4YkH8xTtiohk-IFfzzU';

// Get email from command line argument or use default
const testEmail = process.argv[2] || 'test@example.com';

console.log('🧪 Testing Email Notification');
console.log('==============================');
console.log('Sending test email to:', testEmail);
console.log('');

const testData = {
  teacher_email: testEmail,
  teacher_name: 'Test Teacher',
  student_name: 'Aisha Rahman',
  subject_name: 'Quran Recitation',
  scheduled_date: '2025-11-15',
  scheduled_time: '14:00',
  duration_minutes: 60,
  booking_id: 'test-' + Date.now()
};

console.log('📋 Test Data:');
console.log(JSON.stringify(testData, null, 2));
console.log('');

async function sendTestEmail() {
  try {
    console.log('📤 Sending request to edge function...');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-booking-notification`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'apikey': ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log('Response status:', response.status, response.statusText);
    console.log('');

    const result = await response.json();

    if (response.ok) {
      console.log('✅ SUCCESS! Email sent successfully!');
      console.log('');
      console.log('📧 Email Details:');
      console.log('   Email ID:', result.email_id);
      console.log('   To:', testEmail);
      console.log('');
      console.log('🔍 Check your inbox (and spam folder!)');
      console.log('📊 View in Resend Dashboard: https://resend.com/emails');
    } else {
      console.log('❌ ERROR: Failed to send email');
      console.log('');
      console.log('Error details:', result);
      console.log('');
      console.log('Troubleshooting:');
      console.log('1. Check that RESEND_API_KEY is set in Supabase');
      console.log('2. Verify your sender email in Resend: https://resend.com/domains');
      console.log('3. Check Resend logs: https://resend.com/emails');
    }

  } catch (error) {
    console.log('💥 EXCEPTION:', error.message);
    console.log('');
    console.log('Full error:', error);
  }
}

sendTestEmail();
