const fetch = require('node-fetch');

async function check() {
  const res = await fetch("https://nft.fragment.com/gift/v1/getGiftBoxItems?limit=1&offset=0&collection=0:36448ed7bc8b3dc0940aaf19136fb62da5e52e683fa9d1e4f9b817b86e47064f");
  const data = await res.json();
  if (data.items && data.items[0]) {
    const item = data.items[0];
    const lottieUrl = item.metadata.lottie || item.metadata.lottie_url;
    console.log("Lottie URL:", lottieUrl);
    
    if (lottieUrl) {
      const lRes = await fetch(lottieUrl);
      const lData = await lRes.json();
      console.log("Layers:");
      if (lData.layers) {
         lData.layers.forEach(l => {
           console.log(`- ${l.nm} (ind: ${l.ind}, refId: ${l.refId})`);
         });
      }
    }
  }
}
check();
