export { type AuthResult, type Credentials, loginAndNavigate, NsAuthError } from './browser/auth';
export { detectChrome } from './browser/chrome';
export {
  configureDownload,
  downloadPdf,
  NsDownloadError,
  parseSelection,
  type Selection,
} from './browser/download';
export { type BrowserOptions, type BrowserSession, launchBrowser } from './browser/launch';
export { extractTripsFromPage, waitForTrips } from './browser/trips';
export {
  type Card,
  CONFIG_DIR,
  CONFIG_PATH,
  type ConfigOptions,
  DEFAULT_DOWNLOADS_DIR,
  loadConfig,
  type NsConfig,
  SESSION_PATH,
  selectCard,
  type TripOrder,
  type WriteConfigResult,
  writeConfigTemplate,
} from './config';
export { defaultPdfPath, defaultTripsPath, pdfFilename, tripsFilename } from './filenames';
export {
  assertPeriod,
  assertPeriodOrRange,
  isPeriod,
  isPeriodRange,
  PERIODS,
  type Period,
  type PeriodInput,
  periodFromRange,
} from './periods';
export { formatPriceEur, parsePrice } from './price';
export { groupTripsByDate, type TripGroup } from './trip-grouping';
export { type ExtractResult, processTrips, type RawTrip, type Trip } from './trips';
export { buildHistoryUrl } from './urls';
