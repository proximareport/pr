import React from 'react';
import { Loader2, Sparkles, Rocket, Star } from 'lucide-react';

interface ModernLoadingProps {
  text?: string;
  variant?: 'default' | 'sparkles' | 'rocket' | 'stars';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ModernLoading({ 
  text = "Loading...", 
  variant = 'default',
  size = 'md',
  className = ""
}: ModernLoadingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const getIcon = () => {
    switch (variant) {
      case 'sparkles':
        return <Sparkles className={`${sizeClasses[size]} text-purple-400 animate-pulse`} />;
      case 'rocket':
        return <Rocket className={`${sizeClasses[size]} text-purple-400 animate-bounce`} />;
      case 'stars':
        return <Star className={`${sizeClasses[size]} text-purple-400 animate-spin`} />;
      default:
        return <Loader2 className={`${sizeClasses[size]} text-purple-400 animate-spin`} />;
    }
  };

  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      <div className="relative">
        {getIcon()}
        {variant === 'sparkles' && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-300 rounded-full animate-ping" />
        )}
      </div>
      <span className={`text-white/80 font-medium ${textSizeClasses[size]} animate-pulse`}>
        {text}
      </span>
    </div>
  );
}

export function ModernSkeleton({ 
  className = "",
  variant = 'default'
}: { 
  className?: string;
  variant?: 'default' | 'card' | 'text' | 'avatar';
}) {
  const baseClasses = "animate-pulse bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-[length:200%_100%]";
  
  const variantClasses = {
    default: "rounded-lg",
    card: "rounded-2xl",
    text: "rounded",
    avatar: "rounded-full"
  };

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={{
        animation: 'shimmer 2s infinite linear'
      }}
    />
  );
}

export function ModernSpinner({ 
  size = 'md',
  className = ""
}: { 
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`relative ${className}`}>
      <div className={`${sizeClasses[size]} border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin`} />
      <div className={`absolute inset-0 ${sizeClasses[size]} border-2 border-transparent border-t-purple-300/50 rounded-full animate-spin`} 
           style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
    </div>
  );
}
