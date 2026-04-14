import { chromium, type Page } from 'playwright';
import { detectChrome } from './chrome';

export interface BrowserOptions {
  chromePath?: string;
  headless?: boolean;
}

export interface BrowserSession {
  page: Page;
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
  });

  const page = await context.newPage();

  return {
    page,
    close: () => browser.close(),
  };
};
