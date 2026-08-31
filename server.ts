import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { verifyTelegramInitData, TelegramAuthError } from "./src/lib/telegramAuth.server";
import { issueToken, verifyToken } from "./src/lib/session.server";
import { getUser, upsertUserProfile, saveUserState, recordOpen, getRecentOpens } from "./src/lib/store.server";
import { getFragmentGiftPrices } from "./src/lib/fragmentPrices.server";
import defaultGiftsDb from "./src/gifts_data.json";

async function startServer() {
  const app = express();
  app.use(express.json());

  const cache = new Map();
  const CACHE_TTL = 60 * 1000 * 5; // 5 minutes

  const PORT = 3000;

  // ---------------------------------------------------------------------
  // Telegram auth
  // ---------------------------------------------------------------------

  app.post("/api/auth/telegram", (req, res) => {
    try {
      const { initData } = req.body || {};
      const botToken = process.env.TELEGRAM_BOT_TOKEN || "";
      const tgUser = verifyTelegramInitData(initData, botToken);
      const user = upsertUserProfile(tgUser);
      const token = issueToken(user.id);
      res.json({
        token,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          photoUrl: user.photoUrl,
        },
        balance: user.balance,
        inventory: user.inventory,
      });
    } catch (e: any) {
      const message = e instanceof TelegramAuthError ? e.message : "Ошибка авторизации";
      res.status(401).json({ error: message });
    }
  });

  // Достаёт userId из Authorization: Bearer <token>, кладёт в req.userId
  function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    const userId = token ? verifyToken(token) : null;
    if (!userId) {
      res.status(401).json({ error: "Не авторизован — открой приложение через Telegram" });
      return;
    }
    (req as any).userId = userId;
    next();
  }

  app.get("/api/me", requireAuth, (req, res) => {
    const userId = (req as any).userId as number;
    const user = getUser(userId);
    if (!user) {
      res.status(404).json({ error: "Пользователь не найден" });
      return;
    }
    res.json({
      user: { id: user.id, firstName: user.firstName, lastName: user.lastName, username: user.username, photoUrl: user.photoUrl },
      balance: user.balance,
      inventory: user.inventory,
    });
  });

  // Синхронизация состояния (баланс/инвентарь) — источник правды теперь сервер,
  // а не localStorage. Клиент шлёт сюда своё состояние после каждого значимого
  // изменения (дебаунсом), чтобы оно было привязано к реальному Telegram-юзеру.
  app.post("/api/state", requireAuth, (req, res) => {
    const userId = (req as any).userId as number;
    const { balance, inventory } = req.body || {};
    if (typeof balance !== "number" || !Array.isArray(inventory)) {
      res.status(400).json({ error: "Ожидаются balance:number и inventory:array" });
      return;
    }
    const updated = saveUserState(userId, balance, inventory);
    if (!updated) {
      res.status(404).json({ error: "Пользователь не найден" });
      return;
    }
    res.json({ ok: true });
  });

  // ---------------------------------------------------------------------
  // Реальные открытия (Live Drop) — только настоящие события от юзеров,
  // никакого рандомного фейка.
  // ---------------------------------------------------------------------

  app.post("/api/opens", requireAuth, (req, res) => {
    const userId = (req as any).userId as number;
    const user = getUser(userId);
    if (!user) {
      res.status(404).json({ error: "Пользователь не найден" });
      return;
    }
    const { gift, price } = req.body || {};
    if (!gift || typeof gift.name !== "string" || typeof price !== "number") {
      res.status(400).json({ error: "Ожидаются gift:{name,...} и price:number" });
      return;
    }
    recordOpen({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ts: new Date().toISOString(),
      firstName: user.firstName || "Игрок",
      gift: { name: gift.name, image_url: gift.image_url, slug: gift.slug },
      price,
    });
    res.json({ ok: true });
  });

  // Публичный — лента реальных открытий видна всем, как и раньше,
  // но теперь это не рандом, а факты.
  app.get("/api/opens/recent", (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    res.json(getRecentOpens(limit));
  });

  // ---------------------------------------------------------------------
  // Реальные цены с Fragment (публичные страницы, без авторизации)
  // ---------------------------------------------------------------------

  app.get("/api/fragment/prices", async (req, res) => {
    try {
      const slugs = (defaultGiftsDb as any[]).map((g) => g.slug).filter(Boolean);
      const prices = await getFragmentGiftPrices(slugs);
      res.json(prices);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "Fragment scrape failed" });
    }
  });

  app.get("/api/fragment/prices/:slug", async (req, res) => {
    try {
      const [price] = await getFragmentGiftPrices([req.params.slug]);
      res.json(price);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "Fragment scrape failed" });
    }
  });

  // ---------------------------------------------------------------------
  // TonAPI — публичные ончейн-данные коллекций (номер, атрибуты, редкость)
  // ---------------------------------------------------------------------

  app.get("/api/gifts", async (req, res) => {
    try {
      const limit = req.query.limit || 50;
      const offset = req.query.offset || 0;
      const collectionParam = req.query.collection as string;
      const cacheKey = `${collectionParam}-${limit}-${offset}`;
      const now = Date.now();
      if (cache.has(cacheKey)) {
        const cached = cache.get(cacheKey);
        if (now - cached.timestamp < CACHE_TTL) {
          return res.json(cached.data);
        }
      }

      const COLLECTION_ADDRESS = collectionParam || "EQCE80Aln8YfldnQLwWMvOfloLGgmPY0eGDJz9ufG3gRui3D";
      const TONAPI_URL = `https://tonapi.io/v2/nfts/collections/${COLLECTION_ADDRESS}/items`;
      let response = await fetch(`${TONAPI_URL}?limit=${limit}&offset=${offset}`);

      let retries = 0;
      while (response.status === 429 && retries < 3) {
        retries++;
        console.log(`Rate limited by TonAPI. Retrying in ${retries} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, retries * 1000));
        response = await fetch(`${TONAPI_URL}?limit=${limit}&offset=${offset}`);
      }

      if (!response.ok) {
        return res.status(response.status).json({ error: response.statusText });
      }

      const data = await response.json();
      cache.set(cacheKey, { timestamp: now, data });
      res.json(data);
    } catch (error: any) {
      console.error("Proxy error:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      console.warn("[auth] TELEGRAM_BOT_TOKEN не задан — авторизация через Telegram будет всегда отклоняться.");
    }
  });
}

startServer();
