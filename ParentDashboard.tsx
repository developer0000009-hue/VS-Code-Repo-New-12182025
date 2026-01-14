
import React, { useState, useEffect } from 'react';
import { UserProfile, Role } from './types';
import Header from './components/parent/Header';
import { ProfileCreationPage } from './components/ProfileCreationPage';

// Import the tab components
import OverviewTab from './components/parent_tabs/OverviewTab';
import MyChildrenTab from './components/parent_tabs/MyChildrenTab';
import DocumentsTab from './components/parent_tabs/DocumentsTab';
import ShareCodesTab from './components/parent_tabs/ShareCodesTab';
import MessagesTab from './components/parent_tabs/MessagesTab';
import { HomeIcon } from './components/icons/HomeIcon';
import { StudentsIcon } from './components/icons/StudentsIcon';
import { DocumentTextIcon } from './components/icons/DocumentTextIcon';
import { CommunicationIcon } from './components/icons/CommunicationIcon';
import { ReceiptIcon } from './components/icons/ReceiptIcon'; 

interface ParentDashboardProps {
    profile: UserProfile;
    onSelectRole: (role: Role, isExisting?: boolean) => void;
    onProfileUpdate: () => void;
    onSignOut: () => void;
}

const navItems = [
    { id: 'Overview', label: 'Dashboard', icon: <HomeIcon className="w-4 h-4 md:w-5 md:h-5" /> },
    { id: 'My Children', label: 'Children', icon: <StudentsIcon className="w-4 h-4 md:w-5 md:h-5" /> },
    { id: 'Documents', label: 'Vault', icon: <DocumentTextIcon className="w-4 h-4 md:w-5 md:h-5" /> },
    { id: 'Messages', label: 'Inbox', icon: <CommunicationIcon className="w-4 h-4 md:w-5 md:h-5" /> },
    { id: 'Share Codes', label: 'Access', icon: <ReceiptIcon className="w-4 h-4 md:w-5 md:h-5" /> },
];

const ParentDashboard: React.FC<ParentDashboardProps> = ({ profile, onSelectRole, onProfileUpdate, onSignOut }) => {
    const [activeComponent, setActiveComponent] = useState('Overview');
    
    // Fix: Updated focusedAdmissionId to string | null to match UUID standard.
    const [focusedAdmissionId, setFocusedAdmissionId] = useState<string | null>(null);

    // Fix: Updated admissionId parameter to string to match UUID standard.
    const handleManageDocuments = (admissionId: string) => {
        setFocusedAdmissionId(admissionId);
        setActiveComponent('Documents');
    };

    const components: { [key: string]: React.ReactNode } = {
        'Overview': <OverviewTab profile={profile} setActiveComponent={setActiveComponent} />,
        'My Children': <MyChildrenTab onManageDocuments={handleManageDocuments} profile={profile} />,
        'Documents': <DocumentsTab profile={profile} focusOnAdmissionId={focusedAdmissionId} onClearFocus={() => setFocusedAdmissionId(null)} setActiveComponent={setActiveComponent} />,
        'Messages': <MessagesTab />,
        'Share Codes': <ShareCodesTab onNavigate={setActiveComponent} />,
        'My Profile': <ProfileCreationPage 
                            profile={profile} 
                            role={profile.role!} 
                            onComplete={onProfileUpdate}
                            onBack={() => setActiveComponent('Overview')} 
                            showBackButton={true} 
                        />,
    };

    return (
        <div className="min-h-screen bg-[#08090a] text-foreground flex flex-col selection:bg-primary/20 selection:text-primary overflow-x-hidden">
            <Header 
                profile={profile}
                onSelectRole={onSelectRole}
                onSignOut={onSignOut}
                onProfileClick={() => setActiveComponent('My Profile')}
            />
            
            {/* Optimized Responsive Navigation Ribbon */}
            <div className="sticky top-16 md:top-20 z-30 bg-[#08090a]/80 backdrop-blur-xl border-b border-white/5 pt-4 pb-2">
                <div className="max-w-7xl mx-auto flex items-center justify-start md:justify-center overflow-x-auto no-scrollbar gap-2 px-4">
                    <nav className="flex items-center gap-1 md:gap-3 bg-[#12141c]/60 p-1.5 rounded-full border border-white/10 shadow-2xl" aria-label="Tabs">
                        {navItems.map(item => {
                            const isActive = activeComponent === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveComponent(item.id)}
                                    className={`
                                        flex items-center gap-2 px-4 md:px-7 py-2.5 md:py-3 rounded-full font-black text-[10px] md:text-xs uppercase tracking-widest transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] whitespace-nowrap relative group
                                        ${isActive 
                                            ? 'bg-primary text-white shadow-[0_8px_20px_-4px_rgba(var(--primary),0.4)] scale-[1.05] z-10' 
                                            : 'text-white/40 hover:text-white hover:bg-white/5'
                                        }
                                    `}
                                >
                                    {item.icon}
                                    <span className={isActive ? 'block' : 'hidden sm:block'}>{item.label}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </div>

            <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12">
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
                    {components[activeComponent] || <OverviewTab profile={profile} />}
                </div>
            </main>
            
            <footer className="py-10 border-t border-white/5 bg-black/20 text-center px-6">
                <p className="text-[10px] font-black uppercase tracking-[0.6em] text-white/10">Institutional Matrix v9.5.1 Parent Node</p>
            </footer>

            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};

export default ParentDashboard;
