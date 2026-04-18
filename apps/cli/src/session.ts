import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Page } from 'playwright';
import {
  launchBrowser,
  loginAndNavigate,
  loadConfig,
  selectCard,
  buildHistoryUrl,
  waitForTrips,
  assertPeriod,
  CONFIG_DIR,
  SESSION_FILE,
  type Period,
  type AuthResult,
} from '@choochoo/core';

export interface SessionArgs {
  period?: string;
  card?: string;
  headed?: boolean;
}

export interface SessionOptions {
  onNoTrips?: () => void | Promise<void>;
  onAuthResult?: (result: AuthResult) => void | Promise<void>;
}

export async function withNsSession(
  args: SessionArgs,
  run: (ctx: { page: Page; period: Period }) => Promise<void>,
  options: SessionOptions = {},
): Promise<void> {
  const period = assertPeriod(args.period ?? 'this-month');
  const config = loadConfig();
  const card = selectCard(config.cards, args.card);
  const targetUrl = buildHistoryUrl(card.id, period);

  const sessionPath = join(CONFIG_DIR, SESSION_FILE);
  const storageStatePath = existsSync(sessionPath) ? sessionPath : undefined;

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
      await run({ page, period });
    }

    // Save the (possibly refreshed) cookies so the next run can skip login.
    mkdirSync(CONFIG_DIR, { recursive: true });
    await context.storageState({ path: sessionPath });
  } finally {
    await close();
  }
}
