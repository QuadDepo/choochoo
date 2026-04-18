export { detectChrome } from './browser/chrome';
export { launchBrowser, type BrowserOptions, type BrowserSession } from './browser/launch';
export { loginAndNavigate, NsAuthError, type Credentials, type AuthResult } from './browser/auth';
export {
  waitForTrips,
  extractTripsFromPage,
  processTrips,
  parsePrice,
  type RawTrip,
  type Trip,
  type ExtractResult,
} from './browser/trips';
export {
  configureDownload,
  downloadPdf,
  parseSelection,
  NsDownloadError,
  type Selection,
} from './browser/download';
export {
  loadConfig,
  selectCard,
  CONFIG_DIR,
  CONFIG_FILE,
  SESSION_FILE,
  type NsConfig,
  type ConfigOptions,
  type Card,
} from './config';
export { buildHistoryUrl } from './urls';
export { PERIODS, isPeriod, assertPeriod, type Period } from './periods';
export { pdfFilename, tripsFilename } from './filenames';
export { groupTripsByDate, type TripGroup } from './trip-grouping';
