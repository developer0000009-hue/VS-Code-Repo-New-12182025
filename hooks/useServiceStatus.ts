import { useState, useEffect, useCallback, useRef } from 'react';
import { ServiceStatus, VerificationStatus } from '../types';
import { verificationService, ServiceHealthStatus, QueuedVerification } from '../services/verificationService';

interface UseServiceStatusReturn {
    serviceStatus: ServiceStatus;
    lastChecked: Date | null;
    nextRetry: Date | null;
    message: string;
    queuedVerifications: QueuedVerification[];
    pendingCount: number;
    isChecking: boolean;
    error: string | null;
    isServiceOnline: boolean; // Computed value for quick checks
    lastSuccessfulSync: Date | null; // Last time service was online
    checkServiceHealth: () => Promise<void>;
    processQueuedVerifications: () => Promise<{
        processed: number;
        successful: number;
        failed: number;
        errors: string[]
    }>;
    clearQueuedVerification: (queueId: string) => void;
    getNextRetryCountdown: () => number; // seconds until next retry
    // Separate enquiry status tracking
    enquiryStatus: 'online' | 'offline' | 'degraded' | 'unknown';
    enquiryLastChecked: Date | null;
    enquiryMessage: string;
    enquiryHealthDetails?: {
        rpcAvailable: boolean;
        tableQueryAvailable: boolean;
        errorType?: 'auth' | 'permission' | 'connection' | 'timeout' | 'unknown';
        errorDetails?: string;
    };
    checkEnquiryHealth: () => Promise<void>;
}

