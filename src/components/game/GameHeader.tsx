import React from "react";

interface GameHeaderProps {
  budget: number;
  time: number;
  valuePoints: number;
  currentPhase?: string;
  remainingTurns?: number;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  projectName?: string;
}

const GameHeader: React.FC<GameHeaderProps> = ({ 
  budget, 
  time, 
  valuePoints,
  currentPhase,
  remainingTurns,
  isFullScreen,
  onToggleFullScreen,
  projectName = "Project Management Game"
}) => {
  return (
    <div className="bg-white shadow-md p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-800">{projectName}</h1>
          {currentPhase && (
            <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-md">
              Phase: {currentPhase}
              {remainingTurns !== undefined && (
                <span className="ml-1 text-xs">({remainingTurns} tours restants)</span>
              )}
            </span>
          )}
        </div>
        
        <div className="flex space-x-6">
          <div className="flex flex-col items-center">
            <span className="text-sm text-gray-500">Budget</span>
            <span className="text-xl font-bold text-green-600">{budget} K€</span>
          </div>
          
          <div className="flex flex-col items-center">
            <span className="text-sm text-gray-500">Temps</span>
            <span className="text-xl font-bold text-blue-600">{time} mois</span>
          </div>
          
          <div className="flex flex-col items-center">
            <span className="text-sm text-gray-500">Points de valeur</span>
            <span className="text-xl font-bold text-purple-600">{valuePoints}</span>
          </div>
          
          {onToggleFullScreen && (
            <button 
              className="flex items-center justify-center p-2 rounded-md hover:bg-gray-100"
              onClick={onToggleFullScreen}
            >
              {isFullScreen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h.01M7 12h.01M11 12h.01M15 12h.01M19 12h.01M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2m8-20h2a2 2 0 012 2v2M20 16v2a2 2 0 01-2 2h-2" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L16 4m0 13V4m0 0L9 7" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameHeader; 