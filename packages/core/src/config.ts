import { readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { homedir } from 'node:os';

export const CONFIG_DIR = join(homedir(), '.config', 'choochoo');
export const CONFIG_FILE = 'config.json';

export interface NsConfig {
  email: string;
  password: string;
}

export interface ConfigOptions {
  email?: string;
  password?: string;
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
  tryReadJson(resolve(process.cwd(), CONFIG_FILE))
  ?? tryReadJson(join(CONFIG_DIR, CONFIG_FILE))
  ?? {};

export const loadConfig = (options: ConfigOptions = {}): NsConfig => {
  const cfg = findConfig();

  const email = options.email || process.env.NS_EMAIL || (cfg.email as string | undefined);
  const password = options.password || process.env.NS_PASSWORD || (cfg.password as string | undefined);

  if (!email || !password) {
    throw new Error(
      `NS credentials required. Set "email" and "password" in ${join(CONFIG_DIR, CONFIG_FILE)}, ` +
      `or pass NS_EMAIL/NS_PASSWORD env vars.`
    );
  }

  return { email, password };
};
