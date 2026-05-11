import React from 'react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-dark-900 font-sans text-white relative overflow-hidden flex flex-col">
      {/* Abstract Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-neon-500/10 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[150px]"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-10 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-neon-500 flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(179,255,64,0.4)]">
            <span className="text-dark-900 font-extrabold text-lg">F</span>
          </div>
          <div className="text-2xl font-bold tracking-tight text-white">FitCore</div>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-gray-400 hover:text-white transition-colors font-medium">Features</a>
          <a href="#pricing" className="text-gray-400 hover:text-white transition-colors font-medium">Pricing</a>
          <a href="#about" className="text-gray-400 hover:text-white transition-colors font-medium">About</a>
        </nav>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-white font-semibold hover:text-gray-300 transition-colors hidden sm:block">Log in</Link>
          <Link to="/login" className="bg-neon-500 text-dark-900 px-6 py-2.5 rounded-full font-bold shadow-[0_0_15px_rgba(179,255,64,0.3)] hover:bg-neon-400 transition-all hover:scale-105">
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 relative z-10 flex flex-col items-center justify-center px-6 pt-20 pb-32 text-center max-w-5xl mx-auto">
        
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-tight tracking-tight mb-8">
          Simplify Your <br />
          <span className="text-gray-400">Fitness Business</span>
        </h1>
        
        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed">
          Boost efficiency and track progress effortlessly with our all-in-one gym management dashboard. Designed for modern fitness centers.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link to="/login" className="bg-neon-500 text-dark-900 px-8 py-4 rounded-full font-bold text-lg shadow-[0_0_25px_rgba(179,255,64,0.4)] hover:bg-neon-400 hover:shadow-[0_0_35px_rgba(179,255,64,0.6)] transition-all hover:scale-105 w-full sm:w-auto">
            Request a Demo
          </Link>
          <button className="bg-dark-800 border border-dark-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-dark-700 transition-colors w-full sm:w-auto">
            View Features
          </button>
        </div>

        {/* Dashboard Mockup Preview */}
        <div className="mt-20 w-full relative">
          <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent z-10 pointer-events-none rounded-2xl"></div>
          <div className="relative rounded-2xl border border-dark-600/50 bg-dark-800/50 backdrop-blur-sm p-4 overflow-hidden shadow-2xl transform perspective-1000 rotateX-12 scale-100 hover:scale-105 transition-transform duration-700 ease-out">
            {/* Mockup Header */}
            <div className="flex items-center gap-2 mb-4 px-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <div className="w-full flex justify-center ml-[-40px]">
                <div className="bg-dark-700 rounded-full h-6 w-64"></div>
              </div>
            </div>
            {/* Mockup Body */}
            <div className="grid grid-cols-4 gap-4 opacity-50 pointer-events-none">
              <div className="col-span-1 h-full bg-dark-700 rounded-xl"></div>
              <div className="col-span-3 grid grid-cols-3 gap-4">
                 <div className="h-32 bg-dark-700 rounded-xl"></div>
                 <div className="h-32 bg-dark-700 rounded-xl"></div>
                 <div className="h-32 bg-dark-700 rounded-xl"></div>
                 <div className="col-span-2 h-64 bg-dark-700 rounded-xl"></div>
                 <div className="col-span-1 h-64 bg-dark-700 rounded-xl"></div>
              </div>
            </div>
          </div>
        </div>

      </main>
      
      {/* Footer */}
      <footer className="relative z-10 border-t border-dark-600/50 py-10 text-center">
        <p className="text-gray-500 text-sm">© 2024 FitCore Technologies. All rights reserved.</p>
      </footer>
    </div>
  );
}
