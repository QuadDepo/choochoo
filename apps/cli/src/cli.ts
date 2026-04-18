import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { defineCommand, runMain } from 'citty';
import {
  extractTripsFromPage,
  processTrips,
  configureDownload,
  downloadPdf,
  parseSelection,
  defaultPdfPath,
  writeConfigTemplate,
  formatPriceEur,
} from '@choochoo/core';
import { withNsSession } from './session';
import { runInteractive } from './interactive';

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
    await withNsSession(args, async ({ page, period }) => {
      const raw = await extractTripsFromPage(page);
      const result = processTrips(raw);

      console.log(`\n${result.trips.length} trips (${result.excluded} zero-cost excluded)`);
      for (const trip of result.trips) {
        console.log(`  ${String(trip.num).padStart(2)}  ${trip.date.padEnd(28)}  ${trip.from} → ${trip.to}  ${formatPriceEur(trip.priceEur)}`);
      }
      console.log(`  Total: ${formatPriceEur(result.totalEur)}\n`);

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
    await withNsSession(args, async ({ page, period, config }) => {
      const outputPath = args.output ? resolve(args.output) : defaultPdfPath(period, config.downloadsDir);

      await configureDownload(page, selection);
      await downloadPdf(page, outputPath);
      console.log(`\nPDF: ${outputPath}\n`);
    });
  },
});

const main = defineCommand({
  meta: { name: 'choochoo', description: 'NS.nl travel declaration automation' },
  async run() {
    await runInteractive();
  },
  subCommands: { init, extract, download },
});

runMain(main);
