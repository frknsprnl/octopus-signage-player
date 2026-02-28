import mqtt, { MqttClient } from 'mqtt';
import { EventEmitter } from 'events';
import type {
  MqttConnectionOptions,
  IncomingCommand,
  OutgoingEvent,
  ReconnectInfo,
} from './types';

const BACKOFF_BASE_MS = 1_000;
const BACKOFF_MAX_MS = 30_000;
const BACKOFF_MULTIPLIER = 2;
const CONNECT_TIMEOUT_MS = 10_000;

// Small random jitter to prevent multiple devices from reconnecting simultaneously
const jitter = (): number => Math.floor(Math.random() * 500);

export interface MqttConnectionEvents {
  connected: () => void;
  disconnected: () => void;
  reconnecting: (info: ReconnectInfo) => void;
  command: (cmd: IncomingCommand) => void;
  error: (err: Error) => void;
}

export declare interface MqttConnection {
  on<K extends keyof MqttConnectionEvents>(event: K, listener: MqttConnectionEvents[K]): this;
  emit<K extends keyof MqttConnectionEvents>(
    event: K,
    ...args: Parameters<MqttConnectionEvents[K]>
  ): boolean;
}

export class MqttConnection extends EventEmitter {
  private client: MqttClient | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;

  private readonly commandTopic: string;
  private readonly eventsTopic: string;

  constructor(private readonly options: MqttConnectionOptions) {
    super();
    this.commandTopic = `players/${options.deviceId}/commands`;
    this.eventsTopic = `players/${options.deviceId}/events`;
  }

  connect(): void {
    if (this.destroyed) return;

    this.client = mqtt.connect(this.options.brokerUrl, {
      clientId: this.options.clientId,
      username: this.options.username,
      password: this.options.password,
      reconnectPeriod: 0,
      connectTimeout: CONNECT_TIMEOUT_MS,
      clean: true,
    });

    this.attachHandlers();
  }

  publishEvent(payload: OutgoingEvent): void {
    if (!this.client?.connected) return;

    this.client.publish(this.eventsTopic, JSON.stringify(payload), { qos: 1 }, (err) => {
      if (err) this.emit('error', err);
    });
  }

  destroy(): void {
    this.destroyed = true;
    this.clearReconnectTimer();
    this.client?.end(true);
    this.removeAllListeners();
  }

  get connected(): boolean {
    return this.client?.connected ?? false;
  }

  get topics(): { commands: string; events: string } {
    return { commands: this.commandTopic, events: this.eventsTopic };
  }

  private attachHandlers(): void {
    if (!this.client) return;

    this.client.on('connect', () => {
      this.reconnectAttempts = 0;
      this.subscribe();
      this.emit('connected');
    });

    this.client.on('message', (_topic, payload) => {
      this.handleRawMessage(payload);
    });

    this.client.on('error', (err) => {
      this.emit('error', err);
    });

    this.client.on('close', () => {
      if (!this.destroyed) {
        this.emit('disconnected');
        this.scheduleReconnect();
      }
    });
  }

  private subscribe(): void {
    this.client?.subscribe(this.commandTopic, { qos: 1 }, (err) => {
      if (err) this.emit('error', err);
    });
  }

  private handleRawMessage(payload: Buffer): void {
    let parsed: unknown;

    try {
      parsed = JSON.parse(payload.toString());
    } catch {
      this.emit('error', new Error('Received non-JSON MQTT message'));
      return;
    }

    if (!this.isValidCommand(parsed)) {
      this.emit('error', new Error('Received MQTT message with invalid command shape'));
      return;
    }

    this.emit('command', parsed);
  }

  private isValidCommand(value: unknown): value is IncomingCommand {
    if (typeof value !== 'object' || value === null) return false;
    const obj = value as Record<string, unknown>;
    return (
      typeof obj['command'] === 'string' &&
      typeof obj['correlationId'] === 'string' &&
      typeof obj['timestamp'] === 'number'
    );
  }

  private scheduleReconnect(): void {
    if (this.destroyed) return;

    const base = BACKOFF_BASE_MS * Math.pow(BACKOFF_MULTIPLIER, this.reconnectAttempts);
    const delayMs = Math.min(base, BACKOFF_MAX_MS) + jitter();

    this.reconnectAttempts++;
    this.emit('reconnecting', { attempt: this.reconnectAttempts, delayMs });

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delayMs);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
