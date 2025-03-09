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
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 4a1 1 0 0 0-1 1v4a1 1 0 0 1-2 0V5a3 3 0 0 1 3-3h4a1 1 0 0 1 0 2H5zM14 4a1 1 0 0 1 1 1v4a1 1 0 1 0 2 0V5a3 3 0 0 0-3-3h-4a1 1 0 1 0 0 2h4z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M5 14a1 1 0 0 1-1-1v-4a1 1 0 1 0-2 0v4a3 3 0 0 0 3 3h4a1 1 0 1 0 0-2H5zm9 0a1 1 0 0 0 1-1v-4a1 1 0 1 1 2 0v4a3 3 0 0 1-3 3h-4a1 1 0 1 1 0-2h4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 4a1 1 0 0 1 1-1h4a1 1 0 0 1 0 2H6.414l2.293 2.293a1 1 0 1 1-1.414 1.414L5 6.414V8a1 1 0 0 1-2 0V4zm9 1a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 1 1-2 0V6.414l-2.293 2.293a1 1 0 1 1-1.414-1.414L14.586 5H13a1 1 0 0 1-1-1zm-9 9a1 1 0 0 1 1 1v1.586l2.293-2.293a1 1 0 0 1 1.414 1.414L5.414 16H7a1 1 0 0 1 0 2H3a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1zm13 0a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1 0-2h1.586l-2.293-2.293a1 1 0 0 1 1.414-1.414L15 15.586V14a1 1 0 0 1 1-1z" clipRule="evenodd" />
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