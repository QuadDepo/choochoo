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
