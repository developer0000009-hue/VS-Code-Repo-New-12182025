
import React from 'react';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';

interface StepperProps {
    steps: string[];
    currentStep: number;
    onStepClick?: (index: number) => void;
}

const Stepper: React.FC<StepperProps> = ({ steps, currentStep, onStepClick }) => {
    return (
        <nav aria-label="Progress" className="w-full">
            <ol role="list" className="flex items-center justify-between w-full relative">
                {/* Background Line */}
                <div className="absolute top-1/2 left-0 w-full h-1 bg-muted -z-10 rounded-full transform -translate-y-1/2 mx-4"></div>
                
                {/* Active Progress Line */}
                <div 
                    className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-primary to-indigo-500 -z-10 rounded-full transition-all duration-700 ease-out transform -translate-y-1/2 mx-4" 
                    style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                ></div>

                {steps.map((step, stepIdx) => {
                    const isCompleted = stepIdx < currentStep;
                    const isCurrent = stepIdx === currentStep;
                    const canClick = onStepClick && (isCompleted || isCurrent);

                    return (
                        <li key={step} className="relative flex flex-col items-center group">
                            {isCompleted ? (
                                <button 
                                    onClick={() => canClick && onStepClick && onStepClick(stepIdx)}
                                    disabled={!canClick}
                                    className={`
                                        w-10 h-10 rounded-full flex items-center justify-center bg-primary text-white border-4 border-background shadow-lg transition-all duration-300 transform
                                        ${canClick ? 'cursor-pointer hover:scale-110' : 'cursor-default'}
                                    `}
                                >
                                    <CheckCircleIcon className="w-5 h-5" />
                                </button>
                            ) : isCurrent ? (
                                <button
                                    className="w-10 h-10 rounded-full flex items-center justify-center bg-background border-4 border-primary text-primary shadow-xl ring-4 ring-primary/20 transition-all duration-300 scale-110 cursor-default"
                                >
                                    <span className="h-3 w-3 bg-primary rounded-full animate-pulse" />
                                </button>
                            ) : (
                                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-card border-4 border-muted text-muted-foreground shadow-sm">
                                    <span className="text-xs font-bold">{stepIdx + 1}</span>
                                </div>
                            )}
                            
                            <span 
                                className={`
                                    absolute top-14 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-300
                                    ${isCurrent ? 'text-primary transform -translate-y-1' : isCompleted ? 'text-foreground' : 'text-muted-foreground'}
                                `}
                            >
                                {step}
                            </span>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};

export default Stepper;
