import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GameManager, UnifiedGameConfig } from "@/config/games";
import { Card } from "@/pages/GamePage";
import { getCardTitle, getCardDescription, getCardDomain, getCardType, getCardPhase } from "@/utils/cardHelpers";

const AdminPage = () => {
  const navigate = useNavigate();
  const [selectedGameId, setSelectedGameId] = useState<string>("");
  const [selectedPhase, setSelectedPhase] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [cards, setCards] = useState<Card[]>([]);
  const [availableGames, setAvailableGames] = useState<UnifiedGameConfig[]>([]);
  const [currentGame, setCurrentGame] = useState<UnifiedGameConfig | null>(null);
  
  // Charger les jeux disponibles au montage
  useEffect(() => {
    const games = GameManager.getAllGames();
    setAvailableGames(games);
    
    // Sélectionner le premier jeu par défaut
    if (games.length > 0) {
      setSelectedGameId(games[0].gameInfo.id);
    }
  }, []);
  
  // Charger les cartes en fonction du jeu sélectionné
  useEffect(() => {
    if (selectedGameId) {
      const game = GameManager.getGame(selectedGameId);
      if (game) {
        setCurrentGame(game);
                 // Convertir les cartes du jeu vers le format Card attendu
         const typedCards = game.cards.map(card => ({
           id: card.id,
           type: card.type,
           domain: card.domain,
           phase: card.phase,
           title: card.title,
           description: card.description,
           cost: card.cost,
           delay: card.delay,
           value: card.value,
           options: card.options,
           correct_answer: card.correct_answer,
           comment: card.comment,
           conditions: card.conditions
         } as Card));
        
        setCards(typedCards);
        console.log(`Chargement de ${typedCards.length} cartes pour le jeu ${game.gameInfo.name}`);
      } else {
        console.warn(`Aucun jeu trouvé avec l'ID ${selectedGameId}`);
        setCards([]);
        setCurrentGame(null);
      }
    }
  }, [selectedGameId]);
  
  // Obtenir toutes les phases uniques du jeu actuel
  const getUniquePhases = () => {
    if (!currentGame) return [];
    
    const phases = new Set<string>();
    
    cards.forEach(card => {
      if (Array.isArray(card.phase)) {
        card.phase.forEach(phase => phases.add(phase));
      } else if (card.phase) {
        phases.add(card.phase);
      }
    });
    
    return Array.from(phases).sort();
  };
  
  // Filtrer les cartes en fonction des sélections
  const getFilteredCards = () => {
    return cards.filter(card => {
      // Filtrer par phase
      if (selectedPhase !== "all") {
        const cardPhases = Array.isArray(card.phase) ? card.phase : [card.phase];
        if (!cardPhases.includes(selectedPhase)) {
          return false;
        }
      }
      
      // Filtrer par type
      if (selectedType !== "all") {
        const cardType = getCardType(card);
        if (cardType !== selectedType) {
          return false;
        }
      }
      
      // Filtrer par recherche
      if (searchQuery) {
        const title = getCardTitle(card).toLowerCase();
        const description = getCardDescription(card).toLowerCase();
        const domain = getCardDomain(card).toLowerCase();
        const query = searchQuery.toLowerCase();
        
        return title.includes(query) || description.includes(query) || domain.includes(query);
      }
      
      return true;
    });
  };

  const filteredCards = getFilteredCards();
  const uniquePhases = getUniquePhases();
  
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Administration des Cartes</h1>
          <button 
            onClick={() => navigate("/")}
            className="bg-white text-indigo-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-50"
          >
            Retour à l'accueil
          </button>
        </div>
      </header>
      
      <main className="container mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Sélection du jeu - Afficher seulement si plusieurs jeux */}
            {availableGames.length > 1 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jeu</label>
                <select
                  value={selectedGameId}
                  onChange={(e) => setSelectedGameId(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  {availableGames.map((game) => (
                    <option key={game.gameInfo.id} value={game.gameInfo.id}>
                      {game.gameInfo.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Sélection de la phase */}
            <div className={availableGames.length > 1 ? "" : "md:col-span-2"}>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phase</label>
              <select
                value={selectedPhase}
                onChange={(e) => setSelectedPhase(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="all">Toutes les phases</option>
                {uniquePhases.map(phase => (
                  <option key={phase} value={phase}>{phase}</option>
                ))}
              </select>
            </div>
            
            {/* Sélection du type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="all">Tous les types</option>
                <option value="action">Action</option>
                <option value="event">Événement</option>
                <option value="quiz">Quiz</option>
              </select>
            </div>
            
            {/* Recherche */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recherche</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une carte..."
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>
          
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              {filteredCards.length} carte{filteredCards.length !== 1 ? 's' : ''} trouvée{filteredCards.length !== 1 ? 's' : ''}
              {currentGame && ` - ${currentGame.gameInfo.name}`}
            </h2>
          </div>
        </div>
        
        {/* Liste des cartes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCards.map(card => {
            const cardType = getCardType(card);
            const cardPhase = Array.isArray(card.phase) ? card.phase.join(", ") : card.phase;
            const cardDomain = getCardDomain(card);
            
            // Déterminer les couleurs en fonction du type de carte
            let bgColor = "bg-gray-50";
            let borderColor = "border-gray-200";
            let badgeColor = "bg-gray-100 text-gray-800";
            
            if (cardType === "action") {
              bgColor = "bg-blue-50";
              borderColor = "border-blue-200";
              badgeColor = "bg-blue-100 text-blue-800";
            } else if (cardType === "event") {
              bgColor = "bg-purple-50";
              borderColor = "border-purple-200";
              badgeColor = "bg-purple-100 text-purple-800";
            } else if (cardType === "quiz") {
              bgColor = "bg-green-50";
              borderColor = "border-green-200";
              badgeColor = "bg-green-100 text-green-800";
            }
            
            return (
              <div
                key={card.id}
                className={`${bgColor} ${borderColor} border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow`}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeColor}`}>
                    {cardType}
                  </span>
                  <span className="text-xs text-gray-500">ID: {card.id}</span>
                </div>
                
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                  {getCardTitle(card)}
                </h3>
                
                <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                  {getCardDescription(card)}
                </p>
                
                <div className="space-y-2 text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>Domaine:</span>
                    <span className="font-medium">{cardDomain}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Phase:</span>
                    <span className="font-medium">{cardPhase}</span>
                  </div>
                  
                  {card.cost !== undefined && (
                    <div className="flex justify-between">
                      <span>Coût:</span>
                      <span className="font-medium">{card.cost}€</span>
                    </div>
                  )}
                  
                                     {card.delay !== undefined && (
                     <div className="flex justify-between">
                       <span>Délai:</span>
                       <span className="font-medium">{card.delay} jours</span>
                     </div>
                   )}
                  
                  {card.value !== undefined && (
                    <div className="flex justify-between">
                      <span>Valeur:</span>
                      <span className="font-medium">{card.value} pts</span>
                    </div>
                  )}
                </div>
                
                {card.options && card.options.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Options:</p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {card.options.map((option, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-1">•</span>
                          <span className={card.correct_answer === option ? "font-semibold text-green-600" : ""}>
                            {option}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {card.comment && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Commentaire:</p>
                    <p className="text-xs text-gray-600">{card.comment}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {filteredCards.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">Aucune carte trouvée</div>
            <p className="text-gray-500 text-sm">
              Essayez de modifier vos critères de recherche ou de filtrage.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPage; 