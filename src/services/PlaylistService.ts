import { EventEmitter } from 'events';
import type { PlaylistItem } from '../domain/playlist';

export declare interface PlaylistService {
  on(event: 'updated', listener: (items: PlaylistItem[]) => void): this;
  on(event: 'error', listener: (err: Error) => void): this;
  emit(event: 'updated', items: PlaylistItem[]): boolean;
  emit(event: 'error', err: Error): boolean;
}

const RETRY_BASE_MS = 5_000;
const RETRY_MAX_MS = 60_000;
const RETRY_MULTIPLIER = 2;
const FETCH_TIMEOUT_MS = 10_000;

export class PlaylistService extends EventEmitter {
  private items: PlaylistItem[] = [];
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private retryDelay = RETRY_BASE_MS;
  private destroyed = false;

  constructor(private readonly endpoint: string) {
    super();
  }

  get playlist(): PlaylistItem[] {
    return [...this.items];
  }

  /** Başarılıysa true döner, hata olursa retry planlanır ve false döner. */
  async fetch(): Promise<boolean> {
    this.clearRetry();
    if (this.destroyed) return false;

    try {
      const res = await fetch(this.endpoint, {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status} from playlist endpoint`);

      const data = (await res.json()) as { playlist?: PlaylistItem[] };
      this.items = Array.isArray(data.playlist) ? data.playlist : [];
      this.retryDelay = RETRY_BASE_MS;
      this.emit('updated', this.items);
      return true;
    } catch (err) {
      this.emit('error', err instanceof Error ? err : new Error(String(err)));
      this.scheduleRetry();
      return false;
    }
  }

  destroy(): void {
    this.destroyed = true;
    this.clearRetry();
    this.removeAllListeners();
  }

  private scheduleRetry(): void {
    if (this.destroyed) return;
    this.retryTimer = setTimeout(() => {
      void this.fetch();
    }, this.retryDelay);
    this.retryDelay = Math.min(this.retryDelay * RETRY_MULTIPLIER, RETRY_MAX_MS);
  }

  private clearRetry(): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }
}
