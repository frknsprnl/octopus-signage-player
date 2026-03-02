import express, { Request, Response } from 'express';
import path from 'path';
import type { CommandStream } from './CommandStream';
import type { PlaylistService } from '../services/PlaylistService';

const PORT = Number(process.env['WEB_PORT'] ?? 8080);

export function createWebServer(
  stream: CommandStream,
  playlistService: PlaylistService,
): { app: express.Express; port: number } {
  const app = express();

  app.get('/', (_req: Request, res: Response) => {
    res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
  });

  app.get('/api/playlist', (_req: Request, res: Response) => {
    res.json({ playlist: playlistService.playlist });
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

  app.get('/api/commands', (_req: Request, res: Response) => {
    res.json(stream.getRecent());
  });

  return { app, port: PORT };
}

export function startWebServer(stream: CommandStream, playlistService: PlaylistService): void {
  const { app, port } = createWebServer(stream, playlistService);
  app.listen(port, () => {
    console.log(`[web] UI: http://localhost:${port}`);
  });
}
