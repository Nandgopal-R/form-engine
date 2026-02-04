import type { Elysia } from "elysia";
import { logger } from "../../logger/";
import { auth } from "./index";

interface User {
  id: string;
}

export const requireAuth = (app: Elysia) =>
  app.derive(async (context) => {
    const session = await auth.api.getSession(context.request);
    if (!session?.user) {
      logger.warn("Unauthorized access attempt", { ip: context.request.url });
      context.set.status = 401;
      throw new Error("Unauthorized access");
    }
    return {
      user: session.user as User,
    };
  });
