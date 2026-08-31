const fs = require('fs');
let code = fs.readFileSync('src/components/Inventory.tsx', 'utf8');

// 1. Update COLLECTIONS
code = code.replace(
  /const COLLECTIONS = \[\s+\{ name: 'Loot Bags', address: 'EQCE80Aln8YfldnQLwWMvOfloLGgmPY0eGDJz9ufG3gRui3D' \},\s+\{ name: 'Swag Bags', address: 'EQCgaTxb2wA_3Bi8Ec4FFNu8CauoHo0VPpnwxdrhAgOrOXvA' \},\s+\{ name: 'Telegram Gifts', address: 'EQA_i7cVx0LkoT-F-rQpqvXGkkn6DHcwOvZe30FIYOhPDlQA' \}\s+\];/g,
  `const COLLECTIONS = [\n  { name: 'Loot Bags', address: 'EQCE80Aln8YfldnQLwWMvOfloLGgmPY0eGDJz9ufG3gRui3D' },\n  { name: 'Swag Bags', address: 'EQCgaTxb2wA_3Bi8Ec4FFNu8CauoHo0VPpnwxdrhAgOrOXvA' }\n];`
);

// 2. Insert COLOR_MAP and AttributeMetadata type
const typeInsertion = `
type AttributeMetadata = {
  value: string;
  previewImage?: string;
  color?: string;
};

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

function FilterDropdown({ 
  trait, 
  options, 
  selectedValue, 
  onChange 
}: { 
  trait: string, 
  options: AttributeMetadata[], 
  selectedValue: string, 
  onChange: (val: string) => void 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = options.find(o => o.value === selectedValue);

  return (
    <div className="relative" onMouseLeave={() => setIsOpen(false)}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="glass-panel px-4 py-2.5 rounded-xl flex items-center gap-3 hover:bg-white/10 transition-colors border border-white/5 hover:border-white/20"
      >
        <span className="text-xs text-white/50 uppercase tracking-wider">{trait}</span>
        <div className="w-px h-4 bg-white/10" />
        {selected ? (
          <div className="flex items-center gap-2">
            {selected.color && <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: selected.color }} />}
            {selected.previewImage && <img src={selected.previewImage} alt="" className="w-5 h-5 rounded object-cover" />}
            <span className="text-sm font-medium text-white">{selected.value}</span>
          </div>
        ) : (
          <span className="text-sm font-medium text-white/70">All</span>
        )}
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 max-h-80 overflow-y-auto custom-scrollbar glass-panel rounded-xl z-50 flex flex-col p-2 shadow-2xl border border-white/10">
          <button 
            onClick={() => { onChange(''); setIsOpen(false); }}
            className={\`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors \${!selectedValue ? 'bg-white/10' : 'hover:bg-white/5'}\`}
          >
            <span className="text-sm text-white/80">All {trait}s</span>
          </button>
          {options.map(opt => (
            <button 
              key={opt.value}
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
              className={\`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors \${selectedValue === opt.value ? 'bg-white/10' : 'hover:bg-white/5'}\`}
            >
              {opt.color && <div className="w-6 h-6 rounded-full border border-white/20 shrink-0 shadow-inner" style={{ backgroundColor: opt.color }} />}
              {opt.previewImage && <img src={opt.previewImage} alt="" className="w-8 h-8 rounded shrink-0 object-cover bg-black/20" />}
              <span className="text-sm text-white/90 truncate">{opt.value}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
`;
code = code.replace(/export function Inventory\(\) \{/, typeInsertion + '\nexport function Inventory() {');

// 3. Update Inventory state
code = code.replace(
  /const \[offset, setOffset\] = useState\(0\);\n  const \[filters, setFilters\] = useState<Record<string, string>>\(\{\}\);\n  const \[selectedCollection, setSelectedCollection\] = useState\(COLLECTIONS\[0\]\.address\);\n  const LIMIT = 48;/,
  `const [offset, setOffset] = useState(0);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selectedCollection, setSelectedCollection] = useState(COLLECTIONS[0].address);
  const [visibleCount, setVisibleCount] = useState(48);
  const LIMIT = 1000;`
);

// 4. Update attributesMap
code = code.replace(
  /const attributesMap = useMemo\(\(\) => \{[\s\S]*?return map;\n  \}, \[items\]\);/,
  `const attributesMap = useMemo(() => {
    const map: Record<string, Map<string, AttributeMetadata>> = {};
    items.forEach(item => {
      item.metadata.attributes?.forEach(attr => {
        if (!map[attr.trait_type]) map[attr.trait_type] = new Map();
        const valMap = map[attr.trait_type];
        if (!valMap.has(attr.value)) {
          valMap.set(attr.value, {
            value: attr.value,
            previewImage: attr.trait_type !== 'Backdrop' ? (item.previews?.[1]?.url || item.metadata.image) : undefined,
            color: attr.trait_type === 'Backdrop' ? (COLOR_MAP[attr.value] || '#333333') : undefined
          });
        }
      });
    });
    return map;
  }, [items]);`
);

// 5. Update LoadItems to handle visibleCount
code = code.replace(
  /if \(mounted\) \{\n          setItems\(data\);\n          setOffset\(0\);\n          setFilters\(\{\}\);\n        \}/,
  `if (mounted) {
          setItems(data);
          setOffset(0);
          setFilters({});
          setVisibleCount(48);
        }`
);

// 6. Update HandleLoadMore
code = code.replace(
  /const handleLoadMore = async \(\) => \{[\s\S]*?finally \{\n      setLoadingMore\(false\);\n    \}\n  \};/,
  `const handleLoadMore = async () => {
    if (visibleCount < filteredItems.length) {
      setVisibleCount(prev => prev + 48);
      return;
    }
    
    try {
      setLoadingMore(true);
      const nextOffset = offset + LIMIT;
      const data = await fetchTelegramGifts(LIMIT, nextOffset, selectedCollection);
      setItems(prev => {
        const newItems = [...prev];
        const existingMap = new Set(prev.map(i => i.address));
        data.forEach(d => {
          if (!existingMap.has(d.address)) newItems.push(d);
        });
        return newItems;
      });
      setOffset(nextOffset);
      setVisibleCount(prev => prev + 48);
    } catch (err) {
      console.error('Failed to load more items:', err);
    } finally {
      setLoadingMore(false);
    }
  };`
);

// 7. Update Filter UI render
code = code.replace(
  /<div className="flex flex-wrap items-center gap-3 w-full">[\s\S]*?<\/div>\n              <\/div>/,
  `<div className="flex flex-wrap items-center gap-3 w-full">
                  {Object.entries(attributesMap).map(([trait, valuesMap]) => (
                    <FilterDropdown 
                      key={trait}
                      trait={trait}
                      options={Array.from(valuesMap.values()).sort((a, b) => a.value.localeCompare(b.value))}
                      selectedValue={filters[trait] || ""}
                      onChange={(val) => handleFilterChange(trait, val)}
                    />
                  ))}
                  
                  {Object.values(filters).some(v => v) && (
                    <button
                      onClick={clearFilters}
                      className="flex items-center gap-1 text-xs text-white/50 hover:text-white/90 transition-colors md:ml-auto px-3 py-2"
                    >
                      <X className="w-4 h-4" />
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>`
);

// 8. Update grid render mapping from filteredItems to visibleItems
code = code.replace(
  /\{filteredItems\.map\(\(item\) => \(\n                  <GiftCard key=\{item\.address\} item=\{item\} \/>\n                \)\)\}/,
  `{filteredItems.slice(0, visibleCount).map((item) => (
                  <GiftCard key={item.address} item={item} />
                ))}`
);

fs.writeFileSync('src/components/Inventory.tsx', code);
