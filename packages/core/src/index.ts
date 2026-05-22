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
export { extractTripsFromPage, waitForTrips } from './browser/scraper';
export {
  type Card,
  CONFIG_DIR,
  CONFIG_PATH,
  type ConfigOptions,
  chooseCard,
  DEFAULT_DOWNLOADS_DIR,
  loadConfig,
  type NsConfig,
  SESSION_PATH,
  type TripOrder,
  type WriteConfigResult,
  writeConfigTemplate,
} from './config';
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
export { groupTripsByDate, type TripGroup } from './trips/grouping';
export { type ExtractResult, processTrips, type RawTrip, type Trip } from './trips/model';
export { buildHistoryUrl } from './urls';
export { defaultPdfPath, defaultTripsPath, pdfFilename, tripsFilename } from './utils/filenames';
export { formatPriceEur, parsePrice } from './utils/price';
