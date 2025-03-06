
import { cn } from '@/lib/utils';

export type GamePhase = 'initiation' | 'planning' | 'execution' | 'monitoring' | 'closing';

interface PhaseIndicatorProps {
  currentPhase: GamePhase;
  className?: string;
}

const PhaseIndicator = ({ currentPhase, className }: PhaseIndicatorProps) => {
  const phases: GamePhase[] = ['initiation', 'planning', 'execution', 'monitoring', 'closing'];
  
  const getPhaseTitle = (phase: GamePhase): string => {
    const titles: Record<GamePhase, string> = {
      initiation: 'Initiation',
      planning: 'Planification',
      execution: 'Exécution',
      monitoring: 'Suivi et Contrôle',
      closing: 'Clôture'
    };
    return titles[phase];
  };
  
  const getPhaseDescription = (phase: GamePhase): string => {
    const descriptions: Record<GamePhase, string> = {
      initiation: 'Définir les objectifs et le périmètre',
      planning: 'Élaborer le plan de management',
      execution: 'Réaliser les activités prévues',
      monitoring: 'Suivre, examiner et réguler',
      closing: 'Finaliser toutes les activités'
    };
    return descriptions[phase];
  };

  return (
    <div className={cn("w-full py-4", className)}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xl font-medium text-foreground">Phase du Projet</h3>
        <span className="text-sm font-medium px-3 py-1 rounded-full bg-blue-100 text-blue-800">
          {getPhaseTitle(currentPhase)}
        </span>
      </div>
      
      <div className="relative">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -translate-y-1/2"></div>
        <div className="relative flex justify-between">
          {phases.map((phase, index) => {
            const isActive = phases.indexOf(currentPhase) >= index;
            const isCurrentPhase = currentPhase === phase;
            
            return (
              <div 
                key={phase} 
                className="flex flex-col items-center"
              >
                <div 
                  className={cn(
                    "relative w-8 h-8 rounded-full flex items-center justify-center z-10 transition-all duration-300",
                    isActive 
                      ? "bg-blue-600 text-white shadow-lg" 
                      : "bg-gray-200 text-gray-400",
                    isCurrentPhase && "ring-4 ring-blue-100"
                  )}
                >
                  {index + 1}
                </div>
                <div className="mt-2 text-xs font-medium text-center w-20">
                  <div className={cn(
                    "transition-colors duration-300",
                    isActive ? "text-blue-800" : "text-gray-400"
                  )}>
                    {getPhaseTitle(phase)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">{getPhaseDescription(currentPhase)}</div>
    </div>
  );
};

export default PhaseIndicator;
