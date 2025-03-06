
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

const Logo = ({ className, size = 'md', animated = true }: LogoProps) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const sizeClasses = {
    sm: 'text-xl md:text-2xl',
    md: 'text-2xl md:text-3xl',
    lg: 'text-3xl md:text-4xl'
  };

  return (
    <div className={cn(
      "flex items-center gap-2 font-bold tracking-tight transition-opacity",
      isLoaded ? "opacity-100" : "opacity-0",
      animated && "duration-500",
      sizeClasses[size],
      className
    )}>
      <span className="relative flex items-center justify-center">
        <span className={cn(
          "inline-block transform transition-transform", 
          animated && isLoaded && "animate-bounce-small"
        )}>
          🚀
        </span>
      </span>
      <div className="flex flex-col items-start leading-none">
        <span className={cn(
          "animated-gradient-text", 
          animated && isLoaded && "animate-slide-in-up"
        )}>
          Chef de Projet
        </span>
        <span className={cn(
          "text-sm font-light text-muted-foreground",
          animated && isLoaded && "animate-slide-in-up [animation-delay:100ms]"
        )}>
          Virtuel
        </span>
      </div>
    </div>
  );
};

export default Logo;
