export { detectChrome } from './browser/chrome';
export { launchBrowser, type BrowserOptions, type BrowserSession } from './browser/launch';
export { loginAndNavigate, NsAuthError, type Credentials } from './browser/auth';
export {
  loadConfig,
  selectCard,
  CONFIG_DIR,
  CONFIG_FILE,
  type NsConfig,
  type ConfigOptions,
  type Card,
} from './config';
