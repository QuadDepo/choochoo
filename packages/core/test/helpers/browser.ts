import { chromium, type Page } from 'playwright';

export interface TestSession {
  page: Page;
  close: () => Promise<void>;
}

/**
 * Launches Playwright's bundled Chromium for fixture tests.
 * No anti-detection args or system Chrome lookup — those matter for live NS.nl
 * scraping, not for replaying static fixtures.
 *
 * Run `npx playwright install chromium` once locally and in CI before tests.
 */
export async function createTestSession(): Promise<TestSession> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  return {
    page,
    close: () => browser.close(),
  };
}
