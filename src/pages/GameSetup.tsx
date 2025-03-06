
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '@/components/Logo';
import AnimatedButton from '@/components/AnimatedButton';
import { cn } from '@/lib/utils';
import gameConfig from '@/data/gameConfig.json';
import { LucideIcon, Users, User, Clock, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';

type ProjectType = (typeof gameConfig.projectTypes)[number];
type Difficulty = keyof typeof gameConfig.difficulties;
type Duration = (typeof gameConfig.durations)[number];

interface OptionCardProps<T> {
  item: T;
  isSelected: boolean;
  icon: LucideIcon;
  onClick: () => void;
  title: string;
  description: string;
}

function OptionCard<T>({
  item,
  isSelected,
  icon: Icon,
  onClick,
  title,
  description
}: OptionCardProps<T>) {
  return (
    <div
      className={cn(
        "relative p-4 rounded-xl border transition-all duration-300 cursor-pointer card-shadow-hover",
        isSelected
          ? "border-blue-500 bg-blue-50 shadow-md"
          : "border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50/50"
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        <div className={cn(
          "p-3 rounded-lg",
          isSelected ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-500"
        )}>
          <Icon size={24} />
        </div>
        <div>
          <h3 className="text-lg font-medium mb-1">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>

      {isSelected && (
        <div className="absolute top-3 right-3 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </div>
  );
}

const GameSetup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [gameMode, setGameMode] = useState<'solo' | 'multiplayer'>('solo');
  const [projectType, setProjectType] = useState<ProjectType | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner');
  const [duration, setDuration] = useState<Duration | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const goToNextStep = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      startGame();
    }
  };

  const goToPreviousStep = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate('/');
    }
  };

  const startGame = () => {
    setIsLoading(true);
    
    // Here we would typically save the game configuration
    const gameSettings = {
      gameMode,
      projectType,
      difficulty,
      duration
    };
    
    console.log('Starting game with settings:', gameSettings);
    
    // Simulate loading
    setTimeout(() => {
      navigate('/game');
    }, 1000);
  };

  const canProceed = () => {
    switch (step) {
      case 1: return !!gameMode;
      case 2: return !!projectType;
      case 3: return !!difficulty;
      case 4: return !!duration;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <header className="w-full flex justify-between items-center mb-12">
          <Logo size="md" />
          <AnimatedButton 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="text-sm"
          >
            Retour à l'accueil
          </AnimatedButton>
        </header>

        <main className="w-full glassmorphism rounded-2xl p-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl md:text-3xl font-bold">Configuration de la partie</h1>
            <div className="hidden md:flex items-center space-x-1 text-sm font-medium">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    step === s ? "bg-blue-500 text-white" : 
                    step > s ? "bg-blue-200 text-blue-800" : 
                    "bg-gray-200 text-gray-500"
                  )}>
                    {s}
                  </div>
                  {s < 4 && <div className={cn(
                    "w-8 h-0.5", 
                    step > s ? "bg-blue-500" : "bg-gray-200"
                  )} />}
                </div>
              ))}
            </div>
            <div className="md:hidden text-sm font-medium">
              Étape {step}/4
            </div>
          </div>

          <div className="mb-8">
            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                <h2 className="text-xl font-semibold mb-4">Mode de jeu</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <OptionCard
                    item="solo"
                    isSelected={gameMode === 'solo'}
                    icon={User}
                    onClick={() => setGameMode('solo')}
                    title="Mode Solo"
                    description="Jouez seul avec l'assistant de jeu"
                  />
                  <OptionCard
                    item="multiplayer"
                    isSelected={gameMode === 'multiplayer'}
                    icon={Users}
                    onClick={() => setGameMode('multiplayer')}
                    title="Mode Multijoueur"
                    description="Jouez à plusieurs sur le même appareil"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-fade-in">
                <h2 className="text-xl font-semibold mb-4">Type de projet</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {gameConfig.projectTypes.map((type) => (
                    <OptionCard
                      key={type.id}
                      item={type}
                      isSelected={projectType?.id === type.id}
                      // @ts-ignore - We're using dynamic icons
                      icon={type.icon === 'code' ? (props: any) => <div {...props}>💻</div> :
                             type.icon === 'server' ? (props: any) => <div {...props}>🖥️</div> :
                             type.icon === 'megaphone' ? (props: any) => <div {...props}>📣</div> :
                             (props: any) => <div {...props}>📅</div>}
                      onClick={() => setProjectType(type)}
                      title={type.name}
                      description={type.description}
                    />
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 animate-fade-in">
                <h2 className="text-xl font-semibold mb-4">Niveau de difficulté</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(Object.keys(gameConfig.difficulties) as Difficulty[]).map((diff) => (
                    <OptionCard
                      key={diff}
                      item={diff}
                      isSelected={difficulty === diff}
                      icon={BarChart3}
                      onClick={() => setDifficulty(diff)}
                      title={diff === 'beginner' ? 'Débutant' : diff === 'intermediate' ? 'Intermédiaire' : 'Expert'}
                      description={`Budget: ${gameConfig.difficulties[diff].startingBudget}, Temps: ${gameConfig.difficulties[diff].startingTime}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4 animate-fade-in">
                <h2 className="text-xl font-semibold mb-4">Durée de partie</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {gameConfig.durations.map((dur) => (
                    <OptionCard
                      key={dur.id}
                      item={dur}
                      isSelected={duration?.id === dur.id}
                      icon={Clock}
                      onClick={() => setDuration(dur)}
                      title={dur.name}
                      description={dur.description}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <AnimatedButton
              variant="outline"
              onClick={goToPreviousStep}
              className="flex items-center gap-1"
            >
              <ChevronLeft size={16} />
              {step > 1 ? 'Précédent' : 'Annuler'}
            </AnimatedButton>

            <AnimatedButton
              variant="premium"
              onClick={goToNextStep}
              disabled={!canProceed() || isLoading}
              className="flex items-center gap-1"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Préparation...
                </div>
              ) : (
                <>
                  {step < 4 ? 'Suivant' : 'Commencer la partie'}
                  {step < 4 && <ChevronRight size={16} />}
                </>
              )}
            </AnimatedButton>
          </div>
        </main>
      </div>
    </div>
  );
};

export default GameSetup;
