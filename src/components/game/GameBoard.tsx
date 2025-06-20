import React, { useState, useRef, useEffect } from "react";
import { Card, DomainColorMap } from "@/pages/GamePage";
import { 
  getCardTitle, 
  getCardDescription, 
  getCardDomain, 
  getCardCost, 
  getCardTime, 
  getCardType,
  getCardPhase,
  getCardInfo,
  getCardConditions,
  hasCardConditions
} from "@/utils/cardHelpers";
import RandomCardWheel from "./RandomCardWheel";
import DetailSidePanel from "./DetailSidePanel";
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';

interface GameBoardProps {
  cards: Card[];
  onMoveCard: (id: string, position: { x: number; y: number }) => void;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  domainColors: DomainColorMap;
  allCards?: Card[]; // All available cards
  onSelectCard?: (card: Card) => void; // Callback when a card is selected
  currentPhase?: string; // Current phase of the game
  onAddValuePoints?: (points: number) => void; // Callback to add value points
  onModifyBudget?: (amount: number) => void; // Callback to modify budget
  onModifyTime?: (amount: number) => void; // Callback to modify time
  cardLimits?: { action: number; event: number; quiz: number }; // Card limits for current phase
  cardUsage?: { action: number; event: number; quiz: number }; // Current card usage
  onRandomCardSelected?: (card: Card) => void; // Nouvelle prop pour les cartes aléatoires
  onMilestoneStep?: () => void; // Callback pour passer à l'étape jalon
  remainingTurns?: number; // Nombre de tours restants
  onResetGame?: () => void; // Callback pour réinitialiser le jeu
  gameState?: {
    budget: number;
    time: number;
    valuePoints: number;
    phase: string;
  }; // État actuel du jeu pour la sauvegarde
}

type CardType = 'action' | 'event' | 'quiz';

// Debug mode flag - set to true to enable debug mode
const DEBUG_MODE = false;

// Constantes pour les dimensions des cartes
const CARD_WIDTH = 180;
const CARD_MIN_HEIGHT = 100;
const CARD_MARGIN = 4;
const BOARD_PADDING = 8;

// Ajouter ce composant au début du fichier, après les imports
const MarkdownContent = ({ content }: { content: string }) => {
  return (
    <div className="text-sm text-gray-600 mt-1 line-clamp-2">
      {content}
    </div>
  );
};

// Ajouter cette interface avant le composant GameBoard
interface ModalContent {
  title: string;
  description: string;
  cost: number;
  delay: number;
  type: string;
  domain: string;
  phase: string | string[];
  options: string[];
  correct_answer: string;
  comment: string;
  conditions: any[];
  info?: string;
  value?: number; // Ajouter l'attribut value pour l'impact sur la valeur
  conditionResult?: {
    effectsToApply: any;
    conditionDescription: string;
    appliedCondition: any;
  } | null; // Résultat de l'évaluation des conditions
}

// Ajouter cette définition après la déclaration de MarkdownContent
const markdownComponents: Components = {
  p: ({ node, ...props }) => <p className="text-purple-900 mt-1" {...props} />
};

