/** Parse a Dutch-formatted price string (e.g. `"€ 8,50"`) into a number. Returns 0 on unparseable input. */
export const parsePrice = (priceStr: string): number => {
  const cleaned = priceStr
    .replace(/\u00a0/g, '')
    .replace('€', '')
    .replace(',', '.')
    .trim();
  return parseFloat(cleaned) || 0;
};

/** Format a euro amount for display as `€N.NN`. */
export const formatPriceEur = (eur: number): string => `€${eur.toFixed(2)}`;
