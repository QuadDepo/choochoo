import {
  launchBrowser,
  loginAndNavigate,
  loadConfig,
  selectCard,
  buildHistoryUrl,
} from '@choochoo/core';

const config = loadConfig();
const card = selectCard(config.cards);
const targetUrl = buildHistoryUrl(card.id);

console.log(`Using card: ${card.name}`);
console.log(`Target URL: ${targetUrl}`);

const { page, close } = await launchBrowser({ headless: false });
try {
  await loginAndNavigate(page, config, targetUrl);
  console.log('Logged in. URL:', page.url());
  await page.waitForTimeout(5000);
} finally {
  await close();
}
