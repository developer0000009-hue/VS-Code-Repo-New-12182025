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

/**
 * Global Error Normalizer
 * Robustly extracts human-readable messages from Supabase, PostgREST, and Network errors.
 * Prevents the dreaded [object Object] from reaching the UI.
 */
export const formatError = (err: any): string => {
    if (!err) return "An unknown error occurred.";
    
    const isJunkString = (s: string) => {
        const lower = s.toLowerCase().trim();
        return lower === "[object object]" || lower === "{}" || lower === "null" || lower === "undefined" || lower === "";
    };

    // 1. Direct string check
    if (typeof err === 'string') {
        if (err.toLowerCase().includes("referenced identity node is unavailable")) {
            return "Node Desynchronization: The parent identity record is currently unreachable in the master registry.";
        }
        return isJunkString(err) ? "Institutional Protocol Failure" : err;
    }

    // 2. Standardize Error object handling
    if (err instanceof Error) {
        const msg = err.message;
        if (msg.toLowerCase().includes("identity node is unavailable")) {
             return "Registry Alert: Parent identity node not found or de-provisioned.";
        }
        return msg && !isJunkString(msg) ? msg : "Institutional Protocol Failure";
    }

    // 3. Deep check for common nested error fields
    if (typeof err === 'object') {
        // Handle PostgREST/Supabase error structure
        const message = err.message || err.error_description || err.error?.message;
        if (message && typeof message === 'string' && !isJunkString(message)) {
            const lowerMsg = message.toLowerCase();
            
            // Mask technical DB errors with professional, descriptive messages
            if (lowerMsg.includes("foreign key") || lowerMsg.includes("violates constraint")) {
                return "Data Integrity Alert: A linked identity node is missing from the core registry.";
            }
            if (lowerMsg.includes("schema cache") || lowerMsg.includes("column") || lowerMsg.includes("does not exist")) {
                return "System Sync Delay: Data structure alignment is in progress. Please retry.";
            }
            return message;
        }

        // Handle nested error property
        if (err.error && typeof err.error === 'object') {
            return formatError(err.error);
        }

        // Check for other common error fields
        const candidates = [
            err.details,
            err.hint,
            err.code,
            err.msg
        ];

        for (const val of candidates) {
            if (typeof val === 'string' && !isJunkString(val)) {
                return val;
            }
        }

        // 4. Final attempt: stringify with junk protection
        try {
            const stringified = JSON.stringify(err);
            if (stringified && !isJunkString(stringified)) {
                return stringified.length > 150 ? stringified.substring(0, 147) + "..." : stringified;
            }
        } catch {
            // Fall through
        }
    }

    const final = String(err);
    return isJunkString(final) ? "Institutional Protocol Failure" : final;
};
