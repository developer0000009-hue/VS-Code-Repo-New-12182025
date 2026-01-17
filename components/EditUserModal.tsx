
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { UserProfile, Role } from '../types';
import { useRoles } from '../contexts/RoleContext';
import Spinner from './common/Spinner';

interface EditUserModalProps {
    user: UserProfile;
    onClose: () => void;
    onSave: (user: UserProfile) => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        display_name: user.display_name || '',
        phone: user.phone || '',
        role: user.role,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { roles } = useRoles();

    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => {
            window.removeEventListener('keydown', handleEsc);
        };
    }, [onClose]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase
            .from('profiles')
            .update({
                display_name: formData.display_name,
                phone: formData.phone,
                role: formData.role,
            })
            .eq('id', user.id)
            .select()
            .single();

        if (error) {
            setError(error.message);
        } else if (data) {
            onSave(data as UserProfile);
            onClose();
        }
        setLoading(false);
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-user-title"
        >
            <div 
                className="bg-card rounded-xl shadow-2xl p-8 w-full max-w-md m-4"
                onClick={e => e.stopPropagation()}
            >
                <h2 id="edit-user-title" className="text-2xl font-bold text-card-foreground mb-6">Edit User: {user.display_name}</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <p className="bg-destructive/20 border border-destructive/50 text-destructive-foreground text-center p-3 rounded-lg">{error}</p>}
                    
                    <div>
                        <label htmlFor="display_name" className="block text-sm font-medium text-muted-foreground">Display Name</label>
                        <input id="display_name" name="display_name" type="text" value={formData.display_name} onChange={handleChange} required className="mt-1 w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:ring-ring focus:border-primary" />
                    </div>

                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-muted-foreground">Phone</label>
                        <input id="phone" name="phone" type="text" value={formData.phone} onChange={handleChange} className="mt-1 w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:ring-ring focus:border-primary" />
                    </div>
                    
                    <div>
                        <label htmlFor="role" className="block text-sm font-medium text-muted-foreground">Role</label>
                        <select id="role" name="role" value={formData.role ?? ''} onChange={handleChange} className="mt-1 w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:ring-ring focus:border-primary">
                             {roles.map(role => <option key={role} value={role}>{role}</option>)}
                        </select>
                    </div>

                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className="py-2 px-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg disabled:opacity-50 flex items-center">
                            {loading ? <Spinner size="sm"/> : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditUserModal;
