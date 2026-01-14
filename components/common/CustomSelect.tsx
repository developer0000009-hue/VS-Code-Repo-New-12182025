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
    isSynced = false
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
            
            <div className="relative h-[48px]">
                <button
                    type="button"
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    disabled={disabled}
                    className={`
                        peer w-full h-full text-left rounded-xl border transition-all duration-300 ease-in-out outline-none select-none
                        flex items-center px-5 pt-3 pb-1
                        ${icon ? 'pl-12' : 'pl-5'}
                        ${isSynced ? 'border-primary/40 bg-primary/5 shadow-[0_0_15px_rgba(var(--primary),0.05)]' : 'border-white/10 bg-black/30'}
                        ${isOpen 
                            ? 'border-primary/40 ring-4 ring-primary/5 shadow-xl' 
                            : 'hover:border-white/20'
                        }
                    `}
                >
                    <span className="flex items-center h-full min-w-0 flex-grow">
                        {selectedOption ? (
                            <span className="text-white font-medium text-[15px] tracking-tight truncate">{selectedOption.label}</span>
                        ) : (
                            <span className="text-white/20 font-normal text-[15px] truncate">{placeholder}</span>
                        )}
                    </span>
                </button>
                
                {icon && (
                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none transition-all duration-300 ${isOpen ? 'text-primary' : isSynced ? 'text-primary' : 'text-white/10'}`}>
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
                        className="absolute z-[110] mt-2 w-full bg-[#1e293b] rounded-2xl shadow-[0_30px_80px_-15px_rgba(0,0,0,0.8)] border border-white/10 overflow-hidden origin-top backdrop-blur-2xl ring-1 ring-white/10"
                    >
                        {searchable && (
                            <div className="p-3 border-b border-white/[0.05] bg-white/[0.01]">
                                <div className="relative">
                                    <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search..."
                                        className="w-full pl-10 pr-3 py-2 text-xs rounded-lg bg-black/40 border border-white/5 focus:border-primary/50 outline-none text-white placeholder:text-white/10 font-medium"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="max-h-60 overflow-auto p-1.5 custom-scrollbar">
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
                                            w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl transition-all duration-200 group select-none cursor-pointer mb-1 last:mb-0
                                            ${value === option.value 
                                                ? 'bg-primary/10 text-primary shadow-sm' 
                                                : 'text-white/60 hover:bg-white/[0.05] hover:text-white'
                                            }
                                        `}
                                    >
                                        <span className={`flex-grow text-left truncate font-medium ${value === option.value ? 'font-semibold' : ''}`}>{option.label}</span>
                                        {value === option.value && (
                                            <CheckCircleIcon className="w-4 h-4 text-primary animate-in zoom-in-50" />
                                        )}
                                    </button>
                                ))
                            ) : (
                                <div className="px-6 py-8 text-xs text-white/20 text-center italic select-none font-medium uppercase tracking-widest">
                                    No records found
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CustomSelect;
