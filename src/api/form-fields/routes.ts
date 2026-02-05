import { Elysia } from "elysia";
import {
  createFieldDTO,
  deleteFieldDTO,
  getAllFieldsDTO,
  swapFieldsDTO,
  updateFieldDTO,
} from "../../types/form-fields";
import { requireAuth } from "../auth/requireAuth";
import {
  createField,
  deleteField,
  getAllFields,
  swapFields,
  updateField,
} from "./controller";

export const formFieldRoutes = new Elysia({ prefix: "/fields" })
  .use(requireAuth)
  .get("/:formId", getAllFields, getAllFieldsDTO)
  .post("/:formId", createField, createFieldDTO)
  .put("/:id", updateField, updateFieldDTO)
  .delete("/:id", deleteField, deleteFieldDTO)
  .post("/swap", swapFields, swapFieldsDTO);
