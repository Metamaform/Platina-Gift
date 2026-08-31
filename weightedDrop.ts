/**
 * Взвешенный выбор подарка для live-фида.
 *
 * Идея: вес подарка обратно пропорционален его цене в степени alpha.
 *   weight_i = 1 / (price_i ^ alpha)
 *
 * alpha управляет "крутизной" редкости:
 *   alpha = 0   -> все подарки равновероятны (цена не влияет)
 *   alpha = 0.5 -> мягкое затухание
 *   alpha = 1   -> вес прямо обратен цене
 *   alpha > 1   -> резкое затухание, дорогие вещи почти не выпадают
 *
 * Рекомендуемый диапазон: 0.5–0.8.
 */

export interface PricedItem {
  price: number;
  [key: string]: any;
}

interface WeightedDropOptions {
  alpha?: number;
  minPrice?: number;
}

export function buildWeightedTable<T extends PricedItem>(
  items: T[],
  { alpha = 0.6, minPrice = 1 }: WeightedDropOptions = {}
) {
  const withWeights = items.map((item) => {
    const safePrice = Math.max(item.price ?? minPrice, minPrice);
    const weight = 1 / Math.pow(safePrice, alpha);
    return { item, weight };
  });

  let cumulative = 0;
  const table = withWeights.map(({ item, weight }) => {
    cumulative += weight;
    return { item, weight, cumulative };
  });

  return { table, totalWeight: cumulative };
}

export function pickWeighted<T extends PricedItem>(
  table: { item: T; weight: number; cumulative: number }[],
  totalWeight: number
): T {
  const r = Math.random() * totalWeight;

  let lo = 0;
  let hi = table.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (table[mid].cumulative < r) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  return table[lo].item;
}

export function pickWeightedByPrice<T extends PricedItem>(
  items: T[],
  options?: WeightedDropOptions
): T {
  const { table, totalWeight } = buildWeightedTable(items, options);
  return pickWeighted(table, totalWeight);
}
