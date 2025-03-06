
import { useState } from 'react';
import { cn } from '@/lib/utils';

export type CardType = 'event' | 'artifact' | 'feature' | 'situation';

interface GameCardProps {
  id: string;
  title: string;
  description: string;
  type: CardType;
  image?: string;
  flippable?: boolean;
  className?: string;
  onClick?: () => void;
  effects?: Record<string, number>;
  phase?: string;
  domain?: string;
}

const GameCard = ({
  id,
  title,
  description,
  type,
  image,
  flippable = false,
  className,
  onClick,
  effects,
  phase,
  domain
}: GameCardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleClick = () => {
    if (flippable) {
      setIsFlipped(!isFlipped);
    }
    
    if (onClick) {
      onClick();
    }
  };

  const getCardBgColor = () => {
    switch (type) {
      case 'event':
        return 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200';
      case 'artifact':
        return 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200';
      case 'feature':
        return 'bg-gradient-to-br from-green-50 to-green-100 border-green-200';
      case 'situation':
        return 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200';
      default:
        return 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200';
    }
  };

  const getCardTypeLabel = () => {
    switch (type) {
      case 'event':
        return 'Événement';
      case 'artifact':
        return 'Artefact';
      case 'feature':
        return 'Fonctionnalité';
      case 'situation':
        return 'Situation';
      default:
        return type;
    }
  };

  return (
    <div 
      className={cn(
        "relative perspective-1000 w-full h-full",
        { "cursor-pointer": flippable || onClick },
        className
      )}
      onClick={handleClick}
    >
      <div 
        className={cn(
          "w-full h-full duration-500 card-rotation",
          isFlipped && "rotate-y-180"
        )}
      >
        {/* Card Front */}
        <div 
          className={cn(
            "card-front p-4 border rounded-xl shadow-md card-hover",
            getCardBgColor()
          )}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-lg text-gray-800">{title}</h3>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/70 text-gray-700">
                {getCardTypeLabel()}
              </span>
            </div>

            <div className="text-sm text-gray-600 mb-3">{description}</div>

            {effects && (
              <div className="mt-auto grid grid-cols-3 gap-2 text-xs">
                {Object.entries(effects).map(([key, value]) => (
                  <div 
                    key={key} 
                    className={cn(
                      "px-2 py-1 rounded-md text-center",
                      value > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    )}
                  >
                    {key}: {value > 0 ? `+${value}` : value}
                  </div>
                ))}
              </div>
            )}

            {(phase || domain) && (
              <div className="mt-auto flex flex-wrap gap-1 text-xs">
                {phase && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                    {phase}
                  </span>
                )}
                {domain && (
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full">
                    {domain}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Card Back */}
        {flippable && (
          <div className="card-back p-4 border rounded-xl shadow-md bg-gradient-to-br from-gray-800 to-gray-900 text-white">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <span className="text-5xl">🚀</span>
                <h3 className="mt-2 text-lg font-semibold">Chef de Projet Virtuel</h3>
                <p className="mt-1 text-xs opacity-70">#{id}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameCard;
