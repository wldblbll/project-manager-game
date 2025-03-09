
import React, { useEffect, useRef } from 'react';
import { cn } from "@/lib/utils";

interface AnimatedTextProps {
  text: string;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  once?: boolean;
  delayMultiplier?: number;
}

const AnimatedText = ({
  text,
  as: Component = 'div',
  className,
  once = true,
  delayMultiplier = 0.1
}: AnimatedTextProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const characters = text.split('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement;
            const letters = target.querySelectorAll('span');
            
            letters.forEach((letter, i) => {
              setTimeout(() => {
                letter.classList.add('opacity-100', 'translate-y-0');
              }, i * (delayMultiplier * 1000));
            });
            
            if (once) {
              observer.unobserve(target);
            }
          } else if (!once) {
            const target = entry.target as HTMLElement;
            const letters = target.querySelectorAll('span');
            
            letters.forEach((letter) => {
              letter.classList.remove('opacity-100', 'translate-y-0');
              letter.classList.add('opacity-0', 'translate-y-[0.5em]');
            });
          }
        });
      },
      { threshold: 0.5 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [once, delayMultiplier, text]);

  return (
    <Component
      className={cn(className)}
      ref={containerRef}
    >
      {characters.map((char, i) => (
        <span 
          key={`${char}-${i}`}
          className="inline-block opacity-0 translate-y-[0.5em] transition-all duration-300 ease-out"
          style={{ transitionDelay: `${i * delayMultiplier}s` }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </Component>
  );
};

export default AnimatedText;
