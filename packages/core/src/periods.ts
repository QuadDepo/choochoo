import { format, isAfter, isValid, parse, startOfDay } from 'date-fns';

export const PERIODS = ['this-month', 'previous-month', 'past-year', 'last-7-days', 'everything'] as const;

export type Period = (typeof PERIODS)[number];

/**
 * Accepted period input: a predefined slug, or any other string (a custom NS range
 * like `DD-MM-YYYY-to-DD-MM-YYYY`, validated at runtime via `assertPeriodOrRange`).
 * The `& {}` preserves IDE autocomplete for the literals.
 */
export type PeriodInput = Period | (string & {});

export const isPeriod = (input: string): input is Period => (PERIODS as readonly string[]).includes(input);

export const assertPeriod = (input: string): Period => {
  if (!isPeriod(input)) {
    throw new Error(`Invalid period "${input}". Available: ${PERIODS.join(', ')}`);
  }
  return input;
};

// Custom date ranges (NS accepts period=DD-MM-YYYY-to-DD-MM-YYYY)
const DATE_FORMAT = 'dd-MM-yyyy';
const RANGE_PATTERN = /^\d{2}-\d{2}-\d{4}-to-\d{2}-\d{2}-\d{4}$/;

export const isPeriodRange = (input: string): boolean => RANGE_PATTERN.test(input);

const parseDate = (input: string, label: string): Date => {
  const parsed = parse(input, DATE_FORMAT, new Date());
  if (!isValid(parsed)) {
    throw new Error(`Invalid ${label} date "${input}". Expected DD-MM-YYYY.`);
  }
  return startOfDay(parsed);
};

export const periodFromRange = (from: string, to: string): string => {
  const fromDate = parseDate(from, 'from');
  const toDate = parseDate(to, 'to');
  const today = startOfDay(new Date());
  if (isAfter(fromDate, today)) {
    throw new Error(`"from" (${from}) cannot be in the future.`);
  }
  if (isAfter(toDate, today)) {
    throw new Error(`"to" (${to}) cannot be in the future.`);
  }
  if (isAfter(fromDate, toDate)) {
    throw new Error(`"from" (${from}) must be on or before "to" (${to}).`);
  }
  return `${format(fromDate, DATE_FORMAT)}-to-${format(toDate, DATE_FORMAT)}`;
};

export const assertPeriodOrRange = (input: string): PeriodInput => {
  if (isPeriod(input)) return input;
  if (isPeriodRange(input)) {
    // Fully validate calendar correctness + future/from<=to via periodFromRange.
    const parts = input.split('-to-');
    periodFromRange(parts[0]!, parts[1]!);
    return input;
  }
  throw new Error(
    `Invalid period "${input}". Use one of: ${PERIODS.join(', ')}, ` +
      `or a custom range in DD-MM-YYYY-to-DD-MM-YYYY format.`,
  );
};
