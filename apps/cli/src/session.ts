import type { Page } from 'playwright';
import {
  launchBrowser,
  loginAndNavigate,
  loadConfig,
  selectCard,
  buildHistoryUrl,
  waitForTrips,
  assertPeriod,
  type Period,
} from '@choochoo/core';

export interface SessionArgs {
  period?: string;
  card?: string;
  headed?: boolean;
}

export interface SessionOptions {
  onNoTrips?: () => void | Promise<void>;
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

  const { page, close } = await launchBrowser({ headless: !args.headed });
  try {
    await loginAndNavigate(page, config, targetUrl);
    const hasTrips = await waitForTrips(page);
    if (!hasTrips) {
      if (options.onNoTrips) {
        await options.onNoTrips();
      } else {
        console.log('No trips found for this period.');
      }
      return;
    }
    await run({ page, period });
  } finally {
    await close();
  }
}
