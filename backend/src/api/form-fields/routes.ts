import { requireAuth } from "../auth/requireAuth";
import { getAllFields, createField } from "./controller"
import { getAllFieldsDTO, createFieldDTO } from "../../types/form-fields";
import { Elysia } from "elysia";

export const formFieldRoutes = new Elysia({ prefix: "/fields" })
  .use(requireAuth)
  .get("/:formId", getAllFields, getAllFieldsDTO)
  .post("/:formId", createField, createFieldDTO);

