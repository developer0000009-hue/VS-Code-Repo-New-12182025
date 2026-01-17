
import React from 'react';

interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
      sm: 'h-5 w-5 border-2',
      md: 'h-8 w-8 border-[3px]',
      lg: 'h-12 w-12 border-4',
  };
  
  return (
    <div className={`inline-block relative ${className}`}>
        {/* Background Track */}
        <div className={`${sizeClasses[size]} rounded-full border-current opacity-20`}></div>
        {/* Spinning Segment */}
        <div className={`${sizeClasses[size]} absolute top-0 left-0 rounded-full border-current border-t-transparent animate-spin`}></div>
        <span className="sr-only">Loading...</span>
    </div>
  );
};

export default Spinner;
