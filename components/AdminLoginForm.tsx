import React, { useState } from 'react';
import { supabase } from '../services/supabase'; 
import Spinner from './common/Spinner';

const AdminLoginForm: React.FC = () => {
    const [email, setEmail] = useState('admin@vrds.com');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else if (!data.session) {
            setError("Unable to sign in. Please check if your email is verified.");
            setLoading(false);
        }
        // On full success (session exists), we keep the spinner active.
        // The parent App component's onAuthStateChange listener will handle the page transition.
    };

    return (
        <form onSubmit={handleLogin} className="space-y-6">
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
            </div>
            <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
            </div>
            <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
                {loading ? <Spinner size="sm" /> : 'Sign In'}
            </button>
        </form>
    );
};

export default AdminLoginForm;