import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
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
  pdfFilename,
  CONFIG_DIR,
  CONFIG_FILE,
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

const init = defineCommand({
  meta: { name: 'init', description: 'Create a config file template at ~/.config/choochoo/config.json' },
  async run() {
    const configPath = join(CONFIG_DIR, CONFIG_FILE);
    if (existsSync(configPath)) {
      console.log(`Config already exists at ${configPath}`);
      return;
    }
    const template = {
      email: '',
      password: '',
      cards: [{ name: 'personal', id: '' }],
    };
    mkdirSync(CONFIG_DIR, { recursive: true });
    writeFileSync(configPath, JSON.stringify(template, null, 2) + '\n');
    console.log(`Config created at ${configPath}\nFill in your NS.nl credentials and card ID.`);
  },
});

const extract = defineCommand({
  meta: { name: 'extract', description: 'Extract trips from travel history' },
  args: {
    ...sharedArgs,
    json: {
      type: 'string',
      description: 'Save extracted trips to this JSON path',
    },
  },
  async run({ args }) {
    await withNsSession(args, async ({ page, period }) => {
      const raw = await extractTripsFromPage(page);
      const result = processTrips(raw);

      console.log(`\n${result.trips.length} trips (${result.excluded} zero-cost excluded)`);
      for (const t of result.trips) {
        console.log(`  ${String(t.num).padStart(2)}  ${t.date.padEnd(28)}  ${t.from} → ${t.to}  €${t.priceEur.toFixed(2)}`);
      }
      console.log(`  Total: €${result.totalEur.toFixed(2)}\n`);

      if (args.json) {
        const jsonPath = resolve(args.json);
        mkdirSync(dirname(jsonPath), { recursive: true });
        writeFileSync(jsonPath, JSON.stringify({ ...result, period }, null, 2) + '\n');
        console.log(`JSON: ${jsonPath}\n`);
      }
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
      const outputPath = args.output
        ? resolve(args.output)
        : resolve(process.cwd(), 'downloads', pdfFilename(period));

      await configureDownload(page, selection);
      await downloadPdf(page, outputPath);
      console.log(`\nPDF: ${outputPath}\n`);
    });
  },
});

const main = defineCommand({
  meta: { name: 'choochoo', description: 'NS.nl travel declaration automation' },
  subCommands: { init, extract, download },
});

runMain(main);
