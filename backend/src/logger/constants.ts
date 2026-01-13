export const LOG_LEVELS = {
  trace: "trace",
  debug: "debug",
  info: "info",
  warn: "warn",
  error: "error",
  fatal: "fatal",
} as const;

export type LogLevel = keyof typeof LOG_LEVELS;

export const ENVIRONMENTS = {
  development: "development",
  production: "production",
} as const;

export type Environment = keyof typeof ENVIRONMENTS;
