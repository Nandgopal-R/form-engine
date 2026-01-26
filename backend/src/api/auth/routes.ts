import { Elysia } from "elysia";
import { auth } from "./index";
import { logger } from "../../logger";

export const authRoutes = new Elysia({ prefix: "/auth" })
  .onRequest(async ({ request }) => {
    const start = performance.now();
    const url = new URL(request.url);

    try {
      logger.info("Auth request received", {
        method: request.method,
        path: url.pathname,
        userAgent: request.headers.get("user-agent"),
      });

      const response = await auth.handler(request);

      const durationMs = Math.round(performance.now() - start);

      if (response.status >= 400) {
        logger.warn("Auth request failed", {
          method: request.method,
          path: url.pathname,
          status: response.status,
          durationMs,
        });
      } else {
        logger.info("Auth request succeeded", {
          method: request.method,
          path: url.pathname,
          status: response.status,
          durationMs,
        });
      }

      return response;
    } catch (error) {
      const durationMs = Math.round(performance.now() - start);

      logger.error("Auth handler crashed", error, {
        method: request.method,
        path: url.pathname,
        durationMs,
      });

      return new Response(
        JSON.stringify({ error: "Internal authentication error" }),
        { status: 500, headers: { "content-type": "application/json" } }
      );
    }
  });
