import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import GameHeader from "@/components/game/GameHeader";
import Timeline from "@/components/game/Timeline";
import GameBoard from "@/components/game/GameBoard";
import defaultProjectCards from "@/data/project-cards.json";
import ecovoyageProjectCards from "@/data/project-cards-ecovoyage.json";
import gameConfig from "@/data/game-config.json";
import { Project } from "@/components/ProjectSelector";
import { getCardTitle, getCardDomain, getCardType } from "@/utils/cardHelpers";

// Define types for our game
export type Card = {
  id: string;
  type?: string;
  domaine?: string;
  domain?: string;
  phase: string | string[];
  nom?: string;
  title?: string;
  description: string;
  info?: string;
  délai?: string;
  coût?: string;
  impact_délai?: string;
  impact_coût?: string;
  probabilité?: string;
  nouveau_impact_délai?: string;
  nouveau_impact_coût?: string;
  nouvelle_probabilité?: string;
  position?: { x: number; y: number };
  // Propriétés spécifiques aux cartes de type question
  options?: string[];
  correct_answer?: string;
  comment?: string;
  // Propriétés pour les cartes événements conditionnelles
  conditions?: {
    cardId?: string;
    present?: boolean;
    operator?: "AND" | "OR";
    checks?: { cardId: string; present: boolean }[];
    default?: boolean;
    effects?: {
      budget?: number;
      time?: number;
      message?: string;
    };
  }[];
};

export type GameState = {
  budget: number;
  time: number;
  valuePoints: number;
  currentPhase: string;
  remainingTurns: number;
  selectedCards: Card[];
  boardCards: Card[];
  showMilestone: boolean;
  milestoneMessage: string;
  phases: string[]; // Store phases dynamically
  pendingNextPhase: string | null; // Store the next phase that's pending user confirmation
  pendingPenalties: { time: number; budget: number } | null; // Store penalties pending application
  cardUsage: {
    action: number;
    event: number;
    quiz: number;
  };
};

// Define mapping between project files and their data
const PROJECT_DATA: Record<string, any> = {
  'project-cards.json': defaultProjectCards,
  'project-cards-ecovoyage.json': ecovoyageProjectCards,
};

// Define types for game configuration
export type PhaseConfig = {
  name: string;
  order: number;
  turns: number;
  requiredCards: string[];
  cardLimits: {
    action: number;
    event: number;
    quiz: number;
  };
  penalties: {
    time: number;
    budget: number;
    message: string;
  };
};

export type GameConfig = {
  gameSettings: {
    initialBudget: number;
    initialTime: number;
    cardWidth: number;
    cardHeight: number;
    cardMargin: number;
    cardsPerRow: number;
    boardTopMargin: number;
  };
  phases: PhaseConfig[];
  cardValueRules: {
    condition: string;
    points: number;
  }[];
};

// Add this type definition after the GameConfig type
export type DomainColorMap = {
  [key: string]: {
    bg: string;
    text: string;
    border?: string;
  };
};

// Add this array of Tailwind color pairs (background and text)
const colorPairs = [
  { bg: "bg-blue-200", text: "text-blue-900" },
  { bg: "bg-green-200", text: "text-green-900" },
  { bg: "bg-amber-200", text: "text-amber-900" },
  { bg: "bg-purple-200", text: "text-purple-900" },
  { bg: "bg-red-200", text: "text-red-900" },
  { bg: "bg-indigo-200", text: "text-indigo-900" },
  { bg: "bg-orange-200", text: "text-orange-900" },
  { bg: "bg-pink-200", text: "text-pink-900" },
  { bg: "bg-teal-200", text: "text-teal-900" },
  { bg: "bg-cyan-200", text: "text-cyan-900" },
  { bg: "bg-lime-200", text: "text-lime-900" },
  { bg: "bg-emerald-200", text: "text-emerald-900" },
  { bg: "bg-violet-200", text: "text-violet-900" },
  { bg: "bg-fuchsia-200", text: "text-fuchsia-900" },
  { bg: "bg-rose-200", text: "text-rose-900" }
];

// Extract settings from game config
const {
  gameSettings: {
    initialBudget: INITIAL_BUDGET,
    initialTime: INITIAL_TIME,
    cardWidth: CARD_WIDTH,
    cardHeight: CARD_HEIGHT,
    cardMargin: CARD_MARGIN,
    cardsPerRow: CARDS_PER_ROW
  }
} = gameConfig as GameConfig;

