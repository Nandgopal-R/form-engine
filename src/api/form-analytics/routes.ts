import { Elysia } from "elysia";
import { formAnalyticsDTO } from "../../types/form-analytics";
import { requireAuth } from "../auth/requireAuth";
import { getFormAnalytics } from "./controller";

export const formAnalyticsRoutes = new Elysia({ prefix: "/forms" })
  .use(requireAuth)
  .post("/:formId/analytics", getFormAnalytics, formAnalyticsDTO);
