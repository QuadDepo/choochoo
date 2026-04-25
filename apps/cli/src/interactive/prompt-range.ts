import { periodFromRange } from '@choochoo/core';
import { date, isCancel } from '@clack/prompts';
import { formatDMY, startOfDay } from './formatters';

export const promptCustomRange = async (): Promise<string | symbol> => {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

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
