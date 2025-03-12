import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import ProjectSelector from './ProjectSelector';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const CallToAction = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  
  // Fonction pour gérer le clic sur le bouton de démarrage
  const handleStartGame = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Vérifier si un projet est déjà sélectionné
    const storedProject = localStorage.getItem('selectedProject');
    
    if (storedProject) {
      // Si un projet est déjà sélectionné, naviguer vers la page de jeu
      setTimeout(() => {
        navigate('/game');
      }, 100);
    } else {
      // Sinon, afficher le sélecteur de projet
      setShowProjectSelector(true);
    }
  };
  
  // Fonction pour effacer le projet sélectionné
  const handleClearProject = () => {
    localStorage.removeItem('selectedProject');
    setShowProjectSelector(true);
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
              <button
                onClick={handleStartGame}
                className="rounded-full bg-white px-8 py-4 text-lg font-semibold text-purple-600 
                         shadow-lg hover:bg-purple-50 transition-all duration-300 
                         transform hover:scale-105 hover:shadow-xl mb-4 sm:mb-0"
                aria-label="Commencer le jeu"
              >
                Commencer l'Aventure 🚀
              </button>
              
              {/* Bouton pour changer de projet */}
              <button
                onClick={handleClearProject}
                className="rounded-full bg-transparent border border-white text-white px-6 py-3 text-sm font-medium
                         shadow-lg hover:bg-white/10 transition-all duration-300 
                         transform hover:scale-105 hover:shadow-xl"
                aria-label="Changer de projet"
              >
                Changer de projet 🔄
              </button>
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

export default CallToAction;
