const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Import LiveModelFeed
code = code.replace(
  /import \{ Hub \} from '\.\/components\/Hub';/,
  `import { Hub } from './components/Hub';\nimport { LiveModelFeed } from './components/LiveModelFeed';`
);

// 2. Remove LIVE_DROPS
code = code.replace(
  /const LIVE_DROPS = \[[\s\S]*?\];/,
  ``
);

// 3. Replace the old Marquee with LiveModelFeed
code = code.replace(
  /\{\/\* Live Drop Feed Marquee \*\/\}[\s\S]*?<\/div>/,
  `<LiveModelFeed />`
);

fs.writeFileSync('src/App.tsx', code);
