import { supabase, formatError } from './supabase';

/**
 * Enquiry Domain Service
 * Manages the domain-isolated lifecycle of enquiries.
 */
export const EnquiryService = {
    /**
     * Create sample enquiry data for testing (temporary function)
     */
    async createSampleEnquiry(): Promise<{ success: boolean; enquiryId?: string; error?: string }> {
        try {
            const { data, error } = await supabase
                .from('enquiries')
                .insert({
                    applicant_name: 'Test Student',
                    grade: '5',
                    status: 'NEW',
                    parent_name: 'Test Parent',
                    parent_email: 'test@example.com',
                    parent_phone: '+1234567890',
                    branch_id: null, // Will be accessible to all branches
                    verification_status: 'PENDING',
                    conversion_state: 'NOT_CONVERTED',
                    is_archived: false,
                    is_deleted: false
                })
                .select()
                .single();

            if (error) throw error;

            return { success: true, enquiryId: data.id };
        } catch (error: any) {
            console.error('Failed to create sample enquiry:', error);
            return { success: false, error: formatError(error) };
        }
    },
    /**
     * Processes an enquiry identity verification.
     * Strictly updates Enquiry state only.
     */
    async processEnquiryVerification(enquiryId: string) {
        try {
            if (!enquiryId) throw new Error("Reference ID required for processing.");

            // First, check if the enquiry exists
            const { data: enquiryData, error: fetchError } = await supabase
                .from('enquiries')
                .select('id, status, verification_status')
                .eq('id', enquiryId)
                .maybeSingle();

            if (fetchError) throw fetchError;
            if (!enquiryData) throw new Error("Enquiry node not found in registry.");

            // Build update object with all required fields for enquiry visibility
            const updateData: any = {
                status: 'NEW',  // Set to NEW so it appears in Enquiry Desk
                verification_status: 'VERIFIED',
                conversion_state: 'NOT_CONVERTED',
                is_archived: false,
                is_deleted: false,
                updated_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('enquiries')
                .update(updateData)
                .eq('id', enquiryId)
                .select()
                .maybeSingle();

            if (error) throw error;

            return {
                success: true,
                verification_status: "VERIFIED",
                enquiry_id: enquiryId,
                message: "Enquiry verified successfully"
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
