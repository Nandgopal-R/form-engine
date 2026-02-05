import { Elysia } from "elysia";
import {
  createFormDTO,
  getFormByIdDTO,
  updateFormDTO,
} from "../../types/forms";
import { requireAuth } from "../auth/requireAuth";
import {
  createForm,
  deleteForm,
  getAllForms,
  getFormById,
  publishForm,
  updateForm,
} from "./controller";

export const formRoutes = new Elysia({ prefix: "/forms" })
  .use(requireAuth)
  .get("/", getAllForms)
  .post("/", createForm, createFormDTO)
  .get("/:formId", getFormById, getFormByIdDTO)
  .put("/:formId", updateForm, updateFormDTO)
  .delete("/:formId", deleteForm, getFormByIdDTO)
  .post("/publish/:formId", publishForm, getFormByIdDTO);
