const fs = require('fs');

const code = `
import { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchTelegramGifts } from '../lib/api';
import { NFTItem } from '../types';
import { generateCleanPreview } from '../lib/lottieExtractor';
import { Loader2, AlertCircle, Filter, X, Search, ChevronDown, Check } from 'lucide-react';
import { Player } from '@lottiefiles/react-lottie-player';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const COLOR_MAP: Record<string, string> = {
  'English Violet': '#563C5C', 'Indigo Dye': '#091F92', 'Burgundy': '#800020', 'Dark Lilac': '#9955BB', 
  'Aquamarine': '#7FFFD4', 'Hunter Green': '#355E3B', 'Pacific Green': '#1CA9C9', 'Satin Gold': '#CBA135', 
  'Fandango': '#B53389', 'Lavender': '#E6E6FA', 'Jade Green': '#00A86B', 'Electric Indigo': '#6F00FF', 
  'Azure Blue': '#007FFF', 'French Blue': '#0072BB', 'Chestnut': '#954535', 'Cappuccino': '#5C3A21', 
  'Cobalt Blue': '#0047AB', 'Steel Grey': '#71797E', 'Chocolate': '#7B3F00', 'Electric Purple': '#BF00FF', 
  'Moonstone': '#3AA8C1', 'Cyberpunk': '#FF007F', 'Sky Blue': '#87CEEB', 'Pacific Cyan': '#1CA9C9', 
  'Roman Silver': '#838996', 'Mint Green': '#98FF98', 'Sapphire': '#0F52BA', 'Midnight Blue': '#191970', 
  'Grape': '#6F2DA8', 'Pure Gold': '#FFD700', 'Raspberry': '#E30B5D', 'Copper': '#B87333', 
  'Lemongrass': '#999A86', 'Mystic Pearl': '#D9E4E6', 'Black': '#000000', 'Emerald': '#50C878', 
  'Onyx Black': '#353839', 'Purple': '#800080', 'Amber': '#FFBF00', 'Persimmon': '#EC5800', 
  'Orange': '#FFA500', 'Navy Blue': '#000080', 'Rosewood': '#65000B', 'Light Olive': '#B8B684', 
  'Shamrock Green': '#009E60', 'Carrot Juice': '#F38015', 'Ivory White': '#FFFFF0', 'Desert Sand': '#EDC9AF', 
  'Malachite': '#0BDA51', 'Battleship Grey': '#848482', 'Pistachio': '#93C572', 'Coral Red': '#FF4040', 
  'Neon Blue': '#4D4DFF', 'Turquoise': '#40E0D0', 'Khaki Green': '#8A865D', 'Platinum': '#E5E4E2', 
  'Silver Blue': '#5B7C99', 'Caramel': '#FFD59A', 'Pine Green': '#01796F', 'Strawberry': '#FC5A8D'
};

const COLLECTIONS = [
  { "name": "Artisan Bricks", "address": "0:36448ed7bc8b3dc0940aaf19136fb62da5e52e683fa9d1e4f9b817b86e47064f" },
  { "name": "Astral Shards", "address": "0:c845e95e3a44f1083e20fd7126f318f42d8360ebecccb13180030080faf11b90" },
  { "name": "B-Day Candles", "address": "0:b01057d46db47edb67e7dd583152906297b6f0050a841e6ef081061b598f5cd3" },
  { "name": "Berry Boxes", "address": "0:78c77b13d4355d383cdacb71fee1524874ea284b9fa44e0c8a7183195a880f3a" },
  { "name": "Big Years", "address": "0:f1f92a901213fd4737e2d9ca9d7a14d552f41b02bb14cf55fbb7eba5f0888a66" }
];

type AttributeMetadata = {
  value: string;
  sampleUrl?: string; // For lottie extraction
  color?: string;
  count: number;
  rarityPercent?: number;
};

// GLOBAL CACHE for clean previews
const globalPreviewCache = new Map<string, string>();

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

// ----------------------------------------------------------------------
// TRAIT PREVIEW COMPONENT
// Extracts clean isolated layer from Lottie if it's a Model or Symbol
// ----------------------------------------------------------------------
function TraitPreview({ trait, value, sampleUrl, color }: { trait: string, value: string, sampleUrl?: string, color?: string }) {
  const cacheKey = \`\${trait}:\${value}\`;
  const [img, setImg] = useState<string | null>(globalPreviewCache.get(cacheKey) || null);
  
  useEffect(() => {
    let mounted = true;
    if (img || !sampleUrl || trait === 'Backdrop') return;
    
    if (globalPreviewCache.has(cacheKey)) {
      setImg(globalPreviewCache.get(cacheKey)!);
      return;
    }

    // Lazy load the exact layer needed for this filter
    generateCleanPreview(sampleUrl, trait as 'Model' | 'Symbol').then(res => {
      if (res && mounted) {
        globalPreviewCache.set(cacheKey, res);
        setImg(res);
      }
    });

    return () => { mounted = false; };
  }, [trait, value, sampleUrl, img, cacheKey]);

  if (trait === 'Backdrop') {
    return <div className="w-10 h-10 rounded-lg shadow-inner flex-shrink-0 border border-white/10 shadow-black/50" style={{ backgroundColor: color || '#333' }} />;
  }
  
  if (img) {
    return (
      <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 bg-white/5 rounded-lg border border-white/5 p-1">
         <img src={img} className="w-full h-full object-contain filter drop-shadow-lg" alt={value} />
      </div>
    );
  }
  
  return <div className="w-10 h-10 rounded-lg bg-white/5 animate-pulse flex-shrink-0 border border-white/5" />;
}

// ----------------------------------------------------------------------
// FILTER SELECTOR POPOVER COMPONENT
// ----------------------------------------------------------------------
function AttributeFilter({ 
  trait, 
  options, 
  selectedValue, 
  onChange,
  totalItems
}: { 
  trait: string, 
  options: AttributeMetadata[], 
  selectedValue: string, 
  onChange: (val: string) => void,
  totalItems: number
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const selected = options.find(o => o.value === selectedValue);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    if (!search) return options;
    const lower = search.toLowerCase();
    return options.filter(o => o.value.toLowerCase().includes(lower));
  }, [options, search]);

  return (
    <div className="relative" ref={dropdownRef} style={{ zIndex: isOpen ? 60 : 20 }}>
      {/* Trigger Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={\`h-10 px-4 rounded-xl flex items-center gap-2 transition-all border backdrop-blur-md \${
          isOpen 
            ? 'bg-[#1A1D27] border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.2)]' 
            : selectedValue
              ? 'bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20'
              : 'bg-[#13151C]/80 border-white/5 hover:border-white/20 text-white/70'
        }\`}
      >
        <span className={\`text-sm font-bold tracking-wide \${selectedValue ? 'text-purple-400' : 'text-white/50'}\`}>
          {trait}
        </span>
        
        {selectedValue && (
           <>
             <div className="w-px h-3 bg-purple-500/30 mx-1" />
             <span className="text-sm font-black truncate max-w-[100px]">{selectedValue}</span>
           </>
        )}
        
        <ChevronDown className={\`w-4 h-4 ml-1 transition-transform \${isOpen ? 'rotate-180 text-purple-400' : 'text-white/30'}\`} />
      </button>
      
      {/* Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 mt-3 w-80 bg-[#13151C]/95 border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.9)] rounded-2xl flex flex-col p-2 backdrop-blur-2xl overflow-hidden"
          >
            {/* Header & Search */}
            <div className="p-2 border-b border-white/5 mb-2">
               <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-black text-white/90 uppercase tracking-wider">{trait}s</h3>
                  <button onClick={() => { onChange(''); setIsOpen(false); }} className="text-xs font-bold text-white/40 hover:text-white transition-colors">
                    Reset
                  </button>
               </div>
               <div className="relative">
                 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                 <input 
                   type="text" 
                   autoFocus
                   placeholder={\`Search \${trait.toLowerCase()}...\`}
                   value={search}
                   onChange={e => setSearch(e.target.value)}
                   className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 transition-colors"
                 />
               </div>
            </div>

            {/* List */}
            <div className="max-h-[40vh] overflow-y-auto custom-scrollbar pr-1 flex flex-col gap-1">
              <button 
                onClick={() => { onChange(''); setIsOpen(false); }}
                className={\`flex items-center gap-3 px-3 py-2 rounded-xl transition-all \${!selectedValue ? 'bg-purple-500/20 text-purple-400' : 'hover:bg-white/5 text-white/70'}\`}
              >
                <div className="w-10 h-10 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center flex-shrink-0">
                   <div className="w-2 h-2 rounded-full bg-white/30" />
                </div>
                <span className="text-sm font-bold flex-1 text-left">All {trait}s</span>
                <span className="text-xs font-medium opacity-50">{totalItems}</span>
                {!selectedValue && <Check className="w-4 h-4" />}
              </button>
              
              {filteredOptions.map(opt => {
                const isSelected = selectedValue === opt.value;
                return (
                  <button 
                    key={opt.value}
                    onClick={() => { onChange(opt.value); setIsOpen(false); }}
                    className={\`flex items-center gap-3 px-3 py-2 rounded-xl transition-all \${isSelected ? 'bg-purple-500/20 text-purple-400' : 'hover:bg-white/5 text-white/70'}\`}
                  >
                    <TraitPreview trait={trait} value={opt.value} sampleUrl={opt.sampleUrl} color={opt.color} />
                    
                    <div className="flex-1 text-left">
                      <div className="text-sm font-bold truncate">{opt.value}</div>
                      {opt.rarityPercent !== undefined && (
                        <div className={\`text-[10px] font-black uppercase tracking-wider \${
                          opt.rarityPercent <= 2 ? 'text-yellow-400' :
                          opt.rarityPercent <= 10 ? 'text-purple-400' :
                          opt.rarityPercent <= 30 ? 'text-blue-400' :
                          'text-white/30'
                        }\`}>
                          {opt.rarityPercent}% RARITY
                        </div>
                      )}
                    </div>
                    
                    <span className="text-xs font-medium opacity-50">{opt.count}</span>
                    {isSelected && <Check className="w-4 h-4" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ----------------------------------------------------------------------
// GIFT CARD COMPONENT (Composite NFT Preview)
// ----------------------------------------------------------------------
function GiftCard({ item, rarityPercent }: { item: NFTItem; rarityPercent?: number; key?: any }) {
  const [isHovered, setIsHovered] = useState(false);
  const lottieUrl = item.metadata.lottie || item.metadata.lottie_url;
  
  const finalRarity = rarityPercent !== undefined ? rarityPercent : 50; 
  const glowClasses = getRarityGlow(finalRarity);
  const estimatedPrice = (100 / Math.max(0.1, finalRarity)).toFixed(1);

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, scale: 0.95 },
        show: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={\`rounded-2xl overflow-hidden group flex flex-col relative transition-all duration-300 border backdrop-blur-xl \${glowClasses}\`}
    >
      <div className="aspect-square w-full relative p-4 flex items-center justify-center bg-black/40">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {isHovered && lottieUrl ? (
          <div className="w-full h-full absolute inset-0 z-0 p-4">
            <Player src={lottieUrl} autoplay loop className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
          </div>
        ) : (
          <img 
            src={item.metadata.image} 
            alt={item.metadata.name}
            className="w-full h-full object-contain filter drop-shadow-[0_0_10px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform duration-500 ease-out z-0 relative"
            loading="lazy"
          />
        )}
        
        <div className="absolute top-3 left-3 z-20 flex gap-2">
          {getRarityBadge(finalRarity)}
        </div>
        <div className="absolute top-3 right-3 z-20">
          <span className="bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-white/70 border border-white/10">
            #{item.index}
          </span>
        </div>

        <div className="absolute inset-x-0 bottom-4 z-20 flex justify-center gap-2 px-4 translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
           <button className="flex-1 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold py-2 rounded-lg transition-colors">Play</button>
           <button className="flex-1 bg-white/10 hover:bg-white/20 text-white text-xs font-bold py-2 rounded-lg border border-white/20 transition-colors">Sell</button>
        </div>
      </div>
      <div className="p-4 flex flex-col justify-between border-t border-white/5 relative z-20 bg-[#13151C]/90">
        <h3 className="text-sm font-bold text-white truncate group-hover:text-amber-400 transition-colors">
          {item.metadata.name}
        </h3>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-white/50 font-medium">{finalRarity}% rarity</span>
          <span className="text-xs font-black text-emerald-400 flex items-center gap-1">~{estimatedPrice} TON</span>
        </div>
      </div>
    </motion.div>
  );
}

// ----------------------------------------------------------------------
// MAIN INVENTORY COMPONENT
// ----------------------------------------------------------------------
export function Inventory() {
  const [items, setItems] = useState<NFTItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selectedCollection, setSelectedCollection] = useState(COLLECTIONS[0].address);
  const [visibleCount, setVisibleCount] = useState(48);
  const LIMIT = 1000;

  useEffect(() => {
    let mounted = true;
    async function loadItems() {
      try {
        setLoading(true);
        setError(null);
        setItems([]);
        setOffset(0);
        
        let allFetched = false;
        let currentOffset = 0;
        
        while (!allFetched && currentOffset < 3000) {
          let data: NFTItem[] = [];
          try {
            data = await fetchTelegramGifts(LIMIT, currentOffset, selectedCollection);
          } catch (fetchErr) {
            if (currentOffset > 0) {
              console.warn("Rate limit hit during progressive load.");
              break;
            }
            throw fetchErr;
          }
          
          if (data.length === 0) {
            allFetched = true;
            break;
          }
          
          if (mounted) {
            setItems(prev => {
              const newItems = [...prev];
              const existingMap = new Set(prev.map(i => i.address));
              data.forEach(d => {
                if (!existingMap.has(d.address)) newItems.push(d);
              });
              return newItems;
            });
            setOffset(currentOffset + 1000);
            setFilters({});
            setVisibleCount(prev => Math.max(prev, 48));
            
            if (currentOffset === 0) { 
               setLoading(false); 
            }
          }
          
          if (data.length < 1000) {
            allFetched = true;
          } else {
            currentOffset += 1000;
          }
        }
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Unknown error');
        if (mounted) setLoading(false);
      }
    }
    
    loadItems();
    return () => { mounted = false; };
  }, [selectedCollection]);

  const handleLoadMore = async () => {
    if (visibleCount < filteredItems.length) {
      setVisibleCount(prev => prev + 48);
      return;
    }
  };

  const handleFilterChange = (trait: string, value: string) => {
    setFilters(prev => ({ ...prev, [trait]: value }));
    setVisibleCount(48);
  };

  const clearFilters = () => {
    setFilters({});
    setVisibleCount(48);
  };

  // 1. NORMALIZE & BUILD ATTRIBUTES MAP (The core requirement)
  const attributesMap = useMemo<Record<string, Map<string, AttributeMetadata>>>(() => {
    const map: Record<string, Map<string, AttributeMetadata>> = {};
    const traitCounts: Record<string, Record<string, number>> = {};
    
    // Pass 1: Count
    items.forEach(item => {
      item.metadata.attributes?.forEach(attr => {
        if (!traitCounts[attr.trait_type]) traitCounts[attr.trait_type] = {};
        traitCounts[attr.trait_type][attr.value] = (traitCounts[attr.trait_type][attr.value] || 0) + 1;
      });
    });

    // Pass 2: Build map with sample asset URL for preview extraction
    const totalItems = items.length;
    items.forEach(item => {
      item.metadata.attributes?.forEach(attr => {
        if (!map[attr.trait_type]) map[attr.trait_type] = new Map();
        const valMap = map[attr.trait_type];
        
        if (!valMap.has(attr.value)) {
          const count = traitCounts[attr.trait_type][attr.value];
          const rarityPercent = totalItems > 0 ? Number(((count / totalItems) * 100).toFixed(1)) : 0;
          
          valMap.set(attr.value, {
            value: attr.value,
            sampleUrl: item.metadata.lottie || item.metadata.lottie_url,
            color: attr.trait_type === 'Backdrop' ? (COLOR_MAP[attr.value] || '#333333') : undefined,
            count,
            rarityPercent
          });
        }
      });
    });
    return map;
  }, [items]);

  // 2. FILTER COMPOSITE NFTS
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      return Object.entries(filters).every(([trait, value]) => {
        if (!value) return true;
        const itemAttr = item.metadata.attributes?.find(a => a.trait_type === trait);
        return itemAttr?.value === value;
      });
    });
  }, [items, filters]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-8"
    >
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tight text-white text-glow">
            Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-amber-500">Vault</span>
          </h2>
          <p className="text-white/40 mt-2 font-medium">
            Manage your assets, upgrade cheap items, or sell them on the market.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-[#13151C] border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)] px-4 py-2 rounded-full flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,1)]" />
            <span className="text-xs font-black text-emerald-400 tracking-wider uppercase">Live TON Network</span>
          </div>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="w-8 h-8 text-white/40 animate-spin" />
            <p className="text-sm font-bold text-white/40 uppercase tracking-widest">Synchronizing Nodes...</p>
          </motion.div>
        ) : error ? (
          <motion.div key="error" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-8 rounded-3xl flex flex-col items-center justify-center text-center space-y-4 border-red-500/20 bg-red-500/5">
            <AlertCircle className="w-10 h-10 text-red-400/80" />
            <p className="text-red-200/80 max-w-md font-medium">{error}</p>
          </motion.div>
        ) : (
          <motion.div key="grid" variants={{ show: { transition: { staggerChildren: 0.05 } } }} initial="hidden" animate="show" className="flex flex-col space-y-6 w-full">
            
            {/* 1. Collection Tabs */}
            <div className="flex overflow-x-auto pb-2 gap-3 w-full custom-scrollbar">
              {COLLECTIONS.map(collection => (
                <button
                  key={collection.address}
                  onClick={() => setSelectedCollection(collection.address)}
                  className={\`shrink-0 px-6 py-3 rounded-xl text-sm font-black uppercase italic tracking-wider transition-all \${
                    selectedCollection === collection.address
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(124,58,237,0.4)] border border-purple-500/50'
                      : 'bg-[#13151C] text-white/40 hover:bg-[#1A1D27] hover:text-white/80 border border-white/5'
                  }\`}
                >
                  {collection.name}
                </button>
              ))}
            </div>

            {/* 2. Premium Attribute Selectors */}
            {Object.keys(attributesMap).length > 0 && (
              <div className="bg-[#13151C]/60 border border-white/5 p-4 rounded-2xl flex flex-wrap items-center gap-3 w-full relative z-30">
                <div className="flex items-center gap-2 text-white/40 mr-2 shrink-0">
                  <Filter className="w-4 h-4" />
                  <span className="text-xs font-black uppercase tracking-wider">Filters</span>
                </div>
                
                {Object.entries(attributesMap).map(([trait, valuesMap]) => (
                  <AttributeFilter 
                    key={trait}
                    trait={trait}
                    options={Array.from(valuesMap.values()).sort((a, b) => b.count - a.count)}
                    selectedValue={filters[trait] || ""}
                    onChange={(val) => handleFilterChange(trait, val)}
                    totalItems={items.length}
                  />
                ))}

                <AnimatePresence>
                  {activeFilterCount > 0 && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                      onClick={clearFilters}
                      className="ml-auto flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/40 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-4 py-2.5 rounded-xl border border-white/5"
                    >
                      <X className="w-4 h-4" /> Reset All
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* 3. Composite NFT Grid */}
            {filteredItems.length === 0 && items.length > 0 ? (
              <div className="py-20 flex flex-col items-center text-center bg-[#13151C]/40 border border-white/5 rounded-3xl">
                <PackageOpen className="w-16 h-16 text-white/10 mb-4" />
                <h3 className="text-xl font-black text-white/80 uppercase italic tracking-tight mb-2">No items found</h3>
                <p className="text-white/40 font-medium mb-6">Try adjusting your filters to find what you're looking for.</p>
                <button onClick={clearFilters} className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)]">
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 w-full relative z-10">
                {filteredItems.slice(0, visibleCount).map((item) => {
                    let minRarity = 100;
                    item.metadata.attributes?.forEach(attr => {
                      const r = attributesMap[attr.trait_type]?.get(attr.value)?.rarityPercent;
                      if (r !== undefined && r < minRarity) minRarity = r;
                    });
                    if (minRarity === 100) minRarity = 50; 
                    return <GiftCard key={item.address} item={item} rarityPercent={minRarity} />;
                })}
              </div>
            )}
            
            {visibleCount < filteredItems.length && (
              <div className="flex justify-center pt-8">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="bg-[#13151C] border border-white/10 hover:border-purple-500/50 hover:bg-[#1A1D27] px-8 py-3 rounded-xl text-white/80 hover:text-white font-bold uppercase tracking-wider transition-all flex items-center gap-2"
                >
                  {loadingMore ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading...</> : 'Load More'}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
`;

fs.writeFileSync('src/components/Inventory.tsx', code);
