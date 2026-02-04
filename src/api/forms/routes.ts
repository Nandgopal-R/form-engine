import { Elysia } from "elysia";
import {
  createFormDTO,
  deleteFormDTO,
  getFormByIdDTO,
  updateFormDTO,
} from "../../types/forms";
import { requireAuth } from "../auth/requireAuth";
import {
  createForm,
  deleteForm,
  getAllForms,
  getFormById,
  updateForm,
} from "./controller";

export const formRoutes = new Elysia({ prefix: "/forms" })
  .use(requireAuth)
  .get("/", getAllForms)
  .post("/", createForm, createFormDTO)
  .get("/:id", getFormById, getFormByIdDTO)
  .put("/:id", updateForm, updateFormDTO)
  .delete("/:id", deleteForm, deleteFormDTO);
