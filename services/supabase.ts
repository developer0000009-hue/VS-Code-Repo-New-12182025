import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://lnqfoffbmafwkhgdadgw.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxucWZvZmZibWFmd2toZ2RhZGd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5MjM2NjUsImV4cCI6MjA3ODQ5OTY2NX0.kxsaKzmK4uYfOqjDSglL0s2FshAbd8kqt77EZiOI5Gg';

// Versioning the storage key ensures releases don't conflict with legacy sessions
export const STORAGE_KEY = 'school_v14_auth';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storageKey: STORAGE_KEY,
        flowType: 'pkce',
    },
});