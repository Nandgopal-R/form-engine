import { Elysia } from "elysia";
import { auth } from "./index";

export const requireAuth = new Elysia().onBeforeHandle(
  async ({ request, set }) => {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      set.status = 401;
      return {
        error: "Unauthorized",
      };
    }

    return {
      user: session.user,
      session,
    };
  }
);
