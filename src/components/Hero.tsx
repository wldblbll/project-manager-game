import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AnimatedText from './AnimatedText';
import ProjectSelector from './ProjectSelector';
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const Hero = () => {
  const navigate = useNavigate();
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const isMobile = useIsMobile();
  
  // Fonction pour gérer le clic sur le bouton de démarrage
  const handleStartGame = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log("Bouton de démarrage cliqué");
    
    // Toujours afficher le sélecteur de projet quand on clique sur "Commencer à jouer"
    setShowProjectSelector(true);
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
      <Dialog open={showProjectSelector} onOpenChange={setShowProjectSelector}>
        <DialogContent className="sm:max-w-[800px] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-2xl font-bold text-center">Sélection du projet</DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <ProjectSelector 
              onClose={() => setShowProjectSelector(false)}
              standalone={true}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Hero;
