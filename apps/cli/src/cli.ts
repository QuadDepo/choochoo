import { resolve } from 'node:path';
import { defineCommand, runMain } from 'citty';
import type { Page } from 'playwright';
import {
  launchBrowser,
  loginAndNavigate,
  loadConfig,
  selectCard,
  buildHistoryUrl,
  waitForTrips,
  extractTripsFromPage,
  processTrips,
  configureDownload,
  downloadPdf,
  parseSelection,
  assertPeriod,
  type Period,
} from '@choochoo/core';

const sharedArgs = {
  period: {
    type: 'positional',
    required: false,
    default: 'this-month',
    description: 'Period: this-month | previous-month | past-year | last-7-days | everything',
  },
  card: {
    type: 'string',
    description: 'Card name (defaults to the first one in your config)',
  },
  headed: {
    type: 'boolean',
    default: false,
    description: 'Show the browser window',
  },
} as const;

interface SessionArgs {
  period?: string;
  card?: string;
  headed?: boolean;
}

async function withNsSession(
  args: SessionArgs,
  run: (ctx: { page: Page; period: Period }) => Promise<void>,
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
      console.log('No trips found for this period.');
      return;
    }
    await run({ page, period });
  } finally {
    await close();
  }
}

const extract = defineCommand({
  meta: { name: 'extract', description: 'Extract trips from travel history' },
  args: sharedArgs,
  async run({ args }) {
    await withNsSession(args, async ({ page }) => {
      const raw = await extractTripsFromPage(page);
      const { trips, excluded, totalEur } = processTrips(raw);

      console.log(`\n${trips.length} trips (${excluded} zero-cost excluded)`);
      for (const t of trips) {
        console.log(`  ${String(t.num).padStart(2)}  ${t.date.padEnd(28)}  ${t.from} → ${t.to}  €${t.priceEur.toFixed(2)}`);
      }
      console.log(`  Total: €${totalEur.toFixed(2)}\n`);
    });
  },
});

const download = defineCommand({
  meta: { name: 'download', description: 'Download a PDF declaration' },
  args: {
    ...sharedArgs,
    select: {
      type: 'string',
      default: 'paid',
      description: 'Trip selection: paid | all | 1,2,3',
    },
    output: {
      type: 'string',
      description: 'Output path (defaults to ./downloads/ns-declaratie-<period>-<date>.pdf)',
    },
  },
  async run({ args }) {
    const selection = parseSelection(args.select);
    await withNsSession(args, async ({ page, period }) => {
      const date = new Date().toISOString().slice(0, 10);
      const outputPath = args.output
        ? resolve(args.output)
        : resolve(process.cwd(), 'downloads', `ns-declaratie-${period}-${date}.pdf`);

      await configureDownload(page, selection);
      await downloadPdf(page, outputPath);
      console.log(`\nPDF: ${outputPath}\n`);
    });
  },
});

const main = defineCommand({
  meta: { name: 'choochoo', description: 'NS.nl travel declaration automation' },
  subCommands: { extract, download },
});

runMain(main);
