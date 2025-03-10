import React from 'react';

const features = [
  {
    icon: "🎯",
    name: "Objectifs Clairs",
    description: "Définis et atteins tes objectifs de projet étape par étape, comme dans un vrai jeu vidéo !"
  },
  {
    icon: "🎲",
    name: "Apprentissage Ludique",
    description: "Apprends les concepts de gestion de projet en jouant avec des cartes et en relevant des défis."
  },
  {
    icon: "🏆",
    name: "Système de Points",
    description: "Gagne des points de valeur en prenant les bonnes décisions et en gérant efficacement tes ressources."
  },
  {
    icon: "⚡",
    name: "Décisions Rapides",
    description: "Entraîne-toi à prendre des décisions stratégiques sous pression, comme un vrai chef de projet !"
  },
  {
    icon: "🔄",
    name: "Phases de Projet",
    description: "Découvre les différentes phases d'un projet à travers un gameplay évolutif et stimulant."
  },
  {
    icon: "💡",
    name: "Apprentissage Pratique",
    description: "Mets en pratique les concepts PMBOK dans des scénarios réels et amusants."
  }
];

const Features = () => {
  return (
    <div className="py-24 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Deviens un Pro de la Gestion de Projet ! 🚀
          </h2>
          <p className="mt-6 text-lg leading-8 text-white/80">
            Une approche unique et ludique pour maîtriser les compétences essentielles en gestion de projet.
          </p>
        </div>

        <div className="mx-auto grid max-w-xl grid-cols-1 gap-8 sm:mt-16 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.name}
              className="group relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-sm p-8 hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
            >
              <div className="flex flex-col items-start">
                <span className="text-4xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </span>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {feature.name}
                </h3>
                <p className="text-white/80 text-sm leading-6">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Features;
