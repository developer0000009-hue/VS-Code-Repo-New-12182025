import { supabase, formatError } from './supabase';
import { AdmissionVaultDetails } from '../types';

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
    },

    /**
     * Fetches complete admission details from the admissions table.
     * Used for displaying detailed information in verification flow.
     */
    async getAdmissionDetails(admissionId: string): Promise<{ success: boolean; admission?: AdmissionVaultDetails; error?: string }> {
        try {
            if (!admissionId) throw new Error("Admission ID required for fetching details.");

            const { data, error } = await supabase
                .from('admissions')
                .select(`
                    id,
                    applicant_name,
                    grade,
                    status,
                    date_of_birth,
                    gender,
                    parent_name,
                    parent_email,
                    parent_phone,
                    emergency_contact,
                    medical_info,
                    application_number,
                    submitted_at,
                    registered_at,
                    profile_photo_url,
                    parent_id,
                    student_user_id
                `)
                .eq('id', admissionId)
                .maybeSingle();

            if (error) throw error;
            if (!data) throw new Error("Admission record not found.");

            return {
                success: true,
                admission: data as AdmissionVaultDetails
            };
        } catch (err) {
            console.error("Failed to fetch admission details:", err);
            return {
                success: false,
                error: formatError(err)
            };
        }
    }
};
