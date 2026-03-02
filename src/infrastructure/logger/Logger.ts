type LogLevel = 'info' | 'warn' | 'error';

const LEVELS: Record<LogLevel, number> = { info: 0, warn: 1, error: 2 };

// LOG_LEVEL env ile minimum seviye ayarlanabilir (varsayılan: info)
class Logger {
  private static instance: Logger;
  private readonly minLevel: number;

  private constructor(level: LogLevel) {
    this.minLevel = LEVELS[level];
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      const level = (process.env['LOG_LEVEL'] ?? 'info') as LogLevel;
      Logger.instance = new Logger(level);
    }
    return Logger.instance;
  }

  info(message: string): void {
    if (LEVELS['info'] >= this.minLevel) console.log(`[info]  ${message}`);
  }

  warn(message: string): void {
    if (LEVELS['warn'] >= this.minLevel) console.warn(`[warn]  ${message}`);
  }

  error(message: string): void {
    if (LEVELS['error'] >= this.minLevel) console.error(`[error] ${message}`);
  }
}

export const logger = Logger.getInstance();
