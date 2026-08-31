const fs = require('fs');
let code = fs.readFileSync('src/lib/lottieExtractor.ts', 'utf8');

code = code.replace(
/        \/\/ Telegram Gift Layering Heuristics[\s\S]*?return true;/m,
`        // Telegram Gift Layering Heuristics
        if (trait === 'Model') {
          // Exact match for the 3D Model layer in Telegram Gifts (usually named "Gift")
          return name.includes('gift') || name === 'model';
        } else if (trait === 'Symbol') {
          // Exact match for the Symbol/Pattern overlay
          return name.includes('pattern') || name.includes('symbol');
        }
        return false;`
);

fs.writeFileSync('src/lib/lottieExtractor.ts', code);
