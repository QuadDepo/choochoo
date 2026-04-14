import { launchBrowser, loginAndNavigate, loadConfig } from '@choochoo/core';

const credentials = loadConfig();

const { page, close } = await launchBrowser({ headless: false });
try {
  await loginAndNavigate(page, credentials, 'https://www.ns.nl/mijnns');
  console.log('Logged in. URL:', page.url());
  await page.waitForTimeout(5000);
} finally {
  await close();
}
