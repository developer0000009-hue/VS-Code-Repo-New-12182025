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
    async processEnquiryVerification(enquiryId: string | number) {
        try {
            // Ensure ID is treated consistently as a string for filtering
            const id = String(enquiryId);
            if (!id) throw new Error("Reference ID required for processing.");

            const { data, error } = await supabase
                .from('enquiries')
                .update({ 
                    status: 'ENQUIRY_VERIFIED',
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .maybeSingle();

            if (error) throw error;
            if (!data) throw new Error(`Enquiry node (${id}) not found in registry.`);

            return {
                success: true,
                message: "Enquiry identity verified successfully.",
                enquiry: data,
                targetModule: 'Enquiries'
            };
        } catch (err) {
            console.error("Enquiry Domain Processing Failure:", formatError(err));
            throw new Error(formatError(err));
        }
    },

    /**
     * Finalizes the enquiry stage and promotes the node to the Admission Vault.
     */
    async convertToAdmission(enquiryId: string | number) {
        try {
            const id = String(enquiryId);
            if (!id) throw new Error("Node ID required for conversion.");

            const { data, error } = await supabase.rpc('convert_enquiry_to_admission', {
                p_enquiry_id: id
            });

            if (error) throw error;
            
            // Fix: Check if data is null before accessing .success
            if (!data) throw new Error("Promotion protocol failed: Remote node returned no response.");
            if (!data.success) throw new Error(data.message);

            return {
                success: true,
                message: data.message,
                admissionId: String(data.admission_id)
            };
        } catch (err) {
            const formatted = formatError(err);
            console.error("Enquiry Promotion Failure:", formatted);
            throw new Error(formatted);
        }
    }
};