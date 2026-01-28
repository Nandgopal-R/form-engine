import { Elysia } from "elysia";
import { auth } from "./index";
import { logger } from "../../logger/";

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
