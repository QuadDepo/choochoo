export { detectChrome } from './browser/chrome';
export { launchBrowser, type BrowserOptions, type BrowserSession } from './browser/launch';
export { loginAndNavigate, NsAuthError, type Credentials } from './browser/auth';
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
  loadConfig,
  selectCard,
  CONFIG_DIR,
  CONFIG_FILE,
  type NsConfig,
  type ConfigOptions,
  type Card,
} from './config';
export { buildHistoryUrl } from './urls';
export { PERIODS, type Period } from './periods';
