import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Modal, Paper, Radio, RadioGroup, FormControlLabel, FormControl, Alert } from '@mui/material';
import { styled, keyframes } from '@mui/system';
import { Card } from "@/pages/GamePage";
import { 
  getCardTitle, 
  getCardDescription, 
  getCardDomain, 
  getCardType,
  getCardOptions,
  getCardCorrectAnswer,
  getCardComment,
  hasCardConditions,
  getCardConditions
} from "@/utils/cardHelpers";

// Debug mode flag - set to false by default, can be enabled via props
const DEFAULT_DEBUG_MODE = false;

// Animation de rotation avec effet de ralentissement
const spin = keyframes`
  0% { transform: rotate(0deg); }
  80% { transform: rotate(340deg); }
  95% { transform: rotate(350deg); }
  100% { transform: rotate(360deg); }
`;

// Animation pour l'effet de tirage de carte
const cardReveal = keyframes`
  0% { transform: translateY(50px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
`;

interface RandomCardWheelProps {
  cards: Card[];
  currentPhase: string;
  onCardEffect?: (card: Card) => void;
  onQuizCorrectAnswer?: () => void; // Callback pour ajouter des points quand une réponse est correcte
  debugMode?: boolean; // Prop pour activer le mode debug
  onCardSelected?: (card: Card) => void; // Nouvelle prop pour informer quand une carte est tirée
  cardLimits?: { action: number; event: number; quiz: number }; // Limites de cartes
  cardUsage?: { action: number; event: number; quiz: number }; // Utilisation actuelle des cartes
}

