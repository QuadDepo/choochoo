export { detectChrome } from './browser/chrome';
export { launchBrowser, type BrowserOptions, type BrowserSession } from './browser/launch';
export { loginAndNavigate, NsAuthError, type Credentials } from './browser/auth';
export { loadConfig, CONFIG_DIR, CONFIG_FILE, type NsConfig, type ConfigOptions } from './config';
