
import { supabase, formatError } from './supabase';

/**
 * Enquiry Domain Service
 * Manages the domain-isolated lifecycle of enquiries.
 */
export const EnquiryService = {
    /**
     * Processes an enquiry identity verification.
     * Strictly updates Enquiry state only.
     */
    async processEnquiryVerification(admissionId: string) {
        try {
            if (!admissionId) throw new Error("Reference ID required for processing.");

            // First get the enquiry ID from admission_id
            const { data: enquiryData, error: fetchError } = await supabase
                .from('enquiries')
                .select('id')
                .eq('admission_id', admissionId)
                .maybeSingle();

            if (fetchError) throw fetchError;
            if (!enquiryData) throw new Error("Enquiry node not found in registry.");

            // Use RPC to update status (bypasses RLS issues)
            const { error: updateError } = await supabase.rpc('update_enquiry_status', {
                p_enquiry_id: enquiryData.id,
                p_new_status: 'ENQUIRY_VERIFIED',
                p_notes: 'Verified via access code'
            });

            if (updateError) throw updateError;

            // Fetch updated enquiry
            const { data: updatedEnquiry, error: fetchUpdatedError } = await supabase
                .from('enquiries')
                .select('*')
                .eq('id', enquiryData.id)
                .single();

            if (fetchUpdatedError) throw fetchUpdatedError;

            return {
                success: true,
                message: "Enquiry identity verified successfully.",
                enquiry: updatedEnquiry,
                targetModule: 'Enquiries'
            };
        } catch (err) {
            console.error("Enquiry Domain Processing Failure:", err);
            throw new Error(formatError(err));
        }
    },

    /**
     * Finalizes the enquiry stage and promotes the node to the Admission Vault.
     */
    async convertToAdmission(enquiryId: string) {
        try {
            if (!enquiryId) throw new Error("Node ID required for conversion.");

            const { data, error } = await supabase.rpc('convert_enquiry_to_admission', {
                p_enquiry_id: enquiryId
            });

            if (error) throw error;
            if (!data.success) throw new Error(data.message);

            return {
                success: true,
                message: data.message,
                admissionId: data.admission_id
            };
        } catch (err) {
            const formatted = formatError(err);
            console.error("Enquiry Promotion Failure:", formatted);
            throw new Error(formatted);
        }
    }
};