export function useServiceStatus(): UseServiceStatusReturn {
    const [serviceStatus, setServiceStatus] = useState<ServiceStatus>('unknown');
    const [lastChecked, setLastChecked] = useState<Date | null>(null);
    const [nextRetry, setNextRetry] = useState<Date | null>(null);
    const [message, setMessage] = useState<string>('Checking service status...');
    const [queuedVerifications, setQueuedVerifications] = useState<QueuedVerification[]>([]);
    const [isChecking, setIsChecking] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastSuccessfulSync, setLastSuccessfulSync] = useState<Date | null>(null);

    // Separate enquiry status tracking
    const [enquiryStatus, setEnquiryStatus] = useState<'online' | 'offline' | 'degraded' | 'unknown'>('unknown');
    const [enquiryLastChecked, setEnquiryLastChecked] = useState<Date | null>(null);
    const [enquiryMessage, setEnquiryMessage] = useState<string>('Checking enquiry service...');
    const [enquiryHealthDetails, setEnquiryHealthDetails] = useState<{
        rpcAvailable: boolean;
        tableQueryAvailable: boolean;
        errorType?: 'auth' | 'permission' | 'connection' | 'timeout' | 'unknown';
        errorDetails?: string;
    } | undefined>();

    const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Computed values
    const isServiceOnline = serviceStatus === 'online';

    // Calculate pending count from queued verifications
    const pendingCount = queuedVerifications.length;

    // Update queued verifications from service
    const updateQueuedVerifications = useCallback(() => {
        const queued = verificationService.getQueuedVerifications();
        setQueuedVerifications(queued);
    }, []);

    // Manual service health check
    const checkServiceHealth = useCallback(async () => {
        setIsChecking(true);
        setError(null);

        try {
            const healthStatus = await verificationService.checkServiceHealth();
            setServiceStatus(healthStatus.status);
            setLastChecked(healthStatus.lastChecked);
            setNextRetry(healthStatus.nextRetry || null);
            setMessage(healthStatus.message || 'Service status updated');

            // If service came back online, process queued verifications
            if (healthStatus.status === 'online' && queuedVerifications.length > 0) {
                const result = await verificationService.processQueuedVerifications();
                if (result.successful > 0) {
                    updateQueuedVerifications(); // Refresh the queue
                    setMessage(`Service online - processed ${result.successful} queued verifications`);
                }
            }
        } catch (err: any) {
            setError(err.message || 'Failed to check service health');
            setServiceStatus('unknown');
        } finally {
            setIsChecking(false);
        }
    }, [queuedVerifications.length, updateQueuedVerifications]);

    // Process queued verifications manually
    const processQueuedVerifications = useCallback(async () => {
        return await verificationService.processQueuedVerifications();
    }, []);

    // Clear a specific queued verification
    const clearQueuedVerification = useCallback((queueId: string) => {
        verificationService.clearQueuedVerification(queueId);
        updateQueuedVerifications();
    }, [updateQueuedVerifications]);

    // Get countdown to next retry in seconds
    const getNextRetryCountdown = useCallback((): number => {
        if (!nextRetry) return 0;
        const now = Date.now();
        const retryTime = nextRetry.getTime();
        const diff = retryTime - now;
        return Math.max(0, Math.floor(diff / 1000));
    }, [nextRetry]);

    // Independent enquiry database health check
    const checkEnquiryHealth = useCallback(async () => {
        try {
            const healthStatus = await verificationService.checkEnquiryDatabaseHealth();
            setEnquiryStatus(healthStatus.status);
            setEnquiryLastChecked(healthStatus.lastChecked);
            setEnquiryMessage(healthStatus.message);
            setEnquiryHealthDetails(healthStatus.details);
        } catch (err: any) {
            console.error('Failed to check enquiry health:', err);
            setEnquiryStatus('offline');
            setEnquiryLastChecked(new Date());
            setEnquiryMessage('Enquiry health check failed');
            setEnquiryHealthDetails({
                rpcAvailable: false,
                tableQueryAvailable: false,
                errorType: 'connection',
                errorDetails: err.message || 'Unknown error'
            });
        }
    }, []);

    // Handle service status updates from monitoring
    const handleServiceStatusUpdate = useCallback((healthStatus: ServiceHealthStatus) => {
        setServiceStatus(healthStatus.status);
        setLastChecked(healthStatus.lastChecked);
        setNextRetry(healthStatus.nextRetry || null);
        setMessage(healthStatus.message || 'Service status updated');

        // Track last successful sync when service comes online
        if (healthStatus.status === 'online') {
            setLastSuccessfulSync(healthStatus.lastChecked);
        }

        // If service came back online, process queued verifications
        if (healthStatus.status === 'online' && queuedVerifications.length > 0) {
            verificationService.processQueuedVerifications().then(result => {
                if (result.successful > 0) {
                    updateQueuedVerifications(); // Refresh the queue
                    setMessage(`Service online - processed ${result.successful} queued verifications`);
                }
            });
        }
    }, [queuedVerifications.length, updateQueuedVerifications]);

    // Initialize and set up monitoring
    useEffect(() => {
        // Initial queue update
        updateQueuedVerifications();

        // Start health monitoring
        verificationService.startHealthCheckMonitoring(handleServiceStatusUpdate);

        // Set up countdown timer
        countdownIntervalRef.current = setInterval(() => {
            // Update countdown every second
            if (nextRetry && getNextRetryCountdown() <= 0) {
                // Time to retry
                checkServiceHealth();
            }
        }, 1000);

        // Cleanup function
        return () => {
            verificationService.stopHealthCheckMonitoring();
            if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
            }
        };
    }, [handleServiceStatusUpdate, checkServiceHealth, nextRetry, getNextRetryCountdown, updateQueuedVerifications]);

    // Update queued verifications periodically
    useEffect(() => {
        const interval = setInterval(updateQueuedVerifications, 5000); // Update every 5 seconds
        return () => clearInterval(interval);
    }, [updateQueuedVerifications]);

    return {
        serviceStatus,
        lastChecked,
        nextRetry,
        message,
        queuedVerifications,
        pendingCount,
        isChecking,
        error,
        isServiceOnline,
        lastSuccessfulSync,
        checkServiceHealth,
        processQueuedVerifications,
        clearQueuedVerification,
        getNextRetryCountdown,
        // Separate enquiry status tracking
        enquiryStatus,
        enquiryLastChecked,
        enquiryMessage,
        enquiryHealthDetails,
        checkEnquiryHealth
    };
}