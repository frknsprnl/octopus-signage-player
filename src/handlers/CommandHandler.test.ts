import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CommandHandler } from './CommandHandler';
import type { IncomingCommand, OutgoingEvent } from '../infrastructure/mqtt/types';
import type { IEventPublisher, IPlaylistRepository, ICommandBus } from '../core/ports';

function cmd(command: IncomingCommand['command'], correlationId: string): IncomingCommand {
  return { command, correlationId, timestamp: Date.now() };
}

describe('CommandHandler', () => {
  let publishEvent: ReturnType<typeof vi.fn>;
  let eventPublisher: IEventPublisher;
  let fetchMock: ReturnType<typeof vi.fn>;
  let playlistRepo: IPlaylistRepository;
  let commandBusPush: ReturnType<typeof vi.fn>;
  let commandBus: ICommandBus;
  let handler: CommandHandler;

  beforeEach(() => {
    publishEvent = vi.fn();
    eventPublisher = { publishEvent };
    fetchMock = vi.fn();
    playlistRepo = {
      get playlist() {
        return [{ type: 'image' as const, url: 'http://a/b.jpg' }];
      },
      fetch: fetchMock,
    };
    commandBusPush = vi.fn();
    commandBus = { push: commandBusPush };
    handler = new CommandHandler(eventPublisher, playlistRepo, commandBus);
  });

  it('reload_playlist success sends ack with itemCount', async () => {
    fetchMock.mockResolvedValue(true);
    await handler.handle(cmd('reload_playlist', 'id-1'));
    expect(publishEvent).toHaveBeenCalledTimes(1);
    const ev = publishEvent.mock.calls[0][0] as OutgoingEvent;
    expect(ev.status).toBe('success');
    expect(ev.payload?.itemCount).toBe(1);
  });

  it('reload_playlist fail sends ack with RELOAD_FAILED', async () => {
    fetchMock.mockResolvedValue(false);
    await handler.handle(cmd('reload_playlist', 'id-2'));
    expect(publishEvent).toHaveBeenCalledTimes(1);
    const ev = publishEvent.mock.calls[0][0] as OutgoingEvent;
    expect(ev.status).toBe('error');
    expect(ev.error?.code).toBe('RELOAD_FAILED');
  });

  it('restart_player sends success ack', async () => {
    fetchMock.mockResolvedValue(false);
    await handler.handle(cmd('restart_player', 'id-3'));
    expect(publishEvent).toHaveBeenCalledWith(
      expect.objectContaining({ command: 'restart_player', status: 'success' }),
    );
  });

  it('forwards command to bus and does not ack play', async () => {
    await handler.handle(cmd('play', 'id-4'));
    expect(commandBusPush).toHaveBeenCalledWith(expect.objectContaining({ command: 'play' }));
    expect(publishEvent).not.toHaveBeenCalled();
  });

  it('ignores duplicate correlationId', async () => {
    fetchMock.mockResolvedValue(true);
    await handler.handle(cmd('reload_playlist', 'dup-id'));
    await handler.handle(cmd('reload_playlist', 'dup-id'));
    expect(publishEvent).toHaveBeenCalledTimes(1);
    expect(commandBusPush).toHaveBeenCalledTimes(1);
  });
});
