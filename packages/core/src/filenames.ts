import { resolve } from 'node:path';
import { DEFAULT_DOWNLOADS_DIR } from './config';

const todayISO = () => new Date().toISOString().slice(0, 10);

export const pdfFilename = (period: string): string =>
  `ns-declaratie-${period}-${todayISO()}.pdf`;

export const tripsFilename = (period: string): string =>
  `trips-${period}-${todayISO()}.json`;

/** Resolve the default PDF output path — `<downloadsDir>/<pdfFilename>`. */
export const defaultPdfPath = (period: string, downloadsDir: string = DEFAULT_DOWNLOADS_DIR): string =>
  resolve(downloadsDir, pdfFilename(period));
