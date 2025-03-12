import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export type Project = {
  id: string;
  name: string;
  description: string;
  dataFile: string;
  image?: string;
};

// Liste statique des projets disponibles
const AVAILABLE_PROJECTS: Project[] = [
  {
    id: 'default',
    name: 'Projet par défaut',
    description: 'Projet de gestion classique avec des cartes génériques.',
    dataFile: 'project-cards-default.json',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80',
  },
  {
    id: 'Greentrip',
    name: 'GreenTrip Finder,',
    description: 'Application mobile pour planifier des vacances écologiques et durables.',
    dataFile: 'project-cards-ecovoyage.json',
    image: 'https://images.unsplash.com/photo-1506422748879-887454f9cdff?auto=format&fit=crop&q=80',
  },
];

interface ProjectSelectorProps {
  onSelectProject?: (project: Project) => void;
  standalone?: boolean;
  onClose?: () => void; // Nouvelle prop pour fermer le modal
}

const ProjectSelector = ({ onSelectProject, standalone = false, onClose }: ProjectSelectorProps) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const navigate = useNavigate();

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    
    // Stocker le projet sélectionné dans localStorage
    localStorage.setItem('selectedProject', JSON.stringify(project));
    
    if (onSelectProject) {
      onSelectProject(project);
    }
    
    // Fermer le modal si la fonction onClose est fournie
    if (onClose) {
      onClose();
    }
    
    if (standalone) {
      // Naviguer vers la page de jeu
      navigate('/game');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Choisissez un projet</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {AVAILABLE_PROJECTS.map((project) => (
          <Card 
            key={project.id} 
            className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
              selectedProject?.id === project.id ? 'border-2 border-indigo-500 shadow-md' : ''
            }`}
            onClick={() => handleSelectProject(project)}
          >
            {project.image && (
              <div className="w-full h-40 overflow-hidden">
                <img 
                  src={project.image} 
                  alt={project.name} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <CardHeader>
              <CardTitle>{project.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{project.description}</p>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectProject(project);
                }}
              >
                Sélectionner ce projet
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProjectSelector; 