import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Spinner from './Spinner';

interface NotFoundProps {
    redirectTo?: string;
}

const NotFound: React.FC<NotFoundProps> = ({ redirectTo = '/' }) => {
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            navigate(redirectTo, { replace: true });
        }, 1500); // Short delay to allow user to see something is happening if it's a loop
        return () => clearTimeout(timer);
    }, [navigate, redirectTo]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
            <Spinner size="lg" />
            <h2 className="mt-4 text-xl font-bold">Redirecting...</h2>
            <p className="text-muted-foreground text-sm mt-2">We couldn't find that page, taking you home.</p>
            <p className="text-xs text-muted-foreground/50 mt-4 font-mono">Path: {window.location.pathname}</p>
        </div>
    );
};

export default NotFound;