const fs = require('fs');
let code = fs.readFileSync('src/components/Hub.tsx', 'utf8');

code = code.replace(
  /import \{ PackageOpen, Target, Dices, ArrowUpCircle, Flame \} from 'lucide-react';/,
  `import { PackageOpen, Target, Dices, ArrowUpCircle, Flame, Gem } from 'lucide-react';`
);

fs.writeFileSync('src/components/Hub.tsx', code);
