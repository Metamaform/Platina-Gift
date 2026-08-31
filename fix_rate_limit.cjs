const fs = require('fs');
let code = fs.readFileSync('src/components/Inventory.tsx', 'utf8');

// We will add a delay utility at the top
const delayUtility = `
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
`;
code = code.replace(/import \{ Loader2, AlertCircle, Filter, X \} from 'lucide-react';/, delayUtility + "\nimport { Loader2, AlertCircle, Filter, X } from 'lucide-react';");

code = code.replace(
  /while\(!allFetched && mounted\) \{[\s\S]*?const data = await fetchTelegramGifts\(1000, currentOffset, selectedCollection\);/,
  `while(!allFetched && mounted) {
          if (currentOffset > 0) {
            await delay(1000); // 1 second delay between batch requests to avoid rate limits
          }
          
          let data;
          try {
            data = await fetchTelegramGifts(1000, currentOffset, selectedCollection);
          } catch (fetchErr: any) {
            if (currentOffset > 0 && fetchErr.message.includes('Rate limit')) {
              // If we already loaded some, just stop background loading and retry in a bit or stop
              console.warn("Rate limit hit during progressive load. Stopping background fetch.");
              break;
            }
            throw fetchErr;
          }`
);

fs.writeFileSync('src/components/Inventory.tsx', code);
