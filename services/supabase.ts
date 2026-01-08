
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jforwngnlqyvlpqzuqpz.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmb3J3bmdubHF5dmxwcXp1cXB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNjY0NTksImV4cCI6MjA4Mjk0MjQ1OX0.f3WXFI972q4P-PKD_vWQo6fKzh9bedoQ6FzIgpJxU8M';

export const STORAGE_KEY = 'school_v14_auth';

// Initialize Supabase Client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storageKey: STORAGE_KEY,
        flowType: 'pkce'
    }
});

/**
 * Robust error formatter for enterprise-grade user feedback.
 * Prevents [object Object] by recursively extracting messages or stringifying the payload.
 */
export const formatError = (err: any): string => {
    if (!err) return "Synchronization Idle.";
    
    const JUNK_STRINGS = ["[object Object]", "{}", "null", "undefined"];

    // Handle string errors
    if (typeof err === 'string') {
        if (JUNK_STRINGS.includes(err)) return "Institutional system synchronization exception.";
        return err;
    }

    // Helper to find a descriptive message in an error object
    const getDeepMessage = (obj: any): string | null => {
        if (!obj || typeof obj !== 'object') return null;
        
        // Standard Supabase/Postgres error keys
        const keys = ['message', 'error_description', 'details', 'hint', 'error'];
        for (const key of keys) {
            const val = obj[key];
            if (val && typeof val === 'string' && !JUNK_STRINGS.includes(val)) return val;
            if (val && typeof val === 'object') {
                const deep = getDeepMessage(val);
                if (deep) return deep;
            }
        }
        return null;
    };

    // Handle specific Postgres error codes
    if (err.code === '42501') return "Security Violation: Access denied to this database node. Check RLS and Grants.";
    if (err.code === '42804') return "Database Engine Error: Type mismatch detected (UUID vs BIGINT). Please run schema migration.";
    if (err.code === '22P02') return "Data Integrity Error: Invalid identification format detected.";
    if (err.code === '23505') return "Registry Conflict: This identity node is already registered.";
    if (err.code === '42703') return "Verification service temporarily unavailable."; // Column does not exist

    const extracted = getDeepMessage(err);
    if (extracted) return extracted;

    // Last resort: Stringify the object to avoid [object Object]
    try {
        const str = JSON.stringify(err);
        if (str && !JUNK_STRINGS.includes(str)) return str;
    } catch (e) {
        // Fallback for circular references
    }

    return String(err) || "Institutional system exception during verification.";
};
