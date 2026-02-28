import type { IncomingCommand } from '../infrastructure/mqtt/types';

const MAX_COMMANDS = 100;

/** Son gelen MQTT komutlarını tutar ve SSE abonelerine yayar */
export class CommandStream {
  private commands: IncomingCommand[] = [];
  private listeners: ((cmd: IncomingCommand) => void)[] = [];

  push(cmd: IncomingCommand): void {
    this.commands.unshift(cmd);
    if (this.commands.length > MAX_COMMANDS) this.commands.pop();
    this.listeners.forEach((fn) => fn(cmd));
  }

  subscribe(listener: (cmd: IncomingCommand) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  getRecent(): IncomingCommand[] {
    return [...this.commands];
  }
}
