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
    async processEnquiryVerification(enquiryId: string) {
        try {
            if (!enquiryId) throw new Error("Reference ID required for processing.");

            const { data, error } = await supabase
                .from('enquiries')
                .update({
                    verification_status: 'VERIFIED',
                    status: 'NEW',  // Set to NEW so it appears in Enquiry Desk
                    updated_at: new Date().toISOString()
                })
                .eq('id', enquiryId)
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

            // First check if already converted
            const { data: enquiryData, error: checkError } = await supabase
                .from('enquiries')
                .select('conversion_state, status')
                .eq('id', enquiryId)
                .single();

            if (checkError) throw checkError;

            if (enquiryData?.conversion_state === 'CONVERTED') {
                throw new Error("This enquiry has already been converted to an admission.");
            }

            if (enquiryData?.status !== 'APPROVED') {
                throw new Error("Only approved enquiries can be converted to admissions.");
            }

            const { data, error } = await supabase.rpc('convert_enquiry_to_admission', {
                p_enquiry_id: enquiryId
            });

            if (error) throw error;

            // FIX: Guard against null/undefined response
            if (!data) {
                throw new Error("Conversion failed: No response from server");
            }

            if (data.success !== true) {
                throw new Error(data.message || "Conversion failed");
            }

            // Log the conversion for audit trail
            console.log(`Enquiry ${enquiryId} converted to admission ${data.admission_id}`);

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