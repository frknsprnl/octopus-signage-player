import type { IEventPublisher, IPlaylistRepository, ICommandBus } from '../core/ports';
import type { IncomingCommand, OutgoingEvent } from '../infrastructure/mqtt/types';

// reload_playlist ve restart_player burada işlenir, ack MQTT'e gönderilir.
// play/pause/set_volume/screenshot SSE ile browser'a iletilir; ack browser'dan POST /api/ack ile gelir.
// Aynı correlationId 30sn içinde tekrar gelirse görmezden gelinir.

const PROCESSED_TTL_MS = 30_000;
const MAX_PROCESSED_SIZE = 500;

export class CommandHandler {
  private readonly processed = new Map<string, number>(); // correlationId → timestamp

  constructor(
    private readonly eventPublisher: IEventPublisher,
    private readonly playlistRepo: IPlaylistRepository,
    private readonly commandBus: ICommandBus,
  ) {}

  async handle(cmd: IncomingCommand): Promise<void> {
    if (this.isDuplicate(cmd.correlationId)) {
      console.warn(`[cmd] duplicate ignored — ${cmd.command} (${cmd.correlationId})`);
      return;
    }

    this.markProcessed(cmd.correlationId);
    console.log(`[cmd] handling — ${cmd.command} (${cmd.correlationId})`);

    this.commandBus.push(cmd);

    switch (cmd.command) {
      case 'reload_playlist':
        await this.handleReloadPlaylist(cmd);
        break;

      case 'restart_player':
        await this.handleRestartPlayer(cmd);
        break;

      case 'play':
      case 'pause':
      case 'set_volume':
      case 'screenshot':
        break;
    }
  }

  publishAck(event: OutgoingEvent): void {
    this.eventPublisher.publishEvent(event);
    console.log(`[cmd] ack — ${event.command ?? event.type} (${event.correlationId}) → ${event.status}`);
  }

  private async handleReloadPlaylist(cmd: IncomingCommand): Promise<void> {
    const ok = await this.playlistRepo.fetch();

    if (ok) {
      this.publishAck({
        type: 'command_result',
        command: 'reload_playlist',
        correlationId: cmd.correlationId,
        status: 'success',
        payload: { itemCount: this.playlistRepo.playlist.length },
      });
    } else {
      this.publishAck({
        type: 'command_result',
        command: 'reload_playlist',
        correlationId: cmd.correlationId,
        status: 'error',
        error: {
          code: 'RELOAD_FAILED',
          message: 'Playlist endpoint unreachable or returned invalid response',
        },
      });
    }
  }

  private async handleRestartPlayer(cmd: IncomingCommand): Promise<void> {
    await this.playlistRepo.fetch();

    // Browser SSE ile zaten haberdar edildi, loadAndPlay(false) orada tetikleniyor
    this.publishAck({
      type: 'command_result',
      command: 'restart_player',
      correlationId: cmd.correlationId,
      status: 'success',
    });
  }

  private isDuplicate(correlationId: string): boolean {
    const ts = this.processed.get(correlationId);
    if (ts === undefined) return false;
    return Date.now() - ts < PROCESSED_TTL_MS;
  }

  private markProcessed(correlationId: string): void {
    this.processed.set(correlationId, Date.now());
    if (this.processed.size > MAX_PROCESSED_SIZE) {
      this.evictExpired();
    }
  }

  private evictExpired(): void {
    const cutoff = Date.now() - PROCESSED_TTL_MS;
    for (const [id, ts] of this.processed) {
      if (ts < cutoff) this.processed.delete(id);
    }
  }
}
