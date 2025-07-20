import React, { useEffect, useRef } from 'react';

interface AnimatedBackgroundProps {
  variant?: 'particles' | 'holographic' | 'neural' | 'cosmic';
  intensity?: 'low' | 'medium' | 'high';
  className?: string;
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  variant = 'particles',
  intensity = 'medium',
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle system
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
      color: string;
    }> = [];

    const intensityMap = {
      low: { count: 20, speed: 0.5, size: 2 },
      medium: { count: 50, speed: 1, size: 3 },
      high: { count: 100, speed: 1.5, size: 4 }
    };

    const variantMap = {
      particles: {
        colors: ['#00D4FF', '#8B5CF6', '#FFFFFF'],
        behavior: 'float'
      },
      holographic: {
        colors: ['#00D4FF', '#0099CC', '#00FFFF'],
        behavior: 'holographic'
      },
      neural: {
        colors: ['#00D4FF', '#8B5CF6', '#FF00FF'],
        behavior: 'neural'
      },
      cosmic: {
        colors: ['#FFFFFF', '#00FFFF', '#FF69B4'],
        behavior: 'cosmic'
      }
    };

    const config = intensityMap[intensity];
    const variantConfig = variantMap[variant];

    // Initialize particles
    for (let i = 0; i < config.count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * config.speed,
        vy: (Math.random() - 0.5) * config.speed,
        size: Math.random() * config.size + 1,
        opacity: Math.random() * 0.5 + 0.1,
        color: variantConfig.colors[Math.floor(Math.random() * variantConfig.colors.length)]
      });
    }

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle, index) => {
        // Update position based on variant behavior
        switch (variantConfig.behavior) {
          case 'float':
            particle.x += particle.vx;
            particle.y += particle.vy;
            break;
          case 'holographic':
            particle.x += particle.vx * Math.sin(Date.now() * 0.001 + index);
            particle.y += particle.vy * Math.cos(Date.now() * 0.001 + index);
            break;
          case 'neural':
            particle.x += particle.vx * Math.sin(Date.now() * 0.002 + index * 0.1);
            particle.y += particle.vy * Math.cos(Date.now() * 0.002 + index * 0.1);
            break;
          case 'cosmic':
            particle.x += particle.vx * Math.sin(Date.now() * 0.003 + index * 0.2);
            particle.y += particle.vy * Math.cos(Date.now() * 0.003 + index * 0.2);
            break;
        }

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `${particle.color}${Math.floor(particle.opacity * 255).toString(16).padStart(2, '0')}`;
        ctx.fill();

        // Draw connections for neural variant
        if (variant === 'neural') {
          particles.forEach((otherParticle, otherIndex) => {
            if (index !== otherIndex) {
              const distance = Math.sqrt(
                Math.pow(particle.x - otherParticle.x, 2) + 
                Math.pow(particle.y - otherParticle.y, 2)
              );
              if (distance < 100) {
                ctx.beginPath();
                ctx.moveTo(particle.x, particle.y);
                ctx.lineTo(otherParticle.x, otherParticle.y);
                ctx.strokeStyle = `${particle.color}${Math.floor((1 - distance / 100) * 0.3 * 255).toString(16).padStart(2, '0')}`;
                ctx.lineWidth = 1;
                ctx.stroke();
              }
            }
          });
        }
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [variant, intensity]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-0 ${className}`}
      style={{ opacity: intensity === 'low' ? 0.3 : intensity === 'medium' ? 0.6 : 0.8 }}
    />
  );
};

export default AnimatedBackground; 