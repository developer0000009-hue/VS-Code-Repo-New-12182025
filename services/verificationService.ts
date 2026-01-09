import { supabase, formatError } from './supabase';
import { ServiceStatus, VerificationStatus, VerificationAuditLog, ShareCodeType } from '../types';

export interface ServiceHealthStatus {
    status: ServiceStatus;
    lastChecked: Date;
    nextRetry?: Date;
    message?: string;
}

export interface QueuedVerification {
    id: string;
    code: string;
    code_type: 'Enquiry' | 'Admission';
    admission_id: string;
    enquiry_id?: string;
    applicant_name: string;
    grade: string;
    queued_at: Date;
    retry_count: number;
    max_retries: number;
    error?: string;
}

class VerificationService {
    private static instance: VerificationService;
    private healthCheckInterval: NodeJS.Timeout | null = null;
    private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
    private readonly MAX_RETRY_ATTEMPTS = 3;

    static getInstance(): VerificationService {
        if (!VerificationService.instance) {
            VerificationService.instance = new VerificationService();
        }
        return VerificationService.instance;
    }

    async checkServiceHealth(): Promise<ServiceHealthStatus> {
        const lastChecked = new Date();

        try {
            // Lightweight health check - test basic database connectivity
            // First try the new RPC function if available
            try {
                const { data, error } = await supabase.rpc('check_service_health');
                if (!error) {
                    return {
                        status: 'online',
                        lastChecked,
                        message: 'Enquiry service is online'
                    };
                }
            } catch (rpcError) {
                // RPC not available yet, fall back to basic connectivity test
            }

            // Fallback: Test basic database connectivity with a simple query
            // Use a query that any authenticated user should be able to access
            const { data, error } = await supabase
                .from('enquiries')
                .select('count', { count: 'exact', head: true })
                .limit(1);

            if (error) throw error;

            // If we get here without error, database is accessible
            return {
                status: 'online',
                lastChecked,
                message: 'Enquiry service is online'
            };

        } catch (error: any) {
            const errorMessage = formatError(error);

            // Check if it's a timeout or connection error
            if (errorMessage.includes('timeout') ||
                errorMessage.includes('connection') ||
                errorMessage.includes('network') ||
                errorMessage.includes('unavailable')) {

                return {
                    status: 'offline',
                    lastChecked,
                    nextRetry: new Date(Date.now() + this.HEALTH_CHECK_INTERVAL),
                    message: 'Enquiry service is temporarily unavailable'
                };
            }

            // Other errors might indicate degraded service
            return {
                status: 'degraded',
                lastChecked,
                nextRetry: new Date(Date.now() + this.HEALTH_CHECK_INTERVAL),
                message: 'Enquiry service experiencing issues'
            };
        }
    }

    /**
     * Independent health check specifically for enquiry database connectivity.
     * This does NOT depend on verification service availability.
     */
    async checkEnquiryDatabaseHealth(): Promise<{
        status: 'online' | 'offline' | 'degraded';
        lastChecked: Date;
        message: string;
        details: {
            rpcAvailable: boolean;
            tableQueryAvailable: boolean;
            errorType?: 'auth' | 'permission' | 'connection' | 'timeout' | 'unknown';
            errorDetails?: string;
        }
    }> {
        const lastChecked = new Date();
        let rpcAvailable = false;
        let tableQueryAvailable = false;
        let errorType: 'auth' | 'permission' | 'connection' | 'timeout' | 'unknown' = 'unknown';
        let errorDetails = '';

        try {
            // First, test RPC function availability
            try {
                const { data: rpcData, error: rpcError } = await supabase.rpc('get_enquiries_for_node', {
                    p_branch_id: null
                });

                if (!rpcError) {
                    rpcAvailable = true;
                } else {
                    // RPC failed, but continue to check table query
                    console.warn('RPC enquiry function failed:', formatError(rpcError));
                    if (rpcError.code === '42501') errorType = 'permission';
                    else if (rpcError.code === '42703') errorType = 'auth';
                    else if (rpcError.message?.includes('timeout')) errorType = 'timeout';
                    else if (rpcError.message?.includes('connection')) errorType = 'connection';
                    errorDetails = formatError(rpcError);
                }
            } catch (rpcException) {
                console.warn('RPC enquiry function exception:', rpcException);
                errorType = 'connection';
                errorDetails = 'RPC function unavailable';
            }

            // Second, test direct table query
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
                    console.warn('Table enquiry query failed:', formatError(tableError));
                    if (tableError.code === '42501') errorType = 'permission';
                    else if (tableError.code === '42703') errorType = 'auth';
                    else if (tableError.message?.includes('timeout')) errorType = 'timeout';
                    else if (tableError.message?.includes('connection')) errorType = 'connection';
                    errorDetails = formatError(tableError);
                }
            } catch (tableException) {
                console.warn('Table enquiry query exception:', tableException);
                errorType = 'connection';
                errorDetails = 'Direct table query unavailable';
            }

