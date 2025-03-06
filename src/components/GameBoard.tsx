
import { useState } from 'react';
import { cn } from '@/lib/utils';
import PhaseIndicator from './PhaseIndicator';
import GameCard from './GameCard';
import WBSBoard from './WBSBoard';

interface GameBoardProps {
  className?: string;
  phase: 'initiation' | 'planning' | 'execution' | 'monitoring' | 'closing';
  budget: number;
  time: number;
  value: number;
}

const GameBoard = ({ 
  className, 
  phase = 'initiation',
  budget = 100,
  time = 15,
  value = 0
}: GameBoardProps) => {
  const [selectedTab, setSelectedTab] = useState<'wbs' | 'planning' | 'risks'>('wbs');

  return (
    <div className={cn(
      "w-full h-full flex flex-col gap-4 p-4",
      className
    )}>
      {/* Header with phase indicator and resources */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-4 bg-white rounded-xl border shadow-sm">
        <PhaseIndicator currentPhase={phase} />
        
        <div className="flex gap-6">
          <ResourceIndicator icon="💰" label="Budget" value={budget} />
          <ResourceIndicator icon="⏱️" label="Temps" value={time} />
          <ResourceIndicator icon="⭐" label="Valeur" value={value} />
        </div>
      </div>

      {/* Main game area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column - Artifacts and Actions */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="bg-white rounded-xl border shadow-sm p-4 flex-1">
            <h3 className="text-lg font-medium mb-3">Artefacts</h3>
            <div className="space-y-2">
              <GameCard
                title="Charte de projet"
                description="Document qui autorise formellement le projet"
                icon="📄"
                variant="artifact"
                status="available"
              />
              <GameCard
                title="Registre des parties prenantes"
                description="Liste des personnes impliquées dans le projet"
                icon="👥"
                variant="artifact"
                status="locked"
              />
            </div>
          </div>
          
          <div className="bg-white rounded-xl border shadow-sm p-4 flex-1">
            <h3 className="text-lg font-medium mb-3">Actions</h3>
            <div className="space-y-2">
              <GameCard
                title="Acquisition d'artefact"
                description="Investir du temps et du budget pour obtenir un artefact"
                icon="🛒"
                variant="action"
                onClick={() => console.log('Acquisition action')}
              />
              <GameCard
                title="Planifier une tâche"
                description="Ajouter une tâche au planning du projet"
                icon="📅"
                variant="action"
                onClick={() => console.log('Planning action')}
              />
            </div>
          </div>
        </div>

        {/* Center and right - Main board (WBS, Planning, Risks) */}
        <div className="lg:col-span-2 bg-white rounded-xl border shadow-sm p-4 flex flex-col">
          <div className="flex gap-2 mb-4">
            <TabButton 
              active={selectedTab === 'wbs'} 
              onClick={() => setSelectedTab('wbs')}
            >
              Structure WBS
            </TabButton>
            <TabButton 
              active={selectedTab === 'planning'} 
              onClick={() => setSelectedTab('planning')}
            >
              Planning
            </TabButton>
            <TabButton 
              active={selectedTab === 'risks'} 
              onClick={() => setSelectedTab('risks')}
            >
              Risques
            </TabButton>
          </div>

          <div className="flex-1">
            {selectedTab === 'wbs' && (
              <WBSBoard initialData={{
                id: 'root',
                name: 'Projet',
                children: [
                  {
                    id: 'f1',
                    name: 'Fonctionnalité 1',
                    children: [
                      { id: 'f1.1', name: 'Sous-fonction 1.1' },
                      { id: 'f1.2', name: 'Sous-fonction 1.2' }
                    ]
                  },
                  { id: 'f2', name: 'Fonctionnalité 2' }
                ]
              }} />
            )}
            
            {selectedTab === 'planning' && (
              <div className="h-full flex items-center justify-center text-gray-500">
                Planning du projet (en construction)
              </div>
            )}
            
            {selectedTab === 'risks' && (
              <div className="h-full flex items-center justify-center text-gray-500">
                Registre des risques (en construction)
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Game Assistant */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 flex items-center justify-center bg-blue-100 rounded-full flex-shrink-0">
            🧙‍♂️
          </div>
          <div>
            <p className="font-medium mb-1">Assistant</p>
            <p className="text-gray-600">
              Bienvenue dans la phase d'initiation ! Commencez par acquérir la Charte de Projet, 
              c'est le document fondamental qui formalise l'existence de votre projet.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ResourceIndicator = ({ icon, label, value }: { icon: string; label: string; value: number }) => {
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 flex items-center justify-center bg-blue-50 rounded-full">
        {icon}
      </div>
      <div>
        <div className="text-sm text-gray-500">{label}</div>
        <div className="font-bold">{value}</div>
      </div>
    </div>
  );
};

const TabButton = ({ 
  children, 
  active, 
  onClick 
}: { 
  children: React.ReactNode; 
  active: boolean; 
  onClick: () => void;
}) => {
  return (
    <button
      className={cn(
        "px-4 py-2 rounded-lg font-medium transition-colors",
        active 
          ? "bg-blue-50 text-blue-600" 
          : "bg-gray-50 text-gray-600 hover:bg-gray-100"
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default GameBoard;
