import { requireAuth } from "../auth/requireAuth";
import { getAllFields } from "./controller"
import { getAllFieldsDTO } from "../../types/form-fields";
import { Elysia } from "elysia";

export const formFieldRoutes = new Elysia({ prefix: "/fields" })
  .use(requireAuth)
  .get("/:formId", getAllFields, getAllFieldsDTO);

