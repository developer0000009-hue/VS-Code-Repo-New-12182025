className="px-8 py-12">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-start justify-between gap-12">
                            <div className="flex items-start gap-8">
                                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-3xl font-black text-white shadow-xl">{enquiry.applicant_name.charAt(0)}</div>
                                <div className="space-y-4">
                                    <div>
                                        <h1 className="text-4xl font-black text-white">{enquiry.applicant_name}</h1>
                                        <div className="flex items-center gap-4 mt-2">
                                            <span className="px-4 py-1.5 rounded-full bg-indigo-500/20 text-indigo-300 text-sm font-medium border border-indigo-500/30">Grade {enquiry.grade}</span>
                                            <span className="text-slate-500 text-sm">#{enquiry.id}</span>
                                        </div>
                                    </div>
                                    {currentStatusConfig && (
                                        <div className={`inline-flex items-center gap-3 px-5 py-3 rounded-2xl ${currentStatusConfig.bgColor} border ${currentStatusConfig.borderColor}`}>
                                            <span className={currentStatusConfig.color}>{currentStatusConfig.icon}</span>
                                            <div>
                                                <span className={`font-bold ${currentStatusConfig.color}`}>{currentStatusConfig.label}</span>
                                                <p className="text-xs text-slate-400">{currentStatusConfig.description}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="text-center p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50">
                                    <div className="text-3xl font-black text-white">{messageCount}</div>
                                    <div className="text-xs text-slate-400 uppercase tracking-wider">Messages</div>
                                </div>
                                <div className="text-center p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50">
                                    <div className={`text-3xl font-bold ${daysActive > 7 ? 'text-red-400' : daysActive > 3 ? 'text-amber-400' : 'text-emerald-400'}`}>{daysActive}d</div>
                                    <div className="text-xs text-slate-400 uppercase tracking-wider">Active</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex h-[calc(100vh-320px)]">
                <div className="w-80 bg-slate-900/50 border-r border-slate-700/30 p-6 overflow-y-auto">
                    <WorkflowStepper currentStatus={enquiry.status} />
                    <div className="mt-8 pt-6 border-t border-slate-700/30">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Quick Actions</h3>
                        <div className="space-y-3">
                            {canConvert && (
                                <button onClick={handleConvert} disabled={loading.converting} className="w-full p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/20 transition-all">
                                    {loading.converting ? <Spinner size="sm" /> : <GraduationCapIcon className="w-5 h-5" />}
                                    <span>Convert to Admission</span>
                                </button>
                            )}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Update Status</label>
                                <select value={enquiry.status} onChange={(e) => handleSaveStatus(e.target.value as EnquiryStatus)} disabled={loading.saving} className="w-full p-3 rounded-xl bg-slate-800/60 border border-slate-600/40 text-white outline-none focus:border-indigo-500/50 transition-all">
                                    {ORDERED_STATUSES.map(status => (
                                        <option key={status} value={status} className="bg-slate-900">{STATUS_CONFIG[status].label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                    <div className="bg-slate-800/40 rounded-3xl p-6 border border-slate-700/50">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-3"><UserIcon className="w-5 h-5 text-indigo-400" /> Student Information</h3>
                        <div className="grid grid-cols-2 gap-6">
                            <div><p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Applicant Name</p><p className="text-white font-semibold">{enquiry.applicant_name}</p></div>
                            <div><p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Grade Applied</p><p className="text-white font-semibold">Grade {enquiry.grade}</p></div>
                            <div><p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Status</p><p className={`font-semibold ${currentStatusConfig?.color || 'text-white'}`}>{currentStatusConfig?.label}</p></div>
                        </div>
                    </div>
                    <div className="bg-slate-800/40 rounded-3xl p-6 border border-slate-700/50">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-3"><UsersIcon className="w-5 h-5 text-emerald-400" /> Parent Contact</h3>
                        <div className="grid grid-cols-2 gap-6">
                            <div><p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Parent Name</p><p className="text-white font-semibold">{enquiry.parent_name || 'Not provided'}</p></div>
                            <div><p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Phone</p><p className="text-white font-semibold">{enquiry.parent_phone || 'Not provided'}</p></div>
                            <div className="col-span-2"><p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Email</p><p className="text-white font-semibold">{enquiry.parent_email || 'Not provided'}</p></div>
                        </div>
                    </div>
                </div>
                <div className="w-96 bg-slate-900/50 border-l border-slate-700/30 flex flex-col">
                    <div className="p-6 border-b border-slate-700/30">
                        <h3 className="text-lg font-bold text-white">Activity Timeline</h3>
                        <p className="text-sm text-slate-400">{timeline.length} events</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {timeline.slice(0, 10).map((item, idx) => <TimelineEntry key={idx} item={item} />)}
                    </div>
                    <div className="p-4 border-t border-slate-700/30">
                        <form onSubmit={handleSendMessage} className="flex gap-2">
                            <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-1 p-3 rounded-xl bg-slate-800/60 border border-slate-600/40 text-white placeholder:text-slate-500 outline-none focus:border-indigo-500/50" disabled={isTerminal} />
                            <button type="submit" disabled={!newMessage.trim() || isTerminal} className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 transition-all"><ArrowRightIcon className="w-5 h-5" /></button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnquiryDetailsPage;
interface EnquiryDetailsPageProps { onNavigate?: (component: string) => void; }
