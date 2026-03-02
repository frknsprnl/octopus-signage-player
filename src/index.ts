import { config } from './config';
import { MqttConnection } from './infrastructure/mqtt/MqttConnection';
import { CommandStream } from './web/CommandStream';
import { startWebServer } from './web/server';
import { PlaylistService } from './services/PlaylistService';

async function bootstrap(): Promise<void> {
  console.log(`[player] starting — device: ${config.device.id}, env: ${config.nodeEnv}`);

  const commandStream = new CommandStream();
  const playlistService = new PlaylistService(config.playlist.endpoint);

  playlistService.on('updated', (items) => {
    console.log(`[playlist] updated — ${items.length} item(s) loaded`);
  });

  playlistService.on('error', (err) => {
    console.warn(`[playlist] fetch error — ${err.message}, retrying…`);
  });

  startWebServer(commandStream, playlistService);

  void playlistService.fetch();

  const mqtt = new MqttConnection({
    brokerUrl: config.mqtt.brokerUrl,
    clientId: config.mqtt.clientId,
    username: config.mqtt.username,
    password: config.mqtt.password,
    deviceId: config.device.id,
  });

  mqtt.on('connected', () => {
    console.log(`[mqtt] connected — broker: ${config.mqtt.brokerUrl}`);
    console.log(`[mqtt] subscribed to: ${mqtt.topics.commands}`);
  });

  mqtt.on('disconnected', () => {
    console.warn('[mqtt] disconnected');
  });

  mqtt.on('reconnecting', ({ attempt, delayMs }) => {
    console.warn(`[mqtt] reconnecting — attempt ${attempt}, next try in ${delayMs}ms`);
  });

  mqtt.on('command', (cmd) => {
    console.log(`[mqtt] command received — ${cmd.command} (correlationId: ${cmd.correlationId})`);
    commandStream.push(cmd);

    if (cmd.command === 'reload_playlist') {
      void playlistService.fetch();
    }
  });

  mqtt.on('error', (err) => {
    console.error('[mqtt] error —', err.message);
  });

  mqtt.connect();

  const shutdown = (): void => {
    console.log('\n[player] shutting down...');
    mqtt.destroy();
    playlistService.destroy();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((err: unknown) => {
  console.error('[player] fatal error during bootstrap:', err);
  process.exit(1);
});
