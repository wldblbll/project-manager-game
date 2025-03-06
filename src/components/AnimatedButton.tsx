
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'ghost' | 'premium' | '3d';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  withRipple?: boolean;
}

const AnimatedButton = ({
  children,
  className,
  variant = 'default',
  size = 'md',
  fullWidth = false,
  withRipple = true,
  ...props
}: AnimatedButtonProps) => {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const handleRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!withRipple) return;
    
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const id = Date.now();
    setRipples([...ripples, { id, x, y }]);
    
    setTimeout(() => {
      setRipples((prev) => prev.filter((ripple) => ripple.id !== id));
    }, 600);
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };

  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    premium: 'btn-premium',
    '3d': 'btn-3d'
  };

  return (
    <button
      className={cn(
        'relative overflow-hidden inline-flex items-center justify-center rounded-lg font-medium transition-all duration-300 select-none',
        sizeClasses[size],
        variantClasses[variant],
        fullWidth && 'w-full',
        className
      )}
      onClick={handleRipple}
      {...props}
    >
      <span className="relative z-10">{children}</span>

      {withRipple && ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute z-0 bg-white/20 rounded-full animate-ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: '100px',
            height: '100px',
            transform: 'translate(-50%, -50%) scale(0)',
            animation: 'ripple 0.6s linear forwards',
          }}
        />
      ))}

      <style>
        {`
          @keyframes ripple {
            to {
              transform: translate(-50%, -50%) scale(3);
              opacity: 0;
            }
          }
        `}
      </style>
    </button>
  );
};

export default AnimatedButton;
