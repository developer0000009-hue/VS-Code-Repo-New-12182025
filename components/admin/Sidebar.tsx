import React, { useState, useEffect } from 'react';
import { SchoolIcon } from '../icons/SchoolIcon';
import { ChevronLeftIcon } from '../icons/ChevronLeftIcon';
import { ChevronRightIcon } from '../icons/ChevronRightIcon';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';
import { MenuGroup } from './AdminMenuConfig';

interface SidebarProps {
    activeComponent: string;
    setActiveComponent: (component: string) => void;
    isCollapsed: boolean;
    setCollapsed: (isCollapsed: boolean) => void;
    isBranchAdmin: boolean;
    isHeadOfficeAdmin: boolean;
    menuGroups: MenuGroup[];
}

const Sidebar: React.FC<SidebarProps> = ({ 
    activeComponent, 
    setActiveComponent, 
    isCollapsed, 
    setCollapsed, 
    menuGroups
}) => {
    const [expandedGroup, setExpandedGroup] = useState<string | null>('overview');

    const handleGroupClick = (groupId: string) => {
        if (isCollapsed) {
            setCollapsed(false);
            setTimeout(() => setExpandedGroup(groupId), 150);
        } else {
            setExpandedGroup(expandedGroup === groupId ? null : groupId);
        }
    };

    return (
        <aside 
            className={`hidden lg:flex fixed top-0 left-0 h-full flex-col bg-card/95 backdrop-blur-xl border-r border-border/60 shadow-xl transition-all duration-300 ease-in-out z-50 ${isCollapsed ? 'w-20' : 'w-[280px]'}`}
        >
            <div className={`flex items-center border-b border-border/40 p-4 h-20 flex-shrink-0 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                <button className="flex items-center gap-3 min-w-0 outline-none group" onClick={() => setActiveComponent('Dashboard')}>
                    <div className="bg-gradient-to-br from-primary to-indigo-600 p-2 rounded-xl text-primary-foreground shadow-lg group-hover:scale-105 transition-transform">
                        <SchoolIcon className="h-6 w-6" />
                    </div>
                    {!isCollapsed && <span className="font-serif font-bold text-lg text-foreground tracking-tight truncate">Admin Node</span>}
                </button>
                {!isCollapsed && (
                    <button onClick={() => setCollapsed(true)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
                        <ChevronLeftIcon className="h-5 w-5" />
                    </button>
                )}
            </div>

            <nav className="flex-1 px-3 py-6 space-y-4 overflow-y-auto custom-scrollbar">
                {menuGroups.map((group) => {
                    const isActiveGroup = expandedGroup === group.id;
                    const hasActiveItem = group.items.some(item => item.id === activeComponent);
                    
                    if (isCollapsed) {
                        return (
                            <div key={group.id} className="flex flex-col items-center space-y-2">
                                <div className="h-px w-8 bg-border/40 my-2" />
                                {group.items.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveComponent(item.id)}
                                        className={`p-2.5 rounded-xl transition-all relative group/item ${activeComponent === item.id ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-muted'}`}
                                        title={item.label}
                                    >
                                        {item.icon}
                                        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-popover text-popover-foreground text-xs font-bold rounded-lg shadow-lg opacity-0 group-hover/item:opacity-100 pointer-events-none transition-opacity z-50 border border-border">
                                            {item.label}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        );
                    }

                    return (
                        <div key={group.id} className="space-y-1">
                            <button
                                onClick={() => handleGroupClick(group.id)}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all group/header ${hasActiveItem && !isActiveGroup ? 'bg-primary/5 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
                            >
                                <span className="text-[10px] font-black uppercase tracking-widest">{group.title}</span>
                                <ChevronDownIcon className={`h-3 w-3 transition-transform ${isActiveGroup ? 'rotate-180 text-primary' : 'opacity-40'}`} />
                            </button>

                            {isActiveGroup && (
                                <ul className="space-y-1 mt-1">
                                    {group.items.map((item) => (
                                        <li key={item.id}>
                                            <button
                                                onClick={() => setActiveComponent(item.id)}
                                                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeComponent === item.id ? 'text-primary bg-primary/10 shadow-inner' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                                            >
                                                {item.icon}
                                                <span className="truncate">{item.label}</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    );
                })}
            </nav>
        </aside>
    );
};

export default Sidebar;