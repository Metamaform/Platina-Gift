
import { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchTelegramGifts } from '../lib/api';
import { NFTItem } from '../types';
import { Loader2, AlertCircle, Filter, Search, Check, PackageOpen } from 'lucide-react';
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

import collectionsData from '../../collections.json';

const COLLECTIONS = collectionsData;

type AttributeMetadata = {
  value: string;
  sampleUrl?: string;
  color?: string;
  count: number;
};

const globalPreviewCache = new Map<string, string>();

function TraitPreview({ trait, value, sampleUrl, color, small }: { trait: string, value: string, sampleUrl?: string, color?: string, small?: boolean }) {
  const cacheKey = `${trait}:${value}`;
  const [img, setImg] = useState<string | null>(globalPreviewCache.get(cacheKey) || null);
  const sizeClass = small ? 'w-5 h-5' : 'w-10 h-10';
  const radiusClass = small ? 'rounded-[6px]' : 'rounded-[12px]';
  
  useEffect(() => {
    let mounted = true;
    if (img || !sampleUrl || trait === 'Backdrop') return;
    
    if (globalPreviewCache.has(cacheKey)) {
      setImg(globalPreviewCache.get(cacheKey)!);
      return;
    }

    import('../lib/lottieExtractor').then(({ generateCleanPreview }) => {
       generateCleanPreview(sampleUrl, trait as 'Model' | 'Symbol').then(res => {
         if (res && mounted) {
           globalPreviewCache.set(cacheKey, res);
           setImg(res);
         }
       });
    });

    return () => { mounted = false; };
  }, [trait, value, sampleUrl, img, cacheKey]);

  if (trait === 'Backdrop') {
    return <div className={`${sizeClass} ${radiusClass} flex-shrink-0 border border-hairline`} style={{ backgroundColor: color || '#333' }} />;
  }
  
  if (img) {
    return (
      <div className={`${sizeClass} flex items-center justify-center flex-shrink-0 bg-white/5 ${radiusClass} border border-hairline p-0.5`}>
         <img src={img} className="w-full h-full object-contain" alt={value} />
      </div>
    );
  }
  
  return <div className={`${sizeClass} ${radiusClass} bg-white/5 animate-pulse flex-shrink-0 border border-hairline`} />;
}

