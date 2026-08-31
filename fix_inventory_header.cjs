const fs = require('fs');
let code = fs.readFileSync('src/components/Inventory.tsx', 'utf8');

code = code.replace(
  /<header className="flex flex-col md:flex-row md:items-end justify-between gap-4">[\s\S]*?<\/header>/,
  `<header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
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
      </header>`
);

// ALSO FIX THE COLLECTION SELECTOR STYLING TO BE GAMBLING-LIKE
code = code.replace(
  /className=\{\`shrink-0 px-5 py-2.5 rounded-xl text-sm font-medium transition-all \$\{[\s\S]*?\`\}/,
  `className={\`shrink-0 px-6 py-3 rounded-xl text-sm font-black uppercase italic tracking-wider transition-all \${
    selectedCollection === collection.address
      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(124,58,237,0.4)] border border-purple-500/50'
      : 'bg-[#13151C] text-white/40 hover:bg-[#1A1D27] hover:text-white/80 border border-white/5'
  }\`}`
);

fs.writeFileSync('src/components/Inventory.tsx', code);
