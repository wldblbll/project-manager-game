import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, CheckCircle, XCircle, Download, Trash2 } from 'lucide-react';
import GameManager, { UnifiedGameConfig } from '@/config/games';

interface GameLoaderProps {
  onGameSelected: (gameId: string) => void;
  selectedGameId?: string;
}

const GameLoader: React.FC<GameLoaderProps> = ({ onGameSelected, selectedGameId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [customGames, setCustomGames] = useState<UnifiedGameConfig[]>(GameManager.getCustomGames());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allGames = GameManager.getAllGames();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await GameManager.loadCustomGameFile(file);
      
      if (result.success && result.gameId) {
        setSuccess(`Jeu "${file.name}" chargé avec succès !`);
        setCustomGames(GameManager.getCustomGames());
        // Sélectionner automatiquement le nouveau jeu
        onGameSelected(result.gameId);
      } else {
        setError(`Erreur lors du chargement : ${result.errors?.join(', ')}`);
      }
    } catch (err) {
      setError('Erreur inattendue lors du chargement du fichier');
    } finally {
      setIsLoading(false);
      // Réinitialiser l'input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleExportGame = (gameId: string) => {
    const gameData = GameManager.exportGame(gameId);
    if (gameData) {
      const game = GameManager.getGame(gameId);
      const fileName = `${game?.gameInfo.name || 'game'}.json`;
      
      const blob = new Blob([gameData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleDeleteGame = (gameId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce jeu ?')) {
      GameManager.removeCustomGame(gameId);
      GameManager.saveCustomGamesToStorage();
      setCustomGames(GameManager.getCustomGames());
      
      // Si le jeu supprimé était sélectionné, sélectionner le jeu par défaut
      if (selectedGameId === gameId) {
        onGameSelected('ecovoyage');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Section de chargement de fichier */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Charger un jeu personnalisé
          </CardTitle>
          <CardDescription>
            Téléchargez votre propre fichier JSON de configuration de jeu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                {isLoading ? 'Chargement...' : 'Sélectionner un fichier'}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            
            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section des jeux disponibles */}
      <Card>
        <CardHeader>
          <CardTitle>Jeux disponibles</CardTitle>
          <CardDescription>
            Sélectionnez un jeu pour commencer à jouer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {allGames.map((game) => (
              <Card
                key={game.gameInfo.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedGameId === game.gameInfo.id
                    ? 'ring-2 ring-blue-500 bg-blue-50'
                    : ''
                }`}
                onClick={() => onGameSelected(game.gameInfo.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{game.gameInfo.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {game.gameInfo.description}
                      </CardDescription>
                    </div>
                    <div className="flex gap-1">
                      {game.gameInfo.id.startsWith('custom-') && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExportGame(game.gameInfo.id);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteGame(game.gameInfo.id);
                            }}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      {game.cards.length} cartes
                    </Badge>
                    <Badge variant="outline">
                      {game.phases.length} phases
                    </Badge>
                    {game.gameInfo.id.startsWith('custom-') && (
                      <Badge variant="default" className="bg-green-600">
                        Personnalisé
                      </Badge>
                    )}
                  </div>
                  <div className="mt-3 text-sm text-gray-600">
                    <p>Budget initial: {game.gameSettings.initialBudget}K€</p>
                    <p>Temps initial: {game.gameSettings.initialTime} mois</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Section d'aide */}
      <Card>
        <CardHeader>
          <CardTitle>Format du fichier JSON</CardTitle>
          <CardDescription>
            Structure requise pour les fichiers de configuration personnalisés
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Structure de base :</h4>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const template = GameManager.exportGame('ecovoyage');
                  if (template) {
                    const blob = new Blob([template], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'template-jeu.json';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Télécharger un modèle
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GameLoader; 