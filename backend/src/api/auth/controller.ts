import { auth } from "./index";
import { logger } from "../../logger";

export async function authController(request: Request): Promise<Response> {
  const start = performance.now();
  const url = new URL(request.url);

  try {
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

    logger.error("Auth controller crashed", error, {
      method: request.method,
      path: url.pathname,
      durationMs,
    });

    return new Response(
      JSON.stringify({ error: "Internal authentication error" }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      }
    );
  }
}
