
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

            const { data, error } = await supabase
                .from('enquiries')
                .update({
                    status: 'ENQUIRY_NODE_VERIFIED',
                    updated_at: new Date().toISOString()
                })
                .eq('admission_id', admissionId)
                .select()
                .maybeSingle();

            if (error) throw error;
            if (!data) throw new Error("Enquiry node not found in registry.");

            return {
                success: true,
                message: "Enquiry identity verified successfully.",
                enquiry: data,
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
