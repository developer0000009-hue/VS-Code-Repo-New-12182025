import { supabase, formatError } from './supabase';
import { ServiceStatus, VerificationStatus } from '../types';

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
            // Lightweight health check - try a simple RPC that should always work
            const { data, error } = await supabase.rpc('admin_verify_share_code', {
                p_code: 'HEALTH_CHECK_DUMMY'
            });

            // If we get here without timeout/error, service is online
            // We don't care about the actual result, just that the call succeeded
            return {
                status: 'online',
                lastChecked,
                message: 'Verification service is online'
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
                    message: 'Verification service is temporarily unavailable'
                };
            }

            // Other errors might indicate degraded service
            return {
                status: 'degraded',
                lastChecked,
                nextRetry: new Date(Date.now() + this.HEALTH_CHECK_INTERVAL),
                message: 'Verification service experiencing issues'
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
}

export const verificationService = VerificationService.getInstance();
export default verificationService;