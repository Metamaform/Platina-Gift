const fs = require('fs');
let code = fs.readFileSync('src/components/Inventory.tsx', 'utf8');

code = code.replace(
  /\{filteredItems\.slice\(0, visibleCount\)\.map\(\(item\) => \(\s*\{\(\(\) => \{/g,
  `{filteredItems.slice(0, visibleCount).map((item) => {`
);

code = code.replace(
  /\}\)\(\)\}\s*\)\)\}/g,
  `})}`
);

fs.writeFileSync('src/components/Inventory.tsx', code);