const GameBoard: React.FC<GameBoardProps> = ({ 
  cards, 
  onMoveCard, 
  isFullScreen = false,
  onToggleFullScreen,
  domainColors,
  allCards = [],
  onSelectCard,
  currentPhase = '',
  onAddValuePoints,
  onModifyBudget,
  onModifyTime,
  cardLimits = { action: 0, event: 0, quiz: 0 },
  cardUsage = { action: 0, event: 0, quiz: 0 },
  onRandomCardSelected,
  onMilestoneStep,
  remainingTurns = 0,
  onResetGame,
  gameState
}) => {
  const [draggingCard, setDraggingCard] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const boardRef = useRef<HTMLDivElement>(null);
  const [hoveredCard, setHoveredCard] = useState<Card | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [currentPosition, setCurrentPosition] = useState({ x: 0, y: 0 });
  const [selectedCardType, setSelectedCardType] = useState<CardType>('action');
  const [showCardSelector, setShowCardSelector] = useState(false);
  // Debug mode state - initialized from constant
  const [debugMode, setDebugMode] = useState(DEBUG_MODE);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCurrentPhaseOnly, setShowCurrentPhaseOnly] = useState(true);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  
  // Ajout d'un état pour suivre la position de départ de la souris
  const [mouseStartPosition, setMouseStartPosition] = useState({ x: 0, y: 0 });
  const [cardStartPosition, setCardStartPosition] = useState({ x: 0, y: 0 });
  
  // États pour le sélecteur de cartes
  const [selectedActionCards, setSelectedActionCards] = useState<Card[]>([]);
  
  // États pour le composant
  const [altKeyPressed, setAltKeyPressed] = useState(false);
  
  // Liste globale des cartes utilisées (placées sur le plateau)
  const [usedCards, setUsedCards] = useState<string[]>([]);
  
  // Liste globale de toutes les cartes tirées (même celles qui ne sont plus sur le plateau)
  const [allUsedCards, setAllUsedCards] = useState<string[]>([]);
  
  // Ajouter ces deux nouveaux états
  const [modalContent, setModalContent] = useState<ModalContent | null>(null);
  const [showModal, setShowModal] = useState(false);
  
  // Ajouter ces états au début du composant, avec les autres états
  const [clickStartPosition, setClickStartPosition] = useState({ x: 0, y: 0 });
  const [isClick, setIsClick] = useState(false);
  
  // Mettre à jour la liste des cartes utilisées lorsque les cartes changent
  useEffect(() => {
    const cardIds = cards.map(card => card.id);
    setUsedCards(cardIds);
    
    // Ajouter les cartes actuelles à la liste de toutes les cartes tirées
    setAllUsedCards(prev => {
      const newCards = cardIds.filter(id => !prev.includes(id));
      if (newCards.length > 0) {
        return [...prev, ...newCards];
      }
      return prev;
    });
    
    if (debugMode) {
      console.log("Liste des cartes utilisées mise à jour:", cardIds);
    }
  }, [cards, debugMode]);
  
  // Surveiller la touche Alt pour le mode de débogage
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        setAltKeyPressed(true);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        setAltKeyPressed(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  
  // Function to log debug information
  const debugLog = (...args: any[]) => {
    if (debugMode) {
      console.log('[DEBUG]', ...args);
    }
  };
  
  // Toggle debug mode with Alt+D keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'd') {
        setDebugMode(prev => {
          const newValue = !prev;
          console.log(`[DEBUG MODE] ${newValue ? 'ENABLED' : 'DISABLED'}`);
          return newValue;
        });
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Log state changes in debug mode
  useEffect(() => {
    if (debugMode) {
      debugLog('Component State:', {
        totalCards: allCards.length,
        cardsOnBoard: cards.length,
        cardIdsOnBoard: cards.map(c => c.id),
        allUsedCards,
        currentPhase
      });
    }
  }, [debugMode, cards, allCards, allUsedCards, currentPhase]);
  
  // Ajouter un effet pour vérifier les cartes au chargement du composant
  useEffect(() => {
    console.log("GameBoard mounted or updated");
    console.log("allCards length:", allCards.length);
    console.log("cards on board length:", cards.length);
    
    if (allCards.length === 0) {
      console.warn("No cards were passed to the GameBoard component!");
    }
  }, [allCards, cards]);

  // Modifier la fonction handleCardMouseDown
  const handleCardMouseDown = (e: React.MouseEvent, cardId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Enregistrer la position initiale du clic
    setClickStartPosition({ x: e.clientX, y: e.clientY });
    setIsClick(true);
    
    // Trouver la carte à déplacer
    const card = cards.find(c => c.id === cardId);
    if (!card || !card.position) {
      console.error("Card not found or position undefined", cardId);
      return;
    }
    
    // Enregistrer la position initiale de la souris
    setMouseStartPosition({
      x: e.clientX,
      y: e.clientY
    });
    
    // Enregistrer la position initiale de la carte
    setCardStartPosition({
      x: card.position.x,
      y: card.position.y
    });
    
    // Démarrer le déplacement
    setDraggingCard(cardId);
    setIsDragging(true);
    document.body.style.cursor = 'grabbing';
  };
  
  // Modifier la fonction handleMouseMove
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingCard || !isDragging || !boardRef.current) return;
    
    // Calculer la distance parcourue depuis le début du clic
    const moveDistance = Math.sqrt(
      Math.pow(e.clientX - clickStartPosition.x, 2) + 
      Math.pow(e.clientY - clickStartPosition.y, 2)
    );
    
    // Si le mouvement dépasse 5 pixels, ce n'est plus un clic
    if (moveDistance > 5) {
      setIsClick(false);
    }
    
    // Calculer le delta (différence) du mouvement de la souris
    const deltaX = e.clientX - mouseStartPosition.x;
    const deltaY = e.clientY - mouseStartPosition.y;
    
    // Reste du code de handleMouseMove...
    let newX = cardStartPosition.x + deltaX;
    let newY = cardStartPosition.y + deltaY;
    
    const boardRect = boardRef.current.getBoundingClientRect();
    const cardElement = document.querySelector(`[data-card-id="${draggingCard}"]`) as HTMLElement;
    const cardHeight = cardElement ? cardElement.offsetHeight : CARD_MIN_HEIGHT;
    
    newX = Math.max(0, Math.min(newX, boardRect.width - CARD_WIDTH));
    newY = Math.max(0, Math.min(newY, boardRect.height - cardHeight));
    
    setCurrentPosition({ x: newX, y: newY });
    onMoveCard(draggingCard, { x: newX, y: newY });
  };
  
  // Modifier la gestion du clic sur une carte
  const handleCardClick = (cardId: string, e: React.MouseEvent) => {
    // Ne rien faire si on est en train de déplacer la carte
    if (!isClick) return;
    
    // Trouver la carte correspondante
    const card = cards.find(c => c.id === cardId);
    if (!card) return;
    
    debugLog("Card clicked:", cardId);
    
    // Si c'est une carte action, afficher dans une jolie Box modale
    if (getCardType(card) === 'action') {
      displayCardInModal(card);
    } else {
      // Pour les autres types de cartes, ouvrir ou fermer le panneau latéral
      setActiveCardId(activeCardId === cardId ? null : cardId);
    }
  };

  // Modifier la gestion du mouseup global
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (draggingCard) {
        setDraggingCard(null);
        setIsDragging(false);
        document.body.style.cursor = 'auto';
        
        // Si c'était un clic (pas de déplacement significatif), traiter comme un clic
        if (isClick) {
          const card = cards.find(c => c.id === draggingCard);
          if (card && getCardType(card) === 'action') {
            displayCardInModal(card);
          }
        }
      }
      setIsClick(false);
    };
    
    if (isDragging) {
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }
    
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, draggingCard, isClick, cards]);

  // Get domain colors for a card
  const getCardColors = (domain: string) => {
    const defaultColors = { 
      bg: "bg-gray-100", 
      text: "text-gray-800", 
      border: "border-gray-200" 
    };
    
    if (!domain || !domainColors || !domainColors[domain]) {
      return defaultColors;
    }
    
    return {
      bg: domainColors[domain].bg || defaultColors.bg,
      text: domainColors[domain].text || defaultColors.text,
      border: domainColors[domain].border || defaultColors.border
    };
  };

  // Group cards by domain
  const groupCardsByDomain = (cards: Card[]) => {
    const grouped: Record<string, Card[]> = {};
    
    cards.forEach(card => {
      // Use the imported helper function
      const domain = getCardDomain(card);
      
      if (!grouped[domain]) {
        grouped[domain] = [];
      }
      grouped[domain].push(card);
    });
    
    // Si aucune carte n'a de domaine, créer une catégorie "Toutes les cartes"
    if (Object.keys(grouped).length === 0 && cards.length > 0) {
      grouped['Toutes les cartes'] = [...cards];
    }
    
    return grouped;
  };

  // Determine container classes based on full-screen mode
  const containerClasses = isFullScreen
    ? "fixed inset-0 z-50 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500"
    : "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl shadow-xl p-4 mt-4";

  // Determine board container styles based on full-screen mode
  const boardContainerStyle = isFullScreen
    ? { height: 'calc(100vh - 64px)' }
    : { height: '600px', minHeight: '600px' };

  // Completely redesigned function to check if a card is already on the project board
  const isCardOnBoard = (cardId: string | undefined) => {
    // If the cardId is undefined, it can't be on the board
    if (!cardId) {
      debugLog("Card ID is undefined, cannot check if it's on the board");
      return false;
    }
    
    // Utiliser la liste des cartes actuellement sur le plateau au lieu de usedCards
    const isOnBoard = cards.some(card => card.id === cardId);
    
    if (debugMode) {
      debugLog("Checking if card ID exists:", cardId);
      debugLog(`Card is ${isOnBoard ? "on" : "not on"} the board`);
    }
    
    return isOnBoard;
  };

  // Fonction utilitaire pour afficher une animation de changement de compteur
  const showCounterAnimation = (type: 'budget' | 'time' | 'points', value: number) => {
    // Créer un élément pour l'animation
    const animation = document.createElement('div');
    
    // Déterminer si la valeur est positive ou négative
    const isPositive = value >= 0;
    const displayValue = isPositive ? `+${value}` : `${value}`;
    
    // Déterminer l'unité et la position en fonction du type
    let unit = '';
    let topPosition = '';
    let color = '';
    
    switch (type) {
      case 'budget':
        unit = 'K€';
        topPosition = '80px';
        // Rouge pour les coûts positifs (mauvais), vert pour les économies
        color = isPositive ? '#f44336' : '#4caf50';
        break;
      case 'time':
        unit = ' jours';
        topPosition = '110px';
        // Rouge pour les délais positifs (mauvais), vert pour les gains de temps
        color = isPositive ? '#f44336' : '#4caf50';
        break;
      case 'points':
        unit = ' points';
        topPosition = '140px';
        // Toujours vert pour les points (c'est toujours positif)
        color = '#4caf50';
        break;
    }
    
    // Configurer l'élément d'animation
    animation.textContent = `${displayValue}${unit}`;
    animation.style.position = 'fixed';
    animation.style.top = topPosition;
    animation.style.right = '20px';
    animation.style.backgroundColor = color;
    animation.style.color = 'white';
    animation.style.padding = '8px 16px';
    animation.style.borderRadius = '20px';
    animation.style.fontWeight = 'bold';
    animation.style.zIndex = '9999';
    animation.style.opacity = '0';
    animation.style.transform = 'translateX(20px)';
    animation.style.transition = 'all 0.5s ease-out';
    
    // Ajouter l'animation au DOM
    document.body.appendChild(animation);
    
    // Déclencher l'animation
    setTimeout(() => {
      animation.style.opacity = '1';
      animation.style.transform = 'translateX(0)';
    }, 100);
    
    // Supprimer l'animation après un délai plus long (5 secondes)
    setTimeout(() => {
      animation.style.opacity = '0';
      animation.style.transform = 'translateX(20px)';
      
      setTimeout(() => {
        document.body.removeChild(animation);
      }, 500);
    }, 5000); // Augmenté de 2000 à 5000 ms
  };

  // Fonction pour ajouter une carte au tableau
  const handleAddCard = (card: Card) => {
    console.log("=== AJOUT DE CARTE AU TABLEAU ===");
    console.log("Type de carte:", getCardType(card));
    console.log("Titre:", getCardTitle(card));
    
    // Afficher toutes les propriétés de la carte pour déboguer
    console.log("Toutes les propriétés de la carte dans handleAddCard:");
    for (const prop in card) {
      console.log(`${prop}: ${JSON.stringify(card[prop])}`);
    }
    
    // Vérifier si la carte est déjà sur le tableau
    if (isCardOnBoard(card.id) && !altKeyPressed) {
      debugLog(`Card ${card.id} is already on the board. Skipping.`);
      return;
    }

    // Vérifier les limites de cartes par type
    const cardType = getCardType(card);
    if (cardType && cardLimits && cardUsage) {
      if (cardUsage[cardType] >= cardLimits[cardType]) {
        debugLog(`Card limit reached for type ${cardType}. Current: ${cardUsage[cardType]}, Limit: ${cardLimits[cardType]}`);
        showImpactNotification(`Limite de cartes ${cardType} atteinte (${cardUsage[cardType]}/${cardLimits[cardType]})`);
        return;
      }
    }
    
    // Générer une position aléatoire pour la nouvelle carte
    const position = getNextAvailablePosition();
    
    // Essayer de récupérer la valeur de différentes façons
    const cardValue = card.value !== undefined ? card.value : 
                     typeof card['value'] === 'number' ? card['value'] : 
                     typeof card['valeur'] === 'number' ? card['valeur'] : undefined;
    
    console.log("Valeur récupérée:", cardValue);
    
    // Créer une copie de la carte avec la nouvelle position et la valeur explicite
    const newCard = {
      ...card,
      position,
      value: cardValue // Préserver explicitement l'attribut value
    };
    
    // Récupérer l'impact direct sur la valeur si présent
    const valueImpact = cardValue;
    
    console.log("Card original:", card);
    console.log("New Card créée:", newCard);
    console.log("valueImpact:", valueImpact);
    
    // Ajouter la carte à la liste de toutes les cartes tirées
    if (!allUsedCards.includes(card.id)) {
      setAllUsedCards(prev => [...prev, card.id]);
      debugLog(`Card ${card.id} added to allUsedCards. Total: ${allUsedCards.length + 1}`);
    }
    
    // Ajouter la carte au tableau
    if (onSelectCard) {
      console.log("Avant onSelectCard - newCard:", newCard);
      console.log("Avant onSelectCard - value:", newCard.value);
      
      onSelectCard(newCard);
      
      console.log("Après onSelectCard");
      
      // Mettre à jour le compteur de cartes utilisées
      if (cardType && cardUsage) {
        debugLog(`Incrementing card usage for type ${cardType}. Before: ${cardUsage[cardType]}`);
      }
      
      // Fermer le sélecteur de cartes
      setShowCardSelector(false);
      
      // Traiter les cartes selon leur type
      if (cardType === 'action') {
        // Afficher toutes les cartes action dans la jolie Box modale
        console.log("Displaying action card in modal...");
        
        // Les conditions seront gérées dans displayCardInModal
        // pour éviter la double application des effets
        displayCardInModal(card);
      } else if (cardType === 'event' && hasCardConditions(card)) {
        console.log("Event card has conditions, processing them...");
        handleEventCardEffect(card);
        
        // Appliquer également l'impact valeur direct pour les cartes événement si présent
        if (valueImpact !== undefined && onAddValuePoints && typeof onAddValuePoints === 'function') {
          console.log(`Applying direct value impact for event card: ${valueImpact} points`);
          try {
            onAddValuePoints(valueImpact);
            showCounterAnimation('points', valueImpact);
          } catch (error) {
            console.error("Erreur lors de l'application directe des points de valeur pour carte événement:", error);
          }
        }
      } else if (cardType === 'quiz') {
        // Pour les cartes quiz, on les affiche simplement
        console.log("Quiz card added to board");
        // Les points seront ajoutés via handleQuizCorrectAnswer quand l'utilisateur répond correctement
      }
    }
  };
  
  // Fonction pour gérer les conditions des cartes action
  const handleActionCardConditions = (actionCard: Card) => {
    console.log("=== ACTION AVEC CONDITIONS DÉCLENCHÉE ===");
    console.log("Carte:", getCardTitle(actionCard));
    console.log("Type:", getCardType(actionCard));
    console.log("A des conditions:", hasCardConditions(actionCard));
    console.log("Conditions brutes:", actionCard.conditions);
    
    // Vérifier si la carte a des conditions
    if (hasCardConditions(actionCard)) {
      console.log("Conditions détectées:", JSON.stringify(getCardConditions(actionCard), null, 2));
      
      // Utiliser uniquement les cartes actuellement sur le plateau
      const boardCardIds = cards.map(card => card.id);
      console.log("Cartes actuellement sur le plateau:", boardCardIds);
      
      // Variable pour stocker les effets à appliquer
      let effectsToApply = null;
      let conditionDescription = "";
      let appliedCondition = null; // Nouvelle variable pour stocker la condition appliquée
      
      // Parcourir les conditions
      for (const condition of getCardConditions(actionCard)) {
        let conditionMet = false;
        
        // Condition simple
        if (condition.cardId && condition.present !== undefined) {
          const cardPresent = boardCardIds.includes(condition.cardId);
          conditionMet = (cardPresent === condition.present);
          
          // Trouver le titre de la carte pour l'explication
          const cardTitle = allCards.find(c => c.id === condition.cardId)
            ? getCardTitle(allCards.find(c => c.id === condition.cardId)!)
            : `Carte #${condition.cardId}`;
            
          conditionDescription = condition.present 
            ? `Condition testée: La carte "${cardTitle}" est ${conditionMet ? 'présente' : 'absente'} sur le plateau.`
            : `Condition testée: La carte "${cardTitle}" est ${!conditionMet ? 'présente' : 'absente'} sur le plateau.`;
            
          console.log(`Vérification de la condition pour la carte ${condition.cardId}:`);
          console.log(`- La carte est ${cardPresent ? "présente" : "absente"} sur le plateau`);
          console.log(`- La condition attend que la carte soit ${condition.present ? "présente" : "absente"}`);
          console.log(`- Résultat: condition ${conditionMet ? "remplie" : "non remplie"}`);
        }
        // Condition avec opérateur logique
        else if (condition.operator && condition.checks) {
          // Tableau pour stocker les résultats des vérifications
          const checkResults = [];
          
          // Vérifier chaque sous-condition
          for (const check of condition.checks) {
            if (check.cardId && check.present !== undefined) {
              const cardPresent = boardCardIds.includes(check.cardId);
              const result = (cardPresent === check.present);
              
              // Trouver le titre de la carte pour l'explication
              const cardTitle = allCards.find(c => c.id === check.cardId)
                ? getCardTitle(allCards.find(c => c.id === check.cardId)!)
                : `Carte #${check.cardId}`;
                
              checkResults.push({
                cardId: check.cardId,
                title: cardTitle,
                expected: check.present,
                actual: cardPresent,
                result
              });
              
              console.log(`Vérification de la sous-condition pour la carte ${check.cardId}:`);
              console.log(`- La carte est ${cardPresent ? "présente" : "absente"} sur le plateau`);
              console.log(`- La condition attend que la carte soit ${check.present ? "présente" : "absente"}`);
              console.log(`- Résultat: sous-condition ${result ? "remplie" : "non remplie"}`);
            }
          }
          
          // Appliquer l'opérateur logique
          if (condition.operator === "AND") {
            conditionMet = checkResults.every(check => check.result);
            console.log(`Opérateur AND: toutes les conditions doivent être remplies. Résultat: ${conditionMet ? "rempli" : "non rempli"}`);
          } else if (condition.operator === "OR") {
            conditionMet = checkResults.some(check => check.result);
            console.log(`Opérateur OR: au moins une condition doit être remplie. Résultat: ${conditionMet ? "rempli" : "non rempli"}`);
          }
          
          // Construire l'explication détaillée
          const checkDescriptions = checkResults.map(check => 
            `"${check.title}" ${check.expected ? 'présente' : 'absente'}: ${check.result ? '✓' : '✗'}`
          );
          
          conditionDescription = `Condition testée (${condition.operator}): ${checkDescriptions.join(' ET ')}`;
        }
        // Condition par défaut
        else if (condition.default) {
          conditionMet = true;
          conditionDescription = "Condition par défaut appliquée car aucune autre condition n'a été remplie.";
          console.log("Condition par défaut appliquée");
        }
        
        // Si la condition est remplie, stocker les effets à appliquer
        if (conditionMet && condition.effects) {
          effectsToApply = condition.effects;
          appliedCondition = condition; // Stocker la condition appliquée
          console.log("Effets à appliquer:", effectsToApply);
          break; // On a trouvé une condition qui s'applique, on arrête la recherche
        }
      }
      
      // Retourner les résultats pour utilisation dans displayCardInModal
      return {
        effectsToApply,
        conditionDescription,
        appliedCondition
      };
    } else {
      // Si la carte n'a pas de conditions, afficher un message d'erreur
      console.error("La carte action n'a pas de conditions mais handleActionCardConditions a été appelé");
      return null;
    }
  };
  
  // Card Selector Component
  const CardSelectorPanel = () => {
    if (!showCardSelector) return null;
    
    // États locaux pour le panneau
    const [localSelectedType, setLocalSelectedType] = useState<CardType>(selectedCardType);
    const [showCurrentPhaseOnly, setShowCurrentPhaseOnly] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Update existing card IDs when the component mounts or cards change
    useEffect(() => {
      const boardCardIds = cards.map(card => card.id);
      debugLog("Board card IDs:", boardCardIds);
    }, [cards]);
    
    // Filter cards by type
    const getFilteredCardsByType = () => {
      if (localSelectedType === 'action') {
        const filtered = allCards.filter(card => getCardType(card) === 'action');
        debugLog(`Filtered action cards: ${filtered.length}/${allCards.length}`);
        return filtered;
      } else if (localSelectedType === 'event') {
        const filtered = allCards.filter(card => getCardType(card) === 'event');
        debugLog(`Filtered event cards: ${filtered.length}/${allCards.length}`);
        return filtered;
      } else if (localSelectedType === 'quiz') {
        const filtered = allCards.filter(card => getCardType(card) === 'quiz');
        debugLog(`Filtered quiz cards: ${filtered.length}/${allCards.length}`);
        return filtered;
      }
      return allCards;
    };
    
    // Filter cards by search query
    const applySearchFilter = (filteredCards: Card[]) => {
      if (!searchQuery.trim()) {
        return filteredCards;
      }
      
      const normalizedQuery = searchQuery.trim().toLowerCase();
      const searchResults = filteredCards.filter(card => {
        const nameMatch = getCardTitle(card).toLowerCase().includes(normalizedQuery);
        const descMatch = getCardDescription(card).toLowerCase().includes(normalizedQuery);
        const domainMatch = getCardDomain(card).toLowerCase().includes(normalizedQuery);
        
        return nameMatch || descMatch || domainMatch;
      });
      
      debugLog(`Search results for "${normalizedQuery}": ${searchResults.length}/${filteredCards.length} cards`);
      return searchResults;
    };
    
    // Get filtered cards with all filters applied
    const getFilteredCards = () => {
      // First filter by type
      let filtered = getFilteredCardsByType();
      debugLog(`After type filtering: ${filtered.length} cards`);
      
      // Then filter by phase if needed
      if (showCurrentPhaseOnly && currentPhase) {
        const normalizedCurrentPhase = currentPhase.trim().toLowerCase();
        debugLog(`Filtering by phase "${normalizedCurrentPhase}"`);
        
        const beforeCount = filtered.length;
        filtered = filtered.filter(card => {
          if (!card.phase) {
            debugLog(`Card ${card.id} has no phase defined, excluding it`);
            return false;
          }
          
          if (Array.isArray(card.phase)) {
            const normalizedPhases = card.phase
              .filter(p => p != null)
              .map(p => String(p).trim().toLowerCase());
            
            const includes = normalizedPhases.includes(normalizedCurrentPhase);
            if (debugMode) {
              debugLog(`Card ${card.id} has phases [${normalizedPhases.join(', ')}], includes "${normalizedCurrentPhase}": ${includes}`);
            }
            return includes;
          } else {
            const normalizedPhase = String(card.phase).trim().toLowerCase();
            const matches = normalizedPhase === normalizedCurrentPhase;
            if (debugMode) {
              debugLog(`Card ${card.id} has phase "${normalizedPhase}", matches "${normalizedCurrentPhase}": ${matches}`);
            }
            return matches;
          }
        });
        
        debugLog(`After phase filtering: ${filtered.length}/${beforeCount} cards match phase "${normalizedCurrentPhase}"`);
      }
      
      // Finally, apply search filter
      return applySearchFilter(filtered);
    };
    
    const filteredCards = getFilteredCards();
    const groupedCards = groupCardsByDomain(filteredCards);
    
    if (debugMode) {
      debugLog('Card Selector State:', {
        filteredCardCount: filteredCards.length,
        groupedDomains: Object.keys(groupedCards),
        currentPhase
      });
    }
    
    // Fonction pour gérer la sélection d'une carte
    const handleCardSelection = (card: Card) => {
      console.log("Card being selected (raw):", card);
      
      // Vérifier si la carte a un attribut value dans le JSON original
      // Afficher toutes les propriétés de la carte pour déboguer
      console.log("Toutes les propriétés de la carte:");
      for (const prop in card) {
        console.log(`${prop}: ${card[prop]}`);
      }
      
      // Créer une copie de la carte avec tous les attributs
      const selectedCard = {
        ...card,
        // Essayer de récupérer la valeur de différentes façons
        value: card.value !== undefined ? card.value : 
               typeof card['value'] === 'number' ? card['value'] : 
               typeof card['valeur'] === 'number' ? card['valeur'] : undefined
      };
      
      console.log("Selected card after copy:", selectedCard);
      console.log("Selected card value after copy:", selectedCard.value);
      
      // Pour tous les types de cartes, ajouter directement au tableau
      handleAddCard(selectedCard);
    };
    
    // Vérifier si une carte est sélectionnée
    const isCardSelected = (cardId: string) => {
      return false; // Plus besoin de sélection, toutes les cartes sont ajoutées directement
    };
    
    // Fonction pour ajouter la carte action sélectionnée
    const handleAddSelectedActionCard = () => {
      // Cette fonction n'est plus utilisée
    };
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          {/* Debug info */}
          {debugMode && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 p-2 mb-4 text-sm">
              <div className="font-bold">Debug Mode Active (Alt+D to toggle)</div>
              <div>Cards on board: {cards.length}</div>
              <div>Filtered cards: {filteredCards.length}/{allCards.length}</div>
              <div>Current phase: {currentPhase || 'None'}</div>
              <div className="text-xs mt-1 text-gray-600">Hold Alt while clicking a card to force-add it even if it's already on the board</div>
            </div>
          )}
          
          {/* Header with title and search */}
          <div className="flex flex-col mb-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xl font-bold">
                {localSelectedType === 'action' ? 'Cartes Action' :
                localSelectedType === 'event' ? 'Cartes Événement' :
                'Cartes Quiz'}
                {showCurrentPhaseOnly && currentPhase ? ` - Phase ${currentPhase}` : ''}
              </h3>
              
              {/* Close button */}
              <button
                onClick={() => {
                  setShowCardSelector(false);
                }}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700"
                aria-label="Fermer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
              <p className="text-sm text-gray-500">
                Cliquez sur une carte pour l'ajouter directement au tableau.
              </p>
              
              {/* Search input */}
              <div className="relative w-full md:w-64">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher une carte..."
                  className="w-full px-4 py-2 pr-10 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <span className="absolute right-3 top-2.5 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
              </div>
            </div>
            
            {/* Filter tabs */}
            {debugMode && (
            <div className="flex flex-wrap gap-2 mt-4">
              {/* Phase Filter Toggle */}
              {currentPhase && (
                <button
                  onClick={() => setShowCurrentPhaseOnly(!showCurrentPhaseOnly)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${showCurrentPhaseOnly 
                      ? 'bg-yellow-500 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  {showCurrentPhaseOnly ? 'Toutes les phases' : `Phase ${currentPhase}`}
                </button>
              )}
              
              {/* Card Type Tabs */}
              <button
                onClick={() => setLocalSelectedType('action')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${localSelectedType === 'action' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Cartes Action
              </button>
              <button
                onClick={() => setLocalSelectedType('event')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${localSelectedType === 'event' 
                    ? 'bg-purple-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Cartes Événement
              </button>
              <button
                onClick={() => setLocalSelectedType('quiz')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${localSelectedType === 'quiz' 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Cartes Quiz
              </button>
            </div>
            )}
          </div>
          
          {/* Results count */}
          <div className="mb-4 text-sm text-gray-500">
            {filteredCards.length} carte{filteredCards.length !== 1 ? 's' : ''} trouvée{filteredCards.length !== 1 ? 's' : ''}
            {searchQuery && <span> pour "<strong>{searchQuery}</strong>"</span>}
          </div>
          
          {/* Card grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {Object.entries(groupedCards).map(([domain, domainCards]) => (
              <div key={domain} className="space-y-3">
                <h4 className="font-semibold text-gray-700 border-b pb-1">
                  {domain || 'Sans domaine'} ({domainCards.length})
                  </h4>
                
                <div className="space-y-2">
                    {domainCards.map(card => {
                    const colors = getCardColors(domain);
                      const isOnBoard = isCardOnBoard(card.id);
                    const isSelected = isCardSelected(card.id);
                      
                      // Récupérer les valeurs de coût et délai pour les cartes d'action
                      const getCostValue = (card: Card) => {
                        if (card.cost !== undefined) return card.cost;
                        // Fallback pour les anciennes propriétés françaises si elles existent encore
                        const frenchCost = (card as any)['coût'];
                        if (typeof frenchCost === 'string') {
                          return parseInt(frenchCost.replace(/[^0-9-]/g, '')) || 0;
                        }
                        if (typeof frenchCost === 'number') return frenchCost;
                        return 0;
                      };
                      
                      const getDelayValue = (card: Card) => {
                        if (card.delay !== undefined) return card.delay;
                        // Fallback pour les anciennes propriétés françaises si elles existent encore
                        const frenchDelay = (card as any)['délai'];
                        if (typeof frenchDelay === 'string') {
                          return parseInt(frenchDelay.replace(/[^0-9-]/g, '')) || 0;
                        }
                        if (typeof frenchDelay === 'number') return frenchDelay;
                        return 0;
                      };
                      
                      const costValue = getCostValue(card);
                      const delayValue = getDelayValue(card);
                      const cardType = getCardType(card);
                      
                      return (
                      <div
                        key={card.id}
                        onClick={() => handleCardSelection(card)}
                        className={`p-3 rounded-lg cursor-pointer transition-all ${
                          isOnBoard ? 'opacity-50' : 'hover:shadow-md'
                        } ${
                          isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : colors.bg
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <h5 className={`font-medium ${isSelected ? 'text-blue-700' : colors.text}`}>
                            {getCardTitle(card)}
                            {isOnBoard && <span className="ml-2 text-xs">(déjà sur le tableau)</span>}
                          </h5>
                          
                          {/* Tags d'impact pour les cartes d'action */}
                          {cardType === 'action' && (costValue !== 0 || delayValue !== 0) && (
                            <div className="flex gap-1 ml-2 flex-shrink-0">
                              {costValue !== 0 && (
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  costValue > 0 
                                    ? 'bg-red-100 text-red-800' 
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  💰 {costValue > 0 ? '+' : ''}{costValue}
                                </span>
                              )}
                              {delayValue !== 0 && (
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  delayValue > 0 
                                    ? 'bg-red-100 text-red-800' 
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  ⏱️ {delayValue > 0 ? '+' : ''}{delayValue}
                                </span>
                              )}
                            </div>
                          )}
                          </div>
                          
                        <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {getCardDescription(card)}
                          </div>
                            </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
        </div>
      </div>
    );
  };

  // Utiliser le composant DetailSidePanel importé
  const renderDetailSidePanel = () => {
    return (
      <DetailSidePanel
        activeCardId={activeCardId}
        cards={cards}
        getCardColors={getCardColors}
        onClose={() => setActiveCardId(null)}
        allCards={allCards}
      />
    );
  };

  // Mise à jour de la fonction searchCards pour utiliser les fonctions d'aide
  const searchCards = (cards, query) => {
    if (!query) return cards;
    
    const normalizedQuery = query.toLowerCase();
    
    return cards.filter(card => {
      const nameMatch = getCardTitle(card).toLowerCase().includes(normalizedQuery);
      const descMatch = getCardDescription(card).toLowerCase().includes(normalizedQuery);
      const domainMatch = getCardDomain(card).toLowerCase().includes(normalizedQuery);
      
      return nameMatch || descMatch || domainMatch;
    });
  };

  // Fonction pour gérer les effets des cartes événement
  const handleEventCardEffect = (eventCard: Card) => {
    console.log("=== ÉVÉNEMENT AVEC CONDITIONS DÉCLENCHÉ ===");
    console.log("Carte:", getCardTitle(eventCard));
    console.log("Type:", getCardType(eventCard));
    console.log("A des conditions:", hasCardConditions(eventCard));
    
    // Vérifier si la carte a des conditions
    if (hasCardConditions(eventCard)) {
      console.log("Conditions détectées:", JSON.stringify(getCardConditions(eventCard), null, 2));
      
      // Utiliser uniquement les cartes actuellement sur le plateau
      const boardCardIds = cards.map(card => card.id);
      console.log("Cartes actuellement sur le plateau:", boardCardIds);
      
      // Variable pour stocker les effets à appliquer
      let effectsToApply = null;
      let conditionDescription = "";
      
      // Parcourir les conditions
      for (const condition of getCardConditions(eventCard)) {
        let conditionMet = false;
        
        // Condition simple
        if (condition.cardId && condition.present !== undefined) {
          const cardPresent = boardCardIds.includes(condition.cardId);
          conditionMet = (cardPresent === condition.present);
          
          // Trouver le titre de la carte pour l'explication
          const cardTitle = allCards.find(c => c.id === condition.cardId)
            ? getCardTitle(allCards.find(c => c.id === condition.cardId)!)
            : `Carte #${condition.cardId}`;
            
          conditionDescription = condition.present 
            ? `Condition testée: La carte "${cardTitle}" est ${conditionMet ? 'présente' : 'absente'} sur le plateau.`
            : `Condition testée: La carte "${cardTitle}" est ${!conditionMet ? 'présente' : 'absente'} sur le plateau.`;
            
          console.log(`Vérification de la condition pour la carte ${condition.cardId}:`);
          console.log(`- La carte est ${cardPresent ? "présente" : "absente"} sur le plateau`);
          console.log(`- La condition attend que la carte soit ${condition.present ? "présente" : "absente"}`);
          console.log(`- Résultat: condition ${conditionMet ? "remplie" : "non remplie"}`);
        }
        // Condition avec opérateur logique
        else if (condition.operator && condition.checks) {
          // Tableau pour stocker les résultats des vérifications
          const checkResults = [];
          
          // Vérifier chaque sous-condition
          for (const check of condition.checks) {
            if (check.cardId && check.present !== undefined) {
            const cardPresent = boardCardIds.includes(check.cardId);
              const result = (cardPresent === check.present);
              
              // Trouver le titre de la carte pour l'explication
              const cardTitle = allCards.find(c => c.id === check.cardId)
                ? getCardTitle(allCards.find(c => c.id === check.cardId)!)
                : `Carte #${check.cardId}`;
                
              checkResults.push({
              cardId: check.cardId,
                title: cardTitle,
              expected: check.present,
              actual: cardPresent,
                result
              });
              
              console.log(`Vérification de la sous-condition pour la carte ${check.cardId}:`);
              console.log(`- La carte est ${cardPresent ? "présente" : "absente"} sur le plateau`);
              console.log(`- La condition attend que la carte soit ${check.present ? "présente" : "absente"}`);
              console.log(`- Résultat: sous-condition ${result ? "remplie" : "non remplie"}`);
            }
          }
          
          // Appliquer l'opérateur logique
          if (condition.operator === "AND") {
            conditionMet = checkResults.every(check => check.result);
            console.log(`Opérateur AND: toutes les conditions doivent être remplies. Résultat: ${conditionMet ? "rempli" : "non rempli"}`);
          } else if (condition.operator === "OR") {
            conditionMet = checkResults.some(check => check.result);
            console.log(`Opérateur OR: au moins une condition doit être remplie. Résultat: ${conditionMet ? "rempli" : "non rempli"}`);
          }
          
          // Construire l'explication détaillée
          const checkDescriptions = checkResults.map(check => 
            `"${check.title}" ${check.expected ? 'présente' : 'absente'}: ${check.result ? '✓' : '✗'}`
          );
          
          conditionDescription = `Condition testée (${condition.operator}): ${checkDescriptions.join(' ET ')}`;
        }
        // Condition par défaut
        else if (condition.default) {
          conditionMet = true;
          conditionDescription = "Condition par défaut appliquée car aucune autre condition n'a été remplie.";
          console.log("Condition par défaut appliquée");
        }
        
        // Si la condition est remplie, stocker les effets à appliquer
        if (conditionMet && condition.effects) {
          effectsToApply = condition.effects;
          console.log("Effets à appliquer:", effectsToApply);
          break; // On a trouvé une condition qui s'applique, on arrête la recherche
        }
      }
      
      // Préparer le contenu de la carte et le résultat des conditions
      const cardTitle = getCardTitle(eventCard);
      const cardDescription = getCardDescription(eventCard);
      
      // Récupérer les informations supplémentaires
      const cardInfo = getCardInfo(eventCard);
      
      // Créer un message HTML pour afficher le contenu de la carte et le résultat des conditions
      let htmlMessage = `
        <div>
          <h3 style="font-weight: bold; margin-bottom: 8px; font-size: 16px;">${cardTitle}</h3>
          <p style="margin-bottom: 10px;">${cardDescription}</p>
      `;
      
      // Ajouter les informations complémentaires si elles existent
      if (cardInfo) {
        htmlMessage += `
          <div style="margin-top: 10px; padding: 8px; background-color: rgba(0,0,0,0.05); border-radius: 6px;">
            <h4 style="font-weight: bold; margin-bottom: 4px; font-size: 14px;">Informations complémentaires:</h4>
            <p style="font-size: 13px;">${cardInfo}</p>
          </div>
        `;
      }
      
      // Ajouter le résultat des conditions
      if (effectsToApply) {
        // Ajouter le message spécifique de la condition
        if (effectsToApply.message) {
          htmlMessage += `
            <p style="margin-bottom: 10px; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 8px;">
              ${effectsToApply.message}
            </p>
          `;
        } else {
          // Message par défaut si pas de message spécifique
          htmlMessage += `
            <p style="margin-bottom: 10px; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 8px;">
              ${conditionDescription}
            </p>
          `;
        }
        
        // Ajouter les badges d'impact
        htmlMessage += `
          <div style="display: flex; gap: 10px; margin-top: 5px;">
            ${effectsToApply.budget !== undefined ? 
              `<span style="padding: 3px 8px; border-radius: 12px; background-color: ${effectsToApply.budget >= 0 ? '#f44336' : '#4caf50'}; color: white; font-size: 12px;">
                ${effectsToApply.budget >= 0 ? '+' : ''}${effectsToApply.budget}K€
              </span>` : ''}
            ${effectsToApply.time !== undefined ? 
              `<span style="padding: 3px 8px; border-radius: 12px; background-color: ${effectsToApply.time >= 0 ? '#f44336' : '#4caf50'}; color: white; font-size: 12px;">
                ${effectsToApply.time >= 0 ? '+' : ''}${effectsToApply.time} jours
              </span>` : ''}
            ${effectsToApply.value !== undefined ? 
              `<span style="padding: 3px 8px; border-radius: 12px; background-color: #4caf50; color: white; font-size: 12px;">
                +${effectsToApply.value} points
              </span>` : ''}
          </div>
        `;
        
        // Stocker le résultat des conditions dans un attribut personnalisé de la carte
        const cardIndex = cards.findIndex(c => c.id === eventCard.id);
        if (cardIndex !== -1) {
          // Créer une copie de la carte avec les informations de condition
          const updatedCard = {
            ...cards[cardIndex],
            conditionResult: {
              message: effectsToApply.message || conditionDescription,
              budget: effectsToApply.budget,
              time: effectsToApply.time,
              value: effectsToApply.value,
              info: cardInfo, // Ajouter l'information complémentaire
              htmlContent: htmlMessage // Stocker le message HTML complet
            }
          };
          
          // Mettre à jour la carte dans le tableau
          const newCards = [...cards];
          newCards[cardIndex] = updatedCard;
          
          // Mettre à jour l'état global des cartes
          if (onMoveCard) {
            // Utiliser onMoveCard pour mettre à jour la carte (même si on ne change pas sa position)
            onMoveCard(eventCard.id, updatedCard.position || { x: 0, y: 0 });
            
            // Forcer la mise à jour de l'affichage du panneau latéral
            setTimeout(() => {
              // Fermer et rouvrir le panneau pour forcer le rafraîchissement
              const currentActiveCardId = activeCardId;
              setActiveCardId(null);
              setTimeout(() => {
                setActiveCardId(currentActiveCardId);
              }, 50);
            }, 100);
          }
        }
        
        // Appliquer les effets
        if (effectsToApply.budget !== undefined && onModifyBudget) {
          console.log(`Applying budget impact: ${effectsToApply.budget}K€`);
          onModifyBudget(effectsToApply.budget);
          
          // Afficher une animation pour l'impact sur le budget
          showCounterAnimation('budget', effectsToApply.budget);
        }
        
        // Appliquer l'impact sur le délai
        if (effectsToApply.time !== undefined && onModifyTime) {
          console.log(`Applying time impact: ${effectsToApply.time} days`);
          onModifyTime(effectsToApply.time);
          
          // Afficher une animation pour l'impact sur le délai
          showCounterAnimation('time', effectsToApply.time);
        }
        
        // Appliquer l'impact sur la valeur du projet
        if (effectsToApply.value !== undefined && onAddValuePoints) {
          console.log(`Applying value impact: ${effectsToApply.value} points`);
          // Vérifier que onAddValuePoints est bien une fonction
          if (typeof onAddValuePoints === 'function') {
            try {
              onAddValuePoints(effectsToApply.value); // Ne pas inverser le signe ici
              
              // Afficher une animation pour l'impact sur la valeur
              showCounterAnimation('points', effectsToApply.value);
              
              console.log(`${effectsToApply.value} points de valeur appliqués avec succès`);
            } catch (error) {
              console.error("Erreur lors de l'application des points de valeur:", error);
            }
          } else {
            console.error("onAddValuePoints n'est pas une fonction valide");
          }
        }
      } else {
        // Si aucune condition n'est remplie, afficher un message par défaut
        htmlMessage += `
          <p style="margin-bottom: 10px; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 8px;">
            Aucune condition n'a été remplie pour cette carte événement.
          </p>
        </div>
        `;
        
        // Stocker le message dans la carte
        const cardIndex = cards.findIndex(c => c.id === eventCard.id);
        if (cardIndex !== -1) {
          // Créer une copie de la carte avec les informations de condition
          const updatedCard = {
            ...cards[cardIndex],
            conditionResult: {
              message: "Aucune condition n'a été remplie pour cette carte événement.",
              info: cardInfo, // Ajouter l'information complémentaire
              htmlContent: htmlMessage
            }
          };
          
          // Mettre à jour la carte dans le tableau
          const newCards = [...cards];
          newCards[cardIndex] = updatedCard;
          
          // Mettre à jour l'état global des cartes
          if (onMoveCard) {
            // Utiliser onMoveCard pour mettre à jour la carte (même si on ne change pas sa position)
            onMoveCard(eventCard.id, updatedCard.position || { x: 0, y: 0 });
            
            // Forcer la mise à jour de l'affichage du panneau latéral
            setTimeout(() => {
              // Fermer et rouvrir le panneau pour forcer le rafraîchissement
              const currentActiveCardId = activeCardId;
              setActiveCardId(null);
              setTimeout(() => {
                setActiveCardId(currentActiveCardId);
              }, 50);
            }, 100);
          }
        }
      }
      
      // Ouvrir la carte dans le panneau latéral pour afficher les informations
      setActiveCardId(eventCard.id);
    } else {
      // Si la carte n'a pas de conditions, afficher un message d'erreur
      console.error("La carte événement n'a pas de conditions mais handleEventCardEffect a été appelé");
    }
  };

  // Fonction pour afficher une notification d'impact
  const showImpactNotification = (message: string) => {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.backgroundColor = '#ff9800';
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
    }, 5000);
  };
  
  // Fonction pour afficher une notification d'impact avec du HTML
  const showImpactNotificationHTML = (htmlMessage: string) => {
    // Créer un conteneur pour la notification
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.zIndex = '9999';
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s ease';
    
    // Créer la notification
    const notification = document.createElement('div');
    notification.innerHTML = htmlMessage;
    notification.style.backgroundColor = '#263238';
    notification.style.color = 'white';
    notification.style.padding = '20px';
    notification.style.borderRadius = '8px';
    notification.style.maxWidth = '500px';
    notification.style.width = '80%';
    notification.style.maxHeight = '80vh';
    notification.style.overflowY = 'auto';
    notification.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
    notification.style.fontSize = '14px';
    notification.style.lineHeight = '1.5';
    notification.style.position = 'relative';
    
    // Ajouter un bouton de fermeture
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '×';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '10px';
    closeButton.style.backgroundColor = 'transparent';
    closeButton.style.border = 'none';
    closeButton.style.color = 'white';
    closeButton.style.fontSize = '24px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.padding = '0';
    closeButton.style.width = '30px';
    closeButton.style.height = '30px';
    closeButton.style.display = 'flex';
    closeButton.style.justifyContent = 'center';
    closeButton.style.alignItems = 'center';
    closeButton.style.borderRadius = '50%';
    closeButton.style.transition = 'background-color 0.2s';
    
    closeButton.onmouseover = () => {
      closeButton.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    };
    
    closeButton.onmouseout = () => {
      closeButton.style.backgroundColor = 'transparent';
    };
    
    // Fonction pour fermer la notification
    const closeNotification = () => {
      overlay.style.opacity = '0';
    setTimeout(() => {
        if (document.body.contains(overlay)) {
          document.body.removeChild(overlay);
        }
      }, 300);
    };
    
    closeButton.onclick = closeNotification;
    
    // Fermer également en cliquant sur l'overlay
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        closeNotification();
      }
    };
    
    // Ajouter le bouton à la notification
    notification.appendChild(closeButton);
    
    // Ajouter la notification à l'overlay
    overlay.appendChild(notification);
    
    // Ajouter l'overlay au DOM
    document.body.appendChild(overlay);
    
    // Afficher la notification avec une animation
    setTimeout(() => {
      overlay.style.opacity = '1';
    }, 10);
    
    // Fermer automatiquement après 10 secondes
      setTimeout(() => {
      closeNotification();
    }, 10000);
  };

  // Fonction pour ajouter des points de valeur lorsqu'une réponse à un quiz est correcte
  const handleQuizCorrectAnswer = () => {
    console.log("=== RÉPONSE CORRECTE AU QUIZ ===");
    console.log("Tentative d'ajout de 10 points de valeur");
    
    if (!onAddValuePoints) {
      console.error("onAddValuePoints n'est pas défini");
      return;
    }

    try {
      // Ajouter 10 points pour une réponse correcte
      onAddValuePoints(10);
      console.log("10 points ajoutés avec succès");
      
      // Afficher une animation pour les points gagnés
      showCounterAnimation('points', 10);
      
      // Afficher une notification de succès
      showImpactNotification("Bonne réponse ! +10 points");
    } catch (error) {
      console.error("Erreur lors de l'ajout des points:", error);
      console.error("Détails de l'erreur:", {
        onAddValuePoints: !!onAddValuePoints,
        error: error instanceof Error ? error.message : error
      });
    }
  };

  // Fonction pour vérifier si une position est valide (pas de superposition)
  const isPositionValid = (x: number, y: number): boolean => {
    // Vérifier pour chaque carte existante
    for (const card of cards) {
      if (!card.position) continue;
      
      // Calculer les limites de la carte existante
      const cardLeft = card.position.x;
      const cardRight = card.position.x + CARD_WIDTH;
      const cardTop = card.position.y;
      const cardBottom = card.position.y + CARD_MIN_HEIGHT;
      
      // Calculer les limites de la nouvelle carte
      const newCardLeft = x;
      const newCardRight = x + CARD_WIDTH;
      const newCardTop = y;
      const newCardBottom = y + CARD_MIN_HEIGHT;
      
      // Vérifier s'il y a superposition
      if (
        newCardLeft < cardRight + 20 &&
        newCardRight > cardLeft - 20 &&
        newCardTop < cardBottom + 20 &&
        newCardBottom > cardTop - 20
      ) {
        return false; // Superposition détectée
      }
    }
    
    return true; // Pas de superposition
  };

  // Fonction pour obtenir la prochaine position disponible pour une carte
  const getNextAvailablePosition = () => {
    const boardWidth = boardRef.current?.clientWidth || 800;
    const boardHeight = boardRef.current?.clientHeight || 600;
    
    // Marge pour éviter de placer les cartes trop près des bords
    const margin = 50;
    
    // Espace minimum entre les cartes
    const minSpaceBetweenCards = 20;
    
    // Nombre maximum de tentatives pour trouver une position non superposée
    const maxAttempts = 50;
    
    // Essayer de trouver une position valide
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Générer une position aléatoire dans les limites du tableau
      const x = Math.max(margin, Math.min(boardWidth - CARD_WIDTH - margin, Math.random() * (boardWidth - CARD_WIDTH - 2 * margin) + margin));
      const y = Math.max(margin, Math.min(boardHeight - CARD_MIN_HEIGHT - margin, Math.random() * (boardHeight - CARD_MIN_HEIGHT - 2 * margin) + margin));
      
      // Vérifier si la position est valide
      if (isPositionValid(x, y)) {
        return { x, y };
      }
    }
    
    // Si aucune position valide n'a été trouvée après le nombre maximum de tentatives,
    // utiliser une stratégie de placement en grille
    const gridSpacing = CARD_WIDTH + minSpaceBetweenCards;
    const rowHeight = CARD_MIN_HEIGHT + minSpaceBetweenCards;
    
    // Calculer le nombre de cartes par ligne possible
    const cardsPerRow = Math.floor((boardWidth - 2 * margin) / gridSpacing);
    
    // Calculer la position en grille basée sur le nombre de cartes
    const cardIndex = cards.length;
    const row = Math.floor(cardIndex / cardsPerRow);
    const col = cardIndex % cardsPerRow;
    
    // Calculer les coordonnées finales
    const gridX = margin + col * gridSpacing;
    const gridY = margin + row * rowHeight;
    
    // Vérifier si la position en grille est dans les limites du tableau
    if (gridY + CARD_MIN_HEIGHT > boardHeight - margin) {
      // Si on dépasse la hauteur du tableau, placer la carte au centre avec un décalage
      return {
        x: boardWidth / 2 - CARD_WIDTH / 2 + (cardIndex % 5) * 10,
        y: boardHeight / 2 - CARD_MIN_HEIGHT / 2 + (cardIndex % 5) * 10
      };
    }
    
    return { x: gridX, y: gridY };
  };

  // Fonction pour gérer les cartes aléatoires sélectionnées
  const handleRandomCardSelected = (card: Card) => {
    console.log("=== CARTE ALÉATOIRE SÉLECTIONNÉE ===");
    console.log("Carte ID:", card.id);
    console.log("Type:", getCardType(card));
    console.log("Titre:", getCardTitle(card));
    console.log("Valeur:", card.value);
    console.log("Carte complète:", JSON.stringify(card));
    console.log("allUsedCards avant:", allUsedCards);
    
    // Créer une copie complète de la carte pour préserver tous les attributs
    const cardCopy = JSON.parse(JSON.stringify(card));
    
    // Ajouter la carte à la liste de toutes les cartes tirées
    if (!allUsedCards.includes(card.id)) {
      setAllUsedCards(prev => {
        const newAllUsedCards = [...prev, card.id];
        console.log("allUsedCards après:", newAllUsedCards);
        return newAllUsedCards;
      });
      debugLog(`Random card ${card.id} added to allUsedCards. Total: ${allUsedCards.length + 1}`);
    } else {
      console.log("La carte est déjà dans allUsedCards");
    }
    
    // Transmettre la carte au parent si nécessaire
    if (onRandomCardSelected) {
      console.log("Avant onRandomCardSelected - cardCopy:", cardCopy);
      console.log("Avant onRandomCardSelected - value:", cardCopy.value);
      
      onRandomCardSelected(cardCopy);
      
      console.log("Après onRandomCardSelected");
    }
  };

  // Fonction pour afficher une carte dans une jolie Box modale
  const displayCardInModal = (card: Card) => {
    console.log("=== AFFICHAGE CARTE DANS MODAL ===");
    console.log("Type:", getCardType(card));
    console.log("Titre:", getCardTitle(card));
    console.log("A des conditions:", hasCardConditions(card));
    
    // Afficher toutes les propriétés de la carte pour déboguer
    console.log("Toutes les propriétés de la carte dans displayCardInModal:");
    for (const prop in card) {
      console.log(`${prop}: ${JSON.stringify(card[prop])}`);
    }
    
    // Convertir le coût en nombre si c'est une chaîne
    const cost = (card as any)['coût'];
    const costValue = typeof cost === 'string' ? 
      parseInt(cost.replace(/[^0-9-]/g, '')) : 
      typeof cost === 'number' ? 
        cost : 
        0;

    // Convertir le délai en nombre si c'est une chaîne
    const delay = (card as any)['délai'];
    const delayValue = typeof delay === 'string' ? 
      parseInt(delay.replace(/[^0-9-]/g, '')) : 
      typeof delay === 'number' ? 
        delay : 
        0;

    // Récupérer les informations supplémentaires
    const cardInfo = getCardInfo(card);

    // Essayer de récupérer la valeur de différentes façons
    const valueImpact = card.value !== undefined ? card.value : 
                       typeof card['value'] === 'number' ? card['value'] : 
                       typeof card['valeur'] === 'number' ? card['valeur'] : undefined;
    
    console.log("Card dans displayCardInModal:", card);
    console.log("valueImpact:", valueImpact);
    
    // Appliquer directement l'impact sur la valeur si c'est une carte action sans condition
    // ou une carte action avec une valeur directe (hors conditions)
    if (getCardType(card) === 'action' && valueImpact !== undefined && !isCardOnBoard(card.id)) {
      console.log("=== APPLICATION DIRECTE DE L'IMPACT VALEUR ===");
      console.log(`Applying direct value impact: ${valueImpact} points`);
      
      if (onAddValuePoints && typeof onAddValuePoints === 'function') {
        try {
          onAddValuePoints(valueImpact);
          // Afficher une animation pour l'impact sur la valeur
          showCounterAnimation('points', valueImpact);
          console.log(`${valueImpact} points de valeur directement appliqués avec succès`);
        } catch (error) {
          console.error("Erreur lors de l'application directe des points de valeur:", error);
        }
      }
    }

    // Variables pour stocker les informations de condition
    let conditionResult = null;
    let finalConditions = [];

    // Vérifier si la carte a des conditions et n'est pas déjà sur le tableau
    // Uniquement pour les nouvelles cartes ajoutées (pas les cartes déjà placées)
    if (hasCardConditions(card) && !isCardOnBoard(card.id)) {
      console.log("Processing conditions for new card in displayCardInModal");
      conditionResult = handleActionCardConditions(card);
      
      // Si une condition s'applique, utiliser seulement celle-ci pour l'affichage
      if (conditionResult && conditionResult.appliedCondition) {
        finalConditions = [conditionResult.appliedCondition];
        
        // Appliquer les effets
        if (conditionResult.effectsToApply) {
          tempDisplayCardDetails(card, conditionResult.effectsToApply, conditionResult.conditionDescription);
        }
      }
    } else if (hasCardConditions(card)) {
      // Pour les cartes déjà sur le plateau, afficher toutes les conditions pour information
      finalConditions = card.conditions || [];
    } else {
      // Pas de conditions
      finalConditions = [];
    }

    // Mettre à jour les compteurs
    setModalContent({
      title: getCardTitle(card),
      description: getCardDescription(card),
      cost: costValue,
      delay: delayValue,
      type: getCardType(card),
      domain: getCardDomain(card),
      phase: getCardPhase(card),
      options: card.options || [],
      correct_answer: card.correct_answer || '',
      comment: card.comment || '',
      conditions: finalConditions, // Utiliser les conditions filtrées
      info: cardInfo || '',
      value: valueImpact,
      conditionResult: conditionResult // Ajouter le résultat de la condition pour l'affichage
    });
    setShowModal(true);
  };

  // Fonction pour afficher une carte action dans une fenêtre
  const displayActionCard = (actionCard: Card) => {
    console.log("=== AFFICHAGE CARTE ACTION ===");
    console.log("Carte:", getCardTitle(actionCard));
    
    // Utiliser la nouvelle fonction pour afficher la carte dans une jolie Box modale
    displayCardInModal(actionCard);
    
    // Stocker le contenu HTML dans la carte pour référence future
    const cardIndex = cards.findIndex(c => c.id === actionCard.id);
    if (cardIndex !== -1) {
      // Créer une copie de la carte avec les informations
      const updatedCard = {
        ...cards[cardIndex],
        conditionResult: {
          message: getCardDescription(actionCard),
          htmlContent: getCardDescription(actionCard)
        }
      };
      
      // Mettre à jour la carte dans le tableau
      const newCards = [...cards];
      newCards[cardIndex] = updatedCard;
      
      // Mettre à jour l'état global des cartes
      if (onMoveCard) {
        // Utiliser onMoveCard pour mettre à jour la carte (même si on ne change pas sa position)
        onMoveCard(actionCard.id, updatedCard.position || { x: 0, y: 0 });
      }
    }
  };

  // Fonction pour afficher une carte dans une jolie Box modale (pour les cartes action avec conditions)
  const tempDisplayCardDetails = (actionCard: Card, effectsToApply: any, conditionDescription: string) => {
    console.log("=== APPLICATION DES EFFETS DE CONDITION ===");
    console.log("Carte:", getCardTitle(actionCard));
    console.log("Effets à appliquer:", effectsToApply);
    
    // Stocker le résultat des conditions dans un attribut personnalisé de la carte
    const cardIndex = cards.findIndex(c => c.id === actionCard.id);
    if (cardIndex !== -1) {
      // Créer une copie de la carte avec les informations de condition
      const updatedCard = {
        ...cards[cardIndex],
        conditionResult: {
          message: effectsToApply?.message || conditionDescription,
          budget: effectsToApply?.budget,
          time: effectsToApply?.time,
          value: effectsToApply?.value
        }
      };
      
      // Mettre à jour la carte dans le tableau
      const newCards = [...cards];
      newCards[cardIndex] = updatedCard;
      
      // Mettre à jour l'état global des cartes
      if (onMoveCard) {
        // Utiliser onMoveCard pour mettre à jour la carte (même si on ne change pas sa position)
        onMoveCard(actionCard.id, updatedCard.position || { x: 0, y: 0 });
      }
    }
    
    // Appliquer les effets dans l'ordre : budget, temps, valeur
    if (effectsToApply) {
      console.log("Applying effects:", effectsToApply);
      
      // Appliquer l'impact sur le budget si nécessaire
      if (effectsToApply.budget !== undefined && onModifyBudget) {
        console.log(`Applying budget impact: ${effectsToApply.budget}K€`);
        onModifyBudget(effectsToApply.budget);
        showCounterAnimation('budget', effectsToApply.budget);
      }
      
      // Appliquer l'impact sur le délai si nécessaire
      if (effectsToApply.time !== undefined && onModifyTime) {
        console.log(`Applying time impact: ${effectsToApply.time} days`);
        onModifyTime(effectsToApply.time);
        showCounterAnimation('time', effectsToApply.time);
      }
      
      // Appliquer l'impact sur la valeur du projet si nécessaire
      if (effectsToApply.value !== undefined && onAddValuePoints) {
        console.log(`Applying value impact: ${effectsToApply.value} points`);
        // Vérifier que onAddValuePoints est bien une fonction
        if (typeof onAddValuePoints === 'function') {
          try {
            onAddValuePoints(effectsToApply.value); // Ne pas inverser le signe ici
            
            // Afficher une animation pour l'impact sur la valeur
            showCounterAnimation('points', effectsToApply.value);
            
            console.log(`${effectsToApply.value} points de valeur appliqués avec succès`);
          } catch (error) {
            console.error("Erreur lors de l'application des points de valeur:", error);
          }
        } else {
          console.error("onAddValuePoints n'est pas une fonction valide");
        }
      }
    }
  };

  // Sauvegarder l'état du jeu dans le localStorage
  useEffect(() => {
    if (!cards.length) return; // Ne pas sauvegarder si aucune carte n'est présente
    
    const gameData = {
      cards,
      usedCards,
      allUsedCards,
      gameState,
      currentPhase,
      cardUsage,
      remainingTurns
    };
    
    localStorage.setItem('projectManagerGameData', JSON.stringify(gameData));
    debugLog('Game data saved to localStorage');
  }, [cards, usedCards, allUsedCards, gameState, currentPhase, cardUsage, remainingTurns]);
  
  // Fonction pour réinitialiser le jeu
  const handleResetGame = () => {
    // Afficher une confirmation avant de réinitialiser
    if (window.confirm('Êtes-vous sûr de vouloir recommencer une nouvelle partie ? Toutes vos données actuelles seront perdues.')) {
      // Supprimer les données du localStorage
      localStorage.removeItem('projectManagerGameData');
      
      // Appeler le callback de réinitialisation
      if (onResetGame) {
        onResetGame();
      }
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div 
        ref={boardRef}
        className={containerClasses}
        style={boardContainerStyle}
        onMouseMove={handleMouseMove}
      >
        {/* Board header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Tableau de Projet
              {debugMode && <span className="text-xs text-red-500 ml-2">[DEBUG MODE]</span>}
            </h2>
            <div className="flex items-center gap-3 mt-3">
              {/* Boutons d'ajout de cartes */}
              <div className="flex items-center gap-3">
              <button
                  onClick={() => {
                    setSelectedCardType('action');
                    setShowCardSelector(true);
                  }}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg 
                           text-sm font-medium transition-all duration-200 flex items-center shadow-md"
                >
                  <span className="mr-2">🛠️</span>
                  Actions ({cardLimits.action - cardUsage.action} restantes)
              </button>
                
                {debugMode && (
                  <>
                    <button
                      onClick={() => {
                        setSelectedCardType('event');
                        setShowCardSelector(true);
                      }}
                      className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg 
                               text-sm font-medium transition-all duration-200 flex items-center shadow-md"
                    >
                      <span className="mr-2">🎭</span>
                      Événements ({cardLimits.event - cardUsage.event} restantes)
                    </button>
                    
                    <button
                      onClick={() => {
                        setSelectedCardType('quiz');
                        setShowCardSelector(true);
                      }}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg 
                               text-sm font-medium transition-all duration-200 flex items-center shadow-md"
                    >
                      <span className="mr-2">❓</span>
                      Quiz ({cardLimits.quiz - cardUsage.quiz} restantes)
                    </button>
                  </>
                )}
              </div>
                            
              {/* Roue de cartes aléatoires */}
              <RandomCardWheel 
                cards={allCards} 
                currentPhase={currentPhase}
                onCardEffect={handleEventCardEffect}
                onQuizCorrectAnswer={handleQuizCorrectAnswer}
                debugMode={debugMode}
                onCardSelected={handleRandomCardSelected}
                cardLimits={cardLimits}
                cardUsage={cardUsage}
                usedCards={allUsedCards}
              />

                {/* Bouton pour passer à l'étape jalon */}
                {remainingTurns === 0 && onMilestoneStep && (
                <button
                    onClick={onMilestoneStep}
                    className="pulse-attention-button px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg 
                             text-sm font-medium transition-all duration-200 flex items-center shadow-md"
                >
                    <span className="mr-2">✨</span>
                    Passer à la prochaine phase projet
                </button>
              )}
                
            </div>
          </div>
        </div>
        
        {/* Board area - Updated to keep it white */}
        <div
          className="relative bg-white/90 backdrop-blur-sm rounded-xl h-full p-4 overflow-hidden shadow-lg"
        >
          {/* Board cards */}
          {cards.map((card) => {
            const colors = getCardColors(getCardDomain(card) || "");
            return (
              <div
                key={card.id}
                data-card-id={card.id}
                    className={`absolute p-3 rounded-xl shadow-lg transition-all cursor-move backdrop-blur-sm
                              ${colors.bg} ${colors.text} 
                              ${activeCardId === card.id ? 'ring-2 ring-white' : ''}
                              hover:shadow-xl transform hover:scale-105`}
                style={{
                  width: `${CARD_WIDTH}px`,
                        minHeight: `${CARD_MIN_HEIGHT}px`,
                        height: 'auto',
                  left: card.position?.x || 0,
                  top: card.position?.y || 0,
                  zIndex: draggingCard === card.id ? 10 : 1,
                  transform: draggingCard === card.id ? 'scale(1.05)' : 'scale(1)',
                        transition: draggingCard === card.id ? 'none' : 'all 0.2s ease-in-out'
                }}
                onMouseDown={(e) => handleCardMouseDown(e, card.id)}
                onMouseEnter={() => setHoveredCard(card)}
                onMouseLeave={() => setHoveredCard(null)}
                    onClick={(e) => {
                      if (!isDragging) {
                        handleCardClick(card.id, e);
                      }
                    }}
                >
                    <div className="flex flex-col h-full justify-center items-center">
                        <div className="text-sm font-medium text-center">
                  {getCardTitle(card)}
                </div>
                    </div>
              </div>
            );
          })}
          
          {/* Message d'état vide */}
          {cards.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center p-6 bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg text-white">
                <div className="text-5xl mb-4">🎴</div>
                <p className="text-xl font-medium">Ajoutez des cartes pour commencer</p>
                <p className="mt-2 text-white/70">Utilisez les boutons ci-dessus pour ajouter des cartes au tableau</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card selector modal */}
      {showCardSelector && <CardSelectorPanel />}
      
      {/* Detail side panel */}
      {activeCardId && (
        <DetailSidePanel
          activeCardId={activeCardId}
          cards={cards}
          getCardColors={getCardColors}
          onClose={() => setActiveCardId(null)}
          allCards={allCards}
        />
      )}

      {/* Modal pour afficher les détails de la carte */}
      {showModal && modalContent && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            // Si on clique sur le fond (pas sur le contenu), fermer la modale
            if (e.target === e.currentTarget) {
              setShowModal(false);
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="p-6 overflow-y-auto">
              <div className="flex justify-between items-start mb-4 sticky top-0 bg-white z-10 pb-2">
                <h3 className="text-xl font-bold text-gray-900">{modalContent.title}</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100 p-2 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="prose max-w-none">
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <ReactMarkdown>{modalContent.description}</ReactMarkdown>
                  
                  {/* Affichage des badges pour tous les types de cartes */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {/* Badge de coût (tous types de cartes) */}
                    {modalContent.cost !== 0 && (
                      <span className={`px-2 py-1 rounded text-sm ${
                        modalContent.cost > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        Coût: {modalContent.cost > 0 ? '+' : ''}{modalContent.cost}K€
                      </span>
                    )}
                    {/* Badge de délai (tous types de cartes) */}
                    {modalContent.delay !== 0 && (
                      <span className={`px-2 py-1 rounded text-sm ${
                        modalContent.delay > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        Délai: {modalContent.delay > 0 ? '+' : ''}{modalContent.delay} semaines
                      </span>
                    )}
                    {/* Badge d'impact valeur (tous types de cartes) */}
                    {((modalContent.value !== undefined && modalContent.value !== 0) || 
                      (modalContent.conditions && modalContent.conditions.some(condition => 
                        condition.effects && condition.effects.value !== undefined
                      ))) && (
                      <span className={`px-2 py-1 rounded text-sm ${
                        (modalContent.value !== undefined && modalContent.value < 0) || 
                        (modalContent.conditions && modalContent.conditions.some(condition => 
                          condition.effects && condition.effects.value !== undefined && condition.effects.value < 0
                        ))
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        Valeur: {
                          (() => {
                            // D'abord vérifier la valeur directe
                            if (modalContent.value !== undefined && modalContent.value !== 0) {
                              return modalContent.value > 0 ? `+${modalContent.value}` : modalContent.value;
                            }
                            // Sinon, chercher dans les conditions
                            const effect = modalContent.conditions?.find(c => c.effects && c.effects.value !== undefined);
                            if (effect) {
                              const value = effect.effects.value;
                              return value > 0 ? `+${value}` : value;
                            }
                            return "0"; // Fallback si aucune valeur trouvée
                          })()
                        } points
                      </span>
                    )}
                  </div>
                </div>
                
                                {/* Affichage des conditions pour les cartes d'action */}
                {modalContent.type === 'action' && modalContent.conditionResult && modalContent.conditionResult.appliedCondition && (
                  <div className="mt-4">
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <h4 className="font-semibold text-green-800 mb-2">✅ Condition appliquée</h4>
                      
                      {/* Message de la condition */}
                      {modalContent.conditionResult.conditionDescription && (
                        <p className="text-green-700 mb-3 text-sm">
                          {modalContent.conditionResult.conditionDescription}
                        </p>
                      )}

                      {/* Message personnalisé de l'effet */}
                      {modalContent.conditionResult.effectsToApply?.message && (
                        <p className="text-green-800 mb-3 font-medium">
                          {modalContent.conditionResult.effectsToApply.message}
                        </p>
                      )}

                      {/* Badges des effets appliqués */}
                      {modalContent.conditionResult.effectsToApply && (
                        <div className="flex flex-wrap gap-2">
                          {modalContent.conditionResult.effectsToApply.budget !== undefined && (
                            <span className={`px-2 py-1 rounded text-sm ${
                              modalContent.conditionResult.effectsToApply.budget > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                            }`}>
                              Budget: {modalContent.conditionResult.effectsToApply.budget > 0 ? '+' : ''}{modalContent.conditionResult.effectsToApply.budget}K€
                            </span>
                          )}
                          {modalContent.conditionResult.effectsToApply.time !== undefined && (
                            <span className={`px-2 py-1 rounded text-sm ${
                              modalContent.conditionResult.effectsToApply.time > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                            }`}>
                              Délai: {modalContent.conditionResult.effectsToApply.time > 0 ? '+' : ''}{modalContent.conditionResult.effectsToApply.time} jours
                            </span>
                          )}
                          {modalContent.conditionResult.effectsToApply.value !== undefined && (
                            <span className={`px-2 py-1 rounded text-sm ${
                              modalContent.conditionResult.effectsToApply.value > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              Valeur: {modalContent.conditionResult.effectsToApply.value > 0 ? '+' : ''}{modalContent.conditionResult.effectsToApply.value} points
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Affichage des conditions pour les autres types de cartes (affichage complet pour information) */}
                {modalContent.type !== 'action' && modalContent.conditions && modalContent.conditions.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <h4 className="font-semibold text-gray-800">Conditions possibles</h4>
                    {modalContent.conditions.map((condition, index) => (
                      <div key={index} className="bg-blue-50 rounded-lg p-3">
                        {condition.cardId && (
                          <p className="text-sm text-blue-800">
                            Requiert : <span className="font-medium">"{allCards.find(c => c.id === condition.cardId)?.title || `Carte #${condition.cardId}`}"</span>
                            <span className="text-blue-600 ml-1">
                              ({condition.present ? 'présente' : 'absente'})
                            </span>
                          </p>
                        )}

                        {condition.operator && condition.checks && (
                          <div className="text-sm">
                            <p className="text-blue-800">
                              Requiert {condition.operator === 'AND' ? 'toutes' : 'au moins une'} :
                            </p>
                            <div className="ml-2 space-y-1 mt-1">
                              {condition.checks.map((check, checkIndex) => (
                                <p key={checkIndex} className="text-blue-800">
                                  • "{allCards.find(c => c.id === check.cardId)?.title || `Carte #${check.cardId}`}"
                                  <span className="text-blue-600 ml-1">
                                    ({check.present ? 'présente' : 'absente'})
                                  </span>
                                </p>
                              ))}
                            </div>
                          </div>
                        )}

                        {condition.effects && (
                          <div className="mt-2 bg-white/50 rounded p-2 text-sm">
                            {condition.effects.message && (
                              <p className="text-gray-700 mb-2">{condition.effects.message}</p>
                            )}
                            <div className="flex flex-wrap gap-2">
                              {condition.effects.budget !== undefined && (
                                <span className={`px-2 py-1 rounded ${
                                  condition.effects.budget > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                }`}>
                                  Budget: {condition.effects.budget > 0 ? '+' : ''}{condition.effects.budget}K€
                                </span>
                              )}
                              {condition.effects.time !== undefined && (
                                <span className={`px-2 py-1 rounded ${
                                  condition.effects.time > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                }`}>
                                  Délai: {condition.effects.time > 0 ? '+' : ''}{condition.effects.time} jours
                                </span>
                              )}
                              {condition.effects.value !== undefined && (
                                <span className={`px-2 py-1 rounded ${
                                  condition.effects.value > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  Valeur: {condition.effects.value > 0 ? '+' : ''}{condition.effects.value} points
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
          
                {modalContent.info && (
                  <div className="mt-4 bg-gray-50 rounded-lg p-3 text-sm">
                    <h4 className="font-semibold mb-1">Informations complémentaires</h4>
                    <ReactMarkdown components={markdownComponents}>{modalContent.info}</ReactMarkdown>
              </div>
                )}
                
                {/* Affichage spécifique pour les cartes événement */}
                {modalContent.type === 'event' && (
                  <div className="mt-4 bg-purple-50 rounded-lg p-3 text-sm">
                    <h4 className="font-semibold mb-1 text-purple-800">Carte événement</h4>
                    {modalContent.info && (
                      <div className="mt-2">
                        <h5 className="font-medium text-purple-700">Informations complémentaires:</h5>
                        <ReactMarkdown components={markdownComponents}>{modalContent.info}</ReactMarkdown>
                      </div>
                    )}
            </div>
          )}
        </div>
      </div>

            <div className="bg-gray-50 px-6 py-3 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameBoard; 