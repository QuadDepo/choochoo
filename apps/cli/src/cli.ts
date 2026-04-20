import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
  configureDownload,
  defaultPdfPath,
  downloadPdf,
  extractTripsFromPage,
  formatPriceEur,
  parseSelection,
  periodFromRange,
  processTrips,
  writeConfigTemplate,
} from '@choochoo/core';
import { defineCommand, runMain } from 'citty';
import { runInteractive } from './interactive';
import { withNsSession } from './session';

const sharedArgs = {
  period: {
    type: 'positional',
    required: false,
    default: 'this-month',
    description:
      'Period: this-month | previous-month | past-year | last-7-days | everything (or use --from/--to for a custom range)',
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
  from: {
    type: 'string',
    description: 'Custom range start date (DD-MM-YYYY). Overrides the positional period. Requires --to.',
  },
  to: {
    type: 'string',
    description: 'Custom range end date (DD-MM-YYYY). Overrides the positional period. Requires --from.',
  },
} as const;

/** Resolve the period: --from/--to override the positional period. Throws if only one of them is set. */
const resolvePeriod = (args: { period?: string; from?: string; to?: string }): string => {
  if (args.from && args.to) return periodFromRange(args.from, args.to);
  if (args.from || args.to) {
    throw new Error('--from and --to must both be provided for a custom range.');
  }
  return args.period ?? 'this-month';
};

const init = defineCommand({
  meta: { name: 'init', description: 'Create a config file template at ~/.config/choochoo/config.json' },
  async run() {
    const { path, created } = writeConfigTemplate();
    if (created) {
      console.log(`Config created at ${path}\nFill in your NS.nl credentials and card ID.`);
    } else {
      console.log(`Config already exists at ${path}`);
    }
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
    const period = resolvePeriod(args);
    await withNsSession({ ...args, period }, async ({ page, period: resolvedPeriod }) => {
      const raw = await extractTripsFromPage(page);
      const result = processTrips(raw);

      console.log(`\n${result.trips.length} trips (${result.excluded} zero-cost excluded)`);
      for (const trip of result.trips) {
        console.log(
          `  ${String(trip.num).padStart(2)}  ${trip.date.padEnd(28)}  ${trip.from} → ${trip.to}  ${formatPriceEur(trip.priceEur)}`,
        );
      }
      console.log(`  Total: ${formatPriceEur(result.totalEur)}\n`);

      if (args.json) {
        const jsonPath = resolve(args.json);
        mkdirSync(dirname(jsonPath), { recursive: true });
        writeFileSync(jsonPath, `${JSON.stringify({ ...result, period: resolvedPeriod }, null, 2)}\n`);
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
      description: 'Output path (defaults to <downloadsDir>/ns-declaratie-<period>-<date>.pdf)',
    },
  },
  async run({ args }) {
    const selection = parseSelection(args.select);
    const period = resolvePeriod(args);
    await withNsSession({ ...args, period }, async ({ page, period: resolvedPeriod, config }) => {
      const outputPath = args.output ? resolve(args.output) : defaultPdfPath(resolvedPeriod, config.downloadsDir);

      await configureDownload(page, selection);
      await downloadPdf(page, outputPath);
      console.log(`\nPDF: ${outputPath}\n`);
    });
  },
});

const main = defineCommand({
  meta: { name: 'choochoo', description: 'NS.nl travel declaration automation' },
  args: {
    headed: {
      type: 'boolean',
      default: false,
      description: 'Show the browser window (for debugging)',
    },
  },
  async run({ args }) {
    await runInteractive({ headed: args.headed });
  },
  subCommands: { init, extract, download },
});

runMain(main);
