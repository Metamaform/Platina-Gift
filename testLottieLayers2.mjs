async function check() {
  const collections = [
    "0:c845e95e3a44f1083e20fd7126f318f42d8360ebecccb13180030080faf11b90",
    "0:b01057d46db47edb67e7dd583152906297b6f0050a841e6ef081061b598f5cd3"
  ];
  for (const c of collections) {
      console.log("Collection:", c);
      const res = await fetch(`https://tonapi.io/v2/nfts/collections/${c}/items?limit=1`);
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
}
check();
