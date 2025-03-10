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
}

type CardType = 'action' | 'event' | 'quiz';

// Debug mode flag - set to true to enable debug mode
const DEBUG_MODE = false;

// Constantes pour les dimensions des cartes
const CARD_WIDTH = 180;
const CARD_MIN_HEIGHT = 100;
const CARD_MARGIN = 4;
const BOARD_PADDING = 8;

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
  onRandomCardSelected
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
        currentPhase
      });
    }
  }, [debugMode, cards, allCards, currentPhase]);
  
  // Ajouter un effet pour vérifier les cartes au chargement du composant
  useEffect(() => {
    console.log("GameBoard mounted or updated");
    console.log("allCards length:", allCards.length);
    console.log("cards on board length:", cards.length);
    
    if (allCards.length === 0) {
      console.warn("No cards were passed to the GameBoard component!");
    }
  }, [allCards, cards]);

  // Approche complètement revue pour le déplacement des cartes
  const handleCardMouseDown = (e: React.MouseEvent, cardId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
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
  
  // Fonction de déplacement complètement revue pour un mouvement 1:1 avec la souris
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingCard || !isDragging || !boardRef.current) return;
    
    // Calculer le delta (différence) du mouvement de la souris
    const deltaX = e.clientX - mouseStartPosition.x;
    const deltaY = e.clientY - mouseStartPosition.y;
    
    // Calculer la nouvelle position en ajoutant le delta à la position initiale de la carte
    let newX = cardStartPosition.x + deltaX;
    let newY = cardStartPosition.y + deltaY;
    
    // Obtenir les dimensions du tableau et de la carte
    const boardRect = boardRef.current.getBoundingClientRect();
    const cardElement = document.querySelector(`[data-card-id="${draggingCard}"]`) as HTMLElement;
    const cardHeight = cardElement ? cardElement.offsetHeight : CARD_MIN_HEIGHT;
    
    // Limiter aux bords du tableau (sans transformer la position)
    newX = Math.max(0, Math.min(newX, boardRect.width - CARD_WIDTH));
    newY = Math.max(0, Math.min(newY, boardRect.height - cardHeight));
    
    // Mettre à jour la position
    setCurrentPosition({ x: newX, y: newY });
    onMoveCard(draggingCard, { x: newX, y: newY });
  };
  
  // Mise à jour similaire de handleGlobalMouseMove
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!draggingCard || !isDragging || !boardRef.current) return;
      
      // Calculer le delta (différence) du mouvement de la souris
      const deltaX = e.clientX - mouseStartPosition.x;
      const deltaY = e.clientY - mouseStartPosition.y;
      
      // Calculer la nouvelle position en ajoutant le delta à la position initiale de la carte
      let newX = cardStartPosition.x + deltaX;
      let newY = cardStartPosition.y + deltaY;
      
      // Obtenir les dimensions du tableau et de la carte
      const boardRect = boardRef.current.getBoundingClientRect();
      const cardElement = document.querySelector(`[data-card-id="${draggingCard}"]`) as HTMLElement;
      const cardHeight = cardElement ? cardElement.offsetHeight : CARD_MIN_HEIGHT;
      
      // Limiter aux bords du tableau (sans transformer la position)
      newX = Math.max(0, Math.min(newX, boardRect.width - CARD_WIDTH));
      newY = Math.max(0, Math.min(newY, boardRect.height - cardHeight));
      
      // Mettre à jour la position
      setCurrentPosition({ x: newX, y: newY });
      onMoveCard(draggingCard, { x: newX, y: newY });
    };
    
    const handleGlobalMouseUp = () => {
      if (draggingCard) {
        setDraggingCard(null);
        setIsDragging(false);
        document.body.style.cursor = 'auto';
      }
    };
    
    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, draggingCard, mouseStartPosition, cardStartPosition, onMoveCard]);

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
    
    // Create a list of all IDs on the board for easier debugging
    const boardCardIds = cards.filter(c => c.id).map(card => card.id);
    
    if (debugMode) {
      debugLog("All board card IDs:", boardCardIds);
      debugLog("Checking if card ID exists:", cardId);
      
      // Look for exact matches
      const exactMatch = boardCardIds.includes(cardId);
      
      // Look for partial matches (in case of ID formatting issues)
      const partialMatches = boardCardIds.filter(id => 
        id && cardId && (id.includes(cardId) || cardId.includes(id))
      );
      
      debugLog(`Exact match found: ${exactMatch}`);
      if (partialMatches.length > 0) {
        debugLog(`Partial matches found: ${partialMatches.join(', ')}`);
      }
      
      // If we find an exact match, show the matching card for verification
      if (exactMatch) {
        const matchingCard = cards.find(c => c.id === cardId);
        debugLog("Matching card on board:", matchingCard);
      }
    }
    
    // Only return true if there's an exact ID match
    return boardCardIds.includes(cardId);
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
    
    // Créer une copie de la carte avec la nouvelle position
    const newCard = {
      ...card,
      position
    };
    
    // Ajouter la carte au tableau
    if (onSelectCard) {
      onSelectCard(newCard);
      
      // Mettre à jour le compteur de cartes utilisées
      if (cardType && cardUsage) {
        debugLog(`Incrementing card usage for type ${cardType}. Before: ${cardUsage[cardType]}`);
      }
    }
    
    // Fermer le sélecteur de cartes si ce n'est pas une carte action ou si la touche Alt n'est pas enfoncée
    if (cardType !== 'action' || altKeyPressed) {
      setShowCardSelector(false);
    }
  };
  
  // Fonction pour ajouter toutes les cartes action sélectionnées
  const handleAddSelectedActionCards = () => {
    if (selectedActionCards.length === 0) {
      showImpactNotification("Aucune carte action sélectionnée");
      return;
    }
    
    // Vérifier les limites de cartes
    const remainingActionSlots = cardLimits.action - cardUsage.action;
    if (selectedActionCards.length > remainingActionSlots) {
      showImpactNotification(`Vous ne pouvez ajouter que ${remainingActionSlots} cartes action supplémentaires`);
      return;
    }
    
    // Ajouter chaque carte sélectionnée
    selectedActionCards.forEach(card => {
      if (!isCardOnBoard(card.id)) {
        const position = getNextAvailablePosition();
        const newCard = { ...card, position };
        if (onSelectCard) {
          onSelectCard(newCard);
        }
      }
    });
    
    // Réinitialiser la sélection et fermer le sélecteur
    setSelectedActionCards([]);
    setShowCardSelector(false);
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
      const cardType = getCardType(card);
      
      if (cardType === 'action') {
        // Pour les cartes action, ajouter/retirer de la sélection
        setSelectedActionCards(prev => {
          const isAlreadySelected = prev.some(c => c.id === card.id);
          if (isAlreadySelected) {
            return prev.filter(c => c.id !== card.id);
          } else {
            return [...prev, card];
          }
        });
      } else {
        // Pour les autres types, ajouter directement au tableau
        handleAddCard(card);
      }
    };
    
    // Vérifier si une carte est sélectionnée
    const isCardSelected = (cardId: string) => {
      return selectedActionCards.some(card => card.id === cardId);
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
                  setSelectedActionCards([]);
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
                Cliquez sur une carte pour l'ajouter au tableau.
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
          </div>
          
          {/* Afficher le nombre de cartes sélectionnées et le bouton d'ajout pour les cartes action */}
          {localSelectedType === 'action' && selectedActionCards.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg flex justify-between items-center">
              <span className="text-blue-700 font-medium">
                {selectedActionCards.length} carte{selectedActionCards.length > 1 ? 's' : ''} sélectionnée{selectedActionCards.length > 1 ? 's' : ''}
              </span>
              <button
                onClick={handleAddSelectedActionCards}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium"
              >
                Ajouter les cartes sélectionnées
              </button>
            </div>
          )}
          
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
                          
                          {localSelectedType === 'action' && (
                            <div className={`w-5 h-5 rounded-full border ${
                              isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                            } flex items-center justify-center`}>
                              {isSelected && (
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {getCardDescription(card)}
                        </p>
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

  // Fonction pour gérer le clic sur une carte du tableau
  const handleCardClick = (cardId: string) => {
    // Ne pas ouvrir le panneau si on est en train de déplacer la carte
    if (isDragging || draggingCard) return;
    
    // Trouver la carte correspondante
    const card = cards.find(c => c.id === cardId);
    if (!card) return;
    
    debugLog("Card clicked:", cardId);
    
    // Ouvrir ou fermer le panneau latéral
    setActiveCardId(activeCardId === cardId ? null : cardId);
  };

  // Utiliser le composant DetailSidePanel importé
  const renderDetailSidePanel = () => {
    return (
      <DetailSidePanel
        activeCardId={activeCardId}
        cards={cards}
        getCardColors={getCardColors}
        onClose={() => setActiveCardId(null)}
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
    console.log("=== ÉVÉNEMENT DÉCLENCHÉ ===");
    console.log("Carte complète:", JSON.stringify(eventCard, null, 2));
    console.log("Type:", getCardType(eventCard));
    console.log("Titre:", getCardTitle(eventCard));
    console.log("A des conditions:", hasCardConditions(eventCard));
    console.log("Conditions brutes:", eventCard.conditions);
    
    // Vérifier si la carte a des conditions
    if (hasCardConditions(eventCard)) {
      console.log("Conditions détectées:", JSON.stringify(getCardConditions(eventCard), null, 2));
      
      // Récupérer les IDs des cartes actuellement sur le plateau
      const boardCardIds = cards.map(card => card.id);
      console.log("Cartes sur le plateau:", boardCardIds);
      
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
            
          console.log(`Condition pour carte ${condition.cardId} (présente: ${condition.present}): ${conditionMet}`);
        }
        // Condition avec opérateur logique
        else if (condition.operator && condition.checks) {
          const checkResults = condition.checks.map(check => {
            const cardPresent = boardCardIds.includes(check.cardId);
            return {
              cardId: check.cardId,
              expected: check.present,
              actual: cardPresent,
              result: cardPresent === check.present
            };
          });
          
          if (condition.operator === "AND") {
            conditionMet = checkResults.every(check => check.result);
          } else if (condition.operator === "OR") {
            conditionMet = checkResults.some(check => check.result);
          }
          
          // Construire l'explication détaillée
          const checkDescriptions = checkResults.map(check => {
            const cardTitle = allCards.find(c => c.id === check.cardId)
              ? getCardTitle(allCards.find(c => c.id === check.cardId)!)
              : `Carte #${check.cardId}`;
              
            return `"${cardTitle}" ${check.expected ? 'présente' : 'absente'}: ${check.result ? '✓' : '✗'}`;
          });
          
          conditionDescription = `Condition testée (${condition.operator}): ${checkDescriptions.join(' ET ')}`;
          console.log(`Condition avec opérateur ${condition.operator}: ${conditionMet}`);
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
      
      // Appliquer les effets si une condition a été remplie
      if (effectsToApply) {
        // Appliquer l'impact sur le budget
        if (effectsToApply.budget !== undefined && onModifyBudget) {
          console.log(`Applying cost impact: ${effectsToApply.budget}K€`);
          onModifyBudget(effectsToApply.budget);
          
          // Afficher une animation pour l'impact sur le coût
          showCounterAnimation('budget', effectsToApply.budget);
        }
        
        // Appliquer l'impact sur le délai
        if (effectsToApply.time !== undefined && onModifyTime) {
          console.log(`Applying time impact: ${effectsToApply.time} months`);
          onModifyTime(effectsToApply.time);
          
          // Afficher une animation pour l'impact sur le délai
          showCounterAnimation('time', effectsToApply.time);
        }
        
        return; // Sortir de la fonction après avoir appliqué les effets conditionnels
      }
    }
    
    // Traitement standard si pas de conditions ou si aucune condition n'est remplie
    // Appliquer les impacts sur le coût et le délai
    if (eventCard.coût) {
      // Extraire la valeur numérique du coût (peut être positif ou négatif)
      const costMatch = eventCard.coût.match(/([+-]?\d+)/);
      if (costMatch && costMatch[1] && onModifyBudget) {
        const costImpact = parseInt(costMatch[1], 10);
        console.log(`Applying cost impact: ${costImpact}K€`);
        onModifyBudget(costImpact);
        
        // Afficher une animation pour l'impact sur le coût
        showCounterAnimation('budget', costImpact);
      }
    }
    
    if (eventCard.délai) {
      // Extraire la valeur numérique du délai (peut être positif ou négatif)
      const timeMatch = eventCard.délai.match(/([+-]?\d+)/);
      if (timeMatch && timeMatch[1] && onModifyTime) {
        const timeImpact = parseInt(timeMatch[1], 10);
        console.log(`Applying time impact: ${timeImpact} months`);
        onModifyTime(timeImpact);
        
        // Afficher une animation pour l'impact sur le délai
        showCounterAnimation('time', timeImpact);
      }
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
    const notification = document.createElement('div');
    notification.innerHTML = htmlMessage;
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.backgroundColor = '#263238';
    notification.style.color = 'white';
    notification.style.padding = '15px';
    notification.style.borderRadius = '8px';
    notification.style.zIndex = '9999';
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.5s';
    notification.style.maxWidth = '400px';
    notification.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    notification.style.fontSize = '14px';
    notification.style.lineHeight = '1.5';
    
    document.body.appendChild(notification);
    
    // Afficher la notification
    setTimeout(() => {
      notification.style.opacity = '1';
    }, 100);
    
    // Supprimer la notification après 8 secondes (plus long pour lire le détail)
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 500);
    }, 8000);
  };

  // Fonction pour ajouter des points de valeur lorsqu'une réponse à un quiz est correcte
  const handleQuizCorrectAnswer = () => {
    debugLog("Réponse correcte au quiz, ajout de 10 points de valeur");
    if (onAddValuePoints) {
      console.log("Appel de onAddValuePoints avec 10 points");
      onAddValuePoints(10);
      
      // Afficher une animation pour les points de valeur
      showCounterAnimation('points', 10);
      
      console.log("onAddValuePoints appelé avec succès");
    } else {
      console.error("onAddValuePoints n'est pas défini");
    }
  };

  // Fonction pour obtenir la prochaine position disponible pour une carte
  const getNextAvailablePosition = () => {
    const boardWidth = boardRef.current?.clientWidth || 800;
    const boardHeight = boardRef.current?.clientHeight || 600;
    
    // Marge pour éviter de placer les cartes trop près des bords
    const margin = 50;
    
    // Générer une position aléatoire dans les limites du tableau
    return {
      x: Math.max(margin, Math.min(boardWidth - CARD_WIDTH - margin, Math.random() * (boardWidth - CARD_WIDTH - 2 * margin) + margin)),
      y: Math.max(margin, Math.min(boardHeight - CARD_MIN_HEIGHT - margin, Math.random() * (boardHeight - CARD_MIN_HEIGHT - 2 * margin) + margin))
    };
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
                  Actions ({cardUsage.action}/{cardLimits.action})
                </button>
                
                <button
                  onClick={() => {
                    setSelectedCardType('event');
                    setShowCardSelector(true);
                  }}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg 
                           text-sm font-medium transition-all duration-200 flex items-center shadow-md"
                >
                  <span className="mr-2">🎭</span>
                  Événements ({cardUsage.event}/{cardLimits.event})
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
                  Quiz ({cardUsage.quiz}/{cardLimits.quiz})
                </button>
              </div>
              
              {/* Roue de cartes aléatoires */}
              <RandomCardWheel 
                cards={allCards} 
                currentPhase={currentPhase}
                onCardEffect={handleEventCardEffect}
                onQuizCorrectAnswer={handleQuizCorrectAnswer}
                debugMode={debugMode}
                onCardSelected={onRandomCardSelected}
                cardLimits={cardLimits}
                cardUsage={cardUsage}
              />
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
                onClick={() => handleCardClick(card.id)}
              >
                <div className="text-sm font-medium text-center whitespace-normal break-words">
                  {getCardTitle(card)}
                </div>
                {debugMode && <div className="text-xs text-white/50 truncate">ID: {card.id.substring(0, 4)}</div>}
              </div>
            );
          })}
          
          {/* Tooltip */}
          {hoveredCard && !draggingCard && activeCardId !== hoveredCard.id && (
            <div 
              className="absolute z-20 w-64 p-4 bg-gray-800 backdrop-blur-md rounded-xl shadow-xl border border-gray-700 text-white"
              style={{
                left: `${hoveredCard.position?.x || 0}px`,
                top: `${(hoveredCard.position?.y || 0) - 120}px`,
              }}
            >
              <h3 className="font-bold mb-1">{getCardTitle(hoveredCard)}</h3>
              <p className="text-sm opacity-80">{getCardDescription(hoveredCard).substring(0, 100)}...</p>
            </div>
          )}
          
          {/* Empty state */}
          {cards.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white/60">
                <div className="text-4xl mb-2">🎴</div>
                <p className="text-lg font-medium">Ajoutez des cartes pour commencer</p>
                <p className="text-sm mt-1">Utilisez le bouton "Ajouter une Carte" ci-dessus</p>
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
        />
      )}
    </div>
  );
};

export default GameBoard; 