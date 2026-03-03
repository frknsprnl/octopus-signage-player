import type { Command, CommandName, CommandResultStatus } from '../../domain/command';

// Domain tiplerini burada tekrar export ediyoruz ki mevcut import yolları bozulmasın.
export type { CommandName };
export interface IncomingCommand extends Command {}
export type EventStatus = CommandResultStatus;

export interface OutgoingEvent {
  type: 'command_result' | 'status' | 'heartbeat' | 'log';
  command?: CommandName;
  correlationId?: string;
  status: EventStatus;
  payload?: Record<string, unknown>;
  error?: {
    code: string;
    message: string;
  };
}

export interface MqttConnectionOptions {
  brokerUrl: string;
  clientId: string;
  username?: string;
  password?: string;
  deviceId: string;
}

export interface ReconnectInfo {
  attempt: number;
  delayMs: number;
}