// ----------------------------------------------------------------------
// BOTTOM SHEET FILTER COMPONENT
// ----------------------------------------------------------------------
function BottomSheetFilter({ 
  trait, 
  options, 
  selectedValue, 
  onChange,
  onClose,
  totalItems
}: { 
  trait: string, 
  options: AttributeMetadata[], 
  selectedValue: string, 
  onChange: (val: string) => void,
  onClose: () => void,
  totalItems: number,
  key?: string | number
}) {
  const [search, setSearch] = useState('');

  const filteredOptions = useMemo(() => {
    if (!search) return options;
    const lower = search.toLowerCase();
    return options.filter(o => o.value.toLowerCase().includes(lower));
  }, [options, search]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      
      {/* Sheet */}
      <motion.div 
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full bg-surface rounded-t-3xl border-t border-hairline overflow-hidden flex flex-col max-h-[85vh]"
      >
        <div className="w-full flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-white/20 rounded-full" />
        </div>
        
        <div className="px-4 pb-4">
          <h3 className="font-display text-xl font-semibold mb-4">{trait}s</h3>
          
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input 
              type="text" 
              placeholder={`Search ${trait.toLowerCase()}...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-canvas-deep rounded-2xl pl-10 pr-4 py-3 text-[15px] text-white placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-safe custom-scrollbar">
          <button 
            onClick={() => { onChange(''); onClose(); }}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-colors ${!selectedValue ? 'bg-white/5' : 'hover:bg-white/5'}`}
          >
            <div className="w-10 h-10 rounded-[12px] bg-canvas-deep border border-hairline flex items-center justify-center flex-shrink-0">
               <div className="w-3 h-3 rounded-full bg-white/30" />
            </div>
            <span className="text-[16px] font-semibold flex-1 text-left text-white">All {trait}s</span>
            <span className="text-[13px] text-muted">{totalItems}</span>
            {!selectedValue && <Check className="w-5 h-5 text-brand ml-2" />}
          </button>
          
          {filteredOptions.map(opt => {
            const isSelected = selectedValue === opt.value;
            return (
              <button 
                key={opt.value}
                onClick={() => { onChange(opt.value); onClose(); }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-colors ${isSelected ? 'bg-white/5' : 'hover:bg-white/5'}`}
              >
                <TraitPreview trait={trait} value={opt.value} sampleUrl={opt.sampleUrl} color={opt.color} />
                <span className="text-[16px] font-semibold flex-1 text-left text-white truncate">{opt.value}</span>
                <span className="text-[13px] text-muted">{opt.count}</span>
                {isSelected && <Check className="w-5 h-5 text-brand ml-2" />}
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

// ----------------------------------------------------------------------
// GIFT CARD COMPONENT
// ----------------------------------------------------------------------
function GiftCard({ item }: { item: NFTItem; key?: string | number }) {
  const lottieUrl = item.metadata.lottie || item.metadata.lottie_url;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="rounded-[16px] overflow-hidden bg-surface border border-hairline shadow-sm shadow-black/20 flex flex-col"
    >
      <div className="aspect-square w-full relative bg-canvas-deep p-2 flex items-center justify-center">
        {isHovered && lottieUrl ? (
          <div className="w-full h-full absolute inset-0 z-0 p-2">
            <Player src={lottieUrl} autoplay loop className="w-full h-full object-contain" />
          </div>
        ) : (
          <img 
            src={item.metadata.image} 
            alt={item.metadata.name}
            className="w-full h-full object-contain transition-transform duration-500 hover:scale-105"
            loading="lazy"
          />
        )}
      </div>
      <div className="p-3">
        <h3 className="text-[16px] font-semibold text-white truncate">{item.metadata.name}</h3>
        <p className="text-[13px] text-muted mt-1">Collectible</p>
      </div>
    </motion.div>
  );
}

// ----------------------------------------------------------------------
// MAIN INVENTORY / CATALOG COMPONENT
// ----------------------------------------------------------------------
export function Inventory({ mode = 'inventory' }: { mode?: 'catalog' | 'inventory' }) {
  const [items, setItems] = useState<NFTItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  
  // Filters & State
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selectedCollection, setSelectedCollection] = useState(COLLECTIONS[0].address);
  const [visibleCount, setVisibleCount] = useState(24);
  const [activeSheet, setActiveSheet] = useState<string | null>(null); // e.g. "Model", "Backdrop"
  
  // Catalog specific state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'name' | 'type'>('newest');

  const LIMIT = 1000;

  useEffect(() => {
    let mounted = true;
    async function loadItems() {
      try {
        setLoading(true);
        setError(null);
        setItems([]);
        
        let allFetched = false;
        let currentOffset = 0;
        
        while (!allFetched && currentOffset < 15000) {
          let data: NFTItem[] = [];
          try {
            data = await fetchTelegramGifts(LIMIT, currentOffset, selectedCollection);
          } catch (fetchErr: any) {
            if (currentOffset === 0) throw fetchErr; // Fail completely if first page fails
            break; // Otherwise just stop loading more
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
            if (currentOffset === 0) setLoading(false);
          }
          
          if (data.length < 1000) allFetched = true;
          else {
            currentOffset += 1000;
            if (!allFetched && currentOffset < 15000) {
              await delay(1000); // 1 second delay between pagination calls
            }
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

  const attributesMap = useMemo<Record<string, Map<string, AttributeMetadata>>>(() => {
    const map: Record<string, Map<string, AttributeMetadata>> = {};
    const traitCounts: Record<string, Record<string, number>> = {};
    
    items.forEach(item => {
      item.metadata.attributes?.forEach(attr => {
        if (!traitCounts[attr.trait_type]) traitCounts[attr.trait_type] = {};
        traitCounts[attr.trait_type][attr.value] = (traitCounts[attr.trait_type][attr.value] || 0) + 1;
      });
    });

    items.forEach(item => {
      item.metadata.attributes?.forEach(attr => {
        if (!map[attr.trait_type]) map[attr.trait_type] = new Map();
        const valMap = map[attr.trait_type];
        if (!valMap.has(attr.value)) {
          valMap.set(attr.value, {
            value: attr.value,
            sampleUrl: item.metadata.lottie || item.metadata.lottie_url,
            color: attr.trait_type === 'Backdrop' ? (COLOR_MAP[attr.value] || '#333333') : undefined,
            count: traitCounts[attr.trait_type][attr.value],
          });
        }
      });
    });
    return map;
  }, [items]);

  const filteredAndSortedItems = useMemo(() => {
    let result = items;
    
    if (mode === 'inventory') {
      result = result.filter(item => {
        return Object.entries(filters).every(([trait, value]) => {
          if (!value) return true;
          const itemAttr = item.metadata.attributes?.find(a => a.trait_type === trait);
          return itemAttr?.value === value;
        });
      });
    } else {
      // Catalog search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        result = result.filter(i => i.metadata.name?.toLowerCase().includes(q));
      }
      // Модель/узор/фон — те же фильтры по атрибутам, что и в инвентаре
      result = result.filter(item => {
        return Object.entries(filters).every(([trait, value]) => {
          if (!value) return true;
          const itemAttr = item.metadata.attributes?.find(a => a.trait_type === trait);
          return itemAttr?.value === value;
        });
      });
      // Basic mock sorting
      if (sortBy === 'name') {
        result = [...result].sort((a, b) => (a.metadata.name || '').localeCompare(b.metadata.name || ''));
      }
    }
    return result;
  }, [items, filters, mode, searchQuery, sortBy]);

  const handleFilterChange = (trait: string, value: string) => {
    setFilters(prev => ({ ...prev, [trait]: value }));
    setVisibleCount(24);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      
      {/* COLLECTIONS PICKER - ALWAYS SHOWN */}
      <div className="flex overflow-x-auto gap-2 no-scrollbar pb-2">
        {COLLECTIONS.map(collection => (
          <button
            key={collection.address}
            onClick={() => { setSelectedCollection(collection.address); setFilters({}); setVisibleCount(24); }}
            className={`shrink-0 px-4 py-2 rounded-full text-[14px] font-semibold transition-colors border ${
              selectedCollection === collection.address
                ? 'bg-brand/20 text-brand border-brand/30'
                : 'bg-surface text-muted hover:text-white border-hairline'
            }`}
          >
            {collection.name}
          </button>
        ))}
      </div>
      
      {/* HEADER SECTION based on Mode */}
      {mode === 'catalog' ? (
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input 
              type="text" 
              placeholder="Search catalog..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface rounded-2xl pl-10 pr-4 py-3 text-[15px] text-white placeholder:text-muted focus:outline-none border border-hairline focus:border-brand/50"
            />
          </div>
          {/* Фильтр по атрибутам: рядом с названием модели/узора/фона — превью самой модели/узора и цвет фона */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-surface border border-hairline flex-shrink-0 text-muted">
              <Filter className="w-4 h-4" />
            </div>
            {Object.keys(attributesMap).map(trait => {
               const selectedVal = filters[trait];
               const selectedMeta = selectedVal ? attributesMap[trait].get(selectedVal) : undefined;
               return (
                 <button
                   key={trait}
                   onClick={() => setActiveSheet(trait)}
                   className={`px-3 py-1.5 rounded-full text-[13px] font-semibold whitespace-nowrap border transition-colors flex items-center gap-2 ${
                     selectedVal ? 'bg-brand/20 text-brand border-brand/30' : 'bg-surface text-muted border-hairline'
                   }`}
                 >
                   {selectedVal && (
                     <TraitPreview trait={trait} value={selectedVal} sampleUrl={selectedMeta?.sampleUrl} color={selectedMeta?.color} small />
                   )}
                   {trait} {selectedVal && `: ${selectedVal}`}
                 </button>
               )
            })}
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {['newest', 'name', 'type'].map(sortOpt => (
              <button 
                key={sortOpt}
                onClick={() => setSortBy(sortOpt as any)}
                className={`px-4 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap border transition-colors ${
                  sortBy === sortOpt ? 'bg-brand/20 text-brand border-brand/30' : 'bg-surface text-muted border-hairline'
                }`}
              >
                Sort by {sortOpt.charAt(0).toUpperCase() + sortOpt.slice(1)}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-surface border border-hairline flex-shrink-0 text-muted">
              <Filter className="w-4 h-4" />
            </div>
            {Object.keys(attributesMap).map(trait => {
               const selectedVal = filters[trait];
               return (
                 <button
                   key={trait}
                   onClick={() => setActiveSheet(trait)}
                   className={`px-4 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap border transition-colors flex items-center gap-1 ${
                     selectedVal ? 'bg-brand/20 text-brand border-brand/30' : 'bg-surface text-muted border-hairline'
                   }`}
                 >
                   {trait} {selectedVal && `: ${selectedVal}`}
                 </button>
               )
            })}
          </div>
        </div>
      )}

      {/* CONTENT GRID */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-muted animate-spin" />
          </motion.div>
        ) : error ? (
          <motion.div key="error" className="p-6 bg-red-500/10 rounded-2xl flex items-center gap-3 text-red-400">
            <AlertCircle className="w-6 h-6" />
            <p className="text-[14px] font-medium">{error}</p>
          </motion.div>
        ) : (
          <motion.div key="grid" variants={{ show: { transition: { staggerChildren: 0.05 } } }} initial="hidden" animate="show">
            {filteredAndSortedItems.length === 0 ? (
              <div className="py-20 flex flex-col items-center text-center">
                <PackageOpen className="w-16 h-16 text-muted/30 mb-4" />
                <h3 className="font-display text-lg font-semibold mb-2">No items found</h3>
                <p className="text-[14px] text-muted">Try adjusting your search or filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
                {filteredAndSortedItems.slice(0, visibleCount).map((item) => (
                  <GiftCard key={item.address} item={item} />
                ))}
              </div>
            )}
            
            {visibleCount < filteredAndSortedItems.length && (
              <div className="flex justify-center pt-8">
                <button
                  onClick={() => setVisibleCount(p => p + 24)}
                  className="px-6 py-3 rounded-full bg-surface border border-hairline text-[14px] font-bold text-white transition-colors hover:bg-white/5"
                >
                  Load More
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* BOTTOM SHEET PORTALS */}
      <AnimatePresence>
        {activeSheet && attributesMap[activeSheet] && (
          <BottomSheetFilter 
            key={activeSheet}
            trait={activeSheet}
            options={Array.from<AttributeMetadata>(attributesMap[activeSheet].values()).sort((a,b) => b.count - a.count)}
            selectedValue={filters[activeSheet] || ""}
            onChange={(val) => handleFilterChange(activeSheet, val)}
            onClose={() => setActiveSheet(null)}
            totalItems={items.length}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
