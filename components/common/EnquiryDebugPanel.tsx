import React, { useState, useEffect } from 'react';
import { EnquiryService } from '../../services/enquiry';
import { formatError, supabase } from '../../services/supabase';

interface EnquiryDebugInfo {
    cacheStatus: {
        exists: boolean;
        age?: number;
        branchId?: string | null;
        itemCount?: number;
    };
    lastError?: string;
    lastSuccessfulLoad?: Date;
    loadAttempts: number;
    currentSource?: 'rpc' | 'table' | 'cache' | 'failed';
}

interface EnquiryDebugPanelProps {
    isVisible: boolean;
    onClose: () => void;
    branchId?: string | null;
}

const EnquiryDebugPanel: React.FC<EnquiryDebugPanelProps> = ({
    isVisible,
    onClose,
    branchId
}) => {
    const [debugInfo, setDebugInfo] = useState<EnquiryDebugInfo>({
        cacheStatus: { exists: false },
        loadAttempts: 0
    });

    const [isRefreshing, setIsRefreshing] = useState(false);

    const updateDebugInfo = async () => {
        setIsRefreshing(true);
        try {
            // Check cache status
            const cache = EnquiryService.cache.get(branchId);
            const cacheStatus = cache ? {
                exists: true,
                age: Math.round((Date.now() - new Date(cache.timestamp).getTime()) / 60000), // minutes
                branchId: cache.data ? 'N/A' : branchId,
                itemCount: cache.data?.length || 0
            } : { exists: false };

            // Get stored debug info from localStorage
            const storedDebug = localStorage.getItem('enquiry_debug_info');
            let debugData = {
                lastError: undefined,
                lastSuccessfulLoad: undefined,
                loadAttempts: 0,
                currentSource: undefined
            };

            if (storedDebug) {
                try {
                    debugData = JSON.parse(storedDebug);
                } catch (e) {
                    console.warn('Failed to parse debug info:', e);
                }
            }

            setDebugInfo({
                cacheStatus,
                ...debugData
            });
        } catch (error) {
            console.error('Failed to update debug info:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        if (isVisible) {
            updateDebugInfo();
        }
    }, [isVisible, branchId]);

    const clearCache = () => {
        EnquiryService.cache.clear();
        updateDebugInfo();
    };

    const testConnectivity = async () => {
        try {
            // Test basic Supabase connectivity
            const { data, error } = await supabase
                .from('enquiries')
                .select('count', { count: 'exact', head: true })
                .limit(1);

            if (error) throw error;
            alert(`Connectivity test successful. Found ${data} enquiries.`);
        } catch (error) {
            alert(`Connectivity test failed: ${formatError(error)}`);
        }
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0d0f14] border border-white/10 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div>
                        <h3 className="text-xl font-serif font-black text-white">Enquiry Debug Panel</h3>
                        <p className="text-white/40 text-sm">Technical diagnostics for enquiry loading</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Cache Status */}
                    <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                        <h4 className="text-sm font-black text-white/60 uppercase tracking-wider mb-3">Cache Status</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-white/40">Status:</span>
                                <span className={`ml-2 ${debugInfo.cacheStatus.exists ? 'text-green-400' : 'text-red-400'}`}>
                                    {debugInfo.cacheStatus.exists ? 'Available' : 'Empty'}
                                </span>
                            </div>
                            {debugInfo.cacheStatus.exists && (
                                <>
                                    <div>
                                        <span className="text-white/40">Age:</span>
                                        <span className="ml-2 text-white">{debugInfo.cacheStatus.age} minutes</span>
                                    </div>
                                    <div>
                                        <span className="text-white/40">Items:</span>
                                        <span className="ml-2 text-white">{debugInfo.cacheStatus.itemCount}</span>
                                    </div>
                                    <div>
                                        <span className="text-white/40">Branch:</span>
                                        <span className="ml-2 text-white">{debugInfo.cacheStatus.branchId || 'All'}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Load Status */}
                    <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                        <h4 className="text-sm font-black text-white/60 uppercase tracking-wider mb-3">Load Status</h4>
                        <div className="space-y-2 text-sm">
                            <div>
                                <span className="text-white/40">Current Source:</span>
                                <span className={`ml-2 ${
                                    debugInfo.currentSource === 'rpc' ? 'text-green-400' :
                                    debugInfo.currentSource === 'table' ? 'text-yellow-400' :
                                    debugInfo.currentSource === 'cache' ? 'text-blue-400' :
                                    'text-red-400'
                                }`}>
                                    {debugInfo.currentSource || 'Unknown'}
                                </span>
                            </div>
                            <div>
                                <span className="text-white/40">Load Attempts:</span>
                                <span className="ml-2 text-white">{debugInfo.loadAttempts}</span>
                            </div>
                            {debugInfo.lastSuccessfulLoad && (
                                <div>
                                    <span className="text-white/40">Last Success:</span>
                                    <span className="ml-2 text-white">
                                        {new Date(debugInfo.lastSuccessfulLoad).toLocaleString()}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Last Error */}
                    {debugInfo.lastError && (
                        <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
                            <h4 className="text-sm font-black text-red-400 uppercase tracking-wider mb-2">Last Error</h4>
                            <p className="text-red-300 text-sm font-mono break-words">{debugInfo.lastError}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-white/10">
                        <button
                            onClick={updateDebugInfo}
                            disabled={isRefreshing}
                            className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-sm font-medium transition-all border border-blue-500/20"
                        >
                            {isRefreshing ? 'Refreshing...' : 'Refresh Info'}
                        </button>
                        <button
                            onClick={clearCache}
                            className="px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-lg text-sm font-medium transition-all border border-orange-500/20"
                        >
                            Clear Cache
                        </button>
                        <button
                            onClick={testConnectivity}
                            className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg text-sm font-medium transition-all border border-green-500/20"
                        >
                            Test Connectivity
                        </button>
                    </div>

                    {/* Technical Details */}
                    <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                        <h4 className="text-sm font-black text-white/60 uppercase tracking-wider mb-3">Technical Details</h4>
                        <div className="text-xs text-white/40 font-mono space-y-1">
                            <div>Branch ID: {branchId || 'null'}</div>
                            <div>User Agent: {navigator.userAgent}</div>
                            <div>Timestamp: {new Date().toISOString()}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnquiryDebugPanel;