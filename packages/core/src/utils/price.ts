export const parsePrice = (priceStr: string): number => {
  const cleaned = priceStr
    .replace(/\u00a0/g, '')
    .replace('€', '')
    .replace(',', '.')
    .trim();
  const parsed = parseFloat(cleaned);
  if (Number.isNaN(parsed)) {
    if (priceStr !== '') {
      console.warn(`parsePrice: could not parse "${priceStr}"`);
    }
    return 0;
  }
  return parsed;
};

/** Format a euro amount for display as `€N.NN`. */
export const formatPriceEur = (eur: number): string => `€${eur.toFixed(2)}`;
