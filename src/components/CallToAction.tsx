import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import GameLoader from './GameLoader';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import GameManager from "@/config/games";

const CallToAction = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [showGameSelector, setShowGameSelector] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<string>('ecovoyage');
  
  // Vérifier si un jeu est déjà sélectionné
  const storedGameId = localStorage.getItem('selectedGameId');
  const hasSelectedGame = storedGameId && GameManager.getGame(storedGameId);
  
  // Fonction pour gérer le clic sur le bouton de démarrage
  const handleStartGame = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Afficher le sélecteur de jeux pour laisser le choix à l'utilisateur
    setShowGameSelector(true);
  };
  
  // Fonction pour continuer avec le jeu déjà sélectionné
  const handleContinueGame = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/game');
  };
  
  // Fonction pour gérer la sélection d'un jeu
  const handleGameSelected = (gameId: string) => {
    setSelectedGameId(gameId);
    localStorage.setItem('selectedGameId', gameId);
    
    // Sauvegarder les jeux personnalisés
    GameManager.saveCustomGamesToStorage();
    
    // Fermer le sélecteur et naviguer vers le jeu
    setShowGameSelector(false);
    navigate('/game');
  };
  
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-red-500 to-purple-500">
      <div className="mx-auto max-w-7xl py-24 px-6 sm:py-32 lg:px-8">
        <div className="relative isolate px-6 py-12 text-center sm:px-16">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Prêt à devenir un
              <br />
              Super Chef de Projet ? 🦸‍♂️
            </h2>
            
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-white/80">
              Lance-toi dans l'aventure et apprends la gestion de projet 
              en relevant des défis passionnants !
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-x-6">
              {hasSelectedGame ? (
                <>
                  <button
                    onClick={handleContinueGame}
                    className="rounded-full bg-white px-8 py-4 text-lg font-semibold text-purple-600 
                             shadow-lg hover:bg-purple-50 transition-all duration-300 
                             transform hover:scale-105 hover:shadow-xl mb-4 sm:mb-0"
                    aria-label="Continuer le jeu"
                  >
                    Continuer l'Aventure 🚀
                  </button>
                  
                  <button
                    onClick={handleStartGame}
                    className="rounded-full bg-transparent border border-white text-white px-6 py-3 text-sm font-medium
                             shadow-lg hover:bg-white/10 transition-all duration-300 
                             transform hover:scale-105 hover:shadow-xl"
                    aria-label="Changer de jeu"
                  >
                    Changer de jeu 🔄
                  </button>
                </>
              ) : (
                <button
                  onClick={handleStartGame}
                  className="rounded-full bg-white px-8 py-4 text-lg font-semibold text-purple-600 
                           shadow-lg hover:bg-purple-50 transition-all duration-300 
                           transform hover:scale-105 hover:shadow-xl mb-4 sm:mb-0"
                  aria-label="Commencer le jeu"
                >
                  Commencer l'Aventure 🚀
                </button>
              )}
            </div>

            <div className="mt-8 animate-bounce">
              <span className="text-4xl">⬇️</span>
            </div>
          </div>

          {/* Animated background elements */}
          <div className="absolute -top-4 -left-4 -right-4 -bottom-4 bg-gradient-to-r from-purple-500/30 to-pink-500/30 blur-3xl" />
          <div className="absolute inset-0">
            <div className="h-full w-full bg-white/5 backdrop-blur-sm" />
          </div>
        </div>
      </div>
      
      {/* Game Selector Modal */}
      <Dialog open={showGameSelector} onOpenChange={setShowGameSelector}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0 p-6 pb-0">
            <DialogTitle className="text-2xl font-bold text-center">Sélection du jeu</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6 modal-scroll">
            <GameLoader 
              onGameSelected={handleGameSelected}
              selectedGameId={selectedGameId}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CallToAction;
