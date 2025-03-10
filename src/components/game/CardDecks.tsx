import React, { useState, useEffect } from "react";
import { Card } from "@/pages/GamePage";
import { 
  getCardTitle, 
  getCardDescription, 
  getCardDomain, 
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
    <div className="w-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6 rounded-xl">
      <h2 className="text-2xl font-bold mb-6 text-white flex items-center">
        <span className="mr-2">🎴</span>
        Cartes disponibles - Phase {currentPhase}
      </h2>
      
      {Object.keys(phaseDecks).length > 0 ? (
        <div className="flex space-x-4 overflow-x-auto pb-4">
          {Object.entries(phaseDecks).map(([domaine, cards]) => (
            <div 
              key={domaine} 
              className="bg-white/10 backdrop-blur-sm rounded-xl min-w-[250px] flex-shrink-0 border border-white/20"
            >
              <div 
                className="p-4 cursor-pointer flex justify-between items-center border-b border-white/20"
                onClick={() => handleDeckClick(domaine)}
              >
                <h3 className="font-semibold text-white flex items-center">
                  <span className="text-2xl mr-2">
                    {domaine === "Technique" ? "⚙️" :
                     domaine === "Management" ? "👥" :
                     domaine === "Qualité" ? "✨" :
                     domaine === "Budget" ? "💰" : "📋"}
                  </span>
                  {domaine}
                </h3>
                <span className="text-sm text-white/60 bg-white/10 px-2 py-1 rounded-full">
                  {cards.length} cartes
                </span>
              </div>
              
              {expandedDeck === domaine && (
                <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
                  {cards.map((card) => (
                    <div 
                      key={card.id}
                      className="relative p-3 border border-white/20 rounded-xl cursor-pointer 
                               bg-white/5 hover:bg-white/10 transition-all duration-200 transform hover:scale-105"
                      onClick={() => handleCardClick(card)}
                      onMouseEnter={() => setHoveredCard(card)}
                      onMouseLeave={() => setHoveredCard(null)}
                    >
                      <div className="font-medium text-white">{getCardTitle(card)}</div>
                      <p className="text-sm text-white/60 mt-1 line-clamp-2">
                        {getCardDescription(card)}
                      </p>
                      
                      <div className="flex justify-between mt-3">
                        {getCardCost(card) && (
                          <div className="text-sm bg-white/10 px-3 py-1 rounded-full">
                            <span className="text-yellow-300">💰</span>
                            <span className="text-white ml-1">{getCardCost(card)}</span>
                          </div>
                        )}
                        
                        {getCardTime(card) && (
                          <div className="text-sm bg-white/10 px-3 py-1 rounded-full">
                            <span className="text-blue-300">⏱️</span>
                            <span className="text-white ml-1">{getCardTime(card)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">🎴</div>
          <p className="text-white text-lg">Aucune carte disponible pour cette phase</p>
          <p className="text-white/60 text-sm mt-2">
            Passez à la phase suivante pour débloquer de nouvelles cartes
          </p>
        </div>
      )}
    </div>
  );
};

export default CardDecks; 