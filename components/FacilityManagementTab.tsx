
import React, { useState } from 'react';
import { SearchIcon } from './icons/SearchIcon';
import { FilterIcon } from './icons/FilterIcon';
import { PlusIcon } from './icons/PlusIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { ClockIcon } from './icons/ClockIcon';
import { UsersIcon } from './icons/UsersIcon';
import { BookIcon } from './icons/BookIcon';

// Mock Data
const FACILITIES = [
    { id: 1, name: "Main Auditorium", type: "Hall", capacity: 500, status: "Available", nextBooking: "Tomorrow, 10:00 AM", image: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=800&q=80" },
    { id: 2, name: "Science Lab A", type: "Lab", capacity: 40, status: "Occupied", nextBooking: "In use until 11:00 AM", image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80" },
    { id: 3, name: "Computer Lab", type: "Lab", capacity: 30, status: "Maintenance", nextBooking: "Closed for repairs", image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80" },
    { id: 4, name: "Basketball Court", type: "Sports", capacity: 50, status: "Available", nextBooking: "Today, 4:00 PM", image: "https://images.unsplash.com/photo-1505666287802-931dc83948e9?auto=format&fit=crop&w=800&q=80" },
    { id: 5, name: "Library", type: "Academic", capacity: 120, status: "Available", nextBooking: "Always Open", image: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=800&q=80" },
    { id: 6, name: "Conference Room B", type: "Meeting", capacity: 15, status: "Occupied", nextBooking: "In use until 2:00 PM", image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80" },
];

const statusColors: Record<string, string> = {
    'Available': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
    'Occupied': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
    'Maintenance': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
};

const statusIcons: Record<string, React.ReactNode> = {
    'Available': <CheckCircleIcon className="w-3.5 h-3.5" />,
    'Occupied': <ClockIcon className="w-3.5 h-3.5" />,
    'Maintenance': <XCircleIcon className="w-3.5 h-3.5" />,
};

const FacilityCard: React.FC<{ facility: typeof FACILITIES[0] }> = ({ facility }) => (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col h-full">
        <div className="h-40 relative overflow-hidden">
            <img src={facility.image} alt={facility.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
            <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end">
                <span className="text-white font-bold text-lg shadow-black drop-shadow-md">{facility.name}</span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-black/50 text-white backdrop-blur-md border border-white/20`}>
                    {facility.type}
                </span>
            </div>
        </div>
        
        <div className="p-5 flex flex-col flex-grow">
            <div className="flex justify-between items-center mb-4">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${statusColors[facility.status]}`}>
                    {statusIcons[facility.status]}
                    {facility.status}
                </span>
                <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium">
                    <UsersIcon className="w-3.5 h-3.5" />
                    {facility.capacity} Cap.
                </div>
            </div>
            
            <div className="text-xs text-muted-foreground mb-6 bg-muted/30 p-3 rounded-lg border border-border/50">
                <span className="font-bold text-foreground uppercase tracking-wider text-[10px] block mb-1">Next Availability</span>
                {facility.nextBooking}
            </div>
            
            <div className="mt-auto flex gap-2">
                <button 
                    className="flex-1 py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-all shadow-sm disabled:opacity-50"
                    disabled={facility.status === 'Maintenance'}
                >
                    Book Now
                </button>
                <button className="p-2.5 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground rounded-xl border border-transparent hover:border-border transition-colors">
                    <ClockIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
    </div>
);

const FacilityManagementTab: React.FC = () => {
    const [filter, setFilter] = useState('All');
    const [search, setSearch] = useState('');

    const filtered = FACILITIES.filter(f => {
        const matchesFilter = filter === 'All' || f.type === filter || f.status === filter;
        const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-serif font-bold text-foreground tracking-tight">Facility Management</h2>
                    <p className="text-muted-foreground mt-2 text-lg">Manage campus infrastructure, bookings, and maintenance.</p>
                </div>
                <button className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:bg-primary/90 transition-all flex items-center gap-2 transform hover:-translate-y-0.5">
                    <PlusIcon className="w-5 h-5" /> Add Facility
                </button>
            </div>

            {/* Toolbar */}
            <div className="bg-card border border-border rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center sticky top-0 z-20 backdrop-blur-xl bg-opacity-90">
                <div className="relative w-full md:w-96 group">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Search facilities..." 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-input bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                    />
                </div>
                
                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                    {['All', 'Available', 'Occupied', 'Maintenance', 'Lab', 'Sports'].map(f => (
                        <button 
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
                                filter === f 
                                ? 'bg-primary/10 text-primary border-primary/20 shadow-sm' 
                                : 'bg-background text-muted-foreground border-transparent hover:bg-muted hover:text-foreground'
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            {filtered.length === 0 ? (
                <div className="text-center py-24 text-muted-foreground bg-muted/20 border-2 border-dashed border-border rounded-2xl">
                    <BookIcon className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4" />
                    <p className="font-medium text-lg text-foreground">No facilities found</p>
                    <p className="text-sm mt-1">Try adjusting your search or filters.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filtered.map(f => (
                        <FacilityCard key={f.id} facility={f} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default FacilityManagementTab;
