
import { supabase } from './supabase';

export const BUCKETS = {
    PROFILES: 'profile-images',
    DOCUMENTS: 'guardian-documents'
} as const;

export type BucketName = typeof BUCKETS[keyof typeof BUCKETS];

/**
 * Enterprise Storage Service
 * Enforces strict path conventions for RLS compliance.
 */
export const StorageService = {
    /**
     * Standardizes profile image paths
     * Pattern: [type]/[user_id]/avatar_[timestamp].png
     */
    getProfilePath: (type: 'parent' | 'child' | 'teacher', userId: string) => {
        return `${type}/${userId}/avatar_${Date.now()}.png`;
    },

    /**
     * Standardizes document paths
     * Pattern: documents/[parent_id]/[admission_id]/[type]/[uuid].[ext]
     * CRITICAL: parent_id MUST be at index 2 for RLS policies using (storage.foldername(name))[2]
     */
    getDocumentPath: (parentId: string, childId: string | number, type: string, fileName: string) => {
        const cleanType = type.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
        const ext = fileName.split('.').pop() || 'dat';
        return `documents/${parentId}/${childId}/${cleanType}/${crypto.randomUUID()}.${ext}`;
    },

    /**
     * Uploads a file with built-in error handling and path management
     */
    async upload(bucket: BucketName, path: string, file: File) {
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(path, file, {
                cacheControl: '3600',
                upsert: true
            });

        if (error) {
            console.error(`Storage Upload Error [${bucket}]:`, error);
            throw error;
        }

        return {
            path: data.path
        };
    },

    /**
     * Resolves a storage path into a public URL
     */
    getPublicUrl(bucket: BucketName, path: string) {
        const { data } = supabase.storage
            .from(bucket)
            .getPublicUrl(path);
        return data.publicUrl;
    },

    /**
     * Generates a short-lived signed URL for sensitive document viewing.
     */
    async resolveUrl(bucket: BucketName, path: string, expiresIn = 3600) {
        if (!path) throw new Error("Reference path missing.");
        
        const { data, error } = await supabase.storage
            .from(bucket)
            .createSignedUrl(path, expiresIn);
            
        if (error) {
            console.error(`Storage Resolve Error [${bucket}]:`, error);
            throw error;
        }
        
        return data.signedUrl;
    }
};
