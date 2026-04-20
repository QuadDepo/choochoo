import {
  configureDownload,
  defaultPdfPath,
  downloadPdf,
  extractTripsFromPage,
  formatPriceEur,
  groupTripsByDate,
  loadConfig,
  PERIODS,
  type Period,
  periodFromRange,
  processTrips,
  type Trip,
} from '@choochoo/core';
import { cancel, date, groupMultiselect, intro, isCancel, outro, select, spinner } from '@clack/prompts';
import { withNsSession } from './session';

const TIME_WIDTH = 5;
const ROUTE_WIDTH = 34;
const PRICE_WIDTH = 7;

const formatRow = (trip: Trip): string => {
  const time = trip.depTime.padEnd(TIME_WIDTH);
  const route = `${trip.from} → ${trip.to}`.padEnd(ROUTE_WIDTH).slice(0, ROUTE_WIDTH);
  const price = formatPriceEur(trip.priceEur).padStart(PRICE_WIDTH);
  return `${time} │ ${route} │ ${price}`;
};

const CUSTOM_RANGE = '__custom__' as const;
type PeriodChoice = Period | typeof CUSTOM_RANGE;

const pad = (n: number) => String(n).padStart(2, '0');
const formatDMY = (d: Date) => `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;

const promptForPeriod = async (): Promise<string | symbol> => {
  const choice = await select<PeriodChoice>({
    message: 'Period',
    options: [
      ...PERIODS.map((period) => ({ value: period, label: period })),
      { value: CUSTOM_RANGE, label: 'Custom range…' },
    ],
    initialValue: 'this-month',
  });
  if (isCancel(choice)) return choice;
  if (choice !== CUSTOM_RANGE) return choice;

  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const from = await date({
    message: 'From date',
    format: 'DMY',
    initialValue: firstOfMonth,
    maxDate: today,
  });
  if (isCancel(from)) return from;

  const to = await date({
    message: 'To date',
    format: 'DMY',
    initialValue: today,
    minDate: startOfDay(from),
    maxDate: today,
  });
  if (isCancel(to)) return to;

  return periodFromRange(formatDMY(from), formatDMY(to));
};

interface InteractiveOptions {
  headed?: boolean;
}

export async function runInteractive(options: InteractiveOptions = {}): Promise<void> {
  intro('choochoo — NS.nl travel declarations');

  const config = loadConfig();

  let cardName: string | undefined;
  if (config.cards.length > 1) {
    const picked = await select({
      message: 'Card',
      options: config.cards.map((card) => ({ value: card.name, label: card.name })),
    });
    if (isCancel(picked)) return cancel('Aborted.');
    cardName = picked;
  }

  const period = await promptForPeriod();
  if (typeof period === 'symbol') return cancel('Aborted.');

  const progress = spinner();
  progress.start('Launching browser & logging in');

  let cancelled = false;

  try {
    await withNsSession(
      { period, card: cardName, headed: options.headed },
      async ({ page, period: resolvedPeriod, config: sessionConfig }) => {
        const raw = await extractTripsFromPage(page);
        const result = processTrips(raw); // default: drops zero-cost (not declarable)

        if (result.trips.length === 0) {
          progress.stop('No billable trips for this period');
          return;
        }

        progress.stop(`${result.trips.length} trips, total ${formatPriceEur(result.totalEur)}`);

        const groupedOptions = Object.fromEntries(
          groupTripsByDate(result.trips).map((group) => [
            group.date,
            group.trips.map((trip) => ({ value: trip.num, label: formatRow(trip) })),
          ]),
        );

        const picked = await groupMultiselect<number>({
          message: 'Trips to include',
          options: groupedOptions,
          required: true,
        });
        if (isCancel(picked)) {
          cancel('Aborted.');
          cancelled = true;
          return;
        }

        progress.start('Configuring download');
        await configureDownload(page, picked);
        progress.message('Downloading PDF');
        const outputPath = defaultPdfPath(resolvedPeriod, sessionConfig.downloadsDir);
        await downloadPdf(page, outputPath);
        progress.stop(`PDF saved: ${outputPath}`);
      },
      {
        onAuthResult: (result) => {
          progress.message(result === 'cached' ? 'Resumed previous session' : 'Logged in');
        },
        onNoTrips: () => {
          progress.stop('No trips for this period');
        },
      },
    );
  } catch (error) {
    progress.stop(`Error: ${(error as Error).message}`);
    throw error;
  }

  if (!cancelled) outro('Bye!');
}
