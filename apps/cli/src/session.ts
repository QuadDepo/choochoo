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
import type { BrowserContext, Page } from 'playwright';

interface SessionArgs {
  period?: string;
  card?: string;
  headed?: boolean;
}

interface SessionOptions {
  onNoTrips?: () => void | Promise<void>;
  onAuthResult?: (result: AuthResult) => void | Promise<void>;
}

/** Save cookies so the next run can reuse the logged-in session. */
const persistSessionState = async (context: BrowserContext): Promise<void> => {
  mkdirSync(CONFIG_DIR, { recursive: true });
  await context.storageState({ path: SESSION_PATH });
};

const handleNoTrips = async (options: SessionOptions): Promise<void> => {
  if (options.onNoTrips) {
    await options.onNoTrips();
  } else {
    console.log('No trips found for this period.');
  }
};

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
    const { email, password } = config;
    const authResult = await loginAndNavigate(page, { email, password }, targetUrl);
    if (options.onAuthResult) await options.onAuthResult(authResult);

    const hasTrips = await waitForTrips(page);
    if (!hasTrips) {
      await handleNoTrips(options);
    } else {
      await run({ page, period, config });
    }

    await persistSessionState(context);
  } finally {
    await close();
  }
}
