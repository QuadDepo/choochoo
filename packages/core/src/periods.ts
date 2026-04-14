export const PERIODS = [
  'this-month',
  'previous-month',
  'past-year',
  'last-7-days',
  'everything',
] as const;

export type Period = typeof PERIODS[number];
