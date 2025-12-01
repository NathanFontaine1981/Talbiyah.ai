const response = await fetch('https://boyrjgivpepjiboekwuu.supabase.co/functions/v1/fetch-insight', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2ODI3MDcsImV4cCI6MjA3NzI1ODcwN30.-BEMiplFBMTofQDc68bSGDhW4YkH8xTtiohk-IFfzzU'
  },
  body: JSON.stringify({ insightId: 'def6b825-f0c2-4058-bbe9-1a72c1720b56' })
});

const data = await response.json();

console.log('='.repeat(80));
console.log('LESSON INSIGHT: ' + data.title);
console.log('='.repeat(80));
console.log('\nSummary:', data.summary);
console.log('\nKey Topics:', data.key_topics?.join(', '));
console.log('\n' + '='.repeat(80));
console.log('DETAILED CONTENT:');
console.log('='.repeat(80));
console.log(data.detailed_insights?.content || 'No content');
