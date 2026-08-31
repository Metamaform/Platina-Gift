const fs = require('fs');

const appCode = `
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Hub } from './components/Hub';
import { Inventory } from './components/Inventory';
import { LiveModelFeed } from './components/LiveModelFeed';
import { Home, Grid, Box, User, LayoutGrid } from 'lucide-react';

type View = 'hub' | 'catalog' | 'inventory' | 'profile';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('inventory');

  return (
    <div className="min-h-screen flex flex-col bg-[#0D0D12] text-white font-sans selection:bg-purple-500/30">
      {/* 1. Header */}
      <header className="sticky top-0 z-50 bg-[#15151C] border-b border-white/5 h-[60px] flex items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-orange-500 flex items-center justify-center shadow-sm shadow-purple-500/20">
            <LayoutGrid className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-orange-400">
            Nexus
          </span>
        </div>
        
        <div className="flex items-center">
          {/* Avatar with status border */}
          <div className="w-9 h-9 rounded-full p-[2px] bg-purple-500">
            <div className="w-full h-full rounded-full bg-[#0D0D12] overflow-hidden border-2 border-[#15151C]">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Profile" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </header>

      {/* <LiveModelFeed /> - Kept from previous task if you want, but maybe we hide it in the new design if not requested. The prompt doesn't mention LiveFeed but implies a complete reskin. I will keep it for now as it was specifically requested in the last turn, maybe just place it above main content. */}
      {currentView === 'hub' && <LiveModelFeed />}

      {/* Main Content Area */}
      <main className="flex-1 pb-24 flex flex-col relative z-0">
        <AnimatePresence mode="wait">
          {currentView === 'hub' && (
            <Hub key="hub" onNavigate={(v) => setCurrentView(v as View)} />
          )}
          {(currentView === 'inventory' || currentView === 'catalog') && (
            <Inventory key={currentView} mode={currentView} />
          )}
          {currentView === 'profile' && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-1 flex items-center justify-center"
            >
              <div className="text-center space-y-4">
                <User className="w-16 h-16 text-[#9A9AA5] mx-auto" />
                <h2 className="text-2xl font-bold">Profile</h2>
                <p className="text-[#9A9AA5]">Coming soon.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      
      {/* 2. Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#15151C]/95 backdrop-blur-md border-t border-white/5 pb-safe z-50">
        <div className="flex justify-around items-center h-16 px-2">
          {[
            { id: 'hub', icon: Home, label: 'Hub' },
            { id: 'catalog', icon: Grid, label: 'Catalog' },
            { id: 'inventory', icon: Box, label: 'Inventory' },
            { id: 'profile', icon: User, label: 'Profile' }
          ].map(nav => {
            const isActive = currentView === nav.id;
            return (
              <button
                key={nav.id}
                onClick={() => setCurrentView(nav.id as View)}
                className={\`flex-1 flex flex-col items-center justify-center gap-1 h-full transition-all duration-200 \${
                  isActive ? 'text-purple-400' : 'text-[#9A9AA5] hover:text-white/80'
                }\`}
              >
                <div className="relative">
                  <nav.icon className={\`w-6 h-6 transition-transform \${isActive ? 'scale-110' : ''}\`} strokeWidth={isActive ? 2.5 : 2} />
                  {isActive && (
                    <motion.div 
                      layoutId="nav-glow" 
                      className="absolute inset-0 bg-purple-500/20 blur-md rounded-full -z-10" 
                    />
                  )}
                </div>
                <span className={\`text-[11px] font-medium \${isActive ? 'font-bold' : ''}\`}>
                  {nav.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
\`;

fs.writeFileSync('src/App.tsx', appCode);

// Add safe area support in index.html (useful for mobile)
let indexHtml = fs.readFileSync('index.html', 'utf8');
if (!indexHtml.includes('viewport-fit=cover')) {
  indexHtml = indexHtml.replace('width=device-width, initial-scale=1.0', 'width=device-width, initial-scale=1.0, viewport-fit=cover');
  fs.writeFileSync('index.html', indexHtml);
}
