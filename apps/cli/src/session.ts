import { existsSync, mkdirSync } from 'node:fs';
import {
  type AuthResult,
  assertPeriodOrRange,
  buildHistoryUrl,
  CONFIG_DIR,
  launchBrowser,
  loadConfig,
  loginAndNavigate,
  type NsConfig,
  type PeriodInput,
  SESSION_PATH,
  selectCard,
  waitForTrips,
} from '@choochoo/core';
import type { Page } from 'playwright';

interface SessionArgs {
  period?: string;
  card?: string;
  headed?: boolean;
}

interface SessionOptions {
  onNoTrips?: () => void | Promise<void>;
  onAuthResult?: (result: AuthResult) => void | Promise<void>;
}

export async function withNsSession(
  args: SessionArgs,
  run: (ctx: { page: Page; period: PeriodInput; config: NsConfig }) => Promise<void>,
  options: SessionOptions = {},
): Promise<void> {
  const period = assertPeriodOrRange(args.period ?? 'this-month');
  const config = loadConfig();
  const card = selectCard(config.cards, args.card);
  const targetUrl = buildHistoryUrl(card.id, period);

  const storageStatePath = existsSync(SESSION_PATH) ? SESSION_PATH : undefined;

  const { page, context, close } = await launchBrowser({
    headless: !args.headed,
    storageStatePath,
  });
  try {
    const authResult = await loginAndNavigate(page, config, targetUrl);
    if (options.onAuthResult) await options.onAuthResult(authResult);
    const hasTrips = await waitForTrips(page);
    if (!hasTrips) {
      if (options.onNoTrips) {
        await options.onNoTrips();
      } else {
        console.log('No trips found for this period.');
      }
    } else {
      await run({ page, period, config });
    }

    // Save the (possibly refreshed) cookies so the next run can skip login.
    mkdirSync(CONFIG_DIR, { recursive: true });
    await context.storageState({ path: SESSION_PATH });
  } finally {
    await close();
  }
}
