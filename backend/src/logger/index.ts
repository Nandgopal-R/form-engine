import pino from "pino";
import { getLoggerConfig } from "./config";

// Use Bun.env if available, fallback to process.env
const env = process.env.NODE_ENV || "development";

export const baseLogger = pino(getLoggerConfig(env));

// semantic helpers
export const logger = {
  // Allow calling info("message") without the data object
  info: (msg: string, data?: object) => baseLogger.info(data || {}, msg),

  // "success" isn't a pino level, but logging it as info with a tag is smart
  success: (msg: string, data?: object) =>
    baseLogger.info({ ...data, success: true }, msg),

  warn: (msg: string, data?: object) => baseLogger.warn(data || {}, msg),

  // Robust error handling
  error: (msg: string, err?: unknown, data?: object) => {
    const serializedErr = err instanceof Error ? err : new Error(String(err));
    baseLogger.error({ ...data, err: serializedErr }, msg);
  },

  child: (bindings: object) => baseLogger.child(bindings),
};
