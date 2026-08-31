const fs = require('fs');
let code = fs.readFileSync('src/components/Inventory.tsx', 'utf8');

code = code.replace(
  /import \{ Loader2, AlertCircle, Filter, X, Search, ChevronDown, Check \} from 'lucide-react';/,
  `import { Loader2, AlertCircle, Filter, X, Search, ChevronDown, Check, PackageOpen } from 'lucide-react';`
);

fs.writeFileSync('src/components/Inventory.tsx', code);
