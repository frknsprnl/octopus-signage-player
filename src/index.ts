import { config } from './config';
import { createMqttConnection } from './infrastructure/mqtt/MqttConnectionFactory';
import { createPlatformAdapter } from './platform/PlatformAdapterFactory';
import { CommandStream } from './web/CommandStream';
import { startWebServer } from './web/server';
import { PlaylistService } from './services/PlaylistService';
import { CommandHandler } from './handlers/CommandHandler';
import { logger } from './infrastructure/logger/Logger';

async function bootstrap(): Promise<void> {
  const platform = createPlatformAdapter(config.platform.type);
  logger.info(`player starting — device: ${config.device.id}, env: ${config.nodeEnv}, platform: ${platform.name}`);

  const commandStream = new CommandStream();
  const playlistService = new PlaylistService(config.playlist.endpoint);

  playlistService.on('updated', (items) => {
    logger.info(`playlist updated — ${items.length} item(s) loaded`);
  });

  playlistService.on('error', (err) => {
    logger.warn(`playlist fetch error — ${err.message}, retrying…`);
  });

  const mqtt = createMqttConnection();
  const commandHandler = new CommandHandler(mqtt, playlistService, commandStream);

  startWebServer(commandStream, playlistService, (event) => mqtt.publishEvent(event));

  void playlistService.fetch();

  mqtt.on('connected', () => {
    logger.info(`mqtt connected — broker: ${config.mqtt.brokerUrl}`);
    logger.info(`mqtt subscribed to: ${mqtt.topics.commands}`);
  });

  mqtt.on('disconnected', () => {
    logger.warn('mqtt disconnected');
  });

  mqtt.on('reconnecting', ({ attempt, delayMs }) => {
    logger.warn(`mqtt reconnecting — attempt ${attempt}, next try in ${delayMs}ms`);
  });

  mqtt.on('command', (cmd) => {
    void commandHandler.handle(cmd);
  });

  mqtt.on('error', (err) => {
    logger.error(`mqtt error — ${err.message}`);
  });

  mqtt.connect();

  const shutdown = (): void => {
    logger.info('player shutting down…');
    mqtt.destroy();
    playlistService.destroy();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[error] fatal error during bootstrap: ${message}`);
  process.exit(1);
});
