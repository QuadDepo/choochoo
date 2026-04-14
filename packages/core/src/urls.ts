import type { Period } from './periods';

export const buildHistoryUrl = (cardId: string, period: Period = 'this-month'): string =>
  `https://www.ns.nl/mijnns#/reishistorie?card=${cardId}&period=${period}`;
