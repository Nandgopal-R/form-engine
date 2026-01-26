import { Elysia } from "elysia";
import { auth } from "./index";

export const authRoutes = new Elysia()
  .mount(auth.handler)
