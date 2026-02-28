export type CommandName =
  | 'reload_playlist'
  | 'restart_player'
  | 'play'
  | 'pause'
  | 'set_volume'
  | 'screenshot';

export interface IncomingCommand {
  command: CommandName;
  correlationId: string;
  timestamp: number;
  payload?: Record<string, unknown>;
}

export type EventStatus = 'success' | 'error';

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
