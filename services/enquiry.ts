import { supabase, formatError } from './supabase';
import { EnquiryDetails } from '../types';

/**
 * Enquiry Domain Service
 * Manages the domain-isolated lifecycle of enquiries.
 */
export const EnquiryService = {


    /**
     * Direct database enquiry fetching
     * Always fetches enquiries directly from Supabase database
     */
    async fetchEnquiriesWithHealthCheck(branchId?: string | null): Promise<{
        success: boolean;
        data?: EnquiryDetails[];
        source: 'database' | 'failed';
        healthStatus: 'online' | 'offline' | 'degraded';
        errorType?: 'auth' | 'permission' | 'connection' | 'timeout' | 'unknown';
        errorDetails?: string;
    }> {
        try {
            // Always fetch directly from database
            const fetchResult = await this.fetchEnquiriesFromDatabase(branchId);
            if (fetchResult.success) {
                return {
                    success: true,
                    data: fetchResult.data,
                    source: 'database',
                    healthStatus: 'online'
                };
            }

            // Fetch failed
            return {
                success: false,
                source: 'failed',
                healthStatus: 'offline',
                errorType: 'connection',
                errorDetails: fetchResult.error || 'Failed to fetch enquiries from database'
            };

        } catch (error: any) {
            console.error('Database fetch failed:', error);
            return {
                success: false,
                source: 'failed',
                healthStatus: 'offline',
                errorType: 'connection',
                errorDetails: formatError(error)
            };
        }
    },

    /**
     * Internal method to check enquiry database health
     */
    async checkEnquiryDatabaseHealth(): Promise<{
        status: 'online' | 'offline' | 'degraded';
        details: {
            rpcAvailable: boolean;
            tableQueryAvailable: boolean;
            errorType?: 'auth' | 'permission' | 'connection' | 'timeout' | 'unknown';
            errorDetails?: string;
        }
    }> {
        let rpcAvailable = false;
        let tableQueryAvailable = false;
        let errorType: 'auth' | 'permission' | 'connection' | 'timeout' | 'unknown' = 'unknown';
        let errorDetails = '';

        try {
            // Test RPC function availability
            try {
                const { data: rpcData, error: rpcError } = await supabase.rpc('get_enquiries_for_node', {
                    p_branch_id: null
                });

                if (!rpcError) {
                    rpcAvailable = true;
                } else {
                    if (rpcError.code === '42501') errorType = 'permission';
                    else if (rpcError.code === '42703') errorType = 'auth';
                    else if (rpcError.message?.includes('timeout')) errorType = 'timeout';
                    else if (rpcError.message?.includes('connection')) errorType = 'connection';
                    errorDetails = formatError(rpcError);
                }
            } catch (rpcException) {
                errorType = 'connection';
                errorDetails = 'RPC function unavailable';
            }

            // Test direct table query
            try {
                const { data: tableData, error: tableError } = await supabase
                    .from('enquiries')
                    .select('id', { count: 'exact', head: true })
                    .eq('conversion_state', 'NOT_CONVERTED')
                    .eq('is_archived', false)
                    .eq('is_deleted', false)
                    .limit(1);

                if (!tableError) {
                    tableQueryAvailable = true;
                } else {
                    if (tableError.code === '42501') errorType = 'permission';
                    else if (tableError.code === '42703') errorType = 'auth';
                    else if (tableError.message?.includes('timeout')) errorType = 'timeout';
                    else if (tableError.message?.includes('connection')) errorType = 'connection';
                    errorDetails = formatError(tableError);
                }
            } catch (tableException) {
                errorType = 'connection';
                errorDetails = 'Direct table query unavailable';
            }

            // Determine overall status
            if (rpcAvailable || tableQueryAvailable) {
                return {
                    status: 'online',
                    details: {
                        rpcAvailable,
                        tableQueryAvailable,
                        errorType,
                        errorDetails
                    }
                };
            } else {
                return {
                    status: 'offline',
                    details: {
                        rpcAvailable,
                        tableQueryAvailable,
                        errorType,
                        errorDetails
                    }
                };
            }

        } catch (error: any) {
            return {
                status: 'offline',
                details: {
                    rpcAvailable,
                    tableQueryAvailable,
                    errorType: 'connection',
                    errorDetails: formatError(error)
                }
            };
        }
    },

    /**
     * Internal method to fetch enquiries from database
     */
    async fetchEnquiriesFromDatabase(branchId?: string | null): Promise<{
        success: boolean;
        data?: EnquiryDetails[];
        error?: string;
    }> {
        try {
            // First try the RPC function which handles RLS properly
            try {
                const { data, error } = await supabase.rpc('get_enquiries_for_node', {
                    p_branch_id: branchId
                });

                if (!error && data) {
                    return { success: true, data: data || [] };
                }
            } catch (rpcError) {
                console.warn('RPC function failed, falling back to direct query:', rpcError);
            }

            // Fallback to direct query if RPC fails
            const query = supabase
                .from('enquiries')
                .select(`
                    id,
                    enquiry_code,
                    applicant_name,
                    grade,
                    status,
                    verification_status,
                    received_at,
                    parent_name,
                    parent_email,
                    parent_phone,
                    notes,
                    updated_at,
                    admission_id,
                    branch_id,
                    conversion_state,
                    is_archived,
                    is_deleted,
                    converted_at
                `)
                .eq('conversion_state', 'NOT_CONVERTED')
                .eq('is_archived', false)
                .eq('is_deleted', false)
                .not('status', 'is', null)
                .neq('status', '')
                .order('received_at', { ascending: false });

            if (branchId) {
                query.eq('branch_id', branchId);
            }

            const { data, error } = await query;

            if (error) throw error;

            // Map received_at to created_at to match EnquiryDetails interface
            const mappedData = (data || []).map(item => ({
                ...item,
                created_at: item.received_at,
                received_at: undefined
            }));

            return { success: true, data: mappedData };
        } catch (error: any) {
            return { success: false, error: formatError(error) };
        }
    },

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
    },

    /**
     * Fetches complete enquiry details from the enquiries table.
     * Used for displaying detailed information in verification flow.
     */
    async getEnquiryDetails(enquiryId: string): Promise<{ success: boolean; enquiry?: EnquiryDetails; error?: string }> {
        try {
            if (!enquiryId) throw new Error("Enquiry ID required for fetching details.");

            const { data, error } = await supabase
                .from('enquiries')
                .select(`
                    id,
                    applicant_name,
                    grade,
                    status,
                    verification_status,
                    conversion_state,
                    parent_name,
                    parent_email,
                    parent_phone,
                    notes,
                    created_at,
                    updated_at,
                    branch_id,
                    is_archived,
                    is_deleted
                `)
                .eq('id', enquiryId)
                .maybeSingle();

            if (error) throw error;
            if (!data) throw new Error("Enquiry record not found.");

            return {
                success: true,
                enquiry: data as EnquiryDetails
            };
        } catch (err) {
            console.error("Failed to fetch enquiry details:", err);
            return {
                success: false,
                error: formatError(err)
            };
        }
    }
};
