import { Elysia } from "elysia";
import { auth } from "./index";

export const authRoutes = new Elysia()
  .mount(auth.handler)
  // Direct navigation endpoint for Google OAuth (avoids XHR/cookie blocking)
  .get("/signin/google", async ({ set, query }) => {
    const callbackURL =
      query.callback || `${process.env.FRONTEND_URL}/dashboard`;
    // Generate OAuth URL using better-auth's method
    const state = Buffer.from(JSON.stringify({ callbackURL })).toString(
      "base64url",
    );
    const googleAuthUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${process.env.GOOGLE_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(`${process.env.BETTER_AUTH_URL}/api/auth/callback/google`)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent("openid email profile")}` +
      `&state=${state}` +
      `&access_type=offline` +
      `&prompt=select_account`;

    set.redirect = googleAuthUrl;
  });
