import type { IPlatformAdapter } from './IPlatformAdapter';

// Geliştirme ortamı için browser adapter'ı.
// Native platform API'ları olmadığından bazı işlemler tarayıcı tarafında (index.html) yapılıyor.
export class BrowserPlatformAdapter implements IPlatformAdapter {
  readonly name = 'browser';

  async setVolume(_level: number): Promise<boolean> {
    // Volume tarayıcıda media elementi üzerinden ayarlanıyor, buradan erişim yok
    return false;
  }

  async captureScreenshot(): Promise<{ base64: string; format: string } | null> {
    // Canvas üzerinden yapılıyor, cross-origin medya her zaman çalışmayabilir
    return null;
  }

  async restart(): Promise<void> {
    // Browser'da process restart yok; soft-restart browser tarafında yönetiliyor
  }
}
