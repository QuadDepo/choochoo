import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('node:fs', async () => {
  const actual = await vi.importActual<typeof import('node:fs')>('node:fs');
  return { ...actual, readFileSync: vi.fn() };
});

import { readFileSync } from 'node:fs';
import { loadConfig, selectCard, type Card } from './config';

const enoent = (): never => {
  const err: NodeJS.ErrnoException = new Error('ENOENT');
  err.code = 'ENOENT';
  throw err;
};

beforeEach(() => {
  vi.mocked(readFileSync).mockImplementation(enoent);
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
    vi.mocked(readFileSync).mockReturnValue(
      JSON.stringify({ cards: [{ name: 'personal', id: 'uuid-1' }] }),
    );
    const cfg = loadConfig({ email: 'a', password: 'b' });
    expect(cfg.cards).toEqual([{ name: 'personal', id: 'uuid-1' }]);
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
    expect(() => selectCard(cards, 'missing')).toThrow(
      /Card "missing" not found\. Available: personal, work/,
    );
  });
});
