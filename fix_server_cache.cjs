const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

if (!code.includes('const cache = new Map();')) {
  code = code.replace('const app = express();', `const app = express();\n\nconst cache = new Map();\nconst CACHE_TTL = 60 * 1000 * 5; // 5 minutes\n`);
  
  code = code.replace(
    /const TONAPI_URL = [^]+?const response = await fetch\(`\${TONAPI_URL}\?limit=\${limit}&offset=\${offset}`\);/,
    `const cacheKey = \`\${collectionParam}-\${limit}-\${offset}\`;
      const now = Date.now();
      if (cache.has(cacheKey)) {
        const cached = cache.get(cacheKey);
        if (now - cached.timestamp < CACHE_TTL) {
          return res.json(cached.data);
        }
      }

      const COLLECTION_ADDRESS = collectionParam || "EQCE80Aln8YfldnQLwWMvOfloLGgmPY0eGDJz9ufG3gRui3D";
      const TONAPI_URL = \`https://tonapi.io/v2/nfts/collections/\${COLLECTION_ADDRESS}/items\`;
      const response = await fetch(\`\${TONAPI_URL}?limit=\${limit}&offset=\${offset}\`);`
  );
  
  code = code.replace(
    /const data = await response\.json\(\);\s+res\.json\(data\);/,
    `const data = await response.json();
      cache.set(cacheKey, { timestamp: now, data });
      res.json(data);`
  );
  
  fs.writeFileSync('server.ts', code);
}
