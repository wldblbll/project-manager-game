import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { PROJECTS, DEFAULT_PROJECT_ID } from "@/config/projects";
import { Card } from "@/pages/GamePage";
import { getCardTitle, getCardDescription, getCardDomain, getCardType, getCardPhase, getCardOptions, getCardCorrectAnswer, getCardComment, hasCardConditions, getCardConditions } from "@/utils/cardHelpers";

// Composant pour afficher du contenu Markdown
const MarkdownContent = ({ content }: { content: string }) => {
  return (
    <div className="prose prose-sm max-w-none">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
};

const AllCardsPage = () => {
  const navigate = useNavigate();
  const [selectedProject, setSelectedProject] = useState<string>(DEFAULT_PROJECT_ID);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [cards, setCards] = useState<Card[]>([]);
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  
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
  
  // Filtrer les cartes par recherche
  const getFilteredCards = () => {
    if (!searchQuery) return cards;
    
    return cards.filter(card => {
      const title = getCardTitle(card).toLowerCase();
      const description = getCardDescription(card).toLowerCase();
      const domain = getCardDomain(card).toLowerCase();
      const query = searchQuery.toLowerCase();
      
      return title.includes(query) || description.includes(query) || domain.includes(query);
    });
  };
  
  // Organiser les cartes par phase
  const organizeCardsByPhase = () => {
    const filteredCards = getFilteredCards();
    const cardsByPhase: Record<string, Card[]> = {};
    
    // Initialiser les phases
    getUniquePhases().forEach(phase => {
      cardsByPhase[phase] = [];
    });
    
    // Répartir les cartes dans leurs phases
    filteredCards.forEach(card => {
      const phases = Array.isArray(card.phase) ? card.phase : [card.phase];
      
      phases.forEach(phase => {
        if (phase && cardsByPhase[phase]) {
          cardsByPhase[phase].push(card);
        }
      });
    });
    
    return cardsByPhase;
  };
  
  const cardsByPhase = organizeCardsByPhase();
  const uniquePhases = getUniquePhases();
  
  // Compter les cartes par type pour une phase donnée
  const countCardsByType = (cards: Card[]) => {
    const counts = { action: 0, event: 0, quiz: 0 };
    
    cards.forEach(card => {
      const type = getCardType(card);
      if (type === 'action') counts.action++;
      else if (type === 'event') counts.event++;
      else if (type === 'quiz') counts.quiz++;
    });
    
    return counts;
  };
  
  // Gérer le clic sur une carte
  const handleCardClick = (card: Card) => {
    setSelectedCard(card);
    setShowModal(true);
  };
  
  // Fermer la modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedCard(null);
  };
  
  // Vérifier si une chaîne contient du Markdown
  const containsMarkdown = (text: string): boolean => {
    // Recherche des motifs courants de Markdown
    const markdownPatterns = [
      /[*_]{1,2}[^*_]+[*_]{1,2}/,  // *italique* ou **gras**
      /\[.+\]\(.+\)/,              // [lien](url)
      /!\[.+\]\(.+\)/,             // ![image](url)
      /^#+\s+.+$/m,                // # Titre
      /^>\s+.+$/m,                 // > Citation
      /^-\s+.+$/m,                 // - Liste
      /^[0-9]+\.\s+.+$/m,          // 1. Liste numérotée
      /`[^`]+`/,                   // `code`
      /```[\s\S]*?```/,            // ```bloc de code```
      /^\s*[-*_]{3,}\s*$/m         // --- Séparateur
    ];
    
    return markdownPatterns.some(pattern => pattern.test(text));
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Vue d'ensemble des cartes</h1>
          <button 
            onClick={() => navigate("/")}
            className="bg-white text-blue-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-50"
          >
            Retour à l'accueil
          </button>
        </div>
      </header>
      
      <main className="container mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Sélection du projet - Afficher seulement si plusieurs projets */}
            {PROJECTS.length > 1 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Projet</label>
                <select
                  value={selectedProject}
                  onChange={(e) => {
                    setSelectedProject(e.target.value);
                    setExpandedPhase(null); // Réinitialiser l'expansion des phases lors du changement de projet
                  }}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  {PROJECTS.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Recherche - Si un seul projet, occuper toute la largeur */}
            <div className={PROJECTS.length > 1 ? "" : "md:col-span-2"}>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recherche</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une carte..."
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              {cards.length} cartes au total, {getFilteredCards().length} affichées
            </h2>
          </div>
        </div>
        
        {/* Affichage des cartes par phase */}
        {uniquePhases.map(phase => {
          const phaseCards = cardsByPhase[phase] || [];
          const cardCounts = countCardsByType(phaseCards);
          const isExpanded = expandedPhase === phase;
          
          return (
            <div key={phase} className="mb-8">
              <div 
                className="bg-white rounded-lg shadow-md p-4 mb-4 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandedPhase(isExpanded ? null : phase)}
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800">
                    Phase: {phase}
                  </h2>
                  <div className="flex space-x-2">
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      Actions: {cardCounts.action}
                    </span>
                    <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      Événements: {cardCounts.event}
                    </span>
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      Quiz: {cardCounts.quiz}
                    </span>
                  </div>
                  <svg 
                    className={`w-6 h-6 text-gray-500 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              
              {isExpanded && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Colonne pour les cartes d'action */}
                  <div>
                    <h3 className="text-lg font-semibold text-blue-700 mb-3 border-b pb-2">
                      Cartes d'action ({cardCounts.action})
                    </h3>
                    <div className="space-y-4">
                      {phaseCards
                        .filter(card => getCardType(card) === 'action')
                        .map(card => renderCard(card, 'action', handleCardClick, containsMarkdown))}
                    </div>
                  </div>
                  
                  {/* Colonne pour les cartes d'événement */}
                  <div>
                    <h3 className="text-lg font-semibold text-purple-700 mb-3 border-b pb-2">
                      Cartes d'événement ({cardCounts.event})
                    </h3>
                    <div className="space-y-4">
                      {phaseCards
                        .filter(card => getCardType(card) === 'event')
                        .map(card => renderCard(card, 'event', handleCardClick, containsMarkdown))}
                    </div>
                  </div>
                  
                  {/* Colonne pour les cartes de quiz */}
                  <div>
                    <h3 className="text-lg font-semibold text-green-700 mb-3 border-b pb-2">
                      Cartes de quiz ({cardCounts.quiz})
                    </h3>
                    <div className="space-y-4">
                      {phaseCards
                        .filter(card => getCardType(card) === 'quiz')
                        .map(card => renderCard(card, 'quiz', handleCardClick, containsMarkdown))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        
        {getFilteredCards().length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-500">Aucune carte ne correspond à vos critères de recherche.</p>
          </div>
        )}
      </main>
      
      {/* Modal pour afficher les détails de la carte */}
      {showModal && selectedCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* En-tête de la modal */}
            <div className={`p-4 ${getCardHeaderColor(getCardType(selectedCard))}`}>
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-bold text-white">{getCardTitle(selectedCard)}</h2>
                <button 
                  onClick={closeModal}
                  className="text-white hover:text-gray-200 focus:outline-none"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center mt-2">
                <span className="bg-white bg-opacity-20 text-white text-xs font-medium px-2.5 py-0.5 rounded mr-2">
                  {getCardType(selectedCard)}
                </span>
                {getCardDomain(selectedCard) && (
                  <span className="bg-white bg-opacity-20 text-white text-xs font-medium px-2.5 py-0.5 rounded">
                    {getCardDomain(selectedCard)}
                  </span>
                )}
              </div>
            </div>
            
            {/* Corps de la modal avec défilement */}
            <div className="p-6 overflow-y-auto flex-grow">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Description</h3>
                <div className="text-gray-700">
                  {containsMarkdown(getCardDescription(selectedCard)) ? (
                    <MarkdownContent content={getCardDescription(selectedCard)} />
                  ) : (
                    <p>{getCardDescription(selectedCard)}</p>
                  )}
                </div>
              </div>
              
              {/* Affichage des détails spécifiques selon le type de carte */}
              {getCardType(selectedCard) === 'action' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {selectedCard.coût && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="text-sm font-semibold text-blue-800 mb-1">Coût</h4>
                        <p className="text-blue-900 font-medium">{selectedCard.coût}</p>
                      </div>
                    )}
                    {selectedCard.délai && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="text-sm font-semibold text-blue-800 mb-1">Délai</h4>
                        <p className="text-blue-900 font-medium">{selectedCard.délai}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Ajout de l'affichage des conditions pour les cartes action */}
                  {hasCardConditions(selectedCard) && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-blue-800 mb-2">Conditions</h3>
                      {getCardConditions(selectedCard).map((condition, index) => (
                        <div key={index} className="bg-blue-50 p-4 rounded-lg mb-3">
                          {condition.cardId && condition.present !== undefined && (
                            <p className="text-blue-900 mb-2">
                              <span className="font-medium">Condition:</span> La carte #{condition.cardId} doit être {condition.present ? 'présente' : 'absente'}
                            </p>
                          )}
                          
                          {condition.operator && condition.checks && (
                            <div className="mb-2">
                              <p className="text-blue-900 font-medium mb-1">Conditions multiples ({condition.operator}):</p>
                              <ul className="list-disc list-inside">
                                {condition.checks.map((check, checkIndex) => (
                                  <li key={checkIndex} className="text-blue-800">
                                    La carte #{check.cardId} doit être {check.present ? 'présente' : 'absente'}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {condition.effects && (
                            <div className="mt-3 pt-3 border-t border-blue-200">
                              <p className="text-blue-900 font-medium mb-1">Effets:</p>
                              <ul className="list-disc list-inside">
                                {condition.effects.budget !== undefined && (
                                  <li className="text-blue-800">
                                    Budget: {condition.effects.budget > 0 ? '+' : ''}{condition.effects.budget}K€
                                  </li>
                                )}
                                {condition.effects.time !== undefined && (
                                  <li className="text-blue-800">
                                    Délai: {condition.effects.time > 0 ? '+' : ''}{condition.effects.time} jours
                                  </li>
                                )}
                                {condition.effects.value !== undefined && (
                                  <li className="text-blue-800">
                                    Valeur: {condition.effects.value > 0 ? '+' : ''}{condition.effects.value} points
                                  </li>
                                )}
                                {condition.effects.message && (
                                  <li className="text-blue-800">
                                    {containsMarkdown(condition.effects.message) ? (
                                      <MarkdownContent content={condition.effects.message} />
                                    ) : (
                                      condition.effects.message
                                    )}
                                  </li>
                                )}
                              </ul>
                            </div>
                          )}
                          
                          {condition.default && (
                            <p className="text-blue-700 italic">Condition par défaut</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
              
              {getCardType(selectedCard) === 'event' && (
                <div className="mb-6">
                  {hasCardConditions(selectedCard) ? (
                    <div>
                      <h3 className="text-lg font-semibold text-purple-800 mb-2">Conditions</h3>
                      {getCardConditions(selectedCard).map((condition, index) => (
                        <div key={index} className="bg-purple-50 p-4 rounded-lg mb-3">
                          {condition.cardId && condition.present !== undefined && (
                            <p className="text-purple-900 mb-2">
                              <span className="font-medium">Condition:</span> La carte #{condition.cardId} doit être {condition.present ? 'présente' : 'absente'}
                            </p>
                          )}
                          
                          {condition.operator && condition.checks && (
                            <div className="mb-2">
                              <p className="text-purple-900 font-medium mb-1">Conditions multiples ({condition.operator}):</p>
                              <ul className="list-disc list-inside">
                                {condition.checks.map((check, checkIndex) => (
                                  <li key={checkIndex} className="text-purple-800">
                                    La carte #{check.cardId} doit être {check.present ? 'présente' : 'absente'}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {condition.effects && (
                            <div className="mt-3 pt-3 border-t border-purple-200">
                              <p className="text-purple-900 font-medium mb-1">Effets:</p>
                              <ul className="list-disc list-inside">
                                {condition.effects.budget !== undefined && (
                                  <li className="text-purple-800">
                                    Budget: {condition.effects.budget > 0 ? '+' : ''}{condition.effects.budget}K€
                                  </li>
                                )}
                                {condition.effects.time !== undefined && (
                                  <li className="text-purple-800">
                                    Délai: {condition.effects.time > 0 ? '+' : ''}{condition.effects.time} mois
                                  </li>
                                )}
                                {condition.effects.message && (
                                  <li className="text-purple-800">
                                    {containsMarkdown(condition.effects.message) ? (
                                      <MarkdownContent content={condition.effects.message} />
                                    ) : (
                                      condition.effects.message
                                    )}
                                  </li>
                                )}
                              </ul>
                            </div>
                          )}
                          
                          {condition.default && (
                            <p className="text-purple-700 italic">Condition par défaut</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedCard.coût && (
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <h4 className="text-sm font-semibold text-purple-800 mb-1">Impact budget</h4>
                          <p className="text-purple-900 font-medium">{selectedCard.coût}</p>
                        </div>
                      )}
                      {selectedCard.délai && (
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <h4 className="text-sm font-semibold text-purple-800 mb-1">Impact délai</h4>
                          <p className="text-purple-900 font-medium">{selectedCard.délai}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {getCardType(selectedCard) === 'quiz' && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-green-800 mb-3">Options</h3>
                  <div className="space-y-2">
                    {getCardOptions(selectedCard).map((option, index) => (
                      <div 
                        key={index} 
                        className={`p-3 rounded-lg ${
                          option.charAt(0) === getCardCorrectAnswer(selectedCard) 
                            ? 'bg-green-100 border border-green-300' 
                            : 'bg-gray-50 border border-gray-200'
                        }`}
                      >
                        <div className="flex items-start">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full mr-2 ${
                            option.charAt(0) === getCardCorrectAnswer(selectedCard)
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-200 text-gray-700'
                          }`}>
                            {option.charAt(0)}
                          </span>
                          <span className={`${
                            option.charAt(0) === getCardCorrectAnswer(selectedCard)
                              ? 'text-green-800 font-medium'
                              : 'text-gray-700'
                          }`}>
                            {containsMarkdown(option.substring(2)) ? (
                              <MarkdownContent content={option.substring(2)} />
                            ) : (
                              option.substring(2)
                            )}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {getCardComment(selectedCard) && (
                    <div className="mt-4 bg-green-50 p-4 rounded-lg">
                      <h4 className="text-sm font-semibold text-green-800 mb-1">Explication</h4>
                      <div className="text-green-900">
                        {containsMarkdown(getCardComment(selectedCard)) ? (
                          <MarkdownContent content={getCardComment(selectedCard)} />
                        ) : (
                          <p>{getCardComment(selectedCard)}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Informations supplémentaires */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Informations techniques</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">ID:</span> {selectedCard.id}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Type:</span> {selectedCard.type}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Phase:</span> {getCardPhase(selectedCard)}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Domaine:</span> {getCardDomain(selectedCard)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Pied de la modal */}
            <div className="p-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
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

// Fonction pour obtenir la couleur d'en-tête en fonction du type de carte
const getCardHeaderColor = (type: string): string => {
  switch (type) {
    case 'action':
      return 'bg-gradient-to-r from-blue-600 to-blue-800';
    case 'event':
      return 'bg-gradient-to-r from-purple-600 to-purple-800';
    case 'quiz':
      return 'bg-gradient-to-r from-green-600 to-green-800';
    default:
      return 'bg-gradient-to-r from-gray-600 to-gray-800';
  }
};

// Fonction pour rendre une carte
const renderCard = (card: Card, type: string, onClick: (card: Card) => void, containsMarkdown: (text: string) => boolean) => {
  // Déterminer les couleurs en fonction du type de carte
  let bgColor = "bg-gray-50";
  let borderColor = "border-gray-200";
  
  if (type === "action") {
    bgColor = "bg-blue-50";
    borderColor = "border-blue-200";
  } else if (type === "event") {
    bgColor = "bg-purple-50";
    borderColor = "border-purple-200";
  } else if (type === "quiz") {
    bgColor = "bg-green-50";
    borderColor = "border-green-200";
  }
  
  const cardDomain = getCardDomain(card);
  const description = getCardDescription(card);
  
  return (
    <div 
      key={card.id} 
      className={`${bgColor} border ${borderColor} rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer`}
      onClick={() => onClick(card)}
    >
      <h4 className="text-md font-semibold text-gray-900 mb-2">{getCardTitle(card)}</h4>
      
      {cardDomain && (
        <div className="mb-2">
          <span className="text-xs font-medium text-gray-500">Domaine: {cardDomain}</span>
        </div>
      )}
      
      <div className="text-sm text-gray-700 mb-3 line-clamp-3">
        {containsMarkdown(description) ? (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>{description}</ReactMarkdown>
          </div>
        ) : (
          <p>{description}</p>
        )}
      </div>
      
      {/* Informations spécifiques au type de carte */}
      {type === "action" && (
        <div className="mt-2 text-sm">
          {card.coût && <div className="text-gray-600">Coût: {card.coût}</div>}
          {card.délai && <div className="text-gray-600">Délai: {card.délai}</div>}
        </div>
      )}
      
      {type === "event" && (
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
      
      {type === "quiz" && card.options && (
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
};

export default AllCardsPage; 