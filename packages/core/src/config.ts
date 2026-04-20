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

  const cards = (cfg.cards as Card[] | undefined) ?? [];
  const downloadsDir = options.downloadsDir || (cfg.downloadsDir as string | undefined);
  const rawOrder = options.tripOrder ?? (cfg.tripOrder as unknown);
  const tripOrder: TripOrder = rawOrder === 'desc' ? 'desc' : 'asc';

  return { email, password, cards, tripOrder, ...(downloadsDir ? { downloadsDir } : {}) };
};

export const selectCard = (cards: Card[], name?: string): Card => {
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

  return cards[0]!;
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
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_PATH, `${JSON.stringify(template, null, 2)}\n`);
  return { path: CONFIG_PATH, created: true };
};
