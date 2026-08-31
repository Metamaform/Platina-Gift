/**
 * Парсинг флор-цены подарка со страницы fragment.com/gifts/<slug>.
 *
 * Это публичная страница без авторизации (в отличие от Tonnel/Portals) —
 * ровно то, чем занимаются известные опенсорс-скрейперы Fragment (например
 * apify.com/apipi/ton-fragment-scraper): собирают то, что и так видно любому
 * посетителю сайта, без логина и без приватных эндпоинтов чужого Mini App.
 *
 * ВАЖНО: у меня в песочнице нет сетевого доступа, чтобы отрендерить живую
 * страницу fragment.com и подобрать точные CSS-селекторы. Ниже — рабочий,
 * но best-effort парсинг по паттерну "число + TON" в HTML. Если разметка
 * Fragment окажется другой (SSR-таблица с другими классами и т.п.).
 * — проверь фактический HTML (curl -A "Mozilla/5.0" https://fragment.com/gifts/<slug>)
 * и поправь регулярку/логику ниже под него.
 */

export interface FragmentGiftPrice {
  slug: string;
  floorPriceTon: number | null;
  currency: 'TON';
  sourceUrl: string;
  fetchedAt: string;
}

interface CacheEntry {
  data: FragmentGiftPrice;
  expires: number;
}

const cache = new Map<string, CacheEntry>();
const TTL_MS = 10 * 60 * 1000; // 10 минут — не долбим Fragment на каждый рендер

export async function getFragmentGiftPrice(slug: string): Promise<FragmentGiftPrice> {
  const cached = cache.get(slug);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }

  const url = `https://fragment.com/gifts/${encodeURIComponent(slug)}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
      Accept: 'text/html',
    },
  });

  if (!res.ok) {
    throw new Error(`Fragment вернул ${res.status} для /gifts/${slug}`);
  }

  const html = await res.text();

  const priceMatches = [...html.matchAll(/([\d][\d\s.,]{0,12})\s*TON\b/gi)]
    .map((m) => parseFloat(m[1].replace(/\s/g, '').replace(',', '.')))
    .filter((n) => Number.isFinite(n) && n > 0);

  const floorPriceTon = priceMatches.length > 0 ? Math.min(...priceMatches) : null;

  const data: FragmentGiftPrice = {
    slug,
    floorPriceTon,
    currency: 'TON',
    sourceUrl: url,
    fetchedAt: new Date().toISOString(),
  };

  cache.set(slug, { data, expires: Date.now() + TTL_MS });
  return data;
}

export async function getFragmentGiftPrices(slugs: string[]): Promise<FragmentGiftPrice[]> {
  const results: FragmentGiftPrice[] = [];
  for (const slug of slugs) {
    try {
      results.push(await getFragmentGiftPrice(slug));
    } catch (e: any) {
      results.push({
        slug,
        floorPriceTon: null,
        currency: 'TON',
        sourceUrl: `https://fragment.com/gifts/${slug}`,
        fetchedAt: new Date().toISOString(),
      });
      console.error(`[fragment] ${slug}:`, e?.message || e);
    }
  }
  return results;
}
