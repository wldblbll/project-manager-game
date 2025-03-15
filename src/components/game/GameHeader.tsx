import React, { useEffect, useState, useRef } from "react";
import { MinimizeIcon, MaximizeIcon } from "@tabler/icons-react";

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
  budgetChange?: number | null;
  timeChange?: number | null;
  valueChange?: number | null;
  onResetGame?: () => void;
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
  onMilestoneStep,
  budgetChange,
  timeChange,
  valueChange,
  onResetGame
}) => {
  // Références pour les compteurs
  const budgetRef = useRef<HTMLSpanElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const valueRef = useRef<HTMLSpanElement>(null);

  // Effet pour animer les compteurs lorsqu'ils changent
  useEffect(() => {
    if (budgetChange !== null && budgetChange !== 0 && budgetRef.current) {
      budgetRef.current.classList.remove('counter-change');
      void budgetRef.current.offsetWidth; // Force reflow
      budgetRef.current.classList.add('counter-change');
    }
  }, [budget, budgetChange]);

  useEffect(() => {
    if (timeChange !== null && timeChange !== 0 && timeRef.current) {
      timeRef.current.classList.remove('counter-change');
      void timeRef.current.offsetWidth; // Force reflow
      timeRef.current.classList.add('counter-change');
    }
  }, [time, timeChange]);

  useEffect(() => {
    if (valueChange !== null && valueChange !== 0 && valueRef.current) {
      valueRef.current.classList.remove('counter-change');
      void valueRef.current.offsetWidth; // Force reflow
      valueRef.current.classList.add('counter-change');
    }
  }, [valuePoints, valueChange]);

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
        @keyframes valueChange {
          0% { transform: translateY(0); opacity: 1; }
          50% { transform: translateY(-10px); opacity: 0.5; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .value-change {
          animation: valueChange 1s ease-out;
        }
        @keyframes counterChange {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        .counter-change {
          animation: counterChange 0.5s ease-out;
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
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full relative">
              <span className="text-yellow-300">💰</span>
              <span 
                ref={budgetRef} 
                className={`text-white font-medium transition-all duration-300 ${budgetChange && budgetChange < 0 ? 'text-green-300' : budgetChange && budgetChange > 0 ? 'text-red-300' : ''}`}
              >
                {budget}
              </span>
              {budgetChange !== null && budgetChange !== 0 && (
                <span className={`absolute -top-6 left-1/2 transform -translate-x-1/2 text-sm font-bold value-change ${
                  budgetChange > 0 ? 'text-red-500' : 'text-green-500'
                }`}>
                  {budgetChange > 0 ? '+' : ''}{budgetChange}K€
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full relative">
              <span className="text-blue-300">⏱️</span>
              <span 
                ref={timeRef} 
                className={`text-white font-medium transition-all duration-300 ${timeChange && timeChange < 0 ? 'text-green-300' : timeChange && timeChange > 0 ? 'text-red-300' : ''}`}
              >
                {time}
              </span>
              {timeChange !== null && timeChange !== 0 && (
                <span className={`absolute -top-6 left-1/2 transform -translate-x-1/2 text-sm font-bold value-change ${
                  timeChange > 0 ? 'text-red-500' : 'text-green-500'
                }`}>
                  {timeChange > 0 ? '+' : ''}{timeChange} jours
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full relative">
              <span className="text-green-300">⭐</span>
              <span 
                ref={valueRef} 
                className={`text-white font-medium transition-all duration-300 ${valueChange && valueChange > 0 ? 'text-green-300' : ''}`}
              >
                {valuePoints}
              </span>
              {valueChange !== null && valueChange !== 0 && (
                <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-sm font-bold text-green-500 value-change">
                  +{valueChange} points
                </span>
              )}
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

          {/* Boutons d'action */}
          <div className="flex items-center space-x-4">
            {remainingTurns === 0 && (
              <button
                onClick={onMilestoneStep}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
              >
                Passer à l'étape jalon
              </button>
            )}
            {onResetGame && (
              <button
                onClick={() => {
                  if (window.confirm("Êtes-vous sûr de vouloir commencer une nouvelle partie ? Tout progrès non sauvegardé sera perdu.")) {
                    onResetGame();
                  }
                }}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105"
              >
                Nouvelle partie
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameHeader; 