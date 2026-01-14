import { supabase } from './supabase';

export const BUCKETS = {
    PROFILES: 'profile-images',
    DOCUMENTS: 'guardian-documents'
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
     * Pattern: parent/{parent_id}/adm-{admission_id}/req-{requirement_id}_{timestamp}
     */
    getDocumentPath: (parentId: string, admissionId: string, requirementId: number, fileName: string) => {
        const ext = fileName.split('.').pop() || 'dat';
        return `parent/${parentId}/adm-${admissionId}/req-${requirementId}_${Date.now()}.${ext}`;
    },

    async upload(bucket: BucketName, path: string, file: File, onProgress?: (progress: number) => void) {
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(path, file, {
                cacheControl: '3600',
                upsert: true,
            });

        if (error) throw error;
        return { path: data.path };
    },

    async getSignedUrl(path: string, expiresIn = 3600) {
        const { data, error } = await supabase.storage
            .from(BUCKETS.DOCUMENTS)
            .createSignedUrl(path, expiresIn);
            
        if (error) throw error;
        return data.signedUrl;
    }
};
