const fs = require('fs');
let code = fs.readFileSync('src/components/Inventory.tsx', 'utf8');

// find the exact line and replace it
code = code.replace(
  /<GiftCard key=\{item.address\} item=\{item\} \/>/g,
  `{(() => {
                    let minRarity = 100;
                    item.metadata.attributes?.forEach(attr => {
                      const r = attributesMap[attr.trait_type]?.get(attr.value)?.rarityPercent;
                      if (r !== undefined && r < minRarity) minRarity = r;
                    });
                    if (minRarity === 100) minRarity = 50; // default if no attributes
                    return <GiftCard key={item.address} item={item} rarityPercent={minRarity} />;
                  })()}`
);

fs.writeFileSync('src/components/Inventory.tsx', code);
