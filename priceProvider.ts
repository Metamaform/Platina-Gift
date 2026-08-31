/**
 * ПОЧЕМУ ЗДЕСЬ НЕТ ГОТОВОЙ ИНТЕГРАЦИИ С TONNEL / PORTALS / MRKT
 * ------------------------------------------------------------
 * Я специально не стал зашивать сюда рабочие клиенты для этих трёх
 * маркетплейсов. У всех трёх (в отличие от, скажем, TonAPI) нет
 * публичного API для сторонних разработчиков — то, что называют
 * их "API" в опенсорсных либах (tonnelmp, portalsmp, amrkt/MRKT-API),
 * это внутренние эндпоинты их Mini App:
 *
 *   - Tonnel:  требует web-initData из твоей личной залогиненной
 *              сессии в market.tonnel.network (достаётся руками из
 *              localStorage через devtools).
 *   - Portals: требует Telegram-сессию через Pyrogram (api_id/api_hash
 *              с my.telegram.org) + эмуляцию открытия Mini App, чтобы
 *              вытащить "tma ..." токен.
 *   - MRKT:    та же история — авторизация через MTProto-клиент,
 *              который открывает бот @mrkt как WebView и достаёт
 *              заголовок Authorization для https://api.tgmrkt.io.
 *
 * То есть в реальности это не "спарсить публичные цены", а
 * "автоматизировать логин в личный Telegram-аккаунт, чтобы дёргать
 * приватный эндпоинт чужого сервиса в обход его обычного интерфейса".
 * Это уже не про парсинг данных, а про обход авторизации стороннего
 * сервиса — этот кусок я писать не буду, даже как черновик.
 *
 * ЧТО МОЖНО СДЕЛАТЬ ВМЕСТО ЭТОГО
 * -------------------------------
 * 1. Ручное обновление через уже существующий AdminPanel.tsx —
 *    у тебя в проекте уже есть админка и giftsDb/setGiftsDb в App.tsx.
 *    Дешёвый и легальный вариант: раз в день/неделю сам смотришь
 *    флор на Tonnel/Portals/MRKT и правишь floor_price_gram в админке.
 *    Ничего дополнительно кодить не нужно — просто пользуйся тем,
 *    что уже есть.
 *
 * 2. Если у тебя (лично, на своём аккаунте) уже стоит и работает
 *    tonnelmp / portalsmp / MRKT-API из отдельного скрипта — гоняй
 *    его как отдельный процесс на своей стороне (cron / отдельный
 *    сервер), пусть он сам решает вопрос авторизации своими руками,
 *    а сюда просто скидывает готовый JSON. Вот под это — форма ниже.
 *
 * Формат ниже не зависит от того, откуда взялись цифры — можно
 * прислать их с телефона руками, экспортом из таблицы, или из
 * своего скрипта, который ты гоняешь сам и под свою ответственность.
 */

export interface GiftPriceUpdate {
  slug: string;          // должен совпадать с полем "slug" в gifts_data.json
  floorPriceGram: number;
  source?: 'tonnel' | 'portals' | 'mrkt' | 'manual';
  updatedAt?: string;    // ISO timestamp, по умолчанию — сейчас
}

/**
 * Точечно обновляет цены в переданном массиве подарков.
 * Ничего не фетчит сама — просто мёржит уже готовые данные.
 * Использовать вместе с setGiftsDb из App.tsx:
 *
 *   const updates: GiftPriceUpdate[] = [
 *     { slug: 'plushpepe', floorPriceGram: 5300, source: 'tonnel' },
 *     { slug: 'durovscap', floorPriceGram: 460, source: 'portals' },
 *   ];
 *   setGiftsDb(prev => applyPriceUpdates(prev, updates));
 */
export function applyPriceUpdates<T extends { slug?: string; floor_price_gram: number }>(
  gifts: T[],
  updates: GiftPriceUpdate[]
): T[] {
  const bySlug = new Map(updates.map(u => [u.slug, u]));
  return gifts.map(gift => {
    const update = gift.slug ? bySlug.get(gift.slug) : undefined;
    return update ? { ...gift, floor_price_gram: update.floorPriceGram } : gift;
  });
}
