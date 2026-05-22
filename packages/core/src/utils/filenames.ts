import { resolve } from 'node:path';
import { format } from 'date-fns';
import { DEFAULT_DOWNLOADS_DIR } from '../config';

// Local date — UTC slicing rolls over near midnight in CET and stamps yesterday's file.
const todayISO = () => format(new Date(), 'yyyy-MM-dd');

export const pdfFilename = (period: string): string => `ns-declaratie-${period}-${todayISO()}.pdf`;

export const tripsFilename = (period: string): string => `trips-${period}-${todayISO()}.json`;

/** Resolve the default PDF output path — `<downloadsDir>/<pdfFilename>`. */
export const defaultPdfPath = (period: string, downloadsDir: string = DEFAULT_DOWNLOADS_DIR): string =>
  resolve(downloadsDir, pdfFilename(period));

/** Resolve the default JSON output path — `<downloadsDir>/<tripsFilename>`. */
export const defaultTripsPath = (period: string, downloadsDir: string = DEFAULT_DOWNLOADS_DIR): string =>
  resolve(downloadsDir, tripsFilename(period));
