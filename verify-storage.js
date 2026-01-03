/**
 * Storage Bucket Verification Script
 * Run this in the browser console or as a Node.js script to verify Supabase Storage configuration
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jforwngnlqyvlpqzuqpz.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmb3J3bmdubHF5dmxwcXp1cXB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ1MzQ5ODUsImV4cCI6MjA1MDExMDk4NX0.0Jx9Bc8W4zH8vF8X4zH8vF8X4zH8vF8X4zH8vF8X';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyStorageBuckets() {
  console.log('🔍 Verifying Supabase Storage Configuration...\n');

  const requiredBuckets = ['profile-images', 'student-documents', 'guardian-documents'];

  for (const bucketName of requiredBuckets) {
    try {
      console.log(`📦 Checking bucket: ${bucketName}`);

      // Try to list files (this will fail if bucket doesn't exist or no permissions)
      const { data, error } = await supabase.storage.from(bucketName).list('', { limit: 1 });

      if (error) {
        if (error.message.includes('Bucket not found')) {
          console.log(`❌ Bucket '${bucketName}' does NOT exist!`);
          console.log(`   📋 Create this bucket in Supabase Dashboard → Storage`);
          console.log(`   🔧 Set as PUBLIC bucket for profile images\n`);
        } else {
          console.log(`⚠️  Permission issue with bucket '${bucketName}': ${error.message}\n`);
        }
      } else {
        console.log(`✅ Bucket '${bucketName}' exists and is accessible\n`);

        // Test public URL generation
        const testPath = 'test/path/image.png';
        const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(testPath);
        console.log(`🌐 Public URL format: ${urlData.publicUrl}`);
        console.log(`   This should be accessible without authentication\n`);
      }

    } catch (err) {
      console.log(`💥 Unexpected error checking bucket '${bucketName}': ${err.message}\n`);
    }
  }

  console.log('🔧 Storage Verification Recommendations:');
  console.log('1. Ensure all required buckets exist in Supabase Storage');
  console.log('2. Set profile-images bucket to PUBLIC (not private)');
  console.log('3. Configure appropriate RLS policies for parent uploads');
  console.log('4. Test file uploads manually in Supabase Dashboard');
  console.log('\n📖 Supabase Storage Docs: https://supabase.com/docs/guides/storage');
}

// Browser console version (if run in browser)
if (typeof window !== 'undefined') {
  window.verifyStorageBuckets = verifyStorageBuckets;
  console.log('💡 Run verifyStorageBuckets() in the browser console to check storage configuration');
}

// Node.js version
if (typeof require !== 'undefined' && require.main === module) {
  verifyStorageBuckets().catch(console.error);
}

module.exports = { verifyStorageBuckets };
