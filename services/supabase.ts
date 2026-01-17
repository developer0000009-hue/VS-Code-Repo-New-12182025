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
 * Prevent [object Object] fallbacks through strict type checking and recursive probing.
 */
export const formatError = (err: any): string => {
    if (!err) return "Synchronization error.";
    
    // 1. Direct string check for generic object stringifications
    if (typeof err === 'string') {
        const trimmed = err.trim();
        if (trimmed === "[object Object]" || trimmed === "{}" || !trimmed) {
            return "An unexpected system error occurred (Protocol Exception).";
        }
        return trimmed;
    }

    // 2. Standard Error object check
    if (err instanceof Error && err.message) {
        const msg = String(err.message).trim();
        if (msg !== "[object Object]" && msg !== "{}") {
            return msg;
        }
    }

    // 3. Deep probe for priority fields in custom objects
    const findMessage = (obj: any, depth = 0): string | null => {
        if (!obj || depth > 5) return null;
        
        if (typeof obj === 'string') {
            const trimmed = obj.trim();
            if (trimmed === "[object Object]" || trimmed === "{}" || !trimmed) return null;
            return trimmed;
        }

        // Check for specific known conflict messages
        if (obj.message && typeof obj.message === 'string' && obj.message.includes('choose the best candidate function')) {
            return "Structural Registry Conflict: Multiple versions of the database function exist. Please apply the latest SQL migrations.";
        }
        
        // Priority fields for common error structures (Supabase/Postgres)
        const priorityFields = ['message', 'error_description', 'error', 'details', 'hint', 'msg', 'code'];
        
        for (const field of priorityFields) {
            const val = obj[field];
            
            // If the priority field is a string, return it if it's not a generic object string
            if (typeof val === 'string') {
                const trimmed = val.trim();
                if (trimmed && trimmed !== "[object Object]" && trimmed !== "{}") {
                    return trimmed;
                }
            }
            
            // If the priority field is itself an object, probe it recursively
            if (typeof val === 'object' && val !== null) {
                const nested = findMessage(val, depth + 1);
                if (nested) return nested;
            }
        }
        return null;
    };

    const message = findMessage(err);
    if (message) return message;

    // 4. Last-ditch JSON stringification attempt
    try {
        const str = JSON.stringify(err);
        if (str && str !== '{}' && str !== '[]' && !str.includes("[object Object]")) {
            return `System Error: ${str.substring(0, 150)}${str.length > 150 ? '...' : ''}`;
        }
    } catch { }

    // Hard fallback to a human-readable generic message
    return "An unexpected system error occurred (Identity Handshake Protocol Exception).";
};