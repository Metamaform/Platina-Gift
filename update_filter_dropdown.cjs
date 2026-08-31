const fs = require('fs');
let code = fs.readFileSync('src/components/Inventory.tsx', 'utf8');

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
  onChange: (val: string) => void,
  key?: any
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
    <div className={\`relative \${isOpen ? 'z-[60]' : 'z-20'}\`} ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={\`glass-panel px-4 py-3 rounded-xl flex items-center gap-3 transition-all border \${isOpen ? 'bg-[#1A1D27] border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'hover:bg-[#1A1D27] border-white/5 hover:border-white/20'}\`}
      >
        <span className="text-xs text-white/40 uppercase tracking-widest font-black">{trait}</span>
        <div className="w-px h-4 bg-white/10" />
        {selected ? (
          <div className="flex items-center gap-2">
            {selected.color && trait === 'Backdrop' && <div className="w-3.5 h-3.5 rounded-full border border-white/10 shadow-inner shadow-black/50" style={{ backgroundColor: selected.color }} />}
            <span className="text-sm font-black text-amber-400">{selected.value}</span>
          </div>
        ) : (
          <span className="text-sm font-bold text-white/60">All</span>
        )}
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 max-h-[40vh] overflow-y-auto custom-scrollbar bg-[#0D0E12]/95 border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.9)] rounded-xl flex flex-col p-1.5 z-[60] backdrop-blur-2xl">
          <button 
            onClick={() => { onChange(''); setIsOpen(false); }}
            className={\`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors \${!selectedValue ? 'bg-purple-500/20 text-purple-400 font-bold' : 'hover:bg-white/5 text-white/60 font-medium'}\`}
          >
            <span className="text-sm">All {trait}s</span>
          </button>
          {options.map(opt => (
            <button 
              key={opt.value}
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
              className={\`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors \${selectedValue === opt.value ? 'bg-purple-500/20 text-purple-400 font-bold' : 'hover:bg-white/5 text-white/60 font-medium'}\`}
            >
              {opt.color && trait === 'Backdrop' && <div className="w-4 h-4 rounded-full border border-white/10 shrink-0 shadow-inner shadow-black/50" style={{ backgroundColor: opt.color }} />}
              <span className="text-sm truncate">{opt.value}</span>
              {opt.rarityPercent !== undefined && (
                <span className={\`ml-auto text-[10px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider \${
                  opt.rarityPercent <= 2 ? 'bg-yellow-500/20 text-yellow-400' :
                  opt.rarityPercent <= 10 ? 'bg-purple-500/20 text-purple-400' :
                  opt.rarityPercent <= 30 ? 'bg-blue-500/20 text-blue-400' :
                  'bg-white/5 text-white/40'
                }\`}>
                  {opt.rarityPercent}%
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
`;

code = code.replace(/function FilterDropdown\(\{[\s\S]*?\}\s*\)\s*\{[\s\S]*?return \([\s\S]*?<\div>\s*\);\s*\}/, newFilterDropdown.trim());
fs.writeFileSync('src/components/Inventory.tsx', code);
