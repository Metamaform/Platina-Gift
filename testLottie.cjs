const fs = require('fs');
fetch('https://raw.githubusercontent.com/TelegramMessenger/Telegram-iOS/master/Telegram-iOS/Resources/Telegram.xcassets/Stickers/TGSticker/TGSticker_1.dataset/TGSticker_1.json')
.then(res => res.json())
.then(data => {
  if (data.layers) {
    console.log(data.layers.map(l => l.nm));
  }
}).catch(console.error);
