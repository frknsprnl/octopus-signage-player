// Tizen / WebOS gibi platformlara özgü API'ları soyutlar.
// Her platform için ayrı bir implementasyon yazılır; uygulama kodu platforma bağımlı kalmaz.
export interface IPlatformAdapter {
  /** Desteklenmiyorsa false döner. */
  setVolume(level: number): Promise<boolean>;

  /** Platform izin vermiyorsa null döner. */
  captureScreenshot(): Promise<{ base64: string; format: string } | null>;

  restart(): Promise<void>;

  readonly name: string;
}
