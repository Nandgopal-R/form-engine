import { Elysia } from "elysia";
import { logger } from "./logger/index";
import { authRoutes } from "./api/auth/routes"
import { formRoutes } from "./api/forms/routes"

const app = new Elysia()
  .onError(({ code, set }) => {
    if (code === "VALIDATION") {
      set.status = 400;
      return {
        success: false,
        message: "Invalid data provided",
      };
    }
  })
  .get("/", () => "🦊 Elysia server started")
  .use(authRoutes)
  .use(formRoutes);

app.listen(8000);

if (app.server) {
  logger.success("🦊 Elysia server started", {
    host: app.server.hostname,
    port: app.server.port,
  });
} else {
  logger.error("Elysia server failed to start");
}
