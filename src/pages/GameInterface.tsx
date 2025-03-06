
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '@/components/Logo';
import AnimatedButton from '@/components/AnimatedButton';
import GameBoard from '@/components/GameBoard';

const GameInterface = () => {
  const navigate = useNavigate();
  const [currentTurn, setCurrentTurn] = useState(1);
  const [gamePhase, setGamePhase] = useState<'initiation' | 'planning' | 'execution' | 'monitoring' | 'closing'>('initiation');
  const [resources, setResources] = useState({
    budget: 100,
    time: 15,
    value: 0
  });

  // In a real implementation, we would load the game state from context or state management
  
  const handleEndTurn = () => {
    setCurrentTurn(prev => prev + 1);
    
    // Example of phase progression (would be more complex in real implementation)
    if (currentTurn === 3) {
      setGamePhase('planning');
    } else if (currentTurn === 7) {
      setGamePhase('execution');
    } else if (currentTurn === 11) {
      setGamePhase('monitoring');
    } else if (currentTurn === 15) {
      setGamePhase('closing');
    }
  };
  
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-blue-50 to-white flex flex-col">
      <header className="w-full flex justify-between items-center px-6 py-4 border-b bg-white">
        <div className="flex items-center gap-4">
          <Logo size="sm" animated={false} />
          <div className="h-6 border-l border-gray-200" />
          <div className="text-sm text-gray-600">Tour {currentTurn}</div>
        </div>
        
        <div className="flex items-center gap-2">
          <AnimatedButton variant="outline" onClick={() => navigate('/')}>
            Quitter
          </AnimatedButton>
          <AnimatedButton variant="premium" onClick={handleEndTurn}>
            Fin de tour
          </AnimatedButton>
        </div>
      </header>
      
      <main className="flex-1 p-4 overflow-auto">
        <GameBoard 
          phase={gamePhase} 
          budget={resources.budget} 
          time={resources.time} 
          value={resources.value}
        />
      </main>
    </div>
  );
};

export default GameInterface;
