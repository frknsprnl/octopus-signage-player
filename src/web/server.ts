import express, { Request, Response } from 'express';
import path from 'path';
import type { CommandStream } from './CommandStream';
import type { PlaylistService } from '../services/PlaylistService';
import type { OutgoingEvent } from '../infrastructure/mqtt/types';

const PORT = Number(process.env['WEB_PORT'] ?? 8080);

/** Monitoring için minimal durum bilgisi */
export interface HealthStatus {
  mqttConnected: boolean;
  playlistItemCount: number;
  lastPlaylistError?: string;
}

export function createWebServer(
  stream: CommandStream,
  playlistService: PlaylistService,
  publishEvent: (event: OutgoingEvent) => void,
  getHealthStatus: () => HealthStatus,
): { app: express.Express; port: number } {
  const app = express();

  app.use(express.json());

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json(getHealthStatus());
  });

  app.get('/', (_req: Request, res: Response) => {
    res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
  });

  app.get('/api/playlist', (_req: Request, res: Response) => {
    res.json({ playlist: playlistService.playlist });
  });

  app.get('/api/commands', (_req: Request, res: Response) => {
    res.json(stream.getRecent());
  });

  /**
   * Browser-side komutların (play/pause/set_volume/screenshot) sonuçlarını
   * alır ve MQTT events topic'ine yayar.
   */
  app.post('/api/ack', (req: Request, res: Response) => {
    const event = req.body as OutgoingEvent;

    if (!event?.type || !event?.status) {
      res.status(400).json({ error: 'Missing type or status' });
      return;
    }

    publishEvent(event);
    res.status(204).end();
  });

  app.get('/events', (req: Request, res: Response) => {
    req.socket.setTimeout(0);
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const unsubscribe = stream.subscribe((cmd) => {
      res.write(`data: ${JSON.stringify(cmd)}\n\n`);
    });

    req.on('close', () => unsubscribe());
  });

  return { app, port: PORT };
}

export function startWebServer(
  stream: CommandStream,
  playlistService: PlaylistService,
  publishEvent: (event: OutgoingEvent) => void,
  getHealthStatus: () => HealthStatus,
): void {
  const { app, port } = createWebServer(stream, playlistService, publishEvent, getHealthStatus);
  app.listen(port, () => {
    console.log(`[web] UI: http://localhost:${port}`);
  });
}
