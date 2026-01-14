
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
    <div className={`inline-block ${className}`}>
        <div className={`${sizeClasses[size]} animate-spin rounded-full border-primary border-t-transparent border-l-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]`} role="status">
            <span className="sr-only">Loading...</span>
        </div>
    </div>
  );
};

export default Spinner;
