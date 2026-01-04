import { supabase, formatError } from './supabase';

/**
 * Admission Domain Service
 * Manages the domain-isolated lifecycle of admissions.
 */
export const AdmissionService = {
    /**
     * Processes an admission identity verification.
     * Strictly updates Admission state only.
     */
    async processAdmissionVerification(admissionId: string) {
        try {
            if (!admissionId) throw new Error("Reference ID required for processing.");

            const { data, error } = await supabase
                .from('admissions')
                .update({
                    status: 'Verified',
                    updated_at: new Date().toISOString()
                })
                .eq('id', admissionId)
                .select()
                .maybeSingle();

            if (error) throw error;
            if (!data) throw new Error("Admission record not found in registry.");

            return {
                success: true,
                message: "Admission identity verified successfully.",
                admission: data,
                targetModule: 'Admissions'
            };
        } catch (err) {
            console.error("Admission Domain Processing Failure:", err);
            throw new Error(formatError(err));
        }
    }
};
