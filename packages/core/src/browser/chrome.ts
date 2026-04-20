import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const CANDIDATES: Record<string, string[]> = {
  darwin: ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'],
  win32: [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ],
};

export const detectChrome = (): string => {
  if (process.env.CHROME_PATH) {
    if (existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
    throw new Error(`CHROME_PATH set but not found: ${process.env.CHROME_PATH}`);
  }

  for (const path of CANDIDATES[process.platform] ?? []) {
    if (existsSync(path)) return path;
  }

  if (process.platform === 'linux') {
    for (const bin of ['google-chrome', 'google-chrome-stable']) {
      try {
        const result = execSync(`which ${bin}`, { encoding: 'utf8' }).trim();
        if (result) return result;
      } catch {}
    }
  }

  throw new Error('Chrome not found. Install Google Chrome or set CHROME_PATH.');
};
