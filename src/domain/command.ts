export type CommandName =
  | 'reload_playlist'
  | 'restart_player'
  | 'play'
  | 'pause'
  | 'set_volume'
  | 'screenshot';

export interface Command {
  command: CommandName;
  correlationId: string;
  timestamp: number;
  payload?: Record<string, unknown>;
}

export type CommandResultStatus = 'success' | 'error';

