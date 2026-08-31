import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { fetchTelegramGifts } from '../lib/api';
import { NFTItem } from '../types';
import { generateCleanPreview } from '../lib/lottieExtractor';
import collectionsData from '../../collections.json';
import { buildWeightedTable, pickWeighted } from '../lib/weightedDrop';

const livePreviewCache = new Map<string, string>();

function getDeterministicPrice(address: string) {
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = ((hash << 5) - hash) + address.charCodeAt(i);
    hash |= 0;
  }
  const randomVal = Math.abs(hash) % 100;
  if (randomVal < 2) return 500 + (Math.abs(hash) % 500); // Legendary: 500-1000 TON
  if (randomVal < 10) return 100 + (Math.abs(hash) % 400); // Epic: 100-500 TON
  if (randomVal < 30) return 25 + (Math.abs(hash) % 75);  // Rare: 25-100 TON
  return 1 + (Math.abs(hash) % 24); // Common: 1-24 TON
}

function getRarityStyle(price: number) {
  if (price >= 500) return 'text-amber-400 border-amber-400/50 bg-amber-400/10 shadow-[0_0_15px_rgba(251,191,36,0.2)]';
  if (price >= 100) return 'text-purple-400 border-purple-400/40 bg-purple-400/10 shadow-[0_0_10px_rgba(192,132,252,0.1)]';
  if (price >= 25) return 'text-blue-400 border-blue-400/30 bg-blue-400/10';
  return 'text-zinc-400 border-white/10 bg-white/[0.02]';
}

function LiveModelCard({ item }: { item: NFTItem; key?: string | number }) {
  const lottieUrl = item.metadata.lottie || item.metadata.lottie_url;
  const [img, setImg] = useState<string | null>(livePreviewCache.get(lottieUrl || '') || null);

  useEffect(() => {
    let mounted = true;
    if (img || !lottieUrl) return;
    
    if (livePreviewCache.has(lottieUrl)) {
      setImg(livePreviewCache.get(lottieUrl)!);
      return;
    }

    generateCleanPreview(lottieUrl, 'Model').then(res => {
      if (res && mounted) {
        livePreviewCache.set(lottieUrl, res);
        setImg(res);
      }
    });

    return () => { mounted = false; };
  }, [lottieUrl]);

  const price = getDeterministicPrice(item.address);
  const rarityStyle = getRarityStyle(price);

  return (
    <div className={`w-20 h-24 md:w-24 md:h-28 rounded-2xl border flex flex-col items-center justify-center flex-shrink-0 relative overflow-hidden backdrop-blur-md transition-colors ${rarityStyle}`}>
      <div className="flex-1 w-full flex items-center justify-center p-2">
        {img ? (
          <motion.img 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            src={img} 
            alt="Model" 
            className="w-full h-full object-contain filter drop-shadow-lg" 
          />
        ) : (
          <div className="w-full h-full bg-white/5 animate-pulse rounded-xl" />
        )}
      </div>
      <div className="h-6 w-full flex items-center justify-center border-t border-inherit bg-black/20">
        <span className="text-[10px] md:text-[11px] font-bold tracking-wide">{price} TON</span>
      </div>
    </div>
  );
}

export function LiveModelFeed() {
  const [recentItems, setRecentItems] = useState<NFTItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadRecentWins() {
      try {
        // Pick 5 random collections from the catalog
        const shuffled = [...collectionsData].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, 5);
        
        // Fetch items from these random collections
        const promises = selected.map(c => fetchTelegramGifts(15, 0, c.address));
        const results = await Promise.allSettled(promises);
        
        if (!mounted) return;
        
        const combined: NFTItem[] = [];
        results.forEach(r => {
          if (r.status === 'fulfilled') combined.push(...r.value);
        });
        
        const pricedItems = combined.map(item => ({
          ...item,
          price: getDeterministicPrice(item.address)
        }));

        const RARITY_ALPHA = 0.6;
        const { table, totalWeight } = buildWeightedTable(pricedItems, { alpha: RARITY_ALPHA, minPrice: 1 });
        
        const mixed = Array.from({ length: 40 }).map(() => pickWeighted(table, totalWeight));
        
        setRecentItems(mixed);
      } catch (e) {
        console.error("Failed to load live drops", e);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadRecentWins();

    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="w-full h-[110px] md:h-[130px] bg-canvas border-b border-hairline flex items-center px-4 md:px-8 z-40 relative">
         <div className="flex items-center gap-3 w-24 md:w-32 shrink-0">
           <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
           <span className="text-xs font-black uppercase tracking-widest text-emerald-500 hidden sm:block">Live</span>
         </div>
         <div className="flex gap-4 overflow-hidden flex-1">
           {[1,2,3,4,5,6,7,8,9,10].map(i => (
             <div key={i} className="w-20 h-24 md:w-24 md:h-28 rounded-2xl bg-white/5 animate-pulse shrink-0" />
           ))}
         </div>
      </div>
    );
  }

  if (recentItems.length === 0) return null;

  return (
    <div className="w-full h-[110px] md:h-[130px] bg-canvas border-b border-hairline flex items-center relative overflow-hidden z-40">
       
       {/* Scrolling Marquee Container */}
       <div className="absolute inset-0 flex items-center overflow-hidden">
         <motion.div 
           className="flex items-center gap-4 w-max pl-[120px] md:pl-[160px] pr-4"
           animate={{ x: ["0%", "-50%"] }}
           transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
         >
           {/* Duplicate array for seamless loop */}
           {[...recentItems, ...recentItems].map((item, idx) => (
              <LiveModelCard key={`${item.address}-${idx}`} item={item} />
           ))}
         </motion.div>
       </div>

       {/* Left side fixed indicator (covers the scrolling items going under it) */}
       <div className="absolute left-0 top-0 bottom-0 w-24 md:w-32 bg-canvas z-20 flex items-center pl-4 md:pl-8 border-r border-hairline shadow-[20px_0_40px_-10px_rgba(13,14,18,1)]">
         <div className="flex items-center gap-3">
           <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
           <span className="text-xs font-black uppercase tracking-widest text-emerald-500 hidden sm:block">Live</span>
         </div>
       </div>

       {/* Gradient fades for seamless visual loop */}
       <div className="absolute left-24 md:left-32 top-0 bottom-0 w-16 bg-gradient-to-r from-canvas to-transparent z-10 pointer-events-none" />
       <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-canvas to-transparent z-10 pointer-events-none" />
    </div>
  );
}
