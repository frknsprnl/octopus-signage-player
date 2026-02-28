import { config } from './config';
import { MqttConnection } from './infrastructure/mqtt/MqttConnection';

async function bootstrap(): Promise<void> {
  console.log(`[player] starting — device: ${config.device.id}, env: ${config.nodeEnv}`);

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
  });

  mqtt.on('error', (err) => {
    console.error('[mqtt] error —', err.message);
  });

  mqtt.connect();

  const shutdown = (): void => {
    console.log('\n[player] shutting down...');
    mqtt.destroy();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((err: unknown) => {
  console.error('[player] fatal error during bootstrap:', err);
  process.exit(1);
});
