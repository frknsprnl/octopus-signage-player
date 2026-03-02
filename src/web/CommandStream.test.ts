import { describe, it, expect } from 'vitest';
import { CommandStream } from './CommandStream';
import type { IncomingCommand } from '../infrastructure/mqtt/types';

function cmd(command: string, correlationId: string): IncomingCommand {
  return { command: command as IncomingCommand['command'], correlationId, timestamp: Date.now() };
}

describe('CommandStream', () => {
  it('stores pushed command and returns it as first item in getRecent()', () => {
    const stream = new CommandStream();
    const c = cmd('play', 'corr-1');
    stream.push(c);
    expect(stream.getRecent()[0]).toBe(c);
    expect(stream.getRecent()).toHaveLength(1);
  });

  it('calls subscribed listener with the command when push() is called', () => {
    const stream = new CommandStream();
    const received: IncomingCommand[] = [];
    stream.subscribe((c) => received.push(c));
    stream.push(cmd('pause', 'corr-2'));
    expect(received).toHaveLength(1);
    expect(received[0].command).toBe('pause');
  });

  it('stops notifying listener after unsubscribe is called', () => {
    const stream = new CommandStream();
    const received: IncomingCommand[] = [];
    const unsub = stream.subscribe((c) => received.push(c));
    stream.push(cmd('play', 'c1'));
    unsub();
    stream.push(cmd('pause', 'c2'));
    expect(received).toHaveLength(1);
  });
});
