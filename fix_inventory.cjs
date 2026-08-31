const fs = require('fs');
let code = fs.readFileSync('src/components/Inventory.tsx', 'utf8');

// 1. Opaque dropdown and Color generation for Model/Symbol
code = code.replace(
  /<div className="absolute top-full left-0 mt-2 w-64 max-h-80 overflow-y-auto custom-scrollbar glass-panel rounded-xl z-50 flex flex-col p-2 shadow-2xl border border-white\/10">/,
  '<div className="absolute top-full left-0 mt-2 w-64 max-h-[50vh] overflow-y-auto custom-scrollbar bg-neutral-900/95 backdrop-blur-3xl rounded-xl z-50 flex flex-col p-2 shadow-[0_10px_40px_rgba(0,0,0,0.8)] border border-white/20">'
);

// 2. Hash function for colors
const hashColorInsertion = `
function getStringColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
}
`;
code = code.replace(/export function Inventory\(\) \{/, hashColorInsertion + '\nexport function Inventory() {');

// 3. Replace previewImage logic with stable colors for all traits
code = code.replace(
  /previewImage: attr.trait_type !== 'Backdrop' \? \(item\.previews\?\.\[1\]\?\.url \|\| item\.metadata\.image\) : undefined,\n            color: attr\.trait_type === 'Backdrop' \? \(COLOR_MAP\[attr\.value\] \|\| '#333333'\) : undefined/,
  `previewImage: undefined,
            color: attr.trait_type === 'Backdrop' 
              ? (COLOR_MAP[attr.value] || '#333333') 
              : getStringColor(attr.value)`
);

// 4. Update the loadItems function to fetch progressively
code = code.replace(
  /async function loadItems\(\) \{[\s\S]*?loadItems\(\);/,
  `async function loadItems() {
      try {
        setLoading(true);
        setItems([]); // Clear previous items
        
        let currentOffset = 0;
        let allFetched = false;
        
        // Progressive fetch
        while(!allFetched && mounted) {
          const data = await fetchTelegramGifts(1000, currentOffset, selectedCollection);
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
               setLoading(false); // Hide full loader after first batch
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

    loadItems();`
);

fs.writeFileSync('src/components/Inventory.tsx', code);
