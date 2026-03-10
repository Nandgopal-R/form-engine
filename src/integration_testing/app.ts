// Builds the Elysia app WITHOUT starting the server (for testing with app.handle())
import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";
import { formAnalyticsRoutes } from "../api/form-analytics/routes";
import {
  formFieldRoutes,
  publicFormFieldRoutes,
} from "../api/form-fields/routes";
import { formResponseRoutes } from "../api/form-response/routes";
import { formRoutes, publicFormRoutes } from "../api/forms/routes";

export const app = new Elysia()
  .use(
    cors({
      origin: "*",
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
      exposeHeaders: ["Set-Cookie"],
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    }),
  )
  .onError(({ code, set }) => {
    if (code === "VALIDATION") {
      set.status = 400;
      return { success: false, message: "Invalid data provided" };
    }
    if (code === "NOT_FOUND") {
      set.status = 404;
      return { success: false, message: "Resource not found" };
    }
    if (code === "PARSE") {
      set.status = 400;
      return { success: false, message: "Invalid JSON body" };
    }
    // Preserve status if already set by middleware (e.g. requireAuth sets 401)
    const currentStatus = set.status;
    if (
      typeof currentStatus === "number" &&
      currentStatus >= 400 &&
      currentStatus < 600
    ) {
      return { success: false, message: "Unauthorized access" };
    }
    set.status = 500;
    return { success: false, message: "Internal server error" };
  })
  .use(publicFormRoutes)
  .use(publicFormFieldRoutes)
  .use(formRoutes)
  .use(formFieldRoutes)
  .use(formResponseRoutes)
  .use(formAnalyticsRoutes);
