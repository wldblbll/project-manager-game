import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AnimatedText from './AnimatedText';
import GameLoader from './GameLoader';
import GameManager from '@/config/games';
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from '@/contexts/AuthContext';
import { AuthComponent } from './auth/AuthComponent';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const Hero = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [showGameSelector, setShowGameSelector] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<string>('ecovoyage');
  const isMobile = useIsMobile();

  // Effet pour fermer la modal d'auth et ouvrir le sélecteur de jeu après connexion
  useEffect(() => {
    if (session && showAuth) {
      setShowAuth(false);
      // Petit délai pour une meilleure UX
      setTimeout(() => {
        setShowGameSelector(true);
      }, 300);
    }
  }, [session, showAuth]);
  
  // Fonction pour gérer le clic sur le bouton de démarrage
  const handleStartGame = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Vérifier si l'utilisateur est connecté
    if (!session) {
      setShowAuth(true);
      return;
    }
    
    // Si connecté, afficher le sélecteur de jeux
    setShowGameSelector(true);
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
    <div className="relative min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-64 h-64 bg-white/10 rounded-full -top-20 -left-20 animate-blob"></div>
        <div className="absolute w-64 h-64 bg-white/10 rounded-full top-1/2 left-1/3 animate-blob animation-delay-2000"></div>
        <div className="absolute w-64 h-64 bg-white/10 rounded-full bottom-20 right-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 text-center px-4">
        {/* Logo and Title Container */}
        <div className="flex flex-col items-center mb-8 group">
          <img 
            src="/logo.png" 
            alt="PM Cards Logo" 
            className="w-24 h-24 mb-4 hover:animate-spin transition-all duration-300"
          />
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 transform transition-all duration-500 group-hover:scale-110">
            PM Cards
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto mb-8 transform transition-all duration-500 group-hover:translate-y-2">
            Apprenez la gestion de projet en jouant !
          </p>
        </div>

        {/* CTA Button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={handleStartGame}
            className="bg-white text-indigo-600 px-8 py-4 rounded-full text-lg font-semibold 
                     shadow-lg hover:shadow-xl transform transition-all duration-300 
                     hover:scale-105 hover:bg-indigo-50"
          >
            Commencer à jouer 🎮
          </button>
        </div>
      </div>
      
      {/* Project Selector Modal */}
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

      {/* Authentication Modal */}
      <Dialog open={showAuth} onOpenChange={setShowAuth}>
        <DialogContent className="sm:max-w-[600px] p-0 gap-0 border-0 bg-transparent shadow-none">
          <div className="relative">
            <AuthComponent redirectTo={window.location.href} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Hero;
