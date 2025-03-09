
import { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

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
          ? "py-4 bg-white/80 backdrop-blur-md shadow-sm" 
          : "py-6 bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <a href="#" className="font-semibold text-xl">
          Elegant<span className="text-gray-500">World</span>
        </a>
        
        <div className="hidden md:flex items-center space-x-8">
          <a href="#features" className="text-sm font-medium hover:text-gray-600 transition-colors">
            Features
          </a>
          <a href="#about" className="text-sm font-medium hover:text-gray-600 transition-colors">
            About
          </a>
          <a href="#contact" className="text-sm font-medium hover:text-gray-600 transition-colors">
            Contact
          </a>
        </div>
        
        <a 
          href="#cta" 
          className="hidden md:inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-all bg-black text-white hover:bg-black/90 shadow-sm"
        >
          Get Started
        </a>
      </div>
    </nav>
  );
};

export default Navbar;
