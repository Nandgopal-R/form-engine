import { Elysia } from "elysia";
import { logger } from "./logger/index";

const app = new Elysia().get("/", () => "Hello Elysia").listen(8000);

if (app.server) {
  logger.success("🦊 Elysia server started", {
    host: app.server.hostname,
    port: app.server.port,
  });
} else {
  logger.error("Elysia server failed to start");
}
