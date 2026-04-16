export const PERIODS = [
  'this-month',
  'previous-month',
  'past-year',
  'last-7-days',
  'everything',
] as const;

export type Period = typeof PERIODS[number];

export const isPeriod = (input: string): input is Period =>
  (PERIODS as readonly string[]).includes(input);

export const assertPeriod = (input: string): Period => {
  if (!isPeriod(input)) {
    throw new Error(`Invalid period "${input}". Available: ${PERIODS.join(', ')}`);
  }
  return input;
};
