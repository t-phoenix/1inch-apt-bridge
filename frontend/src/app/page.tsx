'use client';

import { useState } from 'react';
import { Header } from '../../components/Header';
import { SwapCard } from '../../components/SwapCard';

export default function Home() {
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-slate-900 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-600/20 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-blue-500/15 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-blue-800/25 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        <div className="absolute bottom-0 right-20 w-80 h-80 bg-slate-600/20 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-blob animation-delay-6000"></div>
      </div>
      
      <div className="relative z-10">
        <Header isAccountModalOpen={isAccountModalOpen} setIsAccountModalOpen={setIsAccountModalOpen} />
        
        {!isAccountModalOpen && (
          <main className="flex items-center justify-center min-h-[calc(100vh-140px)] px-8 pt-16">
            <SwapCard />
          </main>
        )}
        
        <footer className="fixed bottom-0 left-0 right-0 flex items-center justify-between px-8 py-6 backdrop-blur-sm bg-black/10">
          <div className="text-sm text-gray-300 font-medium">
            © 2025 1inch Network
          </div>
          <div className="flex items-center space-x-4">
            <div className="h-3 w-3 bg-blue-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-300 font-mono">#23448194</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
