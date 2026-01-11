import { supabase, formatError } from './supabase';

/**
 * Enquiry Integration Service
 * Manages the domain-isolated lifecycle of enquiries.
 */
export const EnquiryService = {
    /**
     * Verifies an enquiry code and integrates the identity node into the Enquiry Desk.
     */
    async verifyAndLinkEnquiry(code: string, branchId: number | null) {
        try {
            if (!code) throw new Error("Verification token required.");

            // branchId can be null for Head Office
            const { data, error } = await supabase.rpc('admin_verify_enquiry_code', {
                p_code: code.trim().toUpperCase(),
                p_branch_id: branchId
            });

            if (error) throw error;
            if (!data.success) throw new Error(data.message);

            return {
                success: true,
                message: data.message,
                enquiryId: data.enquiry_id,
                targetModule: 'Enquiries'
            };
        } catch (err) {
            const formatted = formatError(err);
            // If we catch a specific alignment error, we re-wrap it for better UX
            if (formatted.includes("Data Alignment Error")) {
                console.error("Critical identity mapping failure. Migration 14.2.9 required.");
            }
            throw new Error(formatted);
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