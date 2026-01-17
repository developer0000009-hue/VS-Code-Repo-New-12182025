import React, { useState, useRef, useEffect, useMemo } from 'react';
import { SearchIcon } from '../icons/SearchIcon';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { motion, AnimatePresence } from 'framer-motion';

interface Option {
    value: string;
    label: string;
    icon?: React.ComponentType<{ className?: string }> | React.ReactNode;
}

interface CustomSelectProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    icon?: React.ReactNode; 
    label?: string;
    required?: boolean;
    disabled?: boolean;
    className?: string;
    searchable?: boolean;
    isSynced?: boolean;
    emptyState?: React.ReactNode;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ 
    options, 
    value, 
    onChange, 
    placeholder = "Select...", 
    icon, 
    label,
    disabled, 
    className,
    searchable = false,
    isSynced = false,
    emptyState
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    const filteredOptions = useMemo(() => {
        if (!searchable || !searchTerm) return options;
        const lowerTerm = searchTerm.toLowerCase();
        return options.filter(opt => opt.label.toLowerCase().includes(lowerTerm));
    }, [options, searchTerm, searchable]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && searchable && searchInputRef.current) {
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 100);
        }
        if (!isOpen) {
            setSearchTerm('');
        }
    }, [isOpen, searchable]);

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    return (
        <div className={`relative group w-full ${className || ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`} ref={containerRef}>
            {label && (
                <label className={`absolute left-11 top-0 -translate-y-1/2 bg-slate-900 px-1.5 text-[10px] font-bold uppercase tracking-widest z-20 transition-all duration-300 
                    ${isOpen ? 'text-primary' : isSynced ? 'text-primary' : 'text-white/30'}`}>
                    {label}
                </label>
            )}
            
            <div className="relative h-[56px]">
                <button
                    type="button"
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    disabled={disabled}
                    className={`
                        peer w-full h-full text-left rounded-xl transition-all duration-300 ease-in-out outline-none select-none
                        flex items-center px-5
                        ${icon ? 'pl-12' : 'pl-5'}
                        ${isOpen 
                            ? 'bg-black/40 border border-primary/40 ring-4 ring-primary/5 shadow-xl' 
                            : 'bg-transparent border border-transparent hover:border-white/10'
                        }
                    `}
                >
                    <span className="flex items-center h-full min-w-0 flex-grow">
                        {selectedOption ? (
                            <span className="text-white font-bold text-[15px] tracking-tight truncate">{selectedOption.label}</span>
                        ) : (
                            <span className="text-white/40 font-medium text-[15px] truncate italic">{placeholder}</span>
                        )}
                    </span>
                </button>
                
                {icon && (
                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none transition-all duration-300 ${isOpen ? 'text-primary' : 'text-white/20'}`}>
                        {icon}
                    </div>
                )}

                <span className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                    <ChevronDownIcon className={`h-4 w-4 text-white/20 transition-transform duration-500 ${isOpen ? 'rotate-180 text-primary opacity-100' : 'group-hover:opacity-60'}`} />
                </span>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.98, y: 4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: 4 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute z-[110] mt-2 w-full bg-[#0a0a0c] rounded-[1.8rem] shadow-[0_30px_80px_-15px_rgba(0,0,0,0.9)] border border-white/10 overflow-hidden origin-top backdrop-blur-2xl ring-1 ring-white/10"
                    >
                        {searchable && (
                            <div className="p-4 border-b border-white/[0.05] bg-white/[0.01]">
                                <div className="relative group/search">
                                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within/search:text-primary transition-colors" />
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Filter records..."
                                        className="w-full pl-11 pr-4 py-3 text-xs rounded-xl bg-black/60 border border-white/5 focus:border-primary/50 outline-none text-white placeholder:text-white/10 font-bold uppercase tracking-widest"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="max-h-60 overflow-auto p-2 custom-scrollbar">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSelect(option.value);
                                        }}
                                        className={`
                                            w-full flex items-center gap-3 px-5 py-4 text-xs font-bold uppercase tracking-widest rounded-xl transition-all duration-200 group select-none cursor-pointer mb-1 last:mb-0 border border-transparent
                                            ${value === option.value 
                                                ? 'bg-primary/20 text-primary border-primary/20 shadow-lg' 
                                                : 'text-white/40 hover:bg-white/[0.05] hover:text-white hover:border-white/5'
                                            }
                                        `}
                                    >
                                        <span className="flex-grow text-left truncate">{option.label}</span>
                                        {value === option.value && (
                                            <CheckCircleIcon className="w-4 h-4 text-primary animate-in zoom-in-50" />
                                        )}
                                    </button>
                                ))
                            ) : (
                                emptyState || (
                                    <div className="px-6 py-12 text-center space-y-3">
                                        <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/5">
                                            <SearchIcon className="w-6 h-6 text-white/10" />
                                        </div>
                                        <p className="text-[10px] text-white/20 text-center italic select-none font-black uppercase tracking-[0.2em]">
                                            No Matching Registry Found
                                        </p>
                                    </div>
                                )
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CustomSelect;