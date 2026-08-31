import fs from 'fs';
import path from 'path';

/**
 * Простое файловое хранилище (JSON на диске) — заменяет localStorage,
 * который был привязан к браузеру, а не к реальному Telegram-юзеру.
 *
 * Этого достаточно для одного сервера/демо. Если будет второй инстанс
 * сервера (масштабирование) или важна надёжность при падениях —
 * замени на настоящую БД (Postgres/SQLite), интерфейс функций ниже
 * можно оставить тем же.
 */

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const OPENS_FILE = path.join(DATA_DIR, 'opens.json');
const MAX_OPENS = 200;
const STARTING_BALANCE = 1100; // 100 стартовый баланс + 1000 бонус, как было раньше в localStorage-версии

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJson<T>(file: string, fallback: T): T {
  try {
    ensureDataDir();
    if (!fs.existsSync(file)) return fallback;
    const raw = fs.readFileSync(file, 'utf-8').trim();
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch (e) {
    console.error(`[store] не смог прочитать ${file}:`, e);
    return fallback;
  }
}

function writeJson(file: string, data: unknown) {
  ensureDataDir();
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

export interface StoredUser {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
  balance: number;
  inventory: any[];
  createdAt: string;
  updatedAt: string;
}

let usersCache: Record<string, StoredUser> | null = null;
function users(): Record<string, StoredUser> {
  if (!usersCache) usersCache = readJson<Record<string, StoredUser>>(USERS_FILE, {});
  return usersCache;
}

export function getUser(id: number): StoredUser | null {
  return users()[String(id)] || null;
}

export function upsertUserProfile(profile: {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}): StoredUser {
  const all = users();
  const key = String(profile.id);
  const existing = all[key];
  const now = new Date().toISOString();

  const user: StoredUser = existing
    ? {
        ...existing,
        firstName: profile.first_name,
        lastName: profile.last_name,
        username: profile.username,
        photoUrl: profile.photo_url,
        updatedAt: now,
      }
    : {
        id: profile.id,
        firstName: profile.first_name,
        lastName: profile.last_name,
        username: profile.username,
        photoUrl: profile.photo_url,
        balance: STARTING_BALANCE,
        inventory: [],
        createdAt: now,
        updatedAt: now,
      };

  all[key] = user;
  writeJson(USERS_FILE, all);
  return user;
}

export function saveUserState(id: number, balance: number, inventory: any[]): StoredUser | null {
  const all = users();
  const key = String(id);
  const existing = all[key];
  if (!existing) return null;
  existing.balance = balance;
  existing.inventory = inventory;
  existing.updatedAt = new Date().toISOString();
  all[key] = existing;
  writeJson(USERS_FILE, all);
  return existing;
}

export interface OpenEvent {
  id: string;
  ts: string;
  firstName: string;
  gift: { name: string; image_url?: string; slug?: string };
  price: number;
}

let opensCache: OpenEvent[] | null = null;
function opens(): OpenEvent[] {
  if (!opensCache) opensCache = readJson<OpenEvent[]>(OPENS_FILE, []);
  return opensCache;
}

export function recordOpen(event: OpenEvent) {
  const list = opens();
  list.unshift(event);
  if (list.length > MAX_OPENS) list.length = MAX_OPENS;
  writeJson(OPENS_FILE, list);
}

export function getRecentOpens(limit = 20): OpenEvent[] {
  return opens().slice(0, limit);
}
