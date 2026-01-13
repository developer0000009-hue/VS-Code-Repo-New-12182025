import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jforwngnlqyvlpqzuqpz.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmb3J3bmdubHF5dmxwcXp1cXB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNjY0NTksImV4cCI6MjA4Mjk0MjQ1OX0.f3WXFI972q4P-PKD_vWQo6fKzh9bedoQ6FzIgpJxU8M';

export const STORAGE_KEY = 'school_v15_auth_session';

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
 * Institutional Error Protocol
 * Translates low-level SQL/API errors into actionable user guidance.
 */
export const formatError = (err: any): string => {
    if (!err) return "Synchronization error.";
    if (typeof err === 'string') return err;

    // Check for nested error object (Supabase sometimes nests it)
    if (err.error && typeof err.error === 'object') return formatError(err.error);

    const errorMessage = (err.message || '').toLowerCase();
    
    // Handle specific missing column errors
    if (errorMessage.includes('column "purpose" of relation "share_codes" does not exist')) {
        return "Schema Mismatch: 'share_codes' table is missing the 'purpose' column. Please run the latest SQL migration from schema.txt.";
    }

    if (errorMessage.includes('invalid login credentials') || errorMessage.includes('invalid api key')) {
        return "Invalid Node Identifier or Access Key.";
    }

    // Handle the specific 'uuid = bigint' casting error (Postgres 42883)
    if (err.code === '42883' || (errorMessage && errorMessage.includes('operator does not exist: uuid = bigint'))) {
        return "Identity Mismatch: Your database registry uses numeric IDs instead of secure tokens. Please apply the 'v20.3.0 Registry Fix' from schema.txt via the Supabase SQL Editor.";
    }

    if (err.code === 'PGRST116') return "Node not found in registry.";
    if (err.code === '23505') return "Duplicate record detected in the vault.";
    if (err.code === '42P01') return "Table missing. Please initialize schema.txt.";
    
    // Handle generic column missing error
    if (err.code === '42703') return `Database Schema Error: ${err.message}. Please update your database schema.`;

    const message = err.message || err.error_description || err.details || err.hint;
    if (message && typeof message === 'string' && !message.includes("[object Object]")) {
        return message;
    }

    try {
        const str = JSON.stringify(err);
        if (str && str !== '{}' && str !== '[]' && !str.includes("[object Object]")) return str;
    } catch { }

    return "System encountered an unreadable error.";
};