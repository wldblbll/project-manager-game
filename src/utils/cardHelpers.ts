import { Card } from "@/pages/GamePage";

/**
 * Helper function to get the title of a card regardless of format
 */
export const getCardTitle = (card: Card): string => {
  return card.title || card.nom || "Sans titre";
};

/**
 * Helper function to get the domain of a card regardless of format
 */
export const getCardDomain = (card: Card): string => {
  return card.domain || card.domaine || "default";
};

/**
 * Helper function to get the description of a card regardless of format
 */
export const getCardDescription = (card: Card): string => {
  return card.description || "";
};

/**
 * Helper function to get the info of a card
 */
export const getCardInfo = (card: Card): string => {
  return card.info || "";
};

/**
 * Helper function to get the cost of a card regardless of format
 */
export const getCardCost = (card: Card): string => {
  return card.coût || "";
};

/**
 * Helper function to get the time of a card regardless of format
 */
export const getCardTime = (card: Card): string => {
  return card.délai || "";
};

/**
 * Helper function to get the type of a card regardless of format
 * Standardizes card types to 'action', 'event', or 'quiz'
 */
export const getCardType = (card: Card): string => {
  if (!card.type) return "action"; // Default to action if no type is specified
  
  const type = card.type.toLowerCase();
  
  // Standardize to 'action'
  if (type.includes('action')) {
    return "action";
  }
  
  // Standardize to 'event'
  if (type.includes('event') || type.includes('événement') || type.includes('evenement')) {
    return "event";
  }
  
  // Standardize to 'quiz'
  if (type.includes('quiz') || type.includes('question')) {
    return "quiz";
  }
  
  // Default to original type if no match
  return card.type;
};

/**
 * Helper function to get the phase of a card as a string regardless of format
 */
export const getCardPhase = (card: Card): string => {
  if (Array.isArray(card.phase)) {
    return card.phase.filter(p => p).join(', ');
  }
  return card.phase || "";
};

/**
 * Helper function to get the options of a quiz card
 */
export const getCardOptions = (card: Card): string[] => {
  return card.options || [];
};

/**
 * Helper function to get the correct answer of a quiz card
 */
export const getCardCorrectAnswer = (card: Card): string => {
  return card.correct_answer || "";
};

/**
 * Helper function to get the comment of a quiz card
 */
export const getCardComment = (card: Card): string => {
  return card.comment || "";
};

/**
 * Helper function to get the conditions of an event card
 */
export const getCardConditions = (card: Card) => {
  return card.conditions || [];
};

/**
 * Helper function to check if a card has conditions
 */
export const hasCardConditions = (card: Card): boolean => {
  return !!card.conditions && Array.isArray(card.conditions) && card.conditions.length > 0;
}; 