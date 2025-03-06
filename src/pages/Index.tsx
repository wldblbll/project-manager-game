
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '@/components/Logo';
import AnimatedButton from '@/components/AnimatedButton';

const Index = () => {
  const navigate = useNavigate();
  const [showRules, setShowRules] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationComplete(true);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const handleNewGame = () => {
    navigate('/setup');
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-16">
        <header className="w-full flex justify-center mb-12">
          <Logo size="lg" />
        </header>

        <main className="flex flex-col items-center justify-center">
          <div 
            className={`w-full max-w-3xl glassmorphism rounded-2xl p-8 md:p-12 mb-12 transition-all duration-700 ${
              animationComplete 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-8'
            }`}
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center animated-gradient-text">
              Devenez un Chef de Projet d'Exception
            </h1>
            
            <p className="text-lg text-center text-gray-700 mb-8">
              Maîtrisez l'art de la gestion de projet à travers une simulation immersive basée sur les méthodologies PMI et le cycle en V.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <AnimatedButton 
                variant="premium" 
                onClick={handleNewGame}
                className="text-lg font-medium"
              >
                Nouvelle Partie
              </AnimatedButton>
              
              <AnimatedButton 
                variant="outline"
                onClick={() => setShowRules(!showRules)}
                className="text-lg"
              >
                {showRules ? 'Masquer les règles' : 'Voir les règles'}
              </AnimatedButton>
            </div>
          </div>

          {showRules && (
            <div className="w-full max-w-3xl glassmorphism rounded-2xl p-8 animate-fade-in">
              <h2 className="text-2xl font-bold mb-6">Règles du Jeu</h2>
              
              <div className="space-y-6 text-gray-700">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Objectif</h3>
                  <p>Mener votre projet à son terme en respectant les contraintes de budget, de temps et en maximisant la valeur produite.</p>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold mb-2">Phases du jeu</h3>
                  <p>Le jeu suit les 5 phases de la méthodologie PMI :</p>
                  <ol className="list-decimal pl-5 mt-2 space-y-1">
                    <li><span className="font-medium">Initiation</span> - Définir les objectifs et le périmètre</li>
                    <li><span className="font-medium">Planification</span> - Élaborer le plan de management</li>
                    <li><span className="font-medium">Exécution</span> - Réaliser les activités prévues</li>
                    <li><span className="font-medium">Suivi et contrôle</span> - Suivre, examiner et réguler</li>
                    <li><span className="font-medium">Clôture</span> - Finaliser toutes les activités</li>
                  </ol>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold mb-2">Tour de jeu</h3>
                  <p>Chaque tour comporte 5 étapes :</p>
                  <ol className="list-decimal pl-5 mt-2 space-y-1">
                    <li>Tirage d'une carte événement</li>
                    <li>Phase d'acquisition d'artefacts</li>
                    <li>Sélection d'actions principales</li>
                    <li>Vérification de jalon (si applicable)</li>
                    <li>Bilan du tour</li>
                  </ol>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold mb-2">Ressources</h3>
                  <p>Vous devez gérer trois ressources principales :</p>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li><span className="font-medium">Budget</span> - Représente les ressources financières</li>
                    <li><span className="font-medium">Temps</span> - Représente les délais disponibles</li>
                    <li><span className="font-medium">Valeur</span> - Représente la qualité et l'utilité du livrable</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </main>

        <footer className="mt-12 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Chef de Projet Virtuel - Un jeu éducatif sur la gestion de projet</p>
          <p className="mt-1">Basé sur les méthodologies PMI et le cycle en V</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
