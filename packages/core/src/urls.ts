import type { PeriodInput } from './periods';

/**
 * Build the NS travel-history URL for a card + period.
 * `period` is either a predefined slug (see `PERIODS`) or an NS-formatted date range
 * (`DD-MM-YYYY-to-DD-MM-YYYY`) produced by `periodFromRange` or validated by `assertPeriodOrRange`.
 */
export const buildHistoryUrl = (cardId: string, period: PeriodInput = 'this-month'): string =>
  `https://www.ns.nl/mijnns#/reishistorie?card=${cardId}&period=${period}`;
