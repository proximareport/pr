import React from 'react';

interface GradientBackgroundProps {
  variant?: 'default' | 'cosmic' | 'aurora' | 'nebula';
  intensity?: 'subtle' | 'medium' | 'intense';
  className?: string;
}

const GradientBackground: React.FC<GradientBackgroundProps> = ({
  variant = 'cosmic',
  intensity = 'medium',
  className = ''
}) => {
  const getGradientClasses = () => {
    const baseClasses = 'absolute inset-0 transition-all duration-1000';
    
    switch (variant) {
      case 'cosmic':
        return `${baseClasses} ${
          intensity === 'subtle' 
            ? 'bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-900'
            : intensity === 'medium'
            ? 'bg-gradient-to-br from-slate-950 via-purple-950/50 to-slate-900'
            : 'bg-gradient-to-br from-slate-950 via-purple-950/70 to-slate-900'
        }`;
      
      case 'aurora':
        return `${baseClasses} ${
          intensity === 'subtle'
            ? 'bg-gradient-to-br from-slate-950 via-emerald-950/20 via-purple-950/20 to-slate-900'
            : intensity === 'medium'
            ? 'bg-gradient-to-br from-slate-950 via-emerald-950/40 via-purple-950/40 to-slate-900'
            : 'bg-gradient-to-br from-slate-950 via-emerald-950/60 via-purple-950/60 to-slate-900'
        }`;
      
      case 'nebula':
        return `${baseClasses} ${
          intensity === 'subtle'
            ? 'bg-gradient-to-br from-slate-950 via-pink-950/20 via-blue-950/20 to-slate-900'
            : intensity === 'medium'
            ? 'bg-gradient-to-br from-slate-950 via-pink-950/40 via-blue-950/40 to-slate-900'
            : 'bg-gradient-to-br from-slate-950 via-pink-950/60 via-blue-950/60 to-slate-900'
        }`;
      
      default:
        return `${baseClasses} bg-gradient-to-br from-slate-950 via-purple-950/50 to-slate-900`;
    }
  };

  const getAnimatedOrbs = () => {
    const orbCount = intensity === 'intense' ? 4 : intensity === 'medium' ? 3 : 2;
    
    return Array.from({ length: orbCount }, (_, i) => {
      const colors = variant === 'aurora' 
        ? ['#10B981', '#8B5CF6', '#06B6D4']
        : variant === 'nebula'
        ? ['#EC4899', '#3B82F6', '#8B5CF6']
        : ['#8B5CF6', '#3B82F6', '#06B6D4'];
      
      const color = colors[i % colors.length];
      const size = intensity === 'intense' ? 96 : intensity === 'medium' ? 80 : 64;
      const opacity = intensity === 'intense' ? 0.15 : intensity === 'medium' ? 0.1 : 0.08;
      
      const positions = [
        { top: '10%', left: '20%' },
        { top: '60%', right: '15%' },
        { bottom: '20%', left: '70%' },
        { top: '30%', right: '40%' }
      ];
      
      const position = positions[i % positions.length];
      
      return (
        <div
          key={i}
          className={`absolute w-${size/4} h-${size/4} rounded-full blur-3xl animate-pulse`}
          style={{
            ...position,
            backgroundColor: color,
            opacity: opacity,
            animationDelay: `${i * 2}s`,
            animationDuration: '6s'
          }}
        />
      );
    });
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Base Gradient */}
      <div className={getGradientClasses()} />
      
      {/* Radial Gradient Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />
      
      {/* Animated Orbs */}
      {getAnimatedOrbs()}
      
      {/* Subtle Noise Texture */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
};

export default GradientBackground;
