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
    { id: 'Overview', label: 'Dashboard', icon: <HomeIcon className="w-4 h-4 md:w-4 md:h-4" /> },
    { id: 'My Children', label: 'Children', icon: <StudentsIcon className="w-4 h-4 md:w-4 md:h-4" /> },
    { id: 'Documents', label: 'Vault', icon: <DocumentTextIcon className="w-4 h-4 md:w-4 md:h-4" /> },
    { id: 'Messages', label: 'Inbox', icon: <CommunicationIcon className="w-4 h-4 md:w-4 md:h-4" /> },
    { id: 'Share Codes', label: 'Access', icon: <ReceiptIcon className="w-4 h-4 md:w-4 md:h-4" /> },
];

const ParentDashboard: React.FC<ParentDashboardProps> = ({ profile, onSelectRole, onProfileUpdate, onSignOut }) => {
    const [activeComponent, setActiveComponent] = useState('Overview');
    const [focusedAdmissionId, setFocusedAdmissionId] = useState<string | null>(null);

    const handleManageDocuments = (admissionId: string) => {
        setFocusedAdmissionId(admissionId);
        setActiveComponent('Documents');
    };

    const components: { [key: string]: React.ReactNode } = {
        'Overview': <OverviewTab profile={profile} setActiveComponent={setActiveComponent} />,
        'My Children': <MyChildrenTab onManageDocuments={handleManageDocuments} profile={profile} />,
        'Documents': <DocumentsTab focusOnAdmissionId={focusedAdmissionId} onClearFocus={() => setFocusedAdmissionId(null)} />,
        'Messages': <MessagesTab />,
        'Share Codes': <ShareCodesTab />,
        'My Profile': <ProfileCreationPage 
                            profile={profile} 
                            role={profile.role!} 
                            onComplete={onProfileUpdate}
                            onBack={() => setActiveComponent('Overview')} 
                            showBackButton={true} 
                        />,
    };

    return (
        <div className="min-h-screen bg-[#08090a] text-foreground flex flex-col selection:bg-primary/20 selection:text-primary overflow-x-hidden font-sans">
            <Header 
                profile={profile}
                onSelectRole={onSelectRole}
                onSignOut={onSignOut}
                onProfileClick={() => setActiveComponent('My Profile')}
            />
            
            {/* World-Class Responsive Navigation Ribbon */}
            <div className="sticky top-20 md:top-24 z-30 bg-[#08090a]/95 backdrop-blur-xl border-b border-white/[0.03] pt-6 pb-4 transition-all">
                <div className="max-w-7xl mx-auto flex items-center justify-start md:justify-center overflow-x-auto no-scrollbar px-6">
                    <nav className="flex items-center gap-2 bg-[#12141c]/40 p-1.5 rounded-2xl border border-white/[0.04] shadow-2xl backdrop-blur-md" aria-label="Global Navigation">
                        {navItems.map(item => {
                            const isActive = activeComponent === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveComponent(item.id)}
                                    className={`
                                        flex items-center gap-2.5 px-6 md:px-7 py-3 rounded-xl font-bold text-[11px] uppercase tracking-[0.15em] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] whitespace-nowrap relative group
                                        ${isActive 
                                            ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02] z-10' 
                                            : 'text-white/50 hover:text-white/90 hover:bg-white/[0.02]'
                                        }
                                    `}
                                >
                                    <span className={`transition-colors duration-300 ${isActive ? 'text-white' : 'text-white/20 group-hover:text-primary'}`}>{item.icon}</span>
                                    <span className={isActive ? 'block' : 'hidden sm:block'}>{item.label}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </div>

            <main className="flex-grow max-w-7xl w-full mx-auto px-6 sm:px-8 py-10 md:py-16">
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {components[activeComponent] || <OverviewTab profile={profile} />}
                </div>
            </main>
            
            <footer className="py-12 border-t border-white/[0.03] bg-black/40 text-center px-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.6em] text-white/5 select-none">Institutional Matrix • v9.5.1 Parent Node</p>
            </footer>

            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};

export default ParentDashboard;