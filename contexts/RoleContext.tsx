
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Role } from '../types';
import { ROLE_ORDER } from '../constants';

interface RoleContextType {
    roles: Role[];
    loading: boolean;
    error: string | null;
    refetchRoles: () => Promise<void>;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchRoles = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // STRICT MODE: Only use the predefined valid roles from constants.
            // This prevents "junk" roles from the database (e.g., typos, test roles) from appearing in the UI.
            // If dynamic roles are needed later, they should be fetched and validated against a whitelist.
            setRoles([...ROLE_ORDER]);
        } catch (err: any) {
            setError(err.message || 'Failed to load roles');
            setRoles(ROLE_ORDER);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRoles();
    }, [fetchRoles]);
    
    const value = useMemo(() => ({
        roles,
        loading,
        error,
        refetchRoles: fetchRoles
    }), [roles, loading, error, fetchRoles]);

    return (
        <RoleContext.Provider value={value}>
            {children}
        </RoleContext.Provider>
    );
};

export const useRoles = () => {
    const context = useContext(RoleContext);
    if (context === undefined) {
        throw new Error('useRoles must be used within a RoleProvider');
    }
    return context;
};
