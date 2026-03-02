import type { IPlatformAdapter } from './IPlatformAdapter';

// Tizen / WebOS ortamı için stub. Gerçek Tizen API entegrasyonu yapıldığında buraya taşınacak.
export class TizenPlatformAdapter implements IPlatformAdapter {
  readonly name = 'tizen';

  async setVolume(_level: number): Promise<boolean> {
    throw new Error('Tizen setVolume not implemented yet');
  }

  async captureScreenshot(): Promise<{ base64: string; format: string } | null> {
    throw new Error('Tizen captureScreenshot not implemented yet');
  }

  async restart(): Promise<void> {
    throw new Error('Tizen restart not implemented yet');
  }
}
