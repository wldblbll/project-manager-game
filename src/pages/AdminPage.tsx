import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PROJECTS, DEFAULT_PROJECT_ID } from "@/config/projects";
import { Card } from "@/pages/GamePage";
import { getCardTitle, getCardDescription, getCardDomain, getCardType, getCardPhase } from "@/utils/cardHelpers";

const AdminPage = () => {
  const navigate = useNavigate();
  const [selectedProject, setSelectedProject] = useState<string>(DEFAULT_PROJECT_ID);
  const [selectedPhase, setSelectedPhase] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [cards, setCards] = useState<Card[]>([]);
  
  // Charger les cartes en fonction du projet sélectionné
  useEffect(() => {
    const project = PROJECTS.find(p => p.id === selectedProject);
    if (project && project.cards) {
      // Convertir les types si nécessaire pour assurer la compatibilité avec Card
      const typedCards = project.cards.map(card => {
        // Si délai est un nombre, convertir en string pour être compatible avec Card
        if (typeof card.délai === 'number') {
          return {
            ...card,
            délai: String(card.délai)
          } as Card;
        }
        return card as Card;
      });
      
      setCards(typedCards);
      console.log(`Chargement de ${typedCards.length} cartes pour le projet ${project.name}`);
    } else {
      console.warn(`Aucune carte trouvée pour le projet ${selectedProject}`);
      setCards([]);
    }
  }, [selectedProject]);
  
  // Obtenir toutes les phases uniques
  const getUniquePhases = () => {
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
            {/* Sélection du projet - Afficher seulement si plusieurs projets */}
            {PROJECTS.length > 1 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Projet</label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  {PROJECTS.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Sélection de la phase */}
            <div className={PROJECTS.length > 1 ? "" : "md:col-span-2"}>
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
                className={`${bgColor} border ${borderColor} rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{getCardTitle(card)}</h3>
                  <span className={`${badgeColor} text-xs font-medium px-2.5 py-0.5 rounded`}>
                    {cardType}
                  </span>
                </div>
                
                <div className="mb-3">
                  <span className="text-xs font-medium text-gray-500 mr-2">Phase: {cardPhase}</span>
                  {cardDomain && (
                    <span className="text-xs font-medium text-gray-500">Domaine: {cardDomain}</span>
                  )}
                </div>
                
                <p className="text-sm text-gray-700 mb-3 line-clamp-3">{getCardDescription(card)}</p>
                
                {/* Informations spécifiques au type de carte */}
                {cardType === "action" && (
                  <div className="mt-2 text-sm">
                    {card.coût && <div className="text-gray-600">Coût: {card.coût}</div>}
                    {card.délai && <div className="text-gray-600">Délai: {card.délai}</div>}
                  </div>
                )}
                
                {cardType === "event" && (
                  <div className="mt-2 text-sm">
                    {card.conditions ? (
                      <div className="text-purple-600 font-medium">Événement conditionnel</div>
                    ) : (
                      <>
                        {card.coût && <div className="text-gray-600">Impact budget: {card.coût}</div>}
                        {card.délai && <div className="text-gray-600">Impact délai: {card.délai}</div>}
                      </>
                    )}
                  </div>
                )}
                
                {cardType === "quiz" && card.options && (
                  <div className="mt-2 text-sm">
                    <div className="text-gray-600">Options: {card.options.length}</div>
                    {card.correct_answer && (
                      <div className="text-green-600">Réponse: {card.correct_answer}</div>
                    )}
                  </div>
                )}
                
                <div className="mt-3 text-xs text-gray-500">ID: {card.id}</div>
              </div>
            );
          })}
        </div>
        
        {filteredCards.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-500">Aucune carte ne correspond à vos critères de recherche.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPage; 