import React, { useEffect } from "react";

interface GameHeaderProps {
  budget: number;
  time: number;
  valuePoints: number;
  currentPhase?: string;
  remainingTurns?: number;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  projectName?: string;
  onMilestoneStep?: () => void;
}

const GameHeader: React.FC<GameHeaderProps> = ({ 
  budget, 
  time, 
  valuePoints,
  currentPhase,
  remainingTurns,
  isFullScreen,
  onToggleFullScreen,
  projectName = "PM Cards",
  onMilestoneStep
}) => {
  // Ajouter dynamiquement les keyframes au document
  useEffect(() => {
    // Vérifier si le style existe déjà
    const styleId = 'pulse-attention-keyframes';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        @keyframes pulseAttention {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(250, 204, 21, 0.7); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(250, 204, 21, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(250, 204, 21, 0); }
        }
        .pulse-attention-button {
          animation: pulseAttention 1.5s infinite;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-4 shadow-lg">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Logo et titre avec animation */}
          <div className="flex items-center space-x-3">
            <img 
              src="/logo.png" 
              alt="PM Cards Logo" 
              className="h-10 w-10 hover:animate-spin transition-all duration-300" 
            />
            <h1 className="text-2xl font-bold text-white hover:scale-110 transition-transform duration-300 cursor-default">
              {projectName}
            </h1>
          </div>

          {/* Phase actuelle */}
          {currentPhase && (
            <div className="flex items-center space-x-2">
              <span className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium">
                Phase: {currentPhase}
                {remainingTurns !== undefined && (
                  <span className="ml-2 bg-white/10 px-2 py-1 rounded-full">
                    {remainingTurns} tours 🎲
                  </span>
                )}
              </span>
            </div>
          )}

          {/* Stats du jeu */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <span className="text-yellow-300">💰</span>
              <span className="text-white font-medium">{budget}</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <span className="text-blue-300">⏱️</span>
              <span className="text-white font-medium">{time}</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <span className="text-green-300">⭐</span>
              <span className="text-white font-medium">{valuePoints}</span>
            </div>
          </div>

          {/* Bouton plein écran */}
          {onToggleFullScreen && (
            <button
              onClick={onToggleFullScreen}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white p-2 rounded-full transition-all duration-200 transform hover:scale-105"
            >
              {isFullScreen ? "⬆️" : "⤢"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameHeader; 