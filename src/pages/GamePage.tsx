import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import GameHeader from "@/components/game/GameHeader";
import Timeline from "@/components/game/Timeline";
import GameBoard from "@/components/game/GameBoard";
import defaultProjectCards from "@/data/project-cards-default.json";
import ecovoyageProjectCards from "@/data/project-cards-ecovoyage.json";
import gameConfig from "@/data/game-config.json";
import { Project } from "@/components/ProjectSelector";
import { getCardTitle, getCardDomain, getCardType } from "@/utils/cardHelpers";
import { useIsMobile } from "@/hooks/use-mobile";

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
      value?: number;
      message?: string;
    };
  }[];
  // Propriété pour stocker les résultats des conditions
  conditionResult?: {
    message?: string;
    budget?: number;
    time?: number;
    value?: number;
    htmlContent?: string;
  };
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
  'project-cards-default.json': defaultProjectCards,
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
  const isMobile = useIsMobile();
  
  // State for selected project
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  
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
    setIsLoading(true);
    
    // Fonction pour charger le projet
    const loadProject = () => {
      try {
        // Try to get the selected project from localStorage
        const storedProject = localStorage.getItem('selectedProject');
        
        if (storedProject) {
          try {
            const parsedProject = JSON.parse(storedProject) as Project;
            setSelectedProject(parsedProject);
            setProjectName(parsedProject.name); // Mettre à jour le nom du projet
            console.log("Loaded project:", parsedProject.name);
            setIsLoading(false);
          } catch (error) {
            console.error("Error parsing stored project:", error);
            setLoadError("Erreur lors du chargement du projet. Veuillez réessayer.");
            // Redirection différée pour éviter les problèmes sur mobile
            setTimeout(() => {
              navigate('/');
            }, 500);
          }
        } else {
          // If no project is selected, redirect to home
          console.log("No project selected, redirecting to home");
          setLoadError("Aucun projet sélectionné. Veuillez en choisir un.");
          // Redirection différée pour éviter les problèmes sur mobile
          setTimeout(() => {
            navigate('/');
          }, 500);
        }
      } catch (error) {
        console.error("Error in loadProject:", error);
        setLoadError("Une erreur inattendue s'est produite. Veuillez réessayer.");
        setTimeout(() => {
          navigate('/');
        }, 500);
      }
    };
    
    // Utiliser un délai pour s'assurer que tout est prêt, surtout sur mobile
    setTimeout(loadProject, 100);
    
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
        setLoadError(`Impossible de charger les données du projet "${selectedProject.name}". Fichier non trouvé: ${selectedProject.dataFile}`);
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
        setLoadError(`Le fichier du projet "${selectedProject.name}" ne contient aucune carte.`);
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
      setLoadError(`Une erreur s'est produite lors du traitement des données du projet "${selectedProject.name}". Veuillez réessayer.`);
    }
  }, [selectedProject, setLoadError]);

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

  // Générer des messages positifs et engageants pour les jalons
  const generatePositiveMessage = (phase: string, fulfilled: boolean, missingCards: string[]) => {
    if (fulfilled) {
      const messages = [
        `🌟 Félicitations ! Vous avez brillamment complété la phase ${phase} !`,
        `🎯 Excellent travail ! La phase ${phase} est un véritable succès !`,
        `🚀 Phase ${phase} validée avec brio ! Continuez sur cette lancée !`,
        `✨ Superbe performance ! La phase ${phase} est un franc succès !`
      ];
      return messages[Math.floor(Math.random() * messages.length)];
    }

    // Messages pour les phases incomplètes
    let message = `🎮 La phase ${phase} présente encore quelques défis à relever ! `;
    
    if (missingCards.length > 0) {
      const opportunities = [
        `Voici une opportunité d'amélioration : ${missingCards.join(", ")}`,
        `Pour optimiser votre score, pensez à : ${missingCards.join(", ")}`,
        `Conseil stratégique : considérez d'ajouter ${missingCards.join(", ")}`,
      ];
      message += opportunities[Math.floor(Math.random() * opportunities.length)];
    }

    const encouragements = [
      "\n💪 Chaque défi est une opportunité d'apprentissage !",
      "\n🌟 Vous avez les capacités pour surmonter ces obstacles !",
      "\n✨ C'est en relevant ces défis que vous deviendrez un meilleur chef de projet !",
      "\n🎯 Voyez ces ajustements comme une chance de perfectionner votre stratégie !"
    ];
    
    return message + encouragements[Math.floor(Math.random() * encouragements.length)];
  };

  const applyPhasePenalties = (phase: string) => {
    const { fulfilled, missingCards } = checkPhaseRequirements(phase);
    const positiveMessage = generatePositiveMessage(phase, fulfilled, missingCards);
    
    if (fulfilled) {
      return {
        time: 0,
        budget: 0,
        message: positiveMessage
      };
    }
    
    const penalties = phasePenalties[phase] || { time: 0, budget: 0, message: "" };
    
    return {
      time: penalties.time,
      budget: penalties.budget,
      message: positiveMessage
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

    // Mettre à jour le compteur de cartes et les tours restants
    setGameState(prevState => {
      const { newCardUsage, newRemainingTurns } = updateCardUsageAndTurns(cardType, prevState);
      
      // Ne plus forcer le passage à la phase suivante, juste mettre à jour le nombre de tours restants
      // même s'il est à zéro, pour permettre à l'utilisateur de cliquer sur le bouton
      
      // Créer la notification pour les tours restants
      const showTurnsNotification = () => {
        const animation = document.createElement('div');
        if (newRemainingTurns > 0) {
          animation.textContent = `${newRemainingTurns} tour${newRemainingTurns > 1 ? 's' : ''} restant${newRemainingTurns > 1 ? 's' : ''}`;
          animation.style.backgroundColor = newRemainingTurns <= 2 ? '#ff9800' : '#2196f3';
        } else {
          animation.textContent = "Cliquez sur le bouton 'Passer à l'étape jalon' pour continuer";
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
        }, 3000);
      };

      // Afficher la notification
      showTurnsNotification();
      
      // Générer une position pour la nouvelle carte
      const position = getNextAvailablePosition();
      const cardWithPosition = { ...card, position };
      
      // Vérifier si la carte est déjà sur le tableau
      const isCardAlreadyOnBoard = prevState.boardCards.some(c => c.id === card.id);
      if (isCardAlreadyOnBoard) {
        console.log(`Card ${card.id} is already on the board. Skipping.`);
        return prevState;
      }
      
      let newState = {
        ...prevState,
        boardCards: [...prevState.boardCards, cardWithPosition],
        remainingTurns: newRemainingTurns,
        cardUsage: newCardUsage
      };
      
      // Traitement spécifique selon le type de carte
      if (cardType === 'quiz') {
        // Ajouter également aux cartes sélectionnées pour le quiz
        newState.selectedCards = [...prevState.selectedCards, cardWithPosition];
        
        // Afficher une notification pour la carte quiz
        const quizNotification = document.createElement('div');
        quizNotification.textContent = "🎯 Question quiz : " + card.title;
        quizNotification.style.position = 'fixed';
        quizNotification.style.top = '220px';
        quizNotification.style.right = '20px';
        quizNotification.style.backgroundColor = '#4CAF50';
        quizNotification.style.color = 'white';
        quizNotification.style.padding = '8px 16px';
        quizNotification.style.borderRadius = '20px';
        quizNotification.style.fontWeight = 'bold';
        quizNotification.style.zIndex = '9999';
        quizNotification.style.opacity = '0';
        quizNotification.style.transform = 'translateX(20px)';
        quizNotification.style.transition = 'all 0.3s ease-out';
        
        document.body.appendChild(quizNotification);
        
        setTimeout(() => {
          quizNotification.style.opacity = '1';
          quizNotification.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
          quizNotification.style.opacity = '0';
          quizNotification.style.transform = 'translateX(20px)';
          setTimeout(() => {
            document.body.removeChild(quizNotification);
          }, 300);
        }, 3000);
      }

      // Ne plus déclencher automatiquement le jalon quand le nombre de tours est 0
      // Laisser l'utilisateur cliquer sur le bouton
      
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

  // Mise à jour du composant MilestoneDialog pour un style plus positif
  const MilestoneDialog = () => {
    if (!gameState.showMilestone) return null;
    
    const isGameOver = !gameState.pendingNextPhase;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
          <h2 className="text-xl font-bold mb-4 text-center">
            {isGameOver ? "🏆 Fin de l'Aventure !" : `🎯 Point d'Étape : ${gameState.currentPhase}`}
          </h2>
          
          <p className="mb-4 text-center">{gameState.milestoneMessage}</p>
          
          {gameState.pendingPenalties && (gameState.pendingPenalties.time > 0 || gameState.pendingPenalties.budget > 0) && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="font-semibold text-blue-700 mb-1">Ajustements Nécessaires :</h3>
              <ul className="list-disc pl-5 text-blue-700">
                {gameState.pendingPenalties.time > 0 && (
                  <li>Adaptation du planning : {gameState.pendingPenalties.time} mois supplémentaires pour assurer la qualité</li>
                )}
                {gameState.pendingPenalties.budget > 0 && (
                  <li>Investissement additionnel : {gameState.pendingPenalties.budget} K€ pour optimiser les résultats</li>
                )}
              </ul>
            </div>
          )}
          
          {gameState.pendingNextPhase ? (
            <div className="flex justify-center">
              <button
                onClick={handleAdvanceToNextPhase}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
              >
                Continuer l'Aventure ! 🚀
              </button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-lg font-semibold mb-2">🌟 Score Final : {gameState.valuePoints} points</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105"
              >
                Démarrer une Nouvelle Aventure ! 🎮
              </button>
            </div>
          )}
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

  // Afficher un écran de chargement ou d'erreur si nécessaire
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex flex-col items-center justify-center p-4">
        <img 
          src="/logo.png" 
          alt="PM Cards Logo" 
          className="w-24 h-24 mb-6 animate-pulse"
        />
        <h1 className="text-2xl font-bold text-white mb-4">Chargement du jeu...</h1>
        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (loadError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex flex-col items-center justify-center p-4">
        <img 
          src="/logo.png" 
          alt="PM Cards Logo" 
          className="w-24 h-24 mb-6"
        />
        <h1 className="text-2xl font-bold text-white mb-4">Oups !</h1>
        <p className="text-white text-center mb-6">{loadError}</p>
        <button
          onClick={() => navigate('/')}
          className="bg-white text-indigo-600 px-6 py-3 rounded-full text-lg font-semibold 
                   shadow-lg hover:shadow-xl transform transition-all duration-300 
                   hover:scale-105 hover:bg-indigo-50"
        >
          Retour à l'accueil
        </button>
      </div>
    );
  }

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
          onMilestoneStep={handlePhaseMilestone}
          remainingTurns={gameState.remainingTurns}
        />
        <MilestoneDialog />
      </>
    );
  }

  // Normal view with all components
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <GameHeader 
        budget={gameState.budget} 
        time={gameState.time} 
        valuePoints={gameState.valuePoints}
        currentPhase={gameState.currentPhase}
        remainingTurns={gameState.remainingTurns}
        isFullScreen={isFullScreen}
        onToggleFullScreen={handleToggleFullScreen}
        projectName={selectedProject?.name || "PM Cards"}
        onMilestoneStep={handlePhaseMilestone}
      />
      
      {/* Ne rendre Timeline que si les phases sont chargées */}
      {gameState.phases.length > 0 && (
        <div className="bg-white shadow-md">
          <Timeline 
            phases={gameState.phases} 
            currentPhase={gameState.currentPhase} 
            remainingTurns={gameState.remainingTurns}
            turnsPerPhase={turnsPerPhase}
          />
        </div>
      )}
      
      <div className="container mx-auto p-4 flex-grow overflow-auto">
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
              onMilestoneStep={handlePhaseMilestone}
              remainingTurns={gameState.remainingTurns}
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
            projectName={selectedProject?.name || "PM Cards"}
            onMilestoneStep={handlePhaseMilestone}
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
            onMilestoneStep={handlePhaseMilestone}
            remainingTurns={gameState.remainingTurns}
          />
        </div>
      )}
    </div>
  );
};

export default GamePage; 