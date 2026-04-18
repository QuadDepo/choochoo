import type { Page } from 'playwright';

const SEL_COOKIE_ACCEPT = 'button:has-text("Akkoord")';
const SEL_LOGIN_EMAIL = 'input[type="email"], input[name*="mail"]';
const SEL_LOGIN_PASSWORD = 'input[type="password"]';
const SEL_LOGIN_SUBMIT = 'button:has-text("Inloggen"), input[type="submit"], button[type="submit"]';

const LOGIN_DOMAIN = 'login.ns.nl';
const LOGGED_IN_URL = /mijnns|ns\.nl(?!.*login)/;
const AKAMAI_BLOCK_TEXT = 'Access Denied';

export interface Credentials {
  email: string;
  password: string;
}

/** How the navigation completed: `cached` skipped the login form; `fresh` filled it. */
export type AuthResult = 'cached' | 'fresh';

export class NsAuthError extends Error {
  name = 'NsAuthError';
}

const dismissCookieBanner = async (page: Page) => {
  try {
    await page.locator(SEL_COOKIE_ACCEPT).click({ timeout: 3000 });
  } catch {}
};

export const loginAndNavigate = async (
  page: Page,
  { email, password }: Credentials,
  targetUrl: string,
): Promise<AuthResult> => {
  await page.goto(targetUrl);
  await dismissCookieBanner(page);

  if (!page.url().includes(LOGIN_DOMAIN)) return 'cached';

  await page.locator(SEL_LOGIN_EMAIL).waitFor({ timeout: 15000 });
  await page.locator(SEL_LOGIN_EMAIL).fill(email);
  await page.locator(SEL_LOGIN_PASSWORD).fill(password);
  await page.locator(SEL_LOGIN_SUBMIT).first().click();

  try {
    await page.waitForURL(LOGGED_IN_URL, { timeout: 30000 });
  } catch {
    if ((await page.content()).includes(AKAMAI_BLOCK_TEXT)) {
      throw new NsAuthError('Blocked by Akamai. Try headless: false or log in manually first.');
    }
    throw new NsAuthError('Login timed out. Check your credentials.');
  }

  await dismissCookieBanner(page);
  return 'fresh';
};
