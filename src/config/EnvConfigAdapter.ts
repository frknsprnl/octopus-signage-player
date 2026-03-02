import type { IConfigProvider } from '../core/ports';

/** process.env tabanlı config; production / geliştirme ortamında kullanılır. */
export class EnvConfigAdapter implements IConfigProvider {
  getNodeEnv(): string {
    return process.env['NODE_ENV'] ?? 'development';
  }

  getDeviceId(): string {
    return process.env['DEVICE_ID'] ?? 'player-001';
  }

  getPlaylistEndpoint(): string {
    return process.env['PLAYLIST_ENDPOINT'] ?? 'http://localhost:3000/playlist';
  }

  getMqttBrokerUrl(): string {
    return process.env['MQTT_BROKER_URL'] ?? 'mqtt://localhost:1883';
  }

  getMqttClientId(): string {
    return process.env['MQTT_CLIENT_ID'] ?? `signage-player-${Date.now()}`;
  }

  getMqttUsername(): string | undefined {
    return process.env['MQTT_USERNAME'];
  }

  getMqttPassword(): string | undefined {
    return process.env['MQTT_PASSWORD'];
  }

  getLogLevel(): string {
    return process.env['LOG_LEVEL'] ?? 'info';
  }

  getPlatformType(): 'browser' | 'tizen' {
    return (process.env['PLATFORM'] ?? 'browser') as 'browser' | 'tizen';
  }
}
