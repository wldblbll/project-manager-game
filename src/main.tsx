import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import GameManager from './config/games'

// Initialiser le GameManager avec les jeux par défaut
GameManager.initialize();
GameManager.loadCustomGamesFromStorage();

createRoot(document.getElementById("root")!).render(<App />);
