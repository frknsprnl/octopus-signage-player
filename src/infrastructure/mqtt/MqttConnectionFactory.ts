import type { IConfigProvider } from '../../core/ports';
import { MqttConnection } from './MqttConnection';

export function createMqttConnection(cfg: IConfigProvider): MqttConnection {
  return new MqttConnection({
    brokerUrl: cfg.getMqttBrokerUrl(),
    clientId: cfg.getMqttClientId(),
    username: cfg.getMqttUsername(),
    password: cfg.getMqttPassword(),
    deviceId: cfg.getDeviceId(),
  });
}
