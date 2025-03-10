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
const CARD_WIDTH = 150;
const CARD_MIN_HEIGHT = 36; // Hauteur minimale seulement
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
    ? "fixed inset-0 z-50 bg-white"
    : "bg-white border border-gray-300 rounded-lg shadow-sm p-4 mt-4";

  // Determine board container styles based on full-screen mode
  const boardContainerStyle = isFullScreen
    ? { height: '100vh' }
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
    animation.style.transition = 'all 0.3s ease-out';
    
    // Ajouter l'animation au DOM
    document.body.appendChild(animation);
    
    // Déclencher l'animation
    setTimeout(() => {
      animation.style.opacity = '1';
      animation.style.transform = 'translateX(0)';
    }, 100);
    
    // Supprimer l'animation après un délai
    setTimeout(() => {
      animation.style.opacity = '0';
      animation.style.transform = 'translateX(20px)';
      
      setTimeout(() => {
        document.body.removeChild(animation);
      }, 300);
    }, 2000);
  };

  // Fonction pour ajouter une carte au tableau
  const handleAddCard = (card: Card) => {
    // Vérifier si la carte est déjà sur le tableau
    if (isCardOnBoard(card.id)) {
      debugLog(`La carte ${card.id} est déjà sur le tableau.`);
      return;
    }

    // Générer un ID aléatoire si la carte n'en a pas
    const cardId = card.id || `card-${Math.random().toString(36).substr(2, 9)}`;
    
    // Créer une nouvelle carte avec un ID et une position
    const position = { 
      x: Math.max(50, Math.min(boardRef.current?.clientWidth || 800, Math.random() * (boardRef.current?.clientWidth || 800) - 100)), 
      y: Math.max(50, Math.min(boardRef.current?.clientHeight || 600, Math.random() * (boardRef.current?.clientHeight || 600) - 100))
    };
    
    const newCard = { ...card, id: cardId, position };
    
    // Appliquer les impacts sur le coût et le délai pour les cartes action
    if (getCardType(card) === 'action') {
      // Appliquer l'impact sur le coût
      if (card.coût && onModifyBudget) {
        // Extraire la valeur numérique du coût (peut être positif ou négatif)
        const costMatch = card.coût.match(/([+-]?\d+)/);
        if (costMatch && costMatch[1]) {
          const costImpact = parseInt(costMatch[1], 10);
          debugLog(`Applying cost impact from action card: ${costImpact}K€`);
          onModifyBudget(costImpact);
          
          // Afficher une animation pour l'impact sur le coût
          showCounterAnimation('budget', costImpact);
        }
      }
      
      // Appliquer l'impact sur le délai
      if (card.délai && onModifyTime) {
        // Extraire la valeur numérique du délai (peut être positif ou négatif)
        const timeMatch = card.délai.match(/([+-]?\d+)/);
        if (timeMatch && timeMatch[1]) {
          const timeImpact = parseInt(timeMatch[1], 10);
          debugLog(`Applying time impact from action card: ${timeImpact} days/months`);
          onModifyTime(timeImpact);
          
          // Afficher une animation pour l'impact sur le délai
          showCounterAnimation('time', timeImpact);
        }
      }
    }
    
    // Appeler le callback pour ajouter la carte
    if (onSelectCard) {
      onSelectCard(newCard);
    }
    
    // Fermer le sélecteur de cartes
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
                onClick={() => setShowCardSelector(false)}
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
          
          {/* Results count */}
          <div className="mb-4 text-sm text-gray-500">
            {filteredCards.length} carte{filteredCards.length !== 1 ? 's' : ''} trouvée{filteredCards.length !== 1 ? 's' : ''}
            {searchQuery && <span> pour "<strong>{searchQuery}</strong>"</span>}
          </div>
          
          {/* Card list */}
          {Object.keys(groupedCards).length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">
                {searchQuery ? (
                  `Aucune carte ne correspond à votre recherche "${searchQuery}"`
                ) : showCurrentPhaseOnly && currentPhase ? (
                  `Aucune carte ${localSelectedType === 'action' ? 'action' : 
                    localSelectedType === 'event' ? 'événement' : 
                    'quiz'} disponible pour la phase ${currentPhase}`
                ) : (
                  `Aucune carte ${localSelectedType === 'action' ? 'action' : 
                    localSelectedType === 'event' ? 'événement' : 
                    'quiz'} disponible`
                )}
              </p>
              {showCurrentPhaseOnly && !searchQuery && (
                <button
                  onClick={() => setShowCurrentPhaseOnly(false)}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium"
                >
                  Afficher toutes les phases
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedCards).map(([domain, domainCards]) => (
                <div key={domain} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-bold text-lg mb-3 text-gray-700">
                    {domain} 
                    {debugMode && <span className="text-sm text-gray-500 ml-2">({domainCards.length} cards)</span>}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {domainCards.map(card => {
                      const colors = getCardColors(getCardDomain(card) || "");
                      const isOnBoard = isCardOnBoard(card.id);
                      
                      return (
                        <button
                          key={card.id || `card-${Math.random()}`}
                          onClick={() => !isOnBoard && handleAddCard(card)}
                          className={`p-3 rounded-lg text-left transition-all ${colors.bg} ${colors.text} ${
                            isOnBoard 
                              ? 'opacity-50 cursor-not-allowed border border-gray-300' 
                              : 'hover:shadow-md'
                          }`}
                          disabled={isOnBoard}
                          title={isOnBoard ? "Cette carte est déjà sur le tableau" : ""}
                          data-card-id={card.id || 'no-id'}
                          data-on-board={isOnBoard}
                        >
                          <div className="font-medium flex items-center justify-between">
                            {getCardTitle(card)}
                            {isOnBoard && (
                              <span className="ml-2 text-xs bg-gray-200 text-gray-700 px-1 py-0.5 rounded">
                                Déjà ajoutée
                              </span>
                            )}
                            {debugMode && <span className="text-xs ml-1">({(card.id && card.id.slice(0,4)) || 'no-id'})</span>}
                          </div>
                          
                          <div className="text-xs mt-1 line-clamp-2 text-gray-600">
                            {getCardDescription(card)}
                          </div>
                          
                          {card.phase && (
                            <div className="mt-1 text-xs opacity-75">
                              Phase: {Array.isArray(card.phase) ? card.phase.filter(p => p).join(', ') : card.phase}
                            </div>
                          )}
                          {debugMode && (
                            <div className="mt-1 text-xs text-gray-500 italic">
                              Status: {isOnBoard ? 'Already on board' : 'Available'}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
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
            <h2 className="text-xl font-bold text-gray-800">
              Tableau de Projet
              {debugMode && <span className="text-xs text-red-500 ml-2">[DEBUG MODE]</span>}
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => setShowCardSelector(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center shadow-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Ajouter une carte
              </button>
                            
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

              {/* Card limits display */}
              <div className="flex gap-3 px-4 py-2 bg-gray-100 rounded-lg">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-blue-600">Actions:</span>
                  <span className="text-sm">{cardUsage.action}/{cardLimits.action}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-purple-600">Événements:</span>
                  <span className="text-sm">{cardUsage.event}/{cardLimits.event}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-green-600">Quiz:</span>
                  <span className="text-sm">{cardUsage.quiz}/{cardLimits.quiz}</span>
                </div>
              </div>
              {debugMode && (
                <button
                  onClick={() => setDebugMode(false)}
                  className="ml-auto px-2 py-1 bg-red-100 text-red-700 text-xs rounded"
                >
                  Disable Debug
                </button>
              )}
            </div>
          </div>
          <button
            onClick={onToggleFullScreen}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2 transition-colors"
          >
            {isFullScreen ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9L4 4m0 0l5 5m-5-5v5m16-5l-5 5m5-5v5M4 20l5-5m-5 5v-5m16 5l-5-5m5 5v-5" />
                </svg>
                Quitter plein écran
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0-4l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                Plein écran
              </>
            )}
          </button>
        </div>
        
        {/* Board area */}
        <div
          className="relative border border-dashed border-gray-300 rounded-lg h-full p-4 overflow-hidden"
          style={{ backgroundColor: '#f8fafc' }}
        >
          {/* Board cards */}
          {cards.map((card) => {
            const colors = getCardColors(getCardDomain(card) || "");
            
            return (
              <div
                key={card.id}
                data-card-id={card.id}
                className={`absolute p-2 rounded-lg shadow transition-all cursor-move ${colors.bg} ${colors.text} ${
                  activeCardId === card.id ? 'ring-2 ring-blue-500' : ''
                }`}
                style={{
                  width: `${CARD_WIDTH}px`,
                  minHeight: `${CARD_MIN_HEIGHT}px`, // Hauteur minimale
                  height: 'auto', // Hauteur adaptative selon le contenu
                  left: card.position?.x || 0,
                  top: card.position?.y || 0,
                  zIndex: draggingCard === card.id ? 10 : 1,
                  transform: draggingCard === card.id ? 'scale(1.05)' : 'scale(1)',
                  transition: draggingCard === card.id ? 'none' : 'transform 0.15s, box-shadow 0.15s'
                }}
                onMouseDown={(e) => handleCardMouseDown(e, card.id)}
                onMouseEnter={() => setHoveredCard(card)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => handleCardClick(card.id)}
              >
                <div className="text-sm font-medium text-center whitespace-normal break-words">
                  {getCardTitle(card)}
                </div>
                {debugMode && <div className="text-xs text-gray-500 truncate">ID: {card.id.substring(0, 4)}</div>}
              </div>
            );
          })}
          
          {/* Simplified tooltip - shows only on hover, not when clicked */}
          {hoveredCard && !draggingCard && activeCardId !== hoveredCard.id && (
            <div 
              className="absolute z-20 w-64 p-3 bg-white rounded-lg shadow-xl border border-gray-200"
              style={{
                left: (hoveredCard.position?.x || 0) + 210,
                top: (hoveredCard.position?.y || 0),
                maxWidth: '250px'
              }}
            >
              <h4 className="font-bold text-gray-800">{getCardTitle(hoveredCard) || 'Carte sans titre'}</h4>
              <p className="text-sm text-gray-600 mt-1">{getCardDescription(hoveredCard) || 'Aucune description'}</p>
              
              <div className="flex justify-between mt-3">
                {hoveredCard.coût && (
                  <div className="text-sm">
                    <span className="font-semibold text-gray-700">Coût:</span> {hoveredCard.coût}
                  </div>
                )}
                
                {hoveredCard.délai && (
                  <div className="text-sm">
                    <span className="font-semibold text-gray-700">Délai:</span> {hoveredCard.délai}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Empty state */}
          {cards.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-gray-400 text-lg mb-4">Votre tableau de projet est vide</p>
                <button
                  onClick={() => setShowCardSelector(true)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center mx-auto shadow-md"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Ajouter votre première carte
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card selector panel */}
      <CardSelectorPanel />
      
      {/* Detail side panel */}
      {renderDetailSidePanel()}
    </div>
  );
};

export default GameBoard; 