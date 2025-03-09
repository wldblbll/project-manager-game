import React from "react";

interface TimelineProps {
  phases: string[];
  currentPhase: string;
  remainingTurns?: number;
  turnsPerPhase?: Record<string, number>;
}

const Timeline: React.FC<TimelineProps> = ({ 
  phases, 
  currentPhase, 
  remainingTurns = 0, 
  turnsPerPhase = {} 
}) => {
  return (
    <div className="bg-white shadow-md p-4 mb-4">
      <div className="container mx-auto">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-700">Chronologie du projet</h2>
          {remainingTurns !== undefined && turnsPerPhase && turnsPerPhase[currentPhase] !== undefined && (
            <div className="text-sm text-gray-500">
              Tours restants dans cette phase : <span className="font-bold">{remainingTurns}</span> / {turnsPerPhase[currentPhase]}
            </div>
          )}
        </div>
        
        <div className="mt-4 flex justify-between">
          {phases.map((phase, index) => {
            const isActive = phase === currentPhase;
            const isPast = phases.indexOf(currentPhase) > index;
            
            return (
              <div 
                key={phase} 
                className={`flex flex-col items-center flex-1 ${index > 0 ? 'border-l' : ''}`}
              >
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                    isActive 
                      ? 'bg-blue-500 text-white' 
                      : isPast 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {index + 1}
                </div>
                <span 
                  className={`text-sm ${
                    isActive 
                      ? 'font-bold text-blue-500' 
                      : isPast 
                        ? 'text-green-500' 
                        : 'text-gray-500'
                  }`}
                >
                  {phase}
                </span>
                {turnsPerPhase && turnsPerPhase[phase] !== undefined && (
                  <span className="text-xs text-gray-400 mt-1">
                    {turnsPerPhase[phase]} tours
                  </span>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="mt-2 flex justify-between">
          {phases.map((phase, index) => {
            const isActive = phase === currentPhase;
            const isPast = phases.indexOf(currentPhase) > index;
            
            return (
              <div 
                key={`line-${phase}`} 
                className={`flex-1 h-1 ${
                  index === phases.length - 1 
                    ? '' 
                    : isActive 
                      ? 'bg-gradient-to-r from-green-500 to-gray-200' 
                      : isPast 
                        ? 'bg-green-500' 
                        : 'bg-gray-200'
                }`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Timeline; 