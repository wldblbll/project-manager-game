import React, { useState, useEffect } from "react";
import { Card } from "@/pages/GamePage";
import { 
  getCardTitle, 
  getCardDescription, 
  getCardDomain, 
  getCardMetaDescription, 
  getCardCost, 
  getCardTime, 
  getCardType,
  getCardPhase
} from "@/utils/cardHelpers";

interface CardDecksProps {
  decks: Record<string, Card[]>;
  onSelectCard: (card: Card) => void;
  currentPhase: string;
}

const CardDecks: React.FC<CardDecksProps> = ({ decks, onSelectCard, currentPhase }) => {
  const [expandedDeck, setExpandedDeck] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<Card | null>(null);
  const [phaseDecks, setPhaseDecks] = useState<Record<string, Card[]>>({});

  useEffect(() => {
    // Filter decks to only include cards for the current phase
    const filteredDecks: Record<string, Card[]> = {};
    
    Object.entries(decks).forEach(([domain, cards]) => {
      const phaseCards = cards.filter(card => 
        // Handle both single phase and array of phases
        (Array.isArray(card.phase) && card.phase.includes(currentPhase)) || 
        card.phase === currentPhase
      );
      if (phaseCards.length > 0) {
        filteredDecks[domain] = phaseCards;
      }
    });
    
    setPhaseDecks(filteredDecks);
  }, [decks, currentPhase]);

  const handleDeckClick = (domaine: string) => {
    if (expandedDeck === domaine) {
      setExpandedDeck(null);
    } else {
      setExpandedDeck(domaine);
    }
  };

  const handleCardClick = (card: Card) => {
    onSelectCard(card);
    setExpandedDeck(null);
  };

  return (
    <div className="w-full">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Card Decks for {currentPhase} Phase</h2>
      
      {Object.keys(phaseDecks).length > 0 ? (
        <div className="flex space-x-4 overflow-x-auto pb-2">
          {Object.entries(phaseDecks).map(([domaine, cards]) => (
            <div 
              key={domaine} 
              className="bg-white rounded-lg shadow-md min-w-[200px] flex-shrink-0"
            >
              <div 
                className="p-3 cursor-pointer flex justify-between items-center border-b"
                onClick={() => handleDeckClick(domaine)}
              >
                <h3 className="font-semibold text-gray-700">{domaine}</h3>
                <span className="text-sm text-gray-500">{cards.length} cards</span>
              </div>
              
              {expandedDeck === domaine && (
                <div className="p-3 space-y-2 max-h-60 overflow-y-auto">
                  {cards.map((card) => (
                    <div 
                      key={card.id}
                      className="relative p-2 border rounded-md cursor-pointer hover:bg-blue-50 transition-colors"
                      onClick={() => handleCardClick(card)}
                      onMouseEnter={() => setHoveredCard(card)}
                      onMouseLeave={() => setHoveredCard(null)}
                    >
                      <div className="font-medium text-gray-800">{getCardTitle(card)}</div>
                      {getCardCost(card) && getCardTime(card) && (
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Cost: {getCardCost(card)}</span>
                          <span>Time: {getCardTime(card)}</span>
                        </div>
                      )}
                      
                      {/* Card tooltip on hover */}
                      {hoveredCard?.id === card.id && (
                        <div className="absolute z-10 w-64 p-3 bg-white rounded-lg shadow-xl border border-gray-200 left-full ml-2 top-0">
                          <h4 className="font-bold text-gray-800">{getCardTitle(card)}</h4>
                          
                          {getCardMetaDescription(card) && (
                            <div className="my-2 p-2 bg-blue-50 rounded-md border border-blue-100">
                              <h5 className="text-xs font-semibold text-blue-700 mb-1">À PROPOS DE CETTE ACTION</h5>
                              <p className="text-sm text-gray-700 italic">{getCardMetaDescription(card)}</p>
                            </div>
                          )}
                          
                          <div className="mt-2">
                            <h5 className="text-xs font-semibold text-gray-600 mb-1">DESCRIPTION SPÉCIFIQUE</h5>
                            <p className="text-sm text-gray-600">{getCardDescription(card)}</p>
                          </div>
                          
                          <div className="flex justify-between mt-3">
                            {getCardCost(card) && (
                              <div className="text-sm">
                                <span className="font-semibold text-gray-700">Cost:</span> {getCardCost(card)}
                              </div>
                            )}
                            
                            {getCardTime(card) && (
                              <div className="text-sm">
                                <span className="font-semibold text-gray-700">Time:</span> {getCardTime(card)}
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-2 text-xs text-gray-500">
                            <span className="font-semibold">Type:</span> {getCardType(card)} | 
                            <span className="font-semibold"> Domain:</span> {getCardDomain(card)} | 
                            <span className="font-semibold"> Phase:</span> {getCardPhase(card)}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <p className="text-gray-500">No card decks available for the {currentPhase} phase.</p>
        </div>
      )}
    </div>
  );
};

export default CardDecks; 