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
  getPublicFormById,
  publishForm,
  unPublishForm,
  updateForm,
} from "./controller";

// Public routes (no auth required for respondents)
export const publicFormRoutes = new Elysia({ prefix: "/forms" }).get(
  "/public/:formId",
  getPublicFormById,
  getFormByIdDTO,
);

// Protected routes (require auth)
export const formRoutes = new Elysia({ prefix: "/forms" })
  .use(requireAuth)
  .get("/", getAllForms)
  .post("/", createForm, createFormDTO)
  .get("/:formId", getFormById, getFormByIdDTO)
  .put("/:formId", updateForm, updateFormDTO)
  .delete("/:formId", deleteForm, getFormByIdDTO)
  .post("/publish/:formId", publishForm, getFormByIdDTO)
  .post("/unpublish/:formId", unPublishForm, getFormByIdDTO);
