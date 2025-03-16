// Définition du fichier JSON du projet (mentionné une seule fois)
const PROJECT_FILE = 'project-cards-ecovoyageBis.json';

// Importer le fichier de projet
import projectCards from "@/data/project-cards-ecovoyageBis.json";

// Exporter les cartes du projet
export const PROJECT_FILES = {
  [PROJECT_FILE]: projectCards
} as const;

// Définir le projet disponible avec l'ID du projet par défaut
export const DEFAULT_PROJECT_ID = 'greentrip';

// Définir les projets disponibles
export const PROJECTS = [
  {
    id: DEFAULT_PROJECT_ID,
    name: 'GreenTrip Finder',
    description: 'Développement d\'une application de voyage éco-responsable - Version améliorée',
    dataFile: PROJECT_FILE,
    image: '/greentrip.jpeg',
    cards: projectCards
  }
] as const;

// Type pour les projets
export type Project = typeof PROJECTS[number]; 