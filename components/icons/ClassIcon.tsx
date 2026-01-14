
import React from 'react';

export const ClassIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M3 21h18"/>
        <path d="M5 21V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v14"/>
        <path d="M9 10a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v7h-6v-7Z"/>
    </svg>
);
