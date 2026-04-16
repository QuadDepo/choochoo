const todayISO = () => new Date().toISOString().slice(0, 10);

export const pdfFilename = (period: string): string =>
  `ns-declaratie-${period}-${todayISO()}.pdf`;

export const tripsFilename = (period: string): string =>
  `trips-${period}-${todayISO()}.json`;
