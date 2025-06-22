# Configuration Supabase pour PMCards

## 1. Créer un projet Supabase

1. Allez sur [supabase.com](https://supabase.com) et créez un compte
2. Créez un nouveau projet
3. Notez l'URL de votre projet et la clé API (anon key)

## 2. Configuration des variables d'environnement

Créez un fichier `.env.local` à la racine du projet avec :

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Remplacez les valeurs par celles de votre projet Supabase.

## 3. Configuration de l'authentification

### Magic Links (Liens magiques)

1. Dans votre dashboard Supabase, allez dans **Authentication** > **Settings**
2. Dans la section **Site URL**, ajoutez votre URL de production : `https://pmcards.netlify.app`
3. Dans **Redirect URLs**, ajoutez :
   - `http://localhost:8080` (pour le développement)
   - `https://pmcards.netlify.app` (pour la production)

### Configuration des emails

1. Allez dans **Authentication** > **Email Templates**
2. Personnalisez le template "Magic Link" si souhaité
3. Vérifiez que l'authentification par email est activée dans **Authentication** > **Providers**

## 4. Sécurité

### Row Level Security (RLS)

Si vous ajoutez des tables personnalisées, activez RLS :

```sql
-- Exemple pour une table de profils utilisateur
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY(id)
);

-- Activer RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Politique permettant aux utilisateurs de voir et modifier leur propre profil
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

## 5. Test de l'authentification

1. Lancez l'application : `npm run dev`
2. Naviguez vers une route protégée (ex: `/game`)
3. Entrez votre email dans le formulaire de connexion
4. Vérifiez votre boîte email pour le lien magique
5. Cliquez sur le lien pour vous connecter

## 6. Déploiement

Pour le déploiement sur Netlify :

1. Ajoutez les variables d'environnement dans les paramètres de votre site Netlify
2. Vérifiez que l'URL de production est dans la liste des Redirect URLs de Supabase

## Fonctionnalités implémentées

- ✅ Authentification par Magic Link (lien magique)
- ✅ Gestion de session persistante
- ✅ Routes protégées
- ✅ Interface utilisateur avec Supabase Auth UI
- ✅ Déconnexion automatique
- ✅ État de chargement pendant l'authentification
- ✅ Affichage de l'email de l'utilisateur connecté

## Structure des composants d'authentification

```
src/
├── lib/
│   └── supabase.ts          # Configuration du client Supabase
├── contexts/
│   └── AuthContext.tsx      # Contexte d'authentification global
└── components/
    └── auth/
        ├── AuthComponent.tsx    # Composant de connexion
        ├── LoadingSpinner.tsx   # Composant de chargement
        └── ProtectedRoute.tsx   # Wrapper pour routes protégées
``` 