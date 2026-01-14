
import React, { useState } from 'react';
import { CalendarIcon } from './icons/CalendarIcon';
import { ClockIcon } from './icons/ClockIcon';
import { UsersIcon } from './icons/UsersIcon';
import { VideoIcon } from './icons/VideoIcon';
import { PlusIcon } from './icons/PlusIcon';
import { LocationIcon } from './icons/LocationIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XIcon } from './icons/XIcon';
import { SearchIcon } from './icons/SearchIcon';

// Mock Data
const MEETINGS = [
    { id: 1, title: "Weekly Staff Sync", type: "Internal", date: "Today", time: "09:00 AM - 10:00 AM", location: "Conference Room A", attendees: 12, status: "Upcoming", host: "Principal" },
    { id: 2, title: "Parent-Teacher Conference: Grade 10", type: "External", date: "Today", time: "02:00 PM - 04:00 PM", location: "Online (Zoom)", attendees: 45, status: "Upcoming", host: "Coordinator" },
    { id: 3, title: "Science Dept Review", type: "Department", date: "Tomorrow", time: "11:00 AM - 12:30 PM", location: "Lab 1", attendees: 8, status: "Scheduled", host: "HOD Science" },
    { id: 4, title: "Board Meeting", type: "Administrative", date: "Fri, Dec 8", time: "10:00 AM - 12:00 PM", location: "Main Hall", attendees: 20, status: "Scheduled", host: "Director" },
    { id: 5, title: "Budget Planning Q1", type: "Finance", date: "Mon, Dec 11", time: "03:00 PM - 05:00 PM", location: "Finance Office", attendees: 4, status: "Scheduled", host: "CFO" },
];

const MeetingCard: React.FC<{ meeting: typeof MEETINGS[0] }> = ({ meeting }) => {
    const isToday = meeting.date === "Today";
    const isOnline = meeting.location.toLowerCase().includes('online');

    return (
        <div className={`group relative p-5 rounded-2xl border transition-all duration-300 hover:shadow-lg ${isToday ? 'bg-card border-primary/30 shadow-md shadow-primary/5' : 'bg-card border-border hover:border-primary/20'}`}>
            {isToday && <div className="absolute top-0 left-0 w-1.5 h-full bg-primary rounded-l-2xl"></div>}
            
            <div className="flex justify-between items-start mb-3 pl-2">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                            meeting.type === 'Internal' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400' :
                            meeting.type === 'External' ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400' :
                            'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400'
                        }`}>
                            {meeting.type}
                        </span>
                        {isToday && <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100 animate-pulse">Happening Today</span>}
                    </div>
                    <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">{meeting.title}</h3>
                </div>
                {isOnline && (
                    <div className="p-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 rounded-full">
                        <VideoIcon className="w-5 h-5" />
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm text-muted-foreground pl-2 mb-4">
                <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" /> {meeting.date}
                </div>
                <div className="flex items-center gap-2">
                    <ClockIcon className="w-4 h-4" /> {meeting.time}
                </div>
                <div className="flex items-center gap-2 col-span-2">
                    <LocationIcon className="w-4 h-4" /> {meeting.location}
                </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border pl-2">
                <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="w-7 h-7 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[9px] font-bold">
                                {String.fromCharCode(65+i)}
                            </div>
                        ))}
                        {meeting.attendees > 3 && (
                            <div className="w-7 h-7 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[9px] font-bold z-10">
                                +{meeting.attendees - 3}
                            </div>
                        )}
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">Attending</span>
                </div>
                
                {isOnline ? (
                    <button className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90 transition-all shadow-md shadow-primary/20">
                        Join Meeting
                    </button>
                ) : (
                    <button className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground text-xs font-bold rounded-lg transition-colors border border-border">
                        View Details
                    </button>
                )}
            </div>
        </div>
    );
};

const MeetingsTab: React.FC = () => {
    const [filter, setFilter] = useState('Upcoming');
    const [search, setSearch] = useState('');

    const filteredMeetings = MEETINGS.filter(m => 
        m.title.toLowerCase().includes(search.toLowerCase()) &&
        (filter === 'All' || m.status === 'Upcoming' /* Mock filter logic */)
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h2 className="text-3xl font-serif font-bold text-foreground tracking-tight">Meetings & Events</h2>
                    <p className="text-muted-foreground mt-2 text-lg">Schedule, manage, and join school meetings.</p>
                </div>
                <button className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:bg-primary/90 transition-all flex items-center gap-2 transform hover:-translate-y-0.5">
                    <PlusIcon className="w-5 h-5" /> Schedule Meeting
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main List */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Toolbar */}
                    <div className="flex items-center gap-4 bg-card p-2 rounded-xl border border-border shadow-sm">
                        <div className="relative flex-grow">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input 
                                type="text" 
                                placeholder="Search meetings..." 
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-transparent border-none focus:ring-0 text-sm font-medium placeholder:text-muted-foreground"
                            />
                        </div>
                        <div className="h-6 w-px bg-border"></div>
                        <select 
                            value={filter} 
                            onChange={e => setFilter(e.target.value)}
                            className="bg-transparent border-none text-sm font-bold text-foreground focus:ring-0 cursor-pointer pr-8"
                        >
                            <option value="Upcoming">Upcoming</option>
                            <option value="Past">Past</option>
                            <option value="All">All Meetings</option>
                        </select>
                    </div>

                    <div className="space-y-4">
                        {filteredMeetings.map(meeting => (
                            <MeetingCard key={meeting.id} meeting={meeting} />
                        ))}
                    </div>
                </div>

                {/* Sidebar Calendar & Quick Stats */}
                <div className="space-y-6">
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                        <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                            <CalendarIcon className="w-5 h-5 text-primary"/> Calendar
                        </h3>
                        {/* Mock Calendar Visual */}
                        <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
                            {['S','M','T','W','T','F','S'].map(d => <div key={d} className="font-bold text-muted-foreground py-1">{d}</div>)}
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium">
                            {Array.from({length: 30}, (_, i) => {
                                const day = i + 1;
                                const hasEvent = [5, 8, 12, 20, 25].includes(day);
                                const isToday = day === 5; // Mock today
                                return (
                                    <div key={day} className={`aspect-square flex items-center justify-center rounded-lg relative ${isToday ? 'bg-primary text-primary-foreground font-bold shadow-md' : 'hover:bg-muted cursor-pointer'}`}>
                                        {day}
                                        {hasEvent && !isToday && <div className="absolute bottom-1 w-1 h-1 rounded-full bg-primary"></div>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-2xl p-6 shadow-lg">
                        <h3 className="font-bold text-lg mb-1">Your Schedule</h3>
                        <p className="text-indigo-100 text-sm mb-6">You have 2 meetings remaining today.</p>
                        
                        <div className="space-y-3">
                            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 flex items-center gap-3 border border-white/10">
                                <div className="p-2 bg-white/20 rounded-lg"><ClockIcon className="w-4 h-4 text-white"/></div>
                                <div>
                                    <p className="text-sm font-bold">2:00 PM</p>
                                    <p className="text-xs text-indigo-100">Parent Conf.</p>
                                </div>
                            </div>
                             <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 flex items-center gap-3 border border-white/10">
                                <div className="p-2 bg-white/20 rounded-lg"><UsersIcon className="w-4 h-4 text-white"/></div>
                                <div>
                                    <p className="text-sm font-bold">4:30 PM</p>
                                    <p className="text-xs text-indigo-100">Wrap-up Sync</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MeetingsTab;
