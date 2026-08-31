const fs = require('fs');
let code = fs.readFileSync('src/components/Inventory.tsx', 'utf8');

// The new GiftCard component
const newGiftCard = `
function getRarityColor(percent: number) {
  if (percent === 0) return 'gray'; // fallback
  if (percent <= 2) return 'yellow'; // Legendary
  if (percent <= 10) return 'purple'; // Epic
  if (percent <= 30) return 'blue'; // Rare
  return 'gray'; // Common
}

function getRarityGlow(percent: number) {
  if (percent === 0) return '';
  if (percent <= 2) return 'shadow-[0_0_20px_rgba(250,204,21,0.2)] border-yellow-500/40 bg-yellow-500/5 hover:border-yellow-500/80 hover:shadow-[0_0_30px_rgba(250,204,21,0.5)]';
  if (percent <= 10) return 'shadow-[0_0_20px_rgba(168,85,247,0.15)] border-purple-500/40 bg-purple-500/5 hover:border-purple-500/80 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)]';
  if (percent <= 30) return 'border-blue-500/30 bg-blue-500/5 hover:border-blue-500/60 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]';
  return 'border-white/5 bg-white/[0.02] hover:border-white/20';
}

function getRarityBadge(percent: number) {
  if (percent === 0) return null;
  if (percent <= 2) return <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-yellow-500/20 text-yellow-400 border border-yellow-500/50">Legendary</span>;
  if (percent <= 10) return <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-400 border border-purple-500/50">Epic</span>;
  if (percent <= 30) return <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/50">Rare</span>;
  return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-500/20 text-gray-400 border border-gray-500/50">Common</span>;
}

function GiftCard({ item, rarityPercent }: { item: NFTItem; rarityPercent?: number; key?: any }) {
  const [isHovered, setIsHovered] = useState(false);
  const lottieUrl = item.metadata.lottie || item.metadata.lottie_url;
  
  // Try to use provided rarity (from parent), or calculate a fallback
  const finalRarity = rarityPercent !== undefined ? rarityPercent : 50; 
  const glowClasses = getRarityGlow(finalRarity);
  const estimatedPrice = (100 / Math.max(0.1, finalRarity)).toFixed(1);

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, scale: 0.95 },
        show: { 
          opacity: 1, 
          scale: 1, 
          transition: { duration: 0.3, ease: 'easeOut' }
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={\`rounded-2xl overflow-hidden group flex flex-col relative transition-all duration-300 border backdrop-blur-xl \${glowClasses}\`}
    >
      <div className="aspect-square w-full relative p-4 flex items-center justify-center">
        {/* Background gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {isHovered && lottieUrl ? (
          <div className="w-full h-full absolute inset-0 z-0 p-4">
            <Player
              src={lottieUrl}
              autoplay
              loop
              className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]"
            />
          </div>
        ) : (
          <img 
            src={item.metadata.image} 
            alt={item.metadata.name}
            className="w-full h-full object-contain filter drop-shadow-[0_0_10px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform duration-500 ease-out z-0 relative"
            loading="lazy"
          />
        )}
        
        {/* Badges top */}
        <div className="absolute top-3 left-3 z-20 flex gap-2">
          {getRarityBadge(finalRarity)}
        </div>
        <div className="absolute top-3 right-3 z-20">
          <span className="bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-white/70 border border-white/10">
            #{item.index}
          </span>
        </div>

        {/* Hover Actions */}
        <div className="absolute inset-x-0 bottom-4 z-20 flex justify-center gap-2 px-4 translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
           <button className="flex-1 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold py-2 rounded-lg transition-colors">
             Play
           </button>
           <button className="flex-1 bg-white/10 hover:bg-white/20 text-white text-xs font-bold py-2 rounded-lg border border-white/20 transition-colors">
             Sell
           </button>
        </div>
      </div>
      <div className="p-4 flex flex-col justify-between border-t border-white/5 relative z-20 bg-black/40">
        <h3 className="text-sm font-bold text-white truncate group-hover:text-amber-400 transition-colors">
          {item.metadata.name}
        </h3>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-white/50 font-medium">{finalRarity}% rarity</span>
          <span className="text-xs font-black text-emerald-400 flex items-center gap-1">
             ~{estimatedPrice} TON
          </span>
        </div>
      </div>
    </motion.div>
  );
}
`;

// Regex replacement
code = code.replace(/function GiftCard\(\{[\s\S]*?\}\s*\)\s*\{[\s\S]*?return \([\s\S]*?<\div>\s*\);\s*\}/, newGiftCard.trim());

fs.writeFileSync('src/components/Inventory.tsx', code);
