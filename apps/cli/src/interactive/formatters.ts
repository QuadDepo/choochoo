import { formatPriceEur, type Trip } from '@choochoo/core';

const TIME_WIDTH = 5;
const ROUTE_WIDTH = 34;
const PRICE_WIDTH = 7;

export const formatRow = (trip: Trip): string => {
  const time = trip.depTime.padEnd(TIME_WIDTH);
  const route = `${trip.from} → ${trip.to}`.padEnd(ROUTE_WIDTH).slice(0, ROUTE_WIDTH);
  const price = formatPriceEur(trip.priceEur).padStart(PRICE_WIDTH);
  return `${time} │ ${route} │ ${price}`;
};

export const pad = (n: number) => String(n).padStart(2, '0');

export const formatDMY = (d: Date) => `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
