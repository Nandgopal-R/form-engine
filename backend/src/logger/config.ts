import type { LoggerOptions } from "pino";

export function getLoggerConfig(env: string): LoggerOptions {
  const isProd = env === "production";

  return {
    level: isProd ? "info" : "debug",
    base: {
      service: "form-engine-backend",
      env,
    },
    transport: !isProd
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
          },
        }
      : undefined,
  };
}
