import React from 'react';
import { Card } from '@/pages/GamePage';
import { 
  getCardTitle, 
  getCardDescription, 
  getCardDomain, 
  getCardCost, 
  getCardTime,
  getCardInfo
} from "@/utils/cardHelpers";

interface DetailSidePanelProps {
  activeCardId: string | null;
  cards: Card[];
  getCardColors: (domain: string) => { bg: string; text: string; border?: string };
  onClose: () => void;
}

const DetailSidePanel: React.FC<DetailSidePanelProps> = ({ 
  activeCardId, 
  cards, 
  getCardColors, 
  onClose 
}) => {
  if (!activeCardId) return null;
  
  const activeCard = cards.find(c => c.id === activeCardId);
  if (!activeCard) return null;
  
  const colors = getCardColors(getCardDomain(activeCard) || "");
  
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
        <p className="text-gray-700 whitespace-pre-line">{getCardDescription(activeCard)}</p>
        
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
        
        {/* Informations supplémentaires */}
        {getCardInfo(activeCard) && (
          <div className="mt-4 p-3 bg-gray-100 rounded-md">
            <h5 className="font-semibold mb-2">Infos</h5>
            <p className="text-sm text-gray-600">{getCardInfo(activeCard)}</p>
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