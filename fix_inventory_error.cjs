const fs = require('fs');
let code = fs.readFileSync('src/components/Inventory.tsx', 'utf8');

code = code.replace(
  /try \{\s+data = await fetchTelegramGifts\(LIMIT, currentOffset, selectedCollection\);\s+\} catch \(fetchErr\) \{\s+break;\s+\}/g,
  `try {
            data = await fetchTelegramGifts(LIMIT, currentOffset, selectedCollection);
          } catch (fetchErr: any) {
            if (currentOffset === 0) throw fetchErr; // Fail completely if first page fails
            break; // Otherwise just stop loading more
          }`
);

fs.writeFileSync('src/components/Inventory.tsx', code);
