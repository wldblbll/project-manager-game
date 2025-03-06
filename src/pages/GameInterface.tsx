
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '@/components/Logo';
import AnimatedButton from '@/components/AnimatedButton';
import PhaseIndicator, { GamePhase } from '@/components/PhaseIndicator';
import GameCard from '@/components/GameCard';
import WBSBoard from '@/components/WBSBoard';
import { cn } from '@/lib/utils';
import events from '@/data/events.json';
import artifacts from '@/data/artifacts.json';

interface GameState {
  currentPhase: GamePhase;
  turn: number;
  budget: number;
  time: number;
  value: number;
  acquiredArtifacts: string[];
  eventsHistory: string[];
  wbsNodes: any[];
}

const GameInterface = () => {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<GameState>({
    currentPhase: 'initiation',
    turn: 1,
    budget: 100,
    time: 15,
    value: 0,
    acquiredArtifacts: [],
    eventsHistory: [],
    wbsNodes: []
  });

  const [showEndTurnModal, setShowEndTurnModal] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<(typeof events)[0] | null>(null);
  const [availableArtifacts, setAvailableArtifacts] = useState<(typeof artifacts)[0][]>([]);

  // Initialize game on first load
  useEffect(() => {
    // Filter artifacts for current phase
    const phaseArtifacts = artifacts.filter(
      artifact => artifact.phase === gameState.currentPhase && 
                !gameState.acquiredArtifacts.includes(artifact.id)
    );
    setAvailableArtifacts(phaseArtifacts);
    
    // Show tutorial on first turn
    if (gameState.turn === 1) {
      setShowTutorial(true);
    }
  }, [gameState.currentPhase, gameState.turn]);

  const drawEvent = () => {
    // Get a random event
    const randomIndex = Math.floor(Math.random() * events.length);
    const event = events[randomIndex];
    setCurrentEvent(event);
    
    // Apply event effects
    if (event.effect) {
      setGameState(prev => ({
        ...prev,
        budget: prev.budget + (event.effect.budget || 0),
        time: prev.time + (event.effect.time || 0),
        value: prev.value + (event.effect.value || 0),
        eventsHistory: [...prev.eventsHistory, event.id]
      }));
    }
  };

  const acquireArtifact = (artifact: (typeof artifacts)[0]) => {
    // Check if player has enough resources
    if (
      gameState.budget >= artifact.cost.budget &&
      gameState.time >= artifact.cost.time
    ) {
      // Apply costs and add artifact
      setGameState(prev => ({
        ...prev,
        budget: prev.budget - artifact.cost.budget,
        time: prev.time - artifact.cost.time,
        value: prev.value + artifact.value,
        acquiredArtifacts: [...prev.acquiredArtifacts, artifact.id]
      }));
      
      // Remove artifact from available ones
      setAvailableArtifacts(prev => prev.filter(a => a.id !== artifact.id));
    }
  };

  const endTurn = () => {
    setShowEndTurnModal(false);
    
    // Progress to next phase if conditions are met
    const phaseArtifactsCount = artifacts.filter(
      a => a.phase === gameState.currentPhase && gameState.acquiredArtifacts.includes(a.id)
    ).length;
    
    let nextPhase: GamePhase = gameState.currentPhase;
    if (phaseArtifactsCount >= 1) { // Simplified condition for demo
      // Determine next phase
      if (gameState.currentPhase === 'initiation') nextPhase = 'planning';
      else if (gameState.currentPhase === 'planning') nextPhase = 'execution';
      else if (gameState.currentPhase === 'execution') nextPhase = 'monitoring';
      else if (gameState.currentPhase === 'monitoring') nextPhase = 'closing';
    }
    
    // Update game state for next turn
    setGameState(prev => ({
      ...prev,
      turn: prev.turn + 1,
      currentPhase: nextPhase
    }));
    
    // Draw a new event for next turn
    drawEvent();
  };

  const resourceDisplay = (label: string, value: number, icon: string, color: string) => (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${color}`}>
      <span className="text-lg">{icon}</span>
      <div>
        <div className="text-xs font-medium opacity-80">{label}</div>
        <div className="text-lg font-semibold">{value}</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-blue-50 to-white">
      <div className="container px-4 py-4">
        {/* Game Header */}
        <header className="w-full flex justify-between items-center mb-6">
          <Logo size="sm" animated={false} />
          
          <div className="flex items-center gap-3">
            {resourceDisplay('Budget', gameState.budget, '💰', 'bg-green-100 text-green-800')}
            {resourceDisplay('Temps', gameState.time, '⏱️', 'bg-blue-100 text-blue-800')}
            {resourceDisplay('Valeur', gameState.value, '✨', 'bg-purple-100 text-purple-800')}
          </div>
          
          <div className="flex items-center gap-2">
            <AnimatedButton 
              variant="outline" 
              size="sm"
              onClick={() => setShowTutorial(true)}
            >
              Aide
            </AnimatedButton>
            <AnimatedButton 
              variant="premium"
              size="sm"
              onClick={() => setShowEndTurnModal(true)}
            >
              Fin du tour
            </AnimatedButton>
          </div>
        </header>

        {/* Game Dashboard */}
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Current Status */}
          <div className="lg:col-span-1 space-y-6">
            <div className="glassmorphism rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Tour {gameState.turn}</h2>
                <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
                  Phase: {gameState.currentPhase}
                </span>
              </div>
              
              <PhaseIndicator currentPhase={gameState.currentPhase} />
              
              {currentEvent && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">Événement actuel</h3>
                  <div className="h-64">
                    <GameCard
                      id={currentEvent.id}
                      title={currentEvent.title}
                      description={currentEvent.description}
                      type="event"
                      effects={currentEvent.effect}
                      phase={currentEvent.phase}
                      domain={currentEvent.domain}
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="glassmorphism rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">Artefacts acquis</h2>
              {gameState.acquiredArtifacts.length > 0 ? (
                <div className="space-y-3">
                  {gameState.acquiredArtifacts.map(artifactId => {
                    const artifact = artifacts.find(a => a.id === artifactId);
                    return artifact ? (
                      <div key={artifactId} className="flex items-center p-3 bg-white rounded-lg shadow-sm">
                        <div className="w-10 h-10 flex items-center justify-center bg-blue-100 text-blue-800 rounded-full mr-3">
                          📄
                        </div>
                        <div>
                          <h4 className="font-medium">{artifact.name}</h4>
                          <p className="text-xs text-gray-500">{artifact.phase} • {artifact.domain}</p>
                        </div>
                      </div>
                    ) : null;
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Aucun artefact acquis</p>
                  <p className="text-sm mt-1">Acquérez des artefacts pour progresser</p>
                </div>
              )}
            </div>
          </div>

          {/* Middle Column - Main Board */}
          <div className="lg:col-span-2 space-y-6">
            <WBSBoard className="min-h-[300px]" />
            
            <div className="glassmorphism rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">Artefacts disponibles</h2>
              
              {availableArtifacts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableArtifacts.map(artifact => (
                    <div key={artifact.id} className="h-64">
                      <GameCard
                        id={artifact.id}
                        title={artifact.name}
                        description={artifact.description}
                        type="artifact"
                        effects={artifact.cost}
                        phase={artifact.phase}
                        domain={artifact.domain}
                        onClick={() => acquireArtifact(artifact)}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>Aucun artefact disponible dans cette phase</p>
                  <p className="text-sm mt-1">Passez à la phase suivante pour débloquer de nouveaux artefacts</p>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* End Turn Modal */}
        {showEndTurnModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full animate-scale-in">
              <h2 className="text-xl font-bold mb-4">Fin du tour {gameState.turn}</h2>
              <p className="mb-6">Êtes-vous sûr de vouloir terminer ce tour ?</p>
              
              <div className="flex justify-end space-x-3">
                <AnimatedButton 
                  variant="ghost" 
                  onClick={() => setShowEndTurnModal(false)}
                >
                  Annuler
                </AnimatedButton>
                <AnimatedButton 
                  variant="premium" 
                  onClick={endTurn}
                >
                  Terminer le tour
                </AnimatedButton>
              </div>
            </div>
          </div>
        )}

        {/* Tutorial Modal */}
        {showTutorial && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-lg w-full animate-scale-in">
              <h2 className="text-xl font-bold mb-4">Bienvenue dans Chef de Projet Virtuel</h2>
              
              <div className="space-y-4 mb-6">
                <p>Vous êtes maintenant en charge d'un projet. Votre objectif est de le mener à bien à travers les 5 phases du PMI.</p>
                
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium mb-2">Comment jouer :</h3>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>Consultez l'événement du tour actuel et gérez son impact</li>
                    <li>Acquérez des artefacts pour avancer dans votre projet</li>
                    <li>Développez votre Structure de Découpage (WBS)</li>
                    <li>Terminez votre tour quand vous êtes prêt</li>
                  </ol>
                </div>
                
                <p>N'oubliez pas de surveiller vos ressources : budget, temps, et valeur produite !</p>
              </div>
              
              <div className="flex justify-end">
                <AnimatedButton 
                  variant="premium" 
                  onClick={() => setShowTutorial(false)}
                >
                  J'ai compris, c'est parti !
                </AnimatedButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameInterface;
