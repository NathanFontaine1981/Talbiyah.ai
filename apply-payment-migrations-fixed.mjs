import { readFileSync } from 'fs';

const PROJECT_REF = 'boyrjgivpepjiboekwuu';
const ACCESS_TOKEN = 'sbp_5f3b1ff4e30dd431d2ede8ba2032b70bb035c3ff';

const migrations = [
  {
    name: 'add_stripe_payment_fields_fixed',
    file: 'supabase/migrations/20251112130001_add_stripe_payment_fields_fixed.sql',
    description: 'Adds Stripe payment tracking fields (fixed version)'
  },
  {
    name: 'add_payment_logging_fixed',
    file: 'supabase/migrations/20251112140001_add_payment_logging_fixed.sql',
    description: 'Adds payment_logs table and audit trail (fixed version)'
  }
];

console.log('🚀 APPLYING FIXED PAYMENT MIGRATIONS\n');
console.log('━'.repeat(60));

for (const migration of migrations) {
  console.log(`\n📋 Migration: ${migration.name}`);
  console.log(`   Description: ${migration.description}`);

  try {
    const sql = readFileSync(migration.file, 'utf-8');
    console.log(`   🔄 Applying...`);

    const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: sql
      })
    });

    if (response.ok) {
      console.log(`   ✅ SUCCESS!`);
    } else {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }

      if (errorData.message && (
        errorData.message.includes('already exists') ||
        errorData.message.includes('duplicate')
      )) {
        console.log(`   ⏭️  SKIPPED (already applied)`);
      } else {
        console.log(`   ❌ FAILED!`);
        console.log(`   Error: ${errorData.message || errorText}`);
        process.exit(1);
      }
    }

  } catch (error) {
    console.log(`   ❌ EXCEPTION: ${error.message}`);
    process.exit(1);
  }

  console.log('   ' + '-'.repeat(56));
}

console.log('\n' + '━'.repeat(60));
console.log('🎉 ALL MIGRATIONS APPLIED SUCCESSFULLY!\n');
console.log('✅ Database is ready for enhanced Stripe integration');
console.log('\nNext steps:');
console.log('  1. ✅ Database schema updated');
console.log('  2. ⏭️  Enhance initiate-booking-checkout function');
console.log('  3. ⏭️  Enhance stripe-webhooks function');
console.log('  4. ⏭️  Test price locks and payment logging\n');