const RandomCardWheel: React.FC<RandomCardWheelProps> = ({ 
  cards, 
  currentPhase, 
  onCardEffect,
  onQuizCorrectAnswer,
  debugMode = DEFAULT_DEBUG_MODE,
  onCardSelected,
  cardLimits = { action: 0, event: 0, quiz: 0 },
  cardUsage = { action: 0, event: 0, quiz: 0 }
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [open, setOpen] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [cardType, setCardType] = useState<'event' | 'question' | null>(null);
  const [pointsAwarded, setPointsAwarded] = useState(false);
  const [valuePointsCounter, setValuePointsCounter] = useState(0);
  
  // Garder une trace des cartes déjà tirées
  const [drawnEventCards, setDrawnEventCards] = useState<string[]>([]);
  const [drawnQuizCards, setDrawnQuizCards] = useState<string[]>([]);
  
  // État pour les messages d'alerte
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState(false);

  // Filtrer les cartes par phase actuelle et type, en excluant celles déjà tirées
  const getFilteredCards = (type: 'event' | 'question') => {
    const drawnCardIds = type === 'event' ? drawnEventCards : drawnQuizCards;
    
    const filtered = cards.filter(card => {
      const cardPhases = Array.isArray(card.phase) ? card.phase : [card.phase];
      const cardType = getCardType(card);
      // Exclure les cartes déjà tirées
      return cardPhases.includes(currentPhase) && 
             cardType === type && 
             !drawnCardIds.includes(card.id);
    });
    
    if (debugMode) {
      console.log(`Cartes de type ${type} disponibles pour la phase ${currentPhase}:`, filtered.length);
    }
    return filtered;
  };

  const eventCards = getFilteredCards('event');
  const quizCards = getFilteredCards('question');
  
  // Log pour déboguer les cartes quiz (uniquement en mode debug)
  if (debugMode) {
    console.log("Nombre de cartes quiz disponibles:", quizCards.length);
    console.log("Cartes quiz déjà tirées:", drawnQuizCards);
    console.log("Nombre de cartes événement disponibles:", eventCards.length);
    console.log("Cartes événement déjà tirées:", drawnEventCards);
  }

  // Fonction pour vérifier si une limite de carte est atteinte
  const isCardLimitReached = (type: 'event' | 'question') => {
    const cardType = type === 'event' ? 'event' : 'quiz';
    return cardUsage[cardType] >= cardLimits[cardType];
  };

  const handleSpin = (type: 'event' | 'question') => {
    // Vérifier si la limite de cartes est atteinte
    if (isCardLimitReached(type)) {
      const cardType = type === 'event' ? 'événement' : 'quiz';
      const message = `Limite de cartes ${cardType} atteinte pour cette phase ! (${cardUsage[type === 'event' ? 'event' : 'quiz']}/${cardLimits[type === 'event' ? 'event' : 'quiz']})`;
      setAlertMessage(message);
      setShowAlert(true);
      
      // Masquer l'alerte après 5 secondes
      setTimeout(() => {
        setShowAlert(false);
      }, 5000);
      
      return;
    }

    const filteredCards = type === 'event' ? eventCards : quizCards;
    
    if (filteredCards.length === 0) {
      // Afficher un message si toutes les cartes ont été tirées
      const message = `Toutes les cartes ${type === 'event' ? 'événement' : 'quiz'} disponibles ont déjà été tirées. Essayez un autre type de carte.`;
      setAlertMessage(message);
      setShowAlert(true);
      
      // Masquer l'alerte après 5 secondes
      setTimeout(() => {
        setShowAlert(false);
      }, 5000);
      
      return;
    }

    setCardType(type);
    setIsSpinning(true);
    setSelectedCard(null);
    setSelectedAnswer('');
    setShowResult(false);
    setPointsAwarded(false);
    setAlertMessage(null);
    setShowAlert(false);

    // Animation plus rapide (1 seconde au lieu de 2)
    setTimeout(() => {
      // Sélectionner une carte aléatoire
      const randomIndex = Math.floor(Math.random() * filteredCards.length);
      const card = filteredCards[randomIndex];
      
      // Vérifier si la carte a des conditions
      console.log("Carte sélectionnée dans handleSpin:", card);
      console.log("Type de la carte:", getCardType(card));
      console.log("La carte a-t-elle des conditions?", !!card.conditions);
      
      if (card.conditions) {
        console.log("Conditions de la carte:", JSON.stringify(card.conditions));
      }
      
      setSelectedCard(card);
      
      // Ajouter la carte à la liste des cartes déjà tirées
      if (type === 'event') {
        setDrawnEventCards(prev => [...prev, card.id]);
      } else {
        setDrawnQuizCards(prev => [...prev, card.id]);
      }
      
      // Informer le parent qu'une carte a été tirée
      if (onCardSelected) {
        onCardSelected(card);
      }
      
      // Log pour déboguer la carte sélectionnée (uniquement en mode debug)
      if (debugMode) {
        console.log("Carte sélectionnée:", card);
        console.log("Type de la carte:", getCardType(card));
        console.log("ID de la carte:", card.id);
        
        if (getCardType(card) === 'question') {
          console.log("Options de la carte:", getCardOptions(card));
          console.log("Bonne réponse:", getCardCorrectAnswer(card));
          console.log("Commentaire explicatif:", getCardComment(card));
        }
      }
      
      setOpen(true);
      setIsSpinning(false);

      // Si c'est une carte événement, appliquer son effet
      if (type === 'event' && onCardEffect) {
        console.log("Appel de onCardEffect avec la carte:", card);
        // Créer une copie de la carte pour s'assurer que toutes les propriétés sont transmises
        const cardCopy = JSON.parse(JSON.stringify(card));
        onCardEffect(cardCopy);
      }
    }, 1000);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleAnswerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedAnswer(event.target.value);
  };

  const handleSubmitAnswer = () => {
    if (selectedCard && getCardType(selectedCard) === 'question') {
      setShowResult(true);
      
      // Si la réponse est correcte et que les points n'ont pas encore été attribués
      if (selectedAnswer === getCardCorrectAnswer(selectedCard) && !pointsAwarded && onQuizCorrectAnswer) {
        // Appeler la fonction de callback pour ajouter des points
        if (debugMode) {
          console.log("Réponse correcte, appel de onQuizCorrectAnswer");
        }
        onQuizCorrectAnswer();
        if (debugMode) {
          console.log("onQuizCorrectAnswer appelé avec succès");
        }
        setPointsAwarded(true);
        setValuePointsCounter(prev => prev + 10); // Incrémenter le compteur local pour vérification
        
        if (debugMode) {
          console.log("Points de valeur ajoutés: +10 (Total local:", valuePointsCounter + 10, ")");
        }
      }
    }
  };

  // Obtenir la couleur de fond en fonction du type de carte
  const getCardBackgroundColor = (type: 'event' | 'question' | null) => {
    return type === 'event' ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : 'linear-gradient(135deg, #0ea5e9, #3b82f6)';
  };

  // Effet pour vérifier l'incrémentation des points
  useEffect(() => {
    if (valuePointsCounter > 0 && debugMode) {
      console.log("Vérification des points de valeur - Compteur local:", valuePointsCounter);
    }
  }, [valuePointsCounter, debugMode]);

  // Fonction pour réinitialiser les cartes tirées
  const handleResetDrawnCards = (type: 'event' | 'question' | 'all') => {
    if (type === 'event' || type === 'all') {
      setDrawnEventCards([]);
    }
    if (type === 'question' || type === 'all') {
      setDrawnQuizCards([]);
    }
    
    setAlertMessage(`Les cartes ${type === 'all' ? 'événement et quiz' : type} ont été réinitialisées.`);
    setShowAlert(true);
    
    // Masquer l'alerte après 3 secondes
    setTimeout(() => {
      setShowAlert(false);
    }, 3000);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', gap: 2 }}>
        {/* Bouton pour les événements */}
        <button
          onClick={() => handleSpin('event')}
          disabled={isSpinning || eventCards.length === 0}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center shadow-sm"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Événement aléatoire {eventCards.length > 0 ? `(${eventCards.length})` : '(0)'}
        </button>

        {/* Bouton pour les quiz */}
        <button
          onClick={() => handleSpin('question')}
          disabled={isSpinning || quizCards.length === 0}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center shadow-sm"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Quiz aléatoire {quizCards.length > 0 ? `(${quizCards.length})` : '(0)'}
        </button>
      </Box>
      
      {/* Boutons de réinitialisation (uniquement en mode debug) */}
      {debugMode && (
        <Box sx={{ display: 'flex', gap: 2 }}>
          <button
            onClick={() => handleResetDrawnCards('event')}
            disabled={drawnEventCards.length === 0}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-xs font-medium transition-colors"
          >
            Réinitialiser événements
          </button>
          <button
            onClick={() => handleResetDrawnCards('question')}
            disabled={drawnQuizCards.length === 0}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-xs font-medium transition-colors"
          >
            Réinitialiser quiz
          </button>
        </Box>
      )}
      
      {/* Alerte pour les messages */}
      {showAlert && alertMessage && (
        <Alert 
          severity={alertMessage.includes('déjà été tirées') ? 'warning' : 'info'}
          onClose={() => setShowAlert(false)}
          sx={{ mt: 1 }}
        >
          {alertMessage}
        </Alert>
      )}

      {/* Animation de la roue */}
      {isSpinning && (
        <Modal
          open={isSpinning}
          aria-labelledby="wheel-modal"
        >
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
            textAlign: 'center',
            width: '300px',
            background: getCardBackgroundColor(cardType),
            color: 'white'
          }}>
            <Typography variant="h6" component="h2" gutterBottom>
              {cardType === 'event' ? 'Tirage d\'un événement...' : 'Tirage d\'un quiz...'}
            </Typography>
            
            <Box sx={{
              width: '100px',
              height: '100px',
              margin: '0 auto',
              borderRadius: '50%',
              border: '8px solid white',
              borderTop: '8px solid rgba(255, 255, 255, 0.3)',
              animation: `${spin} 1s ease-out infinite`,
              boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
            }} />
            
            <Typography variant="body2" sx={{ mt: 2, opacity: 0.9 }}>
              La chance est en train de décider...
            </Typography>
          </Box>
        </Modal>
      )}

      {/* Modale pour afficher la carte */}
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="random-card-modal"
        aria-describedby="random-card-description"
      >
        <Paper sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          borderRadius: 3,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: `${cardReveal} 0.3s ease-out`,
          p: 0
        }}>
          {selectedCard && (
            <>
              {/* En-tête de la carte */}
              <Box sx={{
                p: 3,
                background: getCardBackgroundColor(cardType),
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                flexShrink: 0
              }}>
                <Box sx={{
                  position: 'absolute',
                  top: '-20px',
                  right: '-20px',
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  zIndex: 0
                }} />
                
                <Typography id="random-card-modal" variant="h5" component="h2" sx={{ fontWeight: 'bold', position: 'relative', zIndex: 1 }}>
                  {getCardTitle(selectedCard)}
                </Typography>
                
                <Typography variant="body2" sx={{ mt: 1, opacity: 0.9, position: 'relative', zIndex: 1 }}>
                  {cardType === 'event' ? 'Événement' : 'Quiz'}
                </Typography>
              </Box>

              {/* Contenu de la carte avec défilement */}
              <Box sx={{ 
                p: 3, 
                overflowY: 'auto',
                flexGrow: 1
              }}>
                {getCardType(selectedCard) === 'event' && (
                  <>
                    <Typography variant="body1" sx={{ mb: 3 }}>
                      {getCardDescription(selectedCard)}
                    </Typography>
                    
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      gap: 2, 
                      mt: 2,
                      p: 2,
                      borderRadius: 2,
                      background: 'rgba(0, 0, 0, 0.03)'
                    }}>
                      {selectedCard && hasCardConditions(selectedCard) ? (
                        // Affichage amélioré pour les cartes avec impacts conditionnels
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" color="primary.main" sx={{ mb: 1, fontWeight: 'bold' }}>
                            Impact conditionnel
                          </Typography>
                          
                          {/* Explication claire des conditions */}
                          <Typography variant="body2" sx={{ mb: 2 }}>
                            Cette carte a différents effets selon les cartes présentes sur votre plateau :
                          </Typography>
                          
                          {/* Liste des conditions et leurs effets */}
                          {getCardConditions(selectedCard).map((condition, index) => {
                            // Déterminer le type de condition
                            let conditionText = "";
                            let effectsText = "";
                            let isConditionMet = false;
                            
                            // Récupérer les IDs des cartes actuellement sur le plateau
                            const boardCardIds = cards.filter(c => c.position).map(c => c.id);
                            
                            // Condition simple
                            if (condition.cardId && condition.present !== undefined) {
                              // Vérifier si la condition est remplie
                              const cardPresent = boardCardIds.includes(condition.cardId);
                              isConditionMet = (cardPresent === condition.present);
                              
                              // Trouver le titre de la carte pour l'explication
                              const cardTitle = cards.find(c => c.id === condition.cardId)
                                ? getCardTitle(cards.find(c => c.id === condition.cardId)!)
                                : `Carte #${condition.cardId}`;
                                
                              conditionText = condition.present 
                                ? `Si la carte "${cardTitle}" est présente sur le plateau`
                                : `Si la carte "${cardTitle}" est absente du plateau`;
                            }
                            // Condition avec opérateur logique
                            else if (condition.operator && condition.checks) {
                              const checkResults = condition.checks.map(check => {
                                const cardPresent = boardCardIds.includes(check.cardId);
                                const result = cardPresent === check.present;
                                
                                const cardTitle = cards.find(c => c.id === check.cardId)
                                  ? getCardTitle(cards.find(c => c.id === check.cardId)!)
                                  : `Carte #${check.cardId}`;
                                  
                                return {
                                  text: `"${cardTitle}" ${check.present ? 'présente' : 'absente'}`,
                                  result: result
                                };
                              });
                              
                              if (condition.operator === "AND") {
                                isConditionMet = checkResults.every(check => check.result);
                              } else if (condition.operator === "OR") {
                                isConditionMet = checkResults.some(check => check.result);
                              }
                              
                              conditionText = `Si ${checkResults.map(check => check.text).join(condition.operator === 'AND' ? ' ET ' : ' OU ')}`;
                            }
                            // Condition par défaut
                            else if (condition.default) {
                              // La condition par défaut est remplie si aucune autre condition n'est remplie
                              isConditionMet = true; // Simplifié pour l'affichage
                              conditionText = "Dans tous les autres cas";
                            }
                            
                            // Texte des effets
                            if (condition.effects) {
                              const effects = [];
                              
                              if (condition.effects.budget !== undefined) {
                                effects.push(`Budget: ${condition.effects.budget > 0 ? '+' : ''}${condition.effects.budget}K€`);
                              }
                              
                              if (condition.effects.time !== undefined) {
                                effects.push(`Délai: ${condition.effects.time > 0 ? '+' : ''}${condition.effects.time} mois`);
                              }
                              
                              if (condition.effects.message) {
                                effects.push(condition.effects.message);
                              }
                              
                              effectsText = effects.join(', ');
                            }
                            
                            return (
                              <Box key={index} sx={{ 
                                mb: 2, 
                                p: 1.5, 
                                borderRadius: 1,
                                borderLeft: '4px solid', 
                                borderColor: isConditionMet ? 'success.main' : 'grey.400',
                                bgcolor: isConditionMet ? 'rgba(46, 125, 50, 0.08)' : 'rgba(0, 0, 0, 0.02)'
                              }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    {conditionText}
                                  </Typography>
                                  <Typography 
                                    variant="caption" 
                                    sx={{ 
                                      fontWeight: 'bold', 
                                      color: isConditionMet ? 'success.main' : 'text.secondary',
                                      bgcolor: isConditionMet ? 'rgba(46, 125, 50, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                                      px: 1,
                                      py: 0.5,
                                      borderRadius: 1
                                    }}
                                  >
                                    {isConditionMet ? 'Condition remplie' : 'Condition non remplie'}
                                  </Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary">
                                  {effectsText}
                                </Typography>
                              </Box>
                            );
                          })}
                          
                          <Typography variant="body2" color="info.main" sx={{ mt: 1, fontStyle: 'italic' }}>
                            L'effet appliqué dépend de l'état actuel de votre plateau de jeu.
                          </Typography>
                        </Box>
                      ) : (
                        // Affichage standard pour les cartes sans conditions
                        <>
                          {selectedCard && selectedCard.coût && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'bold', minWidth: 80 }}>
                                Impact budget:
                              </Typography>
                              <Typography variant="body1" color={selectedCard.coût.includes('-') ? 'error.main' : 'success.main'} sx={{ fontWeight: 'bold' }}>
                                {selectedCard.coût}
                              </Typography>
                            </Box>
                          )}
                          
                          {selectedCard && selectedCard.délai && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'bold', minWidth: 80 }}>
                                Impact délai:
                              </Typography>
                              <Typography variant="body1" color={selectedCard.délai.includes('-') ? 'success.main' : 'error.main'} sx={{ fontWeight: 'bold' }}>
                                {selectedCard.délai}
                              </Typography>
                            </Box>
                          )}
                        </>
                      )}
                    </Box>
                  </>
                )}

                {getCardType(selectedCard) === 'question' && (
                  <>
                    <Typography variant="body1" sx={{ mb: 3, fontWeight: 'medium' }}>
                      {getCardDescription(selectedCard)}
                    </Typography>
                    
                    <FormControl component="fieldset" sx={{ width: '100%' }}>
                      <RadioGroup
                        aria-label="quiz"
                        name="quiz"
                        value={selectedAnswer}
                        onChange={handleAnswerChange}
                      >
                        {Array.isArray(getCardOptions(selectedCard)) && getCardOptions(selectedCard).map((option, index) => (
                          <FormControlLabel
                            key={index}
                            value={option.charAt(0)}
                            control={
                              <Radio 
                                sx={{ 
                                  color: showResult && option.charAt(0) === getCardCorrectAnswer(selectedCard) ? 'success.main' : undefined,
                                  '&.Mui-checked': {
                                    color: showResult && option.charAt(0) === getCardCorrectAnswer(selectedCard) ? 'success.main' : undefined
                                  }
                                }}
                              />
                            }
                            label={
                              <Typography 
                                variant="body1" 
                                sx={{ 
                                  fontWeight: showResult && option.charAt(0) === getCardCorrectAnswer(selectedCard) ? 'bold' : 'normal',
                                  color: showResult && option.charAt(0) === getCardCorrectAnswer(selectedCard) ? 'success.main' : 'text.primary'
                                }}
                              >
                                {option}
                              </Typography>
                            }
                            disabled={showResult}
                            sx={{
                              mb: 1,
                              p: 1,
                              borderRadius: 1,
                              bgcolor: showResult ? (
                                option.charAt(0) === getCardCorrectAnswer(selectedCard) 
                                  ? 'rgba(46, 125, 50, 0.1)' 
                                  : (option.charAt(0) === selectedAnswer ? 'rgba(211, 47, 47, 0.1)' : 'transparent')
                              ) : 'transparent'
                            }}
                          />
                        ))}
                      </RadioGroup>
                    </FormControl>

                    {!showResult ? (
                      <Button 
                        variant="contained" 
                        onClick={handleSubmitAnswer}
                        disabled={!selectedAnswer}
                        sx={{ 
                          mt: 3,
                          bgcolor: '#3b82f6',
                          '&:hover': {
                            bgcolor: '#2563eb'
                          }
                        }}
                        fullWidth
                      >
                        Valider ma réponse
                      </Button>
                    ) : (
                      <>
                        <Box sx={{ 
                          mt: 3, 
                          p: 2, 
                          borderRadius: 2,
                          bgcolor: selectedAnswer === getCardCorrectAnswer(selectedCard) ? 'rgba(46, 125, 50, 0.1)' : 'rgba(211, 47, 47, 0.1)',
                          border: `1px solid ${selectedAnswer === getCardCorrectAnswer(selectedCard) ? 'rgba(46, 125, 50, 0.3)' : 'rgba(211, 47, 47, 0.3)'}`
                        }}>
                          <Typography variant="body1" sx={{ 
                            fontWeight: 'bold',
                            color: selectedAnswer === getCardCorrectAnswer(selectedCard) ? 'success.main' : 'error.main',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }}>
                            {selectedAnswer === getCardCorrectAnswer(selectedCard) ? (
                              <>
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM8 15L3 10L4.41 8.59L8 12.17L15.59 4.58L17 6L8 15Z" fill="#2e7d32"/>
                                </svg>
                                Bonne réponse ! +10 points
                              </>
                            ) : (
                              <>
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM15 13.59L13.59 15L10 11.41L6.41 15L5 13.59L8.59 10L5 6.41L6.41 5L10 8.59L13.59 5L15 6.41L11.41 10L15 13.59Z" fill="#d32f2f"/>
                                </svg>
                                Mauvaise réponse
                              </>
                            )}
                          </Typography>
                          
                          {selectedAnswer !== getCardCorrectAnswer(selectedCard) && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              La bonne réponse est : {getCardOptions(selectedCard)?.find(opt => opt.charAt(0) === getCardCorrectAnswer(selectedCard))}
                            </Typography>
                          )}
                        </Box>
                        
                        {/* Affichage du commentaire explicatif */}
                        {getCardComment(selectedCard) && (
                          <Box sx={{ mt: 3, p: 2, borderRadius: 2, bgcolor: 'rgba(0, 0, 0, 0.03)' }}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Explication :
                            </Typography>
                            <Typography variant="body2">
                              {getCardComment(selectedCard)}
                            </Typography>
                          </Box>
                        )}
                      </>
                    )}
                  </>
                )}
              </Box>

              {/* Pied de la carte */}
              <Box sx={{ 
                p: 2, 
                borderTop: '1px solid rgba(0, 0, 0, 0.1)', 
                display: 'flex', 
                justifyContent: 'flex-end',
                flexShrink: 0
              }}>
                <Button 
                  variant="outlined" 
                  onClick={handleClose} 
                  sx={{ 
                    borderRadius: '20px',
                    px: 3
                  }}
                >
                  Fermer
                </Button>
              </Box>
            </>
          )}
        </Paper>
      </Modal>
    </Box>
  );
};

export default RandomCardWheel; 