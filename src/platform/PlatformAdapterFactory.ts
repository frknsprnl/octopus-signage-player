import type { IPlatformAdapter } from './IPlatformAdapter';
import { BrowserPlatformAdapter } from './BrowserPlatformAdapter';
import { TizenPlatformAdapter } from './TizenPlatformAdapter';

/** PLATFORM env'e göre uygun adapter döner. */
export function createPlatformAdapter(type: 'browser' | 'tizen'): IPlatformAdapter {
  if (type === 'tizen') return new TizenPlatformAdapter();
  return new BrowserPlatformAdapter();
}
