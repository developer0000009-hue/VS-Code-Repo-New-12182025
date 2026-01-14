
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
 * Strengthened to strictly prevent [object Object] fallbacks.
 */
export const formatError = (err: any): string => {
    if (!err) return "Synchronization error.";
    
    // 1. Handle String Inputs
    if (typeof err === 'string') {
        const isJunk = err === "[object Object]" || err === "{}" || err === "null" || err === "undefined";
        return isJunk ? "Institutional protocol failure." : err;
    }

    // 2. Primary Key Extraction (Standard Supabase/PostgREST)
    let candidate = err.message || err.error_description || err.details || err.hint;
    
    // 3. Nested Auth/Error Object Probing
    if (!candidate || typeof candidate !== 'string' || candidate === "[object Object]") {
        if (err.error) {
            if (typeof err.error === 'string') candidate = err.error;
            else if (typeof err.error === 'object') {
                candidate = err.error.message || err.error.description || err.error.details;
            }
        }
    }

    // 4. Array Flattening
    if (Array.isArray(err) && err.length > 0) {
        return formatError(err[0]);
    }

    // 5. Final String Validation
    if (candidate && typeof candidate === 'string' && candidate !== "[object Object]" && candidate !== "{}") {
        return candidate;
    }

    // 6. Safe JSON Stringification Fallback
    try {
        const str = JSON.stringify(err);
        if (str && str !== '{}' && str !== '[]' && !str.includes("[object Object]")) {
            return str.length > 250 ? str.substring(0, 247) + "..." : str;
        }
    } catch { }

    // 7. Last Resort
    const finalFallback = String(err);
    return (finalFallback === '[object Object]' || finalFallback === '{}') 
        ? "Identity synchronization exception." 
        : finalFallback;
};
