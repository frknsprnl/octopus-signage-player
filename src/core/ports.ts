import type { OutgoingEvent } from '../infrastructure/mqtt/types';
import type { PlaylistItem } from '../domain/playlist';
import type { IncomingCommand } from '../infrastructure/mqtt/types';

// Katmanlar arası bağımlılıkları kırmak için interface tanımları burada.
// Somut sınıflar yerine bunlara bağımlı olunuyor.

/** MQTT events topic'ine mesaj yayar. */
export interface IEventPublisher {
  publishEvent(event: OutgoingEvent): void;
}

/** Playlist'i çeker ve bellekte tutar. */
export interface IPlaylistRepository {
  readonly playlist: PlaylistItem[];
  fetch(): Promise<boolean>;
}

/** Gelen komutları dinleyicilere iletir. */
export interface ICommandBus {
  push(cmd: IncomingCommand): void;
}

/** Uygulama konfigürasyonu; testte mock, production'da env-based adapter kullanılır. */
export interface IConfigProvider {
  getNodeEnv(): string;
  getDeviceId(): string;
  getPlaylistEndpoint(): string;
  getMqttBrokerUrl(): string;
  getMqttClientId(): string;
  getMqttUsername(): string | undefined;
  getMqttPassword(): string | undefined;
  getLogLevel(): string;
  getPlatformType(): 'browser' | 'tizen';
}
