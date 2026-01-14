import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOMClient from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { ThemeProvider } from './contexts/ThemeContext';
import { RoleProvider } from './contexts/RoleContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Standard Error Boundary for catching UI exceptions.
 * Ensures relative imports are used to avoid "Failed to resolve module specifier" errors.
 */
// FIX: Explicitly imported Component from react and declared state/props properties to resolve "Property does not exist" errors.
// This ensures inherited members from the base React Component class are correctly recognized by the TypeScript compiler in this environment.
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState;
  public props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
    this.props = props;
  }

  static getDerivedStateFromError(_error: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Critical UI Error Captured:", error, errorInfo);
  }

  render(): ReactNode {
    // FIX: Accessing state which is now explicitly declared in the class to satisfy the compiler.
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-6 text-center">
          <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Portal Temporarily Unavailable</h1>
          <p className="mb-8 text-muted-foreground max-w-sm mx-auto">An unexpected error occurred. We've logged the incident and are working on it.</p>
          <button 
            onClick={() => window.location.hash = '#/'} 
            className="px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:bg-primary/90 transition-all active:scale-95"
          >
            Return to Home
          </button>
        </div>
      );
    }

    // FIX: Accessing props which is now explicitly declared in the class.
    return this.props.children;
  }
}

const root = ReactDOMClient.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <RoleProvider>
          <HashRouter>
            <App />
          </HashRouter>
        </RoleProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);