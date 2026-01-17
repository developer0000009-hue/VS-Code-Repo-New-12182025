import React from 'react';

export const IdCardIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect x="2" y="5" width="20" height="14" rx="2"></rect>
        <path d="M6 15h2"></path>
        <path d="M10 15h2"></path>
        <path d="M6 11h6"></path>
        <path d="M16 11h2"></path>
        <circle cx="18" cy="8" r="2"></circle>
    </svg>
);