
import { supabase } from './supabase';

export const BUCKETS = {
    PROFILES: 'profile-images',
    DOCUMENTS: 'student-documents', // Standardized for Admissions
    GUARDIAN_DOCUMENTS: 'guardian-documents' // For parent-uploaded admission documents
} as const;

export type BucketName = typeof BUCKETS[keyof typeof BUCKETS];

/**
 * Enterprise Storage Service
 * Enforces strict path conventions for RLS compliance and School-Parent Sync.
 */
export const StorageService = {
    getProfilePath: (type: 'parent' | 'child' | 'teacher', userId: string) => {
        return `${type}/${userId}/avatar_${Date.now()}.png`;
    },

    /**
     * Standardizes document paths for Admission Sync
     * Pattern: {admission_id}/{artifact_type}/{filename}
     */
    getDocumentPath: (admissionId: string, type: string, fileName: string) => {
        const cleanType = type.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
        const ext = fileName.split('.').pop() || 'dat';
        return `${admissionId}/${cleanType}/${crypto.randomUUID()}.${ext}`;
    },

    async upload(bucket: BucketName, path: string, file: File) {
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(path, file, {
                cacheControl: '3600',
                upsert: true
            });

        if (error) {
            // Handle bucket not found error gracefully
            if (error.message?.includes('Bucket not found')) {
                throw new Error(`Storage bucket '${bucket}' not found. Please ensure the bucket exists in Supabase Storage and has proper permissions.`);
            }
            throw error;
        }
        return { path: data.path };
    },

    /**
     * Get public URL for a file in a public bucket
     */
    getPublicUrl(bucket: BucketName, path: string) {
        const { data } = supabase.storage
            .from(bucket)
            .getPublicUrl(path);
        return data.publicUrl;
    },

    async getSignedUrl(bucket: BucketName, path: string, expiresIn = 3600) {
        const { data, error } = await supabase.storage
            .from(bucket)
            .createSignedUrl(path, expiresIn);

        if (error) {
            // Handle bucket not found error gracefully
            if (error.message?.includes('Bucket not found')) {
                throw new Error(`Storage bucket '${bucket}' not found. Please ensure the bucket exists in Supabase Storage and has proper permissions.`);
            }
            throw error;
        }
        return data.signedUrl;
    },

    async download(bucket: BucketName, path: string) {
        const { data, error } = await supabase.storage
            .from(bucket)
            .download(path);

        if (error) {
            // Handle bucket not found error gracefully
            if (error.message?.includes('Bucket not found')) {
                throw new Error(`Storage bucket '${bucket}' not found. Please ensure the bucket exists in Supabase Storage and has proper permissions.`);
            }
            throw error;
        }
        return data;
    }
};
