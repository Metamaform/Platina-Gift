const fs = require('fs');

const code = `
import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface HubProps {
  key?: string | number;
  onNavigate: (view: 'inventory' | 'catalog') => void;
}

const BANNERS = [
  {
    id: 1,
    title: "The Autumn Collection",
    description: "Discover the newest digital assets featuring exclusive autumn backdrops and rare models.",
    cta: "Learn More",
    bg: "bg-gradient-to-br from-[#1A1A24] to-[#2D2338]",
    accent: "text-purple-400"
  },
  {
    id: 2,
    title: "Creator Spotlight",
    description: "Explore the amazing 3D artifacts created by top community artists this week.",
    cta: "View Collection",
    bg: "bg-gradient-to-br from-[#1A1A24] to-[#382823]",
    accent: "text-orange-400"
  },
  {
    id: 3,
    title: "Market Trends",
    description: "See which symbols are currently trending in the global catalog and why.",
    cta: "Explore Trends",
    bg: "bg-gradient-to-br from-[#1A1A24] to-[#1F3338]",
    accent: "text-emerald-400"
  }
];

export function Hub({ onNavigate }: HubProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const scrollLeft = scrollRef.current.scrollLeft;
    const width = scrollRef.current.offsetWidth;
    const index = Math.round(scrollLeft / width);
    setActiveIndex(index);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full max-w-7xl mx-auto pt-6 space-y-8"
    >
      <div className="px-4 md:px-8">
        <h2 className="text-2xl font-bold text-white mb-4">Highlights</h2>
        
        {/* Carousel Container */}
        <div className="relative">
          <div 
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar pb-4"
          >
            {BANNERS.map((banner, i) => (
              <div 
                key={banner.id} 
                className="w-full flex-shrink-0 snap-center px-1"
                style={{ width: '100%' }}
              >
                <div className={\`\${banner.bg} p-6 md:p-8 rounded-[16px] border border-white/5 shadow-sm shadow-black/20 h-48 md:h-56 flex flex-col justify-between\`}>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">{banner.title}</h3>
                    <p className="text-[14px] text-[#9A9AA5] max-w-sm line-clamp-2">
                      {banner.description}
                    </p>
                  </div>
                  
                  <button 
                    onClick={() => onNavigate('catalog')}
                    className="self-start px-6 py-2.5 rounded-[12px] bg-[#F97316] text-white text-[14px] font-bold shadow-md shadow-orange-500/20 hover:bg-[#EA580C] transition-colors flex items-center gap-2"
                  >
                    {banner.cta}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Dot Indicators */}
          <div className="flex justify-center gap-2 mt-2">
            {BANNERS.map((_, i) => (
              <div 
                key={i}
                className={\`transition-all duration-300 rounded-full h-1.5 \${
                  i === activeIndex 
                    ? 'bg-purple-500 w-6' 
                    : 'bg-white/20 w-1.5'
                }\`}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Additional sections could go here */}
      <div className="px-4 md:px-8">
         <h2 className="text-xl font-bold text-white mb-4">Quick Links</h2>
         <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => onNavigate('catalog')}
              className="bg-[#15151C] p-4 rounded-[16px] border border-white/5 text-left flex flex-col gap-2 hover:bg-white/5 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                 <div className="w-4 h-4 bg-purple-400 rounded-sm" />
              </div>
              <span className="font-semibold text-white">Browse Catalog</span>
              <span className="text-xs text-[#9A9AA5]">Explore all digital items</span>
            </button>
            <button 
              onClick={() => onNavigate('inventory')}
              className="bg-[#15151C] p-4 rounded-[16px] border border-white/5 text-left flex flex-col gap-2 hover:bg-white/5 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                 <div className="w-4 h-4 bg-orange-400 rounded-full" />
              </div>
              <span className="font-semibold text-white">My Inventory</span>
              <span className="text-xs text-[#9A9AA5]">View your collection</span>
            </button>
         </div>
      </div>
    </motion.div>
  );
}
`;

fs.writeFileSync('src/components/Hub.tsx', code);
