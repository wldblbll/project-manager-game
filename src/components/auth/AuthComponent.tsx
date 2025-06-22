import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Sparkles, ArrowRight } from 'lucide-react'

interface AuthComponentProps {
  redirectTo?: string
}

export function AuthComponent({ redirectTo }: AuthComponentProps) {
  const isModal = window.location.pathname === '/'; // Détecter si c'est une modal ou une page complète
  
  if (isModal) {
    // Version modal (depuis la page d'accueil)
    return (
      <Card className="w-full max-w-md bg-white shadow-2xl border-0 rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-1">
          <div className="bg-white rounded-xl">
            <CardHeader className="text-center pb-6 bg-gradient-to-r from-indigo-50 to-purple-50">
              <div className="flex items-center justify-center mb-4">
                <div className="relative">
                  <img 
                    src="/logo.png" 
                    alt="PM Cards Logo" 
                    className="w-16 h-16 mr-3 drop-shadow-lg"
                  />
                  <div className="absolute -top-1 -right-1">
                    <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  PMCards
                </CardTitle>
              </div>
              <CardDescription className="text-gray-600">
                Connexion pour accéder au jeu
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6 p-6">
              {/* Explication simplifiée pour la modal */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-100">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <Mail className="w-5 h-5 text-indigo-600 mt-1" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-indigo-900 mb-2 text-sm">
                      Connexion sans mot de passe
                    </h3>
                    <p className="text-sm text-indigo-700">
                      Entrez votre email, nous vous enverrons un lien magique pour vous connecter instantanément !
                    </p>
                  </div>
                </div>
              </div>

              {/* Composant d'authentification Supabase */}
              <div className="space-y-4">
                <Auth
                  supabaseClient={supabase}
                  appearance={{
                    theme: ThemeSupa,
                    variables: {
                      default: {
                        colors: {
                          brand: '#4f46e5',
                          brandAccent: '#4338ca',
                          inputBackground: '#ffffff',
                          inputBorder: '#d1d5db',
                          inputBorderHover: '#9ca3af',
                          inputBorderFocus: '#4f46e5',
                        },
                        borderWidths: {
                          buttonBorderWidth: '2px',
                          inputBorderWidth: '2px',
                        },
                        radii: {
                          borderRadiusButton: '10px',
                          buttonBorderRadius: '10px',
                          inputBorderRadius: '10px',
                        },
                        space: {
                          buttonPadding: '10px 20px',
                          inputPadding: '10px 14px',
                        },
                        fontSizes: {
                          baseButtonSize: '14px',
                          baseInputSize: '14px',
                        },
                      },
                    },
                    className: {
                      container: 'w-full space-y-3',
                      button: 'w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-2.5 px-5 rounded-lg shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-[1.02] border-0',
                      input: 'w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all duration-200 text-gray-900 placeholder-gray-500',
                      label: 'text-gray-700 font-medium mb-1 block text-sm',
                      message: 'text-center p-3 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm',
                    },
                  }}
                  providers={[]}
                  redirectTo={redirectTo || window.location.origin}
                  magicLink={true}
                  showLinks={false}
                  view="magic_link"
                  localization={{
                    variables: {
                      magic_link: {
                        email_input_label: 'Votre adresse email',
                        email_input_placeholder: 'exemple@email.com',
                        button_label: 'Envoyer le lien magique ✨',
                        loading_button_label: 'Envoi en cours...',
                        link_text: '',
                        confirmation_text: '🎉 Parfait ! Vérifiez votre email et cliquez sur le lien pour vous connecter.',
                      },
                    },
                  }}
                />
              </div>

              {/* Note de sécurité */}
              <div className="text-center text-xs text-gray-500 border-t pt-3">
                <div className="flex items-center justify-center space-x-2">
                  <ArrowRight className="w-3 h-3" />
                  <span>Connexion sécurisée sans mot de passe</span>
                </div>
              </div>
            </CardContent>
          </div>
        </div>
      </Card>
    );
  }
  
  // Version page complète (quand accès direct)
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 py-12 px-4 sm:px-6 lg:px-8">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-64 h-64 bg-white/5 rounded-full -top-20 -left-20 animate-blob"></div>
        <div className="absolute w-64 h-64 bg-white/5 rounded-full top-1/2 left-1/3 animate-blob animation-delay-2000"></div>
        <div className="absolute w-64 h-64 bg-white/5 rounded-full bottom-20 right-20 animate-blob animation-delay-4000"></div>
      </div>

      <Card className="w-full max-w-md relative z-10 bg-white/95 backdrop-blur-sm shadow-2xl border-0">
        <CardHeader className="text-center pb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <img 
                src="/logo.png" 
                alt="PM Cards Logo" 
                className="w-20 h-20 mr-3 drop-shadow-lg"
              />
              <div className="absolute -top-1 -right-1">
                <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              PMCards
            </CardTitle>
          </div>
          <CardDescription className="text-gray-600 text-lg">
            Accédez au jeu de cartes de gestion de projet
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Explication du processus */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-100">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <Mail className="w-6 h-6 text-indigo-600 mt-0.5" />
              </div>
              <div>
                <h3 className="font-semibold text-indigo-900 mb-2">
                  Connexion simplifiée - Aucun mot de passe requis !
                </h3>
                <div className="space-y-2 text-sm text-indigo-700">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    <span>Saisissez votre adresse email ci-dessous</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    <span>Recevez un lien magique par email</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                    <span>Cliquez sur le lien pour accéder au jeu</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Composant d'authentification Supabase */}
          <div className="space-y-4">
            <Auth
              supabaseClient={supabase}
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: '#4f46e5',
                      brandAccent: '#4338ca',
                      inputBackground: '#ffffff',
                      inputBorder: '#d1d5db',
                      inputBorderHover: '#9ca3af',
                      inputBorderFocus: '#4f46e5',
                    },
                    borderWidths: {
                      buttonBorderWidth: '2px',
                      inputBorderWidth: '2px',
                    },
                    radii: {
                      borderRadiusButton: '12px',
                      buttonBorderRadius: '12px',
                      inputBorderRadius: '12px',
                    },
                    space: {
                      buttonPadding: '12px 24px',
                      inputPadding: '12px 16px',
                    },
                    fontSizes: {
                      baseButtonSize: '16px',
                      baseInputSize: '16px',
                    },
                  },
                },
                className: {
                  container: 'w-full space-y-4',
                  button: 'w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-[1.02] border-0',
                  input: 'w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 text-gray-900 placeholder-gray-500',
                  label: 'text-gray-700 font-medium mb-2 block',
                  message: 'text-center p-4 rounded-lg bg-green-50 border border-green-200 text-green-800',
                },
              }}
              providers={[]}
              redirectTo={redirectTo || window.location.origin}
              magicLink={true}
              showLinks={false}
              view="magic_link"
              localization={{
                variables: {
                  magic_link: {
                    email_input_label: 'Votre adresse email',
                    email_input_placeholder: 'exemple@email.com',
                    button_label: 'Envoyer le lien magique ✨',
                    loading_button_label: 'Envoi en cours...',
                    link_text: '',
                    confirmation_text: '🎉 Parfait ! Vérifiez votre boîte email et cliquez sur le lien magique pour accéder au jeu.',
                  },
                },
              }}
            />
          </div>

          {/* Note de sécurité */}
          <div className="text-center text-sm text-gray-500 border-t pt-4">
            <div className="flex items-center justify-center space-x-2">
              <ArrowRight className="w-4 h-4" />
              <span>Connexion sécurisée sans mot de passe</span>
            </div>
            <p className="mt-1">
              Votre email ne sera utilisé que pour l'authentification
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 