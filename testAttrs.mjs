async function check() {
  const res = await fetch("https://tonapi.io/v2/nfts/collections/0:36448ed7bc8b3dc0940aaf19136fb62da5e52e683fa9d1e4f9b817b86e47064f/items?limit=1");
  const data = await res.json();
  if (data.nft_items && data.nft_items[0]) {
    console.log(data.nft_items[0].metadata.attributes);
  }
}
check();
