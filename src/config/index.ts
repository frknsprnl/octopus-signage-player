export const config = {
  nodeEnv: process.env['NODE_ENV'] ?? 'development',

  playlist: {
    endpoint: process.env['PLAYLIST_ENDPOINT'] ?? 'http://localhost:3000/playlist',
  },

  mqtt: {
    brokerUrl: process.env['MQTT_BROKER_URL'] ?? 'mqtt://localhost:1883',
    clientId: process.env['MQTT_CLIENT_ID'] ?? `signage-player-${Date.now()}`,
    username: process.env['MQTT_USERNAME'],
    password: process.env['MQTT_PASSWORD'],
  },

  device: {
    id: process.env['DEVICE_ID'] ?? 'player-001',
  },

  log: {
    level: process.env['LOG_LEVEL'] ?? 'info',
  },

  platform: {
    /** 'browser' | 'tizen' — Tizen stub henüz implement edilmemiş */
    type: (process.env['PLATFORM'] ?? 'browser') as 'browser' | 'tizen',
  },
} as const;
