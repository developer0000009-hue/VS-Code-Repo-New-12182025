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

            // Standardize code: Remove all whitespace and capitalize
            const cleanCode = code.replace(/\s+/g, '').toUpperCase();

            // branchId can be null for Head Office
            const { data, error } = await supabase.rpc('admin_verify_enquiry_code', {
                p_code: cleanCode,
                p_branch_id: branchId
            });

            if (error) throw error;
            if (!data.success) throw new Error(data.message || "Invalid or expired enquiry token.");

            return {
                success: true,
                message: data.message,
                enquiryId: data.enquiry_id,
                targetModule: 'Enquiries'
            };
        } catch (err) {
            const formatted = formatError(err);
            console.error("Enquiry Link Failure:", formatted);
            throw new Error(formatted);
        }
    },

    /**
     * Updates an enquiry's status using a secure system-level protocol.
     */
    async updateStatus(enquiryId: string, status: string, notes?: string | null) {
        try {
            if (!enquiryId) throw new Error("Node ID required for status update.");
            
            const { error } = await supabase.rpc('admin_update_enquiry_status', {
                p_enquiry_id: enquiryId,
                p_status: status,
                p_notes: notes || null
            });
            if (error) throw error;
            return { success: true };
        } catch (err) {
            const formatted = formatError(err);
            console.error("Enquiry Status Update Failure:", formatted);
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
            if (!data.success) throw new Error(data.message || "Enrollment conversion rejected.");

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