import { requireAuth } from "../auth/requireAuth";
import { getAllForms, createForm, getFormById, updateForm, deleteForm } from "./controller";
import { createFormDTO, getFormByIdDTO, updateFormDTO, deleteFormDTO } from "../../types/forms";
import { Elysia } from "elysia";

export const formRoutes = new Elysia({ prefix: "/forms" })
  .use(requireAuth)
  .get("/", getAllForms)
  .post("/", createForm, createFormDTO)
  .get("/:id", getFormById, getFormByIdDTO)
  .put("/:id", updateForm, updateFormDTO)
  .delete("/:id", deleteForm, deleteFormDTO);


