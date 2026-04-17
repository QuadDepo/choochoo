import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('node:fs', async () => {
  const actual = await vi.importActual<typeof import('node:fs')>('node:fs');
  return { ...actual, existsSync: vi.fn() };
});
vi.mock('node:child_process', async () => {
  const actual = await vi.importActual<typeof import('node:child_process')>('node:child_process');
  return { ...actual, execSync: vi.fn() };
});

import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { detectChrome } from './chrome';

const MAC_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const WIN_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const originalPlatform = process.platform;
const setPlatform = (p: NodeJS.Platform) => {
  Object.defineProperty(process, 'platform', { value: p, configurable: true });
};

beforeEach(() => {
  vi.mocked(existsSync).mockReturnValue(false);
  vi.mocked(execSync).mockImplementation(() => { throw new Error('not found'); });
  vi.unstubAllEnvs();
  vi.stubEnv('CHROME_PATH', '');
});

afterEach(() => {
  setPlatform(originalPlatform);
});

describe('detectChrome', () => {
  it('returns CHROME_PATH when set and the file exists', () => {
    vi.stubEnv('CHROME_PATH', '/custom/chrome');
    vi.mocked(existsSync).mockImplementation((p) => p === '/custom/chrome');
    expect(detectChrome()).toBe('/custom/chrome');
  });

  it('throws when CHROME_PATH is set but the file does not exist', () => {
    vi.stubEnv('CHROME_PATH', '/missing/chrome');
    vi.mocked(existsSync).mockReturnValue(false);
    expect(() => detectChrome()).toThrow(/CHROME_PATH set but not found: \/missing\/chrome/);
  });

  it('returns the macOS default path when it exists on darwin', () => {
    setPlatform('darwin');
    vi.mocked(existsSync).mockImplementation((p) => p === MAC_PATH);
    expect(detectChrome()).toBe(MAC_PATH);
  });

  it('returns a Windows default path when it exists on win32', () => {
    setPlatform('win32');
    vi.mocked(existsSync).mockImplementation((p) => p === WIN_PATH);
    expect(detectChrome()).toBe(WIN_PATH);
  });

  it('falls back to `which google-chrome` on linux', () => {
    setPlatform('linux');
    vi.mocked(execSync).mockImplementation((cmd) => {
      if (String(cmd).includes('which google-chrome')) return '/usr/bin/google-chrome\n';
      throw new Error('not found');
    });
    expect(detectChrome()).toBe('/usr/bin/google-chrome');
  });

  it('throws with a helpful message when Chrome cannot be found', () => {
    setPlatform('darwin');
    expect(() => detectChrome()).toThrow(/Chrome not found/);
  });
});
