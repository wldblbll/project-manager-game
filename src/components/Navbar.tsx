import { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const { user, signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <nav 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 transition-all duration-300",
        scrolled 
          ? "py-2 bg-white/80 backdrop-blur-md shadow-sm" 
          : "py-4 bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <img 
            src="/logo.png" 
            alt="PM Cards Logo" 
            className={cn(
              "h-8 w-8 transition-all duration-300 hover:rotate-12",
              scrolled ? "filter-none" : "brightness-110"
            )} 
          />
          <span className={cn(
            "font-bold text-xl transition-all duration-300",
            scrolled ? "text-indigo-600" : "text-white"
          )}>PM Cards</span>
        </Link>
        
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <div className={cn(
                "flex items-center space-x-2 px-3 py-1 rounded-full text-sm",
                scrolled ? "text-gray-700" : "text-white/90"
              )}>
                <User className="h-4 w-4" />
                <span>{user.email}</span>
              </div>
              <Link 
                to="/game" 
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                  scrolled 
                    ? "bg-indigo-500 hover:bg-indigo-600 text-white" 
                    : "bg-white/10 backdrop-blur hover:bg-white/20 text-white"
                )}
              >
                Jouer 🎲
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
                className={cn(
                  "px-3 py-2 rounded-full text-sm transition-all duration-200",
                  scrolled 
                    ? "text-gray-600 hover:text-gray-800 hover:bg-gray-100" 
                    : "text-white/90 hover:text-white hover:bg-white/10"
                )}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <div className={cn(
              "px-4 py-2 rounded-full text-sm font-medium",
              scrolled ? "text-gray-600" : "text-white/90"
            )}>
              Connexion requise
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
