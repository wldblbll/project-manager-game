import defaultProjectCards from "@/data/project-cards-ecovoyageBis.json";
import ecovoyageProjectCards from "@/data/project-cards-ecovoyage.json";

export const PROJECT_FILES = {
  'project-cards-ecovoyageBis.json': defaultProjectCards,
  'project-cards-ecovoyage.json': ecovoyageProjectCards,
} as const;

export const PROJECTS = [
  {
    id: 'greentrip',
    name: 'GreenTrip Finder',
    description: 'Développement d\'une application de voyage éco-responsable - Version améliorée',
    dataFile: 'project-cards-ecovoyageBis.json',
    image: '/greentrip.jpeg'
  },
  {
    id: 'ecovoyage-old',
    name: 'EcoVoyage old',
    description: 'Développement d\'une application de voyage éco-responsable',
    dataFile: 'project-cards-ecovoyage.json',
    image: '/greentrip.jpeg'
  }
] as const;

export type Project = typeof PROJECTS[number]; 