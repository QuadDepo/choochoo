import { type BrowserContext, chromium, type Page } from 'playwright-core';
import { detectChrome } from './chrome';

export interface BrowserOptions {
  chromePath?: string;
  headless?: boolean;
  /**
   * Path to a Playwright storage-state JSON (cookies + localStorage).
   * When provided and the file exists, the new context loads it so the session
   * can skip login if cookies are still valid. Caller is responsible for
   * checking existence and for saving via `context.storageState({ path })`.
   */
  storageStatePath?: string;
}

export interface BrowserSession {
  page: Page;
  context: BrowserContext;
  close: () => Promise<void>;
}

export const launchBrowser = async (options: BrowserOptions = {}): Promise<BrowserSession> => {
  const browser = await chromium.launch({
    executablePath: options.chromePath ?? detectChrome(),
    headless: options.headless ?? true,
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    locale: 'nl-NL',
    ...(options.storageStatePath ? { storageState: options.storageStatePath } : {}),
  });

  const page = await context.newPage();

  return {
    page,
    context,
    close: () => browser.close(),
  };
};
