import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'futuristic' | 'holographic' | 'quantum';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'default',
  className = ''
}) => {
  const sizeMap = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const renderSpinner = () => {
    switch (variant) {
      case 'futuristic':
        return (
          <div className={`${sizeMap[size]} relative ${className}`}>
            <div className="absolute inset-0 border-2 border-purple-500/30 rounded-full"></div>
            <div className="absolute inset-0 border-2 border-transparent border-t-purple-500 rounded-full animate-spin"></div>
            <div className="absolute inset-1 border-2 border-cyan-500/30 rounded-full"></div>
            <div className="absolute inset-1 border-2 border-transparent border-t-cyan-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            <div className="absolute inset-2 border-2 border-purple-500/20 rounded-full"></div>
            <div className="absolute inset-2 border-2 border-transparent border-t-purple-500 rounded-full animate-spin" style={{ animationDuration: '2s' }}></div>
          </div>
        );

      case 'holographic':
        return (
          <div className={`${sizeMap[size]} relative ${className}`}>
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 rounded-full animate-pulse"></div>
            <div className="absolute inset-1 bg-black rounded-full"></div>
            <div className="absolute inset-2 bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 rounded-full animate-spin"></div>
            <div className="absolute inset-3 bg-black rounded-full"></div>
            <div className="absolute inset-4 bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 rounded-full animate-spin" style={{ animationDirection: 'reverse' }}></div>
          </div>
        );

      case 'quantum':
        return (
          <div className={`${sizeMap[size]} relative ${className}`}>
            <div className="absolute inset-0">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-cyan-500 rounded-full animate-pulse"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: `translate(-50%, -50%) rotate(${i * 45}deg) translateY(-${parseInt(sizeMap[size].split(' ')[1]) / 2}px)`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: '1.5s'
                  }}
                />
              ))}
            </div>
            <div className="absolute inset-0 border-2 border-cyan-500/50 rounded-full animate-spin"></div>
          </div>
        );

      default:
        return (
          <div className={`${sizeMap[size]} border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin ${className}`}></div>
        );
    }
  };

  return renderSpinner();
};

export default LoadingSpinner; 