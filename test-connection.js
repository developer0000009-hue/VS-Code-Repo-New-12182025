import { createClient } from '@supabase/supabase-js';

// Use the same environment variables as the app
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jforwngnlqyvlpqzuqpz.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmb3J3bmdubHF5dmxwcXp1cXB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNjY0NTksImV4cCI6MjA4Mjk0MjQ1OX0.f3WXFI972q4P-PKD_vWQo6fKzh9bedoQ6FzIgpJxU8M';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
    }
});

async function testConnection() {
    console.log('🧪 Testing Supabase Connection...\n');

    try {
        // Test 1: Basic connection
        console.log('1. Testing basic connection...');
        const { data: healthData, error: healthError } = await supabase.rpc('check_service_health');
        if (healthError) {
            console.log('❌ RPC check_service_health failed:', healthError.message);
        } else {
            console.log('✅ Basic connection works:', healthData);
        }

        // Test 2: Direct table access
        console.log('\n2. Testing direct table access (enquiries)...');
        const { data: tableData, error: tableError } = await supabase
            .from('enquiries')
            .select('id, applicant_name, status')
            .limit(5);

        if (tableError) {
            console.log('❌ Direct table access failed:', tableError.message);
            console.log('Error code:', tableError.code);
            console.log('Details:', tableError.details);
        } else {
            console.log('✅ Direct table access works. Found', tableData.length, 'enquiries');
        }

        // Test 3: RPC function for enquiries
        console.log('\n3. Testing RPC function get_enquiries_for_node...');
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_enquiries_for_node', {
            p_branch_id: null
        });

        if (rpcError) {
            console.log('❌ RPC get_enquiries_for_node failed:', rpcError.message);
            console.log('Error code:', rpcError.code);

            // Create a sample enquiry if RPC fails and no enquiries exist
            if (tableData && tableData.length === 0) {
                console.log('\n4. Creating sample enquiry for testing...');
                const { data: sampleData, error: sampleError } = await supabase
                    .from('enquiries')
                    .insert({
                        applicant_name: 'Test Student',
                        grade: '5',
                        status: 'NEW',
                        parent_name: 'Test Parent',
                        parent_email: 'test@example.com',
                        parent_phone: '+1234567890',
                        branch_id: null,
                        verification_status: 'PENDING',
                        conversion_state: 'NOT_CONVERTED',
                        is_archived: false,
                        is_deleted: false
                    })
                    .select();

                if (sampleError) {
                    console.log('❌ Failed to create sample enquiry:', sampleError.message);
                } else {
                    console.log('✅ Sample enquiry created:', sampleData[0]?.id);
                }
            }
        } else {
            console.log('✅ RPC function works. Found', Array.isArray(rpcData) ? rpcData.length : 'unknown', 'enquiries');
        }

        // Test 4: Authentication check
        console.log('\n4. Testing authentication...');
        const { data: authData, error: authError } = await supabase.auth.getSession();
        if (authError) {
            console.log('❌ Auth check failed:', authError.message);
        } else {
            console.log('✅ Auth session retrieved (may be null for anonymous access)');
        }

        console.log('\n🎯 Connection test completed.');

    } catch (error) {
        console.error('💥 Unexpected error:', error);
    }
}

// Run the test
testConnection();