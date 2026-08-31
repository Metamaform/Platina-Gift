const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/const COLLECTION_ADDRESS = collectionParam \|\| "EQCE80Aln8YfldnQLwWMvOfloLGgmPY0eGDJz9ufG3gRui3D";\s+const cacheKey =/g, 'const cacheKey =');

fs.writeFileSync('server.ts', code);
