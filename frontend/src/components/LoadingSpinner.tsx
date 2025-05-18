import React from 'react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    isFullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
    size = 'md',
    className = '',
    isFullScreen = true
}) => {
    const sizeClasses = {
        sm: 'w-6 h-6 border-2',
        md: 'w-10 h-10 border-3',
        lg: 'w-16 h-16 border-4',
    };

    const containerClasses = isFullScreen 
        ? 'fixed inset-0 z-50 flex justify-center items-center bg-white/80 backdrop-blur-sm' 
        : `flex w-full h-full justify-center items-center bg-white p-5 rounded-lg ${className}`;

    return (
        <div className={containerClasses}>
            <div 
                className={`
                    ${sizeClasses[size]}
                    rounded-full
                    border-gray-200
                    border-t-blue-500
                    animate-spin
                `}
            />
        </div>
    );
};

export default LoadingSpinner;