            // Determine overall status
            if (rpcAvailable || tableQueryAvailable) {
                return {
                    status: 'online',
                    lastChecked,
                    message: 'Enquiry database is accessible',
                    details: {
                        rpcAvailable,
                        tableQueryAvailable,
                        errorType,
                        errorDetails
                    }
                };
            } else {
                // Neither RPC nor table query worked
                return {
                    status: 'offline',
                    lastChecked,
                    message: `Enquiry database unavailable: ${errorDetails}`,
                    details: {
                        rpcAvailable,
                        tableQueryAvailable,
                        errorType,
                        errorDetails
                    }
                };
            }

        } catch (error: any) {
            const errorMessage = formatError(error);
            console.error('Enquiry database health check failed:', errorMessage);

            // Categorize the error
            if (errorMessage.includes('JWT') || errorMessage.includes('authentication')) {
                errorType = 'auth';
            } else if (errorMessage.includes('permission') || errorMessage.includes('RLS')) {
                errorType = 'permission';
            } else if (errorMessage.includes('timeout')) {
                errorType = 'timeout';
            } else if (errorMessage.includes('connection') || errorMessage.includes('network')) {
                errorType = 'connection';
            }

            return {
                status: 'offline',
                lastChecked,
                message: `Enquiry database check failed: ${errorMessage}`,
                details: {
                    rpcAvailable,
                    tableQueryAvailable,
                    errorType,
                    errorDetails: errorMessage
                }
            };
        }
    }

    async queueVerification(verificationData: {
        code: string;
        code_type: 'Enquiry' | 'Admission';
        admission_id: string;
        enquiry_id?: string;
        applicant_name: string;
        grade: string;
    }): Promise<{ success: boolean; queueId?: string; error?: string }> {
        try {
            // Store in local storage for offline queue
            const queueId = `queued_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const queuedItem: QueuedVerification = {
                id: queueId,
                ...verificationData,
                queued_at: new Date(),
                retry_count: 0,
                max_retries: this.MAX_RETRY_ATTEMPTS
            };

            const existingQueue = this.getQueuedVerifications();
            existingQueue.push(queuedItem);
            localStorage.setItem('queued_verifications', JSON.stringify(existingQueue));

            return { success: true, queueId };
        } catch (error) {
            return {
                success: false,
                error: 'Failed to queue verification for offline processing'
            };
        }
    }

    getQueuedVerifications(): QueuedVerification[] {
        try {
            const stored = localStorage.getItem('queued_verifications');
            if (!stored) return [];

            const parsed = JSON.parse(stored);
            // Convert date strings back to Date objects
            return parsed.map((item: any) => ({
                ...item,
                queued_at: new Date(item.queued_at)
            }));
        } catch (error) {
            console.error('Error parsing queued verifications:', error);
            return [];
        }
    }

    async processQueuedVerifications(): Promise<{
        processed: number;
        successful: number;
        failed: number;
        errors: string[]
    }> {
        const queued = this.getQueuedVerifications();
        if (queued.length === 0) {
            return { processed: 0, successful: 0, failed: 0, errors: [] };
        }

        let successful = 0;
        let failed = 0;
        const errors: string[] = [];
        const remainingQueue: QueuedVerification[] = [];

        for (const item of queued) {
            try {
                // Attempt to verify using the actual verification process
                const { data, error } = await supabase.rpc('admin_verify_share_code', {
                    p_code: item.code
                });

                if (error) throw error;

                if (data && data.found) {
                    // Verification successful, process the import
                    const { error: importError } = await supabase.rpc('admin_import_record_from_share_code', {
                        p_admission_id: item.admission_id,
                        p_code_type: item.code_type,
                        p_branch_id: null // Will be set by the RPC
                    });

                    if (importError) throw importError;

                    successful++;
                } else {
                    throw new Error('Verification code not found or invalid');
                }

            } catch (error: any) {
                failed++;

                if (item.retry_count < item.max_retries) {
                    // Increment retry count and re-queue
                    item.retry_count++;
                    item.error = formatError(error);
                    remainingQueue.push(item);
                } else {
                    errors.push(`${item.applicant_name}: ${formatError(error)} (max retries exceeded)`);
                }
            }
        }

        // Update local storage with remaining queue
        localStorage.setItem('queued_verifications', JSON.stringify(remainingQueue));

        return {
            processed: queued.length,
            successful,
            failed,
            errors
        };
    }

    clearQueuedVerification(queueId: string): void {
        const queued = this.getQueuedVerifications();
        const filtered = queued.filter(item => item.id !== queueId);
        localStorage.setItem('queued_verifications', JSON.stringify(filtered));
    }

    // Quick check if service is online (synchronous)
    isServiceOnline(): boolean {
        // This is a cached check - use checkServiceHealth() for real-time status
        const stored = localStorage.getItem('verification_service_status');
        if (!stored) return false;

        try {
            const status = JSON.parse(stored);
            return status.status === 'online' && Date.now() - status.lastChecked < this.HEALTH_CHECK_INTERVAL;
        } catch {
            return false;
        }
    }

    // Get queue count without full parsing
    getQueueCount(): number {
        try {
            const stored = localStorage.getItem('queued_verifications');
            if (!stored) return 0;
            const parsed = JSON.parse(stored);
            return Array.isArray(parsed) ? parsed.length : 0;
        } catch {
            return 0;
        }
    }

    // Clear all queued verifications (admin function)
    clearAllQueuedVerifications(): void {
        localStorage.removeItem('queued_verifications');
    }

    startHealthCheckMonitoring(callback: (status: ServiceHealthStatus) => void): void {
        // Initial check
        this.checkServiceHealth().then(callback);

        // Set up interval monitoring
        this.healthCheckInterval = setInterval(async () => {
            const status = await this.checkServiceHealth();
            callback(status);
        }, this.HEALTH_CHECK_INTERVAL);
    }

    stopHealthCheckMonitoring(): void {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
    }

    /**
     * Logs verification attempts for audit and debugging purposes.
     * Stores in localStorage for offline scenarios and attempts database logging.
     */
    async logVerificationAttempt(attempt: {
        code: string;
        code_type: ShareCodeType;
        admission_id?: string;
        enquiry_id?: string;
        applicant_name: string;
        result: 'SUCCESS' | 'FAILED' | 'EXPIRED' | 'INVALID';
        error_message?: string;
        branch_id?: string | null;
    }): Promise<void> {
        try {
            const logEntry: VerificationAuditLog = {
                id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                ...attempt,
                verified_at: new Date().toISOString()
            };

            // Store in localStorage for immediate access
            const existingLogs = this.getVerificationLogs();
            existingLogs.unshift(logEntry); // Add to beginning

            // Keep only last 1000 logs to prevent storage bloat
            const trimmedLogs = existingLogs.slice(0, 1000);
            localStorage.setItem('verification_audit_logs', JSON.stringify(trimmedLogs));

            // Attempt to log to database (fire and forget - don't fail verification if this fails)
            try {
                await supabase
                    .from('verification_audit_logs')
                    .insert({
                        code: attempt.code,
                        code_type: attempt.code_type,
                        admission_id: attempt.admission_id,
                        enquiry_id: attempt.enquiry_id,
                        applicant_name: attempt.applicant_name,
                        result: attempt.result,
                        error_message: attempt.error_message,
                        branch_id: attempt.branch_id,
                        verified_at: logEntry.verified_at
                    });
            } catch (dbError) {
                // Database logging failed - this is OK, we still have localStorage
                console.warn('Failed to log verification to database:', dbError);
            }

        } catch (error) {
            // If localStorage logging fails, log to console
            console.error('Failed to log verification attempt:', error);
        }
    }

    /**
     * Retrieves verification audit logs from localStorage.
     */
    getVerificationLogs(): VerificationAuditLog[] {
        try {
            const stored = localStorage.getItem('verification_audit_logs');
            if (!stored) return [];

            const parsed = JSON.parse(stored);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.error('Error parsing verification logs:', error);
            return [];
        }
    }
}

export const verificationService = VerificationService.getInstance();
export default verificationService;
