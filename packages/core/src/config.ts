import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';

export const CONFIG_DIR = join(homedir(), '.config', 'choochoo');

const CONFIG_FILE = 'config.json';
const SESSION_FILE = 'session.json';

export const CONFIG_PATH = join(CONFIG_DIR, CONFIG_FILE);
export const SESSION_PATH = join(CONFIG_DIR, SESSION_FILE);
export const DEFAULT_DOWNLOADS_DIR = join(CONFIG_DIR, 'downloads');

export interface Card {
  name: string;
  id: string;
}

export type TripOrder = 'asc' | 'desc';

export interface NsConfig {
  email: string;
  password: string;
  cards: Card[];
  /** Where PDF declarations are saved. Defaults to `~/.config/choochoo/downloads`. */
  downloadsDir?: string;
  /** Display order of trips in listings — 'asc' (oldest first, default) or 'desc' (NS's order, newest first). */
  tripOrder: TripOrder;
}

export interface ConfigOptions {
  email?: string;
  password?: string;
  downloadsDir?: string;
  tripOrder?: TripOrder;
}

const tryReadJson = (path: string): Record<string, unknown> | null => {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw err;
  }
};

const findConfig = (): Record<string, unknown> =>
  tryReadJson(resolve(process.cwd(), CONFIG_FILE)) ?? tryReadJson(CONFIG_PATH) ?? {};

export const loadConfig = (options: ConfigOptions = {}): NsConfig => {
  const cfg = findConfig();

  const email = options.email || process.env.NS_EMAIL || (cfg.email as string | undefined);
  const password = options.password || process.env.NS_PASSWORD || (cfg.password as string | undefined);

  if (!email || !password) {
    throw new Error(
      `NS credentials required. Set "email" and "password" in ${CONFIG_PATH}, ` +
        `or pass NS_EMAIL/NS_PASSWORD env vars.`,
    );
  }

  const rawCards = cfg.cards;
  if (rawCards !== undefined && !Array.isArray(rawCards)) {
    throw new Error('Config "cards" must be an array.');
  }
  const cards: Card[] = (rawCards ?? []).map((entry: unknown, index: number) => {
    if (!entry || typeof entry !== 'object') {
      throw new Error(`Card at index ${index} must be an object with "name" and "id".`);
    }
    const { name, id } = entry as { name?: unknown; id?: unknown };
    if (typeof name !== 'string' || name.length === 0) {
      throw new Error(`Card at index ${index} is missing required "name".`);
    }
    if (typeof id !== 'string' || id.length === 0) {
      throw new Error(`Card at index ${index} is missing required "id".`);
    }
    return { name, id };
  });
  const downloadsDir = options.downloadsDir || (cfg.downloadsDir as string | undefined);
  const rawOrder = options.tripOrder ?? (cfg.tripOrder as unknown);
  let tripOrder: TripOrder;
  if (rawOrder === undefined) {
    tripOrder = 'asc';
  } else if (rawOrder === 'asc' || rawOrder === 'desc') {
    tripOrder = rawOrder;
  } else {
    throw new Error(`Config "tripOrder" must be "asc" or "desc", got ${JSON.stringify(rawOrder)}.`);
  }

  return { email, password, cards, tripOrder, ...(downloadsDir ? { downloadsDir } : {}) };
};

export const chooseCard = (cards: Card[], name?: string): Card => {
  if (cards.length === 0) {
    throw new Error('No cards configured.');
  }

  if (name) {
    const card = cards.find((c) => c.name === name);
    if (!card) {
      throw new Error(`Card "${name}" not found. Available: ${cards.map((c) => c.name).join(', ')}`);
    }
    return card;
  }

  const first = cards[0];
  if (!first) {
    throw new Error('No cards configured.');
  }
  return first;
};

export interface WriteConfigResult {
  path: string;
  created: boolean;
}

/** Writes a config.json template to CONFIG_PATH. Returns `created: false` if the file already exists. */
export const writeConfigTemplate = (): WriteConfigResult => {
  if (existsSync(CONFIG_PATH)) {
    return { path: CONFIG_PATH, created: false };
  }
  const template: NsConfig = {
    email: '',
    password: '',
    cards: [{ name: 'personal', id: '' }],
    tripOrder: 'asc',
  };
  // 0700 dir + 0600 file — plaintext NS credentials and session cookies live
  // here; keep both owner-only so other users on the host can't traverse in.
  mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
  writeFileSync(CONFIG_PATH, `${JSON.stringify(template, null, 2)}\n`, { mode: 0o600 });
  return { path: CONFIG_PATH, created: true };
};
