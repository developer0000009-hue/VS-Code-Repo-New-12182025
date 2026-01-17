import React from 'react';

interface StepProps {
    label: string;
    isCompleted: boolean;
    isCurrent: boolean;
}

const Step: React.FC<StepProps> = ({ label, isCompleted, isCurrent }) => {
    const baseCircleClass = "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors";
    const circleClass = isCompleted 
        ? "bg-primary text-primary-foreground" 
        : isCurrent 
        ? "bg-primary/20 border-2 border-primary text-primary" 
        : "bg-muted border-2 border-border text-muted-foreground";
    
    const labelClass = isCompleted || isCurrent ? "text-foreground" : "text-muted-foreground";

    return (
        <div className="flex flex-col items-center">
            <div className={`${baseCircleClass} ${circleClass}`}>
                {isCompleted && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                )}
            </div>
            <p className={`mt-1 text-xs text-center ${labelClass}`}>{label}</p>
        </div>
    );
};

interface ProgressIndicatorProps {
    steps: string[];
    currentStep: string;
    className?: string;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ steps, currentStep, className }) => {
    const currentStepIndex = steps.indexOf(currentStep);

    return (
        <div className={`flex items-start justify-between ${className}`}>
            {steps.map((step, index) => (
                <React.Fragment key={step}>
                    <div className="flex-1 text-center">
                        <Step 
                            label={step}
                            isCompleted={index < currentStepIndex}
                            isCurrent={index === currentStepIndex}
                        />
                    </div>
                    {index < steps.length - 1 && (
                        <div className={`flex-1 h-0.5 mt-3 ${index < currentStepIndex ? 'bg-primary' : 'bg-border'}`}></div>
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};

export default ProgressIndicator;
