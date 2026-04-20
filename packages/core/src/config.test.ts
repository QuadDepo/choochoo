import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('node:fs', async () => {
  const actual = await vi.importActual<typeof import('node:fs')>('node:fs');
  return {
    ...actual,
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    mkdirSync: vi.fn(),
    existsSync: vi.fn(),
  };
});

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { type Card, CONFIG_DIR, CONFIG_PATH, loadConfig, selectCard, writeConfigTemplate } from './config';

const enoent = (): never => {
  const err: NodeJS.ErrnoException = new Error('ENOENT');
  err.code = 'ENOENT';
  throw err;
};

beforeEach(() => {
  vi.mocked(readFileSync).mockImplementation(enoent);
  vi.mocked(existsSync).mockReturnValue(false);
  vi.mocked(writeFileSync).mockReset();
  vi.mocked(mkdirSync).mockReset();
  vi.unstubAllEnvs();
  vi.stubEnv('NS_EMAIL', '');
  vi.stubEnv('NS_PASSWORD', '');
});

describe('loadConfig', () => {
  it('uses options when provided (highest priority)', () => {
    const cfg = loadConfig({ email: 'opt@b.com', password: 'optpw' });
    expect(cfg.email).toBe('opt@b.com');
    expect(cfg.password).toBe('optpw');
  });

  it('falls back to env vars when options missing', () => {
    vi.stubEnv('NS_EMAIL', 'env@b.com');
    vi.stubEnv('NS_PASSWORD', 'envpw');
    const cfg = loadConfig();
    expect(cfg.email).toBe('env@b.com');
    expect(cfg.password).toBe('envpw');
  });

  it('throws when no credentials found anywhere', () => {
    expect(() => loadConfig()).toThrow(/credentials required/);
  });

  it('returns empty cards when config file has none', () => {
    const cfg = loadConfig({ email: 'a', password: 'b' });
    expect(cfg.cards).toEqual([]);
  });

  it('parses cards from a config file', () => {
    vi.mocked(readFileSync).mockReturnValue(JSON.stringify({ cards: [{ name: 'personal', id: 'uuid-1' }] }));
    const cfg = loadConfig({ email: 'a', password: 'b' });
    expect(cfg.cards).toEqual([{ name: 'personal', id: 'uuid-1' }]);
  });

  it('leaves downloadsDir undefined when not set', () => {
    const cfg = loadConfig({ email: 'a', password: 'b' });
    expect(cfg.downloadsDir).toBeUndefined();
  });

  it('reads downloadsDir from the config file', () => {
    vi.mocked(readFileSync).mockReturnValue(JSON.stringify({ downloadsDir: '/custom/pdfs' }));
    const cfg = loadConfig({ email: 'a', password: 'b' });
    expect(cfg.downloadsDir).toBe('/custom/pdfs');
  });

  it('prefers options.downloadsDir over config file', () => {
    vi.mocked(readFileSync).mockReturnValue(JSON.stringify({ downloadsDir: '/from/file' }));
    const cfg = loadConfig({ email: 'a', password: 'b', downloadsDir: '/from/options' });
    expect(cfg.downloadsDir).toBe('/from/options');
  });
});

describe('selectCard', () => {
  const cards: Card[] = [
    { name: 'personal', id: 'uuid-1' },
    { name: 'work', id: 'uuid-2' },
  ];

  it('returns the first card as the implicit default', () => {
    expect(selectCard(cards).name).toBe('personal');
  });

  it('finds a card by name', () => {
    expect(selectCard(cards, 'work').id).toBe('uuid-2');
  });

  it('throws when no cards are configured', () => {
    expect(() => selectCard([])).toThrow(/No cards configured/);
  });

  it('throws when named card is not found, listing available names', () => {
    expect(() => selectCard(cards, 'missing')).toThrow(/Card "missing" not found\. Available: personal, work/);
  });
});

describe('writeConfigTemplate', () => {
  it('creates a template config when none exists', () => {
    vi.mocked(existsSync).mockReturnValue(false);

    const result = writeConfigTemplate();

    expect(result).toEqual({ path: CONFIG_PATH, created: true });
    expect(mkdirSync).toHaveBeenCalledWith(CONFIG_DIR, { recursive: true });
    expect(writeFileSync).toHaveBeenCalledTimes(1);
    const [writtenPath, body] = vi.mocked(writeFileSync).mock.calls[0]!;
    expect(writtenPath).toBe(CONFIG_PATH);
    const parsed = JSON.parse(body as string);
    expect(parsed).toEqual({
      email: '',
      password: '',
      cards: [{ name: 'personal', id: '' }],
    });
  });

  it('does not overwrite when the config already exists', () => {
    vi.mocked(existsSync).mockReturnValue(true);

    const result = writeConfigTemplate();

    expect(result).toEqual({ path: CONFIG_PATH, created: false });
    expect(writeFileSync).not.toHaveBeenCalled();
    expect(mkdirSync).not.toHaveBeenCalled();
  });
});
