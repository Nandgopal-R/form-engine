import { Elysia } from "elysia";
import { authController } from "./controller";

export const authRoutes = new Elysia({ prefix: "/auth" })
  .onRequest(({ request }) => authController(request));
