import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Card } from '@/pages/GamePage';
import { 
  getCardTitle, 
  getCardDescription, 
  getCardDomain, 
  getCardCost, 
  getCardTime,
  getCardInfo,
  getCardType,
  hasCardConditions
} from "@/utils/cardHelpers";

interface DetailSidePanelProps {
  activeCardId: string | null;
  cards: Card[];
  getCardColors: (domain: string) => { bg: string; text: string; border?: string };
  onClose: () => void;
  allCards?: Card[];
}

const DetailSidePanel: React.FC<DetailSidePanelProps> = ({ 
  activeCardId, 
  cards, 
  getCardColors, 
  onClose,
  allCards = []
}) => {
  if (!activeCardId) return null;
  
  const activeCard = cards.find(c => c.id === activeCardId);
  if (!activeCard) return null;
  
  const colors = getCardColors(getCardDomain(activeCard) || "");
  const cardType = getCardType(activeCard);
  
  // Fonction helper pour obtenir le titre d'une carte à partir de son ID
  const getCardTitleById = (cardId: string): string => {
    const card = allCards.find(c => c.id === cardId);
    if (card) {
      return getCardTitle(card);
    }
    return `Carte #${cardId}`;
  };
  
  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-40 overflow-y-auto transition-transform duration-300 transform translate-x-0 border-l border-gray-200">
      <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-800">Détails de la carte</h3>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
          aria-label="Fermer le panneau"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className={`p-4 ${colors.bg} rounded-lg mx-4 my-3 border ${colors.border || 'border-gray-200'}`}>
        <h4 className={`text-xl font-bold ${colors.text}`}>{getCardTitle(activeCard)}</h4>
        <p className="text-sm text-gray-500 mb-4">
          {getCardDomain(activeCard)}
        </p>
        <div className="prose prose-sm max-w-none text-gray-700">
          <ReactMarkdown>{getCardDescription(activeCard)}</ReactMarkdown>
        </div>
        
        {/* Informations sur le coût et le délai */}
        {(getCardCost(activeCard) || getCardTime(activeCard)) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {getCardCost(activeCard) && (
              <div className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
                Coût: {getCardCost(activeCard)}
              </div>
            )}
            {getCardTime(activeCard) && (
              <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                Délai: {getCardTime(activeCard)}
              </div>
            )}
          </div>
        )}
        
        {/* Afficher les résultats des conditions pour les cartes action */}
        {cardType === 'action' && hasCardConditions(activeCard) && (
          <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
            <h5 className="font-semibold mb-2 text-blue-800">Conditions de la carte</h5>
            <div className="prose prose-sm max-w-none text-gray-700">
              {activeCard.conditionResult ? (
                <>
                  <p>{activeCard.conditionResult.message}</p>
                  
                  {/* Afficher les impacts */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {activeCard.conditionResult.budget !== undefined && (
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        activeCard.conditionResult.budget >= 0 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        Budget: {activeCard.conditionResult.budget >= 0 ? '+' : ''}{activeCard.conditionResult.budget}K€
                      </div>
                    )}
                    {activeCard.conditionResult.time !== undefined && (
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        activeCard.conditionResult.time >= 0 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        Délai: {activeCard.conditionResult.time >= 0 ? '+' : ''}{activeCard.conditionResult.time} jours
                      </div>
                    )}
                    {activeCard.conditionResult.value !== undefined && activeCard.conditionResult.value !== 0 && (
                      <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        Valeur: +{activeCard.conditionResult.value} points
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <p className="italic">Cette carte a des conditions qui seront évaluées en fonction des autres cartes présentes sur le tableau.</p>
                  <div className="mt-2">
                    {activeCard.conditions && activeCard.conditions.map((condition, index) => (
                      <div key={index} className="mb-2 p-2 bg-blue-50 border border-blue-100 rounded">
                        {condition.cardId && (
                          <p>
                            {condition.present 
                              ? `Nécessite la présence de la carte "${getCardTitleById(condition.cardId)}"` 
                              : `Nécessite l'absence de la carte "${getCardTitleById(condition.cardId)}"`}
                          </p>
                        )}
                        {condition.operator && condition.checks && (
                          <div>
                            <p>Condition {condition.operator}:</p>
                            <ul className="list-disc pl-5 mt-1">
                              {condition.checks.map((check, checkIndex) => (
                                <li key={checkIndex}>
                                  {check.present 
                                    ? `Présence de la carte "${getCardTitleById(check.cardId)}"` 
                                    : `Absence de la carte "${getCardTitleById(check.cardId)}"`}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {condition.default && (
                          <p className="italic">Condition par défaut si aucune autre n'est remplie</p>
                        )}
                        {condition.effects && (
                          <div className="mt-2 pt-2 border-t border-blue-100">
                            <p className="font-medium">Effets potentiels:</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {condition.effects.budget !== undefined && (
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  condition.effects.budget >= 0 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                                }`}>
                                  Budget: {condition.effects.budget >= 0 ? '+' : ''}{condition.effects.budget}K€
                                </span>
                              )}
                              {condition.effects.time !== undefined && (
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  condition.effects.time >= 0 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                                }`}>
                                  Délai: {condition.effects.time >= 0 ? '+' : ''}{condition.effects.time} jours
                                </span>
                              )}
                              {condition.effects.value !== undefined && (
                                <span className="px-2 py-1 rounded-full text-xs bg-green-50 text-green-700">
                                  Valeur: +{condition.effects.value} points
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        
        {/* Afficher le contenu spécifique pour les cartes quiz */}
        {cardType === 'quiz' && activeCard.options && (
          <div className="mt-4 p-3 bg-purple-50 rounded-md border border-purple-200">
            <h5 className="font-semibold mb-2 text-purple-800">Question Quiz</h5>
            <div className="prose prose-sm max-w-none text-gray-700">
              <div className="mb-3">
                <p className="font-medium">Options :</p>
                <ul className="list-disc pl-5 mt-1">
                  {activeCard.options.map((option, index) => (
                    <li key={index} className="mb-1">{option}</li>
                  ))}
                </ul>
              </div>
              
              {activeCard.correct_answer && (
                <div className="mb-3">
                  <p className="font-medium">Réponse correcte :</p>
                  <p className="mt-1 bg-green-100 p-2 rounded">{activeCard.correct_answer}</p>
                </div>
              )}
              
              {activeCard.comment && (
                <div>
                  <p className="font-medium">Commentaire :</p>
                  <p className="mt-1 italic">{activeCard.comment}</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Afficher le contenu spécifique pour les cartes événement avec conditions */}
        {cardType === 'event' && hasCardConditions(activeCard) && (
          <div className="mt-4 p-3 bg-amber-50 rounded-md border border-amber-200">
            <h5 className="font-semibold mb-2 text-amber-800">Conditions de l'événement</h5>
            <div className="prose prose-sm max-w-none text-gray-700">
              {activeCard.conditionResult ? (
                <>
                  {activeCard.conditionResult.htmlContent ? (
                    <div dangerouslySetInnerHTML={{ __html: activeCard.conditionResult.htmlContent }} />
                  ) : (
                    <>
                      <p>{activeCard.conditionResult.message}</p>
                      
                      {/* Afficher les impacts */}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {activeCard.conditionResult.budget !== undefined && (
                          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                            activeCard.conditionResult.budget >= 0 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            Budget: {activeCard.conditionResult.budget >= 0 ? '+' : ''}{activeCard.conditionResult.budget}K€
                          </div>
                        )}
                        {activeCard.conditionResult.time !== undefined && (
                          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                            activeCard.conditionResult.time >= 0 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            Délai: {activeCard.conditionResult.time >= 0 ? '+' : ''}{activeCard.conditionResult.time} jours
                          </div>
                        )}
                        {activeCard.conditionResult.value !== undefined && activeCard.conditionResult.value !== 0 && (
                          <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                            Valeur: +{activeCard.conditionResult.value} points
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  <p className="italic">Cet événement a des conditions qui seront évaluées en fonction des autres cartes présentes sur le tableau.</p>
                  <div className="mt-2">
                    {activeCard.conditions && activeCard.conditions.map((condition, index) => (
                      <div key={index} className="mb-2 p-2 bg-amber-50 border border-amber-100 rounded">
                        {condition.cardId && (
                          <p>
                            {condition.present 
                              ? `Nécessite la présence de la carte "${getCardTitleById(condition.cardId)}"` 
                              : `Nécessite l'absence de la carte "${getCardTitleById(condition.cardId)}"`}
                          </p>
                        )}
                        {condition.operator && condition.checks && (
                          <div>
                            <p>Condition {condition.operator}:</p>
                            <ul className="list-disc pl-5 mt-1">
                              {condition.checks.map((check, checkIndex) => (
                                <li key={checkIndex}>
                                  {check.present 
                                    ? `Présence de la carte "${getCardTitleById(check.cardId)}"` 
                                    : `Absence de la carte "${getCardTitleById(check.cardId)}"`}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {condition.default && (
                          <p className="italic">Condition par défaut si aucune autre n'est remplie</p>
                        )}
                        {condition.effects && (
                          <div className="mt-2 pt-2 border-t border-amber-100">
                            <p className="font-medium">Effets potentiels:</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {condition.effects.budget !== undefined && (
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  condition.effects.budget >= 0 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                                }`}>
                                  Budget: {condition.effects.budget >= 0 ? '+' : ''}{condition.effects.budget}K€
                                </span>
                              )}
                              {condition.effects.time !== undefined && (
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  condition.effects.time >= 0 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                                }`}>
                                  Délai: {condition.effects.time >= 0 ? '+' : ''}{condition.effects.time} jours
                                </span>
                              )}
                              {condition.effects.value !== undefined && (
                                <span className="px-2 py-1 rounded-full text-xs bg-green-50 text-green-700">
                                  Valeur: +{condition.effects.value} points
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        
        {/* Informations supplémentaires */}
        {getCardInfo(activeCard) && (
          <div className="mt-4 p-3 bg-gray-100 rounded-md">
            <h5 className="font-semibold mb-2">Infos</h5>
            <div className="prose prose-sm max-w-none text-gray-600">
              <ReactMarkdown>{getCardInfo(activeCard)}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
        >
          Fermer
        </button>
      </div>
    </div>
  );
};

export default DetailSidePanel; 