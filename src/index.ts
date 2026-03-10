import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";
import { authRoutes } from "./api/auth/routes";
import { formFieldRoutes } from "./api/form-fields/routes";
import { formResponseRoutes } from "./api/form-response/routes";
import { formRoutes, publicFormRoutes } from "./api/forms/routes";
import { logger } from "./logger/index";

const app = new Elysia()
  .use(
    cors({
      origin:
        process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",").map((o) =>
          o.trim(),
        ) || "*",
      credentials: true,
    }),
  )

  .onError(({ code, error, set, request }) => {
    // A. Validation Errors (TypeBox)
    if (code === "VALIDATION") {
      set.status = 400;
      return {
        success: false,
        message: "Invalid data provided",
      };
    }

    // B. Handle 404s (Wrong URL)
    if (code === "NOT_FOUND") {
      set.status = 404;
      return {
        success: false,
        message: "Resource not found",
      };
    }

    // C. Handle known HTTP errors (e.g. invalid JSON body)
    if (code === "PARSE") {
      set.status = 400;
      return { success: false, message: "Invalid JSON body" };
    }

    // D. The "Catch-All" for crashes
    logger.error(`Server Error: ${request.method} ${request.url}`, error);

    set.status = 500;
    return {
      success: false,
      message: "Internal server error",
    };
  })
  .get("/", () => "🦊 Elysia server started")
  .use(authRoutes)
  .use(publicFormRoutes) // Public routes first (no auth)
  .use(formRoutes)
  .use(formFieldRoutes)
  .use(formResponseRoutes);

const port = Number(process.env.PORT) || 8000;
app.listen({
  port,
  hostname: "0.0.0.0",
});

if (app.server) {
  logger.success(`🦊 Elysia server started on port ${port}`, {
    host: app.server.hostname,
    port: app.server.port,
  });
} else {
  logger.error("Elysia server failed to start");
}
