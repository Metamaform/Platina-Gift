import { useEffect, useState, useCallback } from 'react';

/**
 * Реальная авторизация через Telegram Mini App.
 *
 * Важно: используем `window.Telegram.WebApp.initData` (сырую подписанную
 * строку), а не `initDataUnsafe` — последнюю можно подделать в devtools,
 * т.к. это просто распарсенный querystring без проверки подписи.
 * initData уходит на сервер и проверяется там через HMAC с бот-токеном
 * (см. src/lib/telegramAuth.server.ts). Только после этого юзер считается
 * настоящим.
 *
 * Если initData пустой — значит приложение открыто не из Telegram
 * (обычный браузер и т.п.), и авторизоваться по-настоящему нельзя.
 */

export interface AuthUser {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
}

interface AuthState {
  status: 'loading' | 'ready' | 'error' | 'no_telegram';
  token: string | null;
  user: AuthUser | null;
  balance: number;
  inventory: any[];
  error: string | null;
}

const TOKEN_KEY = 'pg_session_token';

export function useTelegramAuth() {
  const [state, setState] = useState<AuthState>({
    status: 'loading',
    token: sessionStorage.getItem(TOKEN_KEY),
    user: null,
    balance: 0,
    inventory: [],
    error: null,
  });

  useEffect(() => {
    // @ts-ignore
    const tg = window.Telegram?.WebApp;

    if (!tg?.initData) {
      setState((s) => ({ ...s, status: 'no_telegram', error: 'Открой приложение через Telegram-бота' }));
      return;
    }

    tg.ready?.();
    tg.expand?.();

    fetch('/api/auth/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData: tg.initData }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Ошибка авторизации');
        sessionStorage.setItem(TOKEN_KEY, data.token);
        setState({
          status: 'ready',
          token: data.token,
          user: data.user,
          balance: data.balance,
          inventory: data.inventory,
          error: null,
        });
      })
      .catch((e) => {
        setState((s) => ({ ...s, status: 'error', error: e.message }));
      });
  }, []);

  // Дебаунс-синхронизация состояния на сервер, привязанного к реальному userId
  const syncState = useCallback(
    (balance: number, inventory: any[]) => {
      if (!state.token) return;
      fetch('/api/state', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${state.token}`,
        },
        body: JSON.stringify({ balance, inventory }),
      }).catch(() => {
        // тихо игнорируем сетевые сбои синка — локальное состояние остаётся источником для UI
      });
    },
    [state.token]
  );

  // Запись реального открытия (для Live Drop) — вызывается в момент, когда
  // юзер реально выигрывает NFT (см. CrashGame/Upgrade onWin), а не рандомно.
  const recordOpen = useCallback(
    (gift: { name: string; image_url?: string; slug?: string }, price: number) => {
      if (!state.token) return;
      fetch('/api/opens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${state.token}`,
        },
        body: JSON.stringify({ gift, price }),
      }).catch(() => {});
    },
    [state.token]
  );

  return { ...state, syncState, recordOpen };
}
