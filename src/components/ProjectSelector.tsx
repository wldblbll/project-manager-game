import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PROJECTS, Project, DEFAULT_PROJECT_ID } from '@/config/projects';

interface ProjectSelectorProps {
  onClose?: () => void;
  standalone?: boolean;
}

const ProjectSelector: React.FC<ProjectSelectorProps> = ({ onClose, standalone = false }) => {
  const navigate = useNavigate();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    localStorage.setItem('selectedProject', JSON.stringify(project));
    if (onClose) {
      onClose();
    }
    navigate('/game');
  };

  // Ne pas auto-sélectionner le projet, laisser l'utilisateur choisir
  
  // Si le composant est utilisé en mode standalone, afficher une version complète avec arrière-plan
  if (standalone) {
    return (
      <div className="flex flex-col items-center w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {PROJECTS.map((project) => (
            <button
              key={project.id}
              onClick={() => handleProjectSelect(project)}
              className="bg-white bg-opacity-90 p-6 rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 hover:bg-opacity-100"
            >
              <img 
                src={project.image} 
                alt={project.name}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
              <h2 className="text-xl font-bold text-gray-800 mb-2">{project.name}</h2>
              <p className="text-gray-600">{project.description}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Sinon, afficher la version standard (plein écran)
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex flex-col items-center justify-center p-4">
      <img 
        src="/logo.png" 
        alt="PM Cards Logo" 
        className="w-24 h-24 mb-6"
      />
      <h1 className="text-3xl font-bold text-white mb-8">Choisissez votre projet</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        {PROJECTS.map((project) => (
          <button
            key={project.id}
            onClick={() => handleProjectSelect(project)}
            className="bg-white bg-opacity-90 p-6 rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 hover:bg-opacity-100"
          >
            <img 
              src={project.image} 
              alt={project.name}
              className="w-full h-48 object-cover rounded-lg mb-4"
            />
            <h2 className="text-xl font-bold text-gray-800 mb-2">{project.name}</h2>
            <p className="text-gray-600">{project.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProjectSelector; 