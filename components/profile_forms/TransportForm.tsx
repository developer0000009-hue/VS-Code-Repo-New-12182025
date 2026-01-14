
import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { TransportProfileData, BusRoute } from '../../types';

interface FormProps {
    formData: Partial<TransportProfileData>;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

const BaseInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input 
        {...props}
        className="appearance-none block w-full px-3 py-2 border border-input rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-ring focus:border-primary sm:text-sm bg-background text-foreground disabled:bg-muted/50 disabled:cursor-not-allowed" 
    />
);

const BaseSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <select
        {...props}
        className="appearance-none block w-full px-3 py-2 border border-input rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-ring focus:border-primary sm:text-sm bg-background text-foreground disabled:bg-muted/50 disabled:cursor-not-allowed"
    >
        {props.children}
    </select>
);


const Label: React.FC<{htmlFor: string; children: React.ReactNode}> = ({htmlFor, children}) => (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-muted-foreground mb-1">{children}</label>
);

const TransportForm: React.FC<FormProps> = ({ formData, handleChange }) => {
    const [routes, setRoutes] = useState<BusRoute[]>([]);
    const [loadingRoutes, setLoadingRoutes] = useState(true);

    useEffect(() => {
        const fetchRoutes = async () => {
            setLoadingRoutes(true);
            const { data, error } = await supabase.from('routes').select('*');
            if (data) {
                setRoutes(data);
            }
            setLoadingRoutes(false);
        };
        fetchRoutes();
    }, []);

    return (
        <div className="space-y-4">
            <div>
                <Label htmlFor="route_id">Assigned Route</Label>
                <BaseSelect id="route_id" name="route_id" value={formData.route_id || ''} onChange={handleChange} required disabled={loadingRoutes}>
                    <option value="" disabled>
                        {loadingRoutes ? 'Loading routes...' : 'Select a route...'}
                    </option>
                    {routes.map(route => (
                        <option key={route.id} value={route.id}>{route.name}</option>
                    ))}
                </BaseSelect>
            </div>
            <div>
                <Label htmlFor="vehicle_details">Vehicle Details</Label>
                <BaseInput id="vehicle_details" name="vehicle_details" type="text" value={formData.vehicle_details || ''} onChange={handleChange} placeholder="e.g., School Bus #5, License Plate ABC-123"/>
            </div>
            <div>
                <Label htmlFor="license_info">License Information</Label>
                <BaseInput id="license_info" name="license_info" type="text" value={formData.license_info || ''} onChange={handleChange} placeholder="e.g., Commercial Driver's License"/>
            </div>
        </div>
    );
};

export default TransportForm;
