import React, { Component } from 'react';
import { AlertTriangleIcon } from '../icons/AlertTriangleIcon';

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Error Boundary caught an error:', error, errorInfo);
        this.props.onError?.(error, errorInfo);
    }

    resetError = () => {
        this.setState({ hasError: false, error: undefined });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                const FallbackComponent = this.props.fallback;
                return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
            }

            return (
                <div className="flex flex-col items-center justify-center p-12 bg-red-500/5 border border-red-500/20 rounded-[2rem] text-center">
                    <AlertTriangleIcon className="w-16 h-16 text-red-400 mb-6" />
                    <h3 className="text-xl font-serif font-black text-red-400 uppercase tracking-tight mb-4">
                        System Anomaly Detected
                    </h3>
                    <p className="text-red-300/70 mb-6 max-w-md">
                        An unexpected error occurred while loading this component. Our engineers have been notified.
                    </p>
                    <button
                        onClick={this.resetError}
                        className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-xl text-sm font-bold uppercase tracking-wider transition-all"
                    >
                        Retry
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
