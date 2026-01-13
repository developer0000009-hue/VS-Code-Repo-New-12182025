
import React from 'react';
import { motion } from 'framer-motion';

export const CheckCircleIcon: React.FC<React.SVGProps<SVGSVGElement> & { animate?: boolean }> = ({ animate = false, ...props }) => {
    const circleVariants = {
        hidden: { pathLength: 0, opacity: 0 },
        visible: {
            pathLength: 1,
            opacity: 1,
            transition: {
                pathLength: { type: "spring", duration: 1.5, bounce: 0 },
                opacity: { duration: 0.01 }
            }
        }
    };

    const checkVariants = {
        hidden: { pathLength: 0, opacity: 0 },
        visible: {
            pathLength: 1,
            opacity: 1,
            transition: {
                pathLength: { delay: 0.4, type: "spring", duration: 0.8, bounce: 0 },
                opacity: { delay: 0.4, duration: 0.01 }
            }
        }
    };

    if (!animate) {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        );
    }

    return (
        <motion.svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            initial="hidden"
            animate="visible"
            {...props}
        >
            <motion.path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                variants={circleVariants}
            />
            <motion.path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75"
                variants={checkVariants}
            />
        </motion.svg>
    );
};