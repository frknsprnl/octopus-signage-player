import { MqttConnection } from './MqttConnection';
import { config } from '../../config';

// MQTT bağlantısını config'den okuyarak oluşturur
export function createMqttConnection(): MqttConnection {
  return new MqttConnection({
    brokerUrl: config.mqtt.brokerUrl,
    clientId: config.mqtt.clientId,
    username: config.mqtt.username,
    password: config.mqtt.password,
    deviceId: config.device.id,
  });
}
