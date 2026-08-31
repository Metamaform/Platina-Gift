const fs = require('fs');
let code = fs.readFileSync('src/components/Inventory.tsx', 'utf8');

// 1. Remove previewImage from attributes map generation
code = code.replace(
  /previewImage: attr\.trait_type !== 'Backdrop' \? \(item\.previews\?\.\[1\]\?\.url \|\| item\.metadata\.image\) : undefined,/g,
  'previewImage: undefined,'
);

// 2. Enhance the dropdown UI to be cleaner, without false images
code = code.replace(
  /\{opt\.previewImage && <img src=\{opt\.previewImage\}.*?\/>\}/g,
  ''
);
code = code.replace(
  /\{selected\.previewImage && <img src=\{selected\.previewImage\}.*?\/>\}/g,
  ''
);

// 3. Improve FilterDropdown layout
const newFilterDropdown = `
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
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className={\`relative \${isOpen ? 'z-50' : 'z-10'}\`} ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={\`glass-panel px-4 py-2.5 rounded-xl flex items-center gap-3 transition-colors border \${isOpen ? 'bg-white/20 border-white/30 shadow-lg' : 'hover:bg-white/10 border-white/5 hover:border-white/20'}\`}
      >
        <span className="text-xs text-white/50 uppercase tracking-wider font-semibold">{trait}</span>
        <div className="w-px h-4 bg-white/10" />
        {selected ? (
          <div className="flex items-center gap-2">
            {selected.color && trait === 'Backdrop' && <div className="w-3.5 h-3.5 rounded-full shadow-inner" style={{ backgroundColor: selected.color }} />}
            <span className="text-sm font-medium text-white">{selected.value}</span>
          </div>
        ) : (
          <span className="text-sm font-medium text-white/70">All</span>
        )}
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 max-h-[40vh] overflow-y-auto custom-scrollbar bg-[#1a1a1a] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.9)] rounded-xl flex flex-col p-1.5 z-50 backdrop-blur-xl">
          <button 
            onClick={() => { onChange(''); setIsOpen(false); }}
            className={\`flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors \${!selectedValue ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-white/70'}\`}
          >
            <span className="text-sm font-medium">All {trait}s</span>
          </button>
          {options.map(opt => (
            <button 
              key={opt.value}
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
              className={\`flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors \${selectedValue === opt.value ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-white/70'}\`}
            >
              {opt.color && trait === 'Backdrop' && <div className="w-4 h-4 rounded-full border border-white/10 shrink-0 shadow-inner" style={{ backgroundColor: opt.color }} />}
              <span className="text-sm font-medium truncate">{opt.value}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
`;

// Replace the old FilterDropdown
code = code.replace(/function FilterDropdown\(\{[\s\S]*?\}\s*\)\s*\{[\s\S]*?return \([\s\S]*?<\div>\s*\);\s*\}/, newFilterDropdown.trim());

fs.writeFileSync('src/components/Inventory.tsx', code);
