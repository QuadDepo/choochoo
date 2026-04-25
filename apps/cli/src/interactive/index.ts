import {
  configureDownload,
  defaultPdfPath,
  downloadPdf,
  extractTripsFromPage,
  formatPriceEur,
  groupTripsByDate,
  loadConfig,
  type NsConfig,
  PERIODS,
  type Period,
  processTrips,
  type TripGroup,
} from '@choochoo/core';
import { cancel, groupMultiselect, intro, isCancel, outro, select, spinner } from '@clack/prompts';
import type { Page } from 'playwright';
import { withNsSession } from '../session';
import { orderGroupsForDisplay } from './display-order';
import { formatRow } from './formatters';
import { promptCustomRange } from './prompt-range';

const CUSTOM_RANGE = '__custom__' as const;
type PeriodChoice = Period | typeof CUSTOM_RANGE;

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
  return promptCustomRange();
};

interface InteractiveOptions {
  headed?: boolean;
}

type Progress = ReturnType<typeof spinner>;

const selectCardIfMultiple = async (config: NsConfig): Promise<string | undefined | symbol> => {
  if (config.cards.length <= 1) return undefined;
  const picked = await select({
    message: 'Card',
    options: config.cards.map((card) => ({ value: card.name, label: card.name })),
  });
  return picked;
};

const promptTripSelection = async (groups: TripGroup[]): Promise<number[] | symbol> => {
  const groupedOptions = Object.fromEntries(
    groups.map((group) => [group.date, group.trips.map((trip) => ({ value: trip.num, label: formatRow(trip) }))]),
  );
  return groupMultiselect<number>({
    message: 'Trips to include',
    options: groupedOptions,
    required: true,
  });
};

interface DownloadContext {
  page: Page;
  period: string;
  config: NsConfig;
  progress: Progress;
}

/** Run the pick-and-download phase. Returns `'cancelled'` when the user aborts the picker. */
const promptAndDownloadTrips = async ({
  page,
  period,
  config,
  progress,
}: DownloadContext): Promise<'downloaded' | 'cancelled' | 'empty'> => {
  const raw = await extractTripsFromPage(page);
  const result = processTrips(raw); // default: drops zero-cost (not declarable)

  if (result.trips.length === 0) {
    progress.stop('No billable trips for this period');
    return 'empty';
  }

  progress.stop(`${result.trips.length} trips, total ${formatPriceEur(result.totalEur)}`);

  const groups = orderGroupsForDisplay(groupTripsByDate(result.trips), config.tripOrder);
  const picked = await promptTripSelection(groups);
  if (isCancel(picked)) return 'cancelled';

  progress.start('Configuring download');
  await configureDownload(page, picked);
  progress.message('Downloading PDF');
  const outputPath = defaultPdfPath(period, config.downloadsDir);
  await downloadPdf(page, outputPath);
  progress.stop(`PDF saved: ${outputPath}`);
  return 'downloaded';
};

export async function runInteractive(options: InteractiveOptions = {}): Promise<void> {
  intro('choochoo — NS.nl travel declarations');

  const config = loadConfig();

  const cardChoice = await selectCardIfMultiple(config);
  if (typeof cardChoice === 'symbol') return cancel('Aborted.');

  const period = await promptForPeriod();
  if (typeof period === 'symbol') return cancel('Aborted.');

  const progress = spinner();
  progress.start('Launching browser & logging in');

  let cancelled = false;

  try {
    await withNsSession(
      { period, card: cardChoice, headed: options.headed },
      async ({ page, period: resolvedPeriod, config: sessionConfig }) => {
        const outcome = await promptAndDownloadTrips({
          page,
          period: resolvedPeriod,
          config: sessionConfig,
          progress,
        });
        if (outcome === 'cancelled') {
          cancel('Aborted.');
          cancelled = true;
        }
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
