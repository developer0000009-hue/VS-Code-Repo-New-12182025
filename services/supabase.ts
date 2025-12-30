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
        if (typeof s !== 'string') return true;
        const lower = s.toLowerCase().trim();
        return lower === "[object object]" || lower === "{}" || lower === "null" || lower === "undefined" || lower === "";
    };

    // 1. Direct string check with junk protection
    if (typeof err === 'string') {
        if (isJunkString(err)) return "Institutional Protocol Failure (Object Context)";
        
        // INTERCEPT CASTING ERRORS
        if (err.toLowerCase().includes("cannot cast type bigint to uuid") || err.toLowerCase().includes("invalid input syntax for type uuid")) {
            return "Security Handshake Mismatch: This access code is linked to an incompatible identity format. Please re-provision the code in the Parent Portal.";
        }
        
        if (err.toLowerCase().includes("referenced identity node is unavailable")) {
            return "Node Desynchronization: The parent identity record is currently unreachable in the master registry.";
        }
        return err;
    }

    // 2. Standardize Error object handling
    if (err instanceof Error) {
        const msg = err.message;
        if (isJunkString(msg)) return "Institutional Protocol Failure (Error Context)";
        return msg;
    }

    // 3. Deep check for common nested error fields in plain objects
    if (typeof err === 'object' && err !== null) {
        // Recursively handle cases where `err.message` is an object (common in complex RPC failures)
        if (err.message && typeof err.message === 'object') {
            return formatError(err.message);
        }
        
        // Handle PostgREST/Supabase error structure
        const message = err.message || err.error_description || err.error?.message;
        if (message && typeof message === 'string' && !isJunkString(message)) {
            const lowerMsg = message.toLowerCase();
            
            // INTERCEPT CASTING ERRORS IN OBJECTS
            if (lowerMsg.includes("cannot cast type bigint to uuid") || lowerMsg.includes("invalid input syntax for type uuid")) {
                return "Security Handshake Mismatch: Incompatible identity format detected. Access code requires re-provisioning.";
            }

            if (lowerMsg.includes("foreign key") || lowerMsg.includes("violates constraint")) {
                return "Data Integrity Alert: A linked identity node is missing from the core registry.";
            }
            if (lowerMsg.includes("schema cache") || lowerMsg.includes("column") || lowerMsg.includes("does not exist")) {
                return `Data Structure Alignment Error: ${message}. Please verify the database schema and retry.`;
            }
            return message;
        }
        
        // Handle if err.error is a string
        if (err.error && typeof err.error === 'string' && !isJunkString(err.error)) {
            return err.error;
        }

        // Handle nested error property
        if (err.error && typeof err.error === 'object') {
            return formatError(err.error);
        }

        // Check for other common error fields
        const candidates = [err.details, err.hint, err.code, err.msg];
        for (const val of candidates) {
            if (typeof val === 'string' && !isJunkString(val)) {
                return val;
            }
        }
        
        // Final attempt: stringify to reveal internal structure if not already tried
        try {
            const stringified = JSON.stringify(err);
            if (stringified && !isJunkString(stringified)) {
                return stringified.length > 200 ? stringified.substring(0, 197) + "..." : stringified;
            }
        } catch {
            // Fall through
        }
    }

    const final = String(err);
    return isJunkString(final) ? "Institutional Protocol Failure" : final;
};