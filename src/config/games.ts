import defaultGameConfig from "@/data/game-config.json";

// Types pour la configuration unifiée des jeux
export type GameInfo = {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
};

export type UnifiedGameConfig = {
  gameInfo: GameInfo;
  gameSettings: {
    initialBudget: number;
    initialTime: number;
    cardWidth: number;
    cardHeight: number;
    cardMargin: number;
    cardsPerRow: number;
    boardTopMargin: number;
  };
  phases: {
    name: string;
    order: number;
    requiredCards: string[];
    cardLimits: {
      action: number;
      event: number;
      quiz: number;
    };
    penalties: {
      time: number;
      budget: number;
      value: number;
      message: string;
    };
  }[];
  cardValueRules: {
    condition: string;
    points: number;
  }[];
  cards: {
    id: string;
    type: string;
    domain: string;
    phase: string | string[];
    title: string;
    description: string;
    cost?: number;
    delay?: number;
    value?: number;
    options?: string[];
    correct_answer?: string;
    comment?: string;
    conditions?: {
      cardId?: string;
      present?: boolean;
      operator?: "AND" | "OR";
      checks?: { cardId: string; present: boolean }[];
      default?: boolean;
      effects?: {
        budget?: number;
        time?: number;
        value?: number;
        message?: string;
      };
    }[];
  }[];
};

// Configuration par défaut
export const DEFAULT_GAME_CONFIG = defaultGameConfig as UnifiedGameConfig;

// Stockage des jeux chargés
export class GameManager {
  private static games: Map<string, UnifiedGameConfig> = new Map();
  private static customGames: Map<string, UnifiedGameConfig> = new Map();

  // Initialiser avec le jeu par défaut
  static initialize() {
    this.games.set(DEFAULT_GAME_CONFIG.gameInfo.id, DEFAULT_GAME_CONFIG);
  }

  // Ajouter un jeu personnalisé
  static addCustomGame(config: UnifiedGameConfig): string {
    const gameId = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const gameWithId = {
      ...config,
      gameInfo: {
        ...config.gameInfo,
        id: gameId
      }
    };
    this.customGames.set(gameId, gameWithId);
    return gameId;
  }

  // Obtenir un jeu par ID
  static getGame(gameId: string): UnifiedGameConfig | null {
    return this.games.get(gameId) || this.customGames.get(gameId) || null;
  }

  // Obtenir tous les jeux disponibles
  static getAllGames(): UnifiedGameConfig[] {
    return [...this.games.values(), ...this.customGames.values()];
  }

  // Obtenir les jeux par défaut
  static getDefaultGames(): UnifiedGameConfig[] {
    return [...this.games.values()];
  }

  // Obtenir les jeux personnalisés
  static getCustomGames(): UnifiedGameConfig[] {
    return [...this.customGames.values()];
  }

  // Supprimer un jeu personnalisé
  static removeCustomGame(gameId: string): boolean {
    return this.customGames.delete(gameId);
  }

  // Valider la structure d'un fichier de configuration
  static validateGameConfig(config: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Vérifier la structure de base
    if (!config.gameInfo) {
      errors.push("Section 'gameInfo' manquante");
    } else {
      if (!config.gameInfo.id) errors.push("ID du jeu manquant");
      if (!config.gameInfo.name) errors.push("Nom du jeu manquant");
    }

    if (!config.gameSettings) {
      errors.push("Section 'gameSettings' manquante");
    } else {
      const requiredSettings = ['initialBudget', 'initialTime', 'cardWidth', 'cardHeight', 'cardMargin', 'cardsPerRow'];
      requiredSettings.forEach(setting => {
        if (typeof config.gameSettings[setting] !== 'number') {
          errors.push(`Paramètre '${setting}' manquant ou invalide`);
        }
      });
    }

    if (!Array.isArray(config.phases)) {
      errors.push("Section 'phases' manquante ou invalide");
    } else {
      config.phases.forEach((phase: any, index: number) => {
        if (!phase.name) errors.push(`Phase ${index + 1}: nom manquant`);
        if (!phase.cardLimits) errors.push(`Phase ${index + 1}: limites de cartes manquantes`);
        if (!phase.penalties) errors.push(`Phase ${index + 1}: pénalités manquantes`);
      });
    }

    if (!Array.isArray(config.cards)) {
      errors.push("Section 'cards' manquante ou invalide");
    } else {
      config.cards.forEach((card: any, index: number) => {
        if (!card.id) errors.push(`Carte ${index + 1}: ID manquant`);
        if (!card.type) errors.push(`Carte ${index + 1}: type manquant`);
        if (!card.title) errors.push(`Carte ${index + 1}: titre manquant`);
        if (!card.description) errors.push(`Carte ${index + 1}: description manquante`);
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Charger un fichier JSON personnalisé
  static async loadCustomGameFile(file: File): Promise<{ success: boolean; gameId?: string; errors?: string[] }> {
    try {
      const text = await file.text();
      const config = JSON.parse(text);

      // Valider la configuration
      const validation = this.validateGameConfig(config);
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors
        };
      }

      // Ajouter le jeu
      const gameId = this.addCustomGame(config);
      
      return {
        success: true,
        gameId
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Erreur lors du chargement du fichier: ${error instanceof Error ? error.message : 'Erreur inconnue'}`]
      };
    }
  }

  // Sauvegarder un jeu personnalisé dans le localStorage
  static saveCustomGamesToStorage() {
    const customGamesArray = Array.from(this.customGames.values());
    localStorage.setItem('pmCardsCustomGames', JSON.stringify(customGamesArray));
  }

  // Charger les jeux personnalisés depuis le localStorage
  static loadCustomGamesFromStorage() {
    try {
      const stored = localStorage.getItem('pmCardsCustomGames');
      if (stored) {
        const customGamesArray = JSON.parse(stored);
        customGamesArray.forEach((game: UnifiedGameConfig) => {
          this.customGames.set(game.gameInfo.id, game);
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des jeux personnalisés:', error);
    }
  }

  // Exporter un jeu en JSON
  static exportGame(gameId: string): string | null {
    const game = this.getGame(gameId);
    if (!game) return null;
    
    return JSON.stringify(game, null, 2);
  }
}

export default GameManager; 