async function check() {
  const res = await fetch("https://tonapi.io/v2/nfts/collections/0:36448ed7bc8b3dc0940aaf19136fb62da5e52e683fa9d1e4f9b817b86e47064f/items?limit=1");
  const data = await res.json();
  if (data.nft_items && data.nft_items[0]) {
    const item = data.nft_items[0];
    const lottieUrl = item.metadata.lottie || item.metadata.lottie_url || item.metadata.attributes?.find(a => a.trait_type === 'Lottie')?.value;
    console.log("Lottie URL:", lottieUrl);
    
    if (lottieUrl) {
      const lRes = await fetch(lottieUrl);
      const lData = await lRes.json();
      console.log("Layers:");
      if (lData.layers) {
         lData.layers.forEach(l => {
           console.log(`- nm: ${l.nm}, ty: ${l.ty}`);
         });
      }
    }
  }
}
check();
