import React from 'react';
import Navbar from './Navbar';

export default function Layout({ activePage, setActivePage, children }) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative bg-brand-dark overflow-hidden">
      {/* Decorative premium glowing design background grids/orbs */}
      <div className="neon-glow-primary top-[-50px] left-[-50px] opacity-70"></div>
      <div className="neon-glow-success bottom-[-50px] right-[-50px] opacity-40"></div>
      
      {/* Navigation */}
      <Navbar activePage={activePage} setActivePage={setActivePage} />

      {/* Main Viewport Content Area */}
      <main className="flex-1 w-full relative z-10 p-4 md:p-8 overflow-y-auto max-h-screen">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
