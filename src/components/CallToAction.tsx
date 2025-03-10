import React from "react";
import { Link } from "react-router-dom";

const CallToAction = () => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-red-500 to-purple-500">
      <div className="mx-auto max-w-7xl py-24 px-6 sm:py-32 lg:px-8">
        <div className="relative isolate px-6 py-12 text-center sm:px-16">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Prêt à devenir un
              <br />
              Super Chef de Projet ? 🦸‍♂️
            </h2>
            
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-white/80">
              Lance-toi dans l'aventure et apprends la gestion de projet 
              en relevant des défis passionnants !
            </p>
            
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                to="/game"
                className="rounded-full bg-white px-8 py-4 text-lg font-semibold text-purple-600 
                         shadow-lg hover:bg-purple-50 transition-all duration-300 
                         transform hover:scale-105 hover:shadow-xl"
              >
                Commencer l'Aventure 🚀
              </Link>
            </div>

            <div className="mt-8 animate-bounce">
              <span className="text-4xl">⬇️</span>
            </div>
          </div>

          {/* Animated background elements */}
          <div className="absolute -top-4 -left-4 -right-4 -bottom-4 bg-gradient-to-r from-purple-500/30 to-pink-500/30 blur-3xl" />
          <div className="absolute inset-0">
            <div className="h-full w-full bg-white/5 backdrop-blur-sm" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallToAction;