// Ajouter cette fonction après la définition des types
const calculateTotalTurns = (cardLimits: { action: number; event: number; quiz: number }): number => {
  return cardLimits.action + cardLimits.event + cardLimits.quiz;
};

const GamePage = () => {
  const navigate = useNavigate();
  
  // State for selected project
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  // State for dynamic game configuration
  const [phases, setPhases] = useState<string[]>([]);
  const [turnsPerPhase, setTurnsPerPhase] = useState<Record<string, number>>({});
  const [requiredCards, setRequiredCards] = useState<Record<string, string[]>>({});
  const [phasePenalties, setPhasePenalties] = useState<Record<string, { time: number; budget: number; message: string }>>({});
  
  // Initialize game state
  const [gameState, setGameState] = useState<GameState>({
    budget: INITIAL_BUDGET,
    time: INITIAL_TIME,
    valuePoints: 0,
    currentPhase: "",
    remainingTurns: 0,
    selectedCards: [],
    boardCards: [],
    showMilestone: false,
    milestoneMessage: "",
    phases: [],
    pendingNextPhase: null,
    pendingPenalties: null,
    cardUsage: {
      action: 0,
      event: 0,
      quiz: 0
    }
  });

  // Group cards by domain for the card decks
  const [cardDecks, setCardDecks] = useState<Record<string, Card[]>>({});
  const [allCards, setAllCards] = useState<Card[]>([]);

  // Add isFullScreen state after other state declarations
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Add state for domain colors
  const [domainColors, setDomainColors] = useState<DomainColorMap>({});

  // État pour le nom du projet
  const [projectName, setProjectName] = useState<string>("Project Management Game");

  // Load selected project
  useEffect(() => {
    // Try to get the selected project from localStorage
    const storedProject = localStorage.getItem('selectedProject');
    if (storedProject) {
      try {
        const parsedProject = JSON.parse(storedProject) as Project;
        setSelectedProject(parsedProject);
        setProjectName(parsedProject.name); // Mettre à jour le nom du projet
        console.log("Loaded project:", parsedProject.name);
      } catch (error) {
        console.error("Error parsing stored project:", error);
        // If there's an error, redirect to home to select a project
        navigate('/');
      }
    } else {
      // If no project is selected, redirect to home
      console.log("No project selected, redirecting to home");
      navigate('/');
    }
  }, [navigate]);

  // Add function to get current phase's card limits
  const getCurrentPhaseLimits = useCallback(() => {
    const config = gameConfig as GameConfig;
    const currentPhaseConfig = config.phases.find(phase => phase.name === gameState.currentPhase);
    return currentPhaseConfig?.cardLimits || { action: 0, event: 0, quiz: 0 };
  }, [gameState.currentPhase]);

  // Helper function to update card usage and remaining turns
  const updateCardUsageAndTurns = useCallback((cardType: string, currentState: GameState) => {
    const newCardUsage = { ...currentState.cardUsage };
    console.log("walid");
    switch (cardType.toLowerCase()) {
      case 'action':
        newCardUsage.action++;
        break;
      case 'event':
        newCardUsage.event++;
        break;
      case 'quiz':
        newCardUsage.quiz++;
        break;
    }

    const currentPhaseLimits = getCurrentPhaseLimits();
    const totalTurns = calculateTotalTurns(currentPhaseLimits);
    const usedTurns = newCardUsage.action + newCardUsage.event + newCardUsage.quiz;
    const newRemainingTurns = totalTurns - usedTurns;

    return { newCardUsage, newRemainingTurns };
  }, [getCurrentPhaseLimits]);

  // Add function to check if card can be added based on type limits
  const canAddCardOfType = useCallback((cardType: string): boolean => {
    const limits = getCurrentPhaseLimits();
    const usage = gameState.cardUsage;

    switch (cardType.toLowerCase()) {
      case 'action':
        return usage.action < limits.action;
      case 'event':
        return usage.event < limits.event;
      case 'quiz':
        return usage.quiz < limits.quiz;
      default:
        return false;
    }
  }, [gameState.cardUsage, getCurrentPhaseLimits]);

  // Load game configuration
  useEffect(() => {
    try {
      // Extract configuration from the game config file
      const config = gameConfig as GameConfig;
      
      // Sort phases by order
      const sortedPhases = [...config.phases].sort((a, b) => a.order - b.order);
      
      // Extract phase names
      const phaseNames = sortedPhases.map(phase => phase.name);
      setPhases(phaseNames);
      
      // Create turns per phase mapping
      const turnsMapping: Record<string, number> = {};
      const requiredCardsMapping: Record<string, string[]> = {};
      const penaltiesMapping: Record<string, { time: number; budget: number; message: string }> = {};
      
      sortedPhases.forEach(phase => {
        // Calculer le nombre de tours à partir des limites de cartes
        turnsMapping[phase.name] = calculateTotalTurns(phase.cardLimits);
        requiredCardsMapping[phase.name] = phase.requiredCards;
        penaltiesMapping[phase.name] = phase.penalties;
      });
      
      setTurnsPerPhase(turnsMapping);
      setRequiredCards(requiredCardsMapping);
      setPhasePenalties(penaltiesMapping);
      
      // Initialize game state with the first phase
      if (phaseNames.length > 0) {
        const firstPhase = phaseNames[0];
        setGameState(prev => ({
          ...prev,
          currentPhase: firstPhase,
          remainingTurns: turnsMapping[firstPhase],
          phases: phaseNames
        }));
      }
      
      console.log("Game configuration loaded:", {
        phases: phaseNames,
        turnsPerPhase: turnsMapping,
        requiredCards: requiredCardsMapping
      });
    } catch (error) {
      console.error("Error loading game configuration:", error);
    }
  }, []);

  // Update the card loading effect to use the selected project
  useEffect(() => {
    if (!selectedProject) return;

    try {
      // Get the project data based on the dataFile property
      const projectCards = PROJECT_DATA[selectedProject.dataFile];
      
      if (!projectCards) {
        console.error(`No data found for project file: ${selectedProject.dataFile}`);
        return;
      }

      // Process the cards from the selected JSON file
      const processedCards = Array.isArray(projectCards) 
        ? projectCards.map((card: any, index: number) => {
            // Handle different card field formats
            const normalizedCard: Card = {
              id: card.id || `card-${index}`,
              type: card.type,
              // Handle different naming conventions
              domaine: card.domaine || card.domain,
              domain: card.domain || card.domaine,
              phase: card.phase, // Use the original phase format
              nom: card.nom || card.title,
              title: card.title || card.nom,
              description: card.description,
              info: card.info,
              délai: card.délai,
              coût: card.coût,
              position: { x: 0, y: 0 },
              // Ajouter les propriétés spécifiques aux cartes de type question
              options: card.options,
              correct_answer: card.correct_answer,
              comment: card.comment,
              // Ajouter les propriétés pour les cartes événements conditionnelles
              conditions: card.conditions,
            };
            
            return normalizedCard;
          })
        : [];
      
      setAllCards(processedCards);

      if (processedCards.length === 0) {
        console.error("No cards were loaded from the JSON file");
        return;
      }

      // Get unique domains and create color mapping
      const getDomain = (card: Card) => getCardDomain(card);
      const uniqueDomains = [...new Set(processedCards.map(getDomain))].filter(Boolean);
      const colorMapping: DomainColorMap = {};
      
      // Assign colors to domains
      uniqueDomains.forEach((domain, index) => {
        // Use modulo to cycle through colors if we have more domains than colors
        const colorPair = colorPairs[index % colorPairs.length];
        colorMapping[domain] = colorPair;
      });
      
      setDomainColors(colorMapping);

      // Group cards by domain
      const decksByDomain: Record<string, Card[]> = {};
      
      // Initialize empty arrays for each domain
      uniqueDomains.forEach(domain => {
        decksByDomain[domain] = [];
      });
      
      // Then populate each domain with its cards
      processedCards.forEach(card => {
        const domain = getDomain(card);
        if (domain && decksByDomain[domain]) {
          decksByDomain[domain].push(card);
        }
      });

      setCardDecks(decksByDomain);
      
      console.log("Cards loaded:", processedCards.length);
      console.log("Domains with colors:", colorMapping);
    } catch (error) {
      console.error("Error processing cards:", error);
    }
  }, [selectedProject]);

  // Calculate the next available position on the board
  const getNextAvailablePosition = () => {
    if (gameState.boardCards.length === 0) {
      return { x: CARD_MARGIN, y: CARD_MARGIN };
    }

    // Calculate the position for the new card based on the grid layout
    const cardIndex = gameState.boardCards.length;
    const row = Math.floor(cardIndex / CARDS_PER_ROW);
    const col = cardIndex % CARDS_PER_ROW;

    const x = CARD_MARGIN + col * (CARD_WIDTH + CARD_MARGIN);
    const y = CARD_MARGIN + row * (CARD_HEIGHT + CARD_MARGIN);

    return { x, y };
  };

  // Check if required cards for the current phase have been played
  const checkPhaseRequirements = (phase: string) => {
    const phaseRequiredCards = requiredCards[phase] || [];
    const playedCardNames = gameState.boardCards.map(card => getCardTitle(card));
    
    const missingCards = phaseRequiredCards.filter(
      requiredCard => !playedCardNames.some(playedCard => playedCard === requiredCard)
    );
    
    return {
      fulfilled: missingCards.length === 0,
      missingCards
    };
  };

  // Apply penalties for missing required cards
  const applyPhasePenalties = (phase: string) => {
    const { fulfilled, missingCards } = checkPhaseRequirements(phase);
    
    if (fulfilled) {
      return {
        time: 0,
        budget: 0,
        message: `Phase ${phase} complétée avec succès ! Toutes les exigences ont été satisfaites.`
      };
    }
    
    const penalties = phasePenalties[phase] || { time: 0, budget: 0, message: "" };
    const customMessage = `Phase ${phase} incomplète. ${
      missingCards.length > 0 
        ? `Cartes manquantes: ${missingCards.join(", ")}. ` 
        : ""
    }${penalties.message}`;
    
    return {
      time: penalties.time,
      budget: penalties.budget,
      message: customMessage
    };
  };

  // Handle the milestone at the end of a phase
  const handlePhaseMilestone = () => {
    const currentPhase = gameState.currentPhase;
    const penalties = applyPhasePenalties(currentPhase);
    
    // Get the next phase
    const currentPhaseIndex = gameState.phases.indexOf(currentPhase);
    const nextPhase = currentPhaseIndex < gameState.phases.length - 1 
      ? gameState.phases[currentPhaseIndex + 1] 
      : null;
    
    // Show milestone dialog with results and store pending next phase
    setGameState(prev => ({
      ...prev,
      showMilestone: true,
      milestoneMessage: penalties.message,
      pendingNextPhase: nextPhase,
      pendingPenalties: { time: penalties.time, budget: penalties.budget }
    }));
  };

  // Handle advancing to the next phase after user confirmation
  const handleAdvanceToNextPhase = () => {
    setGameState(prev => {
      // If there's no next phase, we've completed the game
      if (!prev.pendingNextPhase) {
        return {
          ...prev,
          showMilestone: false,
          milestoneMessage: `Projet terminé ! Score final: ${prev.valuePoints}`,
          pendingPenalties: null
        };
      }
      
      // Apply penalties and advance to the next phase
      return {
        ...prev,
        budget: Math.max(0, prev.budget - (prev.pendingPenalties?.budget || 0)),
        time: Math.max(0, prev.time - (prev.pendingPenalties?.time || 0)),
        currentPhase: prev.pendingNextPhase,
        remainingTurns: turnsPerPhase[prev.pendingNextPhase],
        showMilestone: false,
        pendingNextPhase: null,
        pendingPenalties: null,
        cardUsage: { // Reset card usage for new phase
          action: 0,
          event: 0,
          quiz: 0
        }
      };
    });
  };

  // Modifier la fonction handleSelectCard
  const handleSelectCard = (card: Card) => {
    console.log("Card selected:", card);
    
    const cardType = card.type?.toLowerCase() || 'action';
    
    // Vérifier les limites de cartes
    if (!canAddCardOfType(cardType)) {
      // Create an element for the error animation
      const animation = document.createElement('div');
      animation.textContent = `Limite de cartes ${cardType} atteinte pour cette phase !`;
      animation.style.position = 'fixed';
      animation.style.top = '170px';
      animation.style.right = '20px';
      animation.style.backgroundColor = '#ef4444';
      animation.style.color = 'white';
      animation.style.padding = '8px 16px';
      animation.style.borderRadius = '20px';
      animation.style.fontWeight = 'bold';
      animation.style.zIndex = '9999';
      animation.style.opacity = '0';
      animation.style.transform = 'translateX(20px)';
      animation.style.transition = 'all 0.3s ease-out';
      
      document.body.appendChild(animation);
      
      setTimeout(() => {
        animation.style.opacity = '1';
        animation.style.transform = 'translateX(0)';
      }, 100);
      
      setTimeout(() => {
        animation.style.opacity = '0';
        animation.style.transform = 'translateX(20px)';
        setTimeout(() => {
          document.body.removeChild(animation);
        }, 300);
      }, 3000);
      
      return;
    }

    // Mettre à jour le compteur de cartes et les tours restants en une seule mise à jour
    setGameState(prevState => {
      const { newCardUsage, newRemainingTurns } = updateCardUsageAndTurns(cardType, prevState);
      
      // Créer la notification pour les tours restants
      const showTurnsNotification = () => {
        const animation = document.createElement('div');
        if (newRemainingTurns > 0) {
          animation.textContent = `${newRemainingTurns} tour${newRemainingTurns > 1 ? 's' : ''} restant${newRemainingTurns > 1 ? 's' : ''}`;
          animation.style.backgroundColor = newRemainingTurns <= 2 ? '#ff9800' : '#2196f3';
        } else {
          animation.textContent = "Dernier tour de la phase !";
          animation.style.backgroundColor = '#f44336';
        }
        
        animation.style.position = 'fixed';
        animation.style.top = '170px';
        animation.style.right = '20px';
        animation.style.color = 'white';
        animation.style.padding = '8px 16px';
        animation.style.borderRadius = '20px';
        animation.style.fontWeight = 'bold';
        animation.style.zIndex = '9999';
        animation.style.opacity = '0';
        animation.style.transform = 'translateX(20px)';
        animation.style.transition = 'all 0.3s ease-out';
        
        document.body.appendChild(animation);
        
        setTimeout(() => {
          animation.style.opacity = '1';
          animation.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
          animation.style.opacity = '0';
          animation.style.transform = 'translateX(20px)';
          setTimeout(() => {
            document.body.removeChild(animation);
          }, 300);
        }, 2000);
      };

      // Afficher la notification
      showTurnsNotification();
      
      // Pour les cartes action, ajouter au board si pas déjà présente
      let newState;
      if (cardType === 'action' && !prevState.boardCards.some(c => c.id === card.id)) {
        const position = getNextAvailablePosition();
        const cardWithPosition = { ...card, position };
        
        newState = {
          ...prevState,
          boardCards: [...prevState.boardCards, cardWithPosition],
          remainingTurns: newRemainingTurns,
          cardUsage: newCardUsage
        };
      } else {
        // Pour toutes les cartes (event, quiz, et action déjà sur le board)
        newState = {
          ...prevState,
          remainingTurns: newRemainingTurns,
          cardUsage: newCardUsage
        };
      }

      // Si le nombre de tours restants est 0, déclencher automatiquement le jalon
      if (newRemainingTurns === 0) {
        const currentPhase = newState.currentPhase;
        const penalties = applyPhasePenalties(currentPhase);
        
        // Get the next phase
        const currentPhaseIndex = newState.phases.indexOf(currentPhase);
        const nextPhase = currentPhaseIndex < newState.phases.length - 1 
          ? newState.phases[currentPhaseIndex + 1] 
          : null;
        
        // Mettre à jour l'état avec le jalon
        return {
          ...newState,
          showMilestone: true,
          milestoneMessage: penalties.message,
          pendingNextPhase: nextPhase,
          pendingPenalties: { time: penalties.time, budget: penalties.budget }
        };
      }

      return newState;
    });
  };

  // Handle random card selection
  const handleRandomCardSelected = useCallback((card: Card) => {
    const cardType = getCardType(card);
    const { newCardUsage, newRemainingTurns } = updateCardUsageAndTurns(cardType, gameState);
    
    setGameState(prev => ({
      ...prev,
      cardUsage: newCardUsage,
      remainingTurns: newRemainingTurns
    }));
  }, [gameState, updateCardUsageAndTurns]);

  // Helper function to convert time strings to months
  const parseTimeToMonths = (timeString: string): number => {
    const months = timeString.includes("mois") 
      ? parseInt(timeString.replace(/[^0-9]/g, '')) 
      : timeString.includes("semaine") 
        ? Math.ceil(parseInt(timeString.replace(/[^0-9]/g, '')) / 4) 
        : 0;
    return months;
  };

  // Calculate the value points for a card
  const calculateCardValue = (card: Card): number => {
    let value = 1; // Base value for any card
    
    // Check if this card is required for the current phase
    const isRequiredCard = requiredCards[gameState.currentPhase]?.includes(getCardTitle(card));
    if (isRequiredCard) {
      value += 2; // Bonus for playing a required card
    }
    
    // Apply rules from game config
    const valueRules = (gameConfig as GameConfig).cardValueRules || [];
    valueRules.forEach(rule => {
      if (rule.condition === "domain" && getCardDomain(card) === rule.condition) {
        value += rule.points;
      } else if (rule.condition === "type" && card.type === rule.condition) {
        value += rule.points;
      }
    });
    
    return value;
  };

  // Handle moving a card on the board
  const handleMoveCard = (id: string, position: { x: number; y: number }) => {
    setGameState(prev => ({
      ...prev,
      boardCards: prev.boardCards.map(card => 
        card.id === id ? { ...card, position } : card
      ),
    }));
  };

  // Handle adding value points (for quiz answers, etc.)
  const handleAddValuePoints = (points: number) => {
    console.log(`Adding ${points} value points to current value: ${gameState.valuePoints}`);
    setGameState(prev => {
      const newState = {
        ...prev,
        valuePoints: prev.valuePoints + points
      };
      console.log("New valuePoints:", newState.valuePoints);
      return newState;
    });
  };

  // Handle modifying budget (for event cards)
  const handleModifyBudget = (amount: number) => {
    console.log(`Modifying budget by ${amount}K€ from current value: ${gameState.budget}K€`);
    setGameState(prev => {
      const newState = {
        ...prev,
        budget: Math.max(0, prev.budget + amount) // Ensure budget doesn't go below 0
      };
      console.log("New budget:", newState.budget + "K€");
      return newState;
    });
  };

  // Handle modifying time (for event cards)
  const handleModifyTime = (amount: number) => {
    console.log(`Modifying time by ${amount} months from current value: ${gameState.time} months`);
    setGameState(prev => {
      const newState = {
        ...prev,
        time: Math.max(0, prev.time + amount) // Ensure time doesn't go below 0
      };
      console.log("New time:", newState.time + " months");
      return newState;
    });
  };

  // Milestone dialog component
  const MilestoneDialog = () => {
    if (!gameState.showMilestone) return null;
    
    const isGameOver = !gameState.pendingNextPhase;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
          <h2 className="text-xl font-bold mb-4">
            {isGameOver ? "Fin du Projet" : `Jalon de Phase: ${gameState.currentPhase}`}
          </h2>
          
          <p className="mb-4">{gameState.milestoneMessage}</p>
          
          {gameState.pendingPenalties && (gameState.pendingPenalties.time > 0 || gameState.pendingPenalties.budget > 0) && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <h3 className="font-semibold text-yellow-700 mb-1">Conséquences:</h3>
              <ul className="list-disc pl-5 text-yellow-700">
                {gameState.pendingPenalties.time > 0 && (
                  <li>Retard de {gameState.pendingPenalties.time} mois</li>
                )}
                {gameState.pendingPenalties.budget > 0 && (
                  <li>Surcoût de {gameState.pendingPenalties.budget} K€</li>
                )}
              </ul>
            </div>
          )}
          
          {gameState.pendingNextPhase && (
            <p className="mb-4 text-blue-600">
              Phase suivante: <span className="font-bold">{gameState.pendingNextPhase}</span>
            </p>
          )}
          
          <button 
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            onClick={handleAdvanceToNextPhase}
          >
            {isGameOver ? "Terminer le projet" : "Passer à la phase suivante"}
          </button>
        </div>
      </div>
    );
  };

  // Add handleToggleFullScreen function before the return statement
  const handleToggleFullScreen = () => {
    setIsFullScreen(prev => !prev);
    // Prevent scrolling when in full-screen mode
    document.body.style.overflow = !isFullScreen ? 'hidden' : '';
  };

  // Clean up the overflow style when component unmounts
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Effect to monitor changes in value points
  useEffect(() => {
    console.log("Value points updated:", gameState.valuePoints);
    
    // Afficher une notification visuelle lorsque les points de valeur changent
    if (gameState.valuePoints > 0) {
      const notification = document.createElement('div');
      notification.textContent = `Points de valeur: ${gameState.valuePoints}`;
      notification.style.position = 'fixed';
      notification.style.bottom = '20px';
      notification.style.right = '20px';
      notification.style.backgroundColor = '#4CAF50';
      notification.style.color = 'white';
      notification.style.padding = '10px';
      notification.style.borderRadius = '5px';
      notification.style.zIndex = '9999';
      notification.style.opacity = '0';
      notification.style.transition = 'opacity 0.5s';
      
      document.body.appendChild(notification);
      
      // Afficher la notification
      setTimeout(() => {
        notification.style.opacity = '1';
      }, 100);
      
      // Supprimer la notification après 3 secondes
      setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 500);
      }, 3000);
    }
  }, [gameState.valuePoints]);

  // If game is not yet initialized, show loading
  if (gameState.phases.length === 0) {
    return <div className="flex items-center justify-center h-screen">Loading game...</div>;
  }

  // If in full-screen mode, only show the board
  if (isFullScreen) {
    return (
      <>
        <GameBoard 
          cards={gameState.boardCards} 
          onMoveCard={handleMoveCard}
          isFullScreen={true}
          onToggleFullScreen={handleToggleFullScreen}
          domainColors={domainColors}
          allCards={allCards}
          onSelectCard={handleSelectCard}
          currentPhase={gameState.currentPhase}
          onAddValuePoints={handleAddValuePoints}
          onModifyBudget={handleModifyBudget}
          onModifyTime={handleModifyTime}
          cardLimits={getCurrentPhaseLimits()}
          cardUsage={gameState.cardUsage}
          onRandomCardSelected={handleRandomCardSelected}
        />
        <MilestoneDialog />
      </>
    );
  }

  // Normal view with all components
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Fixed header section */}
      <div className="sticky top-0 z-30 bg-white shadow-md">
        <GameHeader
          budget={gameState.budget}
          time={gameState.time} 
          valuePoints={gameState.valuePoints}
          currentPhase={gameState.currentPhase}
          remainingTurns={gameState.remainingTurns}
          isFullScreen={isFullScreen}
          onToggleFullScreen={handleToggleFullScreen}
          projectName={projectName}
        />
        
        {/* Ne rendre Timeline que si les phases sont chargées */}
        {gameState.phases.length > 0 && (
          <Timeline 
            phases={gameState.phases} 
            currentPhase={gameState.currentPhase} 
            remainingTurns={gameState.remainingTurns}
            turnsPerPhase={turnsPerPhase}
          />
        )}
      </div>
      
      <div className="container mx-auto p-4">
        {gameState.showMilestone ? (
          <MilestoneDialog />
        ) : (
          <>
            {/* Game Board */}
            <GameBoard
              cards={gameState.boardCards}
              onMoveCard={handleMoveCard}
              isFullScreen={isFullScreen}
              onToggleFullScreen={handleToggleFullScreen}
              domainColors={domainColors}
              allCards={allCards}
              onSelectCard={handleSelectCard}
              currentPhase={gameState.currentPhase}
              onAddValuePoints={handleAddValuePoints}
              onModifyBudget={handleModifyBudget}
              onModifyTime={handleModifyTime}
              cardLimits={getCurrentPhaseLimits()}
              cardUsage={gameState.cardUsage}
              onRandomCardSelected={handleRandomCardSelected}
            />
          </>
        )}
      </div>
      
      {/* Fullscreen Game Board */}
      {isFullScreen && (
        <div className="fixed inset-0 z-50 bg-white">
          <GameHeader
            budget={gameState.budget}
            time={gameState.time}
            valuePoints={gameState.valuePoints}
            currentPhase={gameState.currentPhase}
            remainingTurns={gameState.remainingTurns}
            isFullScreen={true}
            onToggleFullScreen={handleToggleFullScreen}
            projectName={projectName}
          />
          
          <GameBoard
            cards={gameState.boardCards}
            onMoveCard={handleMoveCard}
            isFullScreen={true}
            onToggleFullScreen={handleToggleFullScreen}
            domainColors={domainColors}
            allCards={allCards}
            onSelectCard={handleSelectCard}
            currentPhase={gameState.currentPhase}
            onAddValuePoints={handleAddValuePoints}
            onModifyBudget={handleModifyBudget}
            onModifyTime={handleModifyTime}
            cardLimits={getCurrentPhaseLimits()}
            cardUsage={gameState.cardUsage}
            onRandomCardSelected={handleRandomCardSelected}
          />
        </div>
      )}
    </div>
  );
};

export default GamePage; 