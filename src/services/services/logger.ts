// Simple structured logger for demonstration. Replace/extend with Winston, Pino, etc. for production.
export class Logger {
  static info(message: string, ...args: any[]) {
    console.info(`[INFO] ${message}`, ...args);
  }
  static warn(message: string, ...args: any[]) {
    console.warn(`[WARN] ${message}`, ...args);
  }
  static error(message: string, ...args: any[]) {
    console.error(`[ERROR] ${message}`, ...args);
  }
  static debug(message: string, ...args: any[]) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }
}
