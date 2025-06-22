# Cards game to learn project management

## Project info

**URL**: https://pmcards.netlify.app/


## 🏗️ Stack Technique

### **Framework & Build Tools**
- **React 18.3.1** - Framework JavaScript principal
- **TypeScript 5.5.3** - Langage de programmation avec typage statique
- **Vite 5.4.1** - Bundler et serveur de développement moderne
- **SWC** - Compilateur rapide pour React (via `@vitejs/plugin-react-swc`)

### **Styling & UI**
- **Tailwind CSS 3.4.11** - Framework CSS utilitaire
- **PostCSS** - Processeur CSS
- **Tailwind Animate** - Animations CSS
- **Shadcn/ui** - Bibliothèque de composants UI (basée sur Radix UI)
- **Radix UI** - Composants UI primitifs headless
- **Material-UI** - Composants Material Design pour React

### **Routing & Navigation**
- **React Router DOM 6.26.2** - Gestion des routes côté client

### **Gestion d'État & Données**
- **TanStack React Query 5.56.2** - Gestion des requêtes et cache
- **React Hook Form 7.53.0** - Gestion des formulaires
- **Zod 3.23.8** - Validation de schémas TypeScript

### **Utilitaires & Helpers**
- **Lucide React** - Icônes
- **Class Variance Authority** - Gestion des variants CSS
- **CLSX & Tailwind Merge** - Utilitaires pour les classes CSS
- **Date-fns** - Manipulation des dates

### **Composants Spécialisés**
- **Recharts** - Graphiques et visualisations
- **Embla Carousel** - Carrousel/slider
- **React Markdown** - Rendu de contenu Markdown
- **Sonner** - Notifications toast

### **Développement & Qualité**
- **ESLint 9.9.0** - Linting JavaScript/TypeScript
- **Lovable Tagger** - Outil de développement

## 🎯 Architecture du Projet

Le projet suit une **architecture moderne React** avec :
- **Composants réutilisables** dans `src/components/`
- **Pages** dans `src/pages/`
- **Configuration centralisée** dans `src/config/`
- **Utilitaires** dans `src/utils/` et `src/lib/`
- **Gestion des données** dans `src/data/`

## 🚀 Particularités

- **Jeu de cartes de gestion de projet** avec gestion de phases, budget et timeline
- **Support de configurations multiples** (différents types de jeux)
- **Interface administrative** pour la gestion des cartes
- **Système de validation** et de scoring
- **Responsive design** avec Tailwind CSS
- **Authentification sécurisée** avec Supabase et Magic Links (liens magiques)
- **Routes protégées** pour sécuriser l'accès aux fonctionnalités

## 🔐 Authentification

L'application utilise **Supabase Auth** avec des **Magic Links** pour une authentification sans mot de passe :

- Connexion par email uniquement (pas de mot de passe requis)
- Lien de connexion sécurisé envoyé par email
- Session persistante avec déconnexion automatique
- Routes protégées pour les fonctionnalités sensibles

Pour configurer l'authentification, consultez le fichier [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md).
