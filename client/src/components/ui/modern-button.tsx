import React from 'react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface ModernButtonProps {
  children: React.ReactNode;
  variant?: 'default' | 'futuristic' | 'holographic' | 'quantum' | 'neon';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  href?: string;
}

export const ModernButton: React.FC<ModernButtonProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  onClick,
  disabled = false,
  loading = false,
  href
}) => {
  const baseClasses = "relative overflow-hidden transition-all duration-300 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variantClasses = {
    default: "bg-purple-600 hover:bg-purple-700 text-white focus:ring-purple-500",
    futuristic: "bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white focus:ring-purple-500 shadow-lg hover:shadow-xl",
    holographic: "bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 text-white focus:ring-cyan-500 animate-pulse",
    quantum: "bg-black border-2 border-cyan-500 text-cyan-500 hover:bg-cyan-500 hover:text-black focus:ring-cyan-500",
    neon: "bg-transparent border-2 border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white focus:ring-purple-500 shadow-[0_0_10px_rgba(139,92,246,0.5)] hover:shadow-[0_0_20px_rgba(139,92,246,0.8)]"
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg"
  };

  const buttonClasses = cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className
  );

  const renderButton = () => (
    <button
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {/* Shimmer effect for futuristic variant */}
      {variant === 'futuristic' && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1000"></div>
      )}
      
      {/* Holographic effect for holographic variant */}
      {variant === 'holographic' && (
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/50 via-purple-500/50 to-cyan-500/50 animate-pulse"></div>
      )}
      
      {/* Quantum particles for quantum variant */}
      {variant === 'quantum' && (
        <div className="absolute inset-0">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-cyan-500 rounded-full animate-ping"
              style={{
                left: `${20 + i * 30}%`,
                top: '50%',
                transform: 'translateY(-50%)',
                animationDelay: `${i * 0.2}s`
              }}
            />
          ))}
        </div>
      )}
      
      {/* Neon glow for neon variant */}
      {variant === 'neon' && (
        <div className="absolute inset-0 bg-purple-500/20 blur-sm"></div>
      )}
      
      <span className="relative z-10 flex items-center justify-center">
        {loading && (
          <div className="mr-2">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        {children}
      </span>
    </button>
  );

  if (href) {
    return (
      <a href={href} className="inline-block">
        {renderButton()}
      </a>
    );
  }

  return renderButton();
};

export default ModernButton; 