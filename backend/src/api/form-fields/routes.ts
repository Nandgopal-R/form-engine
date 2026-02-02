import { Elysia } from "elysia";
import {
  createFieldDTO,
  deleteFieldDTO,
  getAllFieldsDTO,
  updateFieldDTO,
} from "../../types/form-fields";
import { requireAuth } from "../auth/requireAuth";
import {
  createField,
  deleteField,
  getAllFields,
  updateField,
} from "./controller";

export const formFieldRoutes = new Elysia({ prefix: "/fields" })
  .use(requireAuth)
  .get("/:formId", getAllFields, getAllFieldsDTO)
  .post("/:formId", createField, createFieldDTO)
  .put("/:id", updateField, updateFieldDTO)
  .delete("/:id", deleteField, deleteFieldDTO);
