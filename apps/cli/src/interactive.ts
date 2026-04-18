import { resolve } from 'node:path';
import { intro, outro, select, groupMultiselect, spinner, cancel, isCancel } from '@clack/prompts';
import {
  loadConfig,
  PERIODS,
  configureDownload,
  downloadPdf,
  extractTripsFromPage,
  processTrips,
  pdfFilename,
  groupTripsByDate,
  type Period,
  type Trip,
} from '@choochoo/core';
import { withNsSession } from './session';

const TIME_WIDTH = 5;
const ROUTE_WIDTH = 34;
const PRICE_WIDTH = 7;

const formatRow = (trip: Trip): string => {
  const time = trip.depTime.padEnd(TIME_WIDTH);
  const route = `${trip.from} → ${trip.to}`.padEnd(ROUTE_WIDTH).slice(0, ROUTE_WIDTH);
  const price = `€${trip.priceEur.toFixed(2)}`.padStart(PRICE_WIDTH);
  return `${time} │ ${route} │ ${price}`;
};

export async function runInteractive(): Promise<void> {
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

  const period = await select<Period>({
    message: 'Period',
    options: PERIODS.map((period) => ({ value: period, label: period })),
    initialValue: 'this-month',
  });
  if (isCancel(period)) return cancel('Aborted.');

  const progress = spinner();
  progress.start('Launching browser & logging in');

  let cancelled = false;

  try {
    await withNsSession(
      { period, card: cardName },
      async ({ page, period }) => {
        const raw = await extractTripsFromPage(page);
        const result = processTrips(raw); // default: drops zero-cost (not declarable)

        if (result.trips.length === 0) {
          progress.stop('No billable trips for this period');
          return;
        }

        progress.stop(`${result.trips.length} trips, total €${result.totalEur.toFixed(2)}`);

        const options = Object.fromEntries(
          groupTripsByDate(result.trips).map((group) => [
            group.date,
            group.trips.map((trip) => ({ value: trip.num, label: formatRow(trip) })),
          ]),
        );

        const picked = await groupMultiselect<number>({
          message: 'Trips to include',
          options,
          required: true,
        });
        if (isCancel(picked)) { cancel('Aborted.'); cancelled = true; return; }

        progress.start('Configuring download');
        await configureDownload(page, picked);
        progress.message('Downloading PDF');
        const outputPath = resolve(process.cwd(), 'downloads', pdfFilename(period));
        await downloadPdf(page, outputPath);
        progress.stop(`PDF saved: ${outputPath}`);
      },
      {
        onAuthResult: (result) => {
          progress.message(result === 'cached' ? 'Resumed previous session' : 'Logged in');
        },
        onNoTrips: () => { progress.stop('No trips for this period'); },
      },
    );
  } catch (error) {
    progress.stop(`Error: ${(error as Error).message}`);
    throw error;
  }

  if (!cancelled) outro('Bye!');
}
